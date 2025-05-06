# CHANGELOG_0.5.27.2_Hotfix10_CircularReferenceFix

## Overview
This hotfix addresses a critical issue with circular references in status effect sources that was causing JSON serialization errors and affecting passive ability processing. The primary issue was that storing complete source character objects within status effect instances created circular references that could not be serialized, and these circular references were causing errors during battle processing.

## Problem Description

### Primary Issue: Circular References in Status Effects
When a character (e.g., Sylvanna) applied a status effect (e.g., Regeneration) to herself, we created a circular reference chain:
1. Sylvanna has a `statusEffects` array
2. This array contains a Regeneration effect object
3. That effect object's `source` property pointed back to Sylvanna

This circular structure caused errors when attempting to use `JSON.stringify()` in `BattleManager.generateTurnActions()`:
```
TypeError: Converting circular structure to JSON
--> starting at object with constructor 'Object'
| property 'statusEffects' -> object with constructor 'Array'
| index 1 -> object with constructor 'Object'
--- property 'source' closes the circle
```

### Secondary Issue: PassiveAbilityManager Errors
The circular references also affected passive ability processing. When trying to process the `onHealed` passive for Sylvanna after her regeneration triggered, PassiveAbilityManager was unable to properly access the character's properties due to referential issues or object corruption.

This manifested as the error:
```
[PassiveAbilityManager] Invalid character: missing name property
```

## Solution: Source ID Linking

The solution implemented creates a "Source ID Linking" pattern:

1. **Store IDs Instead of Objects**: Instead of storing direct object references that can create circular structures, we store string identifiers (uniqueIds) that can be used to look up the actual objects when needed.

2. **Resolve Objects When Needed**: Components that need to work with the actual character objects can resolve them using the stored IDs.

3. **Maintain Backward Compatibility**: We handle both new format (sourceId) and legacy format (source as string name or object) to ensure no existing effects break.

## Implementation Details

### 1. Added `getCharacterByUniqueId` Method to BattleManager

```javascript
/**
 * Get a character by its uniqueId from any team
 * @param {string} uniqueId - The uniqueId of the character to find
 * @returns {Object|null} - The character object or null if not found
 */
getCharacterByUniqueId(uniqueId) {
    if (!uniqueId) return null;
    
    // Check player team
    let foundChar = this.playerTeam.find(char => char && char.uniqueId === uniqueId);
    if (foundChar) return foundChar;
    
    // Check enemy team
    foundChar = this.enemyTeam.find(char => char && char.uniqueId === uniqueId);
    
    // Add a log if a character is not found for a given ID, can be helpful for debugging
    if (!foundChar) {
        console.warn(`[BattleManager.getCharacterByUniqueId] Character with uniqueId '${uniqueId}' not found.`);
    }
    
    return foundChar || null;
}
```

This method efficiently searches both teams for a character with the specified uniqueId.

### 2. Modified StatusEffectManager.addStatusEffect to Store sourceId

Changed from:
```javascript
const newEffect = {
    id: effectId,
    duration: duration,
    source: source, // Direct object reference - caused circular references
    stacks: definition.stackable ? stacks : 1
};
```

To:
```javascript
const newEffect = {
    id: effectId,
    duration: duration,
    sourceId: source ? source.uniqueId : null, // ID reference - breaks circular chain
    stacks: definition.stackable ? stacks : 1
};
```

This change ensures we store only a serializable identifier rather than a potentially circular object reference.

### 3. Updated StatusEffectManager._processHealingEffect

Modified to resolve source characters from sourceId:

```javascript
// Resolve the source character from sourceId
let sourceCharacter = null;
if (effect.sourceId) { // New property
    sourceCharacter = this.battleManager.getCharacterByUniqueId(effect.sourceId);
} else if (typeof effect.source === 'string' && effect.source !== 'unknown') { // Backward compatibility
    // Attempt to find by name (less reliable than uniqueId)
    console.warn(`Attempting to find source by old string name: '${effect.source}'`);
} else if (effect.source && typeof effect.source === 'object' && effect.source.uniqueId) { // Object reference
    console.warn(`effect.source was unexpectedly an object. Using its uniqueId`);
    sourceCharacter = this.battleManager.getCharacterByUniqueId(effect.source.uniqueId);
}

// Use resolved character or fall back to target character for self-effects
const finalSourceForApplyHealing = sourceCharacter || character;
```

### 4. Updated StatusEffectManager._processDamageEffect

Applied a similar pattern to damage effect processing to ensure consistent source resolution.

## Benefits of this Approach

1. **Eliminates Circular References**: By storing only IDs instead of full objects, we break the circular chain that was causing serialization errors.

2. **Memory Efficiency**: Reduces duplication of large object references in memory.

3. **Serialization Friendly**: All effect objects can now be cleanly serialized without special handling.

4. **Backward Compatibility**: Handles both new (sourceId) and legacy (source as string or object) formats for smooth transition.

5. **Improved Error Resilience**: More explicit error handling and fallbacks when sources can't be resolved.

## Testing

This fix was tested with battles involving characters that have both healing effects (like Sylvanna's regeneration) and damage-over-time effects. The test confirmed:

1. No circular reference errors during JSON serialization
2. Proper resolution of source characters during effect processing
3. Correct attribution of healing and damage in the battle log
4. Proper triggering of passive abilities like "onHealed"

## Implementation Note

This implementation is part of a broader architectural pattern where direct object references between components are replaced with ID references when there's risk of circular structures. This pattern is particularly important when objects may reference their containers (as status effects reference their owning characters) or when serialization is needed.

In the future, we might consider extending this pattern to other areas of the codebase where complex object relationships exist.