/**
 * BattleFXManager.js
 * Manages visual effects for the battle scene
 * Centralizes non-sprite-specific visual effects like floating text and attack animations
 * @version 0.6.4.6
 */
class BattleFXManager {
    /**
     * Initialize the BattleFXManager
     * @param {Phaser.Scene} scene - The battle scene this manager belongs to
     * @param {TeamDisplayManager} teamManager - Optional reference to the TeamDisplayManager
     */
    constructor(scene, teamManager = null) {
        if (!scene) {
            console.error("[BattleFXManager] Missing required scene reference");
            return;
        }
        
        this.scene = scene;
        this.teamManager = teamManager;
        
        console.log("[BattleFXManager] Initialized");
    }
    
    /**
     * Set the TeamDisplayManager reference
     * @param {TeamDisplayManager} teamManager - The TeamDisplayManager instance
     */
    setTeamManager(teamManager) {
        this.teamManager = teamManager;
        console.log("[BattleFXManager] TeamDisplayManager reference updated");
    }
    
    /**
     * Show floating text above a character
     * @param {Object} character - Character to show text above
     * @param {string} text - Text to display
     * @param {Object} style - Text style options
     * @returns {boolean} Success indicator
     */
    showFloatingText(character, text, style = {}) {
        try {
            if (!character) {
                console.warn("[BattleFXManager] showFloatingText: Missing character data");
                return false;
            }
            
            console.log(`[BattleFXManager] Showing floating text "${text}" above ${character.name}`);
            
            // Determine which team the character belongs to
            const teamType = character.team;
            if (!teamType) {
                console.warn(`[BattleFXManager] Character ${character.name} has no team property`);
                return false;
            }
            
            // Find the character sprite through the TeamDisplayManager if available
            if (this.teamManager && typeof this.teamManager.getCharacterSprite === 'function') {
                const sprite = this.teamManager.getCharacterSprite(character);
                if (sprite) {
                    sprite.showFloatingText(text, style);
                    return true;
                } else {
                    console.warn(`[BattleFXManager] Character sprite for ${character.name} not found via TeamDisplayManager`);
                }
            }
            
            // Fallback to legacy approach if TeamDisplayManager isn't available or failed
            const teamContainer = teamType === 'player' 
                ? this.scene.playerTeamContainer 
                : this.scene.enemyTeamContainer;

            if (!teamContainer) {
                console.warn(`[BattleFXManager] Team container for ${teamType} not found`);
                return false;
            }

            const sprite = teamContainer.getCharacterSpriteByName(character.name);

            if (!sprite) {
                console.warn(`[BattleFXManager] Character sprite for ${character.name} not found via TeamContainer`);
                return false;
            }

            sprite.showFloatingText(text, style);
            return true;
        } catch (error) {
            console.error('[BattleFXManager] Error showing floating text:', error);
            return false;
        }
    }
    
    /**
     * Show attack animation between characters
     * @param {Object} attacker - Attacking character
     * @param {Object} target - Target character
     * @param {Function} onComplete - Callback when animation completes
     * @param {Object} actionContext - Context about the action being animated
     * @returns {boolean} Success indicator
     */
    showAttackAnimation(attacker, target, onComplete, actionContext) {
        try {
            if (!attacker || !target) {
                console.warn("[BattleFXManager] showAttackAnimation: Missing attacker or target");
                if (onComplete) onComplete();
                return false;
            }
            
            console.log(`[BattleFXManager] showAttackAnimation: ${attacker.name} (${attacker.team}) attacking ${target.name} (${target.team})`);

            // Validate that attacker and target are from different teams
            if (attacker.team === target.team) {
                console.warn(`[BattleFXManager] Attempted attack on same team! Attacker and target both on team ${attacker.team}`);
                if (onComplete) onComplete();
                return false;
            }

            // Try to find sprites through TeamDisplayManager first if available
            if (this.teamManager && typeof this.teamManager.getCharacterSprite === 'function') {
                const attackerSprite = this.teamManager.getCharacterSprite(attacker);
                const targetSprite = this.teamManager.getCharacterSprite(target);
                
                if (attackerSprite && targetSprite) {
                    // Create default actionContext if none is provided
                    if (!actionContext) {
                        // Try to infer the action type
                        const inferredActionType = attacker.lastUsedAbility ? 'ability' : 'autoAttack';
                        const inferredAbilityName = attacker.lastUsedAbility?.name || 'Unknown Ability';
                        
                        actionContext = {
                            actionType: inferredActionType,
                            abilityName: inferredAbilityName
                        };
                        
                        console.log(`[BattleFXManager] Created inferred actionContext:`, actionContext);
                    }
                    
                    attackerSprite.showAttackAnimation(targetSprite, onComplete, actionContext);
                    return true;
                } else {
                    console.warn(`[BattleFXManager] Could not find sprite(s) via TeamDisplayManager: ${!attackerSprite ? 'attacker' : 'target'} missing`);
                    // Fall through to legacy approach
                }
            }
            
            // Fallback to legacy approach if TeamDisplayManager isn't available or failed
            const attackerTeamContainer = attacker.team === 'player'
                ? this.scene.playerTeamContainer
                : this.scene.enemyTeamContainer;

            const targetTeamContainer = target.team === 'player'
                ? this.scene.playerTeamContainer
                : this.scene.enemyTeamContainer;

            if (!attackerTeamContainer || !targetTeamContainer) {
                console.warn(`[BattleFXManager] Missing team container(s)`);
                if (onComplete) onComplete();
                return false;
            }

            const attackerSprite = attackerTeamContainer.getCharacterSpriteByName(attacker.name);
            const targetSprite = targetTeamContainer.getCharacterSpriteByName(target.name);

            if (!attackerSprite || !targetSprite) {
                console.warn(`[BattleFXManager] Could not find sprites for ${!attackerSprite ? 'attacker' : 'target'}`);
                if (onComplete) onComplete();
                return false;
            }

            // Create default actionContext if none is provided
            if (!actionContext) {
                // Try to infer the action type
                const inferredActionType = attacker.lastUsedAbility ? 'ability' : 'autoAttack';
                const inferredAbilityName = attacker.lastUsedAbility?.name || 'Unknown Ability';
                
                actionContext = {
                    actionType: inferredActionType,
                    abilityName: inferredAbilityName
                };
                
                console.log(`[BattleFXManager] Created inferred actionContext:`, actionContext);
            }

            attackerSprite.showAttackAnimation(targetSprite, onComplete, actionContext);
            return true;
        } catch (error) {
            console.error('[BattleFXManager] Error showing attack animation:', error);
            if (onComplete) onComplete();
            return false;
        }
    }
    
    /**
     * Clean up manager resources
     */
    destroy() {
        console.log("[BattleFXManager] Cleaning up resources");
        this.scene = null;
        this.teamManager = null;
    }
}

// Make component available globally
if (typeof window !== 'undefined') {
    window.BattleFXManager = BattleFXManager;
    console.log("BattleFXManager loaded and exported to window.BattleFXManager");
}
