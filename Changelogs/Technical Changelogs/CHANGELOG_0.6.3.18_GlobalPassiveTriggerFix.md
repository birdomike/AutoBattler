# Technical Changelog 0.6.3.18: Global Passive Trigger Fix

## Issue Description

After implementing the fix for the parameter mismatch in `BattleFlowController.finishTurn()` (in v0.6.3.17), the error message "[PassiveAbilityManager] Invalid character parameter (null or undefined)" was still appearing. This error originated from `BattleFlowController.startNextTurn()` calling `processPassiveAbilities('onTurnStart', null, ...)` and similar calls with a `null` character parameter for other global triggers.

While the syntax of the call was corrected in v0.6.3.17, the `PassiveAbilityManager` itself needed to be updated to properly handle these global trigger events that need to apply to all eligible characters in both teams.

## Root Cause Analysis

The core issue was that the `PassiveAbilityManager.processPassiveAbilities()` method was designed to process passives for a single character, and would fail validation if passed `null` as the character parameter. However, global triggers like 'onTurnStart' and 'onTurnEnd' conceptually need to be processed for all non-defeated characters on both teams.

### The Code Problem:

In `PassiveAbilityManager.js`, the `processPassiveAbilities()` method always tried to validate the character parameter:

```javascript
// Enhanced character validation
if (!this.validateCharacter(character)) {
    return [];
}
```

But the `validateCharacter()` method would log an error for null values:

```javascript
// Basic null check
if (!character) {
    console.error("[PassiveAbilityManager] Invalid character parameter (null or undefined)");
    return false;
}
```

This caused the validation to fail and return an empty array when `null` was passed for a global trigger type, even though the intention was to apply the trigger to all eligible characters.

## Technical Solution

The solution was to implement a comprehensive global trigger handling system in `PassiveAbilityManager`:

1. **Identify Global Triggers**: Define which trigger types should be treated as global events.
2. **Add Global Trigger Handling Logic**: Modify `processPassiveAbilities()` to detect when a global trigger with a `null` character is being processed, and invoke a new method to handle this special case.
3. **Create a Global Processing Method**: Implement a new `processGlobalPassiveTrigger()` method that iterates through all non-defeated characters in both teams and processes the trigger for each.

### Implementation Details:

1. **New Global Trigger Detection**:
```javascript
// Define which triggers are global and should be processed for all characters
const globalTriggers = ['onTurnStart', 'onTurnEnd'];

// Check if this is a global trigger and character is null
if (character === null && globalTriggers.includes(trigger)) {
    // Handle global trigger by iterating through all characters
    return this.processGlobalPassiveTrigger(trigger, additionalData);
}
```

2. **New `processGlobalPassiveTrigger()` Method**:
```javascript
/**
 * Process passive abilities for all non-defeated characters for global triggers
 * @param {string} trigger - The trigger event (e.g., 'onTurnStart', 'onTurnEnd')
 * @param {Object} additionalData - Additional context data for the passive
 * @returns {Array} Array of executed passive results from all characters
 */
processGlobalPassiveTrigger(trigger, additionalData = {}) {
    // Combined results from all characters
    const allResults = [];
    
    // Validate battle manager and teams
    if (!this.battleManager) {
        console.error("[PassiveAbilityManager] Cannot process global trigger: BattleManager not available");
        return allResults;
    }
    
    // Process player team
    if (this.battleManager.playerTeam && Array.isArray(this.battleManager.playerTeam)) {
        // Process each non-defeated character in player team
        this.battleManager.playerTeam.forEach(character => {
            if (character && !character.isDead && character.currentHp > 0) {
                // Important: This call will include character validation
                const characterResults = this.processPassiveAbilities(trigger, character, additionalData);
                allResults.push(...characterResults);
            }
        });
    }
    
    // Process enemy team
    if (this.battleManager.enemyTeam && Array.isArray(this.battleManager.enemyTeam)) {
        // Process each non-defeated character in enemy team
        this.battleManager.enemyTeam.forEach(character => {
            if (character && !character.isDead && character.currentHp > 0) {
                // Important: This call will include character validation
                const characterResults = this.processPassiveAbilities(trigger, character, additionalData);
                allResults.push(...characterResults);
            }
        });
    }
    
    return allResults;
}
```

## Implementation Benefits

1. **No Architectural Changes Required**: The fix is contained entirely within `PassiveAbilityManager.js`, keeping the existing interfaces intact.
2. **Improved Error Handling**: The validation error no longer appears when processing legitimate global triggers.
3. **Proper Processing of Global Events**: All eligible characters now properly receive global trigger events.
4. **Consistent Results Structure**: The method returns the combined results from all characters in the same format as the original method.
5. **Maintainable Design**: The approach is extensible to additional global trigger types in the future if needed.

## Testing

Testing involved:
1. Starting a battle and confirming that the console error "[PassiveAbilityManager] Invalid character parameter" no longer appears.
2. Verifying that ability declarations and auto attacks are properly displayed in the Battle Log.
3. Ensuring that turn-based passive abilities trigger correctly for all eligible characters.

## Related Files

- `C:\Personal\AutoBattler\js\battle_logic\passives\PassiveAbilityManager.js` - Updated to handle global triggers
- `C:\Personal\AutoBattler\js\battle_logic\core\BattleFlowController.js` - Previous fix to call signature in v0.6.3.17

## Lessons Learned

1. **Design for Global Events**: When building systems that respond to events, consider that some events might have global scope requiring iteration over multiple entities.
2. **Parameter Null Values**: Consider what null parameter values mean in your API design - they can be legitimate values indicating special handling rather than just errors.
3. **Validation and Business Logic**: Distinguish between parameter validation errors and special cases that require different business logic paths.

## Future Considerations

1. **Additional Global Triggers**: The implementation allows for easy addition of more global trigger types by simply adding them to the `globalTriggers` array.
2. **Optimization Potential**: For games with many characters, the iteration approach used might be optimized further, such as by maintaining separate collections of characters with passive abilities for each trigger type.
3. **Formalize API**: A future enhancement could be to formally document that global triggers should be passed with a null character parameter as part of the API contract.