# Passive System Implementation (Pass 7)

## Overview

This document summarizes the implementation of the passive ability system for the AutoBattler game. The passive system allows characters to have abilities that automatically trigger at specific points in the battle flow without requiring manual activation.

## Implemented Features

### 1. Passive Ability Framework

- **Passive Ability Structure**: Added support for passive abilities in character data with the following properties:
  - `abilityType: "Passive"` - Designates an ability as passive
  - `passiveTrigger` - When the passive should activate (e.g., 'onTurnStart', 'onDamageTaken')
  - `passiveBehavior` - Reference to the behavior function that implements the passive
  - `passiveData` - Optional data specific to this passive ability

- **Passive Ability Identification**: Enhanced character preparation to identify passive abilities at battle start:
  ```javascript
  battleChar.passiveAbilities = [];
  battleChar.abilities.forEach(ability => {
      if (ability.abilityType === 'Passive') {
          battleChar.passiveAbilities.push(ability);
      }
  });
  ```

### 2. Passive Ability Trigger Points

Added passive ability trigger points at key moments in battle flow:

- **Turn-Based Triggers**:
  - `onTurnStart` - Beginning of each turn
  - `onTurnEnd` - End of each turn

- **Battle-Flow Triggers**:
  - `onBattleStart` - When battle begins
  - `onBattleEnd` - When battle concludes

- **Damage/Healing Triggers**:
  - `onDamageTaken` - When a character takes damage
  - `onDamageDealt` - When a character deals damage
  - `onHealed` - When a character receives healing
  - `onHealingDone` - When a character heals another

- **State Change Triggers**:
  - `onDefeat` - When a character is defeated
  - `onKill` - When a character defeats another
  - `onRevive` - When a character is revived from defeat

### 3. Passive Ability Processing

- **processPassiveAbilities Method**: Core method that processes passive abilities for a specific trigger:
  ```javascript
  processPassiveAbilities(trigger, character, additionalData = {})
  ```
  
- **Execution Logic**:
  - Checks if character has passive abilities matching the current trigger
  - Creates context object with all necessary information
  - Uses behavior system to execute passive ability function
  - Logs passive ability activation and effects

### 4. Damage/Healing Utility Methods

- **applyDamage**: Utility method to apply direct damage to a character:
  ```javascript
  applyDamage(target, amount, source, ability, damageType)
  ```
  
- **applyHealing**: Utility method to apply direct healing to a character:
  ```javascript
  applyHealing(target, amount, source, ability, healType)
  ```

- Both methods include passive ability processing and provide detailed return values.

### 5. Integration with Status Effect System

- Updated status effect processing to use the new damage/healing utilities
- Added passive triggers for status effect application and expiration

### 6. Example Implementations

- **Reflect Damage**: Passive ability that reflects a portion of damage back to an attacker
- **Team Buff**: Passive ability that grants buffs to all allies at the start of battle
- **Regeneration**: Passive ability that applies regeneration effect on turn start
- **Status Effect Application**: Applies status effects in response to being attacked

## Example Character

A sample character with passive abilities has been created in `examples/passive_character.json`:

```json
{
  "name": "Seraphina",
  "type": "light",
  "role": "Paladin",
  "abilities": [
    /* Active abilities omitted */
    {
      "name": "Light's Protection",
      "abilityType": "Passive",
      "passiveTrigger": "onBattleStart",
      "passiveBehavior": "passive_TeamBuffOnBattleStart",
      "description": "Grants all allies a protective shield at the start of battle"
    },
    {
      "name": "Divine Retribution",
      "abilityType": "Passive",
      "passiveTrigger": "onDamageTaken",
      "passiveBehavior": "passive_DamageReflectOnHit",
      "description": "Reflects a portion of damage taken back to the attacker"
    }
  ]
}
```

## Validation & Testing

The passive system can be tested by:

1. Creating characters with passive abilities
2. Observing battle logs for passive ability activations
3. Verifying that passive effects are properly applied
4. Testing edge cases (e.g., passive triggered on a defeated character)

## Future Enhancements

1. **Multi-Trigger Passives**: Support passives that can trigger on multiple events
2. **Conditional Triggers**: Add conditions to passive triggers (e.g., only when HP below 30%)
3. **Passive Cooldowns**: Allow passives to have cooldowns between activations
4. **Interactive Passives**: Passives that can be manually activated under certain conditions
5. **Passive UI Indicators**: Visual indicators for passive abilities during battle

## Implementation Notes

- The passive system is designed to be backward compatible with existing characters that don't have passive abilities.
- All passive processing includes proper error handling to prevent one failed passive from breaking the battle flow.
- The implementation follows the behavior delegation pattern established in earlier passes.
