# How Action Indicators Work in AutoBattler: A Technical Guide

*Current as of Version 0.6.3.25 (May 10, 2025)*

Action Indicators are the floating text elements that appear above characters during battle, showing what ability or attack they're currently performing. This guide explains the full technical flow from battle logic to visual display.

## 1. Core Components

The Action Indicator system involves several interconnected components:

- **ActionIndicator.js**: The UI component that displays and animates the floating text
- **CharacterSprite.js**: Manages character visualization and interfaces with ActionIndicator
- **BattleEventManager.js**: Handles battle events and triggers action text display
- **BattleBridge.js**: Facilitates communication between battle logic and UI
- **BattleFlowController.js**: Controls battle flow and dispatches action events

## 2. Component Architecture

### ActionIndicator Component

The `ActionIndicator` class is a UI component responsible for displaying text above characters. It:
- Creates and manages a Phaser Text object
- Animates text appearance and disappearance
- Supports different text styles based on action type
- Positions text relative to the character

This component follows a flexible design:
- It can be attached to a parent container (CharacterSprite)
- It handles both scene and container-relative positioning
- It uses tweens for smooth animations

### CharacterSprite Integration

Each `CharacterSprite` instance creates its own `ActionIndicator` in its constructor:

```javascript
this.actionIndicator = new ActionIndicator(scene, this);
```

CharacterSprite exposes a `showActionText()` method that handles action text categorization:
```javascript
showActionText(actionText) {
    // Determine action type and call appropriate ActionIndicator method
    if (actionText.toLowerCase().includes('auto attack')) {
        this.actionIndicator.showAutoAttack();
    } else if (actionText.toLowerCase().includes('ability:')) {
        const abilityName = actionText.split('Ability:')[1]?.trim() || actionText;
        this.actionIndicator.showAbility(abilityName);
    } else {
        // Display as ability if no specific pattern is matched
        this.actionIndicator.showAbility(actionText);
    }
}
```

## 3. Event Flow

The complete flow from battle logic to visual display follows this sequence:

1. **Action Generation**: `BattleFlowController` determines what action a character will take

2. **Event Dispatch**: When executing an action, `BattleFlowController.executeNextAction()` dispatches a `CHARACTER_ACTION` event via `BattleBridge`:

```javascript
window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.CHARACTER_ACTION, {
    character: action.actor,
    action: {
        type: 'ability',
        actionType: 'ability',
        name: action.ability.name,
        abilityName: action.ability.name,
        target: action.target
    }
});
```

3. **Event Handling**: `BattleEventManager` listens for this event and processes it in `onCharacterAction()`:

```javascript
onCharacterAction(data) {
    // Get action text based on action type
    let actionText = "Auto Attack"; // Default
    
    if (data.action && data.action.actionType === 'ability' && data.action.abilityName) {
        actionText = `${data.action.abilityName}`;
    }
    
    // Find character sprite and show action text
    const characterSprite = this.getCharacterSprite(data.character);
    characterSprite.showActionText(actionText);
}
```

4. **Text Display**: `CharacterSprite.showActionText()` delegates to the appropriate `ActionIndicator` method

5. **Animation**: `ActionIndicator` displays and animates the text:

```javascript
showAction(actionText, options = {}) {
    // Update text and color
    this.text.setText(actionText);
    this.text.setColor(config.color);
    
    // Create animation timeline with fade in, hold, and fade out phases
    this.timeline = this.scene.tweens.createTimeline();
    // ...
    this.timeline.play();
}
```

## 4. Multi-Target (AoE) Ability Handling

Special handling exists for Area of Effect (AoE) abilities:

1. When an AoE ability is used, `BattleFlowController` dispatches a single `CHARACTER_ACTION` event for the ability

2. The controller then divides the action into sub-actions for each target:
```javascript
const singleAction = {
    ...action, 
    target,
    actionType: action.actionType || (action.useAbility ? 'ability' : 'autoAttack'),
    abilityName: action.useAbility && action.ability ? action.ability.name : 'Auto Attack',
    _isAoeSubAction: true
};
```

3. Each sub-action is marked with `_isAoeSubAction: true` to prevent duplicate event dispatching

4. `BattleBridge` checks this flag to avoid sending additional `CHARACTER_ACTION` events:
```javascript
if (action.actor && action.actionType && !action._isAoeSubAction) {
    // Only dispatch CHARACTER_ACTION event if this isn't a sub-action
    // ...dispatch logic...
}
```

5. During character attack animations, the system previously incorrectly set action text to "Auto Attack" regardless of the actual ability being used:
```javascript
// REMOVED in v0.6.3.25: No longer force 'Auto Attack' text for all animations
// this.showActionText('Auto Attack');
```
This line was removed to fix the AoE ability display bug, ensuring that the original, correct ability name remained visible.

## 5. Styling and Visual Feedback

The Action Indicator provides different styles based on action type:

- **Auto Attacks**: Light grey color via `showAutoAttack()`
- **Abilities**: Light green color via `showAbility()`
- **Status Effects**: Gold color via `showStatusEffect()`

Text appearance is also enhanced with:
- Text shadow for better readability
- Rise animation (text floats upward)
- Fade-in and fade-out transitions
- Proper positioning above character

## 6. Positioning Logic

Text positioning is handled in two ways:

1. **Container-Based**: When added to CharacterSprite's container, position is relative to container:
```javascript
// Position is relative to container
this.text.setPosition(0, -60);
```

2. **Scene-Based**: Fallback positioning directly in scene coordinates:
```javascript
// Position relative to scene coordinates
const xPos = this.parent.x || 0;
const yPos = (this.parent.y || 0) - 60;
this.text.setPosition(xPos, yPos);
```

A major positioning bug was fixed in v0.6.3.12 where the text was appearing at the top-left of the screen instead of above characters. The fix ensured that the text's position was properly calculated relative to its parent container.

## 7. Integration with Battle System

The Action Indicator system integrates with the broader battle system:

- **Battle Flow**: Indicators appear as characters take their turns
- **Team Display**: Works with both player and enemy teams
- **Battle Log**: Synchronized with battle log messages
- **Event System**: Uses the event system for loose coupling between modules

## 8. Technical Challenges and Solutions

Several technical challenges were addressed:

1. **Positioning Issues**: Fixed by ensuring proper positioning in container space
2. **AoE Ability Text**: Fixed by preventing hardcoded "Auto Attack" text during animations
3. **Event Ordering**: Managed by controlling when events are dispatched
4. **Object Lifecycle**: Proper cleanup in the `destroy()` method

## 9. Future Enhancement Opportunities

Potential improvements to the system could include:

1. **Contextual Action Text**: Showing different text based on action context
2. **Enhanced Animation**: More sophisticated animations for different ability types
3. **Visual Effects**: Adding particle effects or sprites to complement the text
4. **Conditional Information**: Showing additional info like damage estimates or hit chance

## Conclusion

The Action Indicator system in AutoBattler is a well-designed component that visualizes character actions through floating text. It follows a clean event-based architecture that separates battle logic from visual representation, making it both maintainable and extendable.