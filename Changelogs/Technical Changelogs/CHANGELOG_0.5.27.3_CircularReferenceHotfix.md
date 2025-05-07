# CHANGELOG_0.5.27.3_CircularReferenceHotfix

## Overview
This hotfix addresses a critical issue with circular references in status effect objects. The bug was causing a JSON.stringify error when attempting to log character objects to the console during action generation. The error pointed to a circular reference in the status effect's `duration` property.

## Problem Description
The error was manifesting as:
```
TypeError: Converting circular structure to JSON
--> starting at object with constructor 'Object'
| property 'statusEffects' -> object with constructor 'Array'
| index 0 -> object with constructor 'Object'
--- property 'duration' closes the circle
```

This appeared to be related to parameter ordering issues in status effect creation. While Hotfix10 had previously fixed similar issues with the `source` property, there remained issues with the `duration` parameter.

## Implementation Changes

### 1. Enhanced Parameter Validation and Auto-correction in StatusEffectManager

The `addStatusEffect` method now includes:

* **Type validation** for duration parameter:
```javascript
// HOTFIX: Ensure duration is always a number to prevent circular references
if (typeof duration !== 'number') {
    console.error(`[StatusEffectManager] Invalid duration parameter (${typeof duration}) in addStatusEffect for '${effectId}'`);
    // Get definition to use its default duration
    const definition = this.definitionLoader.getDefinition(effectId);
    // Use definition's duration, or a fallback value of 3
    duration = (definition && typeof definition.duration === 'number') ? definition.duration : 3;
    console.log(`[StatusEffectManager] Using default duration: ${duration}`);
}
```

* **Parameter auto-correction** for misaligned parameters:
```javascript
// HOTFIX: Attempt to fix parameter order if it appears to be misaligned
// If source is a number and duration is undefined or an object, assume source was meant to be duration
if (duration === undefined) {
    duration = source;
    source = null;
    console.warn(`[StatusEffectManager] Auto-corrected parameters: using ${duration} as duration and null as source`);
}
```

### 2. Safe Debug Logging in BattleManager

* **Replaced direct JSON.stringify calls** with safe property logging:
```javascript
console.log(`[DEBUG 0.5.27.2] Character for ActionGenerator (Player: ${character.name || 'NO_NAME'}):`,
    `HP: ${character.currentHp}/${character.stats?.hp},`,
    `Status Effects: ${character.statusEffects?.length || 0},`,
    `Abilities: ${character.abilities?.length || 0}`);
```

### 3. Added Safe Stringification Utility

* **Added a new utility method** to BattleManager for safely stringifying objects:

```javascript
/**
 * Safely stringify an object, handling circular references
 * @param {Object} obj - The object to stringify
 * @param {number} [space] - Number of spaces for indentation (optional)
 * @returns {string} The stringified object with circular references replaced
 */
safeBattleStringify(obj, space = null) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular Reference]';
            }
            seen.add(value);
        }
        return value;
    }, space);
}
```

This method can be used for future debugging when the full object structure needs to be examined.

## Benefits of These Changes

1. **Prevents Circular References**: Ensures `duration` is always a number, breaking potential circular reference chains.

2. **Auto-corrects Parameters**: If parameter order appears misaligned, the system attempts to fix it automatically.

3. **Safer Debugging**: Replaced direct `JSON.stringify` with property-specific logging to avoid serialization errors.

4. **Future-Proofing**: Added a utility method for safely stringifying objects with potential circular references.

## Related Issues

This hotfix is closely related to:
* CHANGELOG_0.5.27.2_Hotfix10_CircularReferenceFix - Fixed similar issue with the `source` property
* CHANGELOG_0.5.27.2_FixStatusEffectCalls - Fixed parameter ordering in numerous passive ability implementations

## Testing

Key test cases for this fix include:
1. Characters with multiple status effects
2. Characters with regeneration and other healing effects
3. Passive abilities that apply status effects
4. Multi-turn battles with status effect stacking

The fix should prevent JSON serialization errors while maintaining all functionality of the status effect system.
