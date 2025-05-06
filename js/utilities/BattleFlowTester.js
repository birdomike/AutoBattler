/**
 * BattleFlowTester.js
 * Utility for testing the BattleFlowController implementation
 * Version 0.5.9 - 2025-05-20
 */

// Create a global test utility object
window.testBattleFlow = {
    /**
     * Enable the BattleFlowController
     * @returns {boolean} Success status
     */
    enable: function() {
        if (window.battleManager && window.battleManager.battleFlowController) {
            console.log("[TestUtil] Enabling BattleFlowController");
            return window.battleManager.battleFlowController.enableFlowController();
        }
        console.error("[TestUtil] BattleManager or BattleFlowController not available");
        return false;
    },
    
    /**
     * Disable the BattleFlowController
     * @returns {boolean} Success status
     */
    disable: function() {
        if (window.battleManager && window.battleManager.battleFlowController) {
            console.log("[TestUtil] Disabling BattleFlowController");
            return window.battleManager.battleFlowController.disableFlowController();
        }
        console.error("[TestUtil] BattleManager or BattleFlowController not available");
        return false;
    },
    
    /**
     * Start a test battle with BattleFlowController enabled
     * @returns {boolean} Success status
     */
    test: function() {
        if (window.teamBuilderUI) {
            console.log("[TestUtil] Starting test battle with BattleFlowController enabled");
            this.enable();
            window.teamBuilderUI.startQuickBattle();
            return true;
        }
        console.error("[TestUtil] TeamBuilderUI not available");
        return false;
    },
    
    /**
     * Check if BattleFlowController is currently enabled
     * @returns {boolean} Enabled status
     */
    isEnabled: function() {
        if (window.battleManager) {
            return !!window.battleManager.useNewFlowController;
        }
        return false;
    },
    
    /**
     * Toggle the BattleFlowController state
     * @returns {boolean} New state
     */
    toggle: function() {
        if (window.battleManager) {
            window.battleManager.toggleFlowController();
            console.log(`[TestUtil] BattleFlowController ${this.isEnabled() ? 'enabled' : 'disabled'}`);
            return this.isEnabled();
        }
        return false;
    },
    
    /**
     * Run a comparison test that starts two battles in sequence:
     * First with legacy implementation, then with BattleFlowController
     */
    compareImplementations: function() {
        if (!window.teamBuilderUI) {
            console.error("[TestUtil] TeamBuilderUI not available");
            return false;
        }
        
        console.log("[TestUtil] Running implementation comparison test");
        
        // First, run with legacy implementation
        this.disable();
        console.log("[TestUtil] Starting battle with legacy implementation");
        window.teamBuilderUI.startQuickBattle();
        
        // Schedule a test with the new implementation after 5 seconds
        console.log("[TestUtil] Will test new implementation in 5 seconds...");
        setTimeout(() => {
            console.log("[TestUtil] Starting battle with BattleFlowController");
            this.enable();
            window.teamBuilderUI.startQuickBattle();
        }, 5000);
        
        return true;
    },
    
    /**
     * Display the current status of the BattleFlowController
     */
    status: function() {
        const enabled = this.isEnabled();
        console.log(`[TestUtil] BattleFlowController Status:`);
        console.log(`- Enabled: ${enabled}`);
        console.log(`- Available: ${!!(window.battleManager && window.battleManager.battleFlowController)}`);
        
        if (window.battleManager && window.battleManager.battleFlowController) {
            console.log(`- Controller methods implemented: ${Object.getOwnPropertyNames(
                Object.getPrototypeOf(window.battleManager.battleFlowController)
            ).filter(m => m !== 'constructor').join(', ')}`);
        }
        
        return {
            enabled: enabled,
            available: !!(window.battleManager && window.battleManager.battleFlowController),
            battleManager: !!window.battleManager,
            teamBuilderUI: !!window.teamBuilderUI
        };
    },
    
    /**
     * Display helpful usage information in the console
     */
    help: function() {
        console.log(`
BattleFlowController Test Utility

Available commands:
    testBattleFlow.enable()               - Enable BattleFlowController
    testBattleFlow.disable()              - Disable BattleFlowController
    testBattleFlow.toggle()               - Toggle BattleFlowController state
    testBattleFlow.isEnabled()            - Check if BattleFlowController is enabled
    testBattleFlow.test()                 - Start a test battle with BattleFlowController enabled
    testBattleFlow.compareImplementations() - Run battles with both implementations for comparison
    testBattleFlow.status()               - Display current status
    testBattleFlow.help()                 - Show this help information
        `);
    }
};

// Automatically display help information when this file loads
console.log('BattleFlowTester loaded - Use testBattleFlow.help() for available commands');
