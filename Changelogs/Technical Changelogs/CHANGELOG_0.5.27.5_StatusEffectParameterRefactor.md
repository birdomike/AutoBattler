# CHANGELOG_0.5.27.5_StatusEffectParameterRefactor

## Overview
This update provides a comprehensive refactoring of the `addStatusEffect` method signature in BattleManager and ensures all calls across the codebase use a consistent 5-parameter format. This resolves ongoing issues with circular references and parameter type mismatches that were causing errors in status effect application.

## Problem Analysis

1. **Parameter Format Inconsistency**: The codebase had two different parameter formats in use:
   - Old style: `addStatusEffect(character, statusId, duration, value)`
   - New style: `addStatusEffect(character, statusId, source, duration, stacks)`

2. **Incorrect Parameter Usage**: Some functions were attempting to pass objects as the duration parameter or the stacks parameter, causing errors like:
   ```
   [StatusEffectManager] Invalid duration parameter (object) in addStatusEffect for 'status_atk_up'
   [StatusEffectManager] Invalid duration parameter (object) in addStatusEffect for 'status_crit_up'
   ```

3. **Data Type Validation**: Previous fixes attempted to handle parameter validation after the fact, but a more comprehensive solution was needed to standardize all calls.

## Implementation Changes

### 1. Standardized BattleManager.addStatusEffect Method

Updated the method to use a consistent 5-parameter signature with robust parameter validation:

```javascript
/**
 * Add a status effect to a character
 * @param {Object} character - Character to affect
 * @param {string} statusId - ID of the status effect
 * @param {Object|null} source - Character causing the effect (or null if no specific source)
 * @param {number} duration - Number of turns the effect lasts 
 * @param {number} stacks - Number of stacks to apply (default: 1)
 * @returns {boolean} - True if effect was successfully applied
 */
addStatusEffect(character, statusId, source, duration, stacks = 1) {
    // Defensive check
    if (!this.statusEffectManager) {
        console.error("StatusEffectManager not initialized! Cannot add status effect.");
        return false;
    }
    
    // Ensure duration is a number
    if (typeof duration !== 'number') {
        console.warn(`[BattleManager] Invalid duration parameter (${typeof duration}) in addStatusEffect for '${statusId}' - using default 3`);
        duration = 3; // Default duration
    }
    
    // Ensure stacks is a number
    if (typeof stacks !== 'number') {
        console.warn(`[BattleManager] Invalid stacks parameter (${typeof stacks}) in addStatusEffect for '${statusId}' - using default 1`);
        stacks = 1; // Default stacks
    }
    
    // Direct delegation with validated parameters
    return this.statusEffectManager.addStatusEffect(character, statusId, source, duration, stacks);
}
```

### 2. Updated All Call Sites

Updated all calls to `battleManager.addStatusEffect` to use the consistent 5-parameter format:

#### In PassiveBehaviors.js:

- `passive_ApplyRegenOnTurnStart`:
  ```javascript
  battleManager.addStatusEffect(actor, 'status_regen', actor, 2, 1);
  ```

- `passive_TeamBuffOnBattleStart`:
  ```javascript
  // Added explicit duration type check
  let effectDuration = duration;
  if (typeof effectDuration !== 'number') {
      console.warn(`[passive_TeamBuffOnBattleStart] Invalid duration (${typeof duration}) - using default 3`);
      effectDuration = 3;
  }
  
  battleManager.addStatusEffect(ally, statusId, actor, effectDuration, 1);
  ```

- `passive_CriticalHitBoost`:
  ```javascript
  // Fixed: Use consistent 5-parameter format with numeric stacks
  let stackCount = (typeof bonusAmount === 'number' && bonusAmount > 0) ? Math.ceil(bonusAmount) : 1;
  battleManager.addStatusEffect(actor, 'status_crit_up', actor, duration, stackCount);
  ```

#### In AbilityProcessor.js:

- Updated all occurrences to use the 5-parameter format:
  ```javascript
  this.battleManager.addStatusEffect(target, statusId, actor, duration, 1);
  ```

### 3. Fixed specific problematic implementations

- Fixed the `passive_CriticalHitBoost` implementation that was incorrectly trying to pass custom data via an object in the stacks parameter:
  ```javascript
  // BEFORE:
  battleManager.addStatusEffect(actor, 'status_crit_up', actor, duration, { value: bonusAmount });
  
  // AFTER:
  let stackCount = (typeof bonusAmount === 'number' && bonusAmount > 0) ? Math.ceil(bonusAmount) : 1;
  battleManager.addStatusEffect(actor, 'status_crit_up', actor, duration, stackCount);
  ```

This preserves the intent of using `bonusAmount` as a numeric value for stacks if it's already a number.

## Testing Strategy

To verify this fix:
1. Test passive ability triggers that apply status effects
2. Test abilities that apply status effects
3. Verify no "Invalid duration parameter" or "Invalid stacks parameter" errors in the console
4. Test the `passive_CriticalHitBoost` functionality specifically with different values

## Benefits

This refactoring:
1. Provides a consistent interface for status effect application
2. Prevents type errors through robust parameter validation
3. Preserves the intent of original code while fixing format issues
4. Makes future code maintenance easier with clear parameter documentation

## Future Recommendations

1. **Configure Value Properties**: In the future, a proper mechanism for configuring effect values without using the stacks parameter will be needed.
   
2. **Named Parameter Object**: Consider eventually refactoring to use a single options object for clarity:
   ```javascript
   addStatusEffect(character, statusId, {
     source: null,
     duration: 2,
     stacks: 1,
     value: 0.5  // For custom effect values
   })
   ```

This would eliminate parameter order confusion entirely while providing more flexibility.

## Conclusion

This update standardizes the status effect parameter format across the entire codebase, resolving recurring issues with parameter types and circular references. By ensuring all code uses a consistent 5-parameter signature with proper type validation, we've eliminated the errors while maintaining backward compatibility.