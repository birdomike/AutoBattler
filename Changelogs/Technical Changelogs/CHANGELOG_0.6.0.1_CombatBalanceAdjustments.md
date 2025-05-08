# CHANGELOG 0.6.0.1 - Combat Balance Adjustments

## Overview

This update addresses balance issues identified during combat testing following the implementation of the Type System in version 0.6.0. Three abilities were adjusted to better balance combat dynamics and reduce situations where characters could be one-shot or deal excessive damage.

## Implementation Details

### 1. Zephyr's Wind Slash Adjustment

**Changes:**
- Removed bleeding effect
- Reduced base damage from 32 to 30

**Before:**
```json
{
  "id": "zephyr_wind_slash",
  "name": "Wind Slash",
  "damage": 32,
  "cooldown": 3,
  "isHealing": false,
  "damageType": "physical",
  "description": "Slashes with the speed of wind for high damage",
  "abilityType": "Active",
  "unlockLevel": 1,
  "targetType": "SingleEnemy",
  "targetingLogic": "targetLowestHpEnemy",
  "selectionWeight": 1.8,
  "effects": [
    {
      "type": "Damage",
      "value": 32,
      "scalingStat": "Strength",
      "scaleFactor": 0.5,
      "damageType": "air"
    },
    {
      "type": "ApplyStatus",
      "statusEffectId": "status_bleed",
      "chance": 0.4,
      "duration": 2
    }
  ]
}
```

**After:**
```json
{
  "id": "zephyr_wind_slash",
  "name": "Wind Slash",
  "damage": 30,
  "cooldown": 3,
  "isHealing": false,
  "damageType": "physical",
  "description": "Slashes with the speed of wind for high damage",
  "abilityType": "Active",
  "unlockLevel": 1,
  "targetType": "SingleEnemy",
  "targetingLogic": "targetLowestHpEnemy",
  "selectionWeight": 1.8,
  "effects": [
    {
      "type": "Damage",
      "value": 30,
      "scalingStat": "Strength",
      "scaleFactor": 0.5,
      "damageType": "air"
    }
  ]
}
```

**Rationale:**
- The bleeding effect didn't thematically align with an air/wind-based attack
- With 102 Strength and a 1.5x type advantage against Nature types, the ability was dealing excessive damage
- Analysis of battle logs showed this ability could one-shot Sylvanna (92 damage vs. 92 HP)
- The combined nerf (damage -2, removing DoT effect) reduces overall damage while preserving the ability's identity

### 2. Aqualia's Tidal Wave Adjustment

**Changes:**
- Reduced base damage from 30 to 25

**Before:**
```json
{
  "id": "aqualia_tidal_wave",
  "name": "Tidal Wave",
  "damage": 30,
  "cooldown": 3,
  "isHealing": false,
  "damageType": "spell",
  "description": "A powerful water attack that can hit multiple targets",
  "abilityType": "Active",
  "unlockLevel": 1,
  "targetType": "AllEnemies",
  "selectionWeight": 1.0,
  "effects": [
    {
      "type": "Damage",
      "value": 30,
      "scalingStat": "Intellect",
      "scaleFactor": 0.5,
      "damageType": "water"
    }
  ]
}
```

**After:**
```json
{
  "id": "aqualia_tidal_wave",
  "name": "Tidal Wave",
  "damage": 25,
  "cooldown": 3,
  "isHealing": false,
  "damageType": "spell",
  "description": "A powerful water attack that can hit multiple targets",
  "abilityType": "Active",
  "unlockLevel": 1,
  "targetType": "AllEnemies",
  "selectionWeight": 1.0,
  "effects": [
    {
      "type": "Damage",
      "value": 25,
      "scalingStat": "Intellect",
      "scaleFactor": 0.5,
      "damageType": "water"
    }
  ]
}
```

**Rationale:**
- AoE abilities typically have lower base damage compared to single-target abilities
- With 146 INT, the ability was scaling extremely effectively
- Type advantages against both Fire and Metal types made this ability significantly overpowered
- The 5-point reduction (-16.7%) better balances the ability while maintaining its identity as a strong AoE spell

### 3. Caste's Battle Fury Adjustment

**Changes:**
- Increased cooldown from 5 to 6 turns

**Before:**
```json
{
  "id": "caste_battle_fury",
  "name": "Battle Fury",
  "damage": 0,
  "cooldown": 5,
  "isHealing": false,
  "damageType": "utility",
  "description": "Enter a state of fury, increasing attack speed and damage",
  "abilityType": "Active",
  "unlockLevel": 5,
  "targetType": "Self",
  "selectionWeight": 1.2,
  "effects": [
    {
      "type": "ApplyStatus",
      "statusEffectId": "status_atk_up",
      "duration": 3
    },
    {
      "type": "ApplyStatus",
      "statusEffectId": "status_spd_up",
      "duration": 3
    },
    {
      "type": "ApplyStatus",
      "statusEffectId": "status_crit_up",
      "duration": 3
    }
  ]
}
```

**After:**
```json
{
  "id": "caste_battle_fury",
  "name": "Battle Fury",
  "damage": 0,
  "cooldown": 6,
  "isHealing": false,
  "damageType": "utility",
  "description": "Enter a state of fury, increasing attack speed and damage",
  "abilityType": "Active",
  "unlockLevel": 5,
  "targetType": "Self",
  "selectionWeight": 1.2,
  "effects": [
    {
      "type": "ApplyStatus",
      "statusEffectId": "status_atk_up",
      "duration": 3
    },
    {
      "type": "ApplyStatus",
      "statusEffectId": "status_spd_up",
      "duration": 3
    },
    {
      "type": "ApplyStatus",
      "statusEffectId": "status_crit_up",
      "duration": 3
    }
  ]
}
```

**Rationale:**
- The ability provides three powerful buffs simultaneously (Attack Up, Speed Up, Critical Boost)
- With a 5-turn cooldown and 3-turn duration, it had 60% uptime
- Increasing the cooldown to 6 turns reduces the uptime to 50%
- The adjustment preserves the ability's powerful effect but gives opponents a longer window between buffs

## Expected Impact

These balance changes should:

1. **Reduce One-Shot Scenarios**: Make it less likely for characters to be eliminated in a single hit, especially in type-advantage situations.

2. **Improve AoE/Single-Target Balance**: Better differentiate between the power levels of single-target and multi-target abilities.

3. **Enhance Type System Experience**: Allow the type advantage system to provide meaningful bonuses without creating frustratingly overwhelming damage.

4. **Maintain Character Identity**: Preserve the core identity and play style of each character while bringing outlier abilities in line with the overall power curve.

## Testing Recommendations

1. Test Zephyr vs. Nature characters to ensure the damage is still impactful but not overwhelming.
2. Verify Aqualia's effectiveness against multiple enemies, particularly Fire and Metal types.
3. Assess Caste's Battle Fury timing and effectiveness with the new cooldown.
4. Check that none of these changes have unintended consequences on other game systems.

## Future Considerations

While these targeted changes address the most immediate balance concerns, future balance passes might consider:

1. Examining other AoE abilities for consistent balancing principles
2. Reviewing buff durations across all abilities for consistency
3. Evaluating speed stat distribution across character roles
4. Considering the impact of type advantages on passive abilities