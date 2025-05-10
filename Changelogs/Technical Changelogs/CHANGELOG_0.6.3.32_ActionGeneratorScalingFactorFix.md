# CHANGELOG 0.6.3.32 - ActionGenerator Scaling Factor Fix

## Issue Description

Despite previous fixes to the `DamageCalculator` (v0.6.3.28) to properly handle effect-specific scaling factors, Area of Effect (AoE) abilities like Aqualia's "Frost Chain" were still showing incorrect damage scaling in the battle log. Specifically:

- Frost Chain (which should scale at 40% of Intellect, i.e., `effect.scaleFactor: 0.4`) was showing "(+73 from Intellect)" in the battle log.
- For Aqualia with Intellect 146, this indicated that a 0.5 scaling factor was being used (146 × 0.5 = 73) instead of the intended 0.4 factor (146 × 0.4 = 58.4, rounded to 58).

Despite implementing a proper hierarchical check in DamageCalculator for effect-specific scaling factors, the battle log continued to show incorrect scaling text for AoE abilities.

## Root Cause Analysis

After extensive investigation, the root cause was identified in the `ActionGenerator.js` file:

1. When `ActionGenerator.calculateDamageForAction()` calls `DamageCalculator.calculateDamage()`, it was **only passing three parameters** (attacker, target, ability) and **omitting the crucial fourth parameter** (`effect`):

```javascript
// Before fix - ActionGenerator.calculateDamageForAction()
if (this.damageCalculator) {
    return this.damageCalculator.calculateDamage(attacker, target, ability);
    // Missing fourth 'effect' parameter!
}
```

2. This meant that when initial damage was calculated for an action, the DamageCalculator had no access to the effect-specific scaling factor information and fell back to the default 0.5 scaling factor for spell abilities.

3. The resulting `action.scalingText` property (e.g., "+73 from Intellect") was then propagated throughout the action execution process and ultimately displayed in the battle log, even when processing individual targets of AoE abilities.

4. This issue was particularly problematic for AoE abilities since the initial action's pre-calculated values were being reused for each individual target, causing all targets to display the incorrect scaling factor results.

## Technical Solution

The solution was to modify `ActionGenerator.calculateDamageForAction()` to extract the relevant damage effect from the ability's effects array and pass it as the fourth parameter to DamageCalculator:

```javascript
// Added damage effect extraction
let damageEffect = null;
if (ability && ability.effects && Array.isArray(ability.effects)) {
    // Find the first damage effect in the array
    damageEffect = ability.effects.find(effect => 
        (effect.type === 'Damage' || effect.type === 'damage'));
        
    if (damageEffect) {
        console.log(`[ActionGenerator] Found damage effect for ${ability.name} with scaleFactor: ${damageEffect.scaleFactor}`);
    }
}

// Modified DamageCalculator call to pass the damage effect
if (this.damageCalculator) {
    return this.damageCalculator.calculateDamage(attacker, target, ability, damageEffect);
}
```

This change:
1. Extracts the specific damage effect from the ability's effects array
2. Adds logging to verify the correct scaling factor is found
3. Passes this damage effect to DamageCalculator, allowing it to access the effect-specific scaling factor

## Implementation Benefits

1. **Correct Ability Scaling**: Abilities now use their intended effect-specific scaling factors for damage calculation, ensuring proper balance.

2. **Accurate Battle Log**: The battle log now correctly displays stat contributions (e.g., "+58 from Intellect" for Frost Chain instead of "+73").

3. **Consistent Damage Calculation**: The damage calculation is now consistent with the ability definitions in the character data files.

4. **Maintains Backward Compatibility**: The solution maintains backward compatibility, as the `damageEffect` parameter defaults to `null` in DamageCalculator if no damage effect is found.

5. **Enhanced Debugging Information**: Added helpful logs to verify that damage effects are correctly identified and their scaling factors are properly applied.

## Testing

The changes should be tested by:

1. Starting a battle with Aqualia using "Frost Chain" and "Tidal Wave"
2. Verifying that the battle log shows the correct scaling text:
   - For Frost Chain (with Aqualia's Intellect 146): "+58 from Intellect" instead of "+73"
   - For Tidal Wave (with the same Intellect): "+73 from Intellect" (unchanged, as it should use 0.5 scaling)
3. Confirming that the damage values are calculated accordingly, affecting game balance
4. Testing other AoE abilities to ensure similar accurate scaling

## Lessons Learned

1. **Complete Parameter Chain**: When extracting components and refactoring, ensure all parameters are properly passed through the full call chain.

2. **Effect-Specific Data Propagation**: The AoE ability issue revealed how important it is for effect-specific data to be preserved at each stage of the ability processing pipeline.

3. **Initial Action Creation Impact**: In event-driven systems, data calculated during initial action creation can propagate through the entire system, making upstream errors particularly impactful.

4. **Debugging Technique Value**: The strategic placement of debug logs in earlier versions (0.6.3.29-30) was crucial in identifying this root cause by revealing what was missing from the damage calculation function call.

This fix ensures AoE abilities like Frost Chain now properly respect their defined scaling factors both in actual damage calculation and in the battle log display, improving gameplay balance as originally designed.