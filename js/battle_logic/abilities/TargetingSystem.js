/**
 * TargetingSystem.js
 * Handles target selection for abilities and attacks
 * Version 0.5.26.3_Hotfix - Fixed API mismatch with battleBehaviors.selectTarget
 */

class TargetingSystem {
    /**
     * Create a new Targeting System
     * @param {Object} battleManager - The main battle manager
     */
    constructor(battleManager) {
        this.battleManager = battleManager;
        
        // Log initialization with version info
        console.log("[TargetingSystem] Version 0.5.26.3_Hotfix - Initializing TargetingSystem component");
    }

    /**
     * Select a target for an ability
     * @param {Object} actor - The actor performing the ability
     * @param {Object} ability - The ability being used
     * @param {Array} potentialTargets - Array of potential targets
     * @returns {Object|Array} Selected target(s)
     */
    selectTarget(actor, ability, potentialTargets) {
        // 1. Defensive parameter validation
        if (!actor) {
            console.error("[TargetingSystem] Cannot select target for undefined actor");
            return null;
        }
        
        if (!potentialTargets || !Array.isArray(potentialTargets) || potentialTargets.length === 0) {
            console.warn(`[TargetingSystem] No valid targets available for ${actor.name}`);
            return null;
        }
        
        // 2. Determine the appropriate targeting behavior
        const targetingBehavior = this.resolveTargetingBehavior(actor, ability);
        
        // 3. Create targeting context
        const targetingContext = this.createTargetingContext(actor, ability, potentialTargets);
        
        // 4. Execute targeting behavior
        try {
            if (!this.battleManager.battleBehaviors) {
                console.error("[TargetingSystem] BattleBehaviors not available!");
                // Fallback to simple random enemy targeting
                return this.fallbackTargeting(actor, potentialTargets);
            }
            
            // HOTFIX: Use selectTarget method instead of executeTargetingBehavior
            // This fixes the API mismatch with BattleBehaviors system
            const target = this.battleManager.battleBehaviors.selectTarget(
                targetingBehavior, 
                targetingContext
            );
            
            // 5. Process targeting result
            return this.processTargetingResult(target, actor, ability);
            
        } catch (error) {
            console.error(`[TargetingSystem] Error executing targeting behavior '${targetingBehavior}':`, error);
            // Fallback to simple targeting
            return this.fallbackTargeting(actor, potentialTargets);
        }
    }
    
    /**
     * Determine which targeting behavior to use based on the actor and ability
     * @param {Object} actor - The actor performing the ability
     * @param {Object} ability - The ability being used
     * @returns {string} The targeting behavior to use
     */
    resolveTargetingBehavior(actor, ability) {
        if (!this.battleManager.battleBehaviors) {
            return 'targetRandomEnemy'; // Default behavior
        }
        
        // 1. Check if ability has explicit targeting logic
        if (ability && ability.targetingLogic) {
            return ability.targetingLogic;
        }
        
        // 2. Use type-based targeting if specified
        if (ability && ability.targetType) {
            const typeBehavior = this.battleManager.battleBehaviors.getTargetingBehaviorFromType(ability.targetType);
            if (typeBehavior) {
                return typeBehavior;
            }
        }
        
        // 3. Use smart targeting based on ability properties
        if (ability) {
            // Healing abilities target allies by default
            if (ability.isHealing || ability.damageType === 'healing') {
                return 'targetLowestHpAlly';
            }
            
            // Utility abilities (buffs) often target self
            if (ability.damageType === 'utility') {
                return 'targetSelf';
            }
            
            // AoE abilities use appropriate multi-target behavior
            if (ability.isAoE || ability.targetType === 'AllEnemies') {
                return 'targetAllEnemies';
            }
        }
        
        // 4. Fall back to default targeting behavior
        return this.battleManager.battleBehaviors.getDefaultTargetingBehavior() || 'targetRandomEnemy';
    }
    
    /**
     * Create a targeting context for the behavior system
     * @param {Object} actor - The actor performing the ability
     * @param {Object} ability - The ability being used
     * @param {Array} potentialTargets - Array of potential targets
     * @returns {Object} The targeting context
     */
    createTargetingContext(actor, ability, potentialTargets) {
        // Filter for living targets only
        const livingTargets = potentialTargets.filter(target => {
            return target && target.currentHp > 0 && !target.isDead;
        });
        
        // Create standard context object expected by targeting behaviors
        return {
            actor: actor,
            potentialTargets: livingTargets,
            teamManager: this.battleManager.teamManager,
            ability: ability,
            battleManager: this.battleManager
        };
    }
    
    /**
     * Process the targeting result to handle edge cases
     * @param {Object|Array|null} target - The targeting result
     * @param {Object} actor - The actor performing the ability
     * @param {Object} ability - The ability being used
     * @returns {Object|Array|null} The processed target(s)
     */
    processTargetingResult(target, actor, ability) {
        // Handle null or undefined result
        if (!target) {
            console.warn(`[TargetingSystem] No target found for ${actor.name}'s ${ability ? ability.name : 'attack'}`);
            return null;
        }
        
        // Arrays are valid for multi-target abilities
        if (Array.isArray(target)) {
            // Filter out any invalid targets
            const validTargets = target.filter(t => t && t.currentHp > 0 && !t.isDead);
            
            if (validTargets.length === 0) {
                console.warn(`[TargetingSystem] No valid targets in multi-target selection for ${actor.name}`);
                return null;
            }
            
            return validTargets;
        }
        
        // Single target - verify it's valid
        if (target.currentHp <= 0 || target.isDead) {
            console.warn(`[TargetingSystem] Selected target ${target.name} is not valid (HP: ${target.currentHp}, isDead: ${target.isDead})`);
            return null;
        }
        
        return target;
    }
    
    /**
     * Simple fallback targeting when behavior system fails
     * @param {Object} actor - The actor performing the ability
     * @param {Array} potentialTargets - Array of potential targets
     * @returns {Object|null} A simple target selection
     */
    fallbackTargeting(actor, potentialTargets) {
        // Filter for living targets of the opposite team
        const actorTeam = actor.team;
        const opposingTeam = actorTeam === 'player' ? 'enemy' : 'player';
        
        const validTargets = potentialTargets.filter(target => {
            return target && 
                  target.currentHp > 0 && 
                  !target.isDead && 
                  target.team === opposingTeam;
        });
        
        if (validTargets.length === 0) {
            return null;
        }
        
        // Select a random target
        return validTargets[Math.floor(Math.random() * validTargets.length)];
    }
}

// Make TargetingSystem available globally for traditional scripts
if (typeof window !== 'undefined') {
  window.TargetingSystem = TargetingSystem;
  console.log("TargetingSystem class definition loaded and exported to window.TargetingSystem");
}

// Legacy global assignment for maximum compatibility
window.TargetingSystem = TargetingSystem;