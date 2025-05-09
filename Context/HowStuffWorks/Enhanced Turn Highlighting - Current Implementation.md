# Enhanced Turn Highlighting - Current Implementation

## Overview

The Enhanced Turn Highlighting system visually indicates which character is currently taking their action during battle by displaying a team-colored floor marker beneath that character. This creates a dynamic visual cue that helps players track the flow of actions within each turn.

## Core Files

1. **TurnIndicator.js** (`C:\Personal\AutoBattler\js\phaser\components\battle\TurnIndicator.js`)
   - Dedicated component that explicitly handles the turn indicator visuals
   - Creates and animates the flattened ellipse floor marker
   - Controls size, color, animation, and visibility of the indicator
   - Centralizes all turn highlighting visual logic in one component

2. **TeamContainer.js** (`C:\Personal\AutoBattler\js\phaser\components\battle\TeamContainer.js`)
   - Contains `showTurnIndicator()` and `clearTurnIndicators()` methods
   - Manages which character within the team should display the indicator
   - Calls the appropriate character's highlight/unhighlight methods

3. **CharacterSprite.js** (`C:\Personal\AutoBattler\js\phaser\components\battle\CharacterSprite.js`)
   - Contains stub `highlight()` and `unhighlight()` methods
   - These methods now delegate to TurnIndicator.js rather than implementing the visuals directly
   - Provides backward compatibility with the previous implementation

4. **BattleScene.js** (`C:\Personal\AutoBattler\js\phaser\scenes\BattleScene.js`)
   - Contains the handler method `updateActiveCharacterVisuals(characterData)`
   - Listens for CHARACTER_ACTION events from the core battle logic via BattleBridge

5. **BattleFlowController.js** (`C:\Personal\AutoBattler\js\battle_logic\core\BattleFlowController.js`)
   - Dispatches the CHARACTER_ACTION event via BattleBridge
   - Triggers the event immediately before a character's action is applied in `executeNextAction()`

## How It Works

1. During a battle turn, `BattleFlowController.executeNextAction()` determines which character (`action.actor`) is about to perform an action.

2. `BattleFlowController` dispatches a CHARACTER_ACTION event via BattleBridge, including the `action.actor` data.

3. `BattleScene` receives this CHARACTER_ACTION event and calls `updateActiveCharacterVisuals(characterData)`.

4. The handler extracts the currently acting character's data from the event.

5. The handler calls `clearTurnIndicators()` on both the player and enemy TeamContainer instances. This hides the indicator from the previously acting character.

6. The handler identifies the correct TeamContainer for the currently acting character and calls its `showTurnIndicator()` method, passing the character's identifier.

7. `TeamContainer.showTurnIndicator()` finds the corresponding CharacterSprite instance for the acting character and calls its `highlight()` method.

8. `CharacterSprite.highlight()` delegates to TurnIndicator, which creates and displays the visual floor marker and starts its animation.

9. This process repeats each time a CHARACTER_ACTION event is dispatched for the next character in the turn sequence.

## Visual Components

The turn indicator is now implemented as a single component in TurnIndicator.js:

- **Floor Marker**: A flattened, team-colored ellipse positioned beneath the character
- **Animation**: A pulsing effect achieved through alpha tweening
- **Team-Based Colors**: Blue for player team, red for enemy team

The highlight is now a flat ellipse rendered by Phaser's graphics/ellipse objects, positioned to appear as if it is on the ground beneath the character.

## Tweakable Values

The following key parameters can be adjusted in TurnIndicator.js:

### Size and Shape
```javascript
// Controls the width of the ellipse (current value: 56)
const radius = 56; 

// Controls the height as a ratio of width (current value: 0.27)
this.fillEllipse(0, 0, radius, radius * 0.27);
```

### Position Fine-Tuning
```javascript
// Default vertical offset - adjust to move indicator up/down (current value: -8)
showAt(x, y, color, duration = 300, offsetY = -8)
```

### Visual Appearance
```javascript
// Base opacity of the ellipse (current value: 0.9)
this.fillStyle(color, 0.9);

// Team colors (blue for player, red for enemy)
// These are passed from TeamContainer
```

### Animation Settings
```javascript
// Animation parameters (pulsing effect)
this.fadeTween = this.scene.tweens.add({
    targets: this,
    alpha: { from: 0.3, to: 0.7 }, // Alpha range for pulsing
    duration: 1200,                // Animation duration in ms
    ease: 'Sine.easeInOut',        // Animation easing function
    yoyo: true,                    // Makes animation reverse
    repeat: -1                     // Infinite repetition
});
```

## Evolution History

The turn highlighting system has evolved significantly over time:

1. **Original Version**: Used a bright yellow pulsing circle.
2. **Version 0.5.1.9**: Added 3D effect with shadow and team colors.
3. **Version 0.5.2.0**: Improved positioning relative to character feet.
4. **Version 0.5.2.1**: Adjusted vertical positioning (-17px offset).
5. **Version 0.5.2.3**: Fixed rendering issues by replacing Graphics with Ellipse.
6. **Version 0.5.2.4**: Improved shape for better 3D appearance (wider/flatter).
7. **Version 0.5.2.5**: Reduced size by 50% to fit between health bar and feet.
8. **Fix (v0.5.24c)**: Changed trigger from TURN_STARTED to CHARACTER_ACTION for correct highlighting.
9. **Version 0.6.2.5**: Moved implementation from CharacterSprite to TurnIndicator.
10. **Version 0.6.2.6**: Removed shadow for a cleaner, simpler appearance.
11. **Latest**: Reduced size by 25% while maintaining proportions.

## Future Considerations

If further adjustments are needed:

- For better visibility, increase the base opacity or animation alpha range values
- For better size/proportions, adjust the radius and height ratio
- For better positioning, fine-tune the offsetY parameter when calling showAt()
- For different appearance, consider alternative animation patterns or shape configurations

## Implementation Benefits

The current implementation offers several advantages:

1. **Separation of Concerns**: TurnIndicator.js now explicitly controls all turn indicator functionality
2. **Simplified Maintenance**: Visual tweaks only need to be made in one file
3. **Cleaner Code**: Removed duplicate highlighting code from CharacterSprite
4. **Consistent Styling**: All turn indicators share the same visual implementation
5. **Simpler Visual Design**: Removed shadow for a cleaner, more streamlined look
