/**
 * PhaserDebugManager.js
 * Centralizes all debug functionality for Phaser scenes
 * @version 0.6.4.8
 */
class PhaserDebugManager {
    /**
     * @param {Phaser.Scene} scene - The scene to attach debug tools to
     * @param {Object} config - Configuration options
     */
    constructor(scene, config = {}) {
        if (!scene) {
            console.error("[PhaserDebugManager] Missing required scene reference");
            return;
        }
        
        this.scene = scene;
        
        // Configuration with defaults
        this.config = {
            enabled: config.enabled !== undefined ? config.enabled : true,
            showCoordinates: config.showCoordinates !== undefined ? config.showCoordinates : true,
            showObjectInfo: config.showObjectInfo !== undefined ? config.showObjectInfo : false
        };
        
        // Debug tools references
        this.coordinateDisplay = null;
        this.objectIdentifier = null;
        
        // State tracking
        this.initialized = false;
        
        console.log("[PhaserDebugManager] Created with config:", this.config);
    }
    
    /**
     * Initialize debug tools
     * @returns {boolean} Success state
     */
    initialize() {
        if (this.initialized) return true;
        
        try {
            if (!this.config.enabled) {
                console.log("[PhaserDebugManager] Debug tools disabled in configuration");
                return false;
            }
            
            // Initialize CoordinateDisplay if available and configured
            if (window.CoordinateDisplay && this.config.showCoordinates) {
                this.coordinateDisplay = new window.CoordinateDisplay(this.scene);
                console.log("[PhaserDebugManager] CoordinateDisplay initialized (toggle with Alt+G)");
            } else if (this.config.showCoordinates) {
                console.warn("[PhaserDebugManager] CoordinateDisplay class not found");
            }
            
            // Initialize ObjectIdentifier if available and configured
            if (window.ObjectIdentifier && this.config.showObjectInfo) {
                this.objectIdentifier = new window.ObjectIdentifier(this.scene);
                console.log("[PhaserDebugManager] ObjectIdentifier initialized");
            } else if (this.config.showObjectInfo) {
                console.warn("[PhaserDebugManager] ObjectIdentifier class not found");
            }
            
            // Make test functions available globally for debugging
            this.registerGlobalTestFunctions();
            
            this.initialized = true;
            console.log("[PhaserDebugManager] Debug tools initialized successfully");
            return true;
        } catch (error) {
            console.error("[PhaserDebugManager] Error initializing debug tools:", error);
            return false;
        }
    }
    
    /**
     * Register global test functions for console debugging
     * @private
     */
    registerGlobalTestFunctions() {
        // Make test functions available globally for debugging
        window.testHealthUpdate = this.testHealthUpdate.bind(this);
        window.testActionIndicator = this.testActionIndicator.bind(this);
        window.testTurnHighlightingDirectly = this.testTurnHighlightingDirectly.bind(this);
        
        console.log("[PhaserDebugManager] Global test functions registered: testHealthUpdate, testActionIndicator, testTurnHighlightingDirectly");
    }
    
    /**
     * Test health bar updates manually
     * @param {string} teamType - 'player' or 'enemy'
     * @param {number} characterIndex - Index of the character in the team
     * @param {number} newHealth - New health value to set
     */
    testHealthUpdate(teamType = 'player', characterIndex = 0, newHealth = 50) {
        try {
            // Require a reference to the scene
            if (!this.scene) {
                console.error("[PhaserDebugManager] Cannot test health update - missing scene reference");
                return;
            }
            
            // Get the appropriate team container
            const teamContainer = teamType === 'player' ? 
                this.scene.playerTeamContainer : 
                this.scene.enemyTeamContainer;
                
            if (!teamContainer) {
                console.error(`[PhaserDebugManager] testHealthUpdate: ${teamType} team container not found`);
                return;
            }
            
            // Get the character array for reference values
            const characterArray = teamType === 'player' ? 
                this.scene.playerTeam : 
                this.scene.enemyTeam;
                
            if (!characterArray || characterArray.length === 0) {
                console.error(`[PhaserDebugManager] testHealthUpdate: ${teamType} team array is empty`);
                return;
            }
            
            // Validate characterIndex
            if (characterIndex < 0 || characterIndex >= characterArray.length) {
                console.error(`[PhaserDebugManager] testHealthUpdate: Invalid character index ${characterIndex} for ${teamType} team`);
                return;
            }
            
            // Get character data
            const character = characterArray[characterIndex];
            const maxHealth = character.stats.hp || 100;
            
            // Update character's health in data structure
            character.currentHp = newHealth;
            
            // Create mock event data
            const mockEventData = {
                character: character,
                newHealth: newHealth,
                amount: character.currentHp - newHealth // Simulated damage/healing amount
            };
            
            // Attempt to dispatch through battleBridge if available
            if (this.scene.battleBridge && this.scene.eventManager) {
                const eventType = newHealth < character.currentHp ? 
                    this.scene.battleBridge.eventTypes.CHARACTER_DAMAGED : 
                    this.scene.battleBridge.eventTypes.CHARACTER_HEALED;
                
                this.scene.battleBridge.dispatchEvent(eventType, mockEventData);
                
                console.log(`[PhaserDebugManager] testHealthUpdate: Event dispatched for ${character.name}'s health to ${newHealth}/${maxHealth}`);
            } 
            // Otherwise try to update the visual directly through teamContainer
            else if (teamContainer && typeof teamContainer.updateCharacterHealth === 'function') {
                teamContainer.updateCharacterHealth(character.name, newHealth, maxHealth);
                console.log(`[PhaserDebugManager] testHealthUpdate: Directly updated ${character.name}'s health to ${newHealth}/${maxHealth}`);
            } else {
                console.warn(`[PhaserDebugManager] testHealthUpdate: Could not update ${character.name}'s health - no valid update method found`);
            }
        } catch (error) {
            console.error(`[PhaserDebugManager] testHealthUpdate: Error:`, error);
        }
    }
    
    /**
     * Test action indicator manually
     * @param {string} teamType - 'player' or 'enemy'
     * @param {number} characterIndex - Index of the character in the team
     * @param {string} actionText - Action text to display
     */
    testActionIndicator(teamType = 'player', characterIndex = 0, actionText = 'Test Action') {
        try {
            // Require a reference to the scene
            if (!this.scene) {
                console.error("[PhaserDebugManager] Cannot test action indicator - missing scene reference");
                return;
            }
            
            // Get the appropriate team container
            const teamContainer = teamType === 'player' ? 
                this.scene.playerTeamContainer : 
                this.scene.enemyTeamContainer;
                
            if (!teamContainer) {
                console.error(`[PhaserDebugManager] testActionIndicator: ${teamType} team container not found`);
                return;
            }
            
            // Get the character array for reference
            const characterArray = teamType === 'player' ? 
                this.scene.playerTeam : 
                this.scene.enemyTeam;
                
            if (!characterArray || characterArray.length === 0) {
                console.error(`[PhaserDebugManager] testActionIndicator: ${teamType} team array is empty`);
                return;
            }
            
            // Validate characterIndex
            if (characterIndex < 0 || characterIndex >= characterArray.length) {
                console.error(`[PhaserDebugManager] testActionIndicator: Invalid character index ${characterIndex} for ${teamType} team`);
                return;
            }
            
            // Get character data
            const character = characterArray[characterIndex];
            
            // Get character sprite
            const characterSprite = teamContainer.getCharacterSpriteByName(character.name);
            if (!characterSprite) {
                console.error(`[PhaserDebugManager] testActionIndicator: Could not find sprite for ${character.name}`);
                return;
            }
            
            // Show action text
            characterSprite.showActionText(actionText);
            
            console.log(`[PhaserDebugManager] testActionIndicator: Showed '${actionText}' for ${character.name} (${teamType} team)`);
        } catch (error) {
            console.error(`[PhaserDebugManager] testActionIndicator: Error:`, error);
        }
    }
    
    /**
     * Test turn highlighting directly
     */
    testTurnHighlightingDirectly() {
        try {
            // Require a reference to the scene
            if (!this.scene) {
                console.error("[PhaserDebugManager] Cannot test turn highlighting - missing scene reference");
                return;
            }
            
            console.log("[PhaserDebugManager] MANUAL TEST: Testing turn highlighting directly (bypassing events)");
            
            // First try through TeamDisplayManager if available
            if (this.scene.teamManager) {
                // Get the first character from player team as a test subject
                const testCharacter = this.scene.playerTeam && this.scene.playerTeam.length > 0 ? 
                    this.scene.playerTeam[0] : null;
                    
                if (!testCharacter) {
                    console.warn('[PhaserDebugManager] MANUAL TEST: No test character available');
                    return;
                }
                
                console.log(`[PhaserDebugManager] MANUAL TEST: Using test character ${testCharacter.name}`);
                
                // Use TeamDisplayManager to update visuals
                if (typeof this.scene.teamManager.updateActiveCharacterVisuals === 'function') {
                    console.log('[PhaserDebugManager] MANUAL TEST: Using TeamDisplayManager.updateActiveCharacterVisuals directly');
                    this.scene.teamManager.updateActiveCharacterVisuals(testCharacter);
                }
                
                // Try to show action text through character sprite
                const sprite = this.scene.teamManager.getCharacterSprite(testCharacter);
                if (sprite && typeof sprite.showActionText === 'function') {
                    console.log('[PhaserDebugManager] MANUAL TEST: Using CharacterSprite.showActionText directly');
                    sprite.showActionText('TEST ACTION (Direct)');
                } else {
                    console.warn('[PhaserDebugManager] MANUAL TEST: Could not find sprite or sprite.showActionText method');
                }
            }
            // Otherwise fall back to legacy method if available
            else if (typeof this.scene.updateActiveCharacterVisuals === 'function') {
                // Get the first character from player team as a test subject
                const testCharacter = this.scene.playerTeam && this.scene.playerTeam.length > 0 ? 
                    this.scene.playerTeam[0] : null;
                    
                if (!testCharacter) {
                    console.warn('[PhaserDebugManager] MANUAL TEST: No test character available');
                    return;
                }
                
                console.log(`[PhaserDebugManager] MANUAL TEST: Using test character ${testCharacter.name} with legacy method`);
                
                // Use legacy method to update visuals
                this.scene.updateActiveCharacterVisuals(testCharacter);
            } else {
                console.error('[PhaserDebugManager] MANUAL TEST: No valid method found to test turn highlighting');
            }
        } catch (error) {
            console.error('[PhaserDebugManager] Error in testTurnHighlightingDirectly:', error);
        }
    }
    
    /**
     * Clean up debug tools
     */
    cleanup() {
        try {
            if (this.coordinateDisplay && typeof this.coordinateDisplay.destroy === 'function') {
                this.coordinateDisplay.destroy();
                this.coordinateDisplay = null;
                console.log("[PhaserDebugManager] CoordinateDisplay destroyed");
            }
            
            if (this.objectIdentifier && typeof this.objectIdentifier.destroy === 'function') {
                this.objectIdentifier.destroy();
                this.objectIdentifier = null;
                console.log("[PhaserDebugManager] ObjectIdentifier destroyed");
            }
            
            this.initialized = false;
        } catch (error) {
            console.error("[PhaserDebugManager] Error cleaning up debug tools:", error);
        }
    }
    
    /**
     * Toggle debug mode on/off
     * @returns {boolean} New enabled state
     */
    toggleDebug() {
        try {
            this.config.enabled = !this.config.enabled;
            
            if (this.config.enabled) {
                // Re-initialize if previously disabled
                if (!this.initialized) {
                    this.initialize();
                } else {
                    // Just update visibility of tools
                    if (this.coordinateDisplay && typeof this.coordinateDisplay.toggle === 'function') {
                        this.coordinateDisplay.toggle();
                    }
                    
                    if (this.objectIdentifier && typeof this.objectIdentifier.toggle === 'function') {
                        this.objectIdentifier.toggle();
                    }
                }
            } else {
                // Just hide tools, don't destroy them
                if (this.coordinateDisplay && typeof this.coordinateDisplay.toggle === 'function') {
                    this.coordinateDisplay.toggle();
                }
                
                if (this.objectIdentifier && typeof this.objectIdentifier.toggle === 'function') {
                    this.objectIdentifier.toggle();
                }
            }
            
            console.log(`[PhaserDebugManager] Debug mode ${this.config.enabled ? 'enabled' : 'disabled'}`);
            return this.config.enabled;
        } catch (error) {
            console.error("[PhaserDebugManager] Error toggling debug mode:", error);
            return this.config.enabled;
        }
    }
    
    /**
     * Destroy the manager and clean up resources
     */
    destroy() {
        try {
            this.cleanup();
            this.scene = null;
            console.log("[PhaserDebugManager] Destroyed");
        } catch (error) {
            console.error("[PhaserDebugManager] Error during destroy:", error);
        }
    }
}

// Make available globally
window.PhaserDebugManager = PhaserDebugManager;