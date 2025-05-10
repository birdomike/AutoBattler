# AoE Ability Display Fix (0.6.3.23)

## Issue
When using AoE abilities like Aqualia's "Tidal Wave" or "Frost Chain" that target multiple enemies, the action indicator above the character incorrectly displays "Auto Attack" instead of the ability name. The battle log correctly shows the ability name, but the visual indicator is wrong.

## Root Cause Analysis
The issue was traced to a cascading event problem in how AoE abilities were processed:

1. The main action with the correct ability name was properly dispatched as a CHARACTER_ACTION event at the start of execution.
2. However, when processing AoE abilities with multiple targets, the BattleFlowController created individual single-target actions for each target.
3. These individual actions were then passed through the BattleBridge's patched `applyActionEffect` method, which dispatched additional CHARACTER_ACTION events for each target.
4. These secondary events didn't properly preserve the ability information, causing "Auto Attack" to be displayed.
5. The later events overrode the initial correct event, resulting in "Auto Attack" being shown above the character's head.

## Solution
The solution implemented multiple safeguards to prevent duplicate CHARACTER_ACTION events for AoE abilities:

1. Added explicit property copying when creating single-target actions from multi-target abilities in BattleFlowController and AbilityProcessor.
2. Added a special `_isAoeSubAction` flag to mark these single-target sub-actions.
3. Modified BattleBridge to skip dispatching CHARACTER_ACTION events for actions marked as sub-actions.
4. Added diagnostic logging to BattleEventManager to track event data flow.

## Code Changes

### 1. BattleFlowController.js
```javascript
// Before
const singleAction = {...action, target};

// After
const singleAction = {
    ...action, 
    target,
    // Explicitly copy these properties to ensure they propagate correctly for AoE abilities
    actionType: action.actionType || (action.useAbility ? 'ability' : 'autoAttack'),
    abilityName: action.useAbility && action.ability ? action.ability.name : 'Auto Attack',
    // Mark this as a sub-action from an AoE ability to prevent duplicate CHARACTER_ACTION events
    _isAoeSubAction: true
};
```

### 2. AbilityProcessor.js
Similar changes to ensure consistent handling across components:
```javascript
// Before
const singleAction = {...action, target};

// After
const singleAction = {
    ...action, 
    target,
    // Explicitly copy these properties to ensure they propagate correctly for AoE abilities
    actionType: action.actionType || (action.useAbility ? 'ability' : 'autoAttack'),
    abilityName: action.useAbility && action.ability ? action.ability.name : 'Auto Attack',
    // Mark this as a sub-action from an AoE ability to prevent duplicate CHARACTER_ACTION events
    _isAoeSubAction: true
};
```

### 3. BattleBridge.js
```javascript
// Before
if (action.actor && action.actionType) {
    // Dispatch CHARACTER_ACTION event...
}

// After
if (action.actor && action.actionType && !action._isAoeSubAction) {
    // Only dispatch CHARACTER_ACTION event if this isn't a sub-action from an AoE ability
    // Multi-target actions are already dispatched by BattleFlowController
    // Dispatch CHARACTER_ACTION event...
}
```

### 4. BattleEventManager.js
Added diagnostic logging to help debug the issue:
```javascript
// Diagnostic logging to debug AoE ability display bug
console.log(`[BattleEventManager.onCharacterAction] Received action data:`, {
    character: data.character?.name,
    actionType: data.action?.actionType,
    abilityName: data.action?.abilityName,
    isSubAction: data.action?._isAoeSubAction
});

// Additional logging for actionText determination
if (data.action && data.action.actionType === 'ability' && data.action.abilityName) {
    actionText = `${data.action.abilityName}`;
    console.log(`[BattleEventManager.onCharacterAction] Using ability name: ${data.action.abilityName}`);
} else {
    console.log(`[BattleEventManager.onCharacterAction] Using default: Auto Attack`);
}

// Log actual showActionText call
console.log(`[BattleEventManager.onCharacterAction] Calling showActionText with: ${actionText}`);
```

## Reasoning
The core problem involved a cascade of events where:
1. The first event correctly indicated the AoE ability name
2. Subsequent events from sub-actions overrode this with default values

The fix aimed to preserve ability information when splitting AoE actions into individual target actions, while preventing BattleBridge from sending duplicate CHARACTER_ACTION events that would override the initial correct event.

## Testing
Initial testing showed that the changes didn't fully resolve the issue. The battle log correctly shows the ability name (e.g., "Aqualia (ally) uses [Frost Chain] on 3 targets!"), but the action indicator above the character still shows "Auto Attack".

Additional observations:
- The character animates toward the middle enemy, suggesting there's still an issue with how AoE abilities are processed for animation purposes.

## Current Status
The changes provide a partial solution and add valuable diagnostics, but don't completely fix the issue. Further investigation is needed to determine if there are additional event dispatches or other mechanisms overriding the ability name display.

## Next Steps
1. Add more detailed diagnostics to track the flow of events and method calls.
2. Examine how animation logic interfaces with AoE abilities.
3. Verify how the ActionIndicator component receives and processes display text.
4. Consider if there are other components or methods that might be resetting the ability name.

## Lessons Learned
1. Complex event cascades can lead to override issues where later events neutralize earlier ones.
2. AoE abilities require special attention in both the logical and visual processing pipelines.
3. Comprehensive diagnostics across the entire flow are important for tracking hard-to-reproduce UI bugs.
