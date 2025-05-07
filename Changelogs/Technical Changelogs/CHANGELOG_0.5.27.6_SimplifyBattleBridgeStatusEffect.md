# CHANGELOG 0.5.27.6 - Simplify BattleBridge Status Effect Handling

## Overview

This update simplifies the status effect parameter handling in BattleBridge.js, removing complex parameter manipulation and focusing on the core responsibility of adapting old-style calls to the new format while preserving event dispatching.

## Problem Analysis

The previous implementation in BattleBridge.js for the `addStatusEffect` patch contained:

1. **Complex Parameter Transformation**: Logic to detect and transform old-style calls was convoluted, checking if the third parameter was a number AND the fourth parameter was undefined OR an object.

2. **Problematic Source Assignment**: When detecting old-style calls, it used the character itself as the source (`source = character`), which is incorrect for most status effects applied by one character to another.

3. **Redundant Type Checking**: The bridge performed its own validation of duration (`typeof duration !== 'number'`) and defaulted to 2, even though BattleManager now performs robust validation.

4. **Misleading Event Data**: When dispatching the `STATUS_EFFECT_APPLIED` event, it used `effectData?.duration || duration` which might give UI components an incorrect impression of the duration value actually passed to BattleManager.

## Implementation Changes

The new implementation:

1. **Simplified Detection Logic**: Now only checks if the third parameter is a number AND if arguments.length <= 4 to detect old-style calls.

2. **Better Default Source**: Uses `null` as the source for old-style calls instead of the character itself, which is more semantically appropriate for status effects with no specific source.

3. **Removed Redundant Type Checking**: Removed the duration validation code, relying on BattleManager's internal validation for numeric types.

4. **Clearer Parameter Naming**: Changed parameter names to reflect their dual purpose during transition (`sourceOrDuration`, `durationOrStacks`) for improved code readability.

5. **Consistent Event Data**: The `STATUS_EFFECT_APPLIED` event now receives the exact duration and stacks values that were passed to BattleManager, ensuring UI components see the correct intended values.

6. **Removed effectData Reference**: No longer looks up status effect details from internal cache for event data, focusing on what was actually passed to BattleManager.

7. **Preserved Definition Lookup**: Kept all the status definition fallback logic intact to ensure proper status effect metadata is included in the event.

## Code Comparison

### Before:

```javascript
// Check if we're getting the old parameter format (no source and duration as 3rd param)
if (typeof source === 'number' && (duration === undefined || typeof duration === 'object')) {
    console.warn(`BattleBridge: Detected old addStatusEffect parameter format for ${statusId}!`);
    console.warn(`BattleBridge: Correcting parameters - using ${source} as duration and character as source`);                        
    // Shift parameters and use character as source
    value = duration;
    duration = source;
    source = character; // Use self as source
}

// Ensure duration is a number to prevent circular references
if (typeof duration !== 'number') {
    console.error(`BattleBridge: Invalid duration (${typeof duration}) for status ${statusId} - using default 2`);
    duration = 2; // Default duration
}

// Dispatch event with complete status effect data
self.dispatchEvent(self.eventTypes.STATUS_EFFECT_APPLIED, {
    character: character,
    statusId: statusId,
    duration: effectData?.duration || duration,
    stacks: effectData?.stacks || 1,
    statusDefinition: statusDefinition
});
```

### After:

```javascript
let source, duration, stackValue;

// Detect old-style parameter format: (character, statusId, duration, value)
if (typeof sourceOrDuration === 'number' && arguments.length <= 4) {
    console.warn(`BattleBridge: Detected old-style addStatusEffect call for ${statusId}.`);
    console.warn(`BattleBridge: Converting to new format (null source, numeric duration).`);
    
    // Convert to new format with null source:
    source = null; // Use null as source instead of character
    duration = sourceOrDuration; // Use the number as duration
    stackValue = durationOrStacks || 1; // Use 4th param as stacks or default to 1
} else {
    // For new style, pass parameters directly
    source = sourceOrDuration;
    duration = durationOrStacks;
    stackValue = stacks;
}

// Dispatch event with the parameters as passed to BattleManager
self.dispatchEvent(self.eventTypes.STATUS_EFFECT_APPLIED, {
    character: character,
    statusId: statusId,
    duration: duration, // Use the duration that was passed to BattleManager
    stacks: stackValue, // Use the stacks value that was passed to BattleManager
    statusDefinition: statusDefinition
});
```

## Impact and Compatibility

- **API Compatibility**: Maintains compatibility with any legacy code that might use old-style calls, though impact analysis showed no such callers exist in the codebase.
- **UI Components**: StatusEffectContainer and StatusEffectTooltip components continue to receive the event data they expect, now with more accurate duration and stacks values.
- **Event Behavior**: The `STATUS_EFFECT_APPLIED` event is still only dispatched in Phaser UI mode, preserving conditional logic.
- **Error Prevention**: By letting BattleManager handle all parameter validation, we reduce duplication and potential inconsistencies in default values.

## Benefits

- **Simpler Code**: The revised implementation is more straightforward and easier to understand.
- **Clearer Roles**: BattleBridge focuses on its primary responsibility of bridging BattleManager to UI components.
- **Consistent Defaults**: No more inconsistency between BattleBridge's default (2) and BattleManager's default (3).
- **Improved Event Data**: Event data now accurately reflects what was passed to BattleManager.

## Future Considerations

In a future update, we might consider:

1. Completely phasing out support for old-style calls if we're confident no such code exists.
2. Revisiting the relationship between `effectData` (internal bridge cache) and the event data to ensure perfect synchronization with BattleManager's actual internal state.
3. Moving the status definition lookup logic to a separate helper method for better code organization.
