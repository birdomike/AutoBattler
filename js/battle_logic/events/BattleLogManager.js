/**
 * BattleLogManager.js
 * Manages battle log messages and formatting
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
    }

    /**
     * Log a message to the battle log
     * Modified in v0.5.24.5 to prevent duplicate message dispatching
     * @param {string} message - The message to log
     * @param {string} type - The type of message (default, info, success, action, error)
     */
    logMessage(message, type = 'default') {
        // Log directly to console for debugging
        console.log(`[BattleLog ${type}]: ${message}`);
        
        // Standardize type if not valid
        const validTypes = ['default', 'info', 'success', 'action', 'error', 'player', 'enemy', 'status'];
        if (!validTypes.includes(type)) {
            type = 'default';
        }
        
        // Dispatch event through BattleBridge - single source of truth for event dispatch
        if (window.battleBridge) {
            window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_LOG, {
                message: message,
                type: type
            });
        }
        
        return true;
    }

    /**
     * Display a summary of all characters' health at the end of a turn
     */
    displayTurnSummary() {
        this.logMessage('------ END OF TURN SUMMARY ------', 'info');
        
        // Show player team summary
        this.logMessage('Player Team:', 'info');
        this.battleManager.playerTeam.forEach(character => {
            const status = character.isDead ? '💀 DEFEATED' : `HP: ${character.currentHp}/${character.stats.hp}`;
            const statusColor = character.isDead ? 'error' : 
                               (character.currentHp < character.stats.hp * 0.3) ? 'error' :
                               (character.currentHp < character.stats.hp * 0.7) ? 'action' : 'success';
            this.logMessage(`  ${character.name}: ${status}`, statusColor);
        });
        
        // Show enemy team summary
        this.logMessage('Enemy Team:', 'info');
        this.battleManager.enemyTeam.forEach(character => {
            const status = character.isDead ? '💀 DEFEATED' : `HP: ${character.currentHp}/${character.stats.hp}`;
            const statusColor = character.isDead ? 'error' : 
                               (character.currentHp < character.stats.hp * 0.3) ? 'error' :
                               (character.currentHp < character.stats.hp * 0.7) ? 'action' : 'success';
            this.logMessage(`  ${character.name}: ${status}`, statusColor);
        });
        
        this.logMessage('--------------------------------', 'info');
        
        return true;
    }
}

// Export for ES modules
export default BattleLogManager;

// Also make available as a global for compatibility
if (typeof window !== 'undefined') {
    window.BattleLogManager = BattleLogManager;
}
