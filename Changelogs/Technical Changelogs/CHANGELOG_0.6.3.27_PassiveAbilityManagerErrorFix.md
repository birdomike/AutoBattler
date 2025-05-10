# CHANGELOG 0.6.3.27 - PassiveAbilityManager Error Fix

## Issue Description

An error was occurring at the end of battles when trying to process passive abilities:

```
PassiveAbilityManager.js:35 [PassiveAbilityManager] Invalid character: missing name property
```

The error appeared after the battle victory/defeat was declared, when the system attempted to process the 'onBattleEnd' passive trigger. The error occurred in the `validateCharacter()` method of PassiveAbilityManager, which was receiving an object that did not have a `name` property.

## Root Cause Analysis

The issue had two related causes:

1. **Incorrect Parameter Order**: In `BattleFlowController.endBattle()`, the code was incorrectly passing an object `{ result }` as the character parameter instead of the third (additionalData) parameter:

   ```javascript
   // Incorrect code:
   this.battleManager.processPassiveAbilities('onBattleEnd', { result });
   ```

   When this object reached `PassiveAbilityManager.validateCharacter()`, it failed validation because `{ result: 'victory' }` does not have a `name` property.

2. **Missing Global Trigger**: The 'onBattleEnd' trigger was not included in the `globalTriggers` array in PassiveAbilityManager, which meant the manager wouldn't know to use the `processGlobalPassiveTrigger()` method for this trigger type.

   ```javascript
   // Global triggers list was missing 'onBattleEnd':
   const globalTriggers = ['onTurnStart', 'onTurnEnd'];
   ```

This contrasted with the correct pattern used for other global events, such as turn start and end:

```javascript
// Correct pattern for global triggers:
this.battleManager.processPassiveAbilities('onTurnStart', null, { turnNumber: this.battleManager.currentTurn });
this.battleManager.processPassiveAbilities('onTurnEnd', null, { controller: this });
```

## Technical Solution

The solution involved two changes:

1. **Fixed Parameter Order in BattleFlowController.endBattle()**:
   ```javascript
   // Changed to:
   this.battleManager.processPassiveAbilities('onBattleEnd', null, { result });
   ```
   
   This passes `null` as the character parameter (indicating it's a global trigger) and moves the battle result to the additionalData parameter where it belongs.

2. **Added 'onBattleEnd' to the globalTriggers Array in PassiveAbilityManager**:
   ```javascript
   // Added 'onBattleEnd' to the array:
   const globalTriggers = ['onTurnStart', 'onTurnEnd', 'onBattleEnd'];
   ```
   
   This ensures that when the trigger type is 'onBattleEnd' and the character is null, the manager will use the `processGlobalPassiveTrigger()` method to process the event for all eligible characters.

## Implementation Benefits

1. **Consistent Pattern**: This solution follows the same pattern as other global triggers like 'onTurnStart' and 'onTurnEnd'
2. **Properly Structured Data**: The battle result is now passed in the appropriate additionalData parameter
3. **Global Trigger Support**: The 'onBattleEnd' trigger will now be properly processed for all characters
4. **Error Prevention**: The PassiveAbilityManager no longer tries to validate a non-character object

## Testing

Testing should verify:
1. Battles complete successfully without the error in the console
2. Passive abilities that trigger on battle end are properly executed
3. The battle outcome (victory/defeat/draw) is correctly displayed

## Lessons Learned

1. **Consistent Parameter Order**: Maintain consistent parameter order in method calls to avoid validation errors
2. **Global Trigger Registration**: When adding new global trigger types, ensure they are registered in the appropriate arrays
3. **Pattern Matching**: Follow established patterns for similar operations (like the pattern used in turn-based events)

This fix ensures proper end-of-battle passive ability processing, maintaining consistency across all global trigger events in the game.