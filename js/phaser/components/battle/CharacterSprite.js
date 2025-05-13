/**
 * CharacterSprite.js
 * Renders a character in the battle scene with appropriate visual elements
 * (Added try...catch blocks for debugging)
 * 
 * Supports two visual representations:
 * 1. Traditional circle-based character visualization
 * 2. Professional card-based representation using CardFrame
 */

class CharacterSprite {
    /**
     * Update the character's health and refresh the health bar
     * @param {number} newHealth - The character's new health value
     * @param {number} maxHealth - The character's maximum health (usually character.stats.hp)
     */
    updateHealth(newHealth, maxHealth) {
        try {
            // Update the internal health tracking
            this.currentHealth = newHealth;
            
            // Update the character data's health tracking
            if (this.character) {
                this.character.currentHp = newHealth;
            }
            
            // Show a health change animation
            const healthChange = (this.previousHealth || newHealth) - newHealth;
            const isHealing = healthChange < 0;
            
            // Store current health for future reference
            this.previousHealth = newHealth;
            
            // Show floating text for significant health changes
            if (Math.abs(healthChange) > 0) {
                const textColor = isHealing ? '#00ff00' : '#ff0000';
                const prefix = isHealing ? '+' : '-';
                const text = `${prefix}${Math.abs(healthChange)}`;
                this.showFloatingText(text, { color: textColor, fontSize: 20 });
            }
            
            // Update the visual health display based on representation
            if (this.cardConfig.enabled && this.cardFrame) {
                // Use the CardFrame's built-in health update system
                this.cardFrame.updateHealth(newHealth, maxHealth);
                // CardFrame handles its own visual effects for damage/healing
            } else {
                // Traditional circle representation health updates
                this.updateHealthBar(newHealth, maxHealth);
                
                // Play a flash effect for damage on the character image instead of the circle
                if (healthChange > 0 && this.characterImage) {
                    this.scene.tweens.add({
                        targets: this.characterImage,
                        alpha: { from: 1.0, to: 0.3 },
                        yoyo: true,
                        duration: 100,
                        repeat: 1,
                        ease: 'Sine.easeOut'
                    });
                }
                
                // Play a healing glow effect on the character image
                if (healthChange < 0 && this.characterImage) {
                    // Create a temporary glow effect
                    const healGlow = this.scene.add.circle(0, 0, 42, 0x00ff00, 0.3);
                    this.container.add(healGlow);
                    this.container.sendToBack(healGlow);
                    
                    // Animate and remove the glow
                    this.scene.tweens.add({
                        targets: healGlow,
                        alpha: { from: 0.3, to: 0 },
                        scaleX: 1.5,
                        scaleY: 1.5,
                        duration: 400,
                        ease: 'Sine.easeOut',
                        onComplete: () => {
                            healGlow.destroy();
                        }
                    });
                }
            }
        } catch (error) {
            console.error(`CharacterSprite.updateHealth: Error updating ${this.character?.name}'s health:`, error);
        }
    }
    
    /**
     * Update the health bar to reflect the current health
     * @param {number} currentHealth - Current health value
     * @param {number} maxHealth - Maximum health value
     */
    updateHealthBar(currentHealth, maxHealth) {
        try {
            // Skip if health bar components don't exist
            if (!this.healthBar || !this.healthBarBg || !this.hpText) {
                console.warn(`updateHealthBar: Health bar components missing for ${this.character?.name}`);
                return;
            }
            
            // Ensure valid values
            const safeCurrentHealth = Math.max(0, currentHealth || 0);
            const safeMaxHealth = Math.max(1, maxHealth || 1); // Avoid division by zero
            
            // Calculate health percentage (0-1)
            const healthPercent = Math.min(1, safeCurrentHealth / safeMaxHealth);
            
            // Update health bar width
            const healthBarWidth = 80; // Original width
            
            // Use tweens for smooth transition if available
            if (this.scene?.tweens) {
                // Stop any existing health bar tweens to prevent conflicts
                this.scene.tweens.killTweensOf(this.healthBar);
                
                // Create a new tween for smooth transition
                this.scene.tweens.add({
                    targets: this.healthBar,
                    width: healthBarWidth * healthPercent,
                    duration: 300,
                    ease: 'Sine.easeOut',
                    onUpdate: () => {
                        // Update color during tween for smooth color transition
                        const currentWidth = this.healthBar.width;
                        const currentPercent = currentWidth / healthBarWidth;
                        this.healthBar.fillColor = this.getHealthBarColor(currentPercent);
                    }
                });
                
                // Animate health text (shake slightly when taking damage)
                if (this.previousHealthValue && this.previousHealthValue > safeCurrentHealth) {
                    // Character took damage - shake the text
                    this.scene.tweens.add({
                        targets: this.hpText,
                        x: { from: -2, to: 0 },
                        duration: 100,
                        repeat: 1,
                        yoyo: true,
                        ease: 'Sine.easeInOut'
                    });
                } else if (this.previousHealthValue && this.previousHealthValue < safeCurrentHealth) {
                    // Character was healed - subtle bounce
                    this.scene.tweens.add({
                        targets: this.hpText,
                        y: { from: -2, to: 0 },
                        duration: 150,
                        repeat: 0,
                        yoyo: true,
                        ease: 'Bounce'
                    });
                }
            } else {
                // Direct update if tweens not available
                this.healthBar.width = healthBarWidth * healthPercent;
                this.healthBar.fillColor = this.getHealthBarColor(healthPercent);
            }
            
            // Update health text
            this.hpText.setText(`${Math.round(safeCurrentHealth)}/${safeMaxHealth}`);
            
            // Store current health for next comparison
            this.previousHealthValue = safeCurrentHealth;
            
            // Ensure health bar is visible
            if (this.healthBarContainer) {
                this.healthBarContainer.setVisible(true);
            }
            
            console.log(`Health bar updated for ${this.character?.name}: ${healthPercent * 100}% (${safeCurrentHealth}/${safeMaxHealth})`);
        } catch (error) {
            console.error(`Error updating health bar for ${this.character?.name}:`, error);
        }
    }

    /**
     * Create a new character sprite
     * @param {Phaser.Scene} scene - The scene this sprite belongs to
     * @param {Object} character - The character data object
     * @param {Object} config - Configuration options
     */
    constructor(scene, character, config = {}) {
        this.scene = scene;
        this.character = character;
        this.config = Object.assign({
            x: 0,
            y: 0,
            scale: 1,
            showName: true,
            showHealth: true,
            showStatusEffects: true,
            useCardFrame: true,         // Whether to use card frame representation
            cardConfig: {                // Card-specific configuration options
                width: 240,              // Card width
                height: 320,             // Card height
                portraitOffsetY: -20,    // Portrait vertical offset from center
                nameBannerHeight: 40,    // Height of name banner
                healthBarOffsetY: 90,    // Distance from center to health bar
                interactive: false       // Whether card is interactive
            }
        }, config);

         // --- Validate Character Data ---
         if (!character) {
              console.error("CharacterSprite Constructor: Invalid character data provided (null or undefined). Cannot create sprite.");
              throw new Error("Invalid character data for CharacterSprite."); // Stop execution here
         }
         if (!character.stats) {
             console.warn(`CharacterSprite Constructor: Character ${character.name || 'Unknown'} missing stats! Using defaults.`);
             character.stats = { hp: 1, // Provide minimal defaults
                                  currentHp: 1 };
         }
         if (typeof character.currentHp === 'undefined') {
            character.currentHp = character.stats.hp;
         }
         if (!character.name) {
             console.warn("CharacterSprite Constructor: Character missing name! Using ID or 'Unknown'.");
             character.name = character.id || 'UnknownCharacter';
         }
         if (!character.type) {
             console.warn(`CharacterSprite Constructor: Character ${character.name} missing type! Using 'neutral'.`);
             character.type = 'neutral';
         }
         // --- End Validation ---

        // Create container for character elements
         try {
             this.container = scene.add.container(this.config.x, this.config.y);
         } catch (error) {
             console.error(`CharacterSprite Constructor (${character.name}): Error creating main container:`, error);
             throw error; // Re-throw critical error
         }

        // Check if CardFrame is available globally
        this.cardFrameAvailable = (typeof window.CardFrame === 'function');
        
        // Create a complete card configuration by merging defaults with provided options
        this.cardConfig = {
            enabled: this.config.useCardFrame || false,
            width: this.config.cardConfig?.width || 240,
            height: this.config.cardConfig?.height || 320,
            portraitOffsetY: this.config.cardConfig?.portraitOffsetY || -20,
            nameBannerHeight: this.config.cardConfig?.nameBannerHeight || 40,
            healthBarOffsetY: this.config.cardConfig?.healthBarOffsetY || 90,
            interactive: this.config.cardConfig?.interactive || false
        };
        
        // Validate card configuration
        if (this.cardConfig.enabled && !this.cardFrameAvailable) {
            console.warn(`CharacterSprite: CardFrame requested for ${character.name} but not available, falling back to circle representation`);
            this.cardConfig.enabled = false;
        }


        // --- Determine which representation to use ---
        if (this.cardConfig.enabled && this.cardFrameAvailable) {
            try {
                console.log(`CharacterSprite (${character.name}): Creating card frame representation...`);
                this.createCardFrameRepresentation();
                console.log(`CharacterSprite (${character.name}): Card frame representation created.`);
            } catch(error) {
                console.error(`CharacterSprite Constructor (${character.name}): Error in createCardFrameRepresentation:`, error);
                // Fall back to circle representation if card creation fails
                this.cardConfig.enabled = false;
                this.createCircleRepresentation();
            }
        } else {
            // Use traditional circle representation
            try {
                console.log(`CharacterSprite (${character.name}): Creating circle representation...`);
                this.createCircleRepresentation();
                console.log(`CharacterSprite (${character.name}): Circle representation created.`);
            } catch(error) {
                console.error(`CharacterSprite Constructor (${character.name}): Error in createCircleRepresentation:`, error);
                // Optionally create a fallback visual here if circle creation fails
            }
        }

        if (this.config.showName && !this.cardConfig.enabled) {
            try {
                 console.log(`CharacterSprite (${character.name}): Creating name text...`);
                this.createNameText();
                 console.log(`CharacterSprite (${character.name}): Name text created.`);
            } catch(error) {
                console.error(`CharacterSprite Constructor (${character.name}): Error in createNameText:`, error);
            }
        }

        if (this.config.showHealth && !this.cardConfig.enabled) {
            try {
                 console.log(`CharacterSprite (${character.name}): Creating health bar...`);
                this.createHealthBar();
                 console.log(`CharacterSprite (${character.name}): Health bar created.`);
            } catch(error) {
                console.error(`CharacterSprite Constructor (${character.name}): Error in createHealthBar:`, error);
            }
        }
        // --- End character elements ---

        // Create action indicator
        try {
            console.log(`CharacterSprite (${character.name}): Creating action indicator...`);
            this.actionIndicator = new ActionIndicator(scene, this);
            console.log(`CharacterSprite (${character.name}): Action indicator created.`);
        } catch(error) {
            console.error(`CharacterSprite Constructor (${character.name}): Error creating action indicator:`, error);
        }
        
        // Create status effect container if enabled
        if (this.config.showStatusEffects) {
            try {
                console.log(`CharacterSprite (${character.name}): Creating status effect container...`);
                this.statusEffectContainer = new StatusEffectContainer(scene, this);
                console.log(`CharacterSprite (${character.name}): Status effect container created.`);
            } catch(error) {
                console.error(`CharacterSprite Constructor (${character.name}): Error creating status effect container:`, error);
            }
        }

        // Make interactive if needed
        if (config.interactive) {
             try {
                 this.makeInteractive();
             } catch(error) {
                  console.error(`CharacterSprite Constructor (${character.name}): Error making sprite interactive:`, error);
             }
        }

        // Store reference for global access (for debugging)
        if (!window.characterSprites) window.characterSprites = {};
        window.characterSprites[character.name] = this; // Note: potential issue if multiple characters have same name
         console.log(`CharacterSprite Constructor (${character.name}): Initialization complete.`);
    }

    /**
     * Show action text above character
     * @param {string} actionText - The action being performed
     */
    showActionText(actionText) {
        console.log(`CS.showActionText: Called for ${this.character?.name} with text: '${actionText}'. this.actionIndicator instance is ${this.actionIndicator ? 'defined' : 'undefined'}.`);
        
        try {
            if (!this.actionIndicator) {
                console.warn(`showActionText (${this.character?.name}): Action indicator not initialized.`);
                return;
            }
            
            if (actionText.toLowerCase().includes('auto attack')) {
                this.actionIndicator.showAutoAttack();
            } else if (actionText.toLowerCase().includes('ability:')) {
                // Extract ability name if in format "Ability: Name"
                const abilityName = actionText.split('Ability:')[1]?.trim() || actionText;
                this.actionIndicator.showAbility(abilityName);
            } else if (actionText.toLowerCase().includes('status:')) {
                // Extract status name if in format "Status: Name"
                const statusName = actionText.split('Status:')[1]?.trim() || actionText;
                this.actionIndicator.showStatusEffect(statusName);
            } else {
                // Display the text directly - likely an ability name without the "Ability:" prefix
                this.actionIndicator.showAbility(actionText);
            }
        } catch (error) {
            console.error(`showActionText (${this.character?.name}): Error showing action text:`, error);
        }
    }

    /**
     * Create the traditional circle-based character representation
     */
    createCircleRepresentation() {
        // Validate character name for path construction
        if (!this.character || !this.character.name) {
            console.error("createCharacterImage: Character name is missing.");
            return; // Cannot proceed without a name
        }

        // Create a type-colored circle as background
        const typeColor = this.getTypeColor(this.character.type);
        try {
            // Create the circle with opacity 0 (invisible) to remove visible background while maintaining functionality
            const circleRadius = 40;
            this.circle = this.scene.add.circle(0, 0, circleRadius, typeColor, 0);
            this.container.add(this.circle);
            // Log that we're using invisible circles per user request
            console.log(`createCharacterImage (${this.character.name}): Using invisible background circle`);
        } catch(error) {
            console.error(`createCharacterImage (${this.character.name}): Error creating background circle:`, error);
            return;
        }
        
        try {
            // Use the texture key that matches how we preloaded it in BattleScene
            const characterKey = `character_${this.character.name}`;
            
            // Check if texture exists (it should if properly preloaded)
            if (this.scene.textures.exists(characterKey)) {
                console.log(`createCharacterImage (${this.character.name}): Using preloaded texture ${characterKey}`);
                
                // Create the image with the proper texture
                this.characterImage = this.scene.add.image(0, 0, characterKey);
                this.container.add(this.characterImage);
                
                // Apply positioning from character data
                this.applyPositioning();
            } else {
                // Fallback if texture wasn't preloaded
                console.warn(`createCharacterImage (${this.character.name}): Texture ${characterKey} not found. Using fallback.`);
                this.createFallbackVisual();
            }
        } catch (error) {
            console.error(`createCharacterImage (${this.character.name}): Error creating image:`, error);
            this.createFallbackVisual();
        }
    }

    /** Helper function to apply positioning to the character image */
    applyPositioning() {
        try {
            if (!this.characterImage || !this.characterImage.scene) {
                console.error(`applyPositioning (${this.character.name}): characterImage or scene missing.`);
                return;
            }

            // Get original texture dimensions
            const textureWidth = this.characterImage.width;
            const textureHeight = this.characterImage.height;
            
            console.log(`applyPositioning (${this.character.name}): Texture dimensions: ${textureWidth}x${textureHeight}`);

            // Apply positioning from character data if available
            if (this.character && this.character.art) {
                const left = parseInt(this.character.art.left) || 0;
                const top = parseInt(this.character.art.top) || 0;
                
                // Apply positioning
                this.characterImage.setPosition(left, top);
                
                // Disable scaling completely for combat-optimized images
                // These are already pre-sized to the optimal dimensions
                console.log(`${this.character.name}: Using combat-optimized image - no scaling needed`);
                this.characterImage.setScale(1.0, 1.0);
                
                // Log final display size
                console.log(`${this.character.name}: Original size maintained at ${textureWidth}x${textureHeight}`);
            } else {
                console.log(`applyPositioning (${this.character.name}): Applying default art positioning.`);
                
                // Apply default positioning
                this.characterImage.setPosition(0, 0);
                
                // Disable scaling completely for combat-optimized images
                // These are already pre-sized to the optimal dimensions
                console.log(`${this.character.name}: Using combat-optimized image (default positioning) - no scaling needed`);
                this.characterImage.setScale(1.0, 1.0);
                
                // Adjust position to center the character art in the circle
                this.characterImage.setPosition(0, -10); // Default vertical offset to center in circle
            }
        } catch(error) {
            console.error(`applyPositioning (${this.character.name}): Error applying position:`, error);
            this.createFallbackVisual();
        }
    }

     /** Helper function to create fallback visual */
     createFallbackVisual() {
          try {
              if (this.characterImage && this.characterImage.active) this.characterImage.destroy(); // Remove potentially broken image
               console.warn(`Creating fallback visual for ${this.character?.name || 'Unknown Character'}`);
               const fallbackText = this.scene.add.text(0, 0, this.character?.name?.charAt(0) || '?', {
                   fontFamily: 'Arial',
                   fontSize: 32,
                   color: '#ffffff'
               }).setOrigin(0.5);
               if(this.container) {
                    this.container.add(fallbackText);
               } else {
                    console.error("Cannot add fallback text, main container missing.");
               }
          } catch (fallbackError) {
               console.error("Error creating fallback visual:", fallbackError);
          }
     }

    /**
     * Create text displaying the character's name
     */
    createNameText() {
         // Validate character data
         if (!this.character || !this.character.name || !this.character.team) {
             console.error("createNameText: Missing character name or team.");
             return;
         }
        // Add team identifier for clarity
        const teamIdentifier = this.character.team === 'player' ? ' (ally)' : ' (enemy)';
        const displayName = this.character.name + teamIdentifier;

         try {
             this.nameText = this.scene.add.text(0, 60, displayName, {
                 fontFamily: 'Arial',
                 fontSize: 14,
                 color: '#ffffff',
                 stroke: '#000000',
                 strokeThickness: 3,
                 align: 'center',
                 resolution: 1 // Set text resolution to match the game's base resolution for this test
             }).setOrigin(0.5);
             this.container.add(this.nameText);
         } catch(error) {
             console.error(`createNameText (${this.character.name}): Error creating/adding name text:`, error);
         }
    }

    /**
     * Create health bar for the character
     */
    createHealthBar() {
         // Validate character data
         if (!this.character || !this.character.stats || typeof this.character.stats.hp === 'undefined' || typeof this.character.currentHp === 'undefined') {
             console.error(`createHealthBar (${this.character?.name}): Missing required stats (hp, currentHp).`);
             return;
         }
         try {
             // Create health bar container
             this.healthBarContainer = this.scene.add.container(0, 45);

             // Background rectangle
             const healthBarWidth = 80; // Original width
             this.healthBarBg = this.scene.add.rectangle(0, 0, healthBarWidth, 10, 0x000000, 0.7);
             this.healthBarBg.setOrigin(0.5, 0.5);

             // Health bar foreground
              // Ensure maxHP is not zero to avoid division by zero
              const maxHp = Math.max(1, this.character.stats.hp);
             const healthPercent = Math.max(0, Math.min(1, (this.character.currentHp || 0) / maxHp));
             const healthBarColor = this.getHealthBarColor(healthPercent);
             this.healthBar = this.scene.add.rectangle(
                  -healthBarWidth/2, // Start from left edge, adjusted for wider bar
                  0,
                  healthBarWidth * healthPercent,
                  10,
                  healthBarColor,
                  1
             );
              this.healthBar.setOrigin(0, 0.5); // Set origin to left-center for width scaling

             // Add HP text
             this.hpText = this.scene.add.text(0, 0, `${this.character.currentHp || 0}/${maxHp}`, {
                 fontFamily: 'Arial',
                 fontSize: 10,
                 color: '#ffffff',
                 stroke: '#000000',
                 strokeThickness: 2,
                 resolution: 1 // Set text resolution to match the game's base resolution for this test
             }).setOrigin(0.5);

             // Add elements to health bar container
             this.healthBarContainer.add([this.healthBarBg, this.healthBar, this.hpText]);

             // Add health bar container to main container
             this.container.add(this.healthBarContainer);
         } catch(error) {
              console.error(`createHealthBar (${this.character.name}): Error creating/adding health bar elements:`, error);
         }
    }

    /**
     * Make the character sprite interactive
     */
    makeInteractive() {
         // Ensure circle exists before making interactive
         if (!this.circle) {
             console.error(`makeInteractive (${this.character.name}): Background circle does not exist.`);
             return;
         }
         try {
             const hitArea = new Phaser.Geom.Circle(0, 0, 50);
             // Use setSize before setInteractive for non-Graphics objects if needed, but circle should be fine
             this.circle.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

             // Add hover effects
             this.circle.on('pointerover', () => {
                  if (this.container) this.container.setScale(1.1);
                 document.body.style.cursor = 'pointer';
             });

             this.circle.on('pointerout', () => {
                  if (this.container) this.container.setScale(1);
                 document.body.style.cursor = 'default';
             });

             // Add click handler (can be customized later)
             this.circle.on('pointerdown', () => {
                 // Example: Emit a 'character_selected' event
                 this.scene.events.emit('character_selected', this.character);
             });
         } catch (error) {
              console.error(`makeInteractive (${this.character.name}): Error making sprite interactive:`, error);
         }
    }

    /**
     * Get the color for a character based on their type
     * @param {string} type - The character's type
     * @returns {number} - The color as a hex number
     */
    getTypeColor(type) {
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
        // Fallback for undefined or null type
        const safeType = typeof type === 'string' ? type.toLowerCase() : 'neutral';
        return typeColors[safeType] || 0xCCCCCC; // Gray fallback
    }

    /**
     * Get appropriate color for health bar based on percentage
     * @param {number} percent - Health percentage (0-1)
     * @returns {number} - Color as hex
     */
    getHealthBarColor(percent) {
        if (percent < 0.3) return 0xFF0000; // Red (low health)
        if (percent < 0.6) return 0xFFAA00; // Orange (medium health)
        return 0x00FF00; // Green (high health)
    }

    /**
     * Update the character sprite's state
     */
    update() {
         try { // Added try..catch for safety
             if (this.character && this.character.stats) { // Added check for stats
                 // Update health bar if it exists
                 if (this.healthBar && this.healthBarContainer.visible) { // Check visibility too
                      // Ensure maxHP is valid and non-zero
                      const maxHp = Math.max(1, this.character.stats.hp);
                      // Ensure currentHp is a valid number, default to 0 if not
                      const currentHp = typeof this.character.currentHp === 'number' ? this.character.currentHp : 0;
                     const healthPercent = Math.max(0, Math.min(1, currentHp / maxHp));

                     // Update width smoothly using tweens if available, otherwise set directly
                      const healthBarWidth = 80; // Original width
                      if (this.scene?.tweens) {
                          this.scene.tweens.add({
                              targets: this.healthBar,
                              width: healthBarWidth * healthPercent,
                              duration: 150, // Faster update
                              ease: 'Linear'
                          });
                      } else {
                          this.healthBar.width = healthBarWidth * healthPercent;
                      }

                      // Update position (for left alignment)
                     this.healthBar.x = -healthBarWidth/2; // Adjusted from -40 to match wider bar

                     // Update color based on health percentage
                     this.healthBar.fillColor = this.getHealthBarColor(healthPercent);

                     // Update text
                     if (this.hpText) {
                         this.hpText.setText(`${Math.round(currentHp)}/${maxHp}`);
                     }
                 }
             }
         } catch(error) {
              console.error(`Error updating CharacterSprite (${this.character?.name}):`, error);
         }
    }


    /**
     * Show attack animation
     * @param {CharacterSprite} targetSprite - Target character sprite instance
     * @param {Function} onComplete - Callback when animation completes
     * @param {Object} actionContext - Context about the action being animated
     */
    showAttackAnimation(targetSprite, onComplete, actionContext) {
         
         if (!this.character || !targetSprite || !targetSprite.character) {
             console.error(`[CharacterSprite] showAttackAnimation: Attacker or Target character data missing! Attacker: ${this.character?.name}, TargetSprite valid: ${!!targetSprite}`);
             if (onComplete) onComplete();
             return;
         }

         // Prevent friendly fire animation
         if (this.character.team === targetSprite.character.team) {
             console.warn(`[CharacterSprite.showAttackAnimation] Friendly fire prevented: ${this.character.name} targeting ally ${targetSprite.character.name}.`);
             if (onComplete) onComplete(); // Call onComplete to not stall the battle
             return; // Do not proceed with animation against an ally
         }

         // Validate targetSprite
         if (!targetSprite.container) {
             console.error(`showAttackAnimation (${this.character.name}): Invalid targetSprite container.`);
             if (onComplete) onComplete();
             return;
         }
          // Validate own container and scene
          if (!this.container || !this.scene || !this.scene.tweens) {
               console.error(`showAttackAnimation (${this.character.name}): Missing container or scene/tweens manager.`);
               if (onComplete) onComplete();
               return;
          }

        try { // Added try...catch
            // Context-aware action text handling
            if (actionContext) {
                if (actionContext.actionType === 'autoAttack') {
                    this.showActionText('Auto Attack');
                    console.log(`[CharacterSprite.showAttackAnimation] Character: ${this.character?.name}, Action: Auto Attack. Explicitly setting ActionIndicator.`);
                } else if (actionContext.actionType === 'ability') {
                    // For abilities, BattleEventManager should have already set the ActionIndicator text
                    // via the CHARACTER_ACTION event. We generally do not want to override it here.
                    console.log(`[CharacterSprite.showAttackAnimation] Character: ${this.character?.name}, Action: Ability (${actionContext.abilityName || 'Unknown Ability'}). ActionIndicator should have been set by event. No override here.`);
                } else {
                    console.warn(`[CharacterSprite.showAttackAnimation] Character: ${this.character?.name}, Unknown actionType in actionContext: ${actionContext.actionType}. ActionIndicator not explicitly set here.`);
                }
            } else {
                // This case should ideally not happen if actionContext is always passed.
                // This was the old problematic behavior. We want to avoid this.
                console.error(`[CharacterSprite.showAttackAnimation] Character: ${this.character?.name}, CRITICAL: actionContext was not provided! ActionIndicator may be incorrect or stale.`);
                // DO NOT default to this.showActionText('Auto Attack'); here without context.
            }
            
            // --- Get GLOBAL position of the attacker's container ---
            let attackerGlobalPos = new Phaser.Math.Vector2();
            // Ensure 'this.container' is the actual Phaser.GameObjects.Container for this CharacterSprite
            if (!this.container || typeof this.container.getWorldTransformMatrix !== 'function') {
                console.error(`[CharacterSprite] Attacker ${this.character.name} has no valid container or getWorldTransformMatrix method`);
                if (onComplete) onComplete(); return;
            }
            this.container.getWorldTransformMatrix().transformPoint(0, 0, attackerGlobalPos);
            const originalX = attackerGlobalPos.x;
            const originalY = attackerGlobalPos.y;

            // --- Get GLOBAL position of the targetSprite's container ---
            let targetGlobalPos = new Phaser.Math.Vector2();
            // Ensure 'targetSprite.container' is valid
            if (!targetSprite || !targetSprite.container || typeof targetSprite.container.getWorldTransformMatrix !== 'function') {
                console.error(`[CharacterSprite] Target ${targetSprite?.character?.name || 'Unknown'} has no valid container or getWorldTransformMatrix method`);
                if (onComplete) onComplete(); return;
            }
            targetSprite.container.getWorldTransformMatrix().transformPoint(0, 0, targetGlobalPos);
            const targetX_global = targetGlobalPos.x;
            const targetY_global = targetGlobalPos.y;
            
            // Different animation approaches based on representation
            if (this.cardConfig.enabled && this.cardFrame) {
                // --- CARD-BASED ANIMATION ---
                
                // Calculate movement direction vector
                const direction = new Phaser.Math.Vector2(
                    targetX_global - originalX,
                    targetY_global - originalY
                ).normalize();
                
                // Use shorter distance for cards (50% instead of 70% for circles)
                const moveDistance = 0.5;
                
                // Calculate move destination in local space
                const moveToX = direction.x * this.cardConfig.width * moveDistance;
                const moveToY = direction.y * this.cardConfig.height * moveDistance;
                
                // Add slight rotation based on team
                const rotation = this.character.team === 'player' ? 5 : -5;
                
                // Create timeline with modified properties
                const timeline = this.scene.tweens.createTimeline();
                
                // Move forward with slight rotation
                timeline.add({
                    targets: this.cardFrame,
                    x: moveToX,
                    y: moveToY,
                    angle: rotation, // Add slight card rotation
                    duration: 250,
                    ease: 'Sine.easeOut'
                });
                
                // Return to original position
                timeline.add({
                    targets: this.cardFrame,
                    x: 0,
                    y: 0,
                    angle: 0, // Reset rotation
                    duration: 250,
                    ease: 'Sine.easeOut'
                });
                
                // Add impact effect at halfway point
                let hasTriggeredImpact = false;
                timeline.on('update', () => {
                    const progress = timeline.progress;
                    if (progress > 0.45 && progress < 0.55 && !hasTriggeredImpact) {
                        hasTriggeredImpact = true;
                        this.createImpactEffect(targetSprite);
                    }
                });
                
                // Play timeline and handle completion
                timeline.play();
                timeline.once('complete', () => {
                    if (onComplete) onComplete();
                });
            } else {
                // --- ORIGINAL CIRCLE-BASED ANIMATION ---
            
                // --- Calculate moveTo using these GLOBAL coordinates ---
                const moveToX = originalX + (targetX_global - originalX) * 0.7;
                const moveToY = originalY + (targetY_global - originalY) * 0.7;

                // Now, we need to convert our global moveToX/Y coordinates back to the container's local space
                // for the tween to work correctly (since tweens operate in the object's local space)
                let moveToLocal = { x: 0, y: 0 };
                
                // Convert global coordinates to container's local space
                // Note: We need the container's parent to do this properly
                if (this.container.parentContainer) {
                    // If the container has a parent, we need to transform the global coordinates to local
                    let inverse = this.container.parentContainer.getWorldTransformMatrix().invert();
                    moveToLocal = inverse.transformPoint(moveToX, moveToY);
                } else {
                    // No parent container - coordinates are already in the right space
                    moveToLocal.x = moveToX;
                    moveToLocal.y = moveToY;
                }
                
                // Get the original local coordinates (current position in container's local space)
                const originalLocalX = this.container.x;
                const originalLocalY = this.container.y;

                // Create animation timeline
                const timeline = this.scene.tweens.createTimeline();

                // Add move to target (using calculated local coordinates)
                timeline.add({
                    targets: this.container,
                    x: moveToLocal.x,
                    y: moveToLocal.y,
                    duration: 300,
                    ease: 'Power2'
                });

                // Add return to original position (using original local coordinates)
                timeline.add({
                    targets: this.container,
                    x: originalLocalX,
                    y: originalLocalY,
                    duration: 300,
                    ease: 'Power2'
                });

                // Play timeline
                timeline.play();

                // Call complete callback
                if (onComplete) {
                    timeline.once('complete', onComplete);
                }
            }
        } catch (error) {
             console.error(`showAttackAnimation (${this.character.name}): Error creating/playing tween:`, error);
             // Ensure callback is still called on error
             if (onComplete) {
                  try { onComplete(); } catch (cbError){ console.error("Error in onComplete callback:", cbError); }
             }
        }
    }
    
    /**
     * Create an impact effect at the target during attack animations
     * @param {CharacterSprite} targetSprite - The target of the attack
     */
    createImpactEffect(targetSprite) {
        try {
            // Create flash or particle effect at target position
            const targetPos = new Phaser.Math.Vector2();
            targetSprite.container.getWorldTransformMatrix().transformPoint(0, 0, targetPos);
            
            // Create impact effect at target's position
            const impactFlash = this.scene.add.circle(
                targetPos.x, targetPos.y, 
                40, 0xFFFFFF, 0.7
            );
            
            // Animate impact and destroy
            this.scene.tweens.add({
                targets: impactFlash,
                alpha: 0,
                scale: 1.5,
                duration: 200,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    impactFlash.destroy();
                }
            });
        } catch (error) {
            console.error('Error creating impact effect:', error);
        }
    }


    /**
     * Show a floating text effect above the character
     * @param {string} text - Text to display
     * @param {Object} style - Text style options
     */
    showFloatingText(text, style = {}) {
          // Validate container and scene
          if (!this.container || !this.scene || !this.scene.tweens || !this.scene.add) {
               console.error(`showFloatingText (${this.character?.name}): Missing container or scene functionality (tweens/add).`);
               return;
          }
         try { // Added try...catch
            const defaultStyle = {
                fontFamily: 'Arial',
                fontSize: 16,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            };
            const mergedStyle = {...defaultStyle, ...style};
            
            // Check if container has getWorldTransformMatrix method
            if (!this.container.getWorldTransformMatrix) {
                console.error(`showFloatingText (${this.character?.name}): Container missing getWorldTransformMatrix method.`);
                return;
            }
            
            // Get global position of the character using world transform matrix
            let globalPosition = new Phaser.Math.Vector2();
            this.container.getWorldTransformMatrix().transformPoint(0, 0, globalPosition);
            
            console.log(`showFloatingText (${this.character?.name}): Using global position (${globalPosition.x}, ${globalPosition.y}) for floating text.`);

            // Adjust vertical position based on representation
            let yOffset = -50; // Default for circle representation
            
            if (this.cardConfig.enabled && this.cardFrame) {
                // For card frames, adjust to be above the card
                yOffset = -this.cardConfig.height/2 - 20;
            }

            // Create text at the correct global position
            const floatingText = this.scene.add.text(
                globalPosition.x,
                globalPosition.y + yOffset, // Position based on representation
                text,
                mergedStyle
            ).setOrigin(0.5);

            // Ensure text is added with appropriate depth
            floatingText.setDepth(1000); // High depth to ensure visibility above other elements

            // Animate text (using the already positioned text's y coordinate)
            this.scene.tweens.add({
                targets: floatingText,
                y: floatingText.y - 50, // Move further up
                alpha: { from: 1, to: 0 }, // Fade out
                duration: 1500,
                ease: 'Power2',
                onComplete: () => {
                     // Safely destroy text only if it hasn't been destroyed already
                     if (floatingText && floatingText.scene) {
                          floatingText.destroy();
                     }
                }
            });
        } catch (error) {
             console.error(`showFloatingText (${this.character?.name}): Error creating/animating floating text:`, error);
        }
    }


    /**
 * Highlight this character as active - MOVED TO TurnIndicator.js
 */
highlight() {
    // Functionality moved to TurnIndicator.js
    console.log(`CharacterSprite highlight for ${this.character?.name} - delegating to TurnIndicator`);
    // TeamContainer will handle the actual highlighting via TurnIndicator
}

    /**
     * Remove highlight effect - MOVED TO TurnIndicator.js
     */
    unhighlight() {
        // Functionality moved to TurnIndicator.js
        // TeamContainer will handle unhighlighting via TurnIndicator
    }

    /**
     * Create the card-based character representation using CardFrame
     */
    createCardFrameRepresentation() {
        try {
            // Create CardFrame instance with proper configuration
            this.cardFrame = new window.CardFrame(this.scene, 0, 0, {
                // Character information
                characterKey: `character_${this.character.name}`,
                characterName: this.character.name,
                characterType: this.character.type,
                characterTeam: this.character.team,
                
                // Health information
                currentHealth: this.character.currentHp || 0,
                maxHealth: this.character.stats.hp || 100,
                showHealth: this.config.showHealth,
                
                // Visual customization
                width: this.cardConfig.width,
                height: this.cardConfig.height,
                portraitOffsetY: this.cardConfig.portraitOffsetY,
                
                // Art positioning from character data
                artOffsetX: parseInt(this.character.art?.left) || 0,
                artOffsetY: parseInt(this.character.art?.top) || 0,
                
                // Interactivity settings
                interactive: this.config.interactive,
                onSelect: () => {
                    // Forward selection event to scene (same as circle representation)
                    this.scene.events.emit('character_selected', this.character);
                },
                onHoverStart: () => {
                    // Handle hover start (e.g., show additional info)
                    this.scene.events.emit('character_hover_start', this.character);
                    document.body.style.cursor = 'pointer';
                },
                onHoverEnd: () => {
                    // Handle hover end
                    this.scene.events.emit('character_hover_end', this.character);
                    document.body.style.cursor = 'default';
                }
            });
            
            // Add CardFrame to main container
            this.container.add(this.cardFrame);
            
            // Set up events for the card frame
            this.setupCardFrameEvents();
            
            console.log(`CardFrame created successfully for ${this.character.name} of type ${this.character.type}`);
        } catch (error) {
            console.error(`CharacterSprite (${this.character?.name}): Error creating card frame:`, error);
            
            // Fall back to circle representation
            this.cardConfig.enabled = false;
            this.createCircleRepresentation();
        }
    }
    
    /**
     * Set up event listeners for the card frame
     */
    setupCardFrameEvents() {
        try {
            // Listen for scene events that need to update CardFrame
            this.scene.events.on('turn_started', (characterId) => {
                if (this.character.uniqueId === characterId && this.cardFrame) {
                    this.cardFrame.setHighlighted(true);
                } else if (this.cardFrame) {
                    this.cardFrame.setHighlighted(false);
                }
            }, this);
            
            // Cleanup on shutdown/destroy
            this.scene.events.once('shutdown', this.cleanupCardFrameEvents, this);
            this.scene.events.once('destroy', this.cleanupCardFrameEvents, this);
        } catch (error) {
            console.error(`CharacterSprite (${this.character?.name}): Error setting up card frame events:`, error);
        }
    }
    
    /**
     * Clean up card frame event listeners
     */
    cleanupCardFrameEvents() {
        try {
            // Remove all event listeners
            if (this.scene && this.scene.events) {
                this.scene.events.off('turn_started', null, this);
            }
        } catch (error) {
            console.error(`CharacterSprite (${this.character?.name}): Error cleaning up card frame events:`, error);
        }
    }

    /**
     * Clean up sprite resources
     */
    destroy() {
         console.log(`CharacterSprite destroy: Cleaning up sprite for ${this.character?.name || 'Unknown'}`);
        // Remove from global reference
        if (window.characterSprites && this.character && this.character.name) {
            // Only delete if it's the same instance (less critical now but good practice)
            if(window.characterSprites[this.character.name] === this) {
                 delete window.characterSprites[this.character.name];
            }
        }

        // Clean up action indicator
        if (this.actionIndicator) {
            try {
                this.actionIndicator.destroy();
                console.log(`CharacterSprite destroy: Action indicator destroyed for ${this.character?.name || 'Unknown'}`);
            } catch (error) {
                console.error(`CharacterSprite destroy: Error destroying action indicator for ${this.character?.name || 'Unknown'}:`, error);
            }
            this.actionIndicator = null;
        }
        
        // Clean up status effect container
        if (this.statusEffectContainer) {
            try {
                this.statusEffectContainer.destroy();
                console.log(`CharacterSprite destroy: Status effect container destroyed for ${this.character?.name || 'Unknown'}`);
            } catch (error) {
                console.error(`CharacterSprite destroy: Error destroying status effect container for ${this.character?.name || 'Unknown'}:`, error);
            }
            this.statusEffectContainer = null;
        }
        
        // Clean up card frame if it exists
        if (this.cardFrame) {
            try {
                // CardFrame handles its own cleanup in its destroy method
                this.cardFrame.destroy();
                console.log(`CharacterSprite destroy: CardFrame destroyed for ${this.character?.name || 'Unknown'}`);
            } catch (error) {
                console.error(`CharacterSprite destroy: Error destroying CardFrame for ${this.character?.name || 'Unknown'}:`, error);
            }
            this.cardFrame = null;
            
            // Clean up card frame events
            this.cleanupCardFrameEvents();
        }
        
        // Stop any active tweens (highlight tweens moved to TurnIndicator)

        // Clean up and destroy container and its children
         if (this.container) {
             try {
                 this.container.destroy(true); // Pass true to destroy children
                 console.log(`CharacterSprite destroy: Container destroyed for ${this.character?.name || 'Unknown'}`);
             } catch (error) {
                  console.error(`CharacterSprite destroy: Error destroying container for ${this.character?.name || 'Unknown'}:`, error);
             }
             this.container = null; // Nullify reference
         }

         // Nullify other references
         this.scene = null;
         this.character = null;
         this.config = null;
         this.cardConfig = null;
         this.circle = null;
         this.characterImage = null;
         this.nameText = null;
         this.healthBarContainer = null;
         this.healthBar = null;
         this.healthBarBg = null;
         this.hpText = null;
         // Highlight effect references removed (moved to TurnIndicator)
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterSprite;
}

// Make available globally
window.CharacterSprite = CharacterSprite;