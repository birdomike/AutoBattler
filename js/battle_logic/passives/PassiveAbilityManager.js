/**
 * PassiveAbilityManager.js
 * Manages execution of passive abilities
 * Version 0.5.27.2_Hotfix - Enhanced character validation
 */

class PassiveAbilityManager {
    /**
     * Create a new PassiveAbilityManager
     * @param {Object} battleManager - The BattleManager instance
     * @param {Object} passiveTriggerTracker - The PassiveTriggerTracker instance
     */
    constructor(battleManager, passiveTriggerTracker) {
        this.battleManager = battleManager;
        this.passiveTriggerTracker = passiveTriggerTracker;
        
        // Log initialization
        console.log("[PassiveAbilityManager] Initializing...");
    }
    
    /**
     * Validate character has required properties for passive processing
     * @param {Object} character - The character to validate
     * @returns {boolean} True if character is valid
     */
    validateCharacter(character) {
        // Basic null check
        if (!character) {
            console.error("[PassiveAbilityManager] Invalid character parameter (null or undefined)");
            return false;
        }
        
        // Check for required properties
        if (!character.name) {
            console.error("[PassiveAbilityManager] Invalid character: missing name property");
            return false;
        }
        
        // Must have stats object for passive calculations
        if (!character.stats) {
            console.error(`[PassiveAbilityManager] Character '${character.name}' missing stats object`);
            return false;
        }
        
        // Check for health properties
        if (typeof character.currentHp !== 'number') {
            console.error(`[PassiveAbilityManager] Character '${character.name}' missing currentHp property`);
            return false;
        }
        
        // Check for passives
        if (!Array.isArray(character.passiveAbilities)) {
            // This is not necessarily an error - just no passives to process
            console.debug(`[PassiveAbilityManager] Character '${character.name}' has no passive abilities array`);
            return false;
        }
        
        // Check defeat state for early return
        if (character.isDead || character.currentHp <= 0) {
            console.debug(`[PassiveAbilityManager] Character '${character.name}' is defeated (${character.currentHp}/${character.stats.hp})`);
            return false;
        }
        
        // Check if passives array is empty
        if (character.passiveAbilities.length === 0) {
            console.debug(`[PassiveAbilityManager] Character '${character.name}' has empty passives array`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Process passive abilities for a specific trigger event
     * @param {string} trigger - The trigger event (e.g., 'onTurnStart', 'onDamageTaken')
     * @param {Object} character - The character whose passives should be checked
     * @param {Object} additionalData - Additional context data for the passive
     * @returns {Array} Array of executed passive results
     */
    processPassiveAbilities(trigger, character, additionalData = {}) {
        // Parameter validation
        if (!trigger || typeof trigger !== 'string') {
            console.error("[PassiveAbilityManager] Invalid trigger parameter:", trigger);
            return [];
        }
        
        // Enhanced character validation
        if (!this.validateCharacter(character)) {
            return [];
        }
        
        // Will store results from executed passives
        const results = [];
        
        // Check for battle behaviors
        if (!this.battleManager.battleBehaviors) {
            console.warn("[PassiveAbilityManager] Battle behaviors system not available");
            return results;
        }
        
        // Check for PassiveTriggerTracker
        if (!this.passiveTriggerTracker) {
            console.warn("[PassiveAbilityManager] PassiveTriggerTracker not available");
        }
        
        // Process each passive ability
        character.passiveAbilities.forEach(ability => {
            // Skip if ability is invalid
            if (!ability || !ability.passiveTrigger) return;
            
            // Skip if this passive has already been triggered this turn for this trigger type
            const passiveId = ability.id || ability.name;
            
            // Check if this passive has already been triggered (if tracker available)
            if (this.passiveTriggerTracker && this.passiveTriggerTracker.hasFiredThisTurn(character, passiveId, trigger)) {
                console.debug(`[PassiveAbilityManager] Skipping duplicate trigger of ${passiveId} for ${character.name}, already triggered this turn`);
                return; // Skip this passive ability
            }
            
            // Special handling for onBattleStart trigger - battle-level tracking
            if (trigger === 'onBattleStart' && this.passiveTriggerTracker && 
                this.passiveTriggerTracker.hasFiredThisBattle(character, passiveId, trigger)) {
                console.debug(`[PassiveAbilityManager] Skipping duplicate battle start trigger: ${ability.name} for ${character.name}`);
                return; // Skip this passive ability
            }
            
            // Check if this passive matches the current trigger
            if (this.canTriggerPassive(character, ability, trigger)) {
                const result = this.executePassiveBehavior(character, ability, trigger, additionalData);
                
                // If passive executed successfully
                if (result && result.executed) {
                    // Record trigger if tracker available
                    if (this.passiveTriggerTracker) {
                        this.passiveTriggerTracker.recordTrigger(character, passiveId, trigger);
                    }
                    
                    results.push(result);
                    
                    // Log passive activation message
                    this.logPassiveActivation(character, result);
                }
            }
        });
        
        return results;
    }
    
    /**
     * Check if a passive ability can trigger
     * @param {Object} character - The character
     * @param {Object} ability - The passive ability
     * @param {string} trigger - The trigger type
     * @returns {boolean} True if passive can trigger
     */
    canTriggerPassive(character, ability, trigger) {
        // Must match trigger type
        if (ability.passiveTrigger !== trigger) return false;
        
        // Must have behavior
        if (!ability.passiveBehavior) return false;
        
        // Must have behavior registered
        if (!this.battleManager.battleBehaviors.hasBehavior(ability.passiveBehavior)) return false;
        
        // Check max stacks if configured and tracker available
        if (this.passiveTriggerTracker) {
            const maxStacks = this.passiveTriggerTracker.getMaxStacksForPassive(ability);
            if (maxStacks && this.passiveTriggerTracker.hasReachedMaxStacks(character, ability.id || ability.name, trigger, maxStacks)) {
                console.debug(`[PassiveAbilityManager] ${ability.name} has reached max stacks (${maxStacks})`);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Execute a passive ability behavior
     * @param {Object} character - The character
     * @param {Object} ability - The passive ability
     * @param {string} trigger - The trigger type
     * @param {Object} additionalData - Additional data for context
     * @returns {Object|null} The result of execution or null if failed
     */
    executePassiveBehavior(character, ability, trigger, additionalData) {
        try {
            // Create context for the passive behavior
            const passiveContext = {
                actor: character,
                ability: ability,
                battleManager: this.battleManager,
                teamManager: this.battleManager.teamManager || { getCharacterTeam: (char) => char.team },
                trigger: trigger,
                additionalData: additionalData
            };
            
            // Get the behavior function name
            const behaviorName = ability.passiveBehavior;
            
            // Execute the passive behavior
            return this.battleManager.battleBehaviors.executePassiveBehavior(behaviorName, passiveContext);
        } catch (error) {
            console.error(`[PassiveAbilityManager] Error executing passive ability '${ability.name}':`, error);
            return null;
        }
    }
    
    /**
     * Log passive ability activation
     * @param {Object} character - The character
     * @param {Object} result - The execution result
     */
    logPassiveActivation(character, result) {
        if (result && result.message) {
            const teamIdentifier = character.team === 'player' ? ' (ally)' : ' (enemy)';
            this.battleManager.logMessage(`${character.name}${teamIdentifier}'s passive ability: ${result.message}`, 'action');
        }
    }
    
    /**
     * Get passives for a specific trigger type
     * @param {Object} character - The character to check
     * @param {string} trigger - The trigger type
     * @returns {Array} Matching passive abilities
     */
    getPassivesByTriggerType(character, trigger) {
        if (!character || !character.passiveAbilities || !trigger) {
            return [];
        }
        
        return character.passiveAbilities.filter(ability => 
            ability && ability.passiveTrigger === trigger
        );
    }
}

// Make PassiveAbilityManager available globally for traditional scripts
if (typeof window !== 'undefined') {
  window.PassiveAbilityManager = PassiveAbilityManager;
  console.log("PassiveAbilityManager class definition loaded and exported to window.PassiveAbilityManager");
}

// Legacy global assignment for maximum compatibility
window.PassiveAbilityManager = PassiveAbilityManager;

// Try exporting as an ES module if supported
try {
  if (typeof module !== 'undefined') {
    module.exports = PassiveAbilityManager;
  }
} catch (e) {
  console.log('ES Module export not supported in this environment');
}
