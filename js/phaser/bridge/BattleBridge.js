/**
 * BattleBridge.js
 * Handles communication between BattleManager and Phaser Battle Scene
 * 
 * Version 0.5.1.2d - 2025-05-04
 */

class BattleBridge {
    constructor() {
        this.battleManager = null;
        this.battleScene = null;
        
        // Event listeners for all battle events
        this.eventListeners = {};
        
        // Define all event types
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
            STATUS_EFFECT_UPDATED: 'status_effect_updated',
            STATUS_EFFECTS_CHANGED: 'status_effects_changed', // For bulk status effect updates
            ABILITY_USED: 'ability_used',
            PASSIVE_TRIGGERED: 'passive_triggered',
            BATTLE_UI_INTERACTION: 'battle_ui_interaction',
            BATTLE_LOG: 'battle_log' // Event type for battle log messages
        };
        
        // Track bridge state
        this.battlesStarted = 0;
        
        console.log('BattleBridge: Constructor called, registering global class');
    }
    
    /**
     * Initialize the bridge with necessary references
     * @param {Object} battleManager - The BattleManager instance
     * @param {Object} battleScene - The Phaser BattleScene
     */
    initialize(battleManager, battleScene) {
        console.log('BattleBridge: Initializing...');
        
        this.battleManager = battleManager;
        this.battleScene = battleScene;
        
        // Set UI mode to phaser
        if (this.battleManager) {
            console.log('BattleBridge: Setting battleManager.uiMode to "phaser"');
            this.battleManager.uiMode = "phaser";
        } else {
            console.warn('BattleBridge: battleManager is null, cannot set uiMode');
        }
        
        // Set up listeners
        this.setupEventListeners();
        
        // Patch BattleManager to emit events
        this.patchBattleManager();
        
        console.log('BattleBridge: Initialized successfully');
        
        // Dispatch initialization event
        this.dispatchEvent(this.eventTypes.BATTLE_INITIALIZED, {
            battleManager,
            battleScene
        });
        
        return this;
    }
    
    /**
     * Set up event listeners for the bridge
     */
    setupEventListeners() {
        // Initialize event listeners for all event types
        Object.values(this.eventTypes).forEach(type => {
            this.eventListeners[type] = [];
        });
        
        console.log('BattleBridge: Event listeners initialized');
    }
    
    /**
     * Add an event listener
     * @param {string} eventType - The event type to listen for
     * @param {Function} callback - The callback function
     */
    addEventListener(eventType, callback) {
        if (!this.eventListeners[eventType]) {
            console.warn(`BattleBridge: Unknown event type "${eventType}"`);
            this.eventListeners[eventType] = [];
        }
        
        this.eventListeners[eventType].push(callback);
        return this;
    }
    
    /**
     * Remove an event listener
     * @param {string} eventType - The event type
     * @param {Function} callback - The callback function to remove
     */
    removeEventListener(eventType, callback) {
        if (!this.eventListeners[eventType]) return this;
        
        const index = this.eventListeners[eventType].indexOf(callback);
        if (index !== -1) {
            this.eventListeners[eventType].splice(index, 1);
        }
        
        return this;
    }
    
    /**
     * Dispatch an event to all listeners
     * @param {string} eventType - The event type to dispatch
     * @param {Object} data - The event data
     */
    dispatchEvent(eventType, data) {
        console.log(`BattleBridge: Dispatching event ${eventType}`, data);
        
        if (!this.eventListeners[eventType]) {
            console.warn(`BattleBridge: No listeners for event "${eventType}"`);
            return;
        }
        
        // Log listener count for debugging
        console.log(`BattleBridge: Found ${this.eventListeners[eventType].length} listeners for ${eventType}`);
        
        // Add event type to data for reference
        const eventData = {
            ...data,
            type: eventType,
            timestamp: Date.now()
        };
        
        try {
            this.eventListeners[eventType].forEach((callback, index) => {
                try {
                    console.log(`BattleBridge: Calling listener ${index} for ${eventType}`);
                    callback(eventData);
                    console.log(`BattleBridge: Listener ${index} completed successfully`);
                } catch (error) {
                    console.error(`BattleBridge: Error in event listener ${index} for "${eventType}":`, error);
                }
            });
        } catch (error) {
            console.error(`BattleBridge: Error dispatching event "${eventType}":`, error);
        }
    }
    
    /**
     * Patch the BattleManager methods to emit events
     */
    patchBattleManager() {
        if (!this.battleManager) {
            console.error('BattleBridge: No BattleManager to patch');
            return this;
        }
        
        try {
            console.log('BattleBridge: Patching BattleManager methods...');
            
            // Store original methods
            const originalStartBattle = this.battleManager.startBattle;
            const originalEndBattle = this.battleManager.endBattle;
            const originalStartNextTurn = this.battleManager.startNextTurn;  // UPDATED: correct method name
            const originalEndTurn = this.battleManager.endTurn;
            const originalGenerateCharacterAction = this.battleManager.generateCharacterAction;
            const originalProcessAbility = this.battleManager.processAbility;
            const originalApplyDamage = this.battleManager.applyDamage;
            const originalApplyHealing = this.battleManager.applyHealing;
            const originalAddStatusEffect = this.battleManager.addStatusEffect;
            const originalRemoveStatusEffect = this.battleManager.removeStatusEffect;
            
            // Store 'this' reference for use in patched methods
            const self = this;
            
            // NOTE: The following methods are now fully handled by BattleFlowController:
            // - startBattle: BattleFlowController directly dispatches BATTLE_STARTED
            // - endBattle: BattleFlowController handles battle end and dispatches BATTLE_ENDED
            // - startNextTurn: BattleFlowController dispatches TURN_STARTED events
            // - executeNextAction: BattleFlowController dispatches CHARACTER_ACTION
            // - finishTurn: BattleFlowController handles turn completion and dispatches TURN_ENDED
            // - checkBattleEnd: BattleFlowController handles victory/defeat conditions
            console.log('[BattleBridge] Core battle flow methods now handled by BattleFlowController');
            
            // Patch endTurn
            if (originalEndTurn) {
                this.battleManager.endTurn = function() {
                    const result = originalEndTurn.apply(this, arguments);
                    self.dispatchEvent(self.eventTypes.TURN_ENDED, {
                        currentCharacter: this.currentCharacter,
                        turnNumber: this.turnNumber
                    });
                    return result;
                };
            }
            
            // Patch generateCharacterAction
            if (originalGenerateCharacterAction) {
                this.battleManager.generateCharacterAction = function(character) {
                    const action = originalGenerateCharacterAction.apply(this, arguments);
                    // Removed CHARACTER_ACTION dispatch from here - it should only happen during execution, not generation
                    // This prevents simultaneous auto-attack indicators at battle start
                    return action;
                };
            }
            
            // Patch processAbility
            if (originalProcessAbility) {
                this.battleManager.processAbility = function(character, ability, targets) {
                    console.log('BattleBridge: processAbility patched method called with:', character?.name, ability?.name);
                    const result = originalProcessAbility.apply(this, arguments);
                    self.dispatchEvent(self.eventTypes.ABILITY_USED, {
                        source: character,  // Using 'source' for consistency
                        ability,
                        targets,
                        result
                    });
                    return result;
                };
            }
            
            // Patch applyDamage
            if (originalApplyDamage) {
                this.battleManager.applyDamage = function(target, amount, source) {
                    console.log('BattleBridge: applyDamage patched method called with:', target?.name, amount, source?.name);
                    const result = originalApplyDamage.apply(this, arguments);
                    self.dispatchEvent(self.eventTypes.CHARACTER_DAMAGED, {
                        target,
                        amount,
                        source,
                        result,
                        newHealth: target.currentHp
                    });
                    
                    // Check for defeat
                    if (target.currentHp <= 0) {  // Fixed: checking currentHp instead of stats.hp
                        self.dispatchEvent(self.eventTypes.CHARACTER_DEFEATED, {
                            character: target,
                            source
                        });
                    }
                    
                    return result;
                };
            }
            
            // Patch applyHealing
            if (originalApplyHealing) {
                this.battleManager.applyHealing = function(target, amount, source) {
                    console.log('BattleBridge: applyHealing patched method called with:', target?.name, amount, source?.name);
                    const result = originalApplyHealing.apply(this, arguments);
                    self.dispatchEvent(self.eventTypes.CHARACTER_HEALED, {
                        target,
                        amount,
                        source,
                        result,
                        newHealth: target.currentHp
                    });
                    return result;
                };
            }
            
            // Patch addStatusEffect
            if (originalAddStatusEffect) {
                this.battleManager.addStatusEffect = function(character, statusId, sourceOrDuration, durationOrStacks, stacks) {
                    console.log('BattleBridge: addStatusEffect patched method called', character?.name, statusId);
                    
                    let source, duration, stackValue;
                    
                    // Detect old-style parameter format: (character, statusId, duration, value)
                    if (typeof sourceOrDuration === 'number' && arguments.length <= 4) {
                        console.warn(`BattleBridge: Detected old-style addStatusEffect call for ${statusId}.`);
                        console.warn(`BattleBridge: Converting to new format (null source, numeric duration).`);
                        
                        // Convert to new format with null source:
                        source = null; // Use null as source instead of character
                        duration = sourceOrDuration; // Use the number as duration
                        stackValue = durationOrStacks || 1; // Use 4th param as stacks or default to 1
                    } else {
                        // For new style, pass parameters directly
                        source = sourceOrDuration;
                        duration = durationOrStacks;
                        stackValue = stacks;
                    }
                    
                    // Call original with processed parameters - BattleManager handles validation
                    const result = originalAddStatusEffect.call(this, character, statusId, source, duration, stackValue);
                    
                    // Only dispatch event if in phaser UI mode
                    if (this.uiMode === "phaser") {
                        // Get character ID for status effects
                        const characterId = character.uniqueId || character.id;
                        
                        // Get the status effect definition with multiple fallback options
                        let statusDefinition = this.statusEffectDefinitions?.[statusId];
                        
                        // If statusDefinition is undefined, try other sources
                        if (!statusDefinition) {
                            // Try getting from battleManager's statusEffectDefinitions directly
                            if (this.statusEffectDefinitions && this.statusEffectDefinitions[statusId]) {
                                statusDefinition = this.statusEffectDefinitions[statusId];
                            }
                            // Try getting from global battleManager
                            else if (window.battleManager?.statusEffectDefinitions?.[statusId]) {
                                statusDefinition = window.battleManager.statusEffectDefinitions[statusId];
                            }
                            // Try accessing through BattleManager's statusEffects array
                            else if (this.statusEffects && Array.isArray(this.statusEffects) && 
                                    this.statusEffects.find) {
                                const foundEffect = this.statusEffects.find(e => e.id === statusId);
                                if (foundEffect) statusDefinition = foundEffect;
                            }
                            // Try global fallbacks if they exist
                            else if (window.STATUS_EFFECT_FALLBACKS?.[statusId]) {
                                statusDefinition = window.STATUS_EFFECT_FALLBACKS[statusId];
                            }
                            // Create a minimal definition if all else fails
                            else {
                                console.warn(`BattleBridge: Creating minimal fallback for status effect ${statusId}`);
                                statusDefinition = {
                                    id: statusId,
                                    name: statusId.replace('status_', '').replace(/_/g, ' '),
                                    description: `${statusId.replace('status_', '').replace(/_/g, ' ')} effect`,
                                    icon: 'default'
                                };
                            }
                        }
                        
                        // Dispatch event with the parameters as passed to BattleManager
                        self.dispatchEvent(self.eventTypes.STATUS_EFFECT_APPLIED, {
                            character: character,
                            statusId: statusId,
                            duration: duration, // Use the duration that was passed to BattleManager
                            stacks: stackValue, // Use the stacks value that was passed to BattleManager
                            statusDefinition: statusDefinition
                        });
                    }
                    
                    return result;
                };
            }
            
            // Patch removeStatusEffect
            if (originalRemoveStatusEffect) {
                this.battleManager.removeStatusEffect = function(character, statusId) {
                    console.log('BattleBridge: removeStatusEffect patched method called', character?.name, statusId);
                    const result = originalRemoveStatusEffect.apply(this, arguments);
                    
                    // Only dispatch event if in phaser UI mode
                    if (this.uiMode === "phaser") {
                        // Dispatch event with character and status ID
                        self.dispatchEvent(self.eventTypes.STATUS_EFFECT_REMOVED, {
                            character: character,
                            statusId: statusId
                        });
                    }
                    
                    return result;
                };
            }
            
            // Add patch for passive triggers if the method exists
            if (this.battleManager.triggerPassive) {
                const originalTriggerPassive = this.battleManager.triggerPassive;
                this.battleManager.triggerPassive = function(character, triggerType, data) {
                    const result = originalTriggerPassive.apply(this, arguments);
                    if (result && result.triggered) {
                        self.dispatchEvent(self.eventTypes.PASSIVE_TRIGGERED, {
                            character,
                            triggerType,
                            passiveData: data,
                            result
                        });
                    }
                    return result;
                };
            }
            
            // Patch applyActionEffect which is the main function that applies damage/healing
            const originalApplyActionEffect = this.battleManager.applyActionEffect;
            if (originalApplyActionEffect) {
                this.battleManager.applyActionEffect = function(action) {
                    console.log('BattleBridge: applyActionEffect patched method called for:', 
                               action?.actor?.name, 'targeting', action?.target?.name);
                    
                    // Dispatch CHARACTER_ACTION event before applying the effect
                    if (action.actor && action.actionType) {
                        console.log(`BattleBridge: Dispatching CHARACTER_ACTION event for ${action.actor.name} performing ${action.actionType}`);
                        self.dispatchEvent(self.eventTypes.CHARACTER_ACTION, {
                            character: action.actor,
                            action: {
                                type: action.actionType,
                                name: action.abilityName || action.actionType,
                                abilityName: action.abilityName, // Include raw ability name
                                target: action.target
                            }
                        });
                    }
                    
                    // Store pre-action health for calculating actual change
                    const targetPreHealth = action.target ? action.target.currentHp : 0;
                    
                    // Apply the original effect
                    const result = originalApplyActionEffect.apply(this, arguments);
                    
                    // Calculate actual health change for direct targets
                    if (action.target) {
                        const targetPostHealth = action.target.currentHp;
                        const healthChange = targetPostHealth - targetPreHealth;
                        
                        // Dispatch appropriate event based on damage or healing
                        if (healthChange < 0) {
                            // Damage event
                            console.log(`BattleBridge: Dispatching CHARACTER_DAMAGED event for ${action.target.name} with new health ${targetPostHealth}`);
                            self.dispatchEvent(self.eventTypes.CHARACTER_DAMAGED, {
                                character: action.target, // IMPORTANT: Use 'character' instead of 'target' to match event handler
                                target: action.target,    // Keep 'target' for backward compatibility
                                amount: Math.abs(healthChange),
                                source: action.actor,
                                ability: action.ability,
                                newHealth: targetPostHealth
                            });
                        } else if (healthChange > 0) {
                            // Healing event
                            console.log(`BattleBridge: Dispatching CHARACTER_HEALED event for ${action.target.name} with new health ${targetPostHealth}`);
                            self.dispatchEvent(self.eventTypes.CHARACTER_HEALED, {
                                character: action.target, // IMPORTANT: Use 'character' instead of 'target' to match event handler
                                target: action.target,    // Keep 'target' for backward compatibility
                                amount: healthChange,
                                source: action.actor,
                                ability: action.ability,
                                newHealth: targetPostHealth
                            });
                        }
                    }
                    
                    return result;
                };
                console.log('BattleBridge: Successfully patched applyActionEffect method');
            } else {
                console.warn('BattleBridge: Could not patch applyActionEffect, method not found');
            }
            
            console.log('BattleBridge: BattleManager successfully patched');

            // Also patch autoAttack to dispatch CHARACTER_ACTION
            if (this.battleManager.autoAttack) {
                const originalAutoAttack = this.battleManager.autoAttack;
                this.battleManager.autoAttack = function(attacker, target) {
                    console.log('BattleBridge: autoAttack patched method called with:', attacker?.name, target?.name);
                    
                    // Dispatch CHARACTER_ACTION event before applying the auto attack
                    self.dispatchEvent(self.eventTypes.CHARACTER_ACTION, {
                        character: attacker,
                        action: {
                            type: 'autoAttack',
                            name: 'Auto Attack',
                            target: target
                        }
                    });
                    
                    return originalAutoAttack.apply(this, arguments);
                };
                console.log('BattleBridge: Successfully patched autoAttack method');
            } else {
                console.warn('BattleBridge: Could not patch autoAttack, method not found - this is expected during refactoring');
            }
            
            // See note above - All battle flow methods now handled by BattleFlowController
        } catch (error) {
            console.error('BattleBridge: Error patching BattleManager:', error);
        }
        
        return this;
    }
    
    /**
     * Get a reference to the player team
     * @returns {Array} The player team array
     */
    getPlayerTeam() {
        return this.battleManager ? this.battleManager.playerTeam : [];
    }
    
    /**
     * Get a reference to the enemy team
     * @returns {Array} The enemy team array
     */
    getEnemyTeam() {
        return this.battleManager ? this.battleManager.enemyTeam : [];
    }
    
    /**
     * Start the battle
     * This initiates the battle flow in BattleManager
     * @param {Array} playerTeam - Optional player team data
     * @param {Array} enemyTeam - Optional enemy team data
     */
    startBattle(playerTeam, enemyTeam) {
        if (!this.battleManager) {
            console.error('BattleBridge: No BattleManager available to start battle');
            return;
        }
        
        console.log('BattleBridge: Starting battle via BattleManager');
        console.log(`BattleBridge: Using provided teams - Player: ${playerTeam?.length || 0} characters, Enemy: ${enemyTeam?.length || 0} characters`);
        
        try {
            // Track battle state
            this.battlesStarted++;
            
            // Start the battle via BattleManager with team data
            this.battleManager.startBattle(playerTeam, enemyTeam);
            
            // Dispatch UI interaction event
            this.dispatchEvent(this.eventTypes.BATTLE_UI_INTERACTION, { 
                action: 'start_battle',
                source: 'bridge',
                playerTeamSize: playerTeam?.length || 0,
                enemyTeamSize: enemyTeam?.length || 0
            });
        } catch (error) {
            console.error('BattleBridge: Error starting battle:', error);
        }
    }

    /**
     * Clean up battle state when returning to TeamBuilder
     */
    cleanupBattleState() {
        console.log('BattleBridge: Cleaning up battle state before returning to TeamBuilder');
        
        // Reset battle state properties
        this.battlesStarted = 0;
        
        // Clear event listeners to prevent duplicates in subsequent battles
        Object.values(this.eventTypes).forEach(type => {
            this.eventListeners[type] = [];
        });
        
        console.log('BattleBridge: Battle state cleaned up');
    }

    /**
     * Request a character to take their turn
     * @param {Object} character - The character to act
     */
    requestCharacterAction(character) {
        if (!this.battleManager) return;
        
        this.battleManager.processCharacterTurn(character);
    }
    
    /**
     * Request the battle to pause
     */
    requestPause() {
        if (!this.battleManager) return;
        
        this.battleManager.pauseBattle();
        this.dispatchEvent(this.eventTypes.BATTLE_UI_INTERACTION, { action: 'pause' });
    }
    
    /**
     * Request the battle to resume
     */
    requestResume() {
        if (!this.battleManager) return;
        
        this.battleManager.resumeBattle();
        this.dispatchEvent(this.eventTypes.BATTLE_UI_INTERACTION, { action: 'resume' });
    }
    
    /**
     * Set battle speed in the battle manager
     * @param {number} speed - The battle speed multiplier
     * @returns {boolean} - Success status
     */
    setBattleSpeed(speed) {
        if (this.battleManager && this.battleManager.setSpeed) {
            this.battleManager.setSpeed(speed);
            return true;
        } else {
            console.error('BattleBridge: battleManager.setSpeed method not found');
            return false;
        }
    }
    
    /**
     * Request to change battle speed
     * @param {number} speed - The battle speed multiplier
     */
    requestSpeedChange(speed) {
        if (!this.battleManager) return;
        
        // Call the correct method
        const success = this.setBattleSpeed(speed);
        
        // Always dispatch the event, even if method call failed
        this.dispatchEvent(this.eventTypes.BATTLE_UI_INTERACTION, { 
            action: 'speed_change', 
            speed,
            success
        });
    }
}

// Ensure the class is globally accessible
window.BattleBridge = BattleBridge;

// Log that the class has been defined
console.log('BattleBridge.js: Class definition loaded and exported to window.BattleBridge');

// Create an immediate self-check function that logs whether the class is properly exposed
(function checkBattleBridgeExport() {
    // Delay check slightly to allow for script processing
    setTimeout(function() {
        if (typeof window.BattleBridge === 'function') {
            console.log('BattleBridge.js: Successfully verified global class export');
        } else {
            console.error('BattleBridge.js: Class export failed! window.BattleBridge is not a function');
        }
    }, 0);
})();