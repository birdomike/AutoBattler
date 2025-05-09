/**
 * TeamDisplayManager - Manages team display and active character visualization in battle
 * 
 * Responsible for:
 * - Creating and managing team containers
 * - Creating and positioning the turn indicator
 * - Updating active character visuals
 * - Providing access to team data and character sprites
 * 
 * @version 0.6.2.3
 */
class TeamDisplayManager {
    /**
     * Constructor for TeamDisplayManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {Object} teamData - Initial team data with playerTeam and enemyTeam
     */
    constructor(scene, teamData = {}) {
        // Validate dependencies
        if (!scene) {
            console.error("[TeamDisplayManager] Missing required scene reference");
            return;
        }
        
        this.scene = scene;
        this.playerTeam = teamData.playerTeam || [];
        this.enemyTeam = teamData.enemyTeam || [];
        
        // Verify TeamContainer is available
        if (typeof window.TeamContainer !== 'function') {
            console.error("[TeamDisplayManager] TeamContainer class not found");
        }
        
        // Initialize component tracking
        this.components = {};
        this.playerTeamContainer = null;
        this.enemyTeamContainer = null;
        this.turnIndicator = null;
        
        console.log("[TeamDisplayManager] Initialized");
    }
    
    /**
     * Initialize teams and turn indicator
     * @returns {boolean} - Success status
     */
    initialize() {
        try {
            // Create turn indicator first
            this.createTurnIndicator();
            
            // Create team containers
            const success = this.createTeams();
            
            return success;
        } catch (error) {
            console.error("[TeamDisplayManager] Error during initialization:", error);
            return false;
        }
    }
    
    /**
     * Create turn indicator
     */
    createTurnIndicator() {
        try {
            // Check if the indicator already exists and destroy it
            if (this.turnIndicator) {
                this.turnIndicator.destroy();
            }
            
            // Create a new turn indicator using the TurnIndicator class
            console.log("[TeamDisplayManager] Creating turn indicator");
            
            if (typeof window.TurnIndicator === 'function') {
                this.turnIndicator = new window.TurnIndicator(this.scene);
                this.turnIndicator.setDepth(10); // Set above characters but below UI
                
                // Track for cleanup
                this.components.turnIndicator = this.turnIndicator;
                console.log("[TeamDisplayManager] TurnIndicator instance created successfully");
            } else {
                console.error("[TeamDisplayManager] TurnIndicator class not found! Creating fallback.");
                
                // Create a fallback graphics object if TurnIndicator class is not available
                this.turnIndicator = this.scene.add.graphics();
                this.turnIndicator.setDepth(10);
                
                // Add minimal showAt method for compatibility
                this.turnIndicator.showAt = (x, y, color, duration) => {
                    console.warn("[TeamDisplayManager] Using fallback showAt method");
                    this.turnIndicator.clear();
                    this.turnIndicator.setPosition(x, y);
                    this.turnIndicator.fillStyle(color, 0.7);
                    this.turnIndicator.fillEllipse(0, 0, 32, 16);
                    this.turnIndicator.setAlpha(0.7);
                };
                
                // Add hide method for compatibility
                this.turnIndicator.hide = (duration) => {
                    this.turnIndicator.clear();
                    this.turnIndicator.setAlpha(0);
                };
            }
            
            console.log("[TeamDisplayManager] Turn indicator created");
            return true;
        } catch (error) {
            console.error("[TeamDisplayManager] Error creating turn indicator:", error);
            return false;
        }
    }
    
    /**
     * Create team containers for both player and enemy teams
     * @returns {boolean} - Success status
     */
    createTeams() {
        try {
            // --- Player Team Creation ---
            try {
                console.log(`[TeamDisplayManager] Creating player team container with ${this.playerTeam.length || 0} characters.`);
                if (!this.playerTeam || this.playerTeam.length === 0) {
                    console.warn('[TeamDisplayManager] Player team data is empty or missing!');
                    this.playerTeam = []; // Ensure it's an array
                }
                
                this.playerTeamContainer = new window.TeamContainer(
                    this.scene,
                    this.playerTeam,
                    true, // isPlayerTeam
                    { x: 800, y: 600 } // Correct position from original BattleScene
                );
                
                // Track for cleanup
                this.components.playerTeamContainer = this.playerTeamContainer;
                console.log('[TeamDisplayManager] Player team container created successfully.');
            } catch (error) {
                console.error('[TeamDisplayManager] ERROR creating PLAYER TeamContainer:', error);
                this.playerTeamContainer = null;
                return false;
            }

            // --- Enemy Team Creation ---
            try {
                console.log(`[TeamDisplayManager] Creating enemy team container with ${this.enemyTeam.length || 0} characters.`);
                if (!this.enemyTeam || this.enemyTeam.length === 0) {
                    console.warn('[TeamDisplayManager] Enemy team data is empty or missing!');
                    this.enemyTeam = []; // Ensure it's an array
                }
                
                this.enemyTeamContainer = new window.TeamContainer(
                    this.scene,
                    this.enemyTeam,
                    false, // not player team
                    { x: 1200, y: 600 } // Correct position from original BattleScene
                );
                
                // Track for cleanup
                this.components.enemyTeamContainer = this.enemyTeamContainer;
                console.log('[TeamDisplayManager] Enemy team container created successfully.');
            } catch (error) {
                console.error('[TeamDisplayManager] ERROR creating ENEMY TeamContainer:', error);
                this.enemyTeamContainer = null;
                return false;
            }
            
            return true; // Success
        } catch (error) {
            console.error('[TeamDisplayManager] Critical error in createTeams:', error);
            return false;
        }
    }
    
    /**
     * Update active character visuals
     * @param {Object} characterData - Active character data
     * @returns {boolean} - Success status
     */
    updateActiveCharacterVisuals(characterData) {
        if (!characterData) {
            console.warn("[TeamDisplayManager] updateActiveCharacterVisuals: Missing character data");
            return false;
        }
        
        try {
            console.log(`TDM.updateActiveCharacterVisuals: Called for Turn Highlighting. Character: ${characterData.name}`);
            
            // Clear previous highlighting in all teams
            console.log(`TDM.updateActiveCharacterVisuals: Attempting to clear indicators on TeamContainers.`);
            if (this.playerTeamContainer) {
                this.playerTeamContainer.clearAllHighlights();
            }
            
            if (this.enemyTeamContainer) {
                this.enemyTeamContainer.clearAllHighlights();
            }
            
            // Find the correct sprite based on character data
            const sprite = this.getCharacterSprite(characterData);
            
            if (!sprite) {
                console.warn("[TeamDisplayManager] Could not find sprite for active character:", 
                    characterData.name || characterData.id || "unknown");
                return false;
            }
            
            console.log(`TDM.updateActiveCharacterVisuals: Attempting showTurnIndicator on ${characterData.team} TeamContainer for character ${characterData.name || characterData.id}.`);
            
            // Show character highlight
            sprite.highlight();
            
            // Update the turn indicator at sprite position
            this.updateTurnIndicator(sprite);
            
            console.log(`[TeamDisplayManager] Updated visuals for ${characterData.name}`);
            return true;
        } catch (error) {
            console.error("[TeamDisplayManager] Error updating active character visuals:", error);
            return false;
        }
    }
    
    /**
     * Update turn indicator position and visibility
     * @param {CharacterSprite} sprite - The active character sprite
     * @private
     */
    updateTurnIndicator(sprite) {
        if (!this.turnIndicator || !sprite) {
            console.warn("[TeamDisplayManager] updateTurnIndicator: Missing turnIndicator or sprite");
            return;
        }
        
        try {
            console.log(`[TeamDisplayManager] Updating turn indicator for ${sprite.character?.name}`);
            
            // Get global position by combining team container position with sprite position
            let xPos = 0, yPos = 0;
            
            if (sprite.container && sprite.character) {
                // Get the team container
                const teamContainer = sprite.character.team === 'player' 
                    ? this.playerTeamContainer 
                    : this.enemyTeamContainer;
                
                if (teamContainer && teamContainer.container) {
                    // Combine team container position with sprite local position
                    xPos = teamContainer.container.x + sprite.container.x;
                    yPos = teamContainer.container.y + sprite.container.y;
                    
                    console.log(`[TeamDisplayManager] Global position calculated: ${xPos}, ${yPos}`);
                } else {
                    console.warn("[TeamDisplayManager] Team container not found for sprite");
                    
                    // Fallback to local position if team container not found
                    if (sprite.container) {
                        xPos = sprite.container.x;
                        yPos = sprite.container.y;
                    }
                }
            }
            
            // Use getBottomCenterPosition if available - apply on global coords
            if (typeof sprite.getBottomCenterPosition === 'function') {
                try {
                    const pos = sprite.getBottomCenterPosition();
                    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
                        // Get the team container for offset
                        const teamContainer = sprite.character?.team === 'player' 
                            ? this.playerTeamContainer 
                            : this.enemyTeamContainer;
                            
                        if (teamContainer && teamContainer.container) {
                            // Add team container offset to the bottom center position
                            xPos = teamContainer.container.x + pos.x;
                            yPos = teamContainer.container.y + pos.y;
                        }
                    }
                } catch (posError) {
                    console.warn("[TeamDisplayManager] Error getting sprite position:", posError);
                }
            }
            
            // Add offset for better visual placement
            yPos += 40;
            
            // Determine color based on team
            const isPlayerTeam = sprite.character?.team === 'player';
            const color = isPlayerTeam ? 0x3498db : 0xe74c3c; // Blue for player, red for enemy
            
            // Get battle speed multiplier (if available)
            const speedMultiplier = this.scene.battleManager?.speedMultiplier || 1;
            
            // Define base animation duration and adjust for battle speed
            const baseFadeDuration = 250;
            const fadeDuration = baseFadeDuration / speedMultiplier;
            
            // Use the turnIndicator's showAt method
            console.log(`[TeamDisplayManager] Showing turn indicator at position ${xPos},${yPos}`);
            this.turnIndicator.showAt(xPos, yPos, color, fadeDuration);
            
            console.log(`[TeamDisplayManager] Turn indicator updated for ${sprite.character?.name} at position: ${xPos},${yPos}`);
        } catch (error) {
            console.error("[TeamDisplayManager] Error updating turn indicator:", error);
        }
    }
    
    /**
     * Get team data (deep copied)
     * @param {string} teamType - 'player' or 'enemy'
     * @returns {Array} - Copy of team data
     */
    getTeamData(teamType) {
        try {
            let sourceTeam = null;
            
            if (teamType === 'player') {
                sourceTeam = this.playerTeam;
            } else if (teamType === 'enemy') {
                sourceTeam = this.enemyTeam;
            } else {
                console.warn("[TeamDisplayManager] Invalid team type requested:", teamType);
                return [];
            }
            
            // Return a deep copy to prevent unintended modifications
            return JSON.parse(JSON.stringify(sourceTeam || []));
        } catch (error) {
            console.error("[TeamDisplayManager] Error getting team data:", error);
            return [];
        }
    }
    
    /**
     * Get a character sprite by character data
     * @param {Object} character - Character data object
     * @returns {CharacterSprite} - Character sprite or null
     */
    getCharacterSprite(character) {
        if (!character) {
            console.warn("[TeamDisplayManager] getCharacterSprite: Missing character data");
            return null;
        }
        
        try {
            // Determine which team container to use
            let container = null;
            
            // Check if the character has a team property
            if (character.team === 'player') {
                container = this.playerTeamContainer;
            } else if (character.team === 'enemy') {
                container = this.enemyTeamContainer;
            } else {
                // If no team property, try both containers
                if (this.playerTeamContainer && this.playerTeamContainer.findCharacterSprite(character)) {
                    container = this.playerTeamContainer;
                } else if (this.enemyTeamContainer && this.enemyTeamContainer.findCharacterSprite(character)) {
                    container = this.enemyTeamContainer;
                }
            }
            
            // Check if we found a valid container
            if (!container) {
                console.warn("[TeamDisplayManager] Could not determine team container for character:", 
                    character.name || character.id || "unknown");
                return null;
            }
            
            // Make sure the container has the findCharacterSprite method
            if (typeof container.findCharacterSprite !== 'function') {
                console.error("[TeamDisplayManager] TeamContainer missing findCharacterSprite method");
                return null;
            }
            
            // Find the character sprite
            const sprite = container.findCharacterSprite(character);
            
            if (!sprite) {
                console.warn("[TeamDisplayManager] Character sprite not found in team container:", 
                    character.name || character.id || "unknown");
            }
            
            return sprite;
        } catch (error) {
            console.error("[TeamDisplayManager] Error getting character sprite:", error);
            return null;
        }
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        try {
            console.log("[TeamDisplayManager] Cleaning up team components...");
            
            // Clean up turn indicator tween
            if (this.turnIndicatorTween) {
                try {
                    this.turnIndicatorTween.remove();
                    this.turnIndicatorTween = null;
                } catch (error) {
                    console.error("[TeamDisplayManager] Error removing turn indicator tween:", error);
                }
            }
            
            // Clean up turn indicator
            if (this.turnIndicator) {
                try {
                    this.turnIndicator.destroy();
                    this.turnIndicator = null;
                } catch (error) {
                    console.error("[TeamDisplayManager] Error destroying turn indicator:", error);
                }
            }
            
            // Clean up team containers
            if (this.playerTeamContainer) {
                try {
                    this.playerTeamContainer.destroy();
                    this.playerTeamContainer = null;
                } catch (error) {
                    console.error("[TeamDisplayManager] Error destroying player team container:", error);
                }
            }
            
            if (this.enemyTeamContainer) {
                try {
                    this.enemyTeamContainer.destroy();
                    this.enemyTeamContainer = null;
                } catch (error) {
                    console.error("[TeamDisplayManager] Error destroying enemy team container:", error);
                }
            }
            
            // Clear all component references
            this.components = {};
            
            console.log("[TeamDisplayManager] Team components cleaned up successfully");
        } catch (error) {
            console.error("[TeamDisplayManager] Error during team component cleanup:", error);
        }
    }
}

// Make component available globally
if (typeof window !== 'undefined') {
    window.TeamDisplayManager = TeamDisplayManager;
    console.log("TeamDisplayManager loaded and registered globally");
}
