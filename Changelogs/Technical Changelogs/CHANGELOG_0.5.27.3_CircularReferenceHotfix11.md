# CHANGELOG_0.5.27.3_CircularReferenceHotfix11

## Overview
This hotfix addresses a remaining issue with circular references in status effects that was causing JSON serialization errors. The error appeared despite our previous fix in v0.5.27.3_CircularReferenceHotfix, indicating that some passive abilities were still using incorrect parameter ordering. The specific issue was revealed in logs as:

```
[StatusEffectManager] Invalid duration parameter (object) in addStatusEffect for 'status_crit_up'
```

## Problem Analysis

1. **Root Cause**: The `passive_CriticalMomentum` function in PassiveBehaviors.js was using the old parameter order for `addStatusEffect`, which could lead to circular references.

2. **Complex Interaction**: The BattleBridge module has a patched version of `addStatusEffect` that wasn't updated to handle the new parameter ordering established in Hotfix 0.5.27.2_FixStatusEffectCalls.

3. **Parameter Confusion**: Multiple implementations had misaligned parameters:
   - Some code was using: `addStatusEffect(character, statusId, duration, value)`
   - Others were using: `addStatusEffect(character, statusId, source, duration, value)`

4. **Bridge Pass-Through**: Even though the StatusEffectManager was correctly validating parameters, the BattleBridge patch was using `apply(this, arguments)` which passed all parameters directly, potentially creating circular references.

## Implementation Changes

### 1. Fixed `passive_CriticalMomentum` Function
Updated the function to use the correct parameter ordering:

```javascript
// FROM:
battleManager.addStatusEffect(actor, 'status_crit_up', 2);

// TO:
// FIXED (v0.5.27.3_CircularReferenceHotfix): Added actor as source parameter
battleManager.addStatusEffect(actor, 'status_crit_up', actor, 2);
```

### 2. Enhanced BattleBridge's addStatusEffect Patch
Completely rewrote the patched method to:

1. Properly handle both parameter formats
2. Detect and correct misaligned parameters
3. Validate duration is always a number
4. Use `.call()` with explicit parameters instead of `apply(this, arguments)`

```javascript
// HOTFIX (v0.5.27.3_CircularReferenceHotfix): Parameter validation/correction
// Handle two common formats:
// 1. Old style: addStatusEffect(character, statusId, duration, value)
// 2. New style: addStatusEffect(character, statusId, source, duration, value)

// Check if we're getting the old parameter format (no source and duration as 3rd param)
if (typeof source === 'number' && (duration === undefined || typeof duration === 'object')) {
    console.warn(`BattleBridge: Detected old addStatusEffect parameter format for ${statusId}!`);
    console.warn(`BattleBridge: Correcting parameters - using ${source} as duration and character as source`);                        
    // Shift parameters and use character as source
    value = duration;
    duration = source;
    source = character; // Use self as source
}

// Ensure duration is a number to prevent circular references
if (typeof duration !== 'number') {
    console.error(`BattleBridge: Invalid duration (${typeof duration}) for status ${statusId} - using default 2`);
    duration = 2; // Default duration
}

// Call original with corrected parameters
const result = originalAddStatusEffect.call(this, character, statusId, source, duration, value);
```

## Test Approach

This fix addresses the root cause by:

1. Fixing the incorrect parameter usage in the specific function that triggered the error
2. Adding automatic parameter correction in the BattleBridge wrapper to handle misaligned parameters
3. Adding additional validation to ensure duration is always a number before passing to StatusEffectManager

The error occurs during critical hit effects, so testing should focus on:
1. Abilities that can cause critical hits
2. Characters with the `passive_CriticalMomentum` passive ability
3. Other status effects applied through BattleBridge

## Similar Issues Addressed Previously

This issue was partially addressed in three previous hotfixes:

1. **v0.5.27.2_FixStatusEffectCalls**: Fixed parameter order in many passive ability functions but missed `passive_CriticalMomentum`

2. **v0.5.27.2_Hotfix10_CircularReferenceFix**: Fixed circular references with the `source` property by using `sourceId` instead of direct references 

3. **v0.5.27.3_CircularReferenceHotfix**: Added validation for the `duration` parameter in StatusEffectManager and safe debug logging

This hotfix completes the fix by addressing the remaining function that used the incorrect parameter order and by making the BattleBridge more resilient to parameter misalignment.

## Additional Recommendations

1. **Complete Audit**: Consider a complete audit of all remaining passive functions and other occurrences of `addStatusEffect` to ensure they use the new parameter format

2. **Function Signature Documentation**: Update documentation to clearly specify the correct parameter order in all relevant places

3. **Consider Named Parameters**: For future code, consider using an options object pattern for functions with many parameters to avoid ordering issues

This kind of parameter ordering issue is common in evolving codebases, especially when function signatures change. The approach of adding validation and auto-correction is a robust way to handle these transitional issues while maintaining backward compatibility.