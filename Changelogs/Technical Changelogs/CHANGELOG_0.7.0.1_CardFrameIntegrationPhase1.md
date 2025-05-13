# CardFrame Integration Phase 1: Framework & Configuration

This changelog documents the implementation of Phase 1 of the CardFrame integration project, which adds the foundational framework and configuration systems needed to support card-based character representation in the game.

## Overview

Phase 1 focuses on establishing the groundwork for integrating the CardFrame component with the existing CharacterSprite system. This involved:

1. Adding configuration options for card-based representation
2. Implementing conditional creation logic
3. Modifying key visual methods to support both representations
4. Setting up proper event handling for card-specific interactions

## Implementation Details

### Configuration System

Added a comprehensive configuration system to CharacterSprite that allows toggling between circle and card representations:

```javascript
this.config = Object.assign({
    // Existing properties
    showName: true,
    showHealth: true,
    showStatusEffects: true,
    
    // New card-specific options
    useCardFrame: false,         // Whether to use card frame representation
    cardConfig: {                // Card-specific configuration options
        width: 240,              // Card width
        height: 320,             // Card height
        portraitOffsetY: -20,    // Portrait vertical offset from center
        nameBannerHeight: 40,    // Height of name banner
        healthBarOffsetY: 90,    // Distance from center to health bar
        interactive: false       // Whether card is interactive
    }
}, config);
```

This configuration system provides flexibility for customizing card appearance while maintaining backward compatibility with the existing circle-based approach.

### CardFrame Availability Detection

Added a feature detection mechanism to gracefully fall back to circle representation when CardFrame is unavailable:

```javascript
// Check if CardFrame is available globally
this.cardFrameAvailable = (typeof window.CardFrame === 'function');

// Create a complete card configuration by merging defaults with provided options
this.cardConfig = {
    enabled: this.config.useCardFrame || false,
    width: this.config.cardConfig?.width || 240,
    height: this.config.cardConfig?.height || 320,
    // ...more properties with fallbacks
};

// Validate card configuration
if (this.cardConfig.enabled && !this.cardFrameAvailable) {
    console.warn(`CharacterSprite: CardFrame requested but not available, falling back to circle representation`);
    this.cardConfig.enabled = false;
}
```

This approach ensures the game functions correctly even if the CardFrame component is missing or fails to load properly.

### Conditional Creation Logic

Implemented decision logic in the constructor to create either a card or circle representation based on configuration:

```javascript
// --- Determine which representation to use ---
if (this.cardConfig.enabled && this.cardFrameAvailable) {
    try {
        console.log(`CharacterSprite (${character.name}): Creating card frame representation...`);
        this.createCardFrameRepresentation();
        console.log(`CharacterSprite (${character.name}): Card frame representation created.`);
    } catch(error) {
        console.error(`CharacterSprite Constructor (${character.name}): Error in createCardFrameRepresentation:`, error);
        // Fall back to circle representation if card creation fails
        this.cardConfig.enabled = false;
        this.createCircleRepresentation();
    }
} else {
    // Use traditional circle representation
    try {
        console.log(`CharacterSprite (${character.name}): Creating circle representation...`);
        this.createCircleRepresentation();
        console.log(`CharacterSprite (${character.name}): Circle representation created.`);
    } catch(error) {
        console.error(`CharacterSprite Constructor (${character.name}): Error in createCircleRepresentation:`, error);
        // Optionally create a fallback visual here if circle creation fails
    }
}
```

This approach provides automatic fallback to the circle representation if card creation fails, ensuring the game remains functional even in error cases.

### CardFrame Creation Method

Added a new method to create and configure the CardFrame for each character:

```javascript
createCardFrameRepresentation() {
    try {
        // Create CardFrame instance with proper configuration
        this.cardFrame = new window.CardFrame(this.scene, 0, 0, {
            // Character information
            characterKey: `character_${this.character.name}`,
            characterName: this.character.name,
            characterType: this.character.type,
            characterTeam: this.character.team,
            
            // Health information
            currentHealth: this.character.currentHp || 0,
            maxHealth: this.character.stats.hp || 100,
            showHealth: this.config.showHealth,
            
            // Visual customization and art positioning
            width: this.cardConfig.width,
            height: this.cardConfig.height,
            portraitOffsetY: this.cardConfig.portraitOffsetY,
            artOffsetX: parseInt(this.character.art?.left) || 0,
            artOffsetY: parseInt(this.character.art?.top) || 0,
            
            // Interactivity settings with event forwarding
            interactive: this.config.interactive,
            onSelect: () => {
                this.scene.events.emit('character_selected', this.character);
            },
            onHoverStart: () => {
                this.scene.events.emit('character_hover_start', this.character);
                document.body.style.cursor = 'pointer';
            },
            onHoverEnd: () => {
                this.scene.events.emit('character_hover_end', this.character);
                document.body.style.cursor = 'default';
            }
        });
        
        // Add CardFrame to main container
        this.container.add(this.cardFrame);
        
        // Set up events for the card frame
        this.setupCardFrameEvents();
        
        console.log(`CardFrame created successfully for ${this.character.name} of type ${this.character.type}`);
    } catch (error) {
        console.error(`CharacterSprite (${this.character?.name}): Error creating card frame:`, error);
        // Fall back to circle representation
        this.cardConfig.enabled = false;
        this.createCircleRepresentation();
    }
}
```

This method creates a properly configured CardFrame instance that matches the character's type, name, and team while setting up appropriate interactivity and event handling.

### Event Handling

Implemented event handling for turn-based highlighting and proper cleanup:

```javascript
setupCardFrameEvents() {
    try {
        // Listen for scene events that need to update CardFrame
        this.scene.events.on('turn_started', (characterId) => {
            if (this.character.uniqueId === characterId && this.cardFrame) {
                this.cardFrame.setHighlighted(true);
            } else if (this.cardFrame) {
                this.cardFrame.setHighlighted(false);
            }
        }, this);
        
        // Cleanup on shutdown/destroy
        this.scene.events.once('shutdown', this.cleanupCardFrameEvents, this);
        this.scene.events.once('destroy', this.cleanupCardFrameEvents, this);
    } catch (error) {
        console.error(`CharacterSprite (${this.character?.name}): Error setting up card frame events:`, error);
    }
}

cleanupCardFrameEvents() {
    try {
        // Remove all event listeners
        if (this.scene && this.scene.events) {
            this.scene.events.off('turn_started', null, this);
        }
    } catch (error) {
        console.error(`CharacterSprite (${this.character?.name}): Error cleaning up card frame events:`, error);
    }
}
```

This event system ensures that the active character's card is properly highlighted during its turn, with proper event cleanup to prevent memory leaks.

### Visual Method Updates

Updated key visual methods to support both circle and card representations:

1. **Health Updates:** Modified `updateHealth()` to delegate to either circle's health bar or card's built-in health system:

```javascript
if (this.cardConfig.enabled && this.cardFrame) {
    // Use the CardFrame's built-in health update system
    this.cardFrame.updateHealth(newHealth, maxHealth);
    // CardFrame handles its own visual effects for damage/healing
} else {
    // Traditional circle representation health updates
    this.updateHealthBar(newHealth, maxHealth);
    // ... circle-specific damage/healing effects ...
}
```

2. **Floating Text:** Enhanced `showFloatingText()` with representation-specific positioning:

```javascript
// Adjust vertical position based on representation
let yOffset = -50; // Default for circle representation

if (this.cardConfig.enabled && this.cardFrame) {
    // For card frames, adjust to be above the card
    yOffset = -this.cardConfig.height/2 - 20;
}

// Create text at the correct global position with adjusted offset
const floatingText = this.scene.add.text(
    globalPosition.x,
    globalPosition.y + yOffset, // Position based on representation
    text,
    mergedStyle
).setOrigin(0.5);
```

3. **Attack Animation:** Implemented separate animation approaches for cards and circles:

```javascript
if (this.cardConfig.enabled && this.cardFrame) {
    // --- CARD-BASED ANIMATION ---
    // Uses shorter movement distance (50% vs 70%)
    // Adds rotation based on team (5° for player, -5° for enemy)
    // Creates impact effect at halfway point
    // ... (card-specific animation code)
} else {
    // --- ORIGINAL CIRCLE-BASED ANIMATION ---
    // ... (existing circle animation code)
}
```

4. **Impact Effect:** Added a new method for creating visual impact effects during card attacks:

```javascript
createImpactEffect(targetSprite) {
    try {
        // Create flash or particle effect at target position
        const targetPos = new Phaser.Math.Vector2();
        targetSprite.container.getWorldTransformMatrix().transformPoint(0, 0, targetPos);
        
        // Create impact effect at target's position
        const impactFlash = this.scene.add.circle(
            targetPos.x, targetPos.y, 
            40, 0xFFFFFF, 0.7
        );
        
        // Animate impact and destroy
        this.scene.tweens.add({
            targets: impactFlash,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            ease: 'Sine.easeOut',
            onComplete: () => {
                impactFlash.destroy();
            }
        });
    } catch (error) {
        console.error('Error creating impact effect:', error);
    }
}
```

### Resource Cleanup

Enhanced the `destroy()` method to properly clean up card-specific resources:

```javascript
// Clean up card frame if it exists
if (this.cardFrame) {
    try {
        // CardFrame handles its own cleanup in its destroy method
        this.cardFrame.destroy();
        console.log(`CharacterSprite destroy: CardFrame destroyed for ${this.character?.name || 'Unknown'}`);
    } catch (error) {
        console.error(`CharacterSprite destroy: Error destroying CardFrame for ${this.character?.name || 'Unknown'}:`, error);
    }
    this.cardFrame = null;
    
    // Clean up card frame events
    this.cleanupCardFrameEvents();
}
```

This ensures proper resource cleanup and prevents memory leaks when a CardFrame is destroyed.

## Technical Considerations

### Defensive Programming

Implemented comprehensive error handling and fallbacks throughout the card integration:

- Try/catch blocks around all card-related operations
- Detailed error logging for easier debugging
- Automatic fallback to circle representation when card creation fails
- Null checks before accessing card properties

### Backward Compatibility

Maintained compatibility with existing systems while adding card functionality:

- Circle representation remains the default
- All existing methods continue to work for circle representation
- New code paths only execute when card representation is explicitly enabled
- Event system works consistently for both representations

## Next Steps

With Phase 1 complete, the foundation is now in place for Phase 2, which will focus on the core visual implementation:

- Implement card-specific health updates
- Create visual consistency between character displays
- Handle status effect integration with the card layout
- Fine-tune visual appearance of cards in the battle scene

Phase 1 has successfully added the framework and configuration systems needed for a smooth transition to the card-based representation while maintaining backward compatibility with the existing circle-based approach.