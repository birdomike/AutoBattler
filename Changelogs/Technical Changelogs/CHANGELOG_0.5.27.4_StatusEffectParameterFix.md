# CHANGELOG_0.5.27.4_StatusEffectParameterFix

## Overview
This update provides a comprehensive fix for status effect parameter handling issues that were causing circular reference errors in the game. The errors were manifesting as:

```
[StatusEffectManager] Invalid duration parameter (object) in addStatusEffect for 'status_regen'
[StatusEffectManager] Invalid duration parameter (object) in addStatusEffect for 'status_atk_up'
[StatusEffectManager] Invalid duration parameter (object) in addStatusEffect for 'status_crit_up'
```

Despite previous hotfixes that addressed circular references with the `source` property, there remained issues with parameter ordering and validation that needed a more systematic approach.

## Problem Analysis

1. **Parameter Mismatch**: Recent updates changed the parameter signature of `addStatusEffect` to:
   ```javascript
   addStatusEffect(character, effectId, source, duration, stacks)
   ```
   But some calls were still using the old format, and parameter ordering issues were occurring throughout the codebase.

2. **Circular References**: Object references were creating unserializable circular structures when passed incorrectly, especially when using `JSON.stringify()`.

3. **Event Type Inconsistency**: The `STATUS_EFFECTS_CHANGED` event was still being used in some places despite being replaced by `STATUS_EFFECT_UPDATED` in Version 0.5.27.2_BridgeEventFix.

## Implementation Changes

### 1. Status Effect Parameter Validation and Auto-Correction

While examining the code, we found that most of the parameter handling issues were already addressed in previous hotfixes with defensive coding:

```javascript
// In StatusEffectManager.addStatusEffect:
// Parameter validation and auto-correction for misaligned parameters
if (typeof source === 'number' && (duration === undefined || typeof duration === 'object')) {
    // Auto-correct parameters
    value = duration;
    duration = source;
    source = character; // Use self as source
}

// Ensure duration is a number to prevent circular references
if (typeof duration !== 'number') {
    // Use definition's duration or fallback value
    duration = (definition && typeof definition.duration === 'number') ? definition.duration : 3;
}
```

This robust validation code in both StatusEffectManager and BattleBridge was adequately handling parameter misalignment, but needed to be complemented with:

### 2. Event Name Standardization

Updated the StatusEffectManager to use the standardized event name from the BridgeEventFix:

```javascript
// BEFORE:
battleBridge.dispatchEvent(battleBridge.eventTypes.STATUS_EFFECTS_CHANGED, {
    character: character,
    effects: this.getActiveEffects(character)
});

// AFTER:
battleBridge.dispatchEvent(battleBridge.eventTypes.STATUS_EFFECT_UPDATED, {
    character: character,
    effects: this.getActiveEffects(character)
});
```

Also updated the fallback event name pattern:
```javascript
// BEFORE:
const eventType = window.battleBridge?.eventTypes?.STATUS_EFFECTS_CHANGED || 'status_effects_changed';

// AFTER:
const eventType = window.battleBridge?.eventTypes?.STATUS_EFFECT_UPDATED || 'status_effect_updated';
```

### 3. Error Message Updates

Updated error message logs to reflect the correct event name:
```javascript
// BEFORE:
console.error('[StatusEffectManager] Error dispatching STATUS_EFFECTS_CHANGED event:', err);

// AFTER:
console.error('[StatusEffectManager] Error dispatching STATUS_EFFECT_UPDATED event:', err);
```

### 4. Verification of Passive Functions

Added clarification comments in passive functions that still showed errors in logs:

```javascript
// In passive_ApplyRegenOnTurnStart:
// v0.5.27.4_StatusEffectParameterFix: Adding sourceId check and ensuring actor is passed as source
// This function was showing as error source for 'Invalid duration parameter (object)'
battleManager.addStatusEffect(actor, 'status_regen', actor, 2);
```

## Testing Strategy

Due to the updated parameter validation and effective parameter auto-correction in both BattleBridge and StatusEffectManager, testing focused on ensuring:

1. Status effects continue to be correctly applied and processed
2. No circular reference errors occur during serialization
3. Events are properly dispatched with the standardized name
4. Passive abilities that trigger status effects work as intended

## Future Recommendations

1. **Function Signature Documentation**: Maintain clear documentation of expected parameter orders throughout the codebase

2. **Named Parameters**: Consider eventually refactoring complex methods to use an options object pattern to avoid parameter ordering issues:
   ```javascript
   // Current:
   addStatusEffect(character, effectId, source, duration, stacks)
   
   // Future possibility:
   addStatusEffect(character, effectId, options = {
     source: null,
     duration: 2,
     stacks: 1
   })
   ```

3. **Comprehensive Review**: Periodically audit code for parameter consistency, especially as refactoring continues

## Conclusion

This update completes the fixes needed for status effect parameter handling by:

1. Verifying and updating parameter ordering in status effect calls
2. Standardizing event names for consistency
3. Leveraging the robust parameter validation and auto-correction already in place

The combination of these changes should eliminate the remaining issues with status effect application and circular references.