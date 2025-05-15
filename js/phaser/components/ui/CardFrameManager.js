/**
 * CardFrameManager.js
 * Manages a component-based implementation of the card frame system
 * Acts as a delegation layer to coordinate visual, health, content, and interaction components
 */
class CardFrameManager extends Phaser.GameObjects.Container {
    /**
     * Create a new card frame manager
     * @param {Phaser.Scene} scene - The scene this card belongs to
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} config - Configuration options
     */
    constructor(scene, x, y, config = {}) {
        console.log(`[DEBUG-VC-INIT] CardFrameManager constructor: Entered. Scene valid: ${!!scene}, Config keys: ${config ? Object.keys(config).join(', ') : 'null'}`);
        if (!scene) { console.error('[DEBUG-VC-INIT] CardFrameManager constructor: SCENE IS FALSY!'); }
        
        super(scene, x, y);
        
        // Store reference to scene
        this.scene = scene;

        /**
         * Configuration options with sensible defaults
         * All visual parameters are explicitly defined here for easy adjustment
         */
        this.config = Object.assign({
            // Core dimensions (3:4 aspect ratio)
            width: 240,                 // Width of card frame
            height: 320,                // Height of card frame
            borderWidth: 10,            // Width of frame border (reduced from 20px for sleeker appearance)
            cornerRadius: 12,           // Corner radius for frame

            // Character information
            characterKey: null,         // Texture key for character sprite
            characterName: 'Character', // Name to display on card
            characterType: 'neutral',   // Type for themed styling (e.g., 'fire', 'water')
            characterTeam: null,        // Team identifier (e.g., 'player', 'enemy')
            
            // Art positioning adjustments
            artOffsetX: 0,              // Fine-tune character art horizontal position
            artOffsetY: 0,              // Fine-tune character art vertical position
            artScale: 1,                // Scaling factor for character art
            
            // Portrait window
            portraitWidth: 200,         // Width of portrait area
            portraitHeight: 240,        // Height of portrait area
            portraitOffsetY: -20,       // Portrait vertical offset from center
            portraitMask: true,         // Whether to mask the portrait
            
            // Health display
            currentHealth: 100,         // Current health value
            maxHealth: 100,             // Maximum health value
            showHealth: true,           // Whether to show health bar
            healthBarWidth: 180,        // Width of health bar
            healthBarHeight: 12,        // Height of health bar
            healthBarOffsetY: -148,     // Distance from center to health bar
            showHealthText: true,       // Whether to show health text
            
            // Nameplate
            nameBannerHeight: 25,       // Height of name banner
            nameBannerWidth: 210,       // Width of name banner (slightly less than card width)
            nameFontSize: 16,           // Font size for name text
            nameFontFamily: 'serif',    // Font family for name text
            nameOffsetY: 135,           // Distance from center to nameplate
            showDecorativeFlourishes: true, // Whether to show flourishes around name
            
            // Appearance
            frameTexture: 'card-frame', // Base texture for card frame
            nameplateTexture: 'nameplate', // Base texture for nameplate
            typeColors: {               // Type-specific colors (overrides auto-detection)
                fire: 0xFF4757,
                water: 0x1E90FF,
                nature: 0x2ED573,
                electric: 0xF7DF1E,
                ice: 0xADD8E6,
                rock: 0x8B4513,
                air: 0x70A1FF,
                light: 0xFFD700,
                dark: 0x9900CC,
                metal: 0xC0C0C0,
                psychic: 0xDA70D6,
                poison: 0x8A2BE2,
                physical: 0xCD5C5C,
                arcane: 0x7B68EE,
                mechanical: 0x778899,
                void: 0x2F4F4F,
                crystal: 0xAFEEEE,
                storm: 0x4682B4,
                ethereal: 0xE6E6FA,
                blood: 0x8B0000,
                plague: 0x556B2F,
                gravity: 0x36454F,
                neutral: 0xAAAAAA
            },
            frameAlpha: 1,              // Opacity of the frame
            frameColorIntensity: 0.7,   // Intensity of type coloring (0-1)
            backgroundAlpha: 0.2,       // Background opacity
            
            // 9-Slice specifics
            cornerSize: 20,             // Size of corners for 9-slice scaling
            sliceMargins: [20, 20, 20, 20], // Left, right, top, bottom margins for 9-slice
            
            // Depth Effects
            depthEffects: {
                enabled: true,           // Master toggle for all depth effects
                innerGlow: {
                    enabled: true,       // Enable inner glow effect
                    intensity: 0.3,      // Intensity of inner glow (0-1)
                    layers: 4            // Number of glow layers (more = smoother but more expensive)
                },
                edgeEffects: {
                    enabled: true,       // Enable edge highlights and shadows
                    highlightBrightness: 40, // How much brighter the highlights are (%)
                    shadowDarkness: 40,  // How much darker the shadows are (%)
                    width: 1.5,          // Width of edge effect lines
                    opacity: 0.6         // Opacity of edge effects (0-1)
                }
            },
            
            // Interaction
            interactive: false,         // Whether card is interactive
            onSelect: null,             // Callback when card is selected
            hoverEnabled: true,         // Whether hover effects are enabled
            onHoverStart: null,         // Callback when hover starts
            onHoverEnd: null,           // Callback when hover ends
            
            // Animation
            hoverScale: 1.05,           // Scale factor when hovering
            selectedScale: 1.1,         // Scale factor when selected
            animationDuration: 150,     // Duration of animations in ms
            glowIntensity: 0.7,         // Intensity of glow effect (0-1)
            
            // State
            selected: false,            // Whether card is currently selected
            highlighted: false,         // Whether card is highlighted (e.g., active turn)
            
            // Status effects
            statusEffectScale: 0.7,     // Scale factor for status effect icons
            statusEffectSpacing: 24,    // Spacing between status effect icons
            statusEffectOffsetY: -130,  // Vertical position of status effect icons
            
            // Debug
            debugMode: false,           // Show debug information/boundaries

            // Component system specific
            useComponentSystem: true    // Whether to use the component-based system
        }, config);
        
        // Store internal state
        this._highlighted = false;
        this._selected = false;
        
        // Auto-detect type color if not provided
        this.typeColor = this.getTypeColor(this.config.characterType);

        // Component references
        this.visualComponent = null;
        this.healthComponent = null;
        this.contentComponent = null;
        this.interactionComponent = null;

        // Initialize components
        this.initializeComponents()
        
        // Add to scene
        scene.add.existing(this);
        
        console.log(`CardFrameManager initialized for ${this.config.characterName} (${this.config.characterType})`);
    }
    
    /**
     * Update the health display
     * @param {number} currentHealth - New current health value
     * @param {number} maxHealth - New maximum health value (optional)
     * @param {boolean} animate - Whether to animate the change (default: true)
     */
    updateHealth(currentHealth, maxHealth = null, animate = true) {
        // Validate health values
        if (currentHealth === undefined || currentHealth === null) {
            console.warn('CardFrameManager: Invalid health value provided');
            return;
        }
        
        // Update stored health values
        this.config.currentHealth = currentHealth;
        
        if (maxHealth !== null) {
            this.config.maxHealth = maxHealth;
        }
        
        // STUB: Will be implemented in Phase 3 with HealthComponent
        console.log(`CardFrameManager.updateHealth: Will delegate to HealthComponent in future (${currentHealth}/${maxHealth || this.config.maxHealth})`);
    }
    
    /**
     * Set the selection state of the card
     * @param {boolean} selected - Whether the card is selected
     * @param {boolean} animate - Whether to animate the change (default: true)
     */
    setSelected(selected, animate = true) {
        // Store selection state
        this._selected = selected;
        
        // STUB: Will be implemented in Phase 3 with InteractionComponent
        console.log(`CardFrameManager.setSelected: Will delegate to InteractionComponent in future (selected: ${selected})`);
    }
    
    /**
     * Set the highlight state of the card (e.g., for active turn)
     * @param {boolean} highlighted - Whether the card is highlighted
     * @param {boolean} animate - Whether to animate the change (default: true)
     */
    setHighlighted(highlighted, animate = true) {
        // Store highlight state
        this._highlighted = highlighted;
        
        // STUB: Will be implemented in Phase 3 with InteractionComponent
        console.log(`CardFrameManager.setHighlighted: Will delegate to InteractionComponent in future (highlighted: ${highlighted})`);
    }
    
    /**
     * Update the character's name
     * @param {string} name - New character name
     */
    updateName(name) {
        if (!name) return;
        
        this.config.characterName = name;
        
        // STUB: Will be implemented in Phase 3 with ContentComponent
        console.log(`CardFrameManager.updateName: Will delegate to ContentComponent in future (${name})`);
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
     * Get the color for a character type
     * @param {string} type - The character's type
     * @returns {number} - The color as a hex number
     */
    getTypeColor(type) {
        // If type color explicitly provided in config, use that
        if (this.config.typeColors && this.config.typeColors[type]) {
            return this.config.typeColors[type];
        }
        
        // Default type colors if not in config
        const typeColors = {
            fire: 0xFF4757, water: 0x1E90FF, nature: 0x2ED573,
            electric: 0xF7DF1E, ice: 0xADD8E6, rock: 0x8B4513,
            air: 0x70A1FF, light: 0xFFD700, dark: 0x9900CC,
            metal: 0xC0C0C0, psychic: 0xDA70D6, poison: 0x8A2BE2,
            physical: 0xCD5C5C, arcane: 0x7B68EE, mechanical: 0x778899,
            void: 0x2F4F4F, crystal: 0xAFEEEE, storm: 0x4682B4,
            ethereal: 0xE6E6FA, blood: 0x8B0000, plague: 0x556B2F,
            gravity: 0x36454F, neutral: 0xAAAAAA // Added neutral for placeholder
        };
        
        // Handle multi-type (uses first type for color)
        let primaryType = type;
        if (type && type.includes('/')) {
            primaryType = type.split('/')[0].trim();
        }
        
        // Return color or neutral fallback
        return typeColors[primaryType.toLowerCase()] || typeColors.neutral;
    }
    
    /**
     * Initialize all components
     */
    initializeComponents() {
        try {
            // Initialize visual component first as it creates the base structure
            this.initializeVisualComponent();
            
            // Other components will be initialized in future phases
            // this.initializeHealthComponent();
            // this.initializeContentComponent();
            // this.initializeInteractionComponent();
        } catch (error) {
            console.error('CardFrameManager: Error initializing components:', error);
        }
    }
    
    /**
     * Initialize the visual component for frame, backdrop, and visual effects
     */
    initializeVisualComponent() {
        try {
            // Check if CardFrameVisualComponent is available
            if (typeof window.CardFrameVisualComponent !== 'function') {
                console.error('CardFrameManager: CardFrameVisualComponent not found in global scope. Ensure it is loaded and correctly assigned to window.CardFrameVisualComponent.');
                return;
            }
            
            console.log(`[DEBUG-VC-INIT] CardFrameManager: Attempting to create CardFrameVisualComponent. Scene valid: ${!!this.scene}, Container (this manager) valid: ${!!this}, TypeColor: ${this.typeColor}, Config keys: ${this.config ? Object.keys(this.config).join(', ') : 'null'}`);
            
            // Create visual component
            this.visualComponent = new window.CardFrameVisualComponent(
                this.scene,
                this,
                this.typeColor,
                this.config
            );
            
            console.log(`[DEBUG-VC-INIT] CardFrameManager: CardFrameVisualComponent instantiation attempted. this.visualComponent is now: ${this.visualComponent ? 'defined' : 'undefined'}. Type: ${typeof this.visualComponent}`);
            if (this.visualComponent && typeof this.visualComponent.initialize !== 'function') {
                console.error('[DEBUG-VC-INIT] CardFrameManager: CRITICAL - visualComponent exists but has no initialize method!');
            }
            
            console.log('CardFrameManager: Visual component initialized successfully');
        } catch (error) {
            console.error('[DEBUG-VC-INIT] CardFrameManager.initializeVisualComponent: ERROR caught:', error); // Added prefix
            this.visualComponent = null; // Explicitly nullify on error
            console.error('CardFrameManager: Error initializing visual component:', error);
        }
    }

    /**
     * Create the base frame with 9-slice scaling
     * Delegated to VisualComponent
     */
    createBaseFrame() {
        console.log(`[DEBUG-VC-INIT] CardFrameManager.createBaseFrame: Called. this.visualComponent is ${this.visualComponent ? 'defined' : 'undefined'}.`);
        if (this.visualComponent) {
            if (typeof this.visualComponent.createBaseFrame !== 'function') {
                console.error('[DEBUG-VC-INIT] CardFrameManager.createBaseFrame: CRITICAL - visualComponent exists but has no createBaseFrame method!');
                return null;
            }
            return this.visualComponent.createBaseFrame();
        }
        return null;
    }
    
    /**
     * Create the backdrop rectangle for the card
     * Delegated to VisualComponent
     */
    createBackdrop() {
        console.log(`[DEBUG-VC-INIT] CardFrameManager.createBackdrop: Called. this.visualComponent is ${this.visualComponent ? 'defined' : 'undefined'}.`);
        if (this.visualComponent) {
            if (typeof this.visualComponent.createBackdrop !== 'function') {
                console.error('[DEBUG-VC-INIT] CardFrameManager.createBackdrop: CRITICAL - visualComponent exists but has no createBackdrop method!');
                return null;
            }
            return this.visualComponent.createBackdrop();
        }
        return null;
    }
    
    /**
     * Create inner glow effect that matches the card's type color
     * Delegated to VisualComponent
     */
    createInnerGlowEffect() {
        if (this.visualComponent) {
            return this.visualComponent.createInnerGlowEffect();
        }
        return null;
    }
    
    /**
     * Add edge highlights and shadows to enhance depth perception
     * Delegated to VisualComponent
     */
    addEdgeDepthEffects() {
        if (this.visualComponent) {
            return this.visualComponent.addEdgeDepthEffects();
        }
        return null;
    }
    
    /**
     * Clean up all resources when card is destroyed
     */
    destroy() {
        try {
            // Stop any active tweens
            if (this.scene && this.scene.tweens) {
                this.scene.tweens.killTweensOf(this);
            }
            
            // Reset cursor if interactive
            if (this.config.interactive) {
                document.body.style.cursor = 'default';
            }
            
            // Destroy components
            if (this.visualComponent) {
                console.log("CardFrameManager.destroy: Destroying visualComponent");
                this.visualComponent.destroy();
                this.visualComponent = null;
            }
            
            if (this.healthComponent) {
                console.log("CardFrameManager.destroy: Will destroy healthComponent in future");
                this.healthComponent = null;
            }
            
            if (this.contentComponent) {
                console.log("CardFrameManager.destroy: Will destroy contentComponent in future");
                this.contentComponent = null;
            }
            
            if (this.interactionComponent) {
                console.log("CardFrameManager.destroy: Will destroy interactionComponent in future");
                this.interactionComponent = null;
            }
            
            // Call parent destroy method to clean up container and children
            super.destroy(true);
        } catch (error) {
            console.error('CardFrameManager: Error during destroy:', error);
            // Try parent destroy as fallback
            super.destroy(true);
        }
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardFrameManager;
}

// Make available globally
window.CardFrameManager = CardFrameManager;