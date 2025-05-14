# CardFrame Integration Plan- Granular

## Overview
This document outlines the detailed plan for integrating the new `CardFrame` component into the existing `CharacterSprite` system for the AutoBattler game. This integration will replace the current circular character representations with professional card-based visuals while maintaining backward compatibility.

## Phase Summary

### Phase 1: Framework & Configuration
- ✅ Add CardFrame availability detection to CharacterSprite
- ✅ Implement configuration system for card options
- ✅ Add conditional creation logic
- ✅ Update index.html to include required component files

### Phase 2: Core Visual Implementation
- ☐ Implement createCardFrameRepresentation method
- ☐ Adapt health update system for both representations
- ☐ Create proper error handling and fallbacks
- ☐ Test basic visual appearance

### Phase 3: Animation System
- ☐ Implement card-specific attack animations
- ☐ Create impact effects for attacks
- ☐ Update floating text handling for cards
- ☐ Ensure proper GameObject cleanup

### Phase 4: Status Effect Integration
- ☐ Modify StatusEffectContainer for card layout
- ☐ Update status effect positioning
- ☐ Pass configuration from CharacterSprite
- ☐ Test with multiple status effects

### Phase 5: Event System & Performance
- ☐ Implement bidirectional event handling
- ☐ Add visibility culling for offscreen cards
- ☐ Setup proper event cleanup
- ☐ Add texture atlas support

### Phase 6: Transition System
- ☐ Create toggleRepresentation method
- ☐ Implement animated transitions between representations
- ☐ Ensure proper resource cleanup during transitions

### Phase 7: TeamContainer Integration
- ☐ Update team layout logic for cards
- ☐ Add card detection to TeamContainer
- ☐ Implement team-specific adjustments

### Phase 8: Testing & Refinement
- ☐ Create comprehensive testing strategy
- ☐ Test edge cases
- ☐ Performance optimization
- ☐ Visual refinement

## Integration Approach

### Phase 1: Framework & Configuration

#### Component Access Strategy
The `CardFrame` component will be accessed through the global `window` object, consistent with the game's current architecture:

```javascript
// In CharacterSprite.js
constructor(scene, character, config = {}) {
    // ...existing code...
    
    // Check if CardFrame is available globally
    this.cardFrameAvailable = (typeof window.CardFrame === 'function');
    
    // Set the card config based on availability
    this.cardConfig.enabled = this.cardConfig.enabled && this.cardFrameAvailable;
    
    if (this.cardConfig.enabled && !this.cardFrameAvailable) {
        console.warn(`CharacterSprite: CardFrame requested but not available, falling back to circle representation`);
    }
}
```

#### Configuration System
1. Add card frame configuration options to CharacterSprite:

```javascript
this.config = Object.assign({
    x: 0,
    y: 0,
    scale: 1,
    showName: true,
    showHealth: true,
    showStatusEffects: true,
    useCardFrame: false,         // NEW: Toggle card frame usage
    cardConfig: {                // NEW: Card-specific options
        width: 240,
        height: 320,
        portraitOffsetY: -20,
        nameBannerHeight: 40,
        healthBarOffsetY: 90
    }
}, config);

// Create a complete card configuration by merging defaults with provided options
this.cardConfig = {
    enabled: this.config.useCardFrame || false,
    width: this.config.cardConfig?.width || 240,
    height: this.config.cardConfig?.height || 320,
    // ...more properties with fallbacks
};
```

2. Add conditional creation logic in constructor:

```javascript
if (this.cardConfig.enabled && this.cardFrameAvailable) {
    this.createCardFrameRepresentation();
} else {
    this.createCircleRepresentation(); // Original approach
}
```

#### Update index.html (CRITICAL STEP)

This step is essential to ensure the CardFrame components are properly loaded:

```html
<!-- Add to index.html in proper order -->
<!-- Card Frame Component System -->
<script src="js/phaser/components/ui/cardframe/CardFrameVisualComponent.js"></script>
<script src="js/phaser/components/ui/cardframe/CardFrameHealthComponent.js"></script>
<script src="js/phaser/components/ui/cardframe/CardFrameContentComponent.js"></script>
<script src="js/phaser/components/ui/cardframe/CardFrameInteractionComponent.js"></script>
<script src="js/phaser/components/ui/CardFrameManager.js"></script>
<script src="js/phaser/components/ui/CardFrame.js"></script>
```

**Note**: The loading order is critical - subcomponents must be loaded before the CardFrameManager, which must be loaded before CardFrame itself.

### Phase 2: Core Visual Implementation

#### CardFrame Creation
Implement the `createCardFrameRepresentation()` method:

```javascript
createCardFrameRepresentation() {
    try {
        // Validate essential dependencies
        if (!this.scene || !this.character) {
            console.error('CharacterSprite: Cannot create card frame without scene or character data');
            this.createCircleRepresentation();
            return;
        }
        
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
            
            // Visual customization
            width: this.cardConfig.width,
            height: this.cardConfig.height,
            portraitOffsetY: this.cardConfig.portraitOffsetY,
            
            // Art positioning from character data
            artOffsetX: parseInt(this.character.art?.left) || 0,
            artOffsetY: parseInt(this.character.art?.top) || 0,
            
            // Interactivity settings
            interactive: this.config.interactive,
            onSelect: () => {
                // Forward selection event to scene (same as circle representation)
                this.scene.events.emit('character_selected', this.character);
            },
            onHoverStart: () => {
                // Handle hover start (e.g., show additional info)
                this.scene.events.emit('character_hover_start', this.character);
                document.body.style.cursor = 'pointer';
            },
            onHoverEnd: () => {
                // Handle hover end
                this.scene.events.emit('character_hover_end', this.character);
                document.body.style.cursor = 'default';
            }
        });
        
        // Add CardFrame to main container
        this.container.add(this.cardFrame);
        
        // Setup events for proper lifecycle management
        this.setupCardFrameEvents();
    } catch (error) {
        console.error(`CharacterSprite (${this.character?.name}): Error creating card frame:`, error);
        // Fall back to circle representation
        this.cardConfig.enabled = false;
        this.createCircleRepresentation();
    }
}
```

#### Health Updates
Update the `updateHealth()` method to support both representations:

```javascript
updateHealth(newHealth, maxHealth) {
    try {
        // Validate inputs
        if (newHealth === undefined || newHealth === null) {
            console.error('CharacterSprite.updateHealth: Invalid health value');
            return;
        }
        
        // Update internal health tracking
        this.currentHealth = newHealth;
        
        // Update character data
        if (this.character) {
            this.character.currentHp = newHealth;
        }
        
        // Show floating text for significant health changes (same for both representations)
        const healthChange = (this.previousHealth || newHealth) - newHealth;
        const isHealing = healthChange < 0;
        
        if (Math.abs(healthChange) > 0) {
            const textColor = isHealing ? '#00ff00' : '#ff0000';
            const prefix = isHealing ? '+' : '-';
            const text = `${prefix}${Math.abs(healthChange)}`;
            this.showFloatingText(text, { color: textColor, fontSize: 20 });
        }
        
        // Update the visual health display based on representation
        if (this.cardConfig.enabled && this.cardFrame) {
            // Use CardFrame's built-in health update system
            this.cardFrame.updateHealth(newHealth, maxHealth);
        } else {
            // Original health bar update code for circle representation
            this.updateHealthBar(newHealth, maxHealth);
            
            // Flash effects for circle representation
            if (healthChange > 0 && this.characterImage) {
                // Original flash animation
            }
            
            if (healthChange < 0 && this.characterImage) {
                // Original heal glow animation
            }
        }
        
        // Store current health for future reference
        this.previousHealth = newHealth;
    } catch (error) {
        console.error(`CharacterSprite.updateHealth: Error updating ${this.character?.name}'s health:`, error);
    }
}
```

### Phase 3: Animation System

#### Attack Animation
Implement card-specific attack animations in `showAttackAnimation()`:

```javascript
showAttackAnimation(targetSprite, onComplete, actionContext) {
    // Validate inputs
    if (!this.character || !targetSprite || !targetSprite.character) {
        console.error(`[CharacterSprite] showAttackAnimation: Missing data!`);
        if (onComplete) onComplete();
        return;
    }

    // Show appropriate action text based on context
    if (actionContext) {
        if (actionContext.actionType === 'autoAttack') {
            this.showActionText('Auto Attack');
        }
    }
    
    // Different animation approaches based on representation
    if (this.cardConfig.enabled && this.cardFrame) {
        // CARD-BASED ANIMATION
        
        // Calculate movement vector (shorter distance for cards - 50% instead of 70%)
        const moveDistance = 0.5; // Cards move a shorter distance than circles
        
        // Get positions for movement calculation
        let attackerGlobalPos = new Phaser.Math.Vector2();
        this.container.getWorldTransformMatrix().transformPoint(0, 0, attackerGlobalPos);
        
        let targetGlobalPos = new Phaser.Math.Vector2();
        targetSprite.container.getWorldTransformMatrix().transformPoint(0, 0, targetGlobalPos);
        
        // Calculate move destination
        const direction = new Phaser.Math.Vector2(
            targetGlobalPos.x - attackerGlobalPos.x,
            targetGlobalPos.y - attackerGlobalPos.y
        ).normalize();
        
        const moveToX = direction.x * this.cardConfig.width * moveDistance;
        const moveToY = direction.y * this.cardConfig.height * moveDistance;
        
        // Add slight rotation based on team
        const rotation = this.character.team === 'player' ? 5 : -5;
        
        // Create timeline with modified properties
        const timeline = this.scene.tweens.createTimeline();
        
        // Move forward with slight rotation
        timeline.add({
            targets: this.cardFrame,
            x: moveToX,
            y: moveToY,
            angle: rotation, // Add slight card rotation
            duration: 250,
            ease: 'Sine.easeOut'
        });
        
        // Return to original position
        timeline.add({
            targets: this.cardFrame,
            x: 0,
            y: 0,
            angle: 0, // Reset rotation
            duration: 250,
            ease: 'Sine.easeOut'
        });
        
        // Add impact effect at halfway point
        let hasTriggeredImpact = false;
        let impactEffect = null;
        
        timeline.on('update', () => {
            const progress = timeline.progress;
            if (progress > 0.45 && progress < 0.55 && !hasTriggeredImpact) {
                hasTriggeredImpact = true;
                impactEffect = this.createImpactEffect(targetSprite);
            }
        });
        
        // Cleanup when done
        timeline.once('complete', () => {
            // Kill any tweens associated with the timeline
            this.scene.tweens.killTweensOf(this.cardFrame);
            
            // Make sure impact effect is properly cleaned up
            if (impactEffect && impactEffect.scene) {
                impactEffect.destroy();
            }
            
            if (onComplete) onComplete();
        });
        
        // Play timeline
        timeline.play();
    } else {
        // ORIGINAL CIRCLE-BASED ANIMATION
        // ...existing animation code...
    }
}

// New method for card-specific impact effect
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
                if (impactFlash && impactFlash.scene) {
                    impactFlash.destroy();
                }
            }
        });
        
        return impactFlash; // Return reference for potential external cleanup
    } catch (error) {
        console.error('Error creating impact effect:', error);
        return null;
    }
}
```

#### Floating Text
Update floating text handling for both representations:

```javascript
showFloatingText(text, style = {}) {
    try {
        // Validate text
        if (!text) {
            console.warn('CharacterSprite.showFloatingText: Empty text, skipping');
            return null;
        }
        
        // Get global position - works for both card and circle
        let globalPosition = new Phaser.Math.Vector2();
        this.container.getWorldTransformMatrix().transformPoint(0, 0, globalPosition);
        
        // Adjust vertical position based on representation
        const yOffset = this.cardConfig.enabled ? -this.cardConfig.height/2 - 20 : -50;
        
        // Create text at the correct global position
        const floatingText = this.scene.add.text(
            globalPosition.x,
            globalPosition.y + yOffset,
            text,
            Object.assign({
                fontFamily: 'Arial',
                fontSize: 20,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }, style)
        ).setOrigin(0.5);
        
        // Set high depth to ensure visibility
        floatingText.setDepth(1000);
        
        // Animate text
        this.scene.tweens.add({
            targets: floatingText,
            y: floatingText.y - 50,
            alpha: { from: 1, to: 0 },
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                if (floatingText && floatingText.scene) {
                    floatingText.destroy();
                }
            }
        });
        
        return floatingText; // Return reference for potential external cleanup
    } catch (error) {
        console.error(`Error showing floating text:`, error);
        return null;
    }
}
```

### Phase 4: Status Effect Integration

#### Status Effect Container Modifications
Update StatusEffectContainer to support card frames:

```javascript
// In StatusEffectContainer.js
constructor(scene, characterSprite, config = {}) {
    // Validate essential dependencies
    if (!scene || !characterSprite) {
        console.error('StatusEffectContainer: Missing required parameters');
        return;
    }
    
    this.characterSprite = characterSprite;
    this.scene = scene;
    
    // Determine if parent is using card frame
    this.isCardFrame = characterSprite.cardConfig?.enabled || false;
    
    if (this.isCardFrame) {
        // For card frames, position at top of card
        const offsetY = config.statusEffectOffsetY || -140;
        this.container = scene.add.container(0, offsetY);
        this.iconSpacing = 22; // Slightly smaller spacing
        this.maxIconsPerRow = 5; // More icons per row for cards
        
        // Use a horizontal layout for cards
        this.layoutDirection = 'horizontal';
    } else {
        // Original circular positioning
        this.container = scene.add.container(0, -50);
        this.iconSpacing = 24;
        this.maxIconsPerRow = 3;
        this.layoutDirection = 'circular';
    }
    
    // Add container to parent
    characterSprite.container.add(this.container);
    
    // Initialize collections
    this.icons = [];
    this.statusEffects = {};
    this.tooltips = {};
    
    // Set up cleanup on scene shutdown
    this.scene.events.once('shutdown', this.destroy, this);
    this.scene.events.once('destroy', this.destroy, this);
}

updateIconPositions() {
    if (this.isCardFrame) {
        // Horizontal grid layout for card frames
        this.icons.forEach((icon, index) => {
            const row = Math.floor(index / this.maxIconsPerRow);
            const col = index % this.maxIconsPerRow;
            
            const x = (col - Math.floor(this.maxIconsPerRow/2)) * this.iconSpacing;
            const y = row * this.iconSpacing;
            
            icon.setPosition(x, y);
        });
    } else {
        // Original circular layout
        // ...existing positioning code...
    }
}

// Proper resource cleanup
destroy() {
    // Remove event listeners
    if (this.scene) {
        this.scene.events.off('shutdown', this.destroy, this);
        this.scene.events.off('destroy', this.destroy, this);
    }
    
    // Destroy all icons
    this.icons.forEach(icon => {
        if (icon && icon.scene) {
            icon.destroy();
        }
    });
    this.icons = [];
    
    // Destroy all tooltips
    Object.values(this.tooltips).forEach(tooltip => {
        if (tooltip && tooltip.destroy) {
            tooltip.destroy();
        }
    });
    this.tooltips = {};
    
    // Clear status effects
    this.statusEffects = {};
    
    // Destroy container
    if (this.container && this.container.scene) {
        this.container.destroy();
        this.container = null;
    }
}
```

#### Modify CharacterSprite to pass configuration:
```javascript
// In CharacterSprite.js
if (this.config.showStatusEffects) {
    try {
        this.statusEffectContainer = new StatusEffectContainer(scene, this, {
            statusEffectOffsetY: this.cardConfig.enabled ? -140 : -50
        });
    } catch(error) {
        console.error(`Error creating status effect container:`, error);
    }
}
```

### Phase 5: Event System & Performance

#### Event Propagation
Setup bidirectional events between CharacterSprite and CardFrame:

```javascript
// In createCardFrameRepresentation
setupCardFrameEvents() {
    // Listen for scene events that need to update CardFrame
    this.scene.events.on('turn_started', this.handleTurnStarted, this);
    this.scene.events.on('character_selected', this.handleCharacterSelected, this);
    
    // Cleanup on shutdown/destroy
    this.scene.events.once('shutdown', this.cleanupCardFrameEvents, this);
    this.scene.events.once('destroy', this.cleanupCardFrameEvents, this);
}

handleTurnStarted(characterId) {
    if (!this.cardFrame || !this.character) return;
    
    if (this.character.uniqueId === characterId) {
        this.cardFrame.setHighlighted(true);
    } else {
        this.cardFrame.setHighlighted(false);
    }
}

handleCharacterSelected(character) {
    if (!this.cardFrame || !this.character) return;
    
    if (this.character.uniqueId === character.uniqueId) {
        this.cardFrame.setSelected(true);
    } else {
        this.cardFrame.setSelected(false);
    }
}

cleanupCardFrameEvents() {
    if (!this.scene) return;
    
    this.scene.events.off('turn_started', this.handleTurnStarted, this);
    this.scene.events.off('character_selected', this.handleCharacterSelected, this);
    this.scene.events.off('shutdown', this.cleanupCardFrameEvents, this);
    this.scene.events.off('destroy', this.cleanupCardFrameEvents, this);
}
```

#### Performance Optimizations
Implement card frame rendering optimizations:

```javascript
// In BattleScene.js - Create asset manager for texture atlas
preload() {
    // ...existing code...
    
    // Load card frame texture atlas
    this.load.atlas(
        'card-frames', 
        'assets/images/cards/card-frames.png', 
        'assets/images/cards/card-frames.json'
    );
}

// In CharacterSprite.js
update(time, delta) {
    // ...existing code...
    
    // Visibility culling for card frames
    if (this.cardConfig.enabled && this.cardFrame) {
        const bounds = this.getBounds();
        const camera = this.scene.cameras.main;
        
        // Only render if in camera view (with padding)
        const padding = 100;
        const inView = (
            bounds.right + padding >= camera.worldView.left &&
            bounds.left - padding <= camera.worldView.right &&
            bounds.bottom + padding >= camera.worldView.top &&
            bounds.top - padding <= camera.worldView.bottom
        );
        
        // Only update visibility if it changed
        if (this.cardFrame.visible !== inView) {
            this.cardFrame.setVisible(inView);
        }
    }
}
```

### Phase 6: Transition System 

#### Representation Transition
Implement transition animations between circle and card:

```javascript
// Method to toggle between representations
toggleRepresentation(useCardFrame = true, animate = true) {
    // Skip if already in target state
    if (this.cardConfig.enabled === useCardFrame) {
        return;
    }
    
    if (useCardFrame) {
        this.transitionToCardFrame(animate);
    } else {
        this.transitionToCircle(animate);
    }
}

transitionToCardFrame(animate = true) {
    // Create card frame
    this.cardConfig.enabled = true;
    
    // Store original circle properties
    const originalCirclePos = {
        x: this.circle ? this.circle.x : 0,
        y: this.circle ? this.circle.y : 0
    };
    
    // Create card frame
    this.createCardFrameRepresentation();
    
    if (animate) {
        // Start card small and transparent
        this.cardFrame.setScale(0.2);
        this.cardFrame.setAlpha(0);
        
        // Animate card appearing
        this.scene.tweens.add({
            targets: this.cardFrame,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // Animate circle disappearing
        if (this.circle) {
            this.scene.tweens.add({
                targets: [this.circle, this.characterImage],
                alpha: 0,
                scale: 1.2, // Expand slightly as it fades
                duration: 250,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    // Clean up circle elements
                    if (this.circle && this.circle.scene) {
                        this.circle.destroy();
                        this.circle = null;
                    }
                    
                    // Don't destroy characterImage if card frame is using it
                    // but null the reference if we're not using it 
                    if (this.characterImage && !this.cardFrame.usesOriginalImage) {
                        this.characterImage = null;
                    }
                }
            });
        }
    } else {
        // Instant transition
        if (this.circle && this.circle.scene) {
            this.circle.destroy();
            this.circle = null;
        }
    }
}

transitionToCircle(animate = true) {
    // Store original card properties
    const originalCardPos = {
        x: this.cardFrame ? this.cardFrame.x : 0,
        y: this.cardFrame ? this.cardFrame.y : 0
    };
    
    // Create circle representation
    this.cardConfig.enabled = false;
    this.createCircleRepresentation();
    
    if (animate) {
        // Start circle small and transparent
        this.circle.setScale(0.2);
        this.circle.setAlpha(0);
        if (this.characterImage) {
            this.characterImage.setScale(0.2);
            this.characterImage.setAlpha(0);
        }
        
        // Animate circle appearing
        this.scene.tweens.add({
            targets: [this.circle, this.characterImage],
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // Animate card disappearing
        if (this.cardFrame) {
            this.scene.tweens.add({
                targets: this.cardFrame,
                alpha: 0,
                scale: 0.2,
                duration: 250,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    // Clean up card elements
                    if (this.cardFrame && this.cardFrame.scene) {
                        this.cardFrame.destroy();
                        this.cardFrame = null;
                    }
                    
                    // Kill any lingering tweens
                    if (this.scene) {
                        this.scene.tweens.killTweensOf(this.cardFrame);
                    }
                }
            });
        }
    } else {
        // Instant transition
        if (this.cardFrame && this.cardFrame.scene) {
            this.cardFrame.destroy();
            this.cardFrame = null;
        }
    }
}
```

### Phase 7: Integration with TeamContainer 

Update TeamContainer to handle card-based positioning:

```javascript
// In TeamContainer.js
constructor(scene, config = {}) {
    // ...existing code...
    
    // Add card-specific spacing configuration
    this.circleSpacing = config.spacing || 275;
    this.cardSpacing = config.cardSpacing || 350; // More space for cards
}

layoutTeam() {
    // Validate team exists
    if (!this.characterSprites || this.characterSprites.length === 0) {
        return;
    }
    
    // Different spacing for cards vs circles
    const spacing = this.containsCardFrames() ? this.cardSpacing : this.circleSpacing;
    const teamSize = this.characterSprites.length;
    
    // Calculate positions
    let positions = [];
    
    // For 3 character teams, use a special positioning
    if (teamSize === 3) {
        // Adjust offset based on representation
        const offsetY = this.containsCardFrames() ? 20 : 40;
        
        // Position first character higher
        positions.push({
            x: 0,
            y: -spacing - offsetY
        });
        
        // Keep middle character in center
        positions.push({
            x: 0,
            y: 0
        });
        
        // Position last character lower
        positions.push({
            x: 0,
            y: spacing + offsetY
        });
    } else {
        // For other team sizes, calculate positions normally
        for (let i = 0; i < teamSize; i++) {
            positions.push({
                x: 0,
                y: (i - Math.floor(teamSize / 2)) * spacing
            });
        }
    }
    
    // Apply positions
    this.characterSprites.forEach((sprite, index) => {
        if (index < positions.length) {
            sprite.container.setPosition(positions[index].x, positions[index].y);
        }
        
        // Apply team-specific adjustments
        if (this.teamType === 'enemy' && this.containsCardFrames()) {
            // Apply flipping for enemy cards if needed
            if (sprite.cardFrame) {
                sprite.cardFrame.setScale(-1, 1); // Horizontal flip
            }
        }
    });
}

containsCardFrames() {
    // Check if any sprites are using card frames
    return this.characterSprites.some(sprite => 
        sprite.cardConfig && sprite.cardConfig.enabled
    );
}

destroy() {
    // Clean up sprites
    if (this.characterSprites) {
        this.characterSprites.forEach(sprite => {
            if (sprite && sprite.destroy) {
                sprite.destroy();
            }
        });
        this.characterSprites = [];
    }
    
    // Clean up container
    if (this.container && this.container.scene) {
        this.container.destroy();
        this.container = null;
    }
    
    // Remove event listeners
    if (this.scene) {
        this.scene.events.off('shutdown', this.destroy, this);
        this.scene.events.off('destroy', this.destroy, this);
    }
}
```

### Phase 8: Testing & Refinement

#### Testing Strategy
1. **Unit Testing:**
   - Test CardFrame creation with various configurations
   - Test health updates with different values (0, max, partial)
   - Test animations with different character types

2. **Integration Testing:**
   - Test with different character types
   - Test with mixed card/circle teams
   - Test battle sequence with full card teams
   - Test status effect display with multiple effects

3. **Edge Cases:**
   - Characters with long names
   - Characters at 0 HP
   - Maximum number of status effects
   - Missing character art
   - Missing card frame assets

4. **Resource Management Testing:**
   - Verify all GameObjects are properly destroyed
   - Check for memory leaks in animations
   - Test destruction during scene transitions
   - Monitor frame rate with multiple cards

#### Refinement Areas
- Animation timing and effects
- Type theming consistency
- Text and health bar visibility/readability
- Status effect positioning and clarity
- Performance optimization for multiple cards

## Implementation Dependencies

### Required Assets
1. Card frame texture atlas
2. Type-specific frame variations
3. Nameplate textures with scrollwork
4. Decorative flourish elements

### JavaScript Dependencies
1. CardFrame component system files in index.html
2. Properly refactored CardFrame with subcomponents
3. Phaser 3 (already included in project)

## Conclusion
This integration plan provides a granular, structured approach to implementing the CardFrame component within the existing CharacterSprite system while maintaining backward compatibility. The plan incorporates:

1. Proper resource management with thorough GameObject destruction
2. Critical index.html updates for component loading
3. Defensive programming practices throughout
4. Detailed event management and cleanup
5. Clear testing strategy for integration success

Following this plan will ensure a smooth transition from the current circle-based representations to the new card-based system while minimizing bugs and memory leaks.
