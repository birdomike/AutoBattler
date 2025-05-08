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
            const characterSprite = this.getCharacterSpriteById(data.target.uniqueId);
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
            const characterSprite = this.getCharacterSpriteById(data.target.uniqueId);
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
            const characterSprite = this.getCharacterSpriteById(data.character.uniqueId);
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
                const sourceSprite = this.getCharacterSpriteById(data.source.uniqueId);
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
            const characterSprite = this.getCharacterSpriteById(data.character.uniqueId);
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
            const characterSprite = this.getCharacterSpriteById(data.character.uniqueId);
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
            const characterSprite = this.getCharacterSpriteById(data.character.uniqueId);
            if (characterSprite && characterSprite.showActionIndicator) {
                characterSprite.showActionIndicator(`Ability: ${data.ability.name}`);
            }
        } catch (error) {
            console.error("[BattleEventManager] Error handling ability used:", error);
        }
    }

    /**
     * Helper method to find character sprite by character ID
     * @param {string} characterId - The character's unique ID
     * @returns {CharacterSprite|null} The character sprite or null if not found
     */
    getCharacterSpriteById(characterId) {
        if (!characterId || !this.scene) return null;

        // Access player team container
        const playerTeamContainer = this.scene.playerTeamContainer;
        if (playerTeamContainer) {
            const playerCharacter = playerTeamContainer.getCharacterSpriteById(characterId);
            if (playerCharacter) return playerCharacter;
        }

        // Access enemy team container
        const enemyTeamContainer = this.scene.enemyTeamContainer;
        if (enemyTeamContainer) {
            const enemyCharacter = enemyTeamContainer.getCharacterSpriteById(characterId);
            if (enemyCharacter) return enemyCharacter;
        }

        return null;
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
