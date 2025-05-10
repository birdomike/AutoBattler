/**
 * BattleEventManager.js
 * Manages event listening setup and event handling for the BattleScene
 * Version: 0.6.2.3 (TeamDisplayManager integration)
 */

class BattleEventManager {
    /**
     * Creates a new BattleEventManager
     * @param {Phaser.Scene} scene - Reference to the BattleScene
     * @param {object} battleBridge - Reference to the BattleBridge for event communication
     */
    constructor(scene, battleBridge) {
    
        
        // Validate dependencies
        if (!scene) {
            console.error("[BattleEventManager] Missing required scene reference");
            return;
        }
        
        if (!battleBridge) {
            console.error("[BattleEventManager] Missing required battleBridge reference");
            return;
        }
        
        this.scene = scene;
        this.battleBridge = battleBridge;
        this.teamManager = null; // Will be set via setTeamManager if available
        this.battleLog = null; // Will be set via setBattleLog if available
        this.boundHandlers = new Map(); // For tracking bound handlers
        
        console.log("[BattleEventManager] Initializing with battleBridge:", {
            hasBattleBridge: !!this.battleBridge,
            eventTypesAvailable: this.battleBridge && this.battleBridge.eventTypes ? Object.keys(this.battleBridge.eventTypes) : 'none',
            hasAddEventListener: this.battleBridge && typeof this.battleBridge.addEventListener === 'function'
        });
        

        
        this.initialize();
    }

    /**
     * Initialize the event manager and set up event listeners
     */
    initialize() {

        
        // Bind all event handlers to preserve 'this' context
        this.handleTurnStarted = this.handleTurnStarted.bind(this);
        this.handleStatusEffectApplied = this.handleStatusEffectApplied.bind(this);
        this.handleStatusEffectRemoved = this.handleStatusEffectRemoved.bind(this);
        this.handleStatusEffectUpdated = this.handleStatusEffectUpdated.bind(this);
        this.onCharacterDamaged = this.onCharacterDamaged.bind(this);
        this.onCharacterHealed = this.onCharacterHealed.bind(this);
        this.onCharacterAction = this.onCharacterAction.bind(this);
        this.onAbilityUsed = this.onAbilityUsed.bind(this);
        this.handleBattleEnded = this.handleBattleEnded.bind(this);
        this.handleBattleLog = this.handleBattleLog.bind(this);

        // Setup all event listeners
        this.setupCoreEventListeners();
        this.setupStatusEffectListeners();
        this.setupHealthUpdateListeners();
        this.setupActionIndicatorListeners();

        console.log("[BattleEventManager] Initialization complete");
    }

    /**
     * Set the TeamDisplayManager reference
     * @param {TeamDisplayManager} teamManager - The TeamDisplayManager instance
     */
    setTeamManager(teamManager) {
        if (!teamManager) {
            console.warn("[BattleEventManager] setTeamManager: Missing TeamDisplayManager reference");
            return;
        }
        
        console.log("[BattleEventManager] Setting TeamDisplayManager reference");
        this.teamManager = teamManager;
    }
    
    /**
     * Set the battle log reference
     * @param {DirectBattleLog} battleLog - The DirectBattleLog instance
     */
    setBattleLog(battleLog) {
        if (!battleLog) {
            console.warn("[BattleEventManager] setBattleLog: Missing battle log reference");
            return;
        }
        
        console.log("[BattleEventManager] Setting DirectBattleLog reference");
        this.battleLog = battleLog;
    }

    /**
     * Set up core battle flow event listeners
     */
    setupCoreEventListeners() {
        if (!this.battleBridge) {
            console.warn("[BattleEventManager] Cannot setup core event listeners - battleBridge not available");
            return;
        }
        
        // Store the bound handler and add event listener
        this.registerEventHandler(
            this.battleBridge.eventTypes.TURN_STARTED, 
            this.handleTurnStarted
        );

        // Battle ended event listener
        this.registerEventHandler(
            this.battleBridge.eventTypes.BATTLE_ENDED,
            this.handleBattleEnded
        );
        
        // Battle log event listener
        this.registerEventHandler(
            this.battleBridge.eventTypes.BATTLE_LOG,
            this.handleBattleLog
        );
    }

    /**
     * Set up status effect related event listeners
     */
    setupStatusEffectListeners() {
        if (!this.battleBridge) {
            console.warn("[BattleEventManager] Cannot setup status effect listeners - battleBridge not available");
            return;
        }

        // Status effect listeners
        this.registerEventHandler(
            this.battleBridge.eventTypes.STATUS_EFFECT_APPLIED,
            this.handleStatusEffectApplied
        );

        this.registerEventHandler(
            this.battleBridge.eventTypes.STATUS_EFFECT_REMOVED,
            this.handleStatusEffectRemoved
        );

        this.registerEventHandler(
            this.battleBridge.eventTypes.STATUS_EFFECT_UPDATED,
            this.handleStatusEffectUpdated
        );
    }

    /**
     * Set up health update related event listeners
     */
    setupHealthUpdateListeners() {
        if (!this.battleBridge) {
            console.warn("[BattleEventManager] Cannot setup health update listeners - battleBridge not available");
            return;
        }

        // Health update listeners
        this.registerEventHandler(
            this.battleBridge.eventTypes.CHARACTER_DAMAGED,
            this.onCharacterDamaged
        );

        this.registerEventHandler(
            this.battleBridge.eventTypes.CHARACTER_HEALED,
            this.onCharacterHealed
        );
    }

    /**
     * Set up action indicator related event listeners
     */
    setupActionIndicatorListeners() {
        if (!this.battleBridge) {
            console.warn("[BattleEventManager] Cannot setup action indicator listeners - battleBridge not available");
            return;
        }

        // DIAGNOSTIC: Log the specific event types we're about to register for
        console.log('[BattleEventManager] Setting up action indicator listeners with event types:', {
            CHARACTER_ACTION: this.battleBridge.eventTypes.CHARACTER_ACTION,
            ABILITY_USED: this.battleBridge.eventTypes.ABILITY_USED
        });

        // Action indicator listeners
        this.registerEventHandler(
            this.battleBridge.eventTypes.CHARACTER_ACTION,
            this.onCharacterAction
        );

        this.registerEventHandler(
            this.battleBridge.eventTypes.ABILITY_USED,
            this.onAbilityUsed
        );
        
        // DIAGNOSTIC: Verify registration worked by checking boundHandlers map
        console.log('[BattleEventManager] Action indicators registered:', {
            characterActionBound: this.boundHandlers.has(this.battleBridge.eventTypes.CHARACTER_ACTION),
            abilityUsedBound: this.boundHandlers.has(this.battleBridge.eventTypes.ABILITY_USED)
        });
    }

    /**
     * Helper method to register an event handler and track it for cleanup
     * @param {string} eventType - The event type to listen for
     * @param {function} handler - The bound handler function
     */
    registerEventHandler(eventType, handler) {

        
        if (!this.battleBridge || !eventType || !handler) {
            console.warn("[BattleEventManager] Cannot register event handler - missing required parameters");
            return;
        }

        // DIAGNOSTIC: Check handler binding
        console.log(`[BattleEventManager] Registering handler for ${eventType}:`, {
            handlerType: typeof handler,
            handlerToString: handler.toString().substring(0, 100) + '...',
            boundThis: handler.hasOwnProperty('this') ? 'has this context' : 'no this context',
        });

        // Store the handler for later cleanup
        this.boundHandlers.set(eventType, handler);
        
        // Register with battleBridge
        this.battleBridge.addEventListener(eventType, handler);
        
        // DIAGNOSTIC: Verify registration
        console.log(`[BattleEventManager] Handler registered for ${eventType}. Now checking battleBridge event listeners:`);
        
        // Try to access the listeners array to verify registration (defensive approach)
        try {
            if (this.battleBridge.eventListeners && this.battleBridge.eventListeners[eventType]) {
                const listenerCount = this.battleBridge.eventListeners[eventType].length;
                console.log(`[BattleEventManager] BattleBridge reports ${listenerCount} listeners for ${eventType}`);
            } else {
                console.warn(`[BattleEventManager] Could not verify listener count in battleBridge for ${eventType}`);
            }
        } catch (error) {
            console.error(`[BattleEventManager] Error verifying listener registration:`, error);
        }
    }

    /**
     * Handle turn started event
     * @param {Object} data - Event data
     */
    handleTurnStarted(data) {
        if (!data || !this.scene) return;

        try {
            // Update turn number display using UIManager
            if (this.scene.uiManager && typeof this.scene.uiManager.updateTurnNumberDisplay === 'function') {
                console.log(`[BattleEventManager] Updating turn number display to ${data.turnNumber}`);
                this.scene.uiManager.updateTurnNumberDisplay(data.turnNumber);
            } else {
                console.warn("[BattleEventManager] Cannot update turn display - scene.uiManager not available or missing updateTurnNumberDisplay method");
                // Fallback to legacy method if available
                if (this.scene.updateTurnNumberDisplay) {
                    this.scene.updateTurnNumberDisplay(data.turnNumber);
                }
            }
            
            // Also update the scene's battleState for consistency
            if (this.scene.battleState) {
                this.scene.battleState.currentTurn = data.turnNumber;
                console.log(`[BattleEventManager] Updated scene.battleState.currentTurn to ${data.turnNumber}`);
            }
        } catch (error) {
            console.error("[BattleEventManager] Error handling turn started:", error);
        }
    }

    /**
     * Handle status effect applied event
     * @param {Object} data - Event data
     */
    handleStatusEffectApplied(data) {
        if (!data || !data.target || !this.scene) return;

        try {
            // Find the target character sprite
            const characterSprite = this.getCharacterSprite(data.target);
            if (!characterSprite) return;

            // Update status effect display
            characterSprite.addStatusEffect(data.effect);

            // Show floating text for status application
            const floatingTextConfig = {
                text: `${data.effect.name} applied!`,
                style: { fontSize: '16px', fill: '#FF00FF' }
            };

            if (this.scene.showFloatingText) {
                this.scene.showFloatingText(data.target, floatingTextConfig.text, floatingTextConfig.style);
            }
        } catch (error) {
            console.error("[BattleEventManager] Error handling status effect applied:", error);
        }
    }

    /**
     * Handle status effect removed event
     * @param {Object} data - Event data
     */
    handleStatusEffectRemoved(data) {
        if (!data || !data.target || !this.scene) return;

        try {
            // Find the target character sprite
            const characterSprite = this.getCharacterSprite(data.target);
            if (!characterSprite) return;

            // Update status effect display
            characterSprite.removeStatusEffect(data.effectId);

            // Show floating text for status removal
            const floatingTextConfig = {
                text: `${data.effectName} faded!`,
                style: { fontSize: '16px', fill: '#8F8FFF' }
            };

            if (this.scene.showFloatingText) {
                this.scene.showFloatingText(data.target, floatingTextConfig.text, floatingTextConfig.style);
            }
        } catch (error) {
            console.error("[BattleEventManager] Error handling status effect removed:", error);
        }
    }

    /**
     * Handle status effect updated event
     * @param {Object} data - Event data
     */
    handleStatusEffectUpdated(data) {
        // Currently empty in original code, keeping as placeholder for future implementation
        if (!data) return;
        
        // Will implement when needed in future versions
    }

    /**
     * Handle character damaged event
     * @param {Object} data - Event data
     */
    onCharacterDamaged(data) {
        if (!data || !data.character || !this.scene) return;

        try {
            // Find the character sprite
            const characterSprite = this.getCharacterSprite(data.character);
            if (!characterSprite) return;

            // Update health display
            characterSprite.updateHealth(data.newHealth, data.maxHealth);

            // Display floating damage text
            const amount = data.amount || 0;
            const isCritical = data.isCritical || false;
            
            const floatingTextConfig = {
                text: `-${amount}`,
                style: { 
                    fontSize: isCritical ? '24px' : '20px', 
                    fill: isCritical ? '#FF0000' : '#FF4444',
                    fontStyle: isCritical ? 'bold' : 'normal'
                }
            };

            if (this.scene.showFloatingText) {
                this.scene.showFloatingText(data.character, floatingTextConfig.text, floatingTextConfig.style);
            }

            // Show attack animation if source is available
            if (data.source && this.scene.showAttackAnimation) {
                this.scene.showAttackAnimation(data.source, data.character);
            }
        } catch (error) {
            console.error("[BattleEventManager] Error handling character damaged:", error);
        }
    }

    /**
     * Handle character healed event
     * @param {Object} data - Event data
     */
    onCharacterHealed(data) {
        if (!data || !data.character || !this.scene) return;

        try {
            // Find the character sprite
            const characterSprite = this.getCharacterSprite(data.character);
            if (!characterSprite) return;

            // Update health display
            characterSprite.updateHealth(data.newHealth, data.maxHealth);

            // Display floating healing text
            const amount = data.amount || 0;
            
            const floatingTextConfig = {
                text: `+${amount}`,
                style: { fontSize: '20px', fill: '#00FF00' }
            };

            if (this.scene.showFloatingText) {
                this.scene.showFloatingText(data.character, floatingTextConfig.text, floatingTextConfig.style);
            }
        } catch (error) {
            console.error("[BattleEventManager] Error handling character healed:", error);
        }
    }

    /**
    * Handle character action event
    * @param {Object} data - Event data
    */
    onCharacterAction(data) {
    
    
    if (!data || !data.character || !this.scene) return;

    try {

    
    
    // Update active character visuals using TeamDisplayManager if available
    if (this.teamManager && typeof this.teamManager.updateActiveCharacterVisuals === 'function') {
    this.teamManager.updateActiveCharacterVisuals(data.character);
    } else if (this.scene.updateActiveCharacterVisuals) {
    this.scene.updateActiveCharacterVisuals(data.character);
    }

    // Update action text in UI manager
    if (this.scene.uiManager && typeof this.scene.uiManager.updateActionTextDisplay === 'function') {
    this.scene.uiManager.updateActionTextDisplay(this.scene.battleState.currentTurn, data.character);
    }



    // Show action indicator on character
    const characterSprite = this.getCharacterSprite(data.character);
        
    // Get the text to display based on the action type
        let actionText = "Auto Attack"; // Default
            
            // If we have an action with an actionType and abilityName, use them
            if (data.action && data.action.actionType === 'ability' && data.action.abilityName) {
                actionText = `${data.action.abilityName}`;
            } else {
            }
            

            
            if (characterSprite && characterSprite.showActionText) {
                characterSprite.showActionText(actionText);
            }
        } catch (error) {
            console.error("[BattleEventManager] Error handling character action:", error);
        }
    }

    /**
     * Handle ability used event
     * @param {Object} data - Event data
     */
    onAbilityUsed(data) {

        
        if (!data || !data.character || !data.ability || !this.scene) return;

        try {
            // Show action indicator on character
            const characterSprite = this.getCharacterSprite(data.character);

            if (characterSprite && characterSprite.showActionText) {

                
                // Always display the ability name directly, not prefixed with "Ability:"
                characterSprite.showActionText(`${data.ability.name}`);
            }
        } catch (error) {
            console.error("[BattleEventManager] Error handling ability used:", error);
        }
    }

    /**
     * Handle battle ended event
     * @param {Object} data - Event data, including data.winner
     */
    handleBattleEnded(data) {
        if (!data || !this.scene) {
            console.warn("[BattleEventManager] handleBattleEnded: Missing data or scene reference.");
            return;
        }

        if (typeof this.scene.showBattleOutcome === 'function') {
            try {
                console.log(`[BattleEventManager] Battle ended. Result: ${data.winner}. Calling scene.showBattleOutcome.`);
                this.scene.showBattleOutcome(data.winner);
            } catch (error) {
                console.error("[BattleEventManager] Error calling this.scene.showBattleOutcome:", error);
            }
        } else {
            console.error("[BattleEventManager] this.scene.showBattleOutcome is not a function. Cannot display battle outcome.");
        }
    }
    
    /**
     * Handle battle log event
     * @param {Object} data - Event data
     */
    handleBattleLog(data) {
        if (!data || !data.message) {
            console.warn("[BattleEventManager] handleBattleLog: Missing message data");
            return;
        }

        try {
            // Check if we have a direct reference to the battle log
            if (this.battleLog && typeof this.battleLog.addMessage === 'function') {
                this.battleLog.addMessage(data.message, data.type || 'default');
                return;
            }
            
            // Fallback: try to access the battle log through the scene if available
            if (this.scene && this.scene.battleLog && typeof this.scene.battleLog.addMessage === 'function') {
                this.scene.battleLog.addMessage(data.message, data.type || 'default');
                return;
            }
            
            // Second fallback: try to access through window
            if (window.battleLog && typeof window.battleLog.addMessage === 'function') {
                window.battleLog.addMessage(data.message, data.type || 'default');
                return;
            }
            
            // If we get here, we couldn't find any way to log the message
            console.warn(`[BattleEventManager] Could not find battle log to display message: ${data.message}`);
        } catch (error) {
            console.error("[BattleEventManager] Error handling battle log event:", error);
        }
    }

    /**
     * Helper method to find character sprite based on character data
     * @param {Object} characterData - The character data object
     * @returns {CharacterSprite|null} The character sprite or null if not found
     */
    getCharacterSprite(characterData) {
        if (!characterData) {
            console.warn("[BattleEventManager] getCharacterSprite: Missing character data");
            return null;
        }

        // Try TeamDisplayManager first if available
        if (this.teamManager && typeof this.teamManager.getCharacterSprite === 'function') {
            const sprite = this.teamManager.getCharacterSprite(characterData);
            if (sprite) return sprite;
        }

        // Fallback to legacy approach using team containers directly
        if (!this.scene) {
            console.warn("[BattleEventManager] getCharacterSprite: Missing scene reference");
            return null;
        }

        // Determine which team container to use based on character's team property
        let teamContainer = null;
        if (characterData.team === 'player') {
            teamContainer = this.scene.playerTeamContainer;
        } else if (characterData.team === 'enemy') {
            teamContainer = this.scene.enemyTeamContainer;
        }

        // If we couldn't determine team, try both containers
        if (!teamContainer) {
            // Try player team first
            if (this.scene.playerTeamContainer) {
                const sprite = this.scene.playerTeamContainer.findCharacterSprite(characterData);
                if (sprite) return sprite;
            }

            // Then try enemy team
            if (this.scene.enemyTeamContainer) {
                const sprite = this.scene.enemyTeamContainer.findCharacterSprite(characterData);
                if (sprite) return sprite;
            }

            console.warn(`[BattleEventManager] getCharacterSprite: Could not determine team for character ${characterData.name || characterData.uniqueId || 'unknown'}, and search in both teams failed`);
            return null;
        }

        // If we have a specific team container, use it
        if (!teamContainer.findCharacterSprite) {
            console.error(`[BattleEventManager] getCharacterSprite: findCharacterSprite method is missing on ${characterData.team} team container`);
            return null;
        }

        // Use the findCharacterSprite method
        const sprite = teamContainer.findCharacterSprite(characterData);
        if (!sprite) {
            console.warn(`[BattleEventManager] getCharacterSprite: Character sprite not found for ${characterData.name || characterData.uniqueId || 'unknown'} in ${characterData.team} team`);
        }

        return sprite;
    }

    /**
     * Clean up event listeners
     */
    cleanup() {
        console.log("[BattleEventManager] Cleaning up event listeners");
        
        // Remove all registered event listeners
        if (this.battleBridge) {
            // Remove all listeners using the bound handlers we stored
            for (const [eventType, handler] of this.boundHandlers.entries()) {
                try {
                    this.battleBridge.removeEventListener(eventType, handler);
                } catch (error) {
                    console.warn(`[BattleEventManager] Error removing listener for ${eventType}:`, error);
                }
            }
        }
        
        // Clear tracking map
        this.boundHandlers.clear();
        
        console.log("[BattleEventManager] Event listeners cleaned up");
    }

    /**
     * Destroy the event manager and clean up resources
     */
    destroy() {
        console.log("[BattleEventManager] Destroying...");
        this.cleanup();
        
        // Clear references
        this.scene = null;
        this.battleBridge = null;
        this.teamManager = null;
        
        console.log("[BattleEventManager] Destroyed");
    }
}

// Make BattleEventManager available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.BattleEventManager = BattleEventManager;
    console.log("BattleEventManager class definition loaded");
}
