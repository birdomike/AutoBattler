# CHANGELOG 0.6.3.29 - Scaling Factor Debugging Implementation

## Issue Description

Despite adding a fix for abilities with effect-specific scaling factors in version 0.6.3.28, there appears to be a discrepancy between the logged scaling factor and the actual calculation result. Specifically, for Aqualia's "Frost Chain" ability, the battle log shows "+73 from Intellect" damage contribution, which implies a 0.5 scaling factor is being used rather than the intended 0.4 scaling factor (which would result in approximately "+58 from Intellect").

We need to trace exactly how the scaleFactor is flowing through the damage calculation process to identify where the issue might be occurring.

## Debugging Approach

Strategic debug logging has been added at key points in the `DamageCalculator.js` file to trace the scaling factor from assignment through calculation to final display:

1. **Assignment Verification**: Logging immediately after the scaleFactor is set from effect, ability, or default source.
2. **Pre-Calculation Check**: Logging the inputs (attackerStat and scaleFactor) right before the statScaling calculation occurs.
3. **Calculation Verification**: Logging the actual result of the statScaling calculation and its rounded value.
4. **Scaling Text Verification**: Logging the final values used to generate the scaling text in the battle log.

All debugging logs use a consistent `[DEBUG-SCALING]` prefix for easy filtering in the console.

## Implementation Details

### 1. Verifying scaleFactor Assignment

Added console logging to confirm the scaleFactor value immediately after it's assigned:

```javascript
// Check effect for scale factor first (higher priority)
if (effect && effect.scaleFactor !== undefined) {
    console.log(`[DamageCalculator] Using effect-specific scaleFactor: ${effect.scaleFactor} (from effect)`);
    scaleFactor = effect.scaleFactor;
    // TEMPORARY DEBUG: Verify scaleFactor was correctly set after assignment
    console.log(`[DEBUG-SCALING] After effect assignment, scaleFactor = ${scaleFactor}`);
}
```

Similar logging was added for ability-level and default scaleFactor values.

### 2. Pre-Calculation Verification

Added logging right before the stat scaling calculation to verify the inputs:

```javascript
// TEMPORARY DEBUG: Log values right before calculation to verify inputs
console.log(`[DEBUG-SCALING] PRE-CALCULATION - attackerStat: ${attackerStat}, scaleFactor: ${scaleFactor}, ability: ${ability?.name}, character: ${attacker?.name}`);

// Apply stat scaling to base damage
const statScaling = attackerStat * scaleFactor;
```

### 3. Calculation Result Verification

Added logging right after the calculation to confirm the actual result:

```javascript
// Apply stat scaling to base damage
const statScaling = attackerStat * scaleFactor;

// TEMPORARY DEBUG: Log the actual calculation result
console.log(`[DEBUG-SCALING] CALCULATION RESULT - statScaling: ${statScaling}, rounded: ${Math.round(statScaling)}`);
```

### 4. Scaling Text Verification

Added logging when generating the final text that appears in the battle log:

```javascript
// TEMPORARY DEBUG: Verify the final scaling text values
console.log(`[DEBUG-SCALING] SCALING TEXT - using roundedScaling: ${roundedScaling} for ${scalingStatName} with ability: ${ability?.name}`);

scalingText = `(+${roundedScaling} from ${scalingStatName})`;
```

## Expected Debug Output Pattern

For Aqualia's "Frost Chain" ability with Intellect 146, we should see the following pattern:

1. `[DEBUG-SCALING] After effect assignment, scaleFactor = 0.4`
2. `[DEBUG-SCALING] PRE-CALCULATION - attackerStat: 146, scaleFactor: 0.4, ability: Frost Chain, character: Aqualia`
3. `[DEBUG-SCALING] CALCULATION RESULT - statScaling: 58.4, rounded: 58`
4. `[DEBUG-SCALING] SCALING TEXT - using roundedScaling: 58 for Intellect with ability: Frost Chain`

If we see 0.4 in steps 1-2 but then observe inconsistent values in steps 3-4, we'll know exactly where the issue is occurring.

## Testing Instructions

1. Start a battle with Aqualia in the player team
2. Wait for Aqualia to use Frost Chain
3. Observe the console log for the `[DEBUG-SCALING]` prefix messages
4. Compare the values to identify any inconsistencies in the calculation flow

## Removal Plan

This debugging code is clearly marked as temporary throughout the codebase. Once the issue is identified and fixed, all `[DEBUG-SCALING]` logging statements should be removed in a future update to keep the codebase clean.

## Lessons Learned

When debugging subtle calculation issues, having a complete trace of values through the entire process is invaluable. This approach allows us to:

1. Verify that initial assignments are working correctly
2. Confirm that values persist properly between methods
3. Check for any unintended side effects or overrides
4. Validate that final outputs match what we expect based on inputs

By adding a clear prefix to all debug messages, we make it easier to filter and analyze the specific information we need among other console output.