/**
 * CardFrameVisualComponent.js
 * Handles the visual aspects of the card frame including frame, backdrop, and visual effects
 * Part of the component-based CardFrame refactoring project
 * 
 * IMPORTANT: This component is the SINGLE SOURCE OF TRUTH for the card's overall dimensions,
 * frame, backdrop, and visual effects ONLY. It does NOT control the layout of internal
 * elements (portrait, nameplate, health bar).
 * 
 * CODE REVIEW GUIDELINE: Any PR that adds visual-related configuration to
 * CardFrameManager.js should be rejected. All such configuration belongs here.
 */

/**
 * ===========================================
 * VISUAL COMPONENT CONFIGURATION DEFAULTS
 * Modify these values to customize visual appearance.
 * These will be applied as base values and can be overridden
 * by card variants and specific config.
 * ===========================================
 */
const VISUAL_DEFAULTS = {
    // Core dimensions (one standard size)
    width: 240,                 // Standard card width
    height: 320,                // Standard card height
    borderWidth: 6,            // Width of frame border
    cornerRadius: 12,           // Corner radius for frame
    
    // Appearance
    frameTexture: 'card-frame', // Base texture for card frame
    frameAlpha: 1,              // Opacity of the frame
    frameColorIntensity: 0.7,   // Intensity of type coloring (0-1)
    backgroundAlpha: .2,        // Background opacity
    
    // Depth Effects
    depthEffects: {
        enabled: true,          // Master toggle for all depth effects
        innerGlow: {
            enabled: true,      // Enable inner glow effect
            intensity: 0.3,     // Intensity of inner glow (0-1)
            layers: 4           // Number of glow layers
        },
        edgeEffects: {
            enabled: true,      // Enable edge highlights and shadows
            highlightBrightness: 100, // How much brighter the highlights are (%)
            shadowDarkness: 40, // How much darker the shadows are (%)
            width: 1.5,         // Width of edge effect lines
            opacity: 0.6,       // Opacity of edge effects (0-1)
            cornerOpacityReduction: 0.8 // Opacity reduction for corner effects
        }
    },
    
    // Fallback frame options
    fallback: {
        lineWidth: 4,           // Line width for fallback frame
        frameAlpha: 1           // Opacity of fallback frame
    },
    
    // Debug visualization
    debug: {
        enabled: false,         // Show debug information/boundaries
        colors: {
            boundary: 0xFF00FF, // Color for card boundary visualization
            centerPoint: 0xFFFF00 // Color for center point visualization
        },
        centerPointSize: 10     // Size of center point indicator lines
    }
};


class CardFrameVisualComponent {
    /**
     * Create a new CardFrameVisualComponent
     * @param {Phaser.Scene} scene - The scene this component belongs to
     * @param {Phaser.GameObjects.Container} container - The parent container this component will add GameObjects to
     * @param {number} typeColor - The color to use for type-themed elements
     * @param {Object} config - Configuration options
     */
    constructor(scene, container, typeColor, config = {}) {
        // Validate required parameters
        if (!scene || !container) {
            console.error('CardFrameVisualComponent: Missing required parameters (scene or container)');
            throw new Error('CardFrameVisualComponent: Missing required parameters');
        }
        
        this.scene = scene;
        this.container = container;
        this.typeColor = typeColor || 0xAAAAAA; // Default to neutral gray if no type color provided
        
        // Configuration merging logic to establish this component as the Single Source of Truth
        // for visual styling, while allowing specific overrides where needed
        this.config = { ...VISUAL_DEFAULTS, ...config };
        
        // Map legacy debugMode property to new structure for backward compatibility
        if (config.debugMode !== undefined) {
            this.config.debug.enabled = config.debugMode;
        }
        
        // Object references for created GameObjects
        this.frameBase = null;
        this.backdrop = null;
        this.innerGlowGraphics = null;
        this.edgeEffects = null;
        this.whiteHighlightFrameLayer = null;
        
        // Initialize the visual elements
        this.initialize();
        
        console.log(`CardFrameVisualComponent: Initialized for type color 0x${this.typeColor.toString(16).padStart(6, '0').toUpperCase()}`);
    }
    
    /**
     * Initialize all visual elements
     */
    initialize() {
        try {
            // Create components in proper layer order for visual depth
            const backdrop = this.createBackdrop();
            
            // Add inner glow effect if enabled
            if (this.config.depthEffects.enabled && this.config.depthEffects.innerGlow.enabled) {
                const innerGlow = this.createInnerGlowEffect();
            }
            
            // Create base frame
            const baseFrame = this.createBaseFrame();
            
            // Add edge depth effects if enabled
            if (this.config.depthEffects.enabled && this.config.depthEffects.edgeEffects.enabled) {
                const edgeEffects = this.addEdgeDepthEffects();
            }
            
            // Add debug visuals if enabled
            if (this.config.debug.enabled) {
                const debugVisuals = this.createDebugVisuals();
            }
        } catch (error) {
            console.error('CardFrameVisualComponent: Error during initialization:', error);
            // Continue with partial initialization rather than throwing
        }
    }
    
    /**
     * Create the backdrop rectangle for the card
     * @returns {Phaser.GameObjects.Rectangle} The created backdrop
     */
    createBackdrop() {
        try {
            // Create semi-transparent background fill
            const bgRect = this.scene.add.rectangle(
                0, 0,
                this.config.width - (this.config.borderWidth * 2) + 2, // Adjusted to reduce gap with frame
                this.config.height - (this.config.borderWidth * 2) + 2, // Adjusted to reduce gap with frame
                this.typeColor,
                this.config.backgroundAlpha
            );
            
            // Add to parent container
            this.container.add(bgRect);
            
            // Store reference for later use
            this.backdrop = bgRect;
            
            return bgRect;
        } catch (error) {
            console.error('CardFrameVisualComponent: Error creating backdrop:', error);
            return null;
        }
    }
    
    /**
     * Create inner glow effect that matches the card's type color
     * @returns {Phaser.GameObjects.Graphics} The created inner glow graphics object
     */
    createInnerGlowEffect() {
        try {
            // Get configuration options
            const {
                intensity,
                layers
            } = this.config.depthEffects.innerGlow;
            
            // Create graphics object for glow effect
            const glowGraphics = this.scene.add.graphics();
            
            // Get card dimensions
            const width = this.config.width;
            const height = this.config.height;
            const borderWidth = this.config.borderWidth;
            const cornerRadius = this.config.cornerRadius;
            
            // Create multiple concentric rectangles with decreasing opacity
            for (let i = 0; i < layers; i++) {
                // Calculate padding for this layer (decreases for inner layers)
                const layerPadding = borderWidth - (i * (borderWidth / layers));
                
                // Calculate opacity for this layer (decreases for inner layers)
                const layerOpacity = intensity * (1 - (i / layers));
                
                // Draw glow layer - Note: This is drawn at the frame border, not the backdrop
                glowGraphics.fillStyle(this.typeColor, layerOpacity);
                glowGraphics.fillRoundedRect(
                    -width / 2 + layerPadding,
                    -height / 2 + layerPadding,
                    width - (layerPadding * 2),
                    height - (layerPadding * 2),
                    cornerRadius
                );
            }
            
            // Add to parent container
            this.container.add(glowGraphics);
            
            // Store reference for cleanup
            this.innerGlowGraphics = glowGraphics;
            
            return glowGraphics;
        } catch (error) {
            console.error('CardFrameVisualComponent: Error creating inner glow effect:', error);
            return null;
        }
    }
    
    /**
     * Create the base frame with proper styling
     * @returns {Phaser.GameObjects.Graphics} The created frame graphics object
     */
    createBaseFrame() {
        try {
            // Skip texture check and use graphics rendering by default
            
            // Create frame graphics directly
            const frameGraphics = this.scene.add.graphics();
            
            // Draw outer border with type color
            frameGraphics.lineStyle(this.config.borderWidth, this.typeColor, this.config.frameAlpha);
            frameGraphics.strokeRoundedRect(
                -this.config.width / 2,
                -this.config.height / 2,
                this.config.width,
                this.config.height,
                this.config.cornerRadius
            );
            
            this.frameBase = frameGraphics;
            
            // Add frame to container
            this.container.add(this.frameBase);
            
            return frameGraphics;
        } catch (error) {
            console.error('CardFrameVisualComponent: Error creating base frame:', error);
            
            // Create minimal fallback frame
            return this.createFallbackFrame();
        }
    }
    
    /**
     * Create a fallback frame if the normal frame creation fails
     * @returns {Phaser.GameObjects.Graphics} The created fallback frame
     */
    createFallbackFrame() {
        try {
            // Create basic rectangular frame
            const fallbackFrame = this.scene.add.graphics();
            fallbackFrame.lineStyle(this.config.fallback.lineWidth, this.typeColor, this.config.fallback.frameAlpha);
            fallbackFrame.strokeRect(
                -this.config.width / 2,
                -this.config.height / 2,
                this.config.width,
                this.config.height
            );
            
            this.frameBase = fallbackFrame;
            this.container.add(this.frameBase);
            
            return fallbackFrame;
        } catch (error) {
            console.error('CardFrameVisualComponent: Error creating fallback frame:', error);
            return null;
        }
    }
    
    /**
     * Add edge highlights and shadows to enhance depth perception
     * @returns {Phaser.GameObjects.Graphics} The created edge effects graphics object
     */
    addEdgeDepthEffects() {
        // Skip if edge effects are disabled
        if (!this.config.depthEffects.edgeEffects.enabled) return null;
        
        try {
            // Get configuration options
            const {
                highlightBrightness,
                shadowDarkness,
                width,
                opacity
            } = this.config.depthEffects.edgeEffects;
            
            // Calculate frame dimensions
            const frameWidth = this.config.width;
            const frameHeight = this.config.height;
            const cornerRadius = this.config.cornerRadius;
            
            // Create graphics object for edge effects
            const edgeEffects = this.scene.add.graphics();
            
            // Create highlight color (lighter version of type color)
            const highlightColor = Phaser.Display.Color.ValueToColor(this.typeColor);
            highlightColor.brighten(highlightBrightness); // Make it brighter
            
            // Create shadow color (darker version of type color)
            const shadowColor = Phaser.Display.Color.ValueToColor(this.typeColor);
            shadowColor.darken(shadowDarkness); // Make it darker
            
            // Draw top and left highlights (thin bright lines)
            edgeEffects.lineStyle(width, highlightColor.color, opacity);
            
            // Top edge highlight
            edgeEffects.beginPath();
            edgeEffects.moveTo(-frameWidth / 2 + cornerRadius, -frameHeight / 2);
            edgeEffects.lineTo(frameWidth / 2 - cornerRadius, -frameHeight / 2);
            edgeEffects.strokePath();
            
            // Left edge highlight
            edgeEffects.beginPath();
            edgeEffects.moveTo(-frameWidth / 2, -frameHeight / 2 + cornerRadius);
            edgeEffects.lineTo(-frameWidth / 2, frameHeight / 2 - cornerRadius);
            edgeEffects.strokePath();
            
            // Draw bottom and right shadows (thin dark lines)
            edgeEffects.lineStyle(width, shadowColor.color, opacity);
            
            // Bottom edge shadow
            edgeEffects.beginPath();
            edgeEffects.moveTo(-frameWidth / 2 + cornerRadius, frameHeight / 2);
            edgeEffects.lineTo(frameWidth / 2 - cornerRadius, frameHeight / 2);
            edgeEffects.strokePath();
            
            // Right edge shadow
            edgeEffects.beginPath();
            edgeEffects.moveTo(frameWidth / 2, -frameHeight / 2 + cornerRadius);
            edgeEffects.lineTo(frameWidth / 2, frameHeight / 2 - cornerRadius);
            edgeEffects.strokePath();
            
            // Add subtle corner treatments for a polished look
            // Top-left corner (highlight)
            edgeEffects.lineStyle(width, highlightColor.color, opacity * 0.8);
            edgeEffects.beginPath();
            edgeEffects.arc(-frameWidth / 2 + cornerRadius, -frameHeight / 2 + cornerRadius, cornerRadius, Math.PI, 1.5 * Math.PI);
            edgeEffects.strokePath();
            
            // Bottom-right corner (shadow)
            edgeEffects.lineStyle(width, shadowColor.color, opacity * this.config.depthEffects.edgeEffects.cornerOpacityReduction);
            edgeEffects.beginPath();
            edgeEffects.arc(frameWidth / 2 - cornerRadius, frameHeight / 2 - cornerRadius, cornerRadius, 0, 0.5 * Math.PI);
            edgeEffects.strokePath();
            
            // Add to container
            this.container.add(edgeEffects);
            
            // Store reference for cleanup
            this.edgeEffects = edgeEffects;
            
            return edgeEffects;
        } catch (error) {
            console.error('CardFrameVisualComponent: Error creating edge depth effects:', error);
            return null;
        }
    }
    
    /**
     * Create debug visualizations for component boundaries
     * @returns {Phaser.GameObjects.Graphics} The created debug graphics
     */
    createDebugVisuals() {
        try {
            const debug = this.scene.add.graphics();
            debug.lineStyle(1, this.config.debug.colors.boundary, 1);
            
            // Card boundary
            debug.strokeRect(
                -this.config.width / 2,
                -this.config.height / 2,
                this.config.width,
                this.config.height
            );
            
            // Center point
            debug.lineStyle(1, this.config.debug.colors.centerPoint, 1);
            const pointSize = this.config.debug.centerPointSize;
            debug.lineBetween(-pointSize, 0, pointSize, 0);
            debug.lineBetween(0, -pointSize, 0, pointSize);
            
            this.container.add(debug);
            
            // Store reference for cleanup
            this.debugVisuals = debug;
            
            return debug;
        } catch (error) {
            console.error('CardFrameVisualComponent: Error creating debug visuals:', error);
            return null;
        }
    }
    
    /**
     * Get the frameBase object for interactivity
     * @returns {Phaser.GameObjects.GameObject} The frame base graphics object
     */
    getFrameBase() {
        return this.frameBase;
    }
    
    /**
     * Update the visual state of the component
     * @param {Object} state - New state values
     */
    updateVisualState(state = {}) {
        // Will be implemented in the future if needed
        // This could handle highlighted/selected state changes affecting visuals
    }
    
    /**
     * Sets a white highlight on the frame border with smooth fade-in/fade-out animation
     * @param {boolean} isHighlighted - Whether to show (true) or hide (false) the white highlight
     * @param {number} duration - Duration of the fade animation in milliseconds
     * @returns {boolean} - Success state
     */
    setFrameWhiteHighlight(isHighlighted, duration = 250) {
        try {
            // Check if scene is still valid
            if (!this.scene || !this.container) {
                console.error('CardFrameVisualComponent.setFrameWhiteHighlight: Scene or container is invalid');
                return false;
            }
            
            const WHITE_COLOR = 0xFFFFFF;
            
            if (isHighlighted) {
                // If highlight already exists, destroy it first to prevent stacking
                if (this.whiteHighlightFrameLayer) {
                    // Stop any active tweens on the highlight layer
                    if (this.scene.tweens) {
                        this.scene.tweens.killTweensOf(this.whiteHighlightFrameLayer);
                    }
                    this.whiteHighlightFrameLayer.destroy();
                    this.whiteHighlightFrameLayer = null;
                }
                
                // Create white highlight frame
                this.whiteHighlightFrameLayer = this.scene.add.graphics();
                
                // Draw the white frame border with same dimensions as the base frame
                this.whiteHighlightFrameLayer.lineStyle(this.config.borderWidth, WHITE_COLOR, this.config.frameAlpha);
                this.whiteHighlightFrameLayer.strokeRoundedRect(
                    -this.config.width / 2,
                    -this.config.height / 2,
                    this.config.width,
                    this.config.height,
                    this.config.cornerRadius
                );
                
                // Start with fully transparent
                this.whiteHighlightFrameLayer.setAlpha(0);
                
                // Add to container (ensure it appears above the base frame)
                this.container.add(this.whiteHighlightFrameLayer);
                
                // Animate fade-in
                if (this.scene.tweens) {
                    this.scene.tweens.add({
                        targets: this.whiteHighlightFrameLayer,
                        alpha: this.config.frameAlpha,
                        duration: duration,
                        ease: 'Sine.easeOut'
                    });
                } else {
                    // If tweens not available, set alpha directly
                    this.whiteHighlightFrameLayer.setAlpha(this.config.frameAlpha);
                }
                
                return true;
            } else {
                // Handle fade-out and cleanup
                if (this.whiteHighlightFrameLayer && this.whiteHighlightFrameLayer.scene) {
                    // Stop any active tweens
                    if (this.scene.tweens) {
                        this.scene.tweens.killTweensOf(this.whiteHighlightFrameLayer);
                        
                        // Animate fade-out
                        this.scene.tweens.add({
                            targets: this.whiteHighlightFrameLayer,
                            alpha: 0,
                            duration: duration,
                            ease: 'Sine.easeOut',
                            onComplete: () => {
                                // Clean up after fade-out completes
                                if (this.whiteHighlightFrameLayer && this.whiteHighlightFrameLayer.scene) {
                                    this.whiteHighlightFrameLayer.destroy();
                                    this.whiteHighlightFrameLayer = null;
                                }
                            }
                        });
                    } else {
                        // If tweens not available, destroy immediately
                        this.whiteHighlightFrameLayer.destroy();
                        this.whiteHighlightFrameLayer = null;
                    }
                    
                    return true;
                }
                
                return false; // Nothing to fade out
            }
        } catch (error) {
            console.error('CardFrameVisualComponent.setFrameWhiteHighlight: Error:', error);
            return false;
        }
    }
    
    /**
     * Clean up all resources
     */
    destroy() {
        try {
            // Destroy all created GameObjects
            if (this.frameBase && this.frameBase.scene) {
                this.frameBase.destroy();
                this.frameBase = null;
            }
            
            if (this.backdrop && this.backdrop.scene) {
                this.backdrop.destroy();
                this.backdrop = null;
            }
            
            if (this.innerGlowGraphics && this.innerGlowGraphics.scene) {
                this.innerGlowGraphics.destroy();
                this.innerGlowGraphics = null;
            }
            
            if (this.edgeEffects && this.edgeEffects.scene) {
                this.edgeEffects.destroy();
                this.edgeEffects = null;
            }
            
            if (this.debugVisuals && this.debugVisuals.scene) {
                this.debugVisuals.destroy();
                this.debugVisuals = null;
            }
            
            if (this.whiteHighlightFrameLayer && this.whiteHighlightFrameLayer.scene) {
                this.whiteHighlightFrameLayer.destroy();
                this.whiteHighlightFrameLayer = null;
            }
            
            // Kill any active tweens
            if (this.scene && this.scene.tweens) {
                if (this.frameBase) this.scene.tweens.killTweensOf(this.frameBase);
                if (this.backdrop) this.scene.tweens.killTweensOf(this.backdrop);
                if (this.innerGlowGraphics) this.scene.tweens.killTweensOf(this.innerGlowGraphics);
                if (this.edgeEffects) this.scene.tweens.killTweensOf(this.edgeEffects);
                if (this.whiteHighlightFrameLayer) this.scene.tweens.killTweensOf(this.whiteHighlightFrameLayer);
            }
            
            // Clear references
            this.scene = null;
            this.container = null;
            this.config = null;
            
            console.log('CardFrameVisualComponent: Successfully destroyed');
        } catch (error) {
            console.error('CardFrameVisualComponent: Error during destroy:', error);
        }
    }
    

}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardFrameVisualComponent;
}

// Make available globally (dev mode only)
if (typeof window !== 'undefined') {
    window.CardFrameVisualComponent = CardFrameVisualComponent;
}