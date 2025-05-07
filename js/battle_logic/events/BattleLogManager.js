/**
 * BattleLogManager.js
 * Manages battle log messages and formatting
 * Version 0.5.28.2 - Combined implementation and cleanup
 */

class BattleLogManager {
    /**
     * Create a new Battle Log Manager
     * @param {Object} battleManager - The main battle manager
     * @param {Object} eventDispatcher - The event dispatcher
     */
    constructor(battleManager, eventDispatcher) {
        this.battleManager = battleManager;
        this.eventDispatcher = eventDispatcher;
        
        // Validate dependencies
        if (!this.eventDispatcher) {
            console.warn("[BattleLogManager] EventDispatcher not provided, messages won't be dispatched");
        }
        
        // Initialize validation lists
        this.validTypes = ['default', 'info', 'success', 'action', 'error', 'player', 'enemy', 'status'];
        
        // Log initialization
        console.log("[BattleLogManager] Initialized");
    }

    /**
     * Log a message to the battle log
     * @param {string} message - The message to log
     * @param {string} type - The type of message (default, info, success, action, error)
     * @returns {boolean} True if logged successfully
     */
    logMessage(message, type = 'default') {
        // Parameter validation
        if (!message) {
            console.warn("[BattleLogManager] Empty message not logged");
            return false;
        }
        
        // Ensure type is valid
        if (!this.validTypes.includes(type)) {
            console.warn(`[BattleLogManager] Invalid type '${type}', defaulting to 'default'`);
            type = 'default';
        }
        
        // Log to console for debugging
        console.log(`[BattleLog ${type}]: ${message}`);
        
        // Dispatch via eventDispatcher if available
        if (this.eventDispatcher && this.eventDispatcher.dispatchBattleLogEvent) {
            return this.eventDispatcher.dispatchBattleLogEvent(message, type);
        }
        
        // Direct fallback if no eventDispatcher
        if (window.battleBridge) {
            try {
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_LOG || 'BATTLE_LOG', {
                    message: message,
                    type: type
                });
                return true;
            } catch (error) {
                console.error('[BattleLogManager] Error dispatching log message:', error);
            }
        }
        
        return false;
    }

    /**
     * Format a message with character information
     * @param {string} message - The base message
     * @param {Object} character - The character
     * @param {string} type - The message type
     * @returns {string} The formatted message
     */
    formatMessage(message, character, type = 'default') {
        // If no character provided, return original message
        if (!character) {
            return message;
        }
        
        // Add team identifier
        const teamIdentifier = character.team === 'player' ? ' (ally)' : ' (enemy)';
        return `${character.name}${teamIdentifier} ${message}`;
    }

    /**
     * Display a summary of all characters' health at the end of a turn
     * @returns {boolean} True if summary was displayed successfully
     */
    displayTurnSummary() {
        this.logMessage('------ END OF TURN SUMMARY ------', 'info');
        
        // Show player team summary
        this.logMessage('Player Team:', 'info');
        
        if (!this.battleManager || !Array.isArray(this.battleManager.playerTeam)) {
            this.logMessage('Error: Player team not available', 'error');
        } else {
            this.battleManager.playerTeam.forEach(character => {
                const status = character.isDead ? '💀 DEFEATED' : 
                              `HP: ${character.currentHp}/${character.stats.hp}`;
                const statusColor = this.determineHealthColor(character);
                this.logMessage(`  ${character.name}: ${status}`, statusColor);
            });
        }
        
        // Show enemy team summary
        this.logMessage('Enemy Team:', 'info');
        
        if (!this.battleManager || !Array.isArray(this.battleManager.enemyTeam)) {
            this.logMessage('Error: Enemy team not available', 'error');
        } else {
            this.battleManager.enemyTeam.forEach(character => {
                const status = character.isDead ? '💀 DEFEATED' : 
                              `HP: ${character.currentHp}/${character.stats.hp}`;
                const statusColor = this.determineHealthColor(character);
                this.logMessage(`  ${character.name}: ${status}`, statusColor);
            });
        }
        
        this.logMessage('--------------------------------', 'info');
        
        return true;
    }

    /**
     * Determine the color to use for health status
     * @param {Object} character - The character
     * @returns {string} The color type to use
     */
    determineHealthColor(character) {
        if (!character) return 'default';
        
        if (character.isDead) return 'error';
        
        const healthPercent = character.currentHp / character.stats.hp;
        
        if (healthPercent < 0.3) return 'error';
        if (healthPercent < 0.7) return 'action';
        return 'success';
    }
}

// Make BattleLogManager available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.BattleLogManager = BattleLogManager;
    console.log("BattleLogManager class definition loaded and exported to window.BattleLogManager");
}

// Legacy global assignment for maximum compatibility
window.BattleLogManager = BattleLogManager;
