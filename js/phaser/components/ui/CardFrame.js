/**
 * CardFrame.js
 * A reusable card frame component that provides a professional, type-themed 
 * card presentation for character displays in both battle and teambuilder contexts.
 * 
 * Features:
 * - 3:4 aspect ratio card design with decorative border
 * - Character portrait window with masking
 * - Type-themed styling for borders, nameplates, and effects
 * - Interactive hover/selection states with animations
 * - Health bar integration
 * - Decorative nameplate with beveled edges/scrollwork
 */
class CardFrame extends Phaser.GameObjects.Container {
    /**
     * Getter for selected state
     * @returns {boolean} Whether the card is currently selected
     */
    get selected() {
        // Delegate to manager if available (single source of truth)
        if (this.getConfig('useComponentSystem', true) && this.manager) {
            return this.manager._selected;
        }
        // Fallback to local state if manager not available
        return this._selected || false;
    }
    
    /**
     * Getter for highlighted state
     * @returns {boolean} Whether the card is currently highlighted
     */
    get highlighted() {
        // Delegate to manager if available (single source of truth)
        if (this.getConfig('useComponentSystem', true) && this.manager) {
            return this.manager._highlighted;
        }
        // Fallback to local state if manager not available
        return this._highlighted || false;
    }
    /**
     * Create a new card frame
     * @param {Phaser.Scene} scene - The scene this card belongs to
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} config - Configuration options
     */
    constructor(scene, x, y, config = {}) {
        super(scene, x, y);
        
        // Add component system flag to configuration
        config.useComponentSystem = config.useComponentSystem !== false; // Default to true if not specified
        
        // If component system is enabled, create a manager instance
        if (config.useComponentSystem && typeof window.CardFrameManager === 'function') {
            try {
                // Create manager instance with same config
                this.manager = new window.CardFrameManager(scene, 0, 0, config);
                if (this.manager) {
                    // Add manager to this container
                    this.add(this.manager);
                } else {
                    console.error('CardFrame: CardFrameManager was NOT created successfully');                    
                    config.useComponentSystem = false; // Force fallback
                }
                console.log('CardFrame: Using component system with CardFrameManager');
            } catch (error) {
                console.error('CardFrame: Error during CardFrameManager instantiation:', error);
                this.manager = null;
                config.useComponentSystem = false; // Disable component system on failure
                console.log('CardFrame: Falling back to direct implementation');
            }
        } else {
            console.warn(`CardFrame: Not using component system. useComponentSystem: ${config.useComponentSystem}, CardFrameManager available: ${typeof window.CardFrameManager === 'function'}`);
            this.manager = null;
            config.useComponentSystem = false; // Ensure flag is off
        }
        
        // Store reference to scene
        this.scene = scene;

        // Store only essential config in CardFrame
        this.localConfig = {
            useComponentSystem: config.useComponentSystem !== false,
            characterName: config.characterName || 'Character',
            characterType: config.characterType || 'neutral',
            interactive: config.interactive || false,
            hoverEnabled: config.hoverEnabled || false,
            debugMode: config.debugMode || false,
            selected: config.selected || false,
            highlighted: config.highlighted || false
        };
        
        // Keep a reference to the original config for backward compatibility
        // during the transition (will be removed in a future update)
        this._originalConfig = config;

        /**
        * Configuration options with sensible defaults
        * All visual parameters are explicitly defined here for easy adjustment
        * @deprecated Use getConfig() and updateConfig() methods instead
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
        healthBarOffsetY: -148,       // Distance from center to health bar
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
        
        // Depth Effects (new in v0.7.0.11)
        depthEffects: {
            enabled: true,           // Master toggle for all depth effects
            innerGlow: {
                enabled: true,       // Enable inner glow effect
                intensity: 0.3,      // Intensity of inner glow (0-1)
                layers: 4           // Number of glow layers (more = smoother but more expensive)
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
        debugMode: false            // Show debug information/boundaries
        }, config);
        
        // Auto-detect type color if not provided
        this.typeColor = this.getTypeColor(this.getConfig('characterType', 'neutral'));
        
        // Note: We don't initialize local state variables (_selected, _highlighted)
        // when using the component system, as these are managed by CardFrameManager
        // Local state is only used as fallback when manager is unavailable
        if (!this.getConfig('useComponentSystem', true) || !this.manager) {
            // Initialize local state variables only if not using component system
            // This provides a fallback mechanism when the manager is unavailable
            this._highlighted = false;
            this._selected = false;
        }
        
        // Delegate initialization to manager if available
        if (this.getConfig('useComponentSystem', true) && this.manager) {
            console.log(`CardFrame (${this.getConfig('characterName', 'Unknown')}): Delegating initialization to CardFrameManager`);
            
            // The manager already initializes its components in its constructor,
            // but we'll call initializeComponents explicitly in case that changes in the future
            if (typeof this.manager.initializeComponents === 'function') {
                this.manager.initializeComponents();
            }
            
            // Create container for glow effect if needed (used by interaction component)
            if (!this.glowContainer) {
                this.glowContainer = this.scene.add.container(0, 0);
                this.add(this.glowContainer);
            }
        } else {
            console.warn(`CardFrame (${this.getConfig('characterName', 'Unknown')}): Component system not available, card will have limited functionality`);
        }
        
        // Set initial state
        if (this.getConfig('selected', false)) {
            this.setSelected(true, false); // Set selected without animation
        }
        
        if (this.getConfig('highlighted', false)) {
            this.setHighlighted(true, false); // Set highlighted without animation
        }
        
        // Add to scene
        scene.add.existing(this);
        
        // Add debug visuals if enabled
        if (this.getConfig('debugMode', false)) {
            this.createDebugVisuals();
        }
    }
    
    /**
     * Create the base frame with 9-slice scaling
     * Uses a type-themed frame border with proper corner handling
     */
    createBaseFrame() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager
                const frameBase = this.manager.createBaseFrame();
                
                // If manager's method returned a valid object, store it
                if (frameBase) {
                    this.frameBase = frameBase;
                    
                    // Create container for glow effect if not already created
                    if (!this.glowContainer) {
                        this.glowContainer = this.scene.add.container(0, 0);
                        this.add(this.glowContainer);
                    }
                    
                    // Convert to interactive area if needed
                    if (this.getConfig('interactive', false) || this.getConfig('hoverEnabled', false)) {
                        // Create a full-size hit area
                        const hitArea = new Phaser.Geom.Rectangle(
                            -this.config.width / 2,
                            -this.config.height / 2,
                            this.config.width,
                            this.config.height
                        );
                        
                        // Make frame interactive with proper hit area
                        this.frameBase.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
                    }
                    
                    return frameBase;
                }
            }
            
            // If delegation failed or is disabled, fallback to minimal implementation
            console.warn('CardFrame.createBaseFrame: Delegation failed, creating fallback frame');
            return this.createFallbackFrame();
        } catch (error) {
            console.error('CardFrame: Error creating base frame:', error);
            return this.createFallbackFrame();
        }
    }
    
    /**
     * Create a fallback frame if the normal frame creation fails
     * @returns {Phaser.GameObjects.Graphics} A simple rectangular frame
     */
    createFallbackFrame() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager if method exists
                if (typeof this.manager.createFallbackFrame === 'function') {
                    const fallbackFrame = this.manager.createFallbackFrame();
                    if (fallbackFrame) {
                        this.frameBase = fallbackFrame;
                        
                        // Create container for glow effect if not already created
                        if (!this.glowContainer) {
                            this.glowContainer = this.scene.add.container(0, 0);
                            this.add(this.glowContainer);
                        }
                        
                        return fallbackFrame;
                    }
                } else {
                    console.warn(`CardFrame (${this.getConfig('characterName', 'Unknown')}): Manager exists but has no createFallbackFrame method`);
                }
            }
            
            // Log warning for delegation failure
            console.warn(`CardFrame (${this.getConfig('characterName', 'Unknown')}): createFallbackFrame delegation failed, frame will be missing.`);
            return null;
        } catch (error) {
            console.error('CardFrame: Error delegating createFallbackFrame:', error);
            return null;
        }
    }
    
    /**
     * Add edge highlights and shadows to enhance depth perception
     * Added in v0.7.0.11 for enhanced visual depth
     */
    addEdgeDepthEffects() {
        // Skip if edge effects are disabled
        if (!this.getConfig('depthEffects', {edgeEffects: {enabled: true}}).edgeEffects.enabled) return;
        
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager
                const edgeEffects = this.manager.addEdgeDepthEffects();
                
                // If manager's method returned a valid object, store it
                if (edgeEffects) {
                    this.edgeEffects = edgeEffects;
                    return edgeEffects;
                }
            }
            
            // If delegation failed or is disabled, just return null without warning
            // Edge effects are optional, so silent failure is appropriate
            return null;
        } catch (error) {
            console.error('CardFrame: Error creating edge depth effects:', error);
            return null;
        }
    }
    
    /**
     * Create the backdrop rectangle for the card
     */
    createBackdrop() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager
                const backdrop = this.manager.createBackdrop();
                
                // If manager's method returned a valid object, store it
                if (backdrop) {
                    this.backdrop = backdrop;
                    return backdrop;
                }
            }
            
            // If delegation failed or is disabled, log warning and return null
            console.warn('CardFrame.createBackdrop: Delegation failed, backdrop will be missing');
            return null;
        } catch (error) {
            console.error('CardFrame: Error creating backdrop:', error);
            return null;
        }
    }
    
    /**
     * Create inner glow effect that matches the card's type color
     * The glow is applied to the frame itself for better visual depth
     */
    createInnerGlowEffect() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager
                const innerGlowGraphics = this.manager.createInnerGlowEffect();
                
                // If manager's method returned a valid object, store it
                if (innerGlowGraphics) {
                    this.innerGlowGraphics = innerGlowGraphics;
                    return innerGlowGraphics;
                }
            }
            
            // If delegation failed or is disabled, just return null without warning
            // Inner glow is optional, so silent failure is appropriate
            return null;
        } catch (error) {
            console.error('CardFrame: Error creating inner glow effect:', error);
            return null;
        }
    }
    
    /**
     * Create the portrait window with proper masking
     * Delegated to CardFrameManager
     */
    createPortraitWindow() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager
                const portraitContainer = this.manager.createPortraitWindow();
                
                // If manager's method returned a valid container, store it for backward compatibility
                if (portraitContainer) {
                    this.portraitContainer = portraitContainer;
                    return portraitContainer;
                }
            }
            
            // If delegation failed or is disabled, log warning
            console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): createPortraitWindow delegation failed, fallback not available.`);
            // No fallback for this method as it's too complex to reproduce minimally
            return null;
        } catch (error) {
            console.error('CardFrame: Error delegating portrait window creation:', error);
            return null;
        }
    }
    
    /**
     * Create and add character sprite
     * Delegated to CardFrameManager
     */
    createCharacterSprite() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager
                const characterSprite = this.manager.createCharacterSprite ? 
                    this.manager.createCharacterSprite() : null;
                
                // If manager's method returned a valid sprite, store it for backward compatibility
                if (characterSprite) {
                    this.characterSprite = characterSprite;
                    return characterSprite;
                }
            }
            
            // If delegation failed or is disabled, log warning and try fallback
            console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): createCharacterSprite delegation failed.`);
            
            // Attempt to create fallback if character sprite couldn't be created
            return this.createCharacterFallback();
        } catch (error) {
            console.error('CardFrame: Error delegating character sprite creation:', error);
            // Attempt fallback in case of error
            return this.createCharacterFallback();
        }
    }
    
    /**
     * Create a fallback visual if character sprite cannot be created
     * Delegated to CardFrameManager
     * @returns {Phaser.GameObjects.Text | null} The fallback character representation or null
     */
    createCharacterFallback() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager if method exists
                if (typeof this.manager.createCharacterFallback === 'function') {
                    const fallbackText = this.manager.createCharacterFallback();
                    return fallbackText;
                } else {
                    console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): Manager exists but has no createCharacterFallback method`);
                }
            }
            
            // Log warning for delegation failure
            console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): createCharacterFallback delegation failed, character fallback will be missing.`);
            return null;
        } catch (error) {
            console.error('CardFrame: Error delegating createCharacterFallback:', error);
            return null;
        }
    }
    
    /**
     * Create the decorative nameplate banner with beveled edges/scrollwork
     * Delegated to ContentComponent 
     */
    createNameBanner() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager if method exists
                const nameBannerContainer = this.manager.createNameBanner ? 
                    this.manager.createNameBanner() : null;
                
                // If manager's method returned a valid container, store it for backward compatibility
                if (nameBannerContainer) {
                    this.nameBannerContainer = nameBannerContainer;
                    return nameBannerContainer;
                }
            }
            
            // If delegation failed or is disabled, log warning and try fallback
            console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): createNameBanner delegation failed.`);
            
            // Use fallback banner as last resort
            return this.createFallbackNameBanner();
        } catch (error) {
            console.error('CardFrame: Error delegating name banner creation:', error);
            // Attempt fallback in case of error
            return this.createFallbackNameBanner();
        }
    }
    
    /**
     * Create a simple fallback name banner if the decorative one fails
     * Delegated to ContentComponent
     */
    createFallbackNameBanner() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager if method exists
                const fallbackBanner = this.manager.createFallbackNameBanner ? 
                    this.manager.createFallbackNameBanner() : null;
                
                // If manager's method returned a valid container, store it for backward compatibility
                if (fallbackBanner) {
                    this.nameBannerContainer = fallbackBanner;
                    return fallbackBanner;
                }
            }
            
            // If delegation failed or is disabled, log warning
            console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): createFallbackNameBanner delegation failed, no banner will be created.`);
            return null;
        } catch (error) {
            console.error('CardFrame: Error delegating fallback name banner creation:', error);
            return null;
        }
    }
    
    /**
     * Create health bar with animated transitions
     */
    createHealthBar() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager
                const healthBarContainer = this.manager.createHealthBar();
                
                // If manager's method returned a valid object, store it
                if (healthBarContainer) {
                    this.healthBarContainer = healthBarContainer;
                    return healthBarContainer;
                }
            }
            
            // If delegation failed or is disabled, log warning
            console.warn('CardFrame.createHealthBar: Delegation failed, health bar will be missing');
            return null;
        } catch (error) {
            console.error('CardFrame: Error creating health bar:', error);
            return null;
        }
    }
    
    /**
     * Setup interactivity for hovering and selection
     * Delegated to CardFrameManager
     */
    setupInteractivity() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager if method exists
                if (typeof this.manager.setupInteractivity === 'function') {
                    const result = this.manager.setupInteractivity();
                    return result;
                } else {
                    console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): Manager exists but has no setupInteractivity method`);
                }
            }
            
            // If delegation failed or is disabled, log warning
            console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): setupInteractivity delegation failed, interactivity will be missing`);
            return false;
        } catch (error) {
            console.error('CardFrame: Error delegating setupInteractivity:', error);
            return false;
        }
    }
    
    /**
     * Add a glow effect around the card
     * @param {number} intensity - Glow intensity (0-1)
     * Delegated to CardFrameManager
     */
    addGlowEffect(intensity) {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager if method exists
                if (typeof this.manager.addGlowEffect === 'function') {
                    const result = this.manager.addGlowEffect(intensity);
                    return result;
                } else {
                    console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): Manager exists but has no addGlowEffect method`);
                }
            }
            
            // If delegation failed or is disabled, log warning
            console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): addGlowEffect delegation failed, glow effect will be missing`);
            return null;
        } catch (error) {
            console.error('CardFrame: Error delegating addGlowEffect:', error);
            return null;
        }
    }
    
    /**
     * Remove glow effect
     * Delegated to CardFrameManager
     */
    removeGlowEffect() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager if method exists
                if (typeof this.manager.removeGlowEffect === 'function') {
                    const result = this.manager.removeGlowEffect();
                    return result;
                } else {
                    console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): Manager exists but has no removeGlowEffect method`);
                }
            }
            
            // If delegation failed or is disabled, log warning
            console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): removeGlowEffect delegation failed, glow effect will not be removed`);
            return false;
        } catch (error) {
            console.error('CardFrame: Error delegating removeGlowEffect:', error);
            return false;
        }
    }
    
    /**
     * Update the health display
     * @param {number} currentHealth - New current health value
     * @param {number} maxHealth - New maximum health value (optional)
     * @param {boolean} animate - Whether to animate the change (default: true)
     */
    updateHealth(currentHealth, maxHealth = null, animate = true) {
        try {
            // Validate health values
            if (currentHealth === undefined || currentHealth === null) {
                console.warn('CardFrame: Invalid health value provided');
                return;
            }
            
            // Update stored health values
            this.updateConfig('currentHealth', currentHealth);
            
            if (maxHealth !== null) {
                this.updateConfig('maxHealth', maxHealth);
            }
            
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                if (typeof this.manager.updateHealth === 'function') {
                    this.manager.updateHealth(currentHealth, maxHealth, animate);
                    return;
                } else {
                    console.warn('CardFrame.updateHealth: Manager exists but has no updateHealth method');
                }
            }
            
            // If delegation failed or is disabled, log warning
            console.warn('CardFrame.updateHealth: Delegation failed, health bar will not be updated');
        } catch (error) {
            console.error('CardFrame: Error updating health:', error);
        }
    }
    
    /**
     * Set the selection state of the card
     * @param {boolean} selected - Whether the card is selected
     * @param {boolean} animate - Whether to animate the change (default: true)
     * Delegated to CardFrameManager
     */
    setSelected(selected, animate = true) {
        try {
            // If component system is active, delegate to manager
            // The manager acts as the single source of truth for state
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager if method exists
                if (typeof this.manager.setSelected === 'function') {
                    return this.manager.setSelected(selected, animate);
                } else {
                    console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): Manager exists but has no setSelected method`);
                }
            }
            
            // Only update local state if manager not available (fallback)
            // This maintains the ability to work without the component system
            this._selected = selected;
            
            console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): setSelected delegation failed, selection will not be animated`);
            return false;
        } catch (error) {
            console.error('CardFrame: Error delegating setSelected:', error);
            return false;
        }
    }
    
    /**
     * Set the highlight state of the card (e.g., for active turn)
     * @param {boolean} highlighted - Whether the card is highlighted
     * @param {boolean} animate - Whether to animate the change (default: true)
     * Delegated to CardFrameManager
     */
    setHighlighted(highlighted, animate = true) {
        try {
            // If component system is active, delegate to manager
            // The manager acts as the single source of truth for state
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager if method exists
                if (typeof this.manager.setHighlighted === 'function') {
                    return this.manager.setHighlighted(highlighted, animate);
                } else {
                    console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): Manager exists but has no setHighlighted method`);
                }
            }
            
            // Only update local state if manager not available (fallback)
            // This maintains the ability to work without the component system
            this._highlighted = highlighted;
            
            console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): setHighlighted delegation failed, highlighting will not be animated`);
            return false;
        } catch (error) {
            console.error('CardFrame: Error delegating setHighlighted:', error);
            return false;
        }
    }
    
    /**
     * Get the appropriate color for the health bar based on percentage
     * @param {number} percent - Health percentage (0-1)
     * @returns {number} - Color as hex number
     */
    getHealthBarColor(percent) {
        // If component system is active, delegate to manager
        if (this.getConfig('useComponentSystem', true) && this.manager) {
            if (typeof this.manager.getHealthBarColor === 'function') {
                return this.manager.getHealthBarColor(percent);
            }
        }
        
        // Fallback colors if delegation fails
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
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Delegate to manager if method exists
                if (typeof this.manager.getTypeColor === 'function') {
                    return this.manager.getTypeColor(type);
                } else {
                    console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): Manager exists but has no getTypeColor method`);
                }
            }
            
            // Log warning for delegation failure
            console.warn(`CardFrame (${this.config.characterName || 'Unknown'}): getTypeColor delegation failed, using neutral color.`);
            return 0xAAAAAA; // Neutral gray as fallback
        } catch (error) {
            console.error('CardFrame: Error delegating getTypeColor:', error);
            return 0xAAAAAA; // Neutral gray as fallback
        }
    }
    
    /**
     * Update the character's name
     * @param {string} name - New character name
     * Delegated to ContentComponent
     */
    updateName(name) {
        if (!name) return;
        
        // Update stored name value
        this.updateConfig('characterName', name);
        
        // If component system is active, delegate to manager
        if (this.getConfig('useComponentSystem', true) && this.manager) {
            if (typeof this.manager.updateName === 'function') {
                this.manager.updateName(name);
                return;
            } else {
                console.warn('CardFrame.updateName: Manager exists but has no updateName method');
            }
        }
        
        // If delegation failed or is disabled, log warning
        console.warn(`CardFrame (${this.getConfig('characterName', 'Unknown')}): updateName delegation failed, name will not be updated.`);
    }
    
    /**
     * Create debug visualizations for component boundaries
     */
    createDebugVisuals() {
        try {
            // If component system is active, delegate to manager
            if (this.getConfig('useComponentSystem', true) && this.manager) {
                // Debug visuals don't need to return a value, but we'll check if method exists
                const debugMethodExists = typeof this.manager.createDebugVisuals === 'function';
                if (debugMethodExists) {
                    this.manager.createDebugVisuals();
                    return; // No need to continue with original implementation
                }
            }
            
            // If delegation failed or is disabled, log warning and continue silently
            console.warn('CardFrame.createDebugVisuals: Delegation failed, debug visuals will be missing');
            return null;
        } catch (error) {
            console.error('CardFrame: Error creating debug visuals:', error);
            return null;
        }
    }
    
    /**
     * Clean up all resources when card is destroyed
     */
    destroy() {
        try {
            // Delegate to manager first if available
            if (this.getConfig('useComponentSystem', true) && this.manager && typeof this.manager.destroy === 'function') {
                console.log('CardFrame: Delegating destroy to CardFrameManager');
                this.manager.destroy();
                this.manager = null; // Nullify reference after destroying
            }
            
            // Stop any active tweens for CardFrame itself
            if (this.scene && this.scene.tweens) {
                // Kill tweens for the container itself
                this.scene.tweens.killTweensOf(this);
                
                // Health-related objects
                if (this.healthBar) this.scene.tweens.killTweensOf(this.healthBar);
                if (this.healthText) this.scene.tweens.killTweensOf(this.healthText);
                if (this.healthBarContainer) this.scene.tweens.killTweensOf(this.healthBarContainer);
                
                // Content-related objects
                if (this.characterSprite) this.scene.tweens.killTweensOf(this.characterSprite);
                if (this.portraitContainer) this.scene.tweens.killTweensOf(this.portraitContainer);
                if (this.nameText) this.scene.tweens.killTweensOf(this.nameText);
                if (this.nameBannerContainer) this.scene.tweens.killTweensOf(this.nameBannerContainer);
                
                // Visual effects
                if (this.edgeEffects) this.scene.tweens.killTweensOf(this.edgeEffects);
                if (this.innerGlowGraphics) this.scene.tweens.killTweensOf(this.innerGlowGraphics);
                if (this.backdrop) this.scene.tweens.killTweensOf(this.backdrop);
                if (this.frameBase) this.scene.tweens.killTweensOf(this.frameBase);
                if (this.glowContainer) this.scene.tweens.killTweensOf(this.glowContainer);
            }
            
            // Reset cursor if interactive
            if (this.getConfig('interactive', false)) {
                document.body.style.cursor = 'default';
            }
            
            // Call parent destroy method to clean up container and children
            super.destroy(true);
        } catch (error) {
            console.error('CardFrame: Error during destroy:', error);
            try {
                // Still try to do critical cleanup
                if (this.config && this.config.interactive) {
                    document.body.style.cursor = 'default';
                }
                super.destroy(true);
            } catch (fallbackError) {
                console.error('CardFrame: Critical error during destroy fallback:', fallbackError);
            }
        }
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardFrame;
}

// Make available globally
/**
 * Get configuration value with fallback mechanism
 * @param {string} property - The configuration property to get
 * @param {*} defaultValue - Default value if property doesn't exist
 * @returns {*} The configuration value
 */
CardFrame.prototype.getConfig = function(property, defaultValue) {
    // Try to get from manager first (primary source of truth)
    if (this.localConfig.useComponentSystem && this.manager && this.manager.config) {
        if (this.manager.config[property] !== undefined) {
            return this.manager.config[property];
        }
    }
    
    // Try local config next (for essential properties)
    if (this.localConfig && this.localConfig[property] !== undefined) {
        return this.localConfig[property];
    }
    
    // During transition period, check original config (will be removed later)
    if (this._originalConfig && this._originalConfig[property] !== undefined) {
        return this._originalConfig[property];
    }
    
    // Return default value if property not found
    return defaultValue;
};

/**
 * Update configuration value
 * @param {string} property - The configuration property to update
 * @param {*} value - The new value
 */
CardFrame.prototype.updateConfig = function(property, value) {
    // Update in manager first (primary source of truth)
    if (this.localConfig.useComponentSystem && this.manager && this.manager.config) {
        this.manager.config[property] = value;
    }
    
    // Update in local config if it's an essential property
    if (this.localConfig && Object.prototype.hasOwnProperty.call(this.localConfig, property)) {
        this.localConfig[property] = value;
    }
    
    // During transition period, update original config (will be removed later)
    if (this._originalConfig) {
        this._originalConfig[property] = value;
    }
    
    // Also update this.config for backward compatibility
    if (this.config) {
        this.config[property] = value;
    }
};

window.CardFrame = CardFrame;