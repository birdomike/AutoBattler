/**
 * BattleEventManager.js
 * Manages event listening setup and event handling for the BattleScene
 * Version: 0.6.1.1
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
        this.boundHandlers = new Map(); // For tracking bound handlers
        
        console.log("[BattleEventManager] Initializing...");
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

        // Setup all event listeners
        this.setupCoreEventListeners();
        this.setupStatusEffectListeners();
        this.setupHealthUpdateListeners();
        this.setupActionIndicatorListeners();

        console.log("[BattleEventManager] Initialization complete");
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

        // Action indicator listeners
        this.registerEventHandler(
            this.battleBridge.eventTypes.CHARACTER_ACTION,
            this.onCharacterAction
        );

        this.registerEventHandler(
            this.battleBridge.eventTypes.ABILITY_USED,
            this.onAbilityUsed
        );
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

        // Store the handler for later cleanup
        this.boundHandlers.set(eventType, handler);
        
        // Register with battleBridge
        this.battleBridge.addEventListener(eventType, handler);
    }

    /**
     * Handle turn started event
     * @param {Object} data - Event data
     */
    handleTurnStarted(data) {
        if (!data || !this.scene) return;

        try {
            // Update turn number display
            if (this.scene.updateTurnNumberDisplay) {
                this.scene.updateTurnNumberDisplay(data.turnNumber);
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
                this.scene.showFloatingText(characterSprite, floatingTextConfig);
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
                this.scene.showFloatingText(characterSprite, floatingTextConfig);
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
                this.scene.showFloatingText(characterSprite, floatingTextConfig);
            }

            // Show attack animation if source is available
            if (data.source && this.scene.showAttackAnimation) {
                const sourceSprite = this.getCharacterSprite(data.source);
                if (sourceSprite) {
                    this.scene.showAttackAnimation(sourceSprite, characterSprite);
                }
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
                this.scene.showFloatingText(characterSprite, floatingTextConfig);
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
            // Update active character visuals
            if (this.scene.updateActiveCharacterVisuals) {
                this.scene.updateActiveCharacterVisuals(data.character);
            }

            // Update action text
            if (this.scene.updateActionTextDisplay) {
                this.scene.updateActionTextDisplay(`${data.character.name}'s turn`);
            }

            // Show action indicator on character
            const characterSprite = this.getCharacterSprite(data.character);
            if (characterSprite && characterSprite.showActionIndicator) {
                characterSprite.showActionIndicator("Auto Attack");
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
            if (characterSprite && characterSprite.showActionIndicator) {
                characterSprite.showActionIndicator(`Ability: ${data.ability.name}`);
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
     * Helper method to find character sprite based on character data
     * @param {Object} characterData - The character data object
     * @returns {CharacterSprite|null} The character sprite or null if not found
     */
    getCharacterSprite(characterData) {
        if (!characterData || !this.scene) {
            console.warn("[BattleEventManager] getCharacterSprite: Missing character data or scene reference");
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
        
        console.log("[BattleEventManager] Destroyed");
    }
}

// Make BattleEventManager available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.BattleEventManager = BattleEventManager;
    console.log("BattleEventManager class definition loaded");
}
