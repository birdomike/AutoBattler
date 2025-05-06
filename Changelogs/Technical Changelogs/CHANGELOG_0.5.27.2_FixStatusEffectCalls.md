# CHANGELOG_0.5.27.2_FixStatusEffectCalls

## Overview
This update addresses a systemic issue with parameter ordering in status effect calls across multiple passive ability implementations. When analyzing issues with the status effect source attribution, we discovered that many passive ability functions were incorrectly passing parameters to the `addStatusEffect` method, leading to inconsistent attribution of status effect sources in battle logs and passive triggers.

## Problem Description

The root cause was identified in multiple passive ability functions where calls to `addStatusEffect` had incorrect parameter order:

```javascript
// INCORRECT:
battleManager.addStatusEffect(character, effectId, duration);
```

When the correct parameter order should be:

```javascript
// CORRECT:
battleManager.addStatusEffect(character, effectId, source, duration, stacks);
```

This parameter misalignment meant that for many effects:
1. The source was being set to a number (the duration value) instead of a character object
2. The duration was being read from the stacks parameter or defaulting to 1
3. In the UI and logs, effects would show as coming from "undefined" or would use fallbacks

The issue was most noticeable with regeneration, but affected numerous other passive abilities including team buffs, intimidation effects, and critical hit modifiers.

## Implementation Changes

### 1. Enhanced Parameter Validation in StatusEffectManager.addStatusEffect

Added robust parameter validation to detect potential parameter misalignment:

```javascript
// Parameter validation and position checking
if (typeof source === 'number' && (duration === undefined || typeof duration === 'object')) {
    console.warn(`[StatusEffectManager] POTENTIAL PARAMETER MISALIGNMENT in addStatusEffect call for '${effectId}'`);
    console.warn(`[StatusEffectManager] The 'source' parameter appears to be a number (${source}), which might be duration mistakenly passed as source.`);
    console.warn(`[StatusEffectManager] Correct parameter order: addStatusEffect(character, effectId, source, duration, stacks)`);
}
```

This helps identify incorrect parameter usage at runtime and assists developers in fixing misaligned calls.

### 2. Fixed Parameter Order in All Passive Ability Functions

Corrected the parameter order in the following passive functions:

#### passive_ApplyRegenOnTurnStart
```javascript
// From:
battleManager.addStatusEffect(actor, 'status_regen', 2);

// To:
battleManager.addStatusEffect(actor, 'status_regen', actor, 2);
```

#### passive_TeamBuffOnBattleStart
```javascript
// From:
battleManager.addStatusEffect(ally, statusId, duration);

// To:
battleManager.addStatusEffect(ally, statusId, actor, duration);
```

#### passive_ProtectiveInstinct
```javascript
// From:
battleManager.addStatusEffect(allies[i], 'status_shield', 1);

// To:
battleManager.addStatusEffect(allies[i], 'status_shield', actor, 1);
```

#### passive_Intimidate
```javascript
// From:
battleManager.addStatusEffect(target, statusId, duration);

// To:
battleManager.addStatusEffect(target, statusId, actor, duration);
```

#### passive_CriticalHitBoost
```javascript
// From:
battleManager.addStatusEffect(actor, 'status_crit_up', duration, { value: bonusAmount });

// To:
battleManager.addStatusEffect(actor, 'status_crit_up', actor, duration, { value: bonusAmount });
```

#### passive_KillBuff
```javascript
// From:
battleManager.addStatusEffect(actor, 'status_atk_up', 2);

// To:
battleManager.addStatusEffect(actor, 'status_atk_up', actor, 2);
```

#### passive_LastStand
```javascript
// From:
battleManager.addStatusEffect(actor, 'status_def_up', 2);

// To:
battleManager.addStatusEffect(actor, 'status_def_up', actor, 2);
```

#### passive_StatusOnHit
```javascript
// From:
battleManager.addStatusEffect(target, statusId, duration);

// To:
battleManager.addStatusEffect(target, statusId, actor, duration);
```

#### passive_ApplyStatusOnHit
```javascript
// From:
battleManager.addStatusEffect(source, statusId, duration);

// To:
battleManager.addStatusEffect(source, statusId, actor, duration);
```

#### passive_OnKillEffect (buff case)
```javascript
// From:
battleManager.addStatusEffect(actor, statusId, duration);

// To:
battleManager.addStatusEffect(actor, statusId, actor, duration);
```

### 3. Enhanced Documentation

Added clear JSDoc comments to the StatusEffectManager.addStatusEffect method:

```javascript
/**
 * Add a status effect to a character
 * @param {Object} character - The character to apply the effect to
 * @param {string} effectId - The ID of the effect to apply
 * @param {Object|null} source - The character causing the effect (or null if no specific source)
 * @param {number} duration - How many turns the effect lasts
 * @param {number} stacks - Number of stacks to apply (for stackable effects)
 * @returns {boolean} - Whether the effect was successfully applied
 */
```

Added clear inline comments at each fix location for developer awareness.

## Benefits

1. **Consistent Attribution**: Effects now properly show who applied them in battle logs and UI
2. **Correct Passive Triggering**: The "onHealed" and other passive triggers now receive correct source information
3. **Improved Player Feedback**: Battle logs now correctly describe who applied what effects to whom
4. **Code Clarity**: Better documentation and validation prevent future parameter misalignment
5. **Self-Documenting Code**: The corrected parameter order now aligns with JSDoc comments

## Testing

This fix was tested with battles involving characters with various passive abilities, including:
- Regeneration effects (passive_ApplyRegenOnTurnStart)
- Team buffs (passive_TeamBuffOnBattleStart)
- Protective shields (passive_ProtectiveInstinct)
- Status effects (passive_StatusOnHit, passive_ApplyStatusOnHit)

The tests confirmed:
1. Proper source character attribution in battle logs
2. Correct triggering of passive abilities based on effect sources
3. Accurate battle statistics and history

## Future Recommendations

1. **Parameter Checking**: Consider using a more structured parameter object for complex methods to avoid ordering issues
2. **Status Effect Refactoring**: Long-term, consider refactoring the status effect system to use a builder pattern or fluent interface
3. **Source Object Handling**: Continue using source IDs rather than direct object references to prevent circular references
4. **Passive System Documentation**: Create a comprehensive guide for developers on how to implement passive abilities with proper parameter ordering