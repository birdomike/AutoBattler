# CHANGELOG_0.6.0.3: StatusEffectManager BattleUtilities Integration

## Context & Problem Analysis

During Phase 3 of the BattleManager refactoring (v0.5.31.0), several utility methods were extracted into a static `BattleUtilities` class:

- `getAllCharacters(playerTeam, enemyTeam)`
- `getCharacterByUniqueId(uniqueId, playerTeam, enemyTeam)`
- `shuffleArray(array)`
- `safeBattleStringify(obj, space)`

As part of that refactoring, these methods were completely removed from BattleManager, with the architectural decision to avoid creating facade methods. 

Following the fix in v0.6.0.2 for `ActionDecisionBehaviors.js`, another runtime error was encountered:

```
TypeError: this.battleManager.getCharacterByUniqueId is not a function
```

This occurred within the `StatusEffectManager` class, specifically in the `_processHealingEffect` and `_processDamageEffect` methods, which were still trying to call the now-removed method on the battleManager instance.

## Historical Context

The `getCharacterByUniqueId` method plays a crucial role in the StatusEffectManager due to the "Source ID Linking" pattern implemented in v0.5.27.2 (Hotfix 10). This pattern was introduced to resolve circular reference issues by storing character IDs rather than direct object references in status effects:

1. When a status effect is applied, the source character's `uniqueId` is stored (instead of the entire object reference)
2. When the effect is processed (e.g., for damage over time), `getCharacterByUniqueId` is used to resolve the full character object from the stored ID
3. This source character is then passed to methods like `applyDamage` or `applyHealing` for proper attribution

This is a critical architectural pattern for preventing circular references while maintaining source attribution for effects.

## Solution Approach

The solution needed to align with both:
1. The Phase 3 refactoring decision to use BattleUtilities directly
2. The Source ID Linking pattern established in v0.5.27.2

The approach taken was:

1. **Update Source Resolution Logic**: Modify both the `_processDamageEffect` and `_processHealingEffect` methods to use `BattleUtilities.getCharacterByUniqueId()` with the appropriate team parameters.

2. **Improve Source ID Extraction**: Consolidate the source ID extraction logic to more efficiently handle all possible source reference formats.

3. **Add Robust Fallbacks**: Include clear fallbacks and error logging for when BattleUtilities isn't available.

4. **Fix Parameter Handling**: Correct parameter handling in the `applyHealing` call to properly identify status effects.

## Implementation Details

### 1. Damage Effect Processing

The source resolution logic in `_processDamageEffect` was updated from:

```javascript
// Resolve the source character from sourceId
let sourceCharacter = null;
if (effect.sourceId) { // New property
    sourceCharacter = this.battleManager.getCharacterByUniqueId(effect.sourceId);
} else if (typeof effect.source === 'string' && effect.source !== 'unknown') { // Backward compatibility for old string name
    // For damage effects, we don't default to character itself
} else if (effect.source && typeof effect.source === 'object' && effect.source.uniqueId) { // If somehow an object still sneaks in
    sourceCharacter = this.battleManager.getCharacterByUniqueId(effect.source.uniqueId);
}
```

To:

```javascript
// Resolve the source character from sourceId
// UPDATED in v0.6.0.3: Use BattleUtilities.getCharacterByUniqueId instead of battleManager.getCharacterByUniqueId
// This aligns with Phase 3 refactoring where utility methods were moved out of BattleManager
let sourceCharacter = null;
const sourceIdToFind = effect.sourceId || (effect.source && typeof effect.source === 'object' ? effect.source.uniqueId : null);

if (sourceIdToFind) {
    if (window.BattleUtilities) {
        sourceCharacter = BattleUtilities.getCharacterByUniqueId(
            sourceIdToFind,
            this.battleManager.playerTeam, // Pass playerTeam
            this.battleManager.enemyTeam  // Pass enemyTeam
        );
    } else {
        console.warn("[StatusEffectManager] BattleUtilities not available for getCharacterByUniqueId lookup.");
        sourceCharacter = null;
    }
}

// Legacy handling for string name sources (not implemented - old approach not reliable)
```

### 2. Healing Effect Processing

Similarly, the source resolution logic in `_processHealingEffect` was updated to use the new approach, and the call to `applyHealing` was fixed to include the correct parameter order and types:

```javascript
// HOTFIX (0.5.27.2_Hotfix8): Fix parameter order - character being healed must be first
this.battleManager.applyHealing(
    character,       // target (character being healed)
    healing,         // amount
    finalSourceForApplyHealing, // source (resolved from sourceId or fallback to self)
    null,              // ability (null for status effects)
    definition.name || 'Regeneration'   // healType (use definition.name if available)
);
```

## Benefits of this Approach

1. **Architectural Alignment**: Maintains the Phase 3 refactoring decision to use BattleUtilities directly.

2. **Better Source Resolution**: More robust handling of sourceId extraction with consolidated logic.

3. **Defensive Programming**: Proper error handling when BattleUtilities isn't available.

4. **Complete Parameters**: Ensures all required parameters are passed to applyHealing/applyDamage with appropriate types.

5. **Clear Documentation**: Adds comments explaining the relationship to Phase 3 refactoring.

## Testing Steps

1. Run the game and enter battle mode.
2. Test status effects that deal damage over time (e.g., Burn, Poison).
3. Test healing effects that trigger over time (e.g., Regeneration).
4. Verify proper source attribution in the battle log.
5. Check for any error messages related to `getCharacterByUniqueId`.

## Lessons Learned

1. **Dependency Identification**: When refactoring shared utility methods, comprehensive dependency analysis should include examining all components that might use those methods, not just direct callers within the same file.

2. **Cross-Component Impact**: This issue reinforces the need to consider how architectural patterns (like Source ID Linking) rely on utility methods across component boundaries.

3. **Legacy Support**: Using window-level availability checks and helpful warning messages makes refactoring more resilient, allowing the system to degrade gracefully if components are missing.

## Future Considerations

1. **Further StatusEffectManager Decoupling**: Consider refactoring StatusEffectManager to reduce its direct dependency on BattleManager by accepting more specific interfaces or dependencies.

2. **Comprehensive Code Search**: Implement a more thorough search process for utility method usage across all components before finalizing future refactorings.

3. **Source Resolution Enhancement**: Consider a centralized source resolution utility that consistently handles all source reference formats throughout the codebase.