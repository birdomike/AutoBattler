# CHANGELOG 0.6.3.33 - AoE Stat Resolution Debugging

## Issue Description

After implementing the fix in ActionGenerator.js (v0.6.3.32) to correctly pass damage effects to DamageCalculator, a new issue was revealed: when processing individual targets of AoE abilities like Tidal Wave, the attacker's stats (e.g., Intellect) are resolving to 0 inside DamageCalculator.calculateDamage. This results in the battle log showing correct damage without any stat scaling contribution.

Specifically:

- When DamageCalculator.calculateDamage is called for individual AoE targets, the debug logs show:
  - `[DEBUG-SCALING] PRE-CALCULATION - attackerStat: 0, scaleFactor: 0.5, ability: Tidal Wave, character: Aqualia`
  - `[DEBUG-SCALING] CALCULATION RESULT - statScaling: 0, rounded: 0`

- Despite having the correct:
  - scaling factor (0.5 for Tidal Wave)
  - scaling stat name ("Intellect")
  - character name (Aqualia)

The stat value itself (attackerStat) is 0, which means no additional damage is being added from Aqualia's Intellect.

## Investigation Approach

To diagnose this issue, we've implemented comprehensive debugging in three key areas:

### 1. DamageCalculator.calculateDamage

Enhanced the stat resolution logic with detailed debugging to:
- Log the full attacker object structure
- Check for stat property existence with direct property access
- Try both exact case and case-insensitive matching
- Add detailed warnings when a stat resolves to 0

```javascript
// ADDED DEBUG: Examine attacker object to diagnose stat resolution issues
console.log(`[DamageCalculator DEBUG] Attacker object received:`, JSON.parse(JSON.stringify(attacker)));
console.log(`[DamageCalculator DEBUG] Attacker stats:`, attacker.stats);
console.log(`[DamageCalculator DEBUG] Looking for ${scalingStat} (exact case), and lowercase: ${scalingStat.toLowerCase()}`);

// Check if stat name case sensitivity is causing issues
if (attacker.stats) {
    console.log(`[DamageCalculator DEBUG] Direct property check - attacker.stats.intellect: ${attacker.stats.intellect}`);
    console.log(`[DamageCalculator DEBUG] Direct property check - attacker.stats.strength: ${attacker.stats.strength}`);
    console.log(`[DamageCalculator DEBUG] Direct property check - attacker.stats.spirit: ${attacker.stats.spirit}`);
}
```

### 2. AbilityProcessor.processEffect

Added detailed inspection of the actor object before passing it to DamageCalculator:

```javascript
// Add detailed logging of actor object to diagnose stats issue
console.log(`[AbilityProcessor.processEffect DEBUG] Actor object details:`);
if (actor.stats) {
    console.log(`  - Stats available: true`);
    console.log(`  - Actor.stats.intellect: ${actor.stats.intellect}`);
    console.log(`  - Actor.stats.strength: ${actor.stats.strength}`);
    console.log(`  - Actor.stats.spirit: ${actor.stats.spirit}`);
} else {
    console.log(`  - Stats available: false`);
}
// Check for any team or uniqueId issues
console.log(`  - Actor.team: ${actor.team}`);
console.log(`  - Actor.uniqueId: ${actor.uniqueId}`);
```

### 3. AbilityProcessor.applyActionEffect - AoE Target Processing

Added inspection of the singleAction objects created for individual AoE targets:

```javascript
// DEBUG: Check the actor object in singleAction to diagnose why stats might be missing
console.log(`[AbilityProcessor.applyActionEffect DEBUG] AoE singleAction created:`);
console.log(`  - Actor: ${singleAction.actor?.name}`);
console.log(`  - Actor has stats object: ${!!singleAction.actor?.stats}`);
if (singleAction.actor?.stats) {
    console.log(`  - Actor.stats.intellect: ${singleAction.actor.stats.intellect}`);
    console.log(`  - Actor.stats.strength: ${singleAction.actor.stats.strength}`);
}
console.log(`  - Ability: ${singleAction.ability?.name}`);
console.log(`  - Ability has effects: ${!!singleAction.ability?.effects}`);
```

## Key Improvements

1. **Case-Insensitive Stat Resolution**: 
   - Added case-insensitive matching for stat names
   - Now handles both "Intellect" and "intellect" consistently

2. **Enhanced Object Inspection**:
   - Added full attacker object debugging
   - Explicit property checks rather than just dynamic lookups
   - Chain of verification to pinpoint where data is lost

3. **Clear Warning Messages**:
   - Added explicit warnings when stat resolution fails
   - Shows both the stat name being looked for and the attacker name

4. **AoE Action Object Verification**:
   - Added detailed logging of singleAction objects for AoE targets
   - Verifies both actor stats and ability effects are properly preserved

## Expected Findings

This enhanced debugging should reveal:

1. Whether the actor object passed to DamageCalculator is missing its stats property
2. If there's a case sensitivity issue (e.g., looking for "Intellect" but property is "intellect")
3. If the actor object is somehow different between:
   - Initial action creation in ActionGenerator
   - Individual target processing in AbilityProcessor.applyActionEffect
   - Effect processing in AbilityProcessor.processEffect

Once we identify exactly where and why the attacker's stat information is lost, we can implement a targeted fix to ensure proper stat resolution for all AoE abilities.

## Next Steps After Diagnosis

Based on the debugging results, potential fixes may include:

1. Ensuring proper deep copying of the actor object and its stats when creating singleAction objects
2. Adding normalization of stat names to handle case sensitivity consistently
3. Modifying how actor objects are passed through the ability processing chain

This debugging release is focused on gathering precise diagnostic information to guide the implementation of a permanent fix in the next version.