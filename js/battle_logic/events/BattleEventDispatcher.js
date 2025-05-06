/**
 * BattleEventDispatcher.js
 * Handles dispatching battle events to UI and other systems
 */

class BattleEventDispatcher {
    /**
     * Create a new Battle Event Dispatcher
     * @param {Object} battleManager - The main battle manager
     */
    constructor(battleManager) {
        this.battleManager = battleManager;
    }

    /**
     * Dispatch a battle event
     * @param {string} eventType - The type of event
     * @param {Object} eventData - The event data
     */
    dispatchEvent(eventType, eventData) {
        console.log("[BattleEventDispatcher] dispatchEvent called - SHELL IMPLEMENTATION");
        // This will use battleBridge when implemented
        console.log(`Dispatching event: ${eventType}`, eventData);
        
        // For now, pass through to battleBridge if available
        if (window.battleBridge && this.battleManager.uiMode === "phaser") {
            window.battleBridge.dispatchEvent(eventType, eventData);
        }
    }
}

// Export for ES modules
export default BattleEventDispatcher;

// Also make available as a global for compatibility
if (typeof window !== 'undefined') {
    window.BattleEventDispatcher = BattleEventDispatcher;
}
