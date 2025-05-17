/**
 * CardFrameInteractionComponent.js
 * Handles interaction behavior for the CardFrame component
 * Part of the component-based CardFrame refactoring project (Phase 3.4)
 * 
 * IMPORTANT: This component is the SINGLE SOURCE OF TRUTH for all interaction behaviors,
 * hover effects, and selection/highlight animations. To modify ANY aspect of card
 * interaction, edit the configuration options in THIS file rather than in CardFrameManager.js.
 * 
 * CODE REVIEW GUIDELINE: Any PR that adds interaction-related configuration to
 * CardFrameManager.js should be rejected. All such configuration belongs here.
 */

/**
 * ===========================================
 * INTERACTION COMPONENT CONFIGURATION DEFAULTS
 * Modify these values to customize hover and selection effects.
 * ===========================================
 */
const INTERACTION_DEFAULTS = {
    // Interaction behavior
    interactive: false,         // Whether card is interactive
    hoverEnabled: true,         // Whether hover effects are enabled
    
    // Callbacks
    callbacks: {
        onSelect: null,         // Callback when card is selected
        onHoverStart: null,     // Callback when hover starts
        onHoverEnd: null        // Callback when hover ends
    },
    
    // Animation settings
    animation: {
        hoverScale: 1.05,       // Scale factor when hovering
        selectedScale: 1.1,     // Scale factor when selected
        duration: 150,          // Duration of animations in ms
        pulseDuration: 600      // Duration of pulse animation in ms
    },
    
    // Glow effects
    glow: {
        intensity: 0.7,         // Base intensity of glow effect (0-1)
        highlightMultiplier: 1.5, // Intensity multiplier for highlighted state
        layers: 3,              // Number of glow layers for effect smoothness
        paddingBase: 5,         // Base padding for glow effect
        paddingIncrement: 3,    // Padding increment per layer
        opacityBase: 0.2,       // Base opacity for glow effect
        opacityDecrement: 0.2   // Opacity reduction per layer
    },
    
    // Active Turn Highlight settings
    activeTurn: {
        glowColorPlayer: 0x4488FF,     // Blue glow for player team
        glowColorEnemy: 0xFF4444,      // Red glow for enemy team
        glowIntensity: 1.0,            // Intensity of the glow effect (0-1)
        pulseScale: 1.05,              // Scale factor during pulse animation
        pulseDuration: 700,            // Duration of one pulse cycle in ms
        priority: true                 // Whether turn highlighting takes visual priority over selection
    },
    
    // Initial state
    state: {
        selected: false,        // Whether card is initially selected
        highlighted: false      // Whether card is initially highlighted
    }
};
class CardFrameInteractionComponent {
    /**
     * Create a new CardFrameInteractionComponent
     * @param {Phaser.Scene} scene - The scene this component belongs to
     * @param {Phaser.GameObjects.Container} container - The parent CardFrameManager container
     * @param {number} typeColor - The type color to use for effects
     * @param {Object} config - Configuration options
     */
    constructor(scene, container, typeColor, config = {}) {
        // Validate required parameters
        if (!scene || !container) {
            console.error('CardFrameInteractionComponent constructor: Missing required parameters (scene or container). Component will not initialize.');
            throw new Error('CardFrameInteractionComponent: Missing required scene or container parameters.'); // Fail fast
        }
        
        this.scene = scene;
        this.container = container; // This is the CardFrameManager instance
        this.typeColor = typeColor || 0xAAAAAA; // Default to neutral gray if no type color provided
        
        // Configuration with defaults - reference the top-level defaults
        // IMPORTANT: Object.assign pattern ensures config values override defaults
        this.config = Object.assign({}, INTERACTION_DEFAULTS, config);
        
        // Handle legacy property mapping for backward compatibility
        if (config.onSelect !== undefined) this.config.callbacks.onSelect = config.onSelect;
        if (config.onHoverStart !== undefined) this.config.callbacks.onHoverStart = config.onHoverStart;
        if (config.onHoverEnd !== undefined) this.config.callbacks.onHoverEnd = config.onHoverEnd;
        if (config.hoverScale !== undefined) this.config.animation.hoverScale = config.hoverScale;
        if (config.selectedScale !== undefined) this.config.animation.selectedScale = config.selectedScale;
        if (config.animationDuration !== undefined) this.config.animation.duration = config.animationDuration;
        if (config.glowIntensity !== undefined) this.config.glow.intensity = config.glowIntensity;
        if (config.selected !== undefined) this.config.state.selected = config.selected;
        if (config.highlighted !== undefined) this.config.state.highlighted = config.highlighted;
        
        // Store internal state
        this._highlighted = this.config.state.highlighted || false;
        this._selected = this.config.state.selected || false;
    this._activeTurn = false; // New state for active turn highlighting
        
        // Reference to important objects
        this.frameBase = null; // Will be set by setupInteractivity
        this.glowContainer = null; // Reference to the glow container
        
        console.log(`CardFrameInteractionComponent: Initialized for character ${this.config.characterName || 'Unknown'}`);
    }
    
    /**
     * Initialize the component with required references
     * @param {Phaser.GameObjects.GameObject} frameBase - The main frame object for interactivity
     * @param {Phaser.GameObjects.Container} glowContainer - Container for glow effects
     */
    initialize(frameBase, glowContainer) {
        try {
            if (!frameBase || !frameBase.scene) {
                console.error('CardFrameInteractionComponent.initialize: Invalid frameBase provided');
                return false;
            }
            
            if (!glowContainer || !glowContainer.scene) {
                console.error('CardFrameInteractionComponent.initialize: Invalid glowContainer provided');
                return false;
            }
            
            this.frameBase = frameBase;
            this.glowContainer = glowContainer;
            
            // Setup interactions if enabled
            if (this.config.interactive || this.config.hoverEnabled) {
                this.setupInteractivity();
            }
            
            // Set initial states
            if (this._selected) {
                this.setSelected(true, false); // Set selected without animation
            }
            
            if (this._highlighted) {
                this.setHighlighted(true, false); // Set highlighted without animation
            }
            
            return true;
        } catch (error) {
            console.error('CardFrameInteractionComponent.initialize: Error initializing component:', error);
            return false;
        }
    }
    
    /**
     * Setup interactivity for hovering and selection
     */
    setupInteractivity() {
        try {
            if (!this.frameBase || !this.frameBase.scene) {
                console.error('CardFrameInteractionComponent.setupInteractivity: frameBase not set or invalid');
                return false;
            }
            
            // Ensure the frameBase is interactive
            if (!this.frameBase.input) {
                // If not already interactive, make it interactive with a full-size hit area
                const hitArea = new Phaser.Geom.Rectangle(
                    -this.config.width / 2,
                    -this.config.height / 2,
                    this.config.width,
                    this.config.height
                );
                
                this.frameBase.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            }
            
            // Add hover effects
            if (this.config.hoverEnabled) {
                this.frameBase.on('pointerover', () => {
                    if (!this._selected) {
                        this.scene.tweens.add({
                            targets: this.container,
                            scaleX: this.config.animation.hoverScale,
                            scaleY: this.config.animation.hoverScale,
                            duration: this.config.animation.duration,
                            ease: 'Sine.easeOut'
                        });
                        
                        // Add partial glow effect
                        this.addGlowEffect(this.config.glow.intensity / 2);
                        
                        // Set cursor
                        document.body.style.cursor = 'pointer';
                        
                        // Call onHoverStart callback if provided
                        if (typeof this.config.callbacks.onHoverStart === 'function') {
                            this.config.callbacks.onHoverStart();
                        }
                    }
                });
                
                this.frameBase.on('pointerout', () => {
                    if (!this._selected) {
                        this.scene.tweens.add({
                            targets: this.container,
                            scaleX: 1,
                            scaleY: 1,
                            duration: this.config.animation.duration,
                            ease: 'Sine.easeOut'
                        });
                        
                        // Remove glow effect
                        this.removeGlowEffect();
                        
                        // Reset cursor
                        document.body.style.cursor = 'default';
                        
                        // Call onHoverEnd callback if provided
                        if (typeof this.config.callbacks.onHoverEnd === 'function') {
                            this.config.callbacks.onHoverEnd();
                        }
                    }
                });
            }
            
            // Add selection handler
            if (this.config.interactive) {
                this.frameBase.on('pointerdown', () => {
                    // Toggle selection state
                    this.setSelected(!this._selected);
                    
                    // Call selection callback if provided
                    if (this.config.callbacks.onSelect) {
                        this.config.callbacks.onSelect(this.container);
                    }
                });
            }
            
            return true;
        } catch (error) {
            console.error('CardFrameInteractionComponent: Error setting up interactivity:', error);
            return false;
        }
    }
    
    /**
     * Add a glow effect around the card
     * @param {number} intensity - Glow intensity (0-1)
     */
    addGlowEffect(intensity) {
        try {
            if (!this.glowContainer || !this.glowContainer.scene) {
                console.error('CardFrameInteractionComponent.addGlowEffect: glowContainer not set or invalid');
                return null;
            }
            
            // Clear any existing glow
            this.removeGlowEffect();
            
            // Create glow graphics
            const glow = this.scene.add.graphics();
            
            // Set color based on type or status
            const glowColor = this._highlighted ? 0xFFFFFF : this.typeColor;
            
            // Apply different glow intensities based on state
            let appliedIntensity = intensity;
            if (this._highlighted) {
                appliedIntensity = Math.min(1, intensity * this.config.glow.highlightMultiplier);
            }
            
            // Draw multiple glow layers for a soft effect
            for (let i = 0; i < this.config.glow.layers; i++) {
                const padding = this.config.glow.paddingBase + (i * this.config.glow.paddingIncrement);
                glow.fillStyle(glowColor, this.config.glow.opacityBase * appliedIntensity * (1 - i * this.config.glow.opacityDecrement));
                glow.fillRoundedRect(
                    -this.config.width / 2 - padding,
                    -this.config.height / 2 - padding,
                    this.config.width + (padding * 2),
                    this.config.height + (padding * 2),
                    this.config.cornerRadius + padding / 2
                );
            }
            
            // Add to glow container
            this.glowContainer.add(glow);
            
            return glow;
        } catch (error) {
            console.error('CardFrameInteractionComponent: Error adding glow effect:', error);
            return null;
        }
    }
    
    /**
     * Remove glow effect
     */
    removeGlowEffect() {
        try {
            if (!this.glowContainer || !this.glowContainer.scene) {
                console.error('CardFrameInteractionComponent.removeGlowEffect: glowContainer not set or invalid');
                return false;
            }
            
            this.glowContainer.removeAll(true); // Remove and destroy all children
            return true;
        } catch (error) {
            console.error('CardFrameInteractionComponent: Error removing glow effect:', error);
            return false;
        }
    }
    
    /**
     * Set the selection state of the card
     * @param {boolean} selected - Whether the card is selected
     * @param {boolean} animate - Whether to animate the change (default: true)
     */
    setSelected(selected, animate = true) {
        try {
            // Store selection state
            this._selected = selected;
            
            if (!this.container || !this.container.scene) {
                console.error('CardFrameInteractionComponent.setSelected: container not set or invalid');
                return false;
            }
            
            if (animate && this.scene && this.scene.tweens) {
                // Animate scale change
                this.scene.tweens.add({
                    targets: this.container,
                    scaleX: selected ? this.config.animation.selectedScale : 1,
                    scaleY: selected ? this.config.animation.selectedScale : 1,
                    duration: this.config.animation.duration,
                    ease: 'Sine.easeOut'
                });
            } else {
                // Direct update without animation
                this.container.setScale(selected ? this.config.animation.selectedScale : 1);
            }
            
            // Update glow effect
            if (selected) {
                this.addGlowEffect(this.config.glow.intensity);
            } else if (!this._highlighted) {
                // Only remove glow if not highlighted
                this.removeGlowEffect();
            }
            
            return true;
        } catch (error) {
            console.error('CardFrameInteractionComponent: Error setting selected state:', error);
            return false;
        }
    }
    
    /**
     * Set the highlight state of the card (e.g., for active turn)
     * @param {boolean} highlighted - Whether the card is highlighted
     * @param {boolean} animate - Whether to animate the change (default: true)
     */
    setHighlighted(highlighted, animate = true) {
        try {
            // Store highlight state
            this._highlighted = highlighted;
            
            if (!this.container || !this.container.scene) {
                console.error('CardFrameInteractionComponent.setHighlighted: container not set or invalid');
                return false;
            }
            
            // Add pulsing highlight if highlighted
            if (highlighted) {
                // Add strong white glow
                this.addGlowEffect(this.config.glow.intensity);
                
                if (animate && this.scene && this.scene.tweens) {
                    // Add pulsing animation
                    this.scene.tweens.add({
                        targets: this.container,
                        scaleX: { from: 1, to: this.config.animation.hoverScale },
                        scaleY: { from: 1, to: this.config.animation.hoverScale },
                        duration: this.config.animation.pulseDuration,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            } else {
                // Stop pulsing animation
                if (this.scene && this.scene.tweens) {
                    this.scene.tweens.killTweensOf(this.container);
                }
                
                // Reset scale unless selected
                if (!this._selected) {
                    if (animate && this.scene && this.scene.tweens) {
                        this.scene.tweens.add({
                            targets: this.container,
                            scaleX: 1,
                            scaleY: 1,
                            duration: this.config.animation.duration,
                            ease: 'Sine.easeOut'
                        });
                    } else {
                        this.container.setScale(1);
                    }
                    
                    // Remove glow effect
                    this.removeGlowEffect();
                }
            }
            
            return true;
        } catch (error) {
            console.error('CardFrameInteractionComponent: Error setting highlighted state:', error);
            return false;
        }
    }
    
    /**
     * Detach all event listeners and prepare for component destruction
     */
    cleanup() {
        try {
            // Remove event listeners if frameBase exists
            if (this.frameBase && this.frameBase.scene) {
                this.frameBase.off('pointerover');
                this.frameBase.off('pointerout');
                this.frameBase.off('pointerdown');
                
                // Disable interactivity to prevent further events
                if (this.frameBase.input) {
                    this.frameBase.disableInteractive();
                }
            }
            
            // Stop any tweens
            if (this.scene && this.scene.tweens) {
                // Stop animations on container
                if (this.container) {
                    this.scene.tweens.killTweensOf(this.container);
                }
                
                // Stop animations on glow effects
                if (this.glowContainer) {
                    this.glowContainer.getAll().forEach(child => {
                        this.scene.tweens.killTweensOf(child);
                    });
                }
                
                // Clean up active turn tween
                if (this.activeTurnTween) {
                    this.scene.tweens.remove(this.activeTurnTween);
                    this.activeTurnTween = null;
                }
            }
            
            // Clean up active turn glow
            if (this.activeTurnGlow) {
                this.activeTurnGlow.destroy();
                this.activeTurnGlow = null;
            }
            
            // Reset cursor if needed
            document.body.style.cursor = 'default';
            
            return true;
        } catch (error) {
            console.error('CardFrameInteractionComponent: Error during cleanup:', error);
            return false;
        }
    }
    
    /**
     * Show active turn highlighting for the character
     * Indicates that it's this character's turn in battle
     * @param {string} teamType - 'player' or 'enemy' team
     * @returns {boolean} - Success state
     */
    showActiveTurnHighlight(teamType) {
        try {
            // Set active turn state
            this._activeTurn = true;
            
            if (!this.container || !this.container.scene) {
                console.error('CardFrameInteractionComponent.showActiveTurnHighlight: container not set or invalid');
                return false;
            }
            
            // Get appropriate glow color based on team
            let glowColor;
            if (teamType === 'player') {
                glowColor = this.config.activeTurn.glowColorPlayer;
            } else if (teamType === 'enemy') {
                glowColor = this.config.activeTurn.glowColorEnemy;
            } else {
                // Default to type color if team not specified
                glowColor = this.typeColor;
                console.warn(`CardFrameInteractionComponent: Unknown team type '${teamType}', using type color for active turn glow`);
            }
            
            // Stop any existing active turn tweens
            if (this.activeTurnTween) {
                this.scene.tweens.remove(this.activeTurnTween);
                this.activeTurnTween = null;
            }
            
            // Apply glow effect
            this.applyActiveTurnGlow(glowColor);
            
            // Start pulsing animation
            if (this.config.activeTurn.pulseScale > 1.0) {
                this.activeTurnTween = this.scene.tweens.add({
                    targets: this.container,
                    scaleX: { from: 1, to: this.config.activeTurn.pulseScale },
                    scaleY: { from: 1, to: this.config.activeTurn.pulseScale },
                    duration: this.config.activeTurn.pulseDuration,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
            
            return true;
        } catch (error) {
            console.error('CardFrameInteractionComponent: Error showing active turn highlight:', error);
            return false;
        }
    }
    
    /**
     * Apply the active turn glow effect
     * @private
     * @param {number} glowColor - Color for the glow effect
     */
    applyActiveTurnGlow(glowColor) {
        try {
            if (!this.glowContainer || !this.glowContainer.scene) {
                console.error('CardFrameInteractionComponent.applyActiveTurnGlow: glowContainer not set or invalid');
                return;
            }
            
            // Clear existing glow effects if this is the active turn (priority)
            if (this.config.activeTurn.priority) {
                this.removeGlowEffect();
            }
            
            // Create a new graphics object for the active turn glow
            const activeTurnGlow = this.scene.add.graphics();
            
            // Apply a stronger glow effect with more layers for a more distinct look
            const intensity = this.config.activeTurn.glowIntensity;
            const layers = this.config.glow.layers + 1; // Add one extra layer for active turn
            
            // Draw multiple glow layers for a soft effect
            for (let i = 0; i < layers; i++) {
                const padding = this.config.glow.paddingBase + (i * this.config.glow.paddingIncrement);
                const layerOpacity = this.config.glow.opacityBase * intensity * (1 - i * this.config.glow.opacityDecrement);
                
                activeTurnGlow.fillStyle(glowColor, layerOpacity);
                activeTurnGlow.fillRoundedRect(
                    -this.config.width / 2 - padding,
                    -this.config.height / 2 - padding,
                    this.config.width + (padding * 2),
                    this.config.height + (padding * 2),
                    this.config.cornerRadius + padding / 2
                );
            }
            
            // Add to glow container
            this.glowContainer.add(activeTurnGlow);
            
            // Store reference to this specific glow for removal later
            this.activeTurnGlow = activeTurnGlow;
        } catch (error) {
            console.error('CardFrameInteractionComponent: Error applying active turn glow:', error);
        }
    }
    
    /**
     * Hide active turn highlighting for the character
     * Used when it's no longer this character's turn
     * @returns {boolean} - Success state
     */
    hideActiveTurnHighlight() {
        try {
            // Set active turn state
            this._activeTurn = false;
            
            if (!this.container || !this.container.scene) {
                console.error('CardFrameInteractionComponent.hideActiveTurnHighlight: container not set or invalid');
                return false;
            }
            
            // Stop active turn tween
            if (this.activeTurnTween) {
                this.scene.tweens.remove(this.activeTurnTween);
                this.activeTurnTween = null;
            }
            
            // Reset scale if no other effects are active
            if (!this._selected && !this._highlighted) {
                this.container.setScale(1);
            }
            
            // Remove active turn glow
            if (this.activeTurnGlow && this.glowContainer) {
                this.activeTurnGlow.destroy();
                this.activeTurnGlow = null;
            }
            
            // Restore selection glow if the card was selected
            if (this._selected) {
                this.addGlowEffect(this.config.glow.intensity);
            } else if (this._highlighted) {
                // If highlighted but not selected, restore highlighting
                this.setHighlighted(true, false); // No animation needed
            }
            
            return true;
        } catch (error) {
            console.error('CardFrameInteractionComponent: Error hiding active turn highlight:', error);
            return false;
        }
    }
    
    destroy() {
        try {
            console.log(`CardFrameInteractionComponent: Destroying interaction component for ${this.config.characterName || 'Unknown'}`);
            
            // Execute cleanup first
            this.cleanup();
            
            // Remove glow effects
            this.removeGlowEffect();
            
            // Clear references
            this.frameBase = null;
            this.glowContainer = null;
            this.scene = null;
            this.container = null;
            this.config = null;
            
            return true;
        } catch (error) {
            console.error('CardFrameInteractionComponent: Error during destroy:', error);
            return false;
        }
    }
}

// Export for module use (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardFrameInteractionComponent;
}

// Make available globally for current script loading setup
if (typeof window !== 'undefined') {
    window.CardFrameInteractionComponent = CardFrameInteractionComponent;
} else {
    console.error('CardFrameInteractionComponent: Window object not found. Cannot attach to global scope.');
}
