/**
 * BattleEventDispatcher.js
 * Handles dispatching battle events to UI and other systems
 * Version 0.5.28.1 - Initial implementation
 */

class BattleEventDispatcher {
    /**
     * Create a new Battle Event Dispatcher
     * @param {Object} battleManager - The main battle manager
     */
    constructor(battleManager) {
        this.battleManager = battleManager;
        this.initialized = false;
        this.eventListeners = new Map(); // Store custom event listeners
        
        // Reference to battleBridge event types
        this.eventTypes = window.battleBridge?.eventTypes || this.getDefaultEventTypes();
        
        // Verify battleBridge availability
        if (window.battleBridge) {
            this.initialized = true;
            console.log("[BattleEventDispatcher] Initialized with battleBridge");
        } else {
            console.warn("[BattleEventDispatcher] battleBridge not found - events may not dispatch correctly");
        }
    }

    /**
     * Get default event types if battleBridge is not available
     * @returns {Object} Default event type constants
     */
    getDefaultEventTypes() {
        return {
            BATTLE_INITIALIZED: 'battle_initialized',
            BATTLE_STARTED: 'battle_started',
            BATTLE_ENDED: 'battle_ended',
            TURN_STARTED: 'turn_started',
            TURN_ENDED: 'turn_ended',
            CHARACTER_ACTION: 'character_action',
            CHARACTER_DAMAGED: 'character_damaged',
            CHARACTER_HEALED: 'character_healed',
            CHARACTER_DEFEATED: 'character_defeated',
            STATUS_EFFECT_APPLIED: 'status_effect_applied',
            STATUS_EFFECT_REMOVED: 'status_effect_removed',
            STATUS_EFFECT_UPDATED: 'status_effect_updated',
            STATUS_EFFECTS_CHANGED: 'status_effects_changed',
            ABILITY_USED: 'ability_used',
            PASSIVE_TRIGGERED: 'passive_triggered',
            BATTLE_UI_INTERACTION: 'battle_ui_interaction',
            BATTLE_LOG: 'battle_log'
        };
    }

    /**
     * Dispatch a battle event
     * @param {string} eventType - The type of event
     * @param {Object} eventData - The event data
     * @returns {boolean} True if dispatched successfully
     */
    dispatchEvent(eventType, eventData) {
        // Parameter validation
        if (!eventType) {
            console.error("[BattleEventDispatcher] Invalid event type: null or undefined");
            return false;
        }
        
        if (!eventData || typeof eventData !== 'object') {
            console.warn("[BattleEventDispatcher] Event data should be an object, using empty object instead");
            eventData = {};
        }
        
        // Console logging for debugging
        console.log(`[BattleEventDispatcher] Dispatching ${eventType}`);
        
        // First, notify custom listeners
        this.notifyListeners(eventType, eventData);
        
        // Then dispatch via battleBridge if available
        if (window.battleBridge) {
            try {
                window.battleBridge.dispatchEvent(eventType, eventData);
                return true;
            } catch (error) {
                console.error(`[BattleEventDispatcher] Error dispatching ${eventType} via battleBridge:`, error);
            }
        }
        
        return false;
    }

    /**
     * Add an event handler for a specific event type
     * @param {string} eventType - The type of event to listen for
     * @param {Function} handler - The handler function
     * @returns {boolean} True if handler was added successfully
     */
    addEventHandler(eventType, handler) {
        if (!eventType || typeof handler !== 'function') {
            console.error("[BattleEventDispatcher] Invalid eventType or handler");
            return false;
        }
        
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        
        this.eventListeners.get(eventType).push(handler);
        return true;
    }

    /**
     * Remove an event handler
     * @param {string} eventType - The type of event
     * @param {Function} handler - The handler function to remove
     * @returns {boolean} True if handler was removed successfully
     */
    removeEventHandler(eventType, handler) {
        if (!eventType || !this.eventListeners.has(eventType)) {
            return false;
        }
        
        const listeners = this.eventListeners.get(eventType);
        const index = listeners.indexOf(handler);
        
        if (index !== -1) {
            listeners.splice(index, 1);
            return true;
        }
        
        return false;
    }

    /**
     * Notify all listeners for a specific event type
     * @param {string} eventType - The type of event
     * @param {Object} eventData - The event data
     */
    notifyListeners(eventType, eventData) {
        if (!this.eventListeners.has(eventType)) {
            return;
        }
        
        const listeners = this.eventListeners.get(eventType);
        listeners.forEach(handler => {
            try {
                handler(eventData);
            } catch (error) {
                console.error(`[BattleEventDispatcher] Error in event handler for ${eventType}:`, error);
            }
        });
    }

    /**
     * Dispatch a battle log message event
     * @param {string} message - The log message
     * @param {string} type - The message type (default, warning, error, etc.)
     * @returns {boolean} True if dispatched successfully
     */
    dispatchBattleLogEvent(message, type = 'default') {
        return this.dispatchEvent(this.eventTypes.BATTLE_LOG || 'battle_log', {
            message,
            type
        });
    }

    /**
     * Dispatch a character damaged event
     * @param {Object} target - The damaged character
     * @param {number} amount - The damage amount
     * @param {Object} source - The damage source
     * @param {Object} ability - The ability used
     * @returns {boolean} True if dispatched successfully
     */
    dispatchCharacterDamagedEvent(target, amount, source = null, ability = null) {
        // Validate parameters
        if (!target) {
            console.error("[BattleEventDispatcher] Cannot dispatch CHARACTER_DAMAGED: target is missing");
            return false;
        }
        
        if (typeof amount !== 'number' || isNaN(amount)) {
            console.warn("[BattleEventDispatcher] Invalid damage amount:", amount);
            amount = 0;
        }
        
        // Create a standardized event with both property naming patterns
        return this.dispatchEvent(this.eventTypes.CHARACTER_DAMAGED || 'character_damaged', {
            character: target, // Primary standardized property
            target: target,    // Backward compatibility
            newHealth: target.currentHp,
            maxHealth: target.stats?.hp || 100,
            amount,
            source,
            ability
        });
    }

    /**
     * Dispatch a character healed event
     * @param {Object} target - The healed character
     * @param {number} amount - The healing amount
     * @param {Object} source - The healing source
     * @param {Object} ability - The ability used
     * @returns {boolean} True if dispatched successfully
     */
    dispatchCharacterHealedEvent(target, amount, source = null, ability = null) {
        // Validate parameters
        if (!target) {
            console.error("[BattleEventDispatcher] Cannot dispatch CHARACTER_HEALED: target is missing");
            return false;
        }
        
        if (typeof amount !== 'number' || isNaN(amount)) {
            console.warn("[BattleEventDispatcher] Invalid healing amount:", amount);
            amount = 0;
        }
        
        // Create a standardized event with both property naming patterns
        return this.dispatchEvent(this.eventTypes.CHARACTER_HEALED || 'character_healed', {
            character: target, // Primary standardized property
            target: target,    // Backward compatibility
            newHealth: target.currentHp,
            maxHealth: target.stats?.hp || 100,
            amount,
            source,
            ability
        });
    }

    /**
     * Dispatch a character action event
     * @param {Object} character - The acting character
     * @param {Object} action - The action data
     * @returns {boolean} True if dispatched successfully
     */
    dispatchCharacterActionEvent(character, action) {
        // Validate parameters
        if (!character) {
            console.error("[BattleEventDispatcher] Cannot dispatch CHARACTER_ACTION: character is missing");
            return false;
        }
        
        if (!action) {
            console.warn("[BattleEventDispatcher] Invalid action data, using empty object");
            action = {};
        }
        
        // Create event data
        return this.dispatchEvent(this.eventTypes.CHARACTER_ACTION || 'character_action', {
            character,
            action
        });
    }

    /**
     * Dispatch a status effect applied event
     * @param {Object} character - The affected character
     * @param {string} statusId - The status effect ID
     * @param {number} duration - The status effect duration
     * @param {number} stacks - The number of stacks
     * @param {Object} statusDefinition - The status effect definition
     * @returns {boolean} True if dispatched successfully
     */
    dispatchStatusEffectAppliedEvent(character, statusId, duration, stacks = 1, statusDefinition = null) {
        // Validate parameters
        if (!character) {
            console.error("[BattleEventDispatcher] Cannot dispatch STATUS_EFFECT_APPLIED: character is missing");
            return false;
        }
        
        if (!statusId) {
            console.error("[BattleEventDispatcher] Cannot dispatch STATUS_EFFECT_APPLIED: statusId is missing");
            return false;
        }
        
        // Create event data
        return this.dispatchEvent(this.eventTypes.STATUS_EFFECT_APPLIED || 'status_effect_applied', {
            character,
            statusId,
            duration,
            stacks,
            statusDefinition
        });
    }

    /**
     * Dispatch a status effect removed event
     * @param {Object} character - The affected character
     * @param {string} statusId - The status effect ID
     * @param {Object} statusDefinition - The status effect definition
     * @returns {boolean} True if dispatched successfully
     */
    dispatchStatusEffectRemovedEvent(character, statusId, statusDefinition = null) {
        // Validate parameters
        if (!character) {
            console.error("[BattleEventDispatcher] Cannot dispatch STATUS_EFFECT_REMOVED: character is missing");
            return false;
        }
        
        if (!statusId) {
            console.error("[BattleEventDispatcher] Cannot dispatch STATUS_EFFECT_REMOVED: statusId is missing");
            return false;
        }
        
        // Create event data
        return this.dispatchEvent(this.eventTypes.STATUS_EFFECT_REMOVED || 'status_effect_removed', {
            character,
            statusId,
            statusDefinition
        });
    }

    /**
     * Dispatch a passive triggered event
     * @param {Object} character - The character with the passive
     * @param {string} triggerType - The passive trigger type
     * @param {Object} passiveData - The passive ability data
     * @param {*} result - The result of the passive trigger
     * @returns {boolean} True if dispatched successfully
     */
    dispatchPassiveTriggeredEvent(character, triggerType, passiveData, result = null) {
        // Validate parameters
        if (!character) {
            console.error("[BattleEventDispatcher] Cannot dispatch PASSIVE_TRIGGERED: character is missing");
            return false;
        }
        
        if (!triggerType) {
            console.warn("[BattleEventDispatcher] Passive trigger type missing");
            triggerType = 'unknown';
        }
        
        // Create event data
        return this.dispatchEvent(this.eventTypes.PASSIVE_TRIGGERED || 'passive_triggered', {
            character,
            triggerType,
            passiveData,
            result
        });
    }

    /**
     * Dispatch a battle ended event
     * @param {string} winner - The winning team ('player', 'enemy', or 'draw')
     * @param {string} reason - The reason for battle end
     * @returns {boolean} True if dispatched successfully
     */
    dispatchBattleEndedEvent(winner, reason = 'standard') {
        // TEMPORARY DEBUGGING: Log entry into this method and received parameters
        console.log("[DEBUG BattleEventDispatcher] dispatchBattleEndedEvent ENTERED. Received winner:", winner, "Received reason:", reason);
        
        // Validate parameters - FIXED: Now accepts both 'victory'/'defeat' and 'player'/'enemy' values
        const validWinners = ['victory', 'defeat', 'draw', 'player', 'enemy']; // Include all acceptable terms
        if (!winner || !validWinners.includes(winner)) {
            console.warn(`[BattleEventDispatcher] Received truly invalid winner value: '${winner}', defaulting to 'draw' as a fallback. This should be investigated.`);
            winner = 'draw'; // Fallback for genuinely unknown values
        }
        
        // TEMPORARY DEBUGGING: Log about to dispatch values and stack trace
        console.log("[DEBUG BattleEventDispatcher] dispatchBattleEndedEvent ABOUT TO DISPATCH. Dispatching winner:", winner, "Dispatching reason:", reason);
        console.trace("[DEBUG BattleEventDispatcher] dispatchBattleEndedEvent dispatch point stack trace");
        
        // Create event data
        return this.dispatchEvent(this.eventTypes.BATTLE_ENDED || 'battle_ended', {
            winner,
            reason
        });
    }

    /**
     * Dispatch a turn started event
     * @param {number} turnNumber - The current turn number
     * @param {Object} currentCharacter - The character taking the turn
     * @returns {boolean} True if dispatched successfully
     */
    dispatchTurnStartedEvent(turnNumber, currentCharacter) {
        // Validate parameters
        if (!currentCharacter) {
            console.error("[BattleEventDispatcher] Cannot dispatch TURN_STARTED: currentCharacter is missing");
            return false;
        }
        
        // Create event data with both property naming patterns
        return this.dispatchEvent(this.eventTypes.TURN_STARTED || 'turn_started', {
            turnNumber,
            currentCharacter,   // Original naming
            character: currentCharacter  // Standardized naming
        });
    }
}

// Make BattleEventDispatcher available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.BattleEventDispatcher = BattleEventDispatcher;
    console.log("BattleEventDispatcher class definition loaded and exported to window.BattleEventDispatcher");
}

// Legacy global assignment for maximum compatibility
window.BattleEventDispatcher = BattleEventDispatcher;