/**
 * CardFrameHealthComponent.js
 * Handles health bar rendering and updating for CardFrame.
 * Part of the component-based CardFrame refactoring project.
 * 
 * IMPORTANT: This component is the SINGLE SOURCE OF TRUTH for all health bar styling,
 * dimensions, and positioning. To modify ANY aspect of the health bar, edit the
 * configuration options in THIS file rather than in CardFrameManager.js.
 * 
 * CODE REVIEW GUIDELINE: Any PR that adds health-related configuration to
 * CardFrameManager.js should be rejected. All such configuration belongs here.
 */

/**
 * ===========================================
 * HEALTH COMPONENT CONFIGURATION DEFAULTS
 * Modify these values to customize health bar appearance and animations.
 * ===========================================
 */
const HEALTH_DEFAULTS = {
    // Health values
    values: {
        current: 100,           // Current health value
        max: 100,               // Maximum health value
    },
    
    // Display options
    display: {
        show: true,             // Whether to show health bar
        showText: true,         // Whether to show health text
    },
    
    // Health bar dimensions and position
    healthBar: {
        width: 180,             // Width of the health bar
        height: 18,             // Height of the health bar
        offsetY: -145,          // Vertical position of health bar
        borderRadius: 4,        // Rounded corners for health bar
        bevelWidth: 1,          // Width of the bevel effect
        padding: 4              // Padding inside background (calculated as barWidth - 4)
    },
    
    // Health text styling
    text: {
        color: '#FFFFFF',       // Color of health text
        fontFamily: "'Cinzel', serif", // Font family for health text
        fontSize: '15px',       // Font size for health text
        stroke: '#000000',      // Stroke color for health text
        strokeThickness: 2,     // Stroke thickness for health text
        fontStyle: 'bold'       // Font style for better readability
    },
    
    // Animations
    animation: {
        duration: 300,          // Duration of health change animations
        damage: {
            shakeAmount: 2,     // Amount of shake for damage animation
            shakeDuration: 100  // Duration of shake for damage animation
        },
        healing: {
            bounceAmount: 2,    // Amount of bounce for healing animation
            bounceDuration: 150, // Duration of bounce for healing animation
            glowWidth: 200,     // Width of healing glow effect
            glowHeight: 240,    // Height of healing glow effect
            glowColor: 0x00FF00, // Color of healing glow effect
            glowOpacity: 0.3    // Initial opacity of healing glow
        }
    },
    
    // Health status thresholds and colors
    healthStatus: {
        thresholds: {
            low: 0.3,           // Threshold for low health (0-1)
            medium: 0.6         // Threshold for medium health (0-1)
        },
        colors: {
            low: 0xFF0000,      // Color for low health
            medium: 0xFFAA00,   // Color for medium health
            high: 0x00FF00      // Color for high health
        }
    }
};
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
        
        // Configuration with defaults - reference the top-level defaults
        // IMPORTANT: Object.assign pattern ensures config values override defaults
        this.config = Object.assign({}, HEALTH_DEFAULTS, config);
        
        // Handle legacy property mapping for backward compatibility
        if (config.currentHealth !== undefined) this.config.values.current = config.currentHealth;
        if (config.maxHealth !== undefined) this.config.values.max = config.maxHealth;
        if (config.showHealth !== undefined) this.config.display.show = config.showHealth;
        if (config.showHealthText !== undefined) this.config.display.showText = config.showHealthText;
        if (config.healthBarWidth !== undefined) this.config.healthBar.width = config.healthBarWidth;
        if (config.healthBarHeight !== undefined) this.config.healthBar.height = config.healthBarHeight;
        if (config.healthBarOffsetY !== undefined) this.config.healthBar.offsetY = config.healthBarOffsetY;
        if (config.healthBarBorderRadius !== undefined) this.config.healthBar.borderRadius = config.healthBarBorderRadius;
        if (config.healthBarBevelWidth !== undefined) this.config.healthBar.bevelWidth = config.healthBarBevelWidth;
        if (config.healthTextColor !== undefined) this.config.text.color = config.healthTextColor;
        if (config.healthTextFontFamily !== undefined) this.config.text.fontFamily = config.healthTextFontFamily;
        if (config.healthTextFontSize !== undefined) this.config.text.fontSize = config.healthTextFontSize;
        if (config.healthTextStrokeColor !== undefined) this.config.text.stroke = config.healthTextStrokeColor;
        if (config.healthTextStrokeThickness !== undefined) this.config.text.strokeThickness = config.healthTextStrokeThickness;
        
        // Object references for Phaser GameObjects managed by this component
        this.healthBarContainer = null; // This will be a new container, added to the parent `this.container` (CardFrameManager)
        this.healthBarBg = null;
        this.healthBar = null;
        this.healthText = null;
        
        // Track current health percentage for smooth animations
        this._currentHealthPercent = Math.max(0, Math.min(1, 
            this.config.values.current / Math.max(1, this.config.values.max)
        ));
        
        // Initialize if health should be shown
        if (this.config.display.show) {
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
                this.config.healthBar.offsetY
            );
            
            // Get configuration values
            const radius = this.config.healthBar.borderRadius || 3;
            const bevelWidth = this.config.healthBar.bevelWidth || 1;
            
            // Create health bar background with rounded corners
            this.healthBarBg = this.scene.add.graphics();
            this.healthBarBg.fillStyle(0x000000, 0.7);
            this.healthBarBg.fillRoundedRect(
                -this.config.healthBar.width / 2,
                -this.config.healthBar.height / 2,
                this.config.healthBar.width,
                this.config.healthBar.height,
                radius
            );
            
            // Calculate health percentage (clamped 0-1)
            const healthPercent = Math.max(0, Math.min(1, 
                this.config.values.current / Math.max(1, this.config.values.max) // Prevent division by zero
            ));
            
            // Store initial health percentage for future animations
            this._currentHealthPercent = healthPercent;
            
            // Create health bar fill with rounded corners
            const barWidth = this.config.healthBar.width - this.config.healthBar.padding; // Slight padding
            const barHeight = this.config.healthBar.height - this.config.healthBar.padding; // Slight padding
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
            innerBevel.moveTo(-barWidth / 2 + radius, -barHeight / 2 + this.config.healthBar.bevelWidth / 2);
            innerBevel.lineTo((-barWidth / 2) + Math.min(adjustedWidth, barWidth) - radius, -barHeight / 2 + this.config.healthBar.bevelWidth / 2);
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
            if (this.config.display.showText) {
                this.healthText = this.scene.add.text(
                    0, 0,
                    `${Math.round(this.config.values.current)}/${this.config.values.max}`,
                    {
                        fontFamily: this.config.text.fontFamily,
                        fontSize: this.config.text.fontSize,
                        fontStyle: this.config.text.fontStyle,
                        color: this.config.text.color,
                        stroke: this.config.text.stroke,
                        strokeThickness: this.config.text.strokeThickness,
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
            this.config.values.current = currentHealth;
            
            if (maxHealth !== null) {
                this.config.values.max = maxHealth;
            }
            
            // Calculate the new health percentage
            const newHealthPercent = Math.max(0, Math.min(1, 
                this.config.values.current / Math.max(1, this.config.values.max) // Prevent division by zero
            ));
            
            // Make sure health bar exists
            if (!this.healthBar || !this.healthBarContainer) {
                console.warn('CardFrameHealthComponent: Health bar not found, cannot update');
                return;
            }
            
            // Previous calculation already done above
            // We'll use newHealthPercent instead
            
            // Calculate new width
            const barWidth = this.config.healthBar.width - this.config.healthBar.padding; // Slight padding
            const newWidth = barWidth * newHealthPercent;
            
            // Get color based on health percentage
            const newColor = this.getHealthBarColor(newHealthPercent);
            
            // Store previous health percentage for animation
            const previousHealthPercent = this._currentHealthPercent;
            
            // Update health text if it exists
            if (this.healthText) {
                this.healthText.setText(`${Math.round(this.config.values.current)}/${this.config.values.max}`);
                
                // Ensure text uses current configuration
                this.healthText.setStyle({
                    fontFamily: this.config.text.fontFamily,
                    fontSize: this.config.text.fontSize,
                    fontStyle: this.config.text.fontStyle,
                    color: this.config.text.color,
                    stroke: this.config.text.stroke,
                    strokeThickness: this.config.text.strokeThickness
                });
            }
            
            // Decide whether to animate
            if (animate && this.scene && this.scene.tweens) {
                // Store animation values for redrawing
                this._animatingHealth = true;
                this._targetHealthPercent = newHealthPercent;
                this._startHealthPercent = previousHealthPercent; // Use tracked percentage instead of width
                this._healthAnimStartTime = this.scene.time.now;
                this._healthAnimDuration = this.config.animation.duration; // Duration in ms
                
                // Update the current percentage for next animation
                this._currentHealthPercent = newHealthPercent;
                
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
                if (previousHealthPercent > newHealthPercent) {
                    // Taking damage - shake health text
                    if (this.healthText) {
                        this.scene.tweens.add({
                            targets: this.healthText,
                            x: { from: -this.config.animation.damage.shakeAmount, to: 0 },
                            duration: this.config.animation.damage.shakeDuration,
                            repeat: 1,
                            yoyo: true,
                            ease: 'Sine.easeInOut'
                        });
                    }
                } else if (previousHealthPercent < newHealthPercent) {
                    // Being healed - green flash
                    // Create healing glow overlay positioned at the portrait's position
                    const portraitY = this.config.portrait ? this.config.portrait.offsetY : 0;
                    
                    const healGlow = this.scene.add.rectangle(
                        0, // Center horizontally
                        portraitY, // Position at portrait vertical position
                        this.config.animation.healing.glowWidth, // Use width/height from config
                        this.config.animation.healing.glowHeight,
                        this.config.animation.healing.glowColor, 
                        this.config.animation.healing.glowOpacity
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
                            y: { from: -this.config.animation.healing.bounceAmount, to: 0 },
                            duration: this.config.animation.healing.bounceDuration,
                            yoyo: true,
                            ease: 'Bounce'
                        });
                    }
                }
            } else {
                // Direct update without animation
                this._updateHealthBarGraphics(newHealthPercent);
                
                // Update the current percentage for next animation
                this._currentHealthPercent = newHealthPercent;
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
        // Enhanced validation for percent - catches NaN, undefined, null, and non-numbers
        if (percent === undefined || percent === null || typeof percent !== 'number' || isNaN(percent)) {
            console.warn('CardFrameHealthComponent.getHealthBarColor: Invalid percentage value, using current health percentage');
            // Use tracked health percentage as fallback instead of defaulting to 100%
            percent = this._currentHealthPercent || 0;
        }
        
        // Clamp to valid range using Phaser's Math utility if available
        const clampedPercent = this.scene && this.scene.math ? 
            this.scene.math.clamp(percent, 0, 1) : 
            Math.max(0, Math.min(1, percent));
        
        // Return color based on health percentage
        if (clampedPercent < this.config.healthStatus.thresholds.low) return this.config.healthStatus.colors.low; // Red (low health)
        if (clampedPercent < this.config.healthStatus.thresholds.medium) return this.config.healthStatus.colors.medium; // Orange (medium health)
        return this.config.healthStatus.colors.high; // Green (high health)
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
            
            // Validate the health percent (defensive programming)
            if (healthPercent === undefined || healthPercent === null || typeof healthPercent !== 'number' || isNaN(healthPercent)) {
                console.warn('CardFrameHealthComponent._updateHealthBarGraphics: Invalid percentage value, using current tracked percentage');
                healthPercent = this._currentHealthPercent || 0;
            }
            
            // Ensure healthPercent is properly clamped
            healthPercent = Math.max(0, Math.min(1, healthPercent));
            
            // Clear existing graphics
            this.healthBar.clear();
            
            // Get configuration values
            const radius = this.config.healthBar.borderRadius || 3;
            const barWidth = this.config.healthBar.width - this.config.healthBar.padding; // Slight padding
            const barHeight = this.config.healthBar.height - this.config.healthBar.padding; // Slight padding
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
