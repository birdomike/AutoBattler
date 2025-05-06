/**
 * PassiveTriggerTracker.js
 * Tracks passive ability trigger history for both turn-based and battle-wide tracking
 * Version 0.5.27.1 - Full implementation of trigger tracking system
 */

class PassiveTriggerTracker {
    /**
     * Create a new Passive Trigger Tracker
     */
    constructor() {
        this.turnTriggers = new Map(); // Tracking for current turn {key: boolean}
        this.battleTriggers = new Map(); // Tracking for entire battle {key: count}
    }

    /**
     * Reset tracking for a new turn
     * Should be called at the beginning of each turn
     */
    resetTurnTracking() {
        console.log("[PassiveTriggerTracker] Resetting turn-based tracking");
        this.turnTriggers.clear();
    }

    /**
     * Reset tracking for a new battle
     * Should be called when a new battle starts
     */
    resetBattleTracking() {
        console.log("[PassiveTriggerTracker] Resetting battle-wide tracking");
        this.turnTriggers.clear();
        this.battleTriggers.clear();
    }

    /**
     * Generate a consistent tracking key for passive triggers
     * @param {Object|string} character - Character object or character ID
     * @param {string} passiveId - Passive ability ID or name
     * @param {string} trigger - Trigger type (onTurnStart, onDamageTaken, etc.)
     * @returns {string} A unique key for this trigger
     */
    _generateTriggerKey(character, passiveId, trigger) {
        // Extract ID from character object if a full character was passed
        const characterId = typeof character === 'object' ? 
            (character.uniqueId || character.id) : character;
        
        if (!characterId || !passiveId || !trigger) {
            console.warn("[PassiveTriggerTracker] Invalid parameters for trigger key generation", {
                characterId, passiveId, trigger
            });
            // Return a placeholder key to prevent errors
            return `invalid_${Date.now()}`;
        }
        
        return `${characterId}_${passiveId}_${trigger}`;
    }

    /**
     * Check if a passive has already been triggered this turn
     * @param {Object|string} character - Character object or character ID
     * @param {string} passiveId - Passive ability ID or name
     * @param {string} trigger - Trigger type
     * @returns {boolean} True if already triggered this turn
     */
    hasFiredThisTurn(character, passiveId, trigger) {
        const key = this._generateTriggerKey(character, passiveId, trigger);
        return this.turnTriggers.has(key);
    }
    
    /**
     * Check if a passive has already been triggered this battle
     * @param {Object|string} character - Character object or character ID
     * @param {string} passiveId - Passive ability ID or name
     * @param {string} trigger - Trigger type
     * @returns {boolean} True if already triggered this battle
     */
    hasFiredThisBattle(character, passiveId, trigger) {
        const key = this._generateTriggerKey(character, passiveId, trigger);
        return this.battleTriggers.has(key);
    }

    /**
     * Record that a passive was triggered
     * @param {Object|string} character - Character object or character ID
     * @param {string} passiveId - Passive ability ID or name
     * @param {string} trigger - Trigger type
     */
    recordTrigger(character, passiveId, trigger) {
        const key = this._generateTriggerKey(character, passiveId, trigger);
        
        // Record for turn-based tracking
        this.turnTriggers.set(key, true);
        
        // Record for battle-wide tracking with count
        const currentCount = this.battleTriggers.get(key) || 0;
        this.battleTriggers.set(key, currentCount + 1);
        
        console.debug(`[PassiveTriggerTracker] Recorded trigger: ${key} (${currentCount + 1} times this battle)`);
    }
    
    /**
     * Get the number of times a passive has triggered for a character in this battle
     * @param {Object|string} character - Character object or character ID
     * @param {string} passiveId - Passive ability ID or name
     * @param {string} trigger - Trigger type
     * @returns {number} The number of times the passive has triggered
     */
    getTriggerCount(character, passiveId, trigger) {
        const key = this._generateTriggerKey(character, passiveId, trigger);
        return this.battleTriggers.get(key) || 0;
    }
    
    /**
     * Check if a passive has reached its maximum stack count
     * Some passives can only trigger a limited number of times per battle
     * @param {Object|string} character - Character object or character ID
     * @param {string} passiveId - Passive ability ID or name
     * @param {string} trigger - Trigger type
     * @param {number} maxStacks - Maximum number of triggers allowed
     * @returns {boolean} True if maximum stack count reached
     */
    hasReachedMaxStacks(character, passiveId, trigger, maxStacks) {
        if (!maxStacks || maxStacks <= 0) {
            return false; // No limit if maxStacks is not provided or invalid
        }
        
        const count = this.getTriggerCount(character, passiveId, trigger);
        return count >= maxStacks;
    }
    
    /**
     * Get the maximum number of stacks (triggers) for a passive ability
     * Based on passive ability configuration or defaults to unlimited
     * @param {Object} ability - The passive ability object
     * @returns {number|null} Maximum stacks or null for unlimited
     */
    getMaxStacksForPassive(ability) {
        if (!ability) return null;
        
        // Check for passive data configuration
        if (ability.passiveData && typeof ability.passiveData.maxTriggers === 'number') {
            return ability.passiveData.maxTriggers;
        }
        
        // Check for ability property
        if (typeof ability.maxTriggers === 'number') {
            return ability.maxTriggers;
        }
        
        // Default to unlimited (null)
        return null;
    }
}

// Make PassiveTriggerTracker available globally for traditional scripts
if (typeof window !== 'undefined') {
  window.PassiveTriggerTracker = PassiveTriggerTracker;
  console.log("PassiveTriggerTracker class definition loaded and exported to window.PassiveTriggerTracker");
}

// Legacy global assignment for maximum compatibility
window.PassiveTriggerTracker = PassiveTriggerTracker;

// Try exporting as an ES module if supported
try {
  if (typeof module !== 'undefined') {
    module.exports = PassiveTriggerTracker;
  }
} catch (e) {
  console.log('ES Module export not supported in this environment');
}
