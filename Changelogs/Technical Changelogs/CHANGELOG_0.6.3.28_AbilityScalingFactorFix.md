# CHANGELOG 0.6.3.28 - Ability Scaling Factor Fix

## Issue Description

The battle log showed AoE abilities like Frost Chain dealing more damage than intended: "Aqualia (ally) takes 91 damage (+73 from Intellect)!" 

The damage scaling from Intellect was higher than it should be according to the ability's design. Specifically, the battle log showed "+73 from Intellect" when it should have shown approximately "+58 from Intellect" for Aqualia using Frost Chain.

## Root Cause Analysis

The issue was traced to a missing check in `DamageCalculator.calculateDamage()` for effect-specific scaling factors:

1. **Nested Scaling Factors**: Abilities like Frost Chain define their scaling factor (0.4) within the `effects` array rather than directly on the ability object.

2. **Missing Priority Check**: The damage calculator only checked for `ability.scaleFactor` at the top level of the ability object, not within the effects:

```javascript
// Original Code
// Set scaling factor based on ability type
if (damageType === "spell") {
    scalingStat = "intellect";
    scaleFactor = 0.5; // 50% of intellect adds to damage
}

// Only checked ability-level scaling, missed effect-level scaling
if (ability.scaleFactor !== undefined) {
    scaleFactor = ability.scaleFactor;
}
```

3. **Parameter Ignored**: The function already had an `effect` parameter which was passed correctly from `AbilityProcessor.processEffect()`, but this parameter's scaling data wasn't being checked.

## Technical Solution

The solution was to implement a hierarchical check in `DamageCalculator.calculateDamage()` that prioritizes effect-level scaling factors before falling back to ability-level and finally to defaults:

```javascript
// Set default scaling factor based on ability type
if (damageType === "spell") {
    scalingStat = "intellect";
    scaleFactor = 0.5; // 50% of intellect adds to damage
}

// NEW CODE: Check effect for scale factor first (higher priority)
if (effect && effect.scaleFactor !== undefined) {
    console.log(`[DamageCalculator] Using effect-specific scaleFactor: ${effect.scaleFactor} (from effect)`);
    scaleFactor = effect.scaleFactor;
}
// Use ability's specific scale factor if defined and no effect override
else if (ability.scaleFactor !== undefined) {
    console.log(`[DamageCalculator] Using ability-level scaleFactor: ${ability.scaleFactor} (from ability)`);
    scaleFactor = ability.scaleFactor;
} else {
    console.log(`[DamageCalculator] Using default scaleFactor: ${scaleFactor}`);
}
```

The same hierarchical approach was applied to the `scalingStat` property to ensure consistent handling of all scaling properties.

## Implementation Benefits

1. **Correct Scaling**: Abilities now correctly use their effect-specific scaling factors, ensuring damage is in line with design intentions.

2. **Proper Hierarchical Precedence**: Established a clear hierarchy (effect > ability > default) for all scaling properties.

3. **Diagnostic Visibility**: Added detailed logging to show where scaling values come from, making future debugging easier.

4. **Consistency**: The approach maintains the existing ability data structure while making the calculator properly check all levels.

5. **Better Balance**: Frost Chain now correctly uses 0.4 scaling for Intellect, resulting in approximately 25% less damage from this stat.

## Testing

The changes should be tested by:

1. Starting a battle with Aqualia using Frost Chain
2. Monitoring the console for the correct scaling factor logs
3. Verifying that the battle log shows a reduced contribution from Intellect (around "+58 from Intellect" instead of "+73 from Intellect")
4. Testing other abilities with effect-specific scaling factors to ensure they are also correctly applied

## Lessons Learned

1. **Data Hierarchy Consideration**: When a system uses nested data structures, all levels of the hierarchy should be properly checked.

2. **Parameter Utilization**: Function parameters should be fully utilized for their intended purpose; the `effect` parameter was being passed but not fully leveraged.

3. **Diagnostic Logging**: Adding detailed logging during development helps verify the system is using the correct values.

4. **Change Verification**: Watch for unexpected high/low numbers in battle logs as potential indicators of calculation issues.

This fix ensures all abilities properly follow their defined scaling factors, resulting in more balanced gameplay as originally designed.