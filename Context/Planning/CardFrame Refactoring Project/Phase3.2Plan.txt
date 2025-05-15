# Phase 3.2: CardFrameHealthComponent Extraction Plan (Revised with Lessons Learned)

## Overview
This phase focuses on extracting health-related functionality from CardFrame.js into a dedicated `CardFrameHealthComponent.js` file. We'll follow the same "Extract, Delegate, Verify, Remove" (EDRV) methodology used successfully in Phase 3.1, incorporating recent lessons for robust component initialization.

## Core Principles from Lessons Learned (Applied to this Phase)
1.  **Robust Sub-Component Initialization**: `CardFrameManager` must defensively initialize `CardFrameHealthComponent`, verify its successful creation, and handle potential errors gracefully.
2.  **Clear Delegation with Verification**: Delegation methods in `CardFrameManager` must check if the sub-component (`CardFrameHealthComponent`) and its target methods are available before attempting a call.
3.  **Script Loading Order**: Ensure `CardFrameHealthComponent.js` is loaded before `CardFrameManager.js` in `index.html`.

## New File to Create
**File:** `C:\Personal\AutoBattler\js\phaser\components\ui\cardframe\CardFrameHealthComponent.js`

## Methods to Extract from Original CardFrame.js
The health-related functionality in CardFrame.js consists of:

1.  `createHealthBar()` (~70 lines): Creates and configures the health bar UI elements.
2.  `updateHealth()` (~95 lines): Updates the health display when values change, including animations.
3.  `getHealthBarColor()` (~5 lines): Utility method to determine health bar color based on percentage.

## Implementation Steps

### 1. EXTRACT: Create `CardFrameHealthComponent.js`

```javascript
/**
 * CardFrameHealthComponent.js
 * Handles health bar rendering and updating for CardFrame.
 * Part of the component-based CardFrame refactoring project.
 */
class CardFrameHealthComponent {
    /**
     * Create a new CardFrameHealthComponent.
     * @param {Phaser.Scene} scene - The scene this component belongs to.
     * @param {Phaser.GameObjects.Container} container - The parent CardFrameManager container this component will add GameObjects to.
     * @param {number} typeColor - The color to use for type-themed elements.
     * @param {Object} config - Configuration options.
     */
    constructor(scene, container, typeColor, config = {}) {
        // Validate required parameters
        if (!scene || !container) {
            console.error('CardFrameHealthComponent constructor: Missing required parameters (scene or container). Component will not initialize.');
            throw new Error('CardFrameHealthComponent: Missing required scene or container parameters.'); // Fail fast
        }
        
        this.scene = scene;
        this.container = container; // This is the CardFrameManager instance
        this.typeColor = typeColor || 0xAAAAAA; // Default to neutral gray if no type color provided
        
        // Store configuration with defaults relevant to health
        this.config = Object.assign({
            // Health display configuration
            currentHealth: 100,
            maxHealth: 100,
            showHealth: true,
            healthBarWidth: 180,
            healthBarHeight: 12,
            healthBarOffsetY: -148, // Default from recent card layout optimization
            showHealthText: true,
            // **NEW/UPDATED:** Ensure relevant text styling configs are here if needed by healthText
            healthTextColor: '#000000', // Example
            healthTextFontFamily: 'Arial', // Example
            healthTextFontSize: '10px', // Example
            healthTextStrokeColor: '#FFFFFF', // Example
            healthTextStrokeThickness: 2 // Example
        }, config);
        
        // Object references for Phaser GameObjects managed by this component
        this.healthBarContainer = null; // This will be a new container, added to the parent `this.container` (CardFrameManager)
        this.healthBarBg = null;
        this.healthBar = null;
        this.healthText = null;
        
        // Initialize if health should be shown
        if (this.config.showHealth) {
            this.createHealthBar(); // This will create and add elements to this.healthBarContainer, then add that to this.container
        }
        console.log(`CardFrameHealthComponent: Initialized for character ${this.config.characterName || 'Unknown'}. Show health: ${this.config.showHealth}`);
    }
    
    /**
     * Create health bar with animated transitions.
     * @returns {Phaser.GameObjects.Container | null} The healthBarContainer or null if not created.
     */
    createHealthBar() {
        // **NEW/UPDATED:** Implementation to be copied from CardFrame's createHealthBar.
        // Adjustments:
        // 1. All scene.add calls (e.g., scene.add.rectangle, scene.add.text) are correct.
        // 2. A new Phaser.GameObjects.Container (`this.healthBarContainer`) should be created here.
        // 3. All health bar elements (bg, fill, text) should be added to `this.healthBarContainer`.
        // 4. `this.healthBarContainer` should then be added to `this.container` (which is the CardFrameManager instance).
        //    Example: this.healthBarContainer = this.scene.add.container(0, this.config.healthBarOffsetY);
        //             // ... create bg, fill, text and add them to this.healthBarContainer ...
        //             this.container.add(this.healthBarContainer); // Adds health UI to the CardFrameManager
        //             return this.healthBarContainer;
        // Ensure all necessary config properties are used (healthBarWidth, height, text options, etc.)
        console.warn('CardFrameHealthComponent.createHealthBar: Needs full implementation copied from CardFrame.js and adapted.');
        return null; // Placeholder
    }
    
    /**
     * Update the health display.
     * @param {number} currentHealth - New current health value.
     * @param {number} [maxHealth=null] - New maximum health value (optional).
     * @param {boolean} [animate=true] - Whether to animate the change.
     */
    updateHealth(currentHealth, maxHealth = null, animate = true) {
        // **NEW/UPDATED:** Implementation to be copied from CardFrame's updateHealth.
        // Adjustments:
        // 1. Ensure it uses `this.healthBar`, `this.healthText`, `this.scene.tweens`.
        // 2. References to `this.config` for health bar properties are correct.
        // 3. Call `this.getHealthBarColor()`.
        console.warn('CardFrameHealthComponent.updateHealth: Needs full implementation copied from CardFrame.js and adapted.');
    }
    
    /**
     * Get the appropriate color for the health bar based on percentage.
     * @param {number} percent - Health percentage (0-1).
     * @returns {number} - Color as hex number.
     */
    getHealthBarColor(percent) {
        // This method can likely be copied as-is.
        if (percent < 0.3) return 0xFF0000; // Red (low health)
        if (percent < 0.6) return 0xFFAA00; // Orange (medium health)
        return 0x00FF00; // Green (high health)
    }
    
    /**
     * Clean up all resources managed by this component.
     */
    destroy() {
        console.log(`CardFrameHealthComponent: Destroying health component for ${this.config.characterName || 'Unknown'}`);
        try {
            // Kill any active tweens targeting elements managed by this component
            if (this.scene && this.scene.tweens) {
                if (this.healthBar) this.scene.tweens.killTweensOf(this.healthBar);
                if (this.healthText) this.scene.tweens.killTweensOf(this.healthText);
            }
            
            // Destroy all created GameObjects if they exist and have a scene (meaning they were added)
            if (this.healthBarContainer && this.healthBarContainer.scene) {
                this.healthBarContainer.destroy(); // This will destroy bg, fill, and text if they are children
            }
            
            // Clear references to prevent memory leaks
            this.healthBarContainer = null;
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

// Export for module use (if ever transitioning to a module system)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardFrameHealthComponent;
}

// Make available globally for current script loading setup
if (typeof window !== 'undefined') {
    window.CardFrameHealthComponent = CardFrameHealthComponent;
} else {
    console.error('CardFrameHealthComponent: Window object not found. Cannot attach to global scope.');
}


2. Update index.html to Load the New Component
Ensure the script tag for CardFrameHealthComponent.js is correctly placed:
Location: After CardFrameVisualComponent.js and before CardFrameManager.js.

HTML

<script src="js/phaser/components/ui/cardframe/CardFrameVisualComponent.js" defer></script>
<script src="js/phaser/components/ui/cardframe/CardFrameHealthComponent.js" defer></script> <script src="js/phaser/components/ui/CardFrameManager.js" defer></script>
<script src="js/phaser/components/ui/CardFrame.js" defer></script> 
3. DELEGATE: Update CardFrameManager.js
In CardFrameManager.js constructor (or an early init method):
Initialize this.healthComponent to null.
Call this.initializeHealthComponent();

Add/Update initializeHealthComponent() method in CardFrameManager.js:

JavaScript

/**
 * Initialize the health component for health bar and health updates.
 * **NEW/UPDATED:** Incorporates robust checks.
 */
initializeHealthComponent() {
    this.healthComponent = null; // Ensure it's null before attempting initialization
    try {
        if (typeof window.CardFrameHealthComponent !== 'function') {
            console.error(`CardFrameManager (${this.config.characterName || 'Unknown'}): CardFrameHealthComponent class not found in global scope. Health bar will be missing.`);
            return; // Exit if the class definition isn't loaded
        }
        
        // Create health component
        // The CardFrameManager itself (this) acts as the container for the HealthComponent's UI elements
        this.healthComponent = new window.CardFrameHealthComponent(
            this.scene,
            this, // CardFrameManager is the container for healthComponent's elements
            this.typeColor,
            this.config // Pass the full config, HealthComponent will pick what it needs
        );
        
        // **NEW/UPDATED:** Verify successful instantiation
        if (this.healthComponent && typeof this.healthComponent.createHealthBar === 'function') {
            console.log(`CardFrameManager (${this.config.characterName || 'Unknown'}): Health component initialized successfully.`);
        } else {
            console.error(`CardFrameManager (${this.config.characterName || 'Unknown'}): CRITICAL - CardFrameHealthComponent instantiation failed or is invalid. HealthComponent:`, this.healthComponent);
            this.healthComponent = null; // Ensure it's null if something went wrong
        }
    } catch (error) {
        console.error(`CardFrameManager (${this.config.characterName || 'Unknown'}): Error initializing health component:`, error);
        this.healthComponent = null; // Explicitly nullify on error
    }
}
Add/Update delegation methods in CardFrameManager.js:

JavaScript

/**
 * Create health bar with animated transitions.
 * Delegated to HealthComponent.
 * **NEW/UPDATED:** Added robust checks.
 */
createHealthBar() {
    if (this.healthComponent && typeof this.healthComponent.createHealthBar === 'function') {
        return this.healthComponent.createHealthBar();
    }
    console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): createHealthBar called but healthComponent is not available or lacks method.`);
    return null;
}

/**
 * Update the health display.
 * Delegated to HealthComponent.
 * **NEW/UPDATED:** Added robust checks.
 */
updateHealth(currentHealth, maxHealth = null, animate = true) {
    if (this.healthComponent && typeof this.healthComponent.updateHealth === 'function') {
        this.healthComponent.updateHealth(currentHealth, maxHealth, animate);
    } else {
        console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): updateHealth called but healthComponent is not available or lacks method.`);
    }
}

/**
 * Get the appropriate color for the health bar based on percentage.
 * Delegated to HealthComponent.
 * **NEW/UPDATED:** Added robust checks.
 */
getHealthBarColor(percent) {
    if (this.healthComponent && typeof this.healthComponent.getHealthBarColor === 'function') {
        return this.healthComponent.getHealthBarColor(percent);
    }
    console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): getHealthBarColor called but healthComponent is not available or lacks method. Using fallback color.`);
    // Fallback color logic from original plan
    if (percent < 0.3) return 0xFF0000; 
    if (percent < 0.6) return 0xFFAA00; 
    return 0x00FF00;
}

// **NEW/UPDATED:** Ensure destroy method in CardFrameManager calls destroy on healthComponent
destroy() {
    // ... existing destroy logic for visualComponent ...
    if (this.visualComponent) {
        this.visualComponent.destroy();
        this.visualComponent = null;
    }
    if (this.healthComponent) { // <-- ADDED
        this.healthComponent.destroy();
        this.healthComponent = null;
    }
    // ... existing super.destroy() or other cleanup ...
    console.log(`CardFrameManager (${this.config.characterName || 'Unknown'}): Destroyed.`);
    // Phaser.GameObjects.Container's destroy method will handle destroying children like healthBarContainer if added.
    super.destroy(true); // true to remove from parent
}
4. DELEGATE: Update CardFrame.js (The Facade)
This step might be minimal or unnecessary if CharacterSprite now exclusively instantiates CardFrameManager.
If CardFrame.js is still potentially instantiated directly as a fallback by CharacterSprite (as per the logic from 0.7.1.5 fix), then its health methods need to delegate to this.manager (which would be a CardFrameManager instance).

If CardFrame.js acts as a facade to CardFrameManager: (This is the most likely scenario now that CharacterSprite directly uses CardFrameManager)
CharacterSprite now creates CardFrameManager directly (this.cardFrame = new window.CardFrameManager(...)).
So, CardFrame.js (the old class) is likely no longer the primary entry point from CharacterSprite.
The calls like this.cardFrame.updateHealth() from CharacterSprite will directly hit CardFrameManager.updateHealth().
Therefore, no changes might be needed in CardFrame.js itself for this delegation step, as it's bypassed.

However, if CardFrame.js were still used as an intermediary:
Modify createHealthBar(), updateHealth(), and getHealthBarColor() in CardFrame.js to delegate to this.manager (if it exists).
Example for CardFrame.js createHealthBar():

JavaScript

// In CardFrame.js
createHealthBar() {
    // Note: this.manager in CardFrame.js is an instance of CardFrameManager.
    if (this.manager && typeof this.manager.createHealthBar === 'function') { 
        const healthBarContainerFromManager = this.manager.createHealthBar();
        // CardFrame (the facade) itself doesn't usually store direct refs to UI elements anymore,
        // as the manager and its sub-components handle them.
        // The manager should be adding elements to itself as a container.
        if (healthBarContainerFromManager) { // Or if it returns a meaningful status
             console.log(`CardFrame (${this.config.characterName || 'Unknown'}): Delegated createHealthBar to manager successfully.`);
             // It's unusual for createHealthBar in the manager to return the container if the manager itself *is* the container
             // and healthComponent adds to it. Let's assume it returns success/failure or nothing.
             // this.healthBarContainer = healthBarContainerFromManager; // Probably not needed here anymore.
            return; // Or return a status
        } else {
            console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): Manager.createHealthBar didn't succeed. Potential issue or fallback in manager.`);
        }
    }
    // Fallback (original implementation from CardFrame.js) if no manager or method
    console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): createHealthBar falling back to its own (old) implementation.`);
    // ... (keep original CardFrame.js code for createHealthBar here for now) ...
}
And similar for updateHealth and getHealthBarColor in CardFrame.js.

5. VERIFY: Test Functionality
Load the game. The primary path should be CharacterSprite -> CardFrameManager -> CardFrameHealthComponent.
Verify health bars are created by CardFrameHealthComponent. Check logs.
Test that health updates (damage/healing) correctly trigger animations and visual changes handled by CardFrameHealthComponent.
Verify colors change correctly based on health percentage.
Ensure all error cases (e.g., component not loading) are handled gracefully with console warnings/errors.
Test edge cases (0 health, full health, multiple rapid updates).
Check for any new console errors related to health bar creation or updates.
6. REMOVE: Remove Original Implementation from CardFrame.js
After thorough verification that the CardFrameManager -> CardFrameHealthComponent path is working correctly:

Simplify the methods (createHealthBar, updateHealth, getHealthBarColor) in CardFrame.js to only contain the delegation logic to this.manager.
Remove the old, direct implementation code for these health functions from CardFrame.js. Example for CardFrame.js createHealthBar() after REMOVE step:
JavaScript

// In CardFrame.js
createHealthBar() {
    if (this.manager && typeof this.manager.createHealthBar === 'function') {
        this.manager.createHealthBar(); // Assuming it doesn't need to return the container to CardFrame
    } else {
        console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): Cannot create health bar - manager or its method is unavailable.`);
        // Minimal or no fallback if CardFrame is purely a facade.
    }
}
Implementation Checklist (Revised)
[ ] EXTRACT: Create CardFrameHealthComponent.js with the core logic for createHealthBar, updateHealth, getHealthBarColor, ensuring it adds its UI elements to the CardFrameManager container passed to it. Implement its destroy method.
[ ] SCRIPT LOAD: Update index.html to load CardFrameHealthComponent.js before CardFrameManager.js.
[ ] DELEGATE (Manager): Update CardFrameManager.js:
Initialize this.healthComponent (call initializeHealthComponent).
Implement initializeHealthComponent robustly (check window.CardFrameHealthComponent, instantiate, verify success, handle errors, nullify on failure).
Implement delegation methods (createHealthBar, updateHealth, getHealthBarColor) that call this.healthComponent, with checks for its existence and method availability.
Update CardFrameManager.destroy() to call this.healthComponent.destroy().
[ ] DELEGATE (Facade - Optional but Good Practice for Fallback): Review CardFrame.js. If it's still a potential fallback target, ensure its health methods attempt to delegate to this.manager. (Given 0.7.1.5, CharacterSprite should be using CardFrameManager directly, making this step less critical for the primary path but good for robustness if CardFrame is ever instantiated directly elsewhere).
[ ] VERIFY: Thoroughly test health bar creation, updates, animations, and colors. Check console for errors and successful initialization logs.
[ ] REMOVE: Once verified, remove the original health implementation code from CardFrame.js (if it was still being used as a fallback during delegation). If CardFrame.js is purely a facade to CardFrameManager, its methods would already be just delegation.
Detailed Method Analysis (Remains Relevant)
1. createHealthBar() in CardFrameHealthComponent
Responsibility: Creates health bar container, background, fill, and text. Adds these to a new container, which is then added to the CardFrameManager instance.
Dependencies: this.scene, this.config, this.typeColor, this.container (the CardFrameManager).
References Created: this.healthBarContainer, this.healthBarBg, this.healthBar, this.healthText.
2. updateHealth() in CardFrameHealthComponent
Responsibility: Updates health bar visuals when health changes.
Dependencies: this.healthBar, this.healthText, this.scene.tweens.
3. getHealthBarColor() in CardFrameHealthComponent
Responsibility: Returns color based on health percentage. (No changes needed from original).