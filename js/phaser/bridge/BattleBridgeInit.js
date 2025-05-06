/**
 * BattleBridgeInit.js
 * Creates and initializes the BattleBridge instance
 * 
 * This script ensures there's a global instance of BattleBridge available
 * for the Battle Scene to use (separate from the BattleBridge class itself).
 * 
 * Version 0.5.1.2d - 2025-05-04
 */

(function() {
    // Create a fallback BattleBridge class if the real one isn't loaded
    function createFallbackBattleBridge() {
        console.warn('BattleBridgeInit: Creating a fallback BattleBridge class because the real one was not found');
        
        // Define a minimal BattleBridge implementation
        class FallbackBattleBridge {
            constructor() {
                this.battleManager = null;
                this.battleScene = null;
                this.eventListeners = {};
                
                // Define all event types to match the real implementation
                this.eventTypes = {
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
                    ABILITY_USED: 'ability_used',
                    PASSIVE_TRIGGERED: 'passive_triggered',
                    BATTLE_UI_INTERACTION: 'battle_ui_interaction',
                    BATTLE_LOG: 'battle_log'
                };
                
                console.warn('FallbackBattleBridge: Created stub implementation with basic functionality');
            }
            
            initialize(battleManager, battleScene) {
                console.warn('FallbackBattleBridge: initialize called (stub implementation)');
                this.battleManager = battleManager;
                this.battleScene = battleScene;
                this.setupEventListeners();
                return this;
            }
            
            setupEventListeners() {
                Object.values(this.eventTypes).forEach(type => {
                    this.eventListeners[type] = [];
                });
                console.log('FallbackBattleBridge: Event listeners initialized');
            }
            
            addEventListener(eventType, callback) {
                if (!this.eventListeners[eventType]) {
                    this.eventListeners[eventType] = [];
                }
                this.eventListeners[eventType].push(callback);
                return this;
            }
            
            removeEventListener(eventType, callback) {
                if (!this.eventListeners[eventType]) return this;
                
                const index = this.eventListeners[eventType].indexOf(callback);
                if (index !== -1) {
                    this.eventListeners[eventType].splice(index, 1);
                }
                return this;
            }
            
            dispatchEvent(eventType, data) {
                console.log(`FallbackBattleBridge: Dispatching event ${eventType}`, data);
                
                if (!this.eventListeners[eventType]) {
                    return;
                }
                
                const eventData = {
                    ...data,
                    type: eventType,
                    timestamp: Date.now()
                };
                
                try {
                    this.eventListeners[eventType].forEach(callback => {
                        try {
                            callback(eventData);
                        } catch (error) {
                            console.error(`FallbackBattleBridge: Error in event listener for "${eventType}":`, error);
                        }
                    });
                } catch (error) {
                    console.error(`FallbackBattleBridge: Error dispatching event "${eventType}":`, error);
                }
            }
            
            patchBattleManager() {
                console.warn('FallbackBattleBridge: patchBattleManager called (stub implementation)');
                return this;
            }
            
            getPlayerTeam() {
                return this.battleManager ? this.battleManager.playerTeam : [];
            }
            
            getEnemyTeam() {
                return this.battleManager ? this.battleManager.enemyTeam : [];
            }
            
            startBattle(playerTeam, enemyTeam) {
                console.warn('FallbackBattleBridge: startBattle called (stub implementation)');
                if (this.battleManager) {
                    this.battleManager.startBattle(playerTeam, enemyTeam);
                }
            }
            
            requestCharacterAction(character) {
                console.warn('FallbackBattleBridge: requestCharacterAction called (stub implementation)');
                if (this.battleManager) {
                    this.battleManager.processCharacterTurn(character);
                }
            }
            
            requestPause() {
                console.warn('FallbackBattleBridge: requestPause called (stub implementation)');
                if (this.battleManager) {
                    this.battleManager.pauseBattle();
                }
            }
            
            requestResume() {
                console.warn('FallbackBattleBridge: requestResume called (stub implementation)');
                if (this.battleManager) {
                    this.battleManager.resumeBattle();
                }
            }
            
            setBattleSpeed(speed) {
                console.warn('FallbackBattleBridge: setBattleSpeed called (stub implementation)');
                if (this.battleManager && this.battleManager.setSpeed) {
                    this.battleManager.setSpeed(speed);
                    return true;
                }
                return false;
            }
            
            requestSpeedChange(speed) {
                console.warn('FallbackBattleBridge: requestSpeedChange called (stub implementation)');
                const success = this.setBattleSpeed(speed);
                this.dispatchEvent(this.eventTypes.BATTLE_UI_INTERACTION, { 
                    action: 'speed_change', 
                    speed,
                    success
                });
            }
        }
        
        // Register the fallback class globally
        window.BattleBridge = FallbackBattleBridge;
        return FallbackBattleBridge;
    }

    // Create the global accessor function
    window.getBattleBridge = function() {
        // Create instance if it doesn't exist
        if (typeof window.battleBridge === 'undefined' || window.battleBridge === null) {
            initBattleBridge();
        }
        return window.battleBridge;
    };

    // Initialize the battle bridge
    function initBattleBridge() {
        console.log('BattleBridgeInit: Checking for BattleBridge class...');
        
        // Check if the BattleBridge class is available
        let BattleBridgeClass = window.BattleBridge;
        
        // If not, create a fallback implementation
        if (typeof BattleBridgeClass !== 'function') {
            console.warn('BattleBridgeInit: BattleBridge class not found! Creating fallback implementation');
            
            // Try to load the script dynamically if possible
            const scriptElement = document.createElement('script');
            scriptElement.src = 'js/phaser/bridge/BattleBridge.js';
            scriptElement.async = false;
            document.head.appendChild(scriptElement);
            
            // Even if we're loading it, we need a fallback right now
            BattleBridgeClass = createFallbackBattleBridge();
        }
        
        try {
            // Create instance of BattleBridge class
            const battleBridge = new BattleBridgeClass();
            
            // Make it globally available with lowercase 'b' (instance)
            // The class is still available at window.BattleBridge (uppercase 'B')
            window.battleBridge = battleBridge;
            
            // Don't initialize immediately - we'll do this when both BattleManager and BattleScene are available
            // Define function for delayed initialization from BattleScene
            window.initializeBattleBridge = function(battleManager, battleScene) {
                console.log('BattleBridgeInit: Delayed initialization with BattleManager and BattleScene');
            if (typeof window.battleBridge.initialize === 'function') {
                window.battleBridge.initialize(battleManager, battleScene);
                return true;
            }
            return false;
        };
            
            console.log('BattleBridgeInit: BattleBridge instance created and assigned to window.battleBridge');
            
            // Return the instance
            return battleBridge;
        } catch (error) {
            console.error('BattleBridgeInit: Error creating BattleBridge instance:', error);
            
            // Try again with fallback as last resort
            try {
                const fallbackClass = createFallbackBattleBridge();
                const fallbackInstance = new fallbackClass();
                window.battleBridge = fallbackInstance;
                console.warn('BattleBridgeInit: Created fallback instance as emergency recovery');
                return fallbackInstance;
            } catch (fallbackError) {
                console.error('BattleBridgeInit: Even fallback creation failed:', fallbackError);
                return null;
            }
        }
    }

    // Run initialization immediately
    initBattleBridge();
    
    // Create a backup of our key battle bridge globals to prevent overwriting
    // Uses Object.defineProperty to protect our getBattleBridge function
    (function protectBattleBridgeGlobals() {
        // Store backup references
        const battleBridgeClass = window.BattleBridge;
        const battleBridgeInstance = window.battleBridge;
        const battleBridgeAccessor = window.getBattleBridge;
        
        // Make getBattleBridge write-protected
        try {
            Object.defineProperty(window, 'getBattleBridge', {
                enumerable: true,
                configurable: false,  // Cannot be deleted or redefined
                get: function() { return battleBridgeAccessor; }
            });
            console.log('BattleBridgeInit: Protected getBattleBridge function from overwriting');
        } catch(e) {
            console.error('BattleBridgeInit: Could not protect getBattleBridge:', e);
        }
        
        // Create restoration function that can be called later if needed
        window._restoreBattleBridge = function() {
            console.log('BattleBridgeInit: Restoring original BattleBridge components');
            window.BattleBridge = battleBridgeClass;
            window.battleBridge = battleBridgeInstance;
            return true;
        };
    })();
    
    // Also initialize on DOMContentLoaded, as a fallback
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof window.battleBridge === 'undefined' || window.battleBridge === null) {
            console.log('BattleBridgeInit: No bridge found at DOMContentLoaded, initializing now...');
            initBattleBridge();
        }
    });
    
    // Check script loading status and dependencies
    function checkScriptLoadStatus() {
        console.log('BattleBridgeInit: Checking script load status...');
        const scripts = document.querySelectorAll('script');
        const loadedScripts = [];
        
        scripts.forEach(script => {
            if (script.src) {
                const scriptName = script.src.split('/').pop();
                loadedScripts.push(`${scriptName} (${script.async ? 'async' : 'sync'})`);
            }
        });
        
        console.log('Loaded scripts:', loadedScripts.join(', '));
        console.log('BattleBridge class available:', typeof window.BattleBridge === 'function');
        console.log('battleBridge instance available:', typeof window.battleBridge !== 'undefined');
    }
    
    // Run status check after a delay to allow other scripts to load
    setTimeout(checkScriptLoadStatus, 1000);
    
    console.log('BattleBridgeInit: Setup complete. Use window.getBattleBridge() to access the bridge instance.');
})();