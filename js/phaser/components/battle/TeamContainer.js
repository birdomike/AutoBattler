/**
 * TeamContainer.js
 * Manages a team of character sprites with proper positioning
 * (Added try...catch blocks for debugging)
 */
class TeamContainer {
    /**
     * Update a character's health in this team
     * @param {string|number|Object} characterId - The character ID, name, or object to update
     * @param {number} newHealth - The new health value
     * @param {number} maxHealth - The maximum health value
     * @returns {boolean} - True if a character was found and updated
     */
    updateCharacterHealth(characterId, newHealth, maxHealth) {
        if (window.VERBOSE_LOGGING) {
            console.log(`TeamContainer.updateCharacterHealth: Updating ${typeof characterId === 'object' ? characterId?.name : characterId} to health ${newHealth}/${maxHealth}`);
            
            // Check if characterSprites is valid
            if (!Array.isArray(this.characterSprites) || this.characterSprites.length === 0) {
                console.warn('TeamContainer.updateCharacterHealth: No character sprites available');
                return false;
            }
            
            // Log available characters for debugging
            console.log('Available characters in team:');
            this.characterSprites.forEach(sprite => {
                if (sprite && sprite.character) {
                    console.log(`- ${sprite.character.name} (id: ${sprite.character.id}, uniqueId: ${sprite.character.uniqueId}, team: ${sprite.character.team})`);
                }
            });
        } else {
            // Check if characterSprites is valid without logging
            if (!Array.isArray(this.characterSprites) || this.characterSprites.length === 0) {
                console.warn('TeamContainer.updateCharacterHealth: No character sprites available');
                return false;
            }
        }
        
        // Try to find character sprite using enhanced finding logic


        const sprite = this.findCharacterSprite(characterId);
        
        if (!sprite) {
        } else {
            if (window.VERBOSE_LOGGING) {
                console.log(`TeamContainer: Updating ${sprite.character.name}'s health to ${newHealth}/${maxHealth}`);
            }
            sprite.updateHealth(newHealth, maxHealth);
            return true;
        }
        
        console.warn(`Could not find character sprite for ID/name: ${typeof characterId === 'object' ? JSON.stringify(characterId) : characterId}`);
        return false;
    }
    
    /**
     * Enhanced method to find a character sprite with multiple identification strategies
     * @param {string|number|Object} character - Character identifier (id, name, uniqueId) or object
     * @returns {Object|null} - The character sprite or null if not found
     */
    findCharacterSprite(character) {

        if (!character) return null;
        
        // Try finding by direct reference first
        let sprite = this.characterSprites.find(s => s.character === character);
        if (sprite) {
            return sprite;
        }
        
        // If character is an object, try all its properties
        if (typeof character === 'object') {
            // Try finding by id
            if (character.id !== undefined) {
                sprite = this.characterSprites.find(s => s.character?.id === character.id);
                if (sprite) return sprite;
            }
            
            // Try finding by name
            if (character.name) {
                sprite = this.characterSprites.find(s => s.character?.name === character.name);
                if (sprite) return sprite;
            }
            
            // Try finding by uniqueId
            if (character.uniqueId) {
                sprite = this.characterSprites.find(s => s.character?.uniqueId === character.uniqueId);
                if (sprite) return sprite;
            }
            
            // Try with team information if available
            if (character.name && (character.team === 'player' || character.team === 'enemy')) {
                const matchesTeam = this.isPlayerTeam ? (character.team === 'player') : (character.team === 'enemy');
                sprite = this.characterSprites.find(s => 
                    s.character?.name === character.name && 
                    (s.character?.team === character.team || s.isPlayerTeam === matchesTeam)
                );
                if (sprite) return sprite;
            }
        }
        
        // If character is a string, handle different formats
        if (typeof character === 'string') {
            // Try as direct name or id match
            sprite = this.characterSprites.find(s => 
                s.character?.name === character || 
                s.character?.id === character || 
                s.character?.uniqueId === character
            );
            if (sprite) return sprite;
            
            // Handle team-prefixed IDs (e.g., "enemy_Drakarion_1")
            const parts = character.split('_');
            if (parts.length >= 2) {
                const teamPrefix = parts[0]; // "enemy" or "player"
                const charName = parts[1];   // "Drakarion", "Vaelgor", etc.
                
                // Match by name and team type
                const matchesTeam = this.isPlayerTeam ? (teamPrefix === 'player') : (teamPrefix === 'enemy');
                
                sprite = this.characterSprites.find(s => 
                    s.character?.name === charName && 
                    this.isPlayerTeam === matchesTeam
                );
                if (sprite) return sprite;
                
                // If still not found, try just the name
                sprite = this.characterSprites.find(s => s.character?.name === charName);
                if (sprite) return sprite;
            }
        }
        
        // If character is a number, try as index
        if (typeof character === 'number') {
            if (character >= 0 && character < this.characterSprites.length) {
                return this.characterSprites[character];
            }
        }
        
        // Not found with any method
        return null;
    }

    /**
     * Create a new team container
     * @param {Phaser.Scene} scene - The scene this container belongs to
     * @param {Array} team - Array of character objects
     * @param {boolean} isPlayerTeam - Whether this is the player's team
     * @param {Object} config - Configuration options
     */
    constructor(scene, team, isPlayerTeam, config = {}) {
        this.scene = scene;
        this.team = team;
        this.isPlayerTeam = isPlayerTeam;

        // Set up default config
        this.config = Object.assign({
            x: isPlayerTeam ? 300 : 900,
            y: 350,
            spacing: 350, // Increased from 275 to provide adequate space for card frames
            characterScale: 1,
            interactive: true
        }, config);

        // The character sprites in this team
        this.characterSprites = [];

        // Create container
        try { // Added try for container creation
            this.container = scene.add.container(this.config.x, this.config.y);
        } catch (error) {
             console.error(`TeamContainer Constructor: Error creating Phaser container for team ${isPlayerTeam ? 'Player' : 'Enemy'} at (${this.config.x}, ${this.config.y}):`, error);
             // Attempt to recover or just log and potentially fail later
             // For now, let's try creating a default container
             if (!this.container) {
                  try { this.container = scene.add.container(0,0); } catch(e){ console.error("Failed fallback container creation too!"); }
             }
             // Propagate the error up if needed, or handle it here
             // throw error; // Optional: re-throw if it's critical
        }

        // Initialize TurnIndicator for this team
        this.turnIndicatorInstance = null; // Initialize to null
        try {
            if (window.TurnIndicator) { // Check if TurnIndicator class is available
                this.turnIndicatorInstance = new TurnIndicator(this.scene);
                // TurnIndicator's constructor handles scene.add.existing(this)
                console.log(`TeamContainer for ${this.isPlayerTeam ? 'Player' : 'Enemy'} team: TurnIndicator instance created successfully.`);
            } else {
                console.error(`TeamContainer for ${this.isPlayerTeam ? 'Player' : 'Enemy'} team: TurnIndicator class not found on window.`);
            }
        } catch (error) {
            console.error(`TeamContainer for ${this.isPlayerTeam ? 'Player' : 'Enemy'} team: Error creating TurnIndicator instance:`, error);
        }


        // Initialize character sprites - Wrapped call
        try {
            console.log(`TeamContainer: Initializing characters for team ${isPlayerTeam ? 'Player' : 'Enemy'}. Team size: ${this.team?.length || 0}`);
            this.initializeCharacters();
             console.log(`TeamContainer: Finished initializing characters for team ${isPlayerTeam ? 'Player' : 'Enemy'}. Sprites created: ${this.characterSprites.length}`);
        } catch (error) {
            console.error(`TeamContainer Constructor: Error calling initializeCharacters for team ${isPlayerTeam ? 'Player' : 'Enemy'}:`, error);
             // Depending on how critical this is, you might want to stop or show an error message
             // For now, we log the error. The team might be partially rendered or empty.
        }

        // Make available globally for debugging
        if (!window.teamContainers) window.teamContainers = {player: null, enemy: null};
        window.teamContainers[isPlayerTeam ? 'player' : 'enemy'] = this;
    }

    /**
     * Initialize characters within the team
     */
    initializeCharacters() {
        // Ensure team is an array
        if (!Array.isArray(this.team)) {
            console.error('TeamContainer initializeCharacters: this.team is not an array!', this.team);
            this.team = []; // Attempt recovery
        }

        // Calculate positions for each character
        const positions = this.calculatePositions(this.team.length);
        console.log(`TeamContainer initializeCharacters: Calculated ${positions.length} positions.`);


        // Create character sprites
        this.team.forEach((character, index) => {
            // Add team property to character if not set
             if (!character) {
                 console.error(`TeamContainer initializeCharacters: Found null/undefined character at index ${index}. Skipping.`);
                 return; // Skip this iteration
             }

             if (!character.team) {
                character.team = this.isPlayerTeam ? 'player' : 'enemy';
            }

            // Set initial HP if not set
             if (!character.stats) {
                 console.error(`TeamContainer initializeCharacters: Character ${character.name || 'Unknown'} has no stats! Assigning default HP.`);
                 character.stats = { hp: 1 }; // Minimal default stats
             }
            if (typeof character.currentHp === 'undefined') {
                character.currentHp = character.stats.hp;
            }

            // --- Added try...catch around CharacterSprite instantiation ---
            try {
                 console.log(`TeamContainer initializeCharacters: Creating CharacterSprite for ${character.name || 'Unknown ID ' + character.id} at index ${index}.`);
                const sprite = new CharacterSprite(this.scene, character, {
                    x: positions[index].x,
                    y: positions[index].y,
                    scale: this.config.characterScale,
                    interactive: this.config.interactive
                });
                 console.log(`TeamContainer initializeCharacters: Successfully created sprite for ${character.name || 'Unknown ID ' + character.id}.`);

                // Add to our array ONLY if creation succeeded
                this.characterSprites.push(sprite);
                 // IMPORTANT: Add sprite's container to the TeamContainer's container
                 if (this.container && sprite.container) {
                      this.container.add(sprite.container);
                 } else {
                      console.error(`TeamContainer initializeCharacters: Cannot add sprite container for ${character.name}. Main container or sprite container is missing.`);
                 }

            } catch (error) {
                console.error(`TeamContainer initializeCharacters: Error creating CharacterSprite for character: ${character.name || 'Unknown ID ' + character.id} at index ${index}.`, error);
                 // Continue to next character instead of stopping the whole loop
            }
            // --- End of added try...catch ---
        });
         console.log(`TeamContainer initializeCharacters: Finished loop. Total sprites in array: ${this.characterSprites.length}. Sprites added to Phaser container: ${this.container?.list.length || 0}`);
    }

    /**
     * Calculate positions for characters based on team size
     * @param {number} teamSize - Number of characters in the team
     * @returns {Array} - Array of {x,y} positions
     */
    calculatePositions(teamSize) {
         if (typeof teamSize !== 'number' || teamSize < 0) {
             console.warn(`TeamContainer calculatePositions: Invalid teamSize (${teamSize}). Defaulting to 0.`);
             teamSize = 0;
         }
        const positions = [];
        const spacing = this.config.spacing;

        // For 3 character teams, use a special positioning
        if (teamSize === 3) {
            // Position first character higher
            positions.push({
                x: 0,
                y: -spacing - 20 // Move first character 20px higher (reduced from 40px with increased spacing)
            });
            
            // Keep middle character in center
            positions.push({
                x: 0,
                y: 0
            });
            
            // Position last character lower
            positions.push({
                x: 0,
                y: spacing + 20 // Move last character 20px lower (reduced from 40px with increased spacing)
            });
            
            return positions;
        }
        
        // Default positioning for other team sizes
        // Vertical positioning with team centered
        const startY = -(spacing * (teamSize - 1)) / 2;

        for (let i = 0; i < teamSize; i++) {
            positions.push({
                x: 0,
                y: startY + (i * spacing)
            });
        }

        return positions;
    }

    /**
     * Get a character sprite by name
     * @param {string} name - Character name
     * @returns {CharacterSprite|null} - The character sprite or null
     */
    getCharacterSpriteByName(name) {
        // Add safety check
        if (!Array.isArray(this.characterSprites)) {
            console.warn(`[TeamContainer] getCharacterSpriteByName: characterSprites is not an array, cannot look up "${name}"`);
            return null;
        }

        const foundSprite = this.characterSprites.find(sprite => sprite && sprite.character && sprite.character.name === name);
        
        return foundSprite;
    }

    /**
     * Get a character sprite by index
     * @param {number} index - Index in the team
     * @returns {CharacterSprite|null} - The character sprite or null
     */
    getCharacterSpriteByIndex(index) {
         // Add safety check
         if (!Array.isArray(this.characterSprites)) return null;
        return index >= 0 && index < this.characterSprites.length
            ? this.characterSprites[index]
            : null;
    }

    /**
     * Update all character sprites in the team
     */
    update() {
         // Add safety check
         if (!Array.isArray(this.characterSprites)) return;
        this.characterSprites.forEach(sprite => {
             // Check if sprite exists and has an update method
             if (sprite && typeof sprite.update === 'function') {
                  sprite.update();
             }
        });
    }

    /**
     * Show turn indicator for a specific character
     * @param {string|number} identifier - Character name or index
     */
    showTurnIndicator(identifier) {
        if (window.VERBOSE_LOGGING) {
            console.log(`TC.showTurnIndicator: Called for Turn Highlighting with ID [${identifier}]. Attempting to find CharacterSprite.`);
        }
        let sprite;

        if (typeof identifier === 'number') {
            sprite = this.getCharacterSpriteByIndex(identifier);
        } else {
            sprite = this.getCharacterSpriteByName(identifier);
        }
        
        if (window.VERBOSE_LOGGING) {
            console.log(`TC.showTurnIndicator: Found CharacterSprite: ${sprite ? `sprite for ${sprite.character?.name}` : 'null'}. Attempting to call sprite.highlight().`);
        }

        if (sprite) {
            if (this.turnIndicatorInstance) {
                // Hide any currently shown indicator for this team instance immediately
                this.turnIndicatorInstance.hide(0); // Hide with 0 duration

                // Calculate position at character's feet
                let bottomOffset = 20; // Default offset
                if (sprite.characterImage && sprite.characterImage.height) {
                    // Position it roughly below the character image's vertical center
                    bottomOffset = (sprite.characterImage.height / 2) - 26; 
                }

                const indicatorX = sprite.container.x;
                const indicatorY = sprite.container.y + bottomOffset;
                const teamColor = this.isPlayerTeam ? 0x4488ff : 0xff4444; // Blue for player, Red for enemy

                if (window.VERBOSE_LOGGING) {
                    console.log(`TC.showTurnIndicator: Calling turnIndicatorInstance.showAt for ${sprite.character?.name} at (${indicatorX}, ${indicatorY}) with color ${teamColor.toString(16)}`);
                }
                const fadeInTime = 250; // ms - for smooth fade-in
                this.turnIndicatorInstance.showAt(indicatorX, indicatorY, teamColor, fadeInTime);
            } else {
                console.warn(`TC.showTurnIndicator: turnIndicatorInstance is null for ${this.isPlayerTeam ? 'Player' : 'Enemy'} team. Cannot show indicator.`);
            }
        }
    }

    /**
     * Clear all highlight effects from all characters in the team
     */
    clearAllHighlights() {
        // Add safety check
        if (!Array.isArray(this.characterSprites)) {
            console.warn(`[TeamContainer] clearAllHighlights: characterSprites is not an array, skipping clear operation.`);
            return; 
        }
        
        if (window.VERBOSE_LOGGING) {
            console.log(`TC.clearAllHighlights: Called for ${this.isPlayerTeam ? 'player' : 'enemy'} team, clearing highlights for ${this.characterSprites.length} sprites.`);
        }
        
        // Unhighlight all characters in this team
        this.characterSprites.forEach((sprite, index) => {
            if (sprite && typeof sprite.unhighlight === 'function') {
                sprite.unhighlight();
            }
        });
    }
    
    /**
     * Clear turn indicators from all characters in the team
     */
    clearTurnIndicators() {
        // Add safety check
        if (!Array.isArray(this.characterSprites)) {
            console.warn(`[TeamContainer] clearTurnIndicators: characterSprites is not an array, skipping clear operation.`);
            return; 
        }
        
        if (this.turnIndicatorInstance) {
            if (window.VERBOSE_LOGGING) {
                console.log(`TC.clearTurnIndicators: Hiding turnIndicatorInstance for ${this.isPlayerTeam ? 'Player' : 'Enemy'} team.`);
            }
            const fadeOutTime = 250; // ms - for smooth fade-out
            this.turnIndicatorInstance.hide(fadeOutTime); 
        } else {
            console.warn(`TC.clearTurnIndicators: turnIndicatorInstance is null for ${this.isPlayerTeam ? 'Player' : 'Enemy'} team. Cannot hide indicator.`);
        }
        
        if (window.VERBOSE_LOGGING) {
            console.log(`TC.clearTurnIndicators: Clearing turn indicators for ${this.isPlayerTeam ? 'player' : 'enemy'} team with ${this.characterSprites.length} sprites.`);
        }
        
        // The following code is commented out as turnIndicatorInstance.hide() now handles the primary visual effect
        // Keeping as a reference for now
        /*
        this.characterSprites.forEach((sprite, index) => {
            if (sprite && typeof sprite.unhighlight === 'function') {
                sprite.unhighlight();
            }
        });
        */
    }

    /**
     * Debug method to log all character sprite ID mappings
     * @returns {Object} Debug information about all character mappings
     */
    debugCharacterIdMapping() {
        console.group(`TeamContainer Debug - ${this.isPlayerTeam ? 'Player' : 'Enemy'} Team Character Mappings:`);
        console.log(`Team Type: ${this.isPlayerTeam ? 'Player' : 'Enemy'}`);
        console.log(`Total Characters: ${this.characterSprites?.length || 0}`);
        
        const mappings = [];
        
        if (Array.isArray(this.characterSprites)) {
            this.characterSprites.forEach((sprite, index) => {
                if (!sprite || !sprite.character) {
                    console.log(`Character ${index}: Invalid sprite or character data`);
                    return;
                }
                
                const mapping = {
                    index,
                    name: sprite.character.name,
                    id: sprite.character.id,
                    uniqueId: sprite.character.uniqueId,
                    team: sprite.character.team || (this.isPlayerTeam ? 'player' : 'enemy'),
                    teamPrefix: this.isPlayerTeam ? 'player' : 'enemy',
                    prefixedIds: [
                        `${this.isPlayerTeam ? 'player' : 'enemy'}_${sprite.character.name}`,
                        `${this.isPlayerTeam ? 'player' : 'enemy'}_${sprite.character.name}_${sprite.character.id || index}`
                    ]
                };
                
                console.log(`Character ${index}:`, mapping);
                mappings.push(mapping);
            });
        } else {
            console.warn('No character sprites array available');
        }
        
        console.groupEnd();
        return mappings;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        console.log(`TeamContainer destroy: Cleaning up team ${this.isPlayerTeam ? 'Player' : 'Enemy'}`);
        // Remove from global reference
        if (window.teamContainers) {
            window.teamContainers[this.isPlayerTeam ? 'player' : 'enemy'] = null;
        }

        // Destroy all character sprites
         if (Array.isArray(this.characterSprites)) {
             this.characterSprites.forEach(sprite => {
                  if (sprite && typeof sprite.destroy === 'function') sprite.destroy()
             });
             this.characterSprites = []; // Clear the array
         }
        
        // Destroy the TurnIndicator instance
        if (this.turnIndicatorInstance) {
            if (typeof this.turnIndicatorInstance.destroy === 'function') {
                this.turnIndicatorInstance.destroy();
                console.log(`TeamContainer destroy: TurnIndicator instance destroyed for team ${this.isPlayerTeam ? 'Player' : 'Enemy'}`);
            }
            this.turnIndicatorInstance = null;
        }

        // Destroy container
        if (this.container) {
             try {
                 this.container.destroy();
                 console.log(`TeamContainer destroy: Container destroyed for team ${this.isPlayerTeam ? 'Player' : 'Enemy'}`);
             } catch(error) {
                  console.error(`TeamContainer destroy: Error destroying container for team ${this.isPlayerTeam ? 'Player' : 'Enemy'}:`, error);
             }
             this.container = null; // Nullify reference
        }
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamContainer;
}

// Make available globally
window.TeamContainer = TeamContainer;