/**
 * HealingProcessor.js
 * Handles healing calculations and application
 * Extracted from BattleManager.js/BattleFlowController.js as part of Stage 4 refactoring
 */

class HealingProcessor {
    /**
     * Create a new Healing Processor
     * @param {Object} battleManager - The main battle manager
     */
    constructor(battleManager) {
        this.battleManager = battleManager;
        console.log('HealingProcessor initialized');
    }

    /**
     * Apply healing to a character
     * @param {Object} target - The character to heal
     * @param {number} amount - Amount of healing to apply
     * @param {Object|null} source - The character causing the healing (if any)
     * @param {Object|null} ability - The ability used (if any)
     * @param {string} healType - The type of healing
     * @returns {Object} Result containing actualHealing and revived status
     */
    applyHealing(target, amount, source, ability, healType = 'healing') {
        // TEMPORARY DEBUGGING CODE - TO BE REMOVED LATER
        console.log(`[DEBUG HealingProcessor START] Target: ${target ? target.name : 'null/undefined'}, HP: ${target ? target.currentHp : 'N/A'}. Source: ${source ? source.name : 'null/undefined'}`);
        
        if (!target) {
            console.error('[HealingProcessor] Cannot heal null target');
            return { actualHealing: 0, revived: false };
        }

        // Store if character was defeated before healing
        const wasDefeated = target.isDefeated === true;
        
        // Store original HP for comparison
        const originalHp = target.currentHp;
        
        // Calculate new HP (capped at maximum HP)
        const newHp = Math.min(target.stats.hp, target.currentHp + amount);
        
        // Calculate actual healing done
        const actualHealing = newHp - originalHp;
        
        // Apply the healing
        target.currentHp = newHp;
        
        // Determine if character was revived
        let revived = false;
        if (wasDefeated && target.currentHp > 0) {
            revived = true;
            // Note: We don't reset isDefeated here - that's handled by checkAndResetDeathStatus
        }

        // Dispatch healing event through battleBridge if available
        if (window.battleBridge && actualHealing > 0) {
            try {
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.CHARACTER_HEALED, {
                    character: target, 
                    target: target, // Include both for compatibility
                    newHealth: target.currentHp, 
                    maxHealth: target.stats.hp,
                    amount: actualHealing, 
                    source: source, 
                    ability: ability
                });
            } catch (error) {
                console.error('[HealingProcessor] Error dispatching CHARACTER_HEALED event:', error);
            }
        }

        const result = { actualHealing, revived };

        // TEMPORARY DEBUGGING CODE - TO BE REMOVED LATER
        console.log(`[DEBUG HealingProcessor END] Target: ${target ? target.name : 'null/undefined'}, HP: ${target ? target.currentHp : 'N/A'}. Source: ${source ? source.name : 'null/undefined'}`);
        console.log('[DEBUG HealingProcessor END] Returning result:', JSON.stringify(result));
        
        return result;
    }

    /**
     * Check if a character should be revived and reset their death state
     * @param {Object} character - The character to check
     * @returns {boolean} True if character was revived
     */
    checkAndResetDeathStatus(character) {
        if (!character) return false;
        
        // If character is marked as defeated but has health, resurrect them
        if (character.isDefeated && character.currentHp > 0) {
            character.isDefeated = false;
            
            // Add team identifier for clarity in log message
            const teamIdentifier = character.team === 'player' ? ' (ally)' : ' (enemy)';
            this.battleManager.logMessage(`${character.name}${teamIdentifier} has been revived!`, 'success');
            
            return true; // Character was revived
        }
        return false; // No revival occurred
    }
}

// Make HealingProcessor available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.HealingProcessor = HealingProcessor;
    console.log("HealingProcessor class definition loaded and exported to window.HealingProcessor");
}

// Legacy global assignment for maximum compatibility 
window.HealingProcessor = HealingProcessor;
