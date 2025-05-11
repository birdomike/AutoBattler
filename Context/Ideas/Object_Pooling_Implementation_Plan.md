# Object Pooling Strategy for AutoBattler Game

## 1. Executive Summary

The AutoBattler project will benefit from object pooling for frequently created and destroyed visual elements in battle scenes. This implementation will:

- Create a centralized `ObjectPoolManager` that manages multiple specialized pools
- Focus initially on floating text for damage/healing numbers and potential status effect icons
- Provide a forward-compatible foundation for future visual effects and animations
- Improve performance by reducing garbage collection during intense battle moments
- Support both development and future expansion with comprehensive documentation

## 2. Current Visual Elements Needing Pooling

After reviewing the codebase, I've identified these primary candidates for pooling:

### 2.1 Floating Text Numbers

Currently, in `CharacterSprite.js`, when a character's health changes:
```javascript
// Show floating text for significant health changes
if (Math.abs(healthChange) > 0) {
    const textColor = isHealing ? '#00ff00' : '#ff0000';
    const prefix = isHealing ? '+' : '-';
    const text = `${prefix}${Math.abs(healthChange)}`;
    this.showFloatingText(text, { color: textColor, fontSize: 20 });
}
```

The `showFloatingText()` method creates a new Phaser.Text object each time:
```javascript
showFloatingText(text, style = {}) {
    // Create text
    const floatingText = this.scene.add.text(
        this.container.x,
        this.container.y - 50,
        text,
        mergedStyle
    ).setOrigin(0.5);
    
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
}
```

This is an ideal candidate for pooling as floating damage numbers are created frequently during battles.

### 2.2 Status Effect Icons

Currently, in `StatusEffectContainer.js`, status effect icons are created and destroyed as effects are applied and removed. While this doesn't happen as frequently as floating text, it could benefit from pooling in AoE abilities that apply multiple status effects simultaneously.

### 2.3 Action Indicators

The `ActionIndicator` in `ActionIndicator.js` is a persistent object (one per character) that changes its text, rather than being frequently created or destroyed. This is already optimized and doesn't need pooling.

## 3. Proposed Architecture

I recommend implementing a unified object pooling system with a hierarchical structure:

### 3.1 Core Design

```
ObjectPoolManager (Central singleton)
├── FloatingTextPool
├── StatusEffectIconPool
└── [Future specialized pools as needed]
```

### 3.2 ObjectPoolManager

This will be a centralized singleton class that manages all object pools:

```javascript
class ObjectPoolManager {
    constructor() {
        this.pools = new Map(); // Map of pool name to pool instance
        this.initialized = false;
        
        // Make available globally for debugging and easy access
        window.objectPoolManager = this;
    }
    
    initialize(scene) {
        if (this.initialized) return;
        
        // Create pools
        this.createPool('floatingText', new FloatingTextPool(scene));
        this.createPool('statusIcon', new StatusEffectIconPool(scene));
        // Future pools will be added here
        
        this.initialized = true;
        console.log('[ObjectPoolManager] Initialized all pools');
    }
    
    createPool(name, poolInstance) {
        this.pools.set(name, poolInstance);
        return poolInstance;
    }
    
    getPool(name) {
        return this.pools.get(name);
    }
    
    // Convenience methods for common operations
    getFloatingText(...args) {
        return this.getPool('floatingText')?.get(...args);
    }
    
    getStatusIcon(...args) {
        return this.getPool('statusIcon')?.get(...args);
    }
    
    // Cleanup on scene shutdown
    shutdown() {
        this.pools.forEach(pool => pool.shutdown());
        console.log('[ObjectPoolManager] All pools shut down');
    }
    
    // Utility methods
    getStats() {
        const stats = {};
        this.pools.forEach((pool, name) => {
            stats[name] = pool.getStats();
        });
        return stats;
    }
}
```

### 3.3 Base Pool Class

Create a base `ObjectPool` class that specialized pools will extend:

```javascript
class ObjectPool {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = {
            initialSize: 20,
            expandSize: 10,
            maxSize: 100,
            name: 'GenericPool',
            ...config
        };
        
        this.activeObjects = new Set();
        this.inactiveObjects = [];
        this.totalCreated = 0;
        this.expansions = 0;
        
        // Initialize with initial objects
        this.expand(this.config.initialSize);
    }
    
    // Create a new object instance - to be implemented by subclasses
    createObject() {
        throw new Error('createObject must be implemented by subclasses');
    }
    
    // Reset an object to its default state - to be implemented by subclasses
    resetObject(object) {
        throw new Error('resetObject must be implemented by subclasses');
    }
    
    // Get an object from the pool
    get() {
        // Try to get an inactive object
        let object = this.inactiveObjects.pop();
        
        // If none available, try to expand the pool
        if (!object) {
            if (this.activeObjects.size >= this.config.maxSize) {
                console.warn(`[${this.config.name}] Maximum pool size reached (${this.config.maxSize}). Consider increasing maxSize.`);
                // Return the oldest active object as emergency fallback
                object = Array.from(this.activeObjects)[0];
                this.release(object);
            } else {
                this.expand(this.config.expandSize);
                object = this.inactiveObjects.pop();
                this.expansions++;
            }
        }
        
        // Track as active
        this.activeObjects.add(object);
        
        return object;
    }
    
    // Return an object to the pool
    release(object) {
        if (!object) return;
        
        // Stop tracking as active
        this.activeObjects.delete(object);
        
        // Reset to default state
        this.resetObject(object);
        
        // Add to inactive pool
        this.inactiveObjects.push(object);
    }
    
    // Expand the pool with new objects
    expand(count) {
        console.log(`[${this.config.name}] Expanding pool by ${count} objects`);
        for (let i = 0; i < count; i++) {
            const object = this.createObject();
            this.inactiveObjects.push(object);
            this.totalCreated++;
        }
    }
    
    // Clean up all objects
    shutdown() {
        // Release all active objects
        this.activeObjects.forEach(object => {
            this.release(object);
        });
        
        // Destroy all objects
        this.inactiveObjects.forEach(object => {
            if (object.destroy && typeof object.destroy === 'function') {
                object.destroy();
            }
        });
        
        // Clear arrays
        this.activeObjects.clear();
        this.inactiveObjects = [];
        
        console.log(`[${this.config.name}] Pool shutdown complete, ${this.totalCreated} objects destroyed`);
    }
    
    // Get stats about this pool
    getStats() {
        return {
            active: this.activeObjects.size,
            inactive: this.inactiveObjects.length,
            total: this.totalCreated,
            expansions: this.expansions,
            maxSize: this.config.maxSize
        };
    }
}
```

### 3.4 Specialized Pools

#### 3.4.1 FloatingTextPool

```javascript
class FloatingTextPool extends ObjectPool {
    constructor(scene) {
        super(scene, {
            initialSize: 30,   // Start with 30 text objects
            expandSize: 15,    // Add 15 at a time if needed
            maxSize: 150,      // Cap at 150 objects
            name: 'FloatingTextPool'
        });
    }
    
    createObject() {
        const text = this.scene.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        // Set inactive by default
        text.setVisible(false);
        text.setActive(false);
        
        // Default origin
        text.setOrigin(0.5);
        
        return text;
    }
    
    resetObject(text) {
        // Reset properties
        text.setVisible(false);
        text.setActive(false);
        text.setScale(1, 1);
        text.setAlpha(1);
        text.setText('');
        text.setColor('#ffffff');
        
        // Cancel any active tweens
        if (text.activeTweens) {
            text.activeTweens.forEach(tween => {
                if (tween && tween.stop) tween.stop();
            });
        }
        
        text.activeTweens = [];
    }
    
    // Get a floating text object with default or custom style
    get(config = {}) {
        const text = super.get();
        
        // Default configuration for floating text
        const defaultConfig = {
            text: '',
            style: {},
            x: 0,
            y: 0,
            duration: 1500,
            rise: 50,
            parent: null
        };
        
        // Merge with provided configuration
        const mergedConfig = {...defaultConfig, ...config};
        
        // Apply text and style
        text.setText(mergedConfig.text);
        
        // Apply style properties
        if (mergedConfig.style.color) text.setColor(mergedConfig.style.color);
        if (mergedConfig.style.fontSize) text.setFontSize(mergedConfig.style.fontSize);
        if (mergedConfig.style.fontFamily) text.setFontFamily(mergedConfig.style.fontFamily);
        if (mergedConfig.style.stroke) text.setStroke(mergedConfig.style.stroke, mergedConfig.style.strokeThickness || 1);
        
        // Position the text
        if (mergedConfig.parent && mergedConfig.parent.container) {
            // Get global position of parent
            const worldPos = new Phaser.Math.Vector2();
            mergedConfig.parent.container.getWorldTransformMatrix().transformPoint(0, 0, worldPos);
            
            // Position at world coordinates
            text.setPosition(worldPos.x + mergedConfig.x, worldPos.y + mergedConfig.y);
        } else {
            // Position directly
            text.setPosition(mergedConfig.x, mergedConfig.y);
        }
        
        // Make visible and active
        text.setVisible(true);
        text.setActive(true);
        
        // Create and store the animation
        const timeline = this.scene.tweens.createTimeline();
        text.activeTweens = text.activeTweens || [];
        
        // Rise and fade animation
        const tween = this.scene.tweens.add({
            targets: text,
            y: text.y - mergedConfig.rise,
            alpha: { from: 1, to: 0 },
            duration: mergedConfig.duration,
            ease: 'Power2',
            onComplete: () => {
                // Return to pool when animation completes
                this.release(text);
            }
        });
        
        text.activeTweens.push(tween);
        
        return text;
    }
}
```

#### 3.4.2 StatusEffectIconPool (if needed)

```javascript
class StatusEffectIconPool extends ObjectPool {
    constructor(scene) {
        super(scene, {
            initialSize: 20,  // Start with 20 status icons
            expandSize: 10,   // Add 10 at a time if needed
            maxSize: 100,     // Cap at 100 objects
            name: 'StatusEffectIconPool'
        });
    }
    
    createObject() {
        // Create a container for the icon with its components
        const container = this.scene.add.container(0, 0);
        
        // Create background circle
        const bg = this.scene.add.circle(0, 0, 12, 0xffffff, 0.5);
        
        // Create icon sprite with a default texture that will be changed later
        const sprite = this.scene.add.sprite(0, 0, 'status_icon_placeholder');
        sprite.setScale(0.75);
        
        // Create text for duration
        const durationText = this.scene.add.text(0, 10, '1', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0.5);
        
        // Create text for stacks
        const stackText = this.scene.add.text(10, -10, '1', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0.5);
        
        // Add all components to the container
        container.add([bg, sprite, durationText, stackText]);
        
        // Set inactive by default
        container.setVisible(false);
        
        // Store references to components for easy access
        container.bg = bg;
        container.sprite = sprite;
        container.durationText = durationText;
        container.stackText = stackText;
        
        return container;
    }
    
    resetObject(container) {
        // Reset properties
        container.setVisible(false);
        container.setScale(1, 1);
        container.setAlpha(1);
        container.setPosition(0, 0);
        
        // Reset background
        container.bg.setFillStyle(0xffffff, 0.5);
        
        // Reset sprite
        container.sprite.setTexture('status_icon_placeholder');
        container.sprite.setScale(0.75);
        
        // Reset texts
        container.durationText.setText('1');
        container.durationText.setVisible(false);
        
        container.stackText.setText('1');
        container.stackText.setVisible(false);
        
        // Reset stored data
        container.statusId = null;
        container.statusDefinition = null;
        
        // Cancel any active tweens
        if (container.activeTweens) {
            container.activeTweens.forEach(tween => {
                if (tween && tween.stop) tween.stop();
            });
        }
        
        container.activeTweens = [];
        
        // Remove interactive
        if (container.bg.input) {
            container.bg.disableInteractive();
        }
    }
    
    // Get a configured status icon
    get(config = {}) {
        const container = super.get();
        
        // Default configuration
        const defaultConfig = {
            statusId: 'status_placeholder',
            definition: {
                name: 'Unknown Status',
                description: 'No description',
                type: 'buff'
            },
            duration: 0,
            stacks: 1,
            x: 0,
            y: 0,
            parent: null
        };
        
        // Merge with provided configuration
        const mergedConfig = {...defaultConfig, ...config};
        
        // Store status data
        container.statusId = mergedConfig.statusId;
        container.statusDefinition = mergedConfig.definition;
        
        // Set icon texture
        try {
            const iconKey = mergedConfig.statusId.replace('status_', '');
            container.sprite.setTexture(`status_${iconKey}`);
        } catch (error) {
            console.warn(`StatusEffectIconPool: Texture not found for ${mergedConfig.statusId}`);
            // Use placeholder or first letter
            container.sprite.setTexture('status_icon_placeholder');
        }
        
        // Set background color based on status type
        const typeColor = this.getTypeColor(mergedConfig.definition.type);
        container.bg.setFillStyle(typeColor, 0.5);
        
        // Update duration text
        if (mergedConfig.duration > 0) {
            container.durationText.setText(mergedConfig.duration.toString());
            container.durationText.setVisible(true);
        } else {
            container.durationText.setVisible(false);
        }
        
        // Update stack text
        if (mergedConfig.stacks > 1) {
            container.stackText.setText(mergedConfig.stacks.toString());
            container.stackText.setVisible(true);
        } else {
            container.stackText.setVisible(false);
        }
        
        // Position the icon
        if (mergedConfig.parent && mergedConfig.parent.container) {
            // Get global position of parent
            const worldPos = new Phaser.Math.Vector2();
            mergedConfig.parent.container.getWorldTransformMatrix().transformPoint(0, 0, worldPos);
            
            // Position at world coordinates
            container.setPosition(worldPos.x + mergedConfig.x, worldPos.y + mergedConfig.y);
        } else {
            // Position directly
            container.setPosition(mergedConfig.x, mergedConfig.y);
        }
        
        // Make visible
        container.setVisible(true);
        
        return container;
    }
    
    // Helper for status effect colors
    getTypeColor(type) {
        switch (type?.toLowerCase()) {
            case 'buff': return 0x4488ff;     // Blue for buffs
            case 'debuff': return 0xff8844;   // Orange for debuffs
            case 'dot': return 0xff4444;      // Red for damage over time
            case 'hot': return 0x44ff44;      // Green for healing over time
            case 'control': return 0xaa44ff;  // Purple for control effects
            case 'shield': return 0xaaaaaa;   // Gray for shields
            default: return 0xffffff;         // White for unknown types
        }
    }
}
```

## 4. Integration Strategy

### 4.1 BattleFXManager Implementation

The planned `BattleFXManager` (Phase 5 of the BattleScene refactoring) should be the primary interface for visual effects and integrate the object pooling system:

```javascript
class BattleFXManager {
    constructor(scene) {
        this.scene = scene;
        this.poolManager = null;
        
        // Initialize the pool manager
        this.initializePoolManager();
    }
    
    initializePoolManager() {
        // Create or use global instance
        if (!window.objectPoolManager) {
            window.objectPoolManager = new ObjectPoolManager();
        }
        
        this.poolManager = window.objectPoolManager;
        this.poolManager.initialize(this.scene);
        
        console.log('[BattleFXManager] Object pool manager initialized');
    }
    
    // Show floating text for damage, healing, etc.
    showFloatingText(character, text, style = {}) {
        if (!character) return null;
        
        try {
            // Configure position based on character
            const config = {
                text: text,
                style: style,
                y: -50, // Position above character
                parent: character
            };
            
            // Get a text object from the pool
            return this.poolManager.getFloatingText(config);
        } catch (error) {
            console.error('[BattleFXManager] Error showing floating text:', error);
            return null;
        }
    }
    
    // Show attack animation (to be implemented - potentially using pooled effects)
    showAttackAnimation(attacker, target, onComplete, actionContext) {
        // Delegate to CharacterSprite but potentially use pooled elements
        if (!attacker || !target) {
            if (onComplete) onComplete();
            return;
        }
        
        // Find team containers and sprites similar to BattleScene implementation
        // But use pooled objects for any additional visual effects
        
        // For now, just call the existing method on CharacterSprite
        if (attacker && typeof attacker.showAttackAnimation === 'function') {
            attacker.showAttackAnimation(target, onComplete, actionContext);
        } else {
            if (onComplete) onComplete();
        }
    }
    
    // Other visual effects methods will be added here
    // ...
    
    // Clean up resources
    destroy() {
        // No need to destroy poolManager as it's global
        // Just log that we're no longer using it
        console.log('[BattleFXManager] Destroyed');
    }
}
```

### 4.2 Integrating with CharacterSprite

The `CharacterSprite` class should be updated to use the pooled floating text through the `BattleFXManager`:

```javascript
// In CharacterSprite.js - updated showFloatingText method
showFloatingText(text, style = {}) {
    try {
        // Use BattleFXManager if available
        if (this.scene.battleFXManager) {
            this.scene.battleFXManager.showFloatingText(this, text, style);
            return;
        }
        
        // Legacy fallback - direct creation of text
        // This will be used only if battleFXManager is not available
        // Original implementation goes here...
    } catch (error) {
        console.error(`showFloatingText (${this.character?.name}): Error:`, error);
    }
}
```

### 4.3 Integration with StatusEffectContainer

If we decide to pool status effect icons, the `StatusEffectContainer` would also need to be updated:

```javascript
// In StatusEffectContainer.js - updated addIconForEffect method
addIconForEffect(effectIndex) {
    if (effectIndex < 0 || effectIndex >= this.statusEffects.length) return;
    
    const effect = this.statusEffects[effectIndex];
    
    // Use pooled icons if BattleFXManager is available
    if (this.scene.battleFXManager && this.scene.battleFXManager.poolManager) {
        // Get a pooled icon
        const config = {
            statusId: effect.statusId,
            definition: effect.definition,
            duration: effect.duration,
            stacks: effect.stacks,
            parent: this.parent
        };
        
        const icon = this.scene.battleFXManager.poolManager.getStatusIcon(config);
        
        // Make icon interactive for tooltip display
        this.makeIconInteractive(icon, effectIndex);
        
        // Add to our tracking array
        this.iconContainers.push(icon);
        
        // Note: We don't need to add to container as the icon is already in the scene
    } else {
        // Legacy implementation - direct creation
        // Create icon...
    }
}
```

## 5. Performance Considerations

For optimal performance, the implementation should follow these principles:

### 5.1 Initial Pool Sizes

- Base initial pool sizes on typical battle scenarios:
  - **FloatingTextPool**: 30 initial objects (covers AoE abilities hitting 6 characters)
  - **StatusEffectIconPool**: 20 initial objects (covers multiple status effects per character)

### 5.2 Growth Strategy

- Conservative expansion approach:
  - Expand the pool when needed but cap total size
  - Log warnings when approaching maximum capacity
  - Dynamic adjustments based on battle intensity

### 5.3 Memory Management

- Carefully manage tweens and other resources:
  - Cancel tweens when objects are returned to pool
  - Clear all references when resetting objects
  - Proper cleanup during scene transitions

### 5.4 Scene Integration

- Robust integration with Phaser's scene lifecycle:
  - Initialize pools during scene creation
  - Clean up during scene shutdown
  - Handle scene transitions properly

## 6. Best Practices and Guidelines

For the development team, I recommend the following guidelines:

### 6.1 When to Use Object Pooling

- **Use for**: Short-lived objects created and destroyed frequently (more than 5-10 per second)
- **Use for**: Objects with expensive initialization (complex graphics, multiple components)
- **Use for**: Identical objects that differ only in position, text, or simple properties
- **Don't use for**: Long-lived UI elements or unique, complex objects with many variations

### 6.2 Creating New Pools

- Follow the established pattern with specialized pool classes
- Ensure proper object initialization in `createObject()`
- Ensure complete resource cleanup in `resetObject()`
- Include proper error handling and fallbacks

### 6.3 Managing Pool Sizes

- Start with conservative initial sizes and increase only if needed
- Monitor pool usage in development with the diagnostic tools
- Set appropriate max sizes based on worst-case scenarios
- Log warnings when pools approach capacity

### 6.4 Debugging Pooled Objects

- Use the global `objectPoolManager.getStats()` to monitor usage
- Add diagnostic visual indicators (optional borders, counters, etc.) during development
- Include pool information in error messages for easier debugging

## 7. Conclusion and Recommendations

Based on the analysis of the AutoBattler codebase and the requirements, I recommend:

1. **Proceed with Implementation**: The object pooling system will provide clear benefits for visual effects and future expansion.

2. **Focus on FloatingText First**: Prioritize the floating text pool implementation as it has the highest impact.

3. **Integrate with BattleFXManager**: Use the planned BattleFXManager as the primary interface for pooled objects.

4. **Maintain Backward Compatibility**: Ensure all implementations have fallbacks for backward compatibility.

5. **Expand Gradually**: Add additional pools as needed based on performance metrics and game requirements.

This implementation will provide a solid foundation for visual effects in the AutoBattler game while maintaining performance and facilitating future expansion.
