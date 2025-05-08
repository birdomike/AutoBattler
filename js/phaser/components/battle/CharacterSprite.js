/**
 * CharacterSprite.js
 * Renders a character in the battle scene with appropriate visual elements
 * (Added try...catch blocks for debugging)
 */
class CharacterSprite {
    /**
     * Update the character's health and refresh the health bar
     * @param {number} newHealth - The character's new health value
     * @param {number} maxHealth - The character's maximum health (usually character.stats.hp)
     */
    updateHealth(newHealth, maxHealth) {
        // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
        // TODO: REMOVE or MOVE after bug fix / refactoring
        console.log(`[HEALTH DEBUG] CharacterSprite.updateHealth called for ${this.character?.name}, HP: ${newHealth}/${maxHealth}`);
        // END TEMPORARY DIAGNOSTIC CODE

        console.log(`CharacterSprite.updateHealth: ${this.character?.name} health to ${newHealth}/${maxHealth}`);
        
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
            
            // Update the visual health bar
            // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
            // TODO: REMOVE or MOVE after bug fix / refactoring
            console.log(`[HEALTH DEBUG] CharacterSprite.updateHealth calling updateHealthBar for ${this.character?.name}`);
            // END TEMPORARY DIAGNOSTIC CODE
            
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
        // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
        // TODO: REMOVE or MOVE after bug fix / refactoring
        console.log(`[HEALTH DEBUG] CharacterSprite.updateHealthBar called for ${this.character?.name}, HP: ${currentHealth}/${maxHealth}`);
        // END TEMPORARY DIAGNOSTIC CODE

        console.log(`CharacterSprite.updateHealthBar: ${this.character?.name} health ${currentHealth}/${maxHealth}`);
        
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
            
            // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
            // TODO: REMOVE or MOVE after bug fix / refactoring
            console.log(`[HEALTH DEBUG] CharacterSprite.updateHealthBar finished visual update for ${this.character?.name}: ${healthPercent * 100}% (${safeCurrentHealth}/${safeMaxHealth})`);
            // END TEMPORARY DIAGNOSTIC CODE
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
            showStatusEffects: true
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


        // --- Create character visual elements with try...catch ---
        try {
             console.log(`CharacterSprite (${character.name}): Creating character image...`);
            this.createCharacterImage();
             console.log(`CharacterSprite (${character.name}): Character image created.`);
        } catch(error) {
            console.error(`CharacterSprite Constructor (${character.name}): Error in createCharacterImage:`, error);
            // Optionally create a fallback visual here if image fails
        }

        if (this.config.showName) {
            try {
                 console.log(`CharacterSprite (${character.name}): Creating name text...`);
                this.createNameText();
                 console.log(`CharacterSprite (${character.name}): Name text created.`);
            } catch(error) {
                console.error(`CharacterSprite Constructor (${character.name}): Error in createNameText:`, error);
            }
        }

        if (this.config.showHealth) {
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
                // Generic action text
                this.actionIndicator.showAction(actionText);
            }
        } catch (error) {
            console.error(`showActionText (${this.character?.name}): Error showing action text:`, error);
        }
    }

    /**
     * Create the character image using the character art
     */
    createCharacterImage() {
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
                 align: 'center'
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
                 strokeThickness: 2
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
            fire: 0xFF4500, water: 0x1E90FF, nature: 0x32CD32,
            electric: 0xFFD700, ice: 0x87CEEB, rock: 0x8B4513,
            air: 0xF0F8FF, light: 0xFFFACD, dark: 0x483D8B,
            metal: 0xC0C0C0, psychic: 0xDA70D6, poison: 0x9370DB,
            physical: 0xBDB76B, arcane: 0x9932CC, mechanical: 0x708090,
            void: 0x191970, crystal: 0xB0E0E6, storm: 0x4682B4,
            ethereal: 0xE6E6FA, blood: 0x8B0000, plague: 0x556B2F,
            gravity: 0x2F4F4F, neutral: 0xAAAAAA // Added neutral for placeholder
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
     */
    showAttackAnimation(targetSprite, onComplete) {
         // Validate targetSprite
         if (!targetSprite || !targetSprite.container) {
             console.error(`showAttackAnimation (${this.character.name}): Invalid targetSprite provided.`);
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
            // Show auto attack action indicator
            this.showActionText('Auto Attack');
            
            // Store original position
            const originalX = this.container.x;
            const originalY = this.container.y;

            // Calculate target position (move 70% toward target)
             // Use targetSprite's container position directly
            const targetPos = {
                x: targetSprite.container.x,
                y: targetSprite.container.y
            };

            const moveToX = originalX + (targetPos.x - originalX) * 0.7;
            const moveToY = originalY + (targetPos.y - originalY) * 0.7;

            // Create animation timeline
            const timeline = this.scene.tweens.createTimeline();

            // Add move to target
            timeline.add({
                targets: this.container,
                x: moveToX,
                y: moveToY,
                duration: 300,
                ease: 'Power2'
            });

            // Add return to original position
            timeline.add({
                targets: this.container,
                x: originalX,
                y: originalY,
                duration: 300,
                ease: 'Power2'
            });

            // Play timeline
            timeline.play();

            // Call complete callback
            if (onComplete) {
                timeline.once('complete', onComplete);
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
     * Show a floating text effect above the character
     * @param {string} text - Text to display
     * @param {Object} style - Text style options
     */
    showFloatingText(text, style = {}) {
          // Validate container and scene
          if (!this.container || !this.scene || !this.scene.tweens || !this.scene.add) {
               console.error(`showFloatingText (${this.character.name}): Missing container or scene functionality (tweens/add).`);
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

            // Create text
            const floatingText = this.scene.add.text(
                this.container.x,
                this.container.y - 50, // Initial position slightly higher
                text,
                mergedStyle
            ).setOrigin(0.5);

             // Ensure text is added to the correct display list / depth if necessary
             // floatingText.setDepth(100); // Example: Set depth if needed

            // Animate text
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
             console.error(`showFloatingText (${this.character.name}): Error creating/animating floating text:`, error);
        }
    }


    /**
 * Highlight this character as active
 */
highlight() {
    if (!this.scene || !this.container) {
        console.warn(`[CharacterSprite] highlight: Cannot highlight ${this.character?.name}, missing scene or container`);
        return; // Safety check
    }
    
    console.log(`CS.highlight: Called for character ${this.character?.name}. Initial state: highlightEffect visible=${this.highlightEffect ? (this.highlightEffect.visible ? 'true' : 'false') : 'undefined'}, alpha=${this.highlightEffect ? this.highlightEffect.alpha : 'undefined'}, shadowEffect visible=${this.shadowEffect ? (this.shadowEffect.visible ? 'true' : 'false') : 'undefined'}, alpha=${this.shadowEffect ? this.shadowEffect.alpha : 'undefined'}.`);
    
    try { // Added try...catch
        // Get the character sprite's height to position at the bottom
        let bottomOffset = 20; // Offset from center of container to bottom of character
        
        // Check if we have a character image to better determine position
        if (this.characterImage && this.characterImage.height) {
            // Position at the bottom of the character with a smaller offset (moved upward)
            bottomOffset = (this.characterImage.height / 2) -26; 
        }
        
        // Create highlight effect if it doesn't exist
        if (!this.highlightEffect || !this.highlightEffect.scene) { // Check if destroyed
            console.log(`Creating highlight for ${this.character?.name}`);
            
            // First, add a subtle shadow
            this.shadowEffect = this.scene.add.ellipse(0, bottomOffset, 60, 15, 0x000000, 0.4);
            this.container.add(this.shadowEffect);
            this.container.sendToBack(this.shadowEffect);
            
            // Determine color based on team
            const teamColor = this.character?.team === 'player' ? 0x4488ff : 0xff4444;
            console.log(`Using team color: ${teamColor.toString(16)} for ${this.character?.name} (team: ${this.character?.team})`);
            
            // Use a simple colored ellipse instead of complex graphics
            this.highlightEffect = this.scene.add.ellipse(0, bottomOffset - 2, 55, 13, teamColor, 0.4);
            this.container.add(this.highlightEffect);
            
            // Add the highlight between the shadow and character (middle layer)
            if (this.shadowEffect) {
                this.container.bringToTop(this.highlightEffect);
                this.container.bringToTop(this.shadowEffect);
                this.container.sendToBack(this.shadowEffect);
            }
            
            // Add subtle glow animation
            if (this.scene.tweens) {
                console.log(`Creating tween for ${this.character?.name}`);
                this.glowTween = this.scene.tweens.add({
                    targets: this.highlightEffect,
                    alpha: { from: 0.3, to: 0.7 },
                    duration: 1200,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
            }
            
            console.log(`CS.highlight: Visuals (ellipse, shadow) created/updated. Tweens starting.`);
        } else {
            this.highlightEffect.setVisible(true);
            if (this.shadowEffect) this.shadowEffect.setVisible(true);
            
            // Restart glow animation if it exists
            if (this.glowTween && this.glowTween.isPaused()) {
                this.glowTween.restart();
            }
        }
    } catch (error) {
        console.error(`highlight (${this.character.name}): Error creating/showing highlight:`, error);
    }
}


    /**
     * Remove highlight effect
     */
    unhighlight() {
        // Hide both highlight and shadow
        if (this.highlightEffect && this.highlightEffect.scene) {
             try { // Added try...catch
                 this.highlightEffect.setVisible(false);
                 
                 // Stop the glow animation if it exists
                 if (this.glowTween) {
                     this.glowTween.pause();
                 }
             } catch (error) {
                  console.error(`unhighlight (${this.character.name}): Error hiding highlight:`, error);
             }
        }
        
        if (this.shadowEffect && this.shadowEffect.scene) {
            try {
                this.shadowEffect.setVisible(false);
            } catch (error) {
                console.error(`unhighlight (${this.character.name}): Error hiding shadow:`, error);
            }
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
        
        // Stop any active tweens
        if (this.glowTween) {
            this.glowTween.stop();
            this.glowTween = null;
        }

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
         this.circle = null;
         this.characterImage = null;
         this.nameText = null;
         this.healthBarContainer = null;
         this.healthBar = null;
         this.healthBarBg = null;
         this.hpText = null;
         this.highlightEffect = null; // Ensure highlight is cleared too
         this.shadowEffect = null; // Clear shadow effect too
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterSprite;
}

// Make available globally
window.CharacterSprite = CharacterSprite;