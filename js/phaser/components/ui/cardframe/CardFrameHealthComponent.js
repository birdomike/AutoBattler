/**
 * CardFrameHealthComponent.js
 * Handles health bar rendering and updating for CardFrame.
 * Part of the component-based CardFrame refactoring project.
 * 
 * IMPORTANT: This component is the source of truth for all health bar styling, dimensions,
 * and positioning. To modify any aspect of the health bar, edit the configuration options 
 * in this file rather than in CardFrameManager.js.
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
        
        // Store configuration - define OUR defaults first, then merge with any externally provided config
        // This ensures OUR defaults take precedence over CardFrameManager values
        const ourDefaults = {
            // Health display configuration
            currentHealth: 100,
            maxHealth: 100,
            showHealth: true,
            healthBarWidth: 180, // Controls the width of the health bar (increased from 180)
            healthBarHeight: 18, // Slightly increased height to accommodate text better
            healthBarOffsetY: -145, // Vertical position of health bar - MODIFY THIS VALUE TO MOVE THE BAR UP/DOWN
            showHealthText: true,
            // Health bar styling
            healthBarBorderRadius: 4, // Rounded corners for health bar
            healthBarBevelWidth: 1, // Width of the bevel effect
            // Health text styling
            healthTextColor: '#FFFFFF',
            healthTextFontFamily: "'Cinzel', serif",
            healthTextFontSize: '11px', // Increased to 11px for better legibility
            healthTextStrokeColor: '#000000',
            healthTextStrokeThickness: 2
        };
        
        // Merge our defaults with the provided config, with our defaults taking precedence
        this.config = Object.assign({}, config, ourDefaults);
        
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
        try {
            // Create health bar container
            this.healthBarContainer = this.scene.add.container(
                0, 
                this.config.healthBarOffsetY
            );
            
            // Get configuration values
            const radius = this.config.healthBarBorderRadius || 3;
            const bevelWidth = this.config.healthBarBevelWidth || 1;
            
            // Create health bar background with rounded corners
            this.healthBarBg = this.scene.add.graphics();
            this.healthBarBg.fillStyle(0x000000, 0.7);
            this.healthBarBg.fillRoundedRect(
                -this.config.healthBarWidth / 2,
                -this.config.healthBarHeight / 2,
                this.config.healthBarWidth,
                this.config.healthBarHeight,
                radius
            );
            
            // Calculate health percentage
            const healthPercent = Math.max(0, Math.min(1, 
                this.config.currentHealth / this.config.maxHealth
            ));
            
            // Create health bar fill with rounded corners
            const barWidth = this.config.healthBarWidth - 4; // Slight padding
            const barHeight = this.config.healthBarHeight - 4; // Slight padding
            const healthColor = this.getHealthBarColor(healthPercent);
            
            this.healthBar = this.scene.add.graphics();
            this.healthBar.fillStyle(healthColor, 1);
            
            // Only use rounded corners if percentage isn't too low
            const adjustedWidth = Math.max(barWidth * healthPercent, radius * 2);
            
            if (healthPercent > 0) {
                this.healthBar.fillRoundedRect(
                    -barWidth / 2,
                    -barHeight / 2,
                    adjustedWidth,
                    barHeight,
                    healthPercent < 0.1 ? radius / 2 : radius
                );
            }
            
            // Add beveled edges for dimensionality
            // Convert health color to RGB components
            const colorObj = Phaser.Display.Color.ValueToColor(healthColor);
            const darkerColor = Phaser.Display.Color.GetColor(
                Math.max(0, colorObj.r - 50),
                Math.max(0, colorObj.g - 50),
                Math.max(0, colorObj.b - 50)
            );
            const lighterColor = Phaser.Display.Color.GetColor(
                Math.min(255, colorObj.r + 50),
                Math.min(255, colorObj.g + 50),
                Math.min(255, colorObj.b + 50)
            );
            
            // Create inner bevel (highlight at top, shadow at bottom)
            const innerBevel = this.scene.add.graphics().setName('innerBevel');
            
            // Top/left highlight (inner bevel light edge)
            innerBevel.lineStyle(bevelWidth, lighterColor, 0.7);
            // Draw top line with rounded corners
            innerBevel.beginPath();
            innerBevel.moveTo(-barWidth / 2 + radius, -barHeight / 2 + bevelWidth / 2);
            innerBevel.lineTo((-barWidth / 2) + Math.min(adjustedWidth, barWidth) - radius, -barHeight / 2 + bevelWidth / 2);
            innerBevel.strokePath();
            
            // Left line with rounded corner
            if (healthPercent > 0) {
                innerBevel.beginPath();
                innerBevel.moveTo(-barWidth / 2 + bevelWidth / 2, -barHeight / 2 + radius);
                innerBevel.lineTo(-barWidth / 2 + bevelWidth / 2, barHeight / 2 - radius);
                innerBevel.strokePath();
            }
            
            // Bottom/right shadow (inner bevel dark edge)
            innerBevel.lineStyle(bevelWidth, darkerColor, 0.7);
            // Draw bottom line with rounded corners
            innerBevel.beginPath();
            innerBevel.moveTo(-barWidth / 2 + radius, barHeight / 2 - bevelWidth / 2);
            innerBevel.lineTo((-barWidth / 2) + Math.min(adjustedWidth, barWidth) - radius, barHeight / 2 - bevelWidth / 2);
            innerBevel.strokePath();
            
            // Right line (only if health is visible)
            if (healthPercent > 0.05) {
                innerBevel.beginPath();
                innerBevel.moveTo((-barWidth / 2) + adjustedWidth - bevelWidth / 2, -barHeight / 2 + radius);
                innerBevel.lineTo((-barWidth / 2) + adjustedWidth - bevelWidth / 2, barHeight / 2 - radius);
                innerBevel.strokePath();
            }
            
            // Create outer frame
            const healthBarFrame = this.scene.add.graphics();
            healthBarFrame.lineStyle(1, 0xFFFFFF, 0.4);
            healthBarFrame.strokeRoundedRect(
                -this.config.healthBarWidth / 2 - 1, 
                -this.config.healthBarHeight / 2 - 1,
                this.config.healthBarWidth + 2, 
                this.config.healthBarHeight + 2,
                radius + 1
            );
            
            // Add components to health bar container
            this.healthBarContainer.add([this.healthBarBg, this.healthBar, innerBevel, healthBarFrame]);
            
            // Create health text if enabled - added AFTER other elements for proper rendering order
            if (this.config.showHealthText) {
                this.healthText = this.scene.add.text(
                    0, 0,
                    `${Math.round(this.config.currentHealth)}/${this.config.maxHealth}`,
                    {
                        fontFamily: this.config.healthTextFontFamily,
                        fontSize: '11px', // Increased from 10px for better legibility with Cinzel
                        fontStyle: 'bold', // Added to make Cinzel more readable at small sizes
                        color: this.config.healthTextColor,
                        stroke: this.config.healthTextStrokeColor,
                        strokeThickness: this.config.healthTextStrokeThickness,
                    }
                ).setOrigin(0.5);
                
                // Explicitly add health text last to ensure it's on top
                this.healthBarContainer.add(this.healthText);
            }
            
            // Add health bar container to main container
            this.container.add(this.healthBarContainer);
            
            return this.healthBarContainer;
        } catch (error) {
            console.error('CardFrameHealthComponent: Error creating health bar:', error);
            return null;
        }
    }
    
    /**
     * Update the health display.
     * @param {number} currentHealth - New current health value.
     * @param {number} maxHealth - New maximum health value (optional).
     * @param {boolean} animate - Whether to animate the change (default: true).
     */
    updateHealth(currentHealth, maxHealth = null, animate = true) {
        try {
            // Validate health values
            if (currentHealth === undefined || currentHealth === null) {
                console.warn('CardFrameHealthComponent: Invalid health value provided');
                return;
            }
            
            // Update stored health values
            this.config.currentHealth = currentHealth;
            
            if (maxHealth !== null) {
                this.config.maxHealth = maxHealth;
            }
            
            // Make sure health bar exists
            if (!this.healthBar || !this.healthBarContainer) {
                console.warn('CardFrameHealthComponent: Health bar not found, cannot update');
                return;
            }
            
            // Calculate health percentage
            const healthPercent = Math.max(0, Math.min(1, 
                this.config.currentHealth / this.config.maxHealth
            ));
            
            // Calculate new width
            const barWidth = this.config.healthBarWidth - 4; // Slight padding
            const newWidth = barWidth * healthPercent;
            
            // Get color based on health percentage
            const newColor = this.getHealthBarColor(healthPercent);
            
            // Store previous width for animation
            const oldWidth = this.healthBar.width;
            
            // Update health text if it exists
            if (this.healthText) {
                this.healthText.setText(`${Math.round(this.config.currentHealth)}/${this.config.maxHealth}`);
                
                // Ensure text uses current configuration
                this.healthText.setStyle({
                    fontFamily: this.config.healthTextFontFamily,
                    fontSize: this.config.healthTextFontSize,
                    fontStyle: 'bold',
                    color: this.config.healthTextColor,
                    stroke: this.config.healthTextStrokeColor,
                    strokeThickness: this.config.healthTextStrokeThickness
                });
            }
            
            // Decide whether to animate
            if (animate && this.scene && this.scene.tweens) {
                // Store animation values for redrawing
                this._animatingHealth = true;
                this._targetHealthPercent = healthPercent;
                this._startHealthPercent = oldWidth / barWidth;
                this._healthAnimStartTime = this.scene.time.now;
                this._healthAnimDuration = 300; // Duration in ms
                
                // Create a tween on a dummy object to track progress
                const dummyObj = { progress: 0 };
                this.scene.tweens.add({
                    targets: dummyObj,
                    progress: 1,
                    duration: this._healthAnimDuration,
                    ease: 'Sine.easeOut',
                    onUpdate: () => {
                        // Calculate interpolated values
                        const currentPercent = Phaser.Math.Linear(
                            this._startHealthPercent,
                            this._targetHealthPercent,
                            dummyObj.progress
                        );
                        
                        // Redraw health bar with current values
                        this._updateHealthBarGraphics(currentPercent);
                    },
                    onComplete: () => {
                        // Ensure final state is correct
                        this._updateHealthBarGraphics(this._targetHealthPercent);
                        this._animatingHealth = false;
                    }
                });
                
                // Add visual feedback based on health change
                if (oldWidth > newWidth) {
                    // Taking damage - shake health text
                    if (this.healthText) {
                        this.scene.tweens.add({
                            targets: this.healthText,
                            x: { from: -2, to: 0 },
                            duration: 100,
                            repeat: 1,
                            yoyo: true,
                            ease: 'Sine.easeInOut'
                        });
                    }
                } else if (oldWidth < newWidth) {
                    // Being healed - green flash
                    // Create healing glow overlay positioned at the portrait's position
                    const portraitY = this.config.portraitOffsetY || 0;
                    
                    const healGlow = this.scene.add.rectangle(
                        0, // Center horizontally
                        portraitY, // Position at portrait vertical position
                        200, // Use width/height similar to portrait dimensions
                        240,
                        0x00FF00, 0.3
                    );
                    
                    // Add directly to container
                    this.container.add(healGlow);
                    
                    // Ensure it's below key elements
                    healGlow.setDepth(90);
                    
                    // Animate and remove the glow
                    this.scene.tweens.add({
                        targets: healGlow,
                        alpha: 0,
                        duration: 400,
                        ease: 'Sine.easeOut',
                        onComplete: () => {
                            healGlow.destroy();
                        }
                    });
                    
                    // Bounce health text
                    if (this.healthText) {
                        this.scene.tweens.add({
                            targets: this.healthText,
                            y: { from: -2, to: 0 },
                            duration: 150,
                            yoyo: true,
                            ease: 'Bounce'
                        });
                    }
                }
            } else {
                // Direct update without animation
                this._updateHealthBarGraphics(healthPercent);
            }
        } catch (error) {
            console.error('CardFrameHealthComponent: Error updating health:', error);
        }
    }
    
    /**
     * Get the appropriate color for the health bar based on percentage.
     * @param {number} percent - Health percentage (0-1).
     * @returns {number} - Color as hex number.
     */
    getHealthBarColor(percent) {
        // Validate percent is a number and in range
        if (typeof percent !== 'number' || isNaN(percent)) {
            console.warn('CardFrameHealthComponent.getHealthBarColor: Invalid percentage value');
            return 0x00FF00; // Default to green
        }
        
        // Clamp to valid range
        const clampedPercent = Math.max(0, Math.min(1, percent));
        
        // Return color based on health percentage
        if (clampedPercent < 0.3) return 0xFF0000; // Red (low health)
        if (clampedPercent < 0.6) return 0xFFAA00; // Orange (medium health)
        return 0x00FF00; // Green (high health)
    }
    
    /**
     * Clean up all resources managed by this component.
     */
    /**
     * Updates the health bar graphics with the current health percentage
     * @param {number} healthPercent - Health percentage (0-1)
     * @private
     */
    _updateHealthBarGraphics(healthPercent) {
        try {
            if (!this.healthBar || !this.healthBar.scene) return;
            
            // Clear existing graphics
            this.healthBar.clear();
            
            // Get configuration values
            const radius = this.config.healthBarBorderRadius || 3;
            const barWidth = this.config.healthBarWidth - 4; // Slight padding
            const barHeight = this.config.healthBarHeight - 4; // Slight padding
            const healthColor = this.getHealthBarColor(healthPercent);
            
            // Fill the health bar
            this.healthBar.fillStyle(healthColor, 1);
            
            // Only use rounded corners if percentage isn't too low
            const adjustedWidth = Math.max(barWidth * healthPercent, radius * 2);
            
            if (healthPercent > 0) {
                this.healthBar.fillRoundedRect(
                    -barWidth / 2,
                    -barHeight / 2,
                    adjustedWidth,
                    barHeight,
                    healthPercent < 0.1 ? radius / 2 : radius
                );
            }
            
            // If there's an innerBevel, update it too
            const innerBevel = this.healthBarContainer.getByName('innerBevel');
            if (innerBevel && innerBevel.scene) {
                // Convert health color to RGB components
                const colorObj = Phaser.Display.Color.ValueToColor(healthColor);
                const darkerColor = Phaser.Display.Color.GetColor(
                    Math.max(0, colorObj.r - 50),
                    Math.max(0, colorObj.g - 50),
                    Math.max(0, colorObj.b - 50)
                );
                const lighterColor = Phaser.Display.Color.GetColor(
                    Math.min(255, colorObj.r + 50),
                    Math.min(255, colorObj.g + 50),
                    Math.min(255, colorObj.b + 50)
                );
                
                // Update bevel graphics
                innerBevel.clear();
                const bevelWidth = this.config.healthBarBevelWidth || 1;
                
                // Top/left highlight (inner bevel light edge)
                innerBevel.lineStyle(bevelWidth, lighterColor, 0.7);
                // Draw top line with rounded corners
                innerBevel.beginPath();
                innerBevel.moveTo(-barWidth / 2 + radius, -barHeight / 2 + bevelWidth / 2);
                innerBevel.lineTo((-barWidth / 2) + Math.min(adjustedWidth, barWidth) - radius, -barHeight / 2 + bevelWidth / 2);
                innerBevel.strokePath();
                
                // Left line with rounded corner
                if (healthPercent > 0) {
                    innerBevel.beginPath();
                    innerBevel.moveTo(-barWidth / 2 + bevelWidth / 2, -barHeight / 2 + radius);
                    innerBevel.lineTo(-barWidth / 2 + bevelWidth / 2, barHeight / 2 - radius);
                    innerBevel.strokePath();
                }
                
                // Bottom/right shadow (inner bevel dark edge)
                innerBevel.lineStyle(bevelWidth, darkerColor, 0.7);
                // Draw bottom line with rounded corners
                innerBevel.beginPath();
                innerBevel.moveTo(-barWidth / 2 + radius, barHeight / 2 - bevelWidth / 2);
                innerBevel.lineTo((-barWidth / 2) + Math.min(adjustedWidth, barWidth) - radius, barHeight / 2 - bevelWidth / 2);
                innerBevel.strokePath();
                
                // Right line (only if health is visible)
                if (healthPercent > 0.05) {
                    innerBevel.beginPath();
                    innerBevel.moveTo((-barWidth / 2) + adjustedWidth - bevelWidth / 2, -barHeight / 2 + radius);
                    innerBevel.lineTo((-barWidth / 2) + adjustedWidth - bevelWidth / 2, barHeight / 2 - radius);
                    innerBevel.strokePath();
                }
            }
        } catch (error) {
            console.error('CardFrameHealthComponent: Error updating health bar graphics:', error);
        }
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
