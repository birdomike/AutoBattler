/**
 * fixBattleBridge.js
 * Immediate fix for the BattleBridge event registration issues
 */

(function() {
    console.log("fixBattleBridge: Starting emergency repair...");
    
    // Check if we have a battleBridge instance
    if (!window.battleBridge) {
        console.error("fixBattleBridge: No battleBridge instance found!");
        return;
    }
    
    // Define all lowercase event types that need to be registered
    const eventTypesToFix = [
        'battle_initialized',
        'battle_started',
        'battle_ended',
        'turn_started',
        'turn_ended',
        'character_action',
        'character_damaged',
        'character_healed',
        'character_defeated',
        'status_effect_applied',
        'status_effect_removed',
        'status_effect_updated',
        'ability_used',
        'passive_triggered',
        'battle_ui_interaction',
        'battle_log'
    ];
    
    // Ensure eventListeners object exists
    if (!window.battleBridge.eventListeners) {
        console.log("fixBattleBridge: Creating eventListeners object");
        window.battleBridge.eventListeners = {};
    }
    
    // Register all lowercase event types
    eventTypesToFix.forEach(eventType => {
        // Initialize the event listener array if it doesn't exist
        if (!window.battleBridge.eventListeners[eventType]) {
            console.log(`fixBattleBridge: Registering missing event type "${eventType}"`);
            window.battleBridge.eventListeners[eventType] = [];
        } else {
            console.log(`fixBattleBridge: Event type "${eventType}" already registered with ${window.battleBridge.eventListeners[eventType].length} listeners`);
        }
    });
    
    // Ensure the eventTypes object is correctly mapped to lowercase values
    if (window.battleBridge.eventTypes) {
        console.log("fixBattleBridge: Verifying eventTypes mapping...");
        Object.keys(window.battleBridge.eventTypes).forEach(key => {
            const value = window.battleBridge.eventTypes[key];
            // Make sure the value is lowercase and has an event listener array
            if (value && typeof value === 'string') {
                if (!window.battleBridge.eventListeners[value]) {
                    console.log(`fixBattleBridge: Creating missing listener array for "${value}"`);
                    window.battleBridge.eventListeners[value] = [];
                }
            }
        });
    }
    
    // Ensure addEventListener method handles unknown event types gracefully
    const originalAddEventListener = window.battleBridge.addEventListener;
    window.battleBridge.addEventListener = function(eventType, callback) {
        if (!this.eventListeners[eventType]) {
            console.log(`fixBattleBridge: Auto-registering event type "${eventType}"`);
            this.eventListeners[eventType] = [];
        }
        
        this.eventListeners[eventType].push(callback);
        console.log(`fixBattleBridge: Added listener for "${eventType}" (total: ${this.eventListeners[eventType].length})`);
        return this;
    };
    
    console.log("fixBattleBridge: Emergency repair complete!");
})();
