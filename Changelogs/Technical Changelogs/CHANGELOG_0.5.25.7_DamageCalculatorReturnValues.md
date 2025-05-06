# CHANGELOG 0.5.25.7: Fix DamageCalculator Return Values

## Problem Description

The DamageCalculator component was returning only the raw damage number, requiring BattleManager to wrap it in a compatibility adapter with placeholder values for metadata like scaling text and stat information:

```javascript
// TEMPORARY ADAPTER WRAPPER:
// The DamageCalculator currently returns only the damage number.
// We wrap it here to maintain the object structure expected by callers.
return {
    damage: damage,
    scalingText: '', // Placeholder - Adapter doesn't have scaling info
    scalingStat: 0,  // Placeholder
    scalingStatName: '', // Placeholder
    // Determine a basic damageType fallback for the wrapper
    damageType: ability ? (ability.damageType || 'physical') : 'physical'
};
```

This was inefficient because:
1. The DamageCalculator already calculated all of this metadata internally
2. Important information like stat scaling text was being lost
3. Battle log messages lacked the stat scaling information (e.g., "+50 from Strength")
4. Critical hit information wasn't being properly propagated

## Solution

### 1. Enhanced DamageCalculator Return Value

Modified `DamageCalculator.calculateDamage()` to return a complete object with all relevant metadata:

```javascript
// Return a comprehensive object with all metadata
return {
    damage: totalDamage,
    scalingText: scalingText,
    scalingStat: attackerStat,
    scalingStatName: scalingStatName,
    damageType: damageType,
    isCritical: isCritical,
    typeMultiplier: typeMultiplier
};
```

Key improvements:
- Added proper `scalingText` with formatted string (e.g., "(+42 from Strength)")
- Included `isCritical` flag for UI effects and battle log
- Exposed `typeMultiplier` for better debugging
- Standardized the return structure for all paths (including error cases)

### 2. Simplified BattleManager Delegation

Removed the temporary adapter wrapper from `BattleManager.calculateDamage()` and replaced it with direct delegation:

```javascript
// Direct delegation to DamageCalculator - no adapter wrapper needed now that it returns the full object
return this.damageCalculator.calculateDamage(attacker, target, ability, effect);
```

Benefits:
- Cleaner code with less duplication
- Complete metadata passed through from DamageCalculator
- Preserved defensive handling with a fallback object for error cases
- Battle log receives proper scaling and critical hit information

## Technical Implementation

### DamageCalculator Changes:
1. Updated the JSDoc return type from `{number}` to `{Object}`
2. Added proper default return objects for error cases
3. Formatted scaling text outside of battle log specific code
4. Structured the code to build a complete metadata object
5. Enhanced error handling with complete return objects

### BattleManager Changes:
1. Updated the JSDoc to remove obsolete note about adapter wrapper
2. Simplified the implementation to directly return DamageCalculator's result
3. Improved the fallback object to include all properties (isCritical, typeMultiplier)
4. Made defensive check more readable with an early return pattern

## Testing Methods

1. **Pre-Implementation Testing**
   - Observed battle log messages before changes
   - Noted damage calculations showed basic numbers without stat scaling text
   - Verified critical hits showed [CRITICAL] tag in some cases

2. **Verification Testing**
   - Started battles with both physical attackers (Strength scaling) and spell casters (Intellect scaling)
   - Confirmed battle log shows proper scaling info (e.g., "+50 from Strength")
   - Verified critical hits still display [CRITICAL] tag
   - Checked that ability damage calculations remain consistent with pre-change values
   - Validated that type advantage calculations continue to work correctly

## Future Work & Considerations

1. **Consider standardizing all damage event data**: For event dispatch in `DamageCalculator.applyDamage()`, consider including the full damage metadata object when dispatching CHARACTER_DAMAGED events.

2. **Unit tests**: Future work could include creating unit tests for damage calculations to ensure correct stat scaling percentages, critical hit chances, and type effectiveness.

3. **Advanced scaling tooltips**: The enhanced return values enable more detailed tooltips showing exact stat contribution, which could be implemented in a future UI update.
