/**
 * SafetyLoader.js
 * 
 * This script ensures that the BattleManager is properly initialized
 * even if there are timing issues with script loading.
 */

(function() {
    console.log('Safety loader activated...');
    
    // Check periodically until BattleManager is available
    const maxAttempts = 10;
    let attempts = 0;
    
    function checkAndFixBattleManager() {
        attempts++;
        console.log(`Checking BattleManager availability (attempt ${attempts}/${maxAttempts})...`);
        
        if (typeof window.BattleManager === 'function') {
            console.log('BattleManager is properly defined!');
            return;
        }
        
        if (typeof BattleManager === 'function') {
            console.log('BattleManager exists but is not properly assigned to window - fixing...');
            window.BattleManager = BattleManager;
            return;
        }
        
        if (attempts >= maxAttempts) {
            console.error('Failed to find BattleManager after multiple attempts');
            return;
        }
        
        // Try again in a moment
        setTimeout(checkAndFixBattleManager, 500);
    }
    
    // Start checking after a short delay
    setTimeout(checkAndFixBattleManager, 100);
    
    // Also check when the page is fully loaded
    window.addEventListener('load', function() {
        console.log('Window loaded - doing final BattleManager check...');
        
        if (typeof window.BattleManager !== 'function' && typeof BattleManager === 'function') {
            console.log('Window loaded but BattleManager not assigned - fixing...');
            window.BattleManager = BattleManager;
        }
    });
})();
