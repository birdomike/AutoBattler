# Status Effect Visualization Implementation - Part 2

This document explains the implementation of the tooltip system and event handling for status effect visualization.

## Overview

Part 2 of the implementation focuses on making the status effect system interactive and connecting it to battle events:

1. Creating the `StatusEffectTooltip` component for displaying detailed status effect information
2. Enhancing `StatusEffectContainer` with event listeners and tooltip integration
3. Adding interactive features to status effect icons
4. Implementing proper status effect event handling

## Technical Implementation Details

### 1. StatusEffectTooltip Component

The StatusEffectTooltip component creates a singleton tooltip that can be used by all status effect icons:

```javascript
class StatusEffectTooltip {
    constructor(scene) {
        // Store singleton instance
        if (window.statusEffectTooltip) {
            console.warn('StatusEffectTooltip: Instance already exists, returning existing instance');
            return window.statusEffectTooltip;
        }
        
        this.scene = scene;
        
        // Configuration settings
        this.config = {
            width: 200,         // Base width of tooltip
            padding: 10,        // Padding inside tooltip
            textColor: '#ffffff', // Text color
            backgroundColor: 0x000000, // Background color
            backgroundAlpha: 0.8, // Background opacity
            borderColor: 0x3498db, // Border color
            borderThickness: 2,  // Border thickness
            // ...
        };
        
        // Store as singleton
        window.statusEffectTooltip = this;
    }
    
    // ...other methods...
}
```

Key features:
- **Singleton pattern**: Only one tooltip exists globally to minimize memory usage
- **Dynamic sizing**: Tooltip size adjusts to fit content
- **Screen boundary awareness**: Tooltip position is adjusted to stay within screen bounds
- **Animated transitions**: Fade animations for appearance/disappearance
- **Type-specific styling**: Border color changes based on status effect type

### 2. StatusEffectContainer Enhancements

Enhanced the StatusEffectContainer with:

#### Event Listeners

```javascript
setupEventListeners() {
    // Get the battle bridge instance
    const bridge = window.battleBridge || (window.getBattleBridge ? window.getBattleBridge() : null);
    
    if (!bridge) {
        console.error('StatusEffectContainer: BattleBridge not available');
        return;
    }
    
    // Listen for status effect applied event
    bridge.addEventListener(
        bridge.eventTypes.STATUS_EFFECT_APPLIED, 
        this.handleStatusEffectApplied.bind(this)
    );
    
    // Listen for status effect removed event
    bridge.addEventListener(
        bridge.eventTypes.STATUS_EFFECT_REMOVED, 
        this.handleStatusEffectRemoved.bind(this)
    );
    
    // Listen for status effect updated event
    bridge.addEventListener(
        bridge.eventTypes.STATUS_EFFECT_UPDATED, 
        this.handleStatusEffectUpdated.bind(this)
    );
}
```

#### Event Handlers

Added handlers for all status effect events:

- `handleStatusEffectApplied`: Adds new status effects or updates existing ones
- `handleStatusEffectRemoved`: Removes status effects with fade-out animation
- `handleStatusEffectUpdated`: Updates duration/stacks of existing effects

#### Character Identification

Added robust character identification to ensure status effects are applied to the correct character:

```javascript
const sameCharacter = 
    // First check unique ID
    (data.character.uniqueId && this.parent.character.uniqueId && 
     data.character.uniqueId === this.parent.character.uniqueId) ||
    // Then check regular ID
    (data.character.id && this.parent.character.id && 
     data.character.id === this.parent.character.id) ||
    // Finally check name as fallback
    (data.character.name === this.parent.character.name && 
     data.character.team === this.parent.character.team);
```

This handles multiple ways of identifying characters, with fallbacks.

#### Icon Interactivity

Added tooltip functionality to status effect icons:

```javascript
makeIconInteractive(iconContainer, effectIndex) {
    // Find the background circle (first child of the container)
    const bg = iconContainer.list[0];
    if (!bg) return;
    
    // Make interactive
    bg.setInteractive({ cursor: 'pointer' });
    
    // Add hover effect
    bg.on('pointerover', () => {
        // Scale up slightly
        this.scene.tweens.add({
            targets: iconContainer,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            ease: 'Sine.easeOut'
        });
        
        // Show tooltip
        const effect = this.statusEffects[effectIndex];
        if (effect) {
            const worldPos = iconContainer.getWorldTransformMatrix();
            this.tooltip.showTooltip(
                effect.statusId,
                effect.definition,
                { x: worldPos.tx, y: worldPos.ty - 10 },
                effect.duration,
                effect.stacks
            );
        }
    });
    
    // Remove hover effect
    bg.on('pointerout', () => {
        // Scale back to normal
        this.scene.tweens.add({
            targets: iconContainer,
            scaleX: 1,
            scaleY: 1,
            duration: 100,
            ease: 'Sine.easeIn'
        });
        
        // Hide tooltip
        this.tooltip.hideTooltip();
    });
}
```

### 3. Script Loading Order

Updated index.html to ensure scripts are loaded in the correct order:

1. Added `StatusEffectContainer.js` before `CharacterSprite.js`
2. Added `StatusEffectTooltip.js` before `StatusEffectContainer.js`

This ensures that classes are defined before they're used, preventing ReferenceErrors.

### 4. Component Architecture

The status effect system follows a modular component architecture:

```
BattleScene
  └── CharacterSprite
      └── StatusEffectContainer
          └── StatusEffectIcons (individual containers)
              └── Uses StatusEffectTooltip (singleton)
```

- `BattleScene` preloads all status effect icons
- `CharacterSprite` creates and owns a `StatusEffectContainer`
- `StatusEffectContainer` manages status effect icons and listens for events
- `StatusEffectTooltip` is a singleton used by all status effect icons

### 5. Responsive Animation

Added smooth animations for status effects:

- Fade-in animation when status effects are applied
- Fade-out animation when status effects expire
- Scale animation on hover for improved feedback
- Tooltip fade animations for better user experience

## Future Enhancements

There are several potential enhancements that could be made in future updates:

1. **Multi-Effect Tooltip**: Implement a special tooltip for the +N indicator that shows all hidden effects
2. **Visual Effects**: Add particle effects for certain status effect types (e.g., flames for burn)
3. **Audio Cues**: Add sound effects when status effects are applied or expire
4. **Stack Animation**: Add animation when stacks increase/decrease
5. **Effect Grouping**: Group similar effects together (e.g., all buffs in one section)

## Testing Considerations

Testing should focus on:

- Proper display of status effect icons in various scenarios
- Correct icon positioning and layout adjustment
- Tooltip appearance and content accuracy
- Event handling correctness for different character identification methods
- Performance with multiple effects active simultaneously
- Interaction with other UI elements (no overlapping or z-index issues)

## Known Issues

- The +N indicator tooltip currently shows a TODO comment as the multi-effect tooltip is not yet implemented
- There may be z-index issues with tooltips if multiple UI elements overlap
- Status effect icons require corresponding assets to be present in the expected location