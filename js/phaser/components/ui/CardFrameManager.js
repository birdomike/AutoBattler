/**
 * CardFrameManager.js
 * Manages a component-based implementation of the card frame system
 * Acts as a delegation layer to coordinate visual, health, content, and interaction components
 *
 * IMPORTANT ARCHITECTURE NOTE: CardFrameManager serves as a coordinator/orchestrator
 * for specialized components. It should NOT define component-specific configuration.
 * Each component is the SINGLE SOURCE OF TRUTH for its domain:
 *
 * - CardFrameVisualComponent: ALL visual styling, dimensions, and effects
 * - CardFrameHealthComponent: ALL health bar styling and behavior
 * - CardFrameContentComponent: ALL character content, portrait window, and nameplate styling
 * - CardFrameInteractionComponent: ALL interaction behaviors and animations
 *
 * CODE REVIEW GUIDELINE: Any PR that adds component-specific configuration to
 * CardFrameManager.js should be rejected. Such configuration belongs in the respective
 * component files.
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
        super(scene, x, y);
        
        // Store reference to scene
        this.scene = scene;

        /**
         * Configuration options with sensible defaults
         * IMPORTANT: Object.assign pattern ensures config values override defaults
         * (defaults are first, config is second, so config values take precedence)
         * 
         * IMPORTANT: The component-based architecture now places each component's settings in its respective component file.
         * Most visual, health, content, and interaction properties have been moved to their respective component files:
         * - Health bar dimensions and styling: Look in CardFrameHealthComponent.js
         * - Visual elements and effects: Look in CardFrameVisualComponent.js
         * - Content and text properties: Look in CardFrameContentComponent.js
         * - Interaction animations: Look in CardFrameInteractionComponent.js
         * 
         * Only common properties and positioning values remain here in CardFrameManager.js
         */
        this.config = Object.assign({
            // Core dimensions now come from CardFrameVisualComponent variants
            // This component no longer defines width, height, borderWidth, or cornerRadius
            // Use cardVariant property to request specific dimensions

            // Character information
            characterKey: null,         // Texture key for character sprite
            characterName: 'Character', // Name to display on card
            characterType: 'neutral',   // Type for themed styling (e.g., 'fire', 'water')
            characterTeam: null,        // Team identifier (e.g., 'player', 'enemy')
            
            // NOTE: ALL visual styling and positioning properties have been moved to CardFrameVisualComponent.js
            // including portrait window, nameplate, health display, art positioning, and status effects layout.
            // DO NOT add any visual styling/positioning properties here.
            // This violates the SINGLE SOURCE OF TRUTH principle.
            
            // Health display - BASIC values only
            currentHealth: 100,         // Current health value
            maxHealth: 100,             // Maximum health value
            showHealth: true,           // Whether to show health bar
            
            // Appearance - ONLY typeColors remain here as they're needed by multiple components
            typeColors: {               // Type-specific colors (needed by multiple components, so stays here)
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
            
            // Interaction
            interactive: false,         // Whether card is interactive - needed by multiple components, so stays here
            onSelect: null,             // Callback when card is selected - needed by multiple components, so stays here
            
            // State
            selected: false,            // Whether card is currently selected
            highlighted: false,         // Whether card is highlighted (e.g., active turn)
            
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
        
        // Delegate to health component if available
        if (this.healthComponent && typeof this.healthComponent.updateHealth === 'function') {
            this.healthComponent.updateHealth(currentHealth, maxHealth, animate);
        } else {
            console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): updateHealth called but healthComponent is not available or lacks method.`);
        }
    }
    
    /**
     * Set the selection state of the card
     * @param {boolean} selected - Whether the card is selected
     * @param {boolean} animate - Whether to animate the change (default: true)
     */
    setSelected(selected, animate = true) {
        // Store selection state
        this._selected = selected;
        
        // Delegate to interaction component if available
        if (this.interactionComponent && typeof this.interactionComponent.setSelected === 'function') {
            return this.interactionComponent.setSelected(selected, animate);
        } else {
            console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): setSelected called but interactionComponent is not available or lacks method.`);
            return false;
        }
    }
    
    /**
     * Set the highlight state of the card (e.g., for active turn)
     * @param {boolean} highlighted - Whether the card is highlighted
     * @param {boolean} animate - Whether to animate the change (default: true)
     */
    setHighlighted(highlighted, animate = true) {
        // Store highlight state
        this._highlighted = highlighted;
        
        // Delegate to interaction component if available
        if (this.interactionComponent && typeof this.interactionComponent.setHighlighted === 'function') {
            return this.interactionComponent.setHighlighted(highlighted, animate);
        } else {
            console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): setHighlighted called but interactionComponent is not available or lacks method.`);
            return false;
        }
    }
    
    /**
     * Update the character's name
     * @param {string} name - New character name
     */
    updateName(name) {
        if (!name) return;
        
        this.config.characterName = name;
        
        // Delegate to content component if available
        if (this.contentComponent && typeof this.contentComponent.updateName === 'function') {
            this.contentComponent.updateName(name);
        } else {
            console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): updateName called but contentComponent is not available or lacks method.`);
        }
    }
    
    /**
     * Get the appropriate color for the health bar based on percentage
     * @param {number} percent - Health percentage (0-1)
     * @returns {number} - Color as hex number
     */
    getHealthBarColor(percent) {
        // Delegate to health component if available
        if (this.healthComponent && typeof this.healthComponent.getHealthBarColor === 'function') {
            return this.healthComponent.getHealthBarColor(percent);
        }
        
        // Fallback implementation if component not available
        console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): getHealthBarColor called but healthComponent is not available or lacks method. Using fallback color.`);
        if (percent < 0.3) return 0xFF0000; // Red (low health)
        if (percent < 0.6) return 0xFFAA00; // Orange (medium health)
        return 0x00FF00; // Green (high health)
    }
    
    /**
     * Create health bar with animated transitions.
     * Delegated to HealthComponent.
     * @returns {Phaser.GameObjects.Container | null} The healthBarContainer or null if not created.
     */
    createHealthBar() {
        if (this.healthComponent && typeof this.healthComponent.createHealthBar === 'function') {
            return this.healthComponent.createHealthBar();
        }
        console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): createHealthBar called but healthComponent is not available or lacks method.`);
        return null;
    }
    
    /**
     * Create the portrait window with proper masking
     * Delegated to ContentComponent
     */
    createPortraitWindow() {
        if (this.contentComponent && typeof this.contentComponent.createPortraitWindow === 'function') {
            return this.contentComponent.createPortraitWindow();
        }
        console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): createPortraitWindow called but contentComponent is not available or lacks method.`);
        return null;
    }
    
    /**
     * Create and add character sprite
     * Delegated to ContentComponent
     */
    createCharacterSprite() {
        if (this.contentComponent && typeof this.contentComponent.createCharacterSprite === 'function') {
            return this.contentComponent.createCharacterSprite();
        }
        console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): createCharacterSprite called but contentComponent is not available or lacks method.`);
        return null;
    }
    
    /**
     * Create the decorative nameplate banner with beveled edges/scrollwork
     * Delegated to ContentComponent
     */
    createNameBanner() {
        if (this.contentComponent && typeof this.contentComponent.createNameBanner === 'function') {
            return this.contentComponent.createNameBanner();
        }
        console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): createNameBanner called but contentComponent is not available or lacks method.`);
        return null;
    }
    
    /**
     * Create a simple fallback name banner if the decorative one fails
     * Delegated to ContentComponent
     */
    createFallbackNameBanner() {
        if (this.contentComponent && typeof this.contentComponent.createFallbackNameBanner === 'function') {
            return this.contentComponent.createFallbackNameBanner();
        }
        console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): createFallbackNameBanner called but contentComponent is not available or lacks method.`);
        return null;
    }
    
    /**
     * Create a fallback visual if character sprite cannot be created
     * Delegated to ContentComponent
     */
    createCharacterFallback() {
        if (this.contentComponent && typeof this.contentComponent.createCharacterFallback === 'function') {
            return this.contentComponent.createCharacterFallback();
        }
        console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): createCharacterFallback called but contentComponent is not available or lacks method.`);
        return null;
    }
    
    /**
     * Setup interactivity for hovering and selection
     * Delegated to InteractionComponent
     */
    setupInteractivity() {
        if (this.interactionComponent && typeof this.interactionComponent.setupInteractivity === 'function') {
            return this.interactionComponent.setupInteractivity();
        }
        console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): setupInteractivity called but interactionComponent is not available or lacks method.`);
        return false;
    }
    
    /**
     * Add a glow effect around the card
     * @param {number} intensity - Glow intensity (0-1)
     * Delegated to InteractionComponent
     */
    addGlowEffect(intensity) {
        if (this.interactionComponent && typeof this.interactionComponent.addGlowEffect === 'function') {
            return this.interactionComponent.addGlowEffect(intensity);
        }
        console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): addGlowEffect called but interactionComponent is not available or lacks method.`);
        return null;
    }
    
    /**
     * Remove glow effect
     * Delegated to InteractionComponent
     */
    removeGlowEffect() {
        if (this.interactionComponent && typeof this.interactionComponent.removeGlowEffect === 'function') {
            return this.interactionComponent.removeGlowEffect();
        }
        console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): removeGlowEffect called but interactionComponent is not available or lacks method.`);
        return false;
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
            
            // Initialize health component for health bar and updates
            this.initializeHealthComponent();
            
            // Initialize content component for portrait and name display
            this.initializeContentComponent();
            
            // Initialize interaction component for hover and selection
            this.initializeInteractionComponent();
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
            
            // Create visual component
            this.visualComponent = new window.CardFrameVisualComponent(
                this.scene,
                this,
                this.typeColor,
                this.config
            );
            
            console.log('CardFrameManager: Visual component initialized successfully');
        } catch (error) {
            this.visualComponent = null; // Explicitly nullify on error
            console.error('CardFrameManager: Error initializing visual component:', error);
        }
    }
    
    /**
     * Initialize the health component for health bar and health updates.
     * IMPORTANT: All health bar styling, dimensions, and behavior should be configured
     * in CardFrameHealthComponent.js, not here in CardFrameManager.js.
     */
    initializeHealthComponent() {
        this.healthComponent = null; // Ensure it's null before attempting initialization
        try {
            if (typeof window.CardFrameHealthComponent !== 'function') {
                console.error(`CardFrameManager (${this.config.characterName || 'Unknown'}): CardFrameHealthComponent class not found in global scope. Health bar will be missing.`);
                return; // Exit if the class definition isn't loaded
            }
            
            // Health display configuration should come directly from CardFrameHealthComponent
            // as it is the Single Source of Truth for health bar styling and positioning
            let healthConfig = { ...this.config };
            
            // Pass only relevant health data (currentHealth, maxHealth, showHealth, typeColor)
            // Note: We no longer pass healthBarOffsetY from visualComponent - this is managed by CardFrameHealthComponent
            
            // Create health component with correct positioning
            this.healthComponent = new window.CardFrameHealthComponent(
                this.scene,
                this, // CardFrameManager is the container for healthComponent's elements
                this.typeColor,
                healthConfig // Pass config with correct values from visualComponent
            );
            
            // Verify successful instantiation
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
    
    /**
     * Initialize the content component for portrait window, character sprite, and name banner
     */
    initializeContentComponent() {
        this.contentComponent = null; // Ensure it's null before attempting initialization
        try {
            if (typeof window.CardFrameContentComponent !== 'function') {
                console.error(`CardFrameManager (${this.config.characterName || 'Unknown'}): CardFrameContentComponent class not found in global scope. Portrait and name will be missing.`);
                return; // Exit if the class definition isn't loaded
            }
            
            // Get final dimensions and visual properties from visualComponent if available
            let contentConfig = { ...this.config };
            
            // If visualComponent is available, get the correct dimensions and visual properties from it
            if (this.visualComponent) {
                // Get core dimensions
                contentConfig.width = this.visualComponent.config.width;
                contentConfig.height = this.visualComponent.config.height;
                
                // Get portrait configuration
                contentConfig.portraitWidth = this.visualComponent.config.portrait.width;
                contentConfig.portraitHeight = this.visualComponent.config.portrait.height;
                contentConfig.portraitOffsetX = this.visualComponent.config.portrait.offsetX;
                contentConfig.portraitOffsetY = this.visualComponent.config.portrait.offsetY;
                contentConfig.portraitMask = this.visualComponent.config.portrait.mask;
                contentConfig.portraitCornerRadius = this.visualComponent.config.portrait.cornerRadius;
                
                // Get nameplate configuration
                contentConfig.nameBannerWidth = this.visualComponent.config.nameplate.width;
                contentConfig.nameBannerHeight = this.visualComponent.config.nameplate.height;
                contentConfig.nameOffsetY = this.visualComponent.config.nameplate.offsetY;
                contentConfig.nameFontSize = this.visualComponent.config.nameplate.fontSize;
                contentConfig.nameFontFamily = this.visualComponent.config.nameplate.fontFamily;
                contentConfig.showDecorativeFlourishes = this.visualComponent.config.nameplate.decorative;
                
                // Get art positioning
                contentConfig.artOffsetX = this.visualComponent.config.artPositioning.offsetX;
                contentConfig.artOffsetY = this.visualComponent.config.artPositioning.offsetY;
                contentConfig.artScale = this.visualComponent.config.artPositioning.scale;
                
                console.log(`CardFrameManager (${this.config.characterName || 'Unknown'}): Using visual properties from visualComponent for contentComponent`);
            } else {
                console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): visualComponent not available, content component may have incorrect dimensions and styling.`);
            }
            
            // Create content component with correct dimensions and visual properties
            this.contentComponent = new window.CardFrameContentComponent(
                this.scene,
                this, // CardFrameManager is the container for contentComponent's elements
                this.typeColor,
                contentConfig // Pass config with correct values from visualComponent
            );
            
            // Verify successful instantiation
            if (this.contentComponent && typeof this.contentComponent.createPortraitWindow === 'function') {
                console.log(`CardFrameManager (${this.config.characterName || 'Unknown'}): Content component initialized successfully.`);
            } else {
                console.error(`CardFrameManager (${this.config.characterName || 'Unknown'}): CRITICAL - CardFrameContentComponent instantiation failed or is invalid. ContentComponent:`, this.contentComponent);
                this.contentComponent = null; // Ensure it's null if something went wrong
            }
        } catch (error) {
            console.error(`CardFrameManager (${this.config.characterName || 'Unknown'}): Error initializing content component:`, error);
            this.contentComponent = null; // Explicitly nullify on error
        }
    }
    
    /**
     * Initialize the interaction component for hover and selection
     */
    initializeInteractionComponent() {
        this.interactionComponent = null; // Ensure it's null before attempting initialization
        try {
            if (typeof window.CardFrameInteractionComponent !== 'function') {
                console.error(`CardFrameManager (${this.config.characterName || 'Unknown'}): CardFrameInteractionComponent class not found in global scope. Interaction features will be missing.`);
                return; // Exit if the class definition isn't loaded
            }
            
            // Get status effect configuration from visualComponent if available
            let interactionConfig = { ...this.config };
            
            if (this.visualComponent) {
                // Pass status effect configuration from visualComponent
                interactionConfig.statusEffectScale = this.visualComponent.config.statusEffects.scale;
                interactionConfig.statusEffectSpacing = this.visualComponent.config.statusEffects.spacing;
                interactionConfig.statusEffectOffsetY = this.visualComponent.config.statusEffects.offsetY;
                
                console.log(`CardFrameManager (${this.config.characterName || 'Unknown'}): Using status effect configuration from visualComponent`);
            } else {
                console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): visualComponent not available, interaction component may have incorrect status effect configuration.`);
            }
            
            // Create interaction component with correct status effect configuration
            this.interactionComponent = new window.CardFrameInteractionComponent(
                this.scene,
                this, // CardFrameManager is the container for interactionComponent's elements
                this.typeColor,
                interactionConfig // Pass config with correct values from visualComponent
            );
            
            // Get required references from other components
            let frameBase = null;
            let glowContainer = null;
            
            // Try to get frameBase from visual component
            if (this.visualComponent && typeof this.visualComponent.getFrameBase === 'function') {
                frameBase = this.visualComponent.getFrameBase();
            } else {
                console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): Cannot get frameBase from visualComponent.`);
            }
            
            // Try to get glowContainer directly from this manager
            glowContainer = this.glowContainer;
            
            // If we have a fallback, use first child as frameBase
            if (!frameBase && this.children && this.children.length > 0) {
                frameBase = this.children[0];
                console.log(`CardFrameManager (${this.config.characterName || 'Unknown'}): Using fallback frameBase from first child.`);
            }
            
            // Create glowContainer if not found
            if (!glowContainer) {
                glowContainer = this.scene.add.container(0, 0);
                this.add(glowContainer);
                this.glowContainer = glowContainer;
                console.log(`CardFrameManager (${this.config.characterName || 'Unknown'}): Created new glowContainer.`);
            }
            
            // Initialize the component with required references
            if (this.interactionComponent && typeof this.interactionComponent.initialize === 'function') {
                const success = this.interactionComponent.initialize(frameBase, glowContainer);
                if (success) {
                    console.log(`CardFrameManager (${this.config.characterName || 'Unknown'}): Interaction component initialized successfully.`);
                } else {
                    console.error(`CardFrameManager (${this.config.characterName || 'Unknown'}): CRITICAL - Failed to initialize interaction component.`);
                    this.interactionComponent = null; // Ensure it's null if initialization failed
                }
            } else {
                console.error(`CardFrameManager (${this.config.characterName || 'Unknown'}): CRITICAL - CardFrameInteractionComponent instantiation failed or is invalid.`);
                this.interactionComponent = null; // Ensure it's null if something went wrong
            }
        } catch (error) {
            console.error(`CardFrameManager (${this.config.characterName || 'Unknown'}): Error initializing interaction component:`, error);
            this.interactionComponent = null; // Explicitly nullify on error
        }
    }

    /**
     * Create the base frame with 9-slice scaling
     * Delegated to VisualComponent
     */
    createBaseFrame() {
        if (this.visualComponent) {
            if (typeof this.visualComponent.createBaseFrame !== 'function') {
                console.error('CardFrameManager.createBaseFrame: visualComponent exists but has no createBaseFrame method!');
                return null;
            }
            return this.visualComponent.createBaseFrame();
        }
        return null;
    }
    
    /**
     * Create a fallback frame if the normal frame creation fails
     * Delegated to VisualComponent
     * @returns {Phaser.GameObjects.Graphics} A simple rectangular frame
     */
    createFallbackFrame() {
        try {
            // Delegate to visual component if available
            if (this.visualComponent && typeof this.visualComponent.createFallbackFrame === 'function') {
                const fallbackFrame = this.visualComponent.createFallbackFrame();
                return fallbackFrame;
            } else {
                console.warn(`CardFrameManager (${this.config.characterName || 'Unknown'}): createFallbackFrame called but visualComponent is not available or lacks method.`);
                return null;
            }
        } catch (error) {
            console.error('CardFrameManager: Error delegating createFallbackFrame:', error);
            return null;
        }
    }
    
    /**
     * Create the backdrop rectangle for the card
     * Delegated to VisualComponent
     */
    createBackdrop() {
        if (this.visualComponent) {
            if (typeof this.visualComponent.createBackdrop !== 'function') {
                console.error('CardFrameManager.createBackdrop: visualComponent exists but has no createBackdrop method!');
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
                console.log("CardFrameManager.destroy: Destroying healthComponent");
                this.healthComponent.destroy();
                this.healthComponent = null;
            }
            
            if (this.contentComponent) {
                console.log("CardFrameManager.destroy: Destroying contentComponent");
                this.contentComponent.destroy();
                this.contentComponent = null;
            }
            
            if (this.interactionComponent) {
                console.log("CardFrameManager.destroy: Destroying interactionComponent");
                this.interactionComponent.destroy();
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