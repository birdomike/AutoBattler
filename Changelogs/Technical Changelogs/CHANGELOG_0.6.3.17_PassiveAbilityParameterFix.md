# Technical Changelog 0.6.3.17: PassiveAbility Parameter Fix

## Issue Description

After fixing the path in index.html to load the correct BattleFlowController.js (in v0.6.3.16), a new runtime error emerged in the console:

```
PassiveAbilityManager.js:29 [PassiveAbilityManager] Invalid character parameter (null or undefined)
```

This error prevented ability declarations and auto attacks from displaying in the Battle Log.

## Root Cause Analysis

The issue was traced to an incorrect parameter order in BattleFlowController.js, specifically in the `finishTurn()` method.

### The Code Problem:

In BattleFlowController.js, the `finishTurn()` method was calling `processPassiveAbilities()` with the wrong parameter order:

```javascript
// INCORRECT - passing an object with controller reference as the character parameter
this.battleManager.processPassiveAbilities('onTurnEnd', { controller: this });
```

The PassiveAbilityManager expects a valid character object (or null) as the second parameter, and any additional data as the third parameter. 

The `validateCharacter()` method in PassiveAbilityManager checks if the character is null or has required properties, and logs an error when receiving an object that isn't a proper character.

### Technical Details:

The `processPassiveAbilities()` function in BattleManager (which delegates to PassiveAbilityManager) has the following signature:

```javascript
processPassiveAbilities(triggerType, character, additionalData)
```

- `triggerType`: String indicating when the passive should trigger (e.g., 'onTurnEnd')
- `character`: The character object that has the passive ability (or null for global events)
- `additionalData`: Additional context data for the passive ability

By passing `{ controller: this }` as the second parameter instead of the third, we were providing an invalid character object that would fail validation in PassiveAbilityManager.

## Fix Implementation

The fix was to correctly pass `null` as the character parameter and move the controller reference to the additionalData parameter position:

```javascript
// CORRECT - passing null as character parameter and controller as additionalData
this.battleManager.processPassiveAbilities('onTurnEnd', null, { controller: this });
```

This matches the pattern used elsewhere in the BattleFlowController, such as in `startNextTurn()`:

```javascript
this.battleManager.processPassiveAbilities('onTurnStart', null, { turnNumber: this.battleManager.currentTurn });
```

## Testing

Testing involved:
1. Making the change to BattleFlowController.js
2. Starting a battle and observing the console output
3. Verifying that the "[PassiveAbilityManager] Invalid character parameter" error no longer appears
4. Confirming that ability declarations and auto attacks now correctly display in the Battle Log

## Related Files

- `C:\Personal\AutoBattler\js\battle_logic\core\BattleFlowController.js` - Fixed the parameter order
- `C:\Personal\AutoBattler\js\battle_logic\passives\PassiveAbilityManager.js` - Contains the validation logic that was generating the error

## Lessons Learned

1. When working with multi-parameter function calls, always verify the correct parameter order, especially when some parameters are optional
2. Error messages from validation checks provide valuable clues about parameter mismatches
3. Similar patterns in other function calls within the same codebase can serve as a guide for proper usage

## Future Considerations

1. Additional parameter validation could be added to BattleManager to catch these issues before they reach PassiveAbilityManager
2. Consider using named parameters (objects) for functions with many parameters to avoid order-dependency
3. Apply similar fixes to any other locations that might have similar parameter order issues