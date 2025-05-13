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
     * Create a new card frame
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
            healthBarOffsetY: 90,       // Distance from center to health bar
            showHealthText: true,       // Whether to show health text
            
            // Nameplate
            nameBannerHeight: 40,       // Height of name banner
            nameBannerWidth: 210,       // Width of name banner (slightly less than card width)
            nameFontSize: 16,           // Font size for name text
            nameFontFamily: 'serif',    // Font family for name text
            nameOffsetY: 110,           // Distance from center to nameplate
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
        
        // Store internal state
        this._highlighted = false;
        this._selected = false;
        
        // Auto-detect type color if not provided
        this.typeColor = this.getTypeColor(this.config.characterType);
        
        // Create card components
        this.createBaseFrame();
        this.createBackgroundElements();
        this.createPortraitWindow();
        
        if (this.config.characterKey) {
            this.createCharacterSprite();
        }
        
        this.createNameBanner();
        
        if (this.config.showHealth) {
            this.createHealthBar();
        }
        
        // Setup interactivity if enabled
        if (this.config.interactive) {
            this.setupInteractivity();
        }
        
        // Set initial state
        if (this.config.selected) {
            this.setSelected(true, false); // Set selected without animation
        }
        
        if (this.config.highlighted) {
            this.setHighlighted(true, false); // Set highlighted without animation
        }
        
        // Add to scene
        scene.add.existing(this);
        
        // Add debug visuals if enabled
        if (this.config.debugMode) {
            this.createDebugVisuals();
        }
    }
    
    /**
     * Create the base frame with 9-slice scaling
     * Uses a type-themed frame border with proper corner handling
     */
    createBaseFrame() {
        try {
            // Determine frame texture key to use
            const frameTextureKey = `${this.config.frameTexture}-${this.config.characterType}`;
            let textureToUse = frameTextureKey;
            
            // Check if type-specific texture exists, fallback to base if not
            if (!this.scene.textures.exists(frameTextureKey)) {
                textureToUse = this.config.frameTexture;
                console.log(`CardFrame: Type-specific frame texture "${frameTextureKey}" not found, using base texture "${this.config.frameTexture}"`);
            }
            
            // Create frame with 9-slice for proper scaling
            if (this.scene.textures.exists(textureToUse)) {
                // Use 9-slice for texture-based frame
                this.frameBase = this.scene.add.nineslice(
                    0, 0,
                    this.config.width,
                    this.config.height,
                    textureToUse,
                    this.config.sliceMargins
                ).setOrigin(0.5);
                
                // Set frame alpha
                this.frameBase.setAlpha(this.config.frameAlpha);
                
                // Tint with type color if using base frame
                if (textureToUse === this.config.frameTexture && this.typeColor) {
                    this.frameBase.setTint(this.typeColor);
                }
            } else {
                // Fallback: Create frame using graphics if texture doesn't exist
                console.warn(`CardFrame: Frame texture "${textureToUse}" not found, using graphics fallback`);
                
                // Create frame graphics
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
            }
            
            // Add frame to container
            this.add(this.frameBase);
            
            // Create container for glow effect (used for selection/hover)
            this.glowContainer = this.scene.add.container(0, 0);
            this.add(this.glowContainer);
            
            // Convert to interactive area if needed
            if (this.config.interactive || this.config.hoverEnabled) {
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
        } catch (error) {
            console.error('CardFrame: Error creating base frame:', error);
            
            // Create minimal fallback frame
            this.createFallbackFrame();
        }
    }
    
    /**
     * Create a fallback frame if the normal frame creation fails
     * Simple rectangular frame with type color
     */
    createFallbackFrame() {
        // Create basic rectangular frame
        const fallbackFrame = this.scene.add.graphics();
        fallbackFrame.lineStyle(4, this.typeColor, 1);
        fallbackFrame.strokeRect(
            -this.config.width / 2,
            -this.config.height / 2,
            this.config.width,
            this.config.height
        );
        
        this.frameBase = fallbackFrame;
        this.add(this.frameBase);
        
        // Create container for glow effect (used for selection/hover)
        this.glowContainer = this.scene.add.container(0, 0);
        this.add(this.glowContainer);
    }
    
    /**
     * Create background elements for the card
     */
    createBackgroundElements() {
        try {
            // Create semi-transparent background fill
            const bgRect = this.scene.add.rectangle(
                0, 0,
                this.config.width - (this.config.borderWidth * 2) + 2, // Adjusted to reduce gap with frame
                this.config.height - (this.config.borderWidth * 2) + 2, // Adjusted to reduce gap with frame
                this.typeColor,
                this.config.backgroundAlpha
            );
            
            // Add soft inner shadow effect
            const innerShadow = this.scene.add.graphics();
            innerShadow.fillStyle(0x000000, 0.2);
            innerShadow.fillRoundedRect(
                -this.config.width / 2 + this.config.borderWidth + 2,
                -this.config.height / 2 + this.config.borderWidth + 2,
                this.config.width - (this.config.borderWidth * 2) - 4,
                this.config.height - (this.config.borderWidth * 2) - 4,
                this.config.cornerRadius - this.config.borderWidth / 2
            );
            
            // Add to container
            this.add(bgRect);
            this.add(innerShadow);
        } catch (error) {
            console.error('CardFrame: Error creating background elements:', error);
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
                this.config.portraitOffsetY
            );
            
            // Create portrait background/frame
            this.portraitFrame = this.scene.add.rectangle(
                0, 0,
                this.config.portraitWidth,
                this.config.portraitHeight,
                0x000000,
                0.1
            );
            
            // Add subtle inner glow effect to frame
            const innerGlow = this.scene.add.graphics();
            const glowColor = this.typeColor;
            
            innerGlow.lineStyle(2, glowColor, 0.3);
            innerGlow.strokeRoundedRect(
                -this.config.portraitWidth / 2,
                -this.config.portraitHeight / 2,
                this.config.portraitWidth,
                this.config.portraitHeight,
                8
            );
            
            // Create mask for portrait window if enabled
            if (this.config.portraitMask) {
                this.portraitMask = this.scene.make.graphics();
                this.portraitMask.fillStyle(0xffffff);
                this.portraitMask.fillRoundedRect(
                    -this.config.portraitWidth / 2,
                    -this.config.portraitHeight / 2,
                    this.config.portraitWidth,
                    this.config.portraitHeight,
                    8 // Rounded corners
                );
            }
            
            // Add to portrait container
            this.portraitContainer.add(this.portraitFrame);
            this.portraitContainer.add(innerGlow);
            
            // Add portrait container to main container
            this.add(this.portraitContainer);
        } catch (error) {
            console.error('CardFrame: Error creating portrait window:', error);
        }
    }
    
    /**
     * Create and add character sprite with focused debugging approach (v0.7.0.6)
     * Implements targeted diagnostics to isolate rendering issues
     */
    createCharacterSprite() {
        try {
            console.log(`==== CARD FRAME DEBUGGING [START] ====`);
            console.log(`CardFrame (${this.config.characterName}): Debugging character sprite rendering`);
            
            // STEP 1: Validate character key and texture
            console.log(`1. TEXTURE VALIDATION:`);
            if (!this.config.characterKey) {
                console.warn(`- No character key provided, aborting`);
                return;
            }
            
            // Check if texture exists
            const textureExists = this.scene.textures.exists(this.config.characterKey);
            console.log(`- Texture key: "${this.config.characterKey}" exists: ${textureExists}`);
            
            if (!textureExists) {
                console.warn(`- Character texture not found, listing available textures:`);
                const characterTextures = Object.keys(this.scene.textures.list)
                    .filter(key => key.startsWith('character_'));
                console.log(`- Available character textures (${characterTextures.length}): ${characterTextures.join(', ')}`);
                return;
            }
            
            // STEP 2: Verify texture dimensions and frame data
            console.log(`2. TEXTURE DIMENSIONS:`);
            const texture = this.scene.textures.get(this.config.characterKey);
            if (texture && texture.source && texture.source[0]) {
                const source = texture.source[0];
                console.log(`- Texture dimensions: ${source.width}x${source.height}`);
                console.log(`- Frames in texture: ${Object.keys(texture.frames).length}`);
                // Log specific frame properties instead of using JSON.stringify to avoid circular references
                if (texture.frames && texture.frames.__BASE) {
                    const baseFrame = texture.frames.__BASE;
                    console.log(`- Default frame properties: width=${baseFrame.width || 'unknown'}, height=${baseFrame.height || 'unknown'}, x=${baseFrame.x || 0}, y=${baseFrame.y || 0}`);
                } else {
                    console.log(`- Default frame: Not available`);
                }
            } else {
                console.warn(`- Texture exists but structure is invalid or unexpected`);
            }
            
            // STEP 3: Create sprite with minimal configuration
            console.log(`3. CREATING SPRITE:`);
            // Create sprite at CENTER of container for maximum visibility during testing
            this.characterSprite = this.scene.add.sprite(0, 0, this.config.characterKey);
            console.log(`- Sprite created at position (0, 0)`);
            
            // STEP 4: Force visibility settings
            console.log(`4. FORCING VISIBILITY:`);
            this.characterSprite.setAlpha(1);
            this.characterSprite.setVisible(true);
            this.characterSprite.setScale(this.config.artScale); // Using config scale instead of fixed value
            // Removed red tint to make characters look normal
            console.log(`- Applied: alpha=1, visible=true, scale=${this.config.artScale}`);
            
            // STEP 5: Verify sprite dimensions
            console.log(`5. SPRITE DIMENSIONS:`);
            console.log(`- Sprite width: ${this.characterSprite.width}, height: ${this.characterSprite.height}`);
            console.log(`- Sprite displayWidth: ${this.characterSprite.displayWidth}, displayHeight: ${this.characterSprite.displayHeight}`);
            
            // STEP 6: Container hierarchy check
            console.log(`6. CONTAINER HIERARCHY:`);
            console.log(`- CardFrame position: (${this.x}, ${this.y})`);
            console.log(`- CardFrame dimensions: ${this.config.width}x${this.config.height}`);
            console.log(`- CardFrame visible: ${this.visible}, alpha: ${this.alpha}`);
            console.log(`- CardFrame depth: ${this.depth}`);
            console.log(`- CardFrame parent: ${this.parentContainer ? 'exists' : 'none'}`);
            
            // STEP 7: Add to container WITHOUT mask for testing
            console.log(`7. ADDING TO CONTAINER:`);
            // DELIBERATELY NOT APPLYING MASK FOR TESTING
            console.log(`- Skipping mask application for testing`);
            
            // Add directly to CardFrame container
            this.add(this.characterSprite);
            this.characterSprite.setDepth(1000); // EXTREMELY high depth
            this.bringToTop(this.characterSprite);
            
            console.log(`- Added to container with depth: ${this.characterSprite.depth}`);
            console.log(`- Final visibility state: visible=${this.characterSprite.visible}, alpha=${this.characterSprite.alpha}`);
            console.log(`==== CARD FRAME DEBUGGING [END] ====`);
        } catch (error) {
            console.error('CardFrame: Error in debug rendering:', error);
            // Do not fall back to createCharacterFallback() to isolate the issue
        }
    }
    
    /**
     * Create a fallback visual if character sprite cannot be created
     * Changed in v0.7.0.5: Fallback text is now added directly to CardFrame like the sprite
     */
    createCharacterFallback() {
        try {
            // Create a text placeholder with character's first letter
            const firstLetter = this.config.characterName.charAt(0).toUpperCase();
            
            // Get portraitContainer position for consistency with sprite positioning
            const portraitY = this.config.portraitOffsetY;
            
            const fallbackText = this.scene.add.text(
                0, // Center horizontally
                portraitY, // Position at portrait vertical position
                firstLetter,
                {
                    fontFamily: 'Arial',
                    fontSize: 48,
                    color: '#FFFFFF',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            ).setOrigin(0.5);
            
            // Add directly to CardFrame container
            this.add(fallbackText);
            
            // Set high depth to ensure visibility
            fallbackText.setDepth(100);
        } catch (error) {
            console.error('CardFrame: Error creating character fallback:', error);
        }
    }
    
    /**
     * Create the decorative nameplate banner with beveled edges/scrollwork
     */
    createNameBanner() {
        try {
            // Position at the bottom of the card
            const bannerY = this.config.nameOffsetY;
            
            // Create banner container
            this.nameBannerContainer = this.scene.add.container(0, bannerY);
            
            // Determine nameplate texture to use
            const nameplateTextureKey = `${this.config.nameplateTexture}-${this.config.characterType}`;
            let textureToUse = nameplateTextureKey;
            
            // Check if type-specific texture exists, fallback to base if not
            if (!this.scene.textures.exists(nameplateTextureKey)) {
                textureToUse = this.config.nameplateTexture;
                console.log(`CardFrame: Type-specific nameplate texture "${nameplateTextureKey}" not found, using base texture "${this.config.nameplateTexture}"`);
            }
            
            // Create decorative banner background
            if (this.scene.textures.exists(textureToUse)) {
                // Use 9-slice for texture-based nameplate
                this.nameBanner = this.scene.add.nineslice(
                    0, 0,
                    this.config.nameBannerWidth,
                    this.config.nameBannerHeight,
                    textureToUse,
                    [15, 15, 15, 15] // Left, right, top, bottom slice points for beveled edges
                ).setOrigin(0.5);
                
                // Tint with type color if using base nameplate
                if (textureToUse === this.config.nameplateTexture && this.typeColor) {
                    this.nameBanner.setTint(this.typeColor);
                }
            } else {
                // Fallback: Create nameplate using graphics if texture doesn't exist
                console.warn(`CardFrame: Nameplate texture "${textureToUse}" not found, using graphics fallback`);
                
                const nameplateBg = this.scene.add.graphics();
                
                // Draw decorative background
                nameplateBg.fillStyle(this.typeColor, 0.8);
                nameplateBg.fillRoundedRect(
                    -this.config.nameBannerWidth / 2,
                    -this.config.nameBannerHeight / 2,
                    this.config.nameBannerWidth,
                    this.config.nameBannerHeight,
                    8 // Rounded corners
                );
                
                // Add bevel effect
                nameplateBg.lineStyle(2, 0xFFFFFF, 0.3);
                nameplateBg.strokeRoundedRect(
                    -this.config.nameBannerWidth / 2 + 1,
                    -this.config.nameBannerHeight / 2 + 1,
                    this.config.nameBannerWidth - 2,
                    this.config.nameBannerHeight - 2,
                    7
                );
                
                this.nameBanner = nameplateBg;
            }
            
            // Create name text with shadow for depth
            this.nameText = this.scene.add.text(
                0, 0,
                this.config.characterName,
                {
                    fontFamily: this.config.nameFontFamily,
                    fontSize: this.config.nameFontSize,
                    color: '#FFFFFF',
                    stroke: '#000000',
                    strokeThickness: 3,
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
            if (this.config.showDecorativeFlourishes) {
                // Check if flourish textures exist
                const leftFlourish = 'nameplate-flourish-left';
                const rightFlourish = 'nameplate-flourish-right';
                
                // Calculate spacing based on text width
                const flourishSpacing = Math.min(45, this.config.nameBannerWidth / 2 - this.nameText.width / 2 - 15);
                
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
                    
                    // Add fallback flourishes to banner container
                    this.nameBannerContainer.add([leftDeco, rightDeco]);
                }
            }
            
            // Add team indicator if specified
            if (this.config.characterTeam) {
                const teamSymbol = this.config.characterTeam === 'player' ? '♦' : '♢';
                const teamColor = this.config.characterTeam === 'player' ? '#55FF55' : '#FF5555';
                
                const teamIndicator = this.scene.add.text(
                    -this.config.nameBannerWidth / 2 + 15, 
                    0,
                    teamSymbol,
                    {
                        fontFamily: 'serif',
                        fontSize: this.config.nameFontSize,
                        color: teamColor
                    }
                ).setOrigin(0.5);
                
                this.nameBannerContainer.add(teamIndicator);
            }
            
            // Add elements to banner container
            this.nameBannerContainer.add([this.nameBanner, this.nameText]);
            
            // Add banner container to main container
            this.add(this.nameBannerContainer);
        } catch (error) {
            console.error('CardFrame: Error creating name banner:', error);
            this.createFallbackNameBanner();
        }
    }
    
    /**
     * Create a simple fallback name banner if the decorative one fails
     */
    createFallbackNameBanner() {
        try {
            // Position at the bottom of the card
            const bannerY = this.config.nameOffsetY;
            
            // Create banner container
            this.nameBannerContainer = this.scene.add.container(0, bannerY);
            
            // Create simple name text
            this.nameText = this.scene.add.text(
                0, 0,
                this.config.characterName,
                {
                    fontFamily: 'Arial',
                    fontSize: this.config.nameFontSize,
                    color: '#FFFFFF',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0.5);
            
            // Add to banner container
            this.nameBannerContainer.add(this.nameText);
            
            // Add banner container to main container
            this.add(this.nameBannerContainer);
        } catch (error) {
            console.error('CardFrame: Error creating fallback name banner:', error);
        }
    }
    
    /**
     * Create health bar with animated transitions
     */
    createHealthBar() {
        try {
            // Create health bar container
            this.healthBarContainer = this.scene.add.container(
                0, 
                this.config.healthBarOffsetY
            );
            
            // Create health bar background
            this.healthBarBg = this.scene.add.rectangle(
                0, 0, 
                this.config.healthBarWidth, 
                this.config.healthBarHeight,
                0x000000, 0.7
            ).setOrigin(0.5);
            
            // Calculate health percentage
            const healthPercent = Math.max(0, Math.min(1, 
                this.config.currentHealth / this.config.maxHealth
            ));
            
            // Create health bar fill
            const barWidth = this.config.healthBarWidth - 4; // Slight padding
            
            this.healthBar = this.scene.add.rectangle(
                -barWidth / 2, // Left-aligned
                0,
                barWidth * healthPercent, // Width based on health percentage
                this.config.healthBarHeight - 4, // Slight padding
                this.getHealthBarColor(healthPercent), // Color based on health
                1
            ).setOrigin(0, 0.5); // Origin at left center
            
            // Create frame around health bar
            const healthBarFrame = this.scene.add.graphics();
            healthBarFrame.lineStyle(1, 0xFFFFFF, 0.4);
            healthBarFrame.strokeRect(
                -this.config.healthBarWidth / 2 - 1, 
                -this.config.healthBarHeight / 2 - 1,
                this.config.healthBarWidth + 2, 
                this.config.healthBarHeight + 2
            );
            
            // Create health text if enabled
            if (this.config.showHealthText) {
                this.healthText = this.scene.add.text(
                    0, 0,
                    `${Math.round(this.config.currentHealth)}/${this.config.maxHealth}`,
                    {
                        fontFamily: 'Arial',
                        fontSize: 10,
                        color: '#FFFFFF',
                        stroke: '#000000',
                        strokeThickness: 2
                    }
                ).setOrigin(0.5);
                
                // Add to health bar container
                this.healthBarContainer.add(this.healthText);
            }
            
            // Add components to health bar container
            this.healthBarContainer.add([this.healthBarBg, this.healthBar, healthBarFrame]);
            
            // Add health bar container to main container
            this.add(this.healthBarContainer);
        } catch (error) {
            console.error('CardFrame: Error creating health bar:', error);
        }
    }
    
    /**
     * Setup interactivity for hovering and selection
     */
    setupInteractivity() {
        try {
            // Add hover effects
            if (this.config.hoverEnabled) {
                this.frameBase.on('pointerover', () => {
                    if (!this._selected) {
                        this.scene.tweens.add({
                            targets: this,
                            scaleX: this.config.hoverScale,
                            scaleY: this.config.hoverScale,
                            duration: this.config.animationDuration,
                            ease: 'Sine.easeOut'
                        });
                        
                        // Add partial glow effect
                        this.addGlowEffect(this.config.glowIntensity / 2);
                        
                        // Set cursor
                        document.body.style.cursor = 'pointer';
                    }
                });
                
                this.frameBase.on('pointerout', () => {
                    if (!this._selected) {
                        this.scene.tweens.add({
                            targets: this,
                            scaleX: 1,
                            scaleY: 1,
                            duration: this.config.animationDuration,
                            ease: 'Sine.easeOut'
                        });
                        
                        // Remove glow effect
                        this.removeGlowEffect();
                        
                        // Reset cursor
                        document.body.style.cursor = 'default';
                    }
                });
            }
            
            // Add selection handler
            if (this.config.interactive) {
                this.frameBase.on('pointerdown', () => {
                    // Toggle selection state
                    this.setSelected(!this._selected);
                    
                    // Call selection callback if provided
                    if (this.config.onSelect) {
                        this.config.onSelect(this);
                    }
                });
            }
        } catch (error) {
            console.error('CardFrame: Error setting up interactivity:', error);
        }
    }
    
    /**
     * Add a glow effect around the card
     * @param {number} intensity - Glow intensity (0-1)
     */
    addGlowEffect(intensity) {
        try {
            // Clear any existing glow
            this.removeGlowEffect();
            
            // Create glow graphics
            const glow = this.scene.add.graphics();
            
            // Set color based on type or status
            const glowColor = this._highlighted ? 0xFFFFFF : this.typeColor;
            
            // Apply different glow intensities based on state
            let appliedIntensity = intensity;
            if (this._highlighted) {
                appliedIntensity = Math.min(1, intensity * 1.5);
            }
            
            // Draw multiple glow layers for a soft effect
            for (let i = 0; i < 3; i++) {
                const padding = 5 + (i * 3);
                glow.fillStyle(glowColor, 0.2 * appliedIntensity * (1 - i * 0.2));
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
        } catch (error) {
            console.error('CardFrame: Error adding glow effect:', error);
        }
    }
    
    /**
     * Remove glow effect
     */
    removeGlowEffect() {
        try {
            this.glowContainer.removeAll(true); // Remove and destroy all children
        } catch (error) {
            console.error('CardFrame: Error removing glow effect:', error);
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
            this.config.currentHealth = currentHealth;
            
            if (maxHealth !== null) {
                this.config.maxHealth = maxHealth;
            }
            
            // Make sure health bar exists
            if (!this.healthBar || !this.healthBarContainer) {
                console.warn('CardFrame: Health bar not found, cannot update');
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
            }
            
            // Decide whether to animate
            if (animate && this.scene && this.scene.tweens) {
                // Stop any existing tweens
                this.scene.tweens.killTweensOf(this.healthBar);
                
                // Animate health bar width
                this.scene.tweens.add({
                    targets: this.healthBar,
                    width: newWidth,
                    fillColor: { from: this.healthBar.fillColor, to: newColor },
                    duration: 300,
                    ease: 'Sine.easeOut'
                });
                
                // Add visual feedback based on health change
                if (oldWidth > newWidth) {
                    // Taking damage - flash red
                    if (this.characterSprite) {
                        this.scene.tweens.add({
                            targets: this.characterSprite,
                            alpha: 0.5,
                            yoyo: true,
                            duration: 100,
                            repeat: 1,
                            ease: 'Sine.easeOut'
                        });
                    }
                    
                    // Shake health text
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
                    if (this.characterSprite) {
                        // Add healing glow overlay positioned at the portrait's position
                        const portraitY = this.config.portraitOffsetY;
                        
                        const healGlow = this.scene.add.rectangle(
                            0, // Center horizontally
                            portraitY, // Position at portrait vertical position
                            this.config.portraitWidth,
                            this.config.portraitHeight,
                            0x00FF00, 0.3
                        );
                        
                        // Add directly to CardFrame (not portraitContainer)
                        this.add(healGlow);
                        
                        // Ensure it's below the character sprite
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
                    }
                    
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
                this.healthBar.width = newWidth;
                this.healthBar.fillColor = newColor;
            }
        } catch (error) {
            console.error('CardFrame: Error updating health:', error);
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
            
            if (animate && this.scene && this.scene.tweens) {
                // Animate scale change
                this.scene.tweens.add({
                    targets: this,
                    scaleX: selected ? this.config.selectedScale : 1,
                    scaleY: selected ? this.config.selectedScale : 1,
                    duration: this.config.animationDuration,
                    ease: 'Sine.easeOut'
                });
            } else {
                // Direct update without animation
                this.setScale(selected ? this.config.selectedScale : 1);
            }
            
            // Update glow effect
            if (selected) {
                this.addGlowEffect(this.config.glowIntensity);
            } else if (!this._highlighted) {
                // Only remove glow if not highlighted
                this.removeGlowEffect();
            }
        } catch (error) {
            console.error('CardFrame: Error setting selected state:', error);
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
            
            // Add pulsing highlight if highlighted
            if (highlighted) {
                // Add strong white glow
                this.addGlowEffect(this.config.glowIntensity);
                
                if (animate && this.scene && this.scene.tweens) {
                    // Add pulsing animation
                    this.scene.tweens.add({
                        targets: this,
                        scaleX: { from: 1, to: this.config.hoverScale },
                        scaleY: { from: 1, to: this.config.hoverScale },
                        duration: 600,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            } else {
                // Stop pulsing animation
                if (this.scene && this.scene.tweens) {
                    this.scene.tweens.killTweensOf(this);
                }
                
                // Reset scale unless selected
                if (!this._selected) {
                    if (animate && this.scene && this.scene.tweens) {
                        this.scene.tweens.add({
                            targets: this,
                            scaleX: 1,
                            scaleY: 1,
                            duration: this.config.animationDuration,
                            ease: 'Sine.easeOut'
                        });
                    } else {
                        this.setScale(1);
                    }
                    
                    // Remove glow effect
                    this.removeGlowEffect();
                }
            }
        } catch (error) {
            console.error('CardFrame: Error setting highlighted state:', error);
        }
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
     * Update the character's name
     * @param {string} name - New character name
     */
    updateName(name) {
        if (!name) return;
        
        this.config.characterName = name;
        
        if (this.nameText) {
            this.nameText.setText(name);
        }
    }
    
    /**
     * Create debug visualizations for component boundaries
     */
    createDebugVisuals() {
        try {
            const debug = this.scene.add.graphics();
            debug.lineStyle(1, 0xFF00FF, 1);
            
            // Card boundary
            debug.strokeRect(
                -this.config.width / 2,
                -this.config.height / 2,
                this.config.width,
                this.config.height
            );
            
            // Portrait boundary
            debug.lineStyle(1, 0x00FFFF, 1);
            debug.strokeRect(
                -this.config.portraitWidth / 2,
                this.config.portraitOffsetY - this.config.portraitHeight / 2,
                this.config.portraitWidth,
                this.config.portraitHeight
            );
            
            // Center point
            debug.lineStyle(1, 0xFFFF00, 1);
            debug.lineBetween(-10, 0, 10, 0);
            debug.lineBetween(0, -10, 0, 10);
            
            this.add(debug);
            
            // Add configuration text
            const debugText = this.scene.add.text(
                -this.config.width / 2 + 5,
                -this.config.height / 2 + 5,
                `${this.config.characterName} (${this.config.characterType})`,
                {
                    fontFamily: 'monospace',
                    fontSize: 8,
                    color: '#FFFF00'
                }
            ).setOrigin(0);
            
            this.add(debugText);
        } catch (error) {
            console.error('CardFrame: Error creating debug visuals:', error);
        }
    }
    
    /**
     * Clean up all resources when card is destroyed
     */
    destroy() {
        try {
            // Stop any active tweens
            if (this.scene && this.scene.tweens) {
                this.scene.tweens.killTweensOf(this);
                this.scene.tweens.killTweensOf(this.healthBar);
                this.scene.tweens.killTweensOf(this.characterSprite);
                this.scene.tweens.killTweensOf(this.nameText);
                this.scene.tweens.killTweensOf(this.healthText);
            }
            
            // Reset cursor if interactive
            if (this.config.interactive) {
                document.body.style.cursor = 'default';
            }
            
            // Call parent destroy method to clean up container and children
            super.destroy(true);
        } catch (error) {
            console.error('CardFrame: Error during destroy:', error);
            // Try parent destroy as fallback
            super.destroy(true);
        }
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardFrame;
}

// Make available globally
window.CardFrame = CardFrame;