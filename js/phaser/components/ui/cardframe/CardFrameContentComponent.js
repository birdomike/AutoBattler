/**
 * CardFrameContentComponent.js
 * Handles character sprite and nameplate rendering for CardFrame.
 * Part of the component-based CardFrame refactoring project.
 * 
 * IMPORTANT: This component is the SINGLE SOURCE OF TRUTH for all character content,
 * portrait window, and nameplate styling/behavior. To modify ANY aspect of these elements,
 * edit the configuration options in THIS file rather than in CardFrameManager.js.
 * 
 * CODE REVIEW GUIDELINE: Any PR that adds content-related configuration to
 * CardFrameManager.js should be rejected. All such configuration belongs here.
 */

/**
 * ===========================================
 * CONTENT COMPONENT CONFIGURATION DEFAULTS
 * Modify these values to customize character and name display.
 * ===========================================
 */
const CONTENT_DEFAULTS = {
    // Character information
    characterKey: null,         // Texture key for character sprite
    characterName: 'Character', // Name to display on card
    characterType: 'neutral',   // Type for themed styling
    characterTeam: null,        // Team identifier
    
    // Art positioning
    artOffsetX: 0,              // Fine-tune character art horizontal position
    artOffsetY: 0,              // Fine-tune character art vertical position
    artScale: 2,                // Scaling factor for character art
    
    // Portrait window
    portrait: {
        width: 200,             // Width of portrait area
        height: 240,            // Height of portrait area
        offsetY: -20,           // Portrait vertical offset from center
        mask: true,             // Whether to mask the portrait
        cornerRadius: 8,        // Corner radius for portrait area
        innerGlow: {
            width: 2,           // Width of portrait inner glow line
            opacity: .2       // Opacity of portrait inner glow
        }
    },
    
    // Nameplate
    nameBanner: {
        height: 25,             // Height of name banner
        width: 210,             // Width of name banner
        offsetY: 135,           // Distance from center to nameplate
        opacity: 0.8,           // Opacity of name banner background
        cornerRadius: 8,        // Corner radius for name banner
        bevel: {
            width: 2,           // Width of name banner bevel line
            opacity: 0.3,       // Opacity of name banner bevel
            color: 0xFFFFFF     // Color of name banner bevel
        }
    },
    
    // Name text
    nameText: {
        fontSize: 16,           // Font size for name text
        fontFamily: 'serif',    // Font family for name text
        color: '#FFFFFF',       // Text color
        stroke: '#000000',      // Stroke color
        strokeThickness: 3      // Stroke thickness
    },
    
    // Decorative elements
    decorative: {
        showFlourishes: true,   // Whether to show flourishes around name
        flourishSpacing: {
            maxWidth: 45,       // Maximum spacing between name and flourish
            margin: 15          // Margin to maintain between name and flourish
        },
        teamIndicatorOffset: 15 // Offset from edge for team indicator
    },
    
    // Fallback character
    fallback: {
        fontSize: 48,           // Font size for fallback character
        fontFamily: 'Arial',    // Font family for fallback character
        color: '#FFFFFF',       // Text color for fallback
        stroke: '#000000',      // Stroke color for fallback
        strokeThickness: 4      // Stroke thickness for fallback
    }
};
class CardFrameContentComponent {
    /**
     * Create a new CardFrameContentComponent.
     * @param {Phaser.Scene} scene - The scene this component belongs to.
     * @param {Phaser.GameObjects.Container} container - The parent CardFrameManager container this component will add GameObjects to.
     * @param {number} typeColor - The color to use for type-themed elements.
     * @param {Object} config - Configuration options.
     */
    constructor(scene, container, typeColor, config = {}) {
        // Validate required parameters
        if (!scene || !container) {
            console.error('CardFrameContentComponent constructor: Missing required parameters (scene or container). Component will not initialize.');
            throw new Error('CardFrameContentComponent: Missing required scene or container parameters.'); // Fail fast
        }
        
        this.scene = scene;
        this.container = container; // This is the CardFrameManager instance
        this.typeColor = typeColor || 0xAAAAAA; // Default to neutral gray if no type color provided
        
        // Configuration with defaults - reference the top-level defaults
        // IMPORTANT: Object.assign pattern ensures config values override defaults
        this.config = Object.assign({}, CONTENT_DEFAULTS, config);
        
        // Handle legacy property mapping for backward compatibility
        if (config.portraitWidth !== undefined) this.config.portrait.width = config.portraitWidth;
        if (config.portraitHeight !== undefined) this.config.portrait.height = config.portraitHeight;
        if (config.portraitOffsetY !== undefined) this.config.portrait.offsetY = config.portraitOffsetY;
        if (config.portraitMask !== undefined) this.config.portrait.mask = config.portraitMask;
        if (config.nameBannerHeight !== undefined) this.config.nameBanner.height = config.nameBannerHeight;
        if (config.nameBannerWidth !== undefined) this.config.nameBanner.width = config.nameBannerWidth;
        if (config.nameFontSize !== undefined) this.config.nameText.fontSize = config.nameFontSize;
        if (config.nameFontFamily !== undefined) this.config.nameText.fontFamily = config.nameFontFamily;
        if (config.nameOffsetY !== undefined) this.config.nameBanner.offsetY = config.nameOffsetY;
        if (config.showDecorativeFlourishes !== undefined) this.config.decorative.showFlourishes = config.showDecorativeFlourishes;
        
        // Object references for Phaser GameObjects managed by this component
        this.portraitContainer = null;
        this.portraitFrame = null;
        this.portraitMask = null;
        this.characterSprite = null;
        this.nameBannerContainer = null;
        this.nameBanner = null;
        this.nameText = null;
        this.leftFlourish = null;
        this.rightFlourish = null;
        
        // Initialize the content elements
        this.initialize();
        
        console.log(`CardFrameContentComponent: Initialized for character ${this.config.characterName || 'Unknown'}`);
    }
    
    /**
     * Initialize all content elements
     */
    initialize() {
        try {
            // Create elements in proper order
            this.createPortraitWindow();
            
            if (this.config.characterKey) {
                this.createCharacterSprite();
            } else {
                this.createCharacterFallback();
            }
            
            this.createNameBanner();
        } catch (error) {
            console.error('CardFrameContentComponent: Error during initialization:', error);
            // Continue with partial initialization rather than throwing
        }
    }
    
    /**
     * Create the portrait window with proper masking
     */
    createPortraitWindow() {
        try {
            // Create portrait container with offset
            this.portraitContainer = this.scene.add.container(
                0, 
                this.config.portrait.offsetY
            );
            
            // Create portrait background/frame
            this.portraitFrame = this.scene.add.rectangle(
                0, 0,
                this.config.portrait.width,
                this.config.portrait.height,
                0x000000,
                0.1
            );
            
            // Add subtle inner glow effect to frame
            const innerGlow = this.scene.add.graphics();
            const glowColor = this.typeColor;
            
            innerGlow.lineStyle(
                this.config.portrait.innerGlow.width, 
                glowColor, 
                this.config.portrait.innerGlow.opacity
            );
            innerGlow.strokeRoundedRect(
                -this.config.portrait.width / 2,
                -this.config.portrait.height / 2,
                this.config.portrait.width,
                this.config.portrait.height,
                this.config.portrait.cornerRadius
            );
            
            // Create mask for portrait window if enabled
            if (this.config.portrait.mask) {
                this.portraitMask = this.scene.make.graphics();
                this.portraitMask.fillStyle(0xffffff);
                this.portraitMask.fillRoundedRect(
                    -this.config.portrait.width / 2,
                    -this.config.portrait.height / 2,
                    this.config.portrait.width,
                    this.config.portrait.height,
                    this.config.portrait.cornerRadius
                );
            }
            
            // Add to portrait container
            this.portraitContainer.add(this.portraitFrame);
            this.portraitContainer.add(innerGlow);
            
            // Add portrait container to main container
            this.container.add(this.portraitContainer);
            
            return this.portraitContainer;
        } catch (error) {
            console.error('CardFrameContentComponent: Error creating portrait window:', error);
            return null;
        }
    }
    
    /**
     * Create and add character sprite
     * @returns {Phaser.GameObjects.Sprite|null} The created character sprite or null if failed
     */
    createCharacterSprite() {
        try {
            // Validate character key and texture
            if (!this.config.characterKey) {
                console.warn(`CardFrameContentComponent: No character key provided for ${this.config.characterName}, creating fallback.`);
                return this.createCharacterFallback();
            }
            
            // Check if texture exists
            const textureExists = this.scene.textures.exists(this.config.characterKey);
            
            if (!textureExists) {
                console.warn(`CardFrameContentComponent: Texture '${this.config.characterKey}' not found for ${this.config.characterName}, creating fallback.`);
                return this.createCharacterFallback();
            }
            
            // Create sprite at CENTER of container for maximum visibility
            this.characterSprite = this.scene.add.sprite(0, 0, this.config.characterKey);
            
            // Apply visibility settings
            this.characterSprite.setAlpha(1);
            this.characterSprite.setVisible(true);
            this.characterSprite.setScale(this.config.artScale);
            
            // Important: DELIBERATELY NOT APPLYING MASK to ensure character is visible
            // This was determined to be the solution in version 0.7.0.8
            
            // Add directly to main container for maximum visibility
            this.container.add(this.characterSprite);
            this.characterSprite.setDepth(1000); // High depth to ensure visibility
            
            return this.characterSprite;
        } catch (error) {
            console.error(`CardFrameContentComponent: Error creating character sprite for ${this.config.characterName}:`, error);
            return this.createCharacterFallback();
        }
    }
    
    /**
     * Create a fallback visual if character sprite cannot be created
     */
    createCharacterFallback() {
        try {
            // Create a text placeholder with character's first letter
            const firstLetter = this.config.characterName.charAt(0).toUpperCase();
            
            // Get portrait container position for consistency with sprite positioning
            const portraitY = this.config.portrait.offsetY;
            
            const fallbackText = this.scene.add.text(
                0, // Center horizontally
                portraitY, // Position at portrait vertical position
                firstLetter,
                {
                    fontFamily: this.config.fallback.fontFamily,
                    fontSize: this.config.fallback.fontSize,
                    color: this.config.fallback.color,
                    stroke: this.config.fallback.stroke,
                    strokeThickness: this.config.fallback.strokeThickness
                }
            ).setOrigin(0.5);
            
            // Add directly to main container
            this.container.add(fallbackText);
            
            // Set high depth to ensure visibility
            fallbackText.setDepth(100);
            
            // Store reference for later cleanup
            this.fallbackText = fallbackText;
            
            return fallbackText;
        } catch (error) {
            console.error('CardFrameContentComponent: Error creating character fallback:', error);
            return null;
        }
    }
    
    /**
     * Create the decorative nameplate banner with beveled edges/scrollwork
     */
    createNameBanner() {
        try {
            // Position at the bottom of the card
            const bannerY = this.config.nameBanner.offsetY;
            
            // Create banner container
            this.nameBannerContainer = this.scene.add.container(0, bannerY);
            
            // Skip texture check and use graphics rendering by default
            
            // Create nameplate using graphics
            const nameplateBg = this.scene.add.graphics();
            
            // Draw decorative background
            nameplateBg.fillStyle(this.typeColor, this.config.nameBanner.opacity);
            nameplateBg.fillRoundedRect(
                -this.config.nameBanner.width / 2,
                -this.config.nameBanner.height / 2,
                this.config.nameBanner.width,
                this.config.nameBanner.height,
                this.config.nameBanner.cornerRadius
            );
            
            // Add bevel effect
            nameplateBg.lineStyle(
                this.config.nameBanner.bevel.width, 
                this.config.nameBanner.bevel.color, 
                this.config.nameBanner.bevel.opacity
            );
            nameplateBg.strokeRoundedRect(
                -this.config.nameBanner.width / 2 + 1,
                -this.config.nameBanner.height / 2 + 1,
                this.config.nameBanner.width - 2,
                this.config.nameBanner.height - 2,
                this.config.nameBanner.cornerRadius - 1
            );
            
            this.nameBanner = nameplateBg;
            
            // Create name text with shadow for depth
            this.nameText = this.scene.add.text(
                0, 0,
                this.config.characterName,
                {
                    fontFamily: this.config.nameText.fontFamily,
                    fontSize: this.config.nameText.fontSize,
                    color: this.config.nameText.color,
                    stroke: this.config.nameText.stroke,
                    strokeThickness: this.config.nameText.strokeThickness,
                    align: 'center',
                    shadow: {
                        offsetX: 2,
                        offsetY: 2,
                        color: '#000000',
                        blur: 2,
                        fill: true
                    }
                }
            ).setOrigin(0.5);
            
            // Add decorative flourishes on sides of name if enabled
            if (this.config.decorative.showFlourishes) {
                // Check if flourish textures exist
                const leftFlourish = 'nameplate-flourish-left';
                const rightFlourish = 'nameplate-flourish-right';
                
                // Calculate spacing based on text width
                const flourishSpacing = Math.min(
                    this.config.decorative.flourishSpacing.maxWidth, 
                    this.config.nameBanner.width / 2 - this.nameText.width / 2 - this.config.decorative.flourishSpacing.margin
                );
                
                if (this.scene.textures.exists(leftFlourish) && this.scene.textures.exists(rightFlourish)) {
                    this.leftFlourish = this.scene.add.image(-flourishSpacing, 0, leftFlourish)
                        .setOrigin(1, 0.5)
                        .setTint(this.typeColor);
                        
                    this.rightFlourish = this.scene.add.image(flourishSpacing, 0, rightFlourish)
                        .setOrigin(0, 0.5)
                        .setTint(this.typeColor);
                        
                    // Add flourishes to banner container
                    this.nameBannerContainer.add([this.leftFlourish, this.rightFlourish]);
                } else {
                    // Fallback decorative elements if textures don't exist
                    const leftDeco = this.scene.add.text(-flourishSpacing, 0, '✦', {
                        fontFamily: 'serif',
                        fontSize: this.config.nameFontSize,
                        color: '#FFFFFF'
                    }).setOrigin(0.5);
                    
                    const rightDeco = this.scene.add.text(flourishSpacing, 0, '✦', {
                        fontFamily: 'serif',
                        fontSize: this.config.nameFontSize,
                        color: '#FFFFFF'
                    }).setOrigin(0.5);
                    
                    // Store references for cleanup
                    this.leftFlourish = leftDeco;
                    this.rightFlourish = rightDeco;
                    
                    // Add fallback flourishes to banner container
                    this.nameBannerContainer.add([leftDeco, rightDeco]);
                }
            }
            
            // Add team indicator if specified
            if (this.config.characterTeam) {
                const teamSymbol = this.config.characterTeam === 'player' ? '♦' : '♢';
                const teamColor = this.config.characterTeam === 'player' ? '#55FF55' : '#FF5555';
                
                const teamIndicator = this.scene.add.text(
                    -this.config.nameBanner.width / 2 + this.config.decorative.teamIndicatorOffset, 
                    0,
                    teamSymbol,
                    {
                        fontFamily: this.config.nameText.fontFamily,
                        fontSize: this.config.nameText.fontSize,
                        color: teamColor
                    }
                ).setOrigin(0.5);
                
                this.teamIndicator = teamIndicator;
                this.nameBannerContainer.add(teamIndicator);
            }
            
            // Add elements to banner container
            this.nameBannerContainer.add([this.nameBanner, this.nameText]);
            
            // Add banner container to main container
            this.container.add(this.nameBannerContainer);
            
            return this.nameBannerContainer;
        } catch (error) {
            console.error('CardFrameContentComponent: Error creating name banner:', error);
            return this.createFallbackNameBanner();
        }
    }
    
    /**
     * Create a simple fallback name banner if the decorative one fails
     */
    createFallbackNameBanner() {
        try {
            // Position at the bottom of the card
            const bannerY = this.config.nameBanner.offsetY;
            
            // Create banner container
            this.nameBannerContainer = this.scene.add.container(0, bannerY);
            
            // Create simple name text
            this.nameText = this.scene.add.text(
                0, 0,
                this.config.characterName,
                {
                    fontFamily: 'Arial',
                    fontSize: this.config.nameText.fontSize,
                    color: this.config.nameText.color,
                    stroke: this.config.nameText.stroke,
                    strokeThickness: 2
                }
            ).setOrigin(0.5);
            
            // Add to banner container
            this.nameBannerContainer.add(this.nameText);
            
            // Add banner container to main container
            this.container.add(this.nameBannerContainer);
            
            return this.nameBannerContainer;
        } catch (error) {
            console.error('CardFrameContentComponent: Error creating fallback name banner:', error);
            return null;
        }
    }
    
    /**
     * Update the character's name
     * @param {string} name - New character name
     */
    updateName(name) {
        if (!name) return;
        
        // Update config value
        this.config.characterName = name;
        
        // Update text if it exists
        if (this.nameText && this.nameText.scene) {
            this.nameText.setText(name);
        }
    }
    
    /**
     * Clean up all resources managed by this component
     */
    destroy() {
        console.log(`CardFrameContentComponent: Destroying content component for ${this.config.characterName || 'Unknown'}`);
        try {
            // Kill any active tweens
            if (this.scene && this.scene.tweens) {
                if (this.characterSprite) this.scene.tweens.killTweensOf(this.characterSprite);
                if (this.nameText) this.scene.tweens.killTweensOf(this.nameText);
                if (this.portraitContainer) this.scene.tweens.killTweensOf(this.portraitContainer);
                if (this.nameBannerContainer) this.scene.tweens.killTweensOf(this.nameBannerContainer);
            }
            
            // Destroy all created GameObjects if they exist and have a scene
            // Portrait elements
            if (this.portraitContainer && this.portraitContainer.scene) {
                this.portraitContainer.destroy();
            }
            
            if (this.portraitMask && this.portraitMask.scene) {
                this.portraitMask.destroy();
            }
            
            // Character sprite (if added directly to main container)
            if (this.characterSprite && this.characterSprite.scene) {
                this.characterSprite.destroy();
            }
            
            // Fallback text
            if (this.fallbackText && this.fallbackText.scene) {
                this.fallbackText.destroy();
            }
            
            // Name banner elements
            if (this.nameBannerContainer && this.nameBannerContainer.scene) {
                this.nameBannerContainer.destroy();
            }
            
            // Clear references to prevent memory leaks
            this.portraitContainer = null;
            this.portraitFrame = null;
            this.portraitMask = null;
            this.characterSprite = null;
            this.fallbackText = null;
            this.nameBannerContainer = null;
            this.nameBanner = null;
            this.nameText = null;
            this.leftFlourish = null;
            this.rightFlourish = null;
            this.teamIndicator = null;
            this.scene = null;
            this.container = null;
            this.config = null;
        } catch (error) {
            console.error('CardFrameContentComponent: Error during destroy:', error);
        }
    }
}

// Export for module use (if ever transitioning to a module system)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardFrameContentComponent;
}

// Make available globally for current script loading setup
if (typeof window !== 'undefined') {
    window.CardFrameContentComponent = CardFrameContentComponent;
} else {
    console.error('CardFrameContentComponent: Window object not found. Cannot attach to global scope.');
}
