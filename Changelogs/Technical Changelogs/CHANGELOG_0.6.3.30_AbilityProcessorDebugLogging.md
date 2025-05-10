# CHANGELOG 0.6.3.30 - AbilityProcessor Debug Logging

## Issue Investigation

Following our attempts to trace the scaling factor issue with abilities like Frost Chain and Tidal Wave, we've identified a potential problem in how effect-specific scaling factors are handled during AoE ability processing. The original debugging in DamageCalculator.js didn't appear for all targets of AoE abilities, suggesting that the effect object with its specific scaleFactor might not be correctly preserved when processing each target.

## Debugging Approach

We've added targeted debug logging in the `AbilityProcessor.processEffect()` method, specifically in the damage case, to capture what data is being passed to the DamageCalculator for each target of an AoE ability. This will help us trace exactly what's happening with the effect object and its properties when multi-target abilities are processed.

## Implementation Details

The following debug logging was added to `AbilityProcessor.js` within the `processEffect` method's 'Damage' case, right before the call to calculateDamage:

```javascript
// ***** START NEW TEMPORARY LOGGING *****
console.log(`[AbilityProcessor.processEffect DEBUG] Calling calculateDamage for:
        Actor: ${actor.name} (${actor.id})
        Target: ${target.name} (${target.id})
        Ability: ${ability.name}
        Effect Type: ${effect.type}
        Effect Value (Base Damage): ${effect.value}
        Effect scaleFactor: ${effect.scaleFactor}
        Effect scalingStat: ${effect.scalingStat}`);
// ***** END NEW TEMPORARY LOGGING *****
```

This logging captures:
- The actor and target names and IDs
- The ability name
- The effect details including type, base value (damage), and most importantly, the scaling factor and scaling stat

## Expected Insights

This debug logging will help determine:

1. **Whether the effect object is complete**: Does each target of an AoE ability receive a complete effect object with all properties intact?
2. **Scaling factor consistency**: Is the correct scaling factor (0.4 for Frost Chain, 0.5 for Tidal Wave) being passed to the damage calculator for each target?
3. **Object reference integrity**: Are there any inconsistencies between how the original action is processed and how the individual target actions are processed?

## Testing Instructions

1. Start a battle with Aqualia in either player or enemy team
2. Wait for Aqualia to use either Frost Chain or Tidal Wave
3. Observe the console logs with the `[AbilityProcessor.processEffect DEBUG]` prefix
4. Check that each target of the AoE ability shows the expected scaling factor in the logs

## Removal Plan

This logging is clearly marked as temporary with START/END comments. It should be removed once the scaling factor issue is identified and fixed.

## Next Steps

After reviewing the debug logs, we'll potentially need to fix how multi-target actions are processed to ensure that effect-specific properties like scaleFactor are properly preserved when splitting an AoE ability into individual target actions.
