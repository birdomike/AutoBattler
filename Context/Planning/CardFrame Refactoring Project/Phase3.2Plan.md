## Overview
This phase focuses on extracting health-related functionality from CardFrame.js into a dedicated CardFrameHealthComponent.js file. We'll follow the same \"Extract, Delegate, Verify, Remove\" methodology used successfully in Phase 3.1.

## New File to Create
**File:** `C:\\Personal\\AutoBattler\\js\\phaser\\components\\ui\\cardframe\\CardFrameHealthComponent.js`

## Methods to Extract
The health-related functionality in CardFrame.js consists of:

1. `createHealthBar()` (~70 lines): Creates and configures the health bar UI elements
2. `updateHealth()` (~95 lines): Updates the health display when values change, including animations
3. `getHealthBarColor()` (~5 lines): Utility method to determine health bar color based on percentage

## Implementation Steps

### 1. EXTRACT: Create CardFrameHealthComponent.js

```javascript
/**
 * CardFrameHealthComponent.js
 * Handles health bar rendering and updating for CardFrame
 * Part of the component-based CardFrame refactoring project
 */
class CardFrameHealthComponent {
    /**
     * Create a new CardFrameHealthComponent
     * @param {Phaser.Scene} scene - The scene this component belongs to
     * @param {Phaser.GameObjects.Container} container - The parent container this component will add GameObjects to
     * @param {number} typeColor - The color to use for type-themed elements
     * @param {Object} config - Configuration options
     */
    constructor(scene, container, typeColor, config = {}) {
        // Validate required parameters
        if (!scene || !container) {
            console.error('CardFrameHealthComponent: Missing required parameters (scene or container)');
            throw new Error('CardFrameHealthComponent: Missing required parameters');
        }
        
        this.scene = scene;
        this.container = container;
        this.typeColor = typeColor || 0xAAAAAA; // Default to neutral gray if no type color provided
        
        // Store configuration with defaults relevant to health
        this.config = Object.assign({
            // Health display configuration
            currentHealth: 100,         // Current health value
            maxHealth: 100,             // Maximum health value
            showHealth: true,           // Whether to show health bar
            healthBarWidth: 180,        // Width of health bar
            healthBarHeight: 12,        // Height of health bar
            healthBarOffsetY: -148,     // Distance from center to health bar
            showHealthText: true,       // Whether to show health text
        }, config);
        
        // Object references
        this.healthBarContainer = null;
        this.healthBarBg = null;
        this.healthBar = null;
        this.healthText = null;
        
        // Initialize if health should be shown
        if (this.config.showHealth) {
            this.createHealthBar();
        }
    }
    
    /**
     * Create health bar with animated transitions
     * @returns {Phaser.GameObjects.Container} The healthBarContainer
     */
    createHealthBar() {
        // Implementation copied from CardFrame's createHealthBar, but adjusted for component context
    }
    
    /**
     * Update the health display
     * @param {number} currentHealth - New current health value
     * @param {number} maxHealth - New maximum health value (optional)
     * @param {boolean} animate - Whether to animate the change (default: true)
     */
    updateHealth(currentHealth, maxHealth = null, animate = true) {
        // Implementation copied from CardFrame's updateHealth, but adjusted for component context
    }
    
    /**
     * Get the appropriate color for the health bar based on percentage
     * @param {number} percent - Health percentage (0-1)
     * @returns {number} - Color as hex number
     */
    getHealthBarColor(percent) {
        if (percent < 0.3) return 0xFF0000; // Red (low health)
        if (percent < 0.6) return 0xFFAA00; // Orange (medium health)
        return 0x00FF00; // Green (high health)
    }
    
    /**
     * Clean up all resources
     */
    destroy() {
        try {
            // Kill any active tweens
            if (this.scene && this.scene.tweens) {
                if (this.healthBar) this.scene.tweens.killTweensOf(this.healthBar);
                if (this.healthText) this.scene.tweens.killTweensOf(this.healthText);
            }
            
            // Destroy all created GameObjects
            if (this.healthBarContainer && this.healthBarContainer.scene) {
                this.healthBarContainer.destroy();
                this.healthBarContainer = null;
            }
            
            // Clear references
            this.healthBarBg = null;
            this.healthBar = null;
            this.healthText = null;
            this.scene = null;
            this.container = null;
            this.config = null;
        } catch (error) {
            console.error('CardFrameHealthComponent: Error during destroy:', error);
        }
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardFrameHealthComponent;
}

// Make available globally
window.CardFrameHealthComponent = CardFrameHealthComponent;
```

### 2. Update index.html to Load the New Component

Add the script tag for CardFrameHealthComponent.js before CardFrameManager.js but after CardFrameVisualComponent.js:

```html
<!-- CardFrame Component System -->
<script src=\"js/phaser/components/ui/cardframe/CardFrameVisualComponent.js\"></script>
<script src=\"js/phaser/components/ui/cardframe/CardFrameHealthComponent.js\"></script>
<script src=\"js/phaser/components/ui/CardFrameManager.js\"></script>
```

### 3. DELEGATE: Update CardFrameManager.js

Add initialization for the health component:

```javascript
// In CardFrameManager.js constructor, after initializing VisualComponent:
this.healthComponent = null;
this.initializeHealthComponent();

// Add this method to CardFrameManager.js:
/**
 * Initialize the health component for health bar and health updates
 */
initializeHealthComponent() {
    try {
        // Check if CardFrameHealthComponent is available
        if (typeof window.CardFrameHealthComponent !== 'function') {
            console.error('CardFrameManager: CardFrameHealthComponent not found in global scope');
            return;
        }
        
        // Create health component
        this.healthComponent = new window.CardFrameHealthComponent(
            this.scene,
            this,
            this.typeColor,
            this.config
        );
        
        console.log('CardFrameManager: Health component initialized');
    } catch (error) {
        console.error('CardFrameManager: Error initializing health component:', error);
    }
}

// Add delegation methods for each health method:
/**
 * Create health bar with animated transitions
 * Delegated to HealthComponent
 */
createHealthBar() {
    if (this.healthComponent) {
        return this.healthComponent.createHealthBar();
    }
    return null;
}

/**
 * Update the health display
 * Delegated to HealthComponent
 */
updateHealth(currentHealth, maxHealth = null, animate = true) {
    if (this.healthComponent) {
        return this.healthComponent.updateHealth(currentHealth, maxHealth, animate);
    }
}

/**
 * Get the appropriate color for the health bar based on percentage
 * Delegated to HealthComponent
 */
getHealthBarColor(percent) {
    if (this.healthComponent) {
        return this.healthComponent.getHealthBarColor(percent);
    }
    // Fallback
    if (percent < 0.3) return 0xFF0000; // Red (low health)
    if (percent < 0.6) return 0xFFAA00; // Orange (medium health)
    return 0x00FF00; // Green (high health)
}
```

### 4. DELEGATE: Update CardFrame.js

Modify the `createHealthBar()` method to delegate to manager:

```javascript
/**
 * Create health bar with animated transitions
 * Delegates to CardFrameHealthComponent via CardFrameManager
 */
createHealthBar() {
    try {
        // If component system is active, delegate to manager
        if (this.config.useComponentSystem && this.manager) {
            // Delegate to manager
            const healthBarContainer = this.manager.createHealthBar();
            
            // If manager's method returned a valid object, store it
            if (healthBarContainer) {
                this.healthBarContainer = healthBarContainer;
                return healthBarContainer;
            } else {
                console.warn('CardFrame.createHealthBar: Manager did not return healthBarContainer, falling back to direct implementation');
            }
        }
        
        // Original implementation as fallback
        // ... (keep original code for now)
    } catch (error) {
        console.error('CardFrame: Error creating health bar:', error);
    }
}
```

Similarly, update `updateHealth()` and `getHealthBarColor()` to delegate to manager.

### 5. VERIFY: Test Functionality

1. Test that health bars and updating work correctly through delegation
2. Verify animations work properly
3. Ensure all error cases are handled appropriately
4. Test edge cases (0 health, full health, etc.)

### 6. REMOVE: Remove Original Implementation

After verification, update CardFrame.js to remove original implementations:

```javascript
/**
 * Create health bar with animated transitions
 * Delegates to CardFrameHealthComponent via CardFrameManager
 */
createHealthBar() {
    try {
        // If component system is active, delegate to manager
        if (this.config.useComponentSystem && this.manager) {
            // Delegate to manager
            const healthBarContainer = this.manager.createHealthBar();
            
            // If manager's method returned a valid object, store it
            if (healthBarContainer) {
                this.healthBarContainer = healthBarContainer;
                return healthBarContainer;
            } else {
                console.warn('CardFrame.createHealthBar: Manager did not return healthBarContainer, falling back to direct implementation');
            }
        }
        
        // Create minimal fallback health bar
        const fallbackContainer = this.scene.add.container(0, this.config.healthBarOffsetY);
        
        // Create basic health bar background
        const bgRect = this.scene.add.rectangle(
            0, 0, 
            this.config.healthBarWidth, 
            this.config.healthBarHeight,
            0x000000, 0.7
        );
        
        // Create basic health fill
        const healthFill = this.scene.add.rectangle(
            0, 0,
            this.config.healthBarWidth * (this.config.currentHealth / this.config.maxHealth),
            this.config.healthBarHeight - 2,
            this.getHealthBarColor(this.config.currentHealth / this.config.maxHealth)
        );
        
        // Add to container
        fallbackContainer.add([bgRect, healthFill]);
        
        // Add container to main container
        this.add(fallbackContainer);
        
        // Store references
        this.healthBarContainer = fallbackContainer;
        this.healthBar = healthFill;
        
        return fallbackContainer;
    } catch (error) {
        console.error('CardFrame: Error creating health bar:', error);
        return null;
    }
}
```

Similar simplifications would be applied to `updateHealth()` and `getHealthBarColor()`.

## Directory Structure

After implementation, the directory structure will look like:

```
C:\\Personal\\AutoBattler\\js\\phaser\\components\\ui\\
│
├── CardFrame.js                 # Main component (now a façade)
├── CardFrameManager.js          # Coordinator for all components
│
└── cardframe\\                   # Folder for specialized components
    ├── CardFrameVisualComponent.js    # Handles visual aspects (completed)
    └── CardFrameHealthComponent.js    # New: Handles health functionality
```

## Implementation Checklist

- [ ] Create `CardFrameHealthComponent.js` with extracted methods
- [ ] Update `index.html` to load the new component
- [ ] Add health component initialization to `CardFrameManager.js`
- [ ] Add delegation methods to `CardFrameManager.js`
- [ ] Update `CardFrame.js` to delegate health methods to manager
- [ ] Test functionality thoroughly
- [ ] Simplify original implementations in `CardFrame.js` to minimal fallbacks
- [ ] Update changelogs with implementation details

## Detailed Method Analysis

### 1. `createHealthBar()` (~70 lines)
- **Responsibility**: Creates health bar container, background, fill, and text
- **Dependencies**: Scene, configuration values, typeColor
- **References Created**: healthBarContainer, healthBarBg, healthBar, healthText
- **Challenges**: Proper positioning within component context

### 2. `updateHealth()` (~95 lines)
- **Responsibility**: Updates health bar visuals when health changes
- **Dependencies**: healthBar, healthText, tweens system
- **Animations**: Width/color animation, damage flash, healing glow
- **Challenges**: Managing tweens and visual feedback from component

### 3. `getHealthBarColor()` (~5 lines)
- **Responsibility**: Returns color based on health percentage
- **Dependencies**: None (simple utility method)
- **Challenges**: None (straightforward to implement)

This methodical approach ensures we maintain the same robust, defensive programming style used in Phase 3.1, while systematically extracting health functionality into a dedicated component.`
}