/**
 * BattleLogTester.js
 * Utility for testing the Battle Log functionality
 */

// Create a global testing utility
window.testBattleLog = function(message, type = 'info') {
    console.log(`Sending test message to battle log: ${message}`);
    
    if (window.battleBridge) {
        window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_LOG, {
            message: message,
            type: type
        });
        return true;
    } else {
        console.error('BattleBridge not available for testing');
        return false;
    }
};

// Create a function to test direct message addition
window.addDirectBattleLogMessage = function(message, type = 'info') {
    console.log(`Adding message directly to battle log: ${message}`);
    
    if (window.battleLogPanel) {
        window.battleLogPanel.addMessage(message, type);
        return true;
    } else {
        console.error('Battle log panel not available for direct message');
        return false;
    }
};

// Create a function to test multiple message types
window.testAllMessageTypes = function() {
    const types = ['default', 'info', 'success', 'action', 'error', 'player', 'enemy'];
    
    types.forEach(type => {
        window.testBattleLog(`Test message with type: ${type}`, type);
    });
    
    return 'All message types tested';
};

console.log('Battle Log testing utilities loaded.');
console.log('Use window.testBattleLog("message", "type") to test via BattleBridge');
console.log('Use window.addDirectBattleLogMessage("message", "type") to test direct addition');
console.log('Use window.testAllMessageTypes() to test all message types');
