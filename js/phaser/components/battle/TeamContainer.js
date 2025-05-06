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
        // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
        // TODO: REMOVE or MOVE after bug fix / refactoring
        console.log(`[HEALTH DEBUG] TeamContainer.updateCharacterHealth called for ${typeof characterId === 'object' ? characterId?.name : characterId}, team: ${this.isPlayerTeam ? 'player' : 'enemy'}, characterId: ${typeof characterId === 'object' ? characterId?.uniqueId || characterId?.id : characterId}`);
        // END TEMPORARY DIAGNOSTIC CODE

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
        
        // Try to find character sprite using enhanced finding logic
        // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
        // TODO: REMOVE or MOVE after bug fix / refactoring
        console.log(`[HEALTH DEBUG] TeamContainer.updateCharacterHealth: About to call findCharacterSprite`);
        // END TEMPORARY DIAGNOSTIC CODE

        const sprite = this.findCharacterSprite(characterId);
        
        if (!sprite) {
            // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
            // TODO: REMOVE or MOVE after bug fix / refactoring
            console.warn(`[HEALTH DEBUG] Character sprite not found for ${typeof characterId === 'object' ? characterId?.name : characterId}, ID: ${typeof characterId === 'object' ? characterId?.uniqueId || characterId?.id : characterId}`);
            // END TEMPORARY DIAGNOSTIC CODE
        } else {
            // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
            // TODO: REMOVE or MOVE after bug fix / refactoring
            console.log(`[HEALTH DEBUG] Found CharacterSprite for ${sprite.character.name}, calling updateHealth`);
            // END TEMPORARY DIAGNOSTIC CODE
            
            console.log(`TeamContainer: Updating ${sprite.character.name}'s health to ${newHealth}/${maxHealth}`);
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
        // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
        // TODO: REMOVE or MOVE after bug fix / refactoring
        console.log(`[HEALTH DEBUG] TeamContainer.findCharacterSprite entry: character=${typeof character === 'object' ? character?.name : character}`);
        // END TEMPORARY DIAGNOSTIC CODE

        if (!character) return null;
        
        // Try finding by direct reference first
        let sprite = this.characterSprites.find(s => s.character === character);
        if (sprite) {
            // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
            // TODO: REMOVE or MOVE after bug fix / refactoring
            console.log(`[HEALTH DEBUG] Found by direct reference: ${sprite.character.name}`);
            // END TEMPORARY DIAGNOSTIC CODE
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
            spacing: 180, // Original spacing
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
                y: -spacing - 40 // Move first character 40px higher
            });
            
            // Keep middle character in center
            positions.push({
                x: 0,
                y: 0
            });
            
            // Position last character lower
            positions.push({
                x: 0,
                y: spacing + 40 // Move last character 40px lower
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
        let sprite;

        if (typeof identifier === 'number') {
            sprite = this.getCharacterSpriteByIndex(identifier);
        } else {
            sprite = this.getCharacterSpriteByName(identifier);
        }

        if (sprite) {
            // Unhighlight all others first
             if (Array.isArray(this.characterSprites)){
                 this.characterSprites.forEach(s => {
                      if(s && typeof s.unhighlight === 'function') s.unhighlight()
                 });
            }
            // Highlight the selected character
            if (typeof sprite.highlight === 'function') sprite.highlight();
        }
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
        
        // Unhighlight all characters in this team
        this.characterSprites.forEach((sprite, index) => {
            if (sprite && typeof sprite.unhighlight === 'function') {
                sprite.unhighlight();
            }
        });
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