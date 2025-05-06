/**
 * Game Bridge (LEGACY SYSTEM)
 * Provides communication between existing game logic and Phaser UI
 * 
 * NOTE: This is a legacy bridge that is being replaced by BattleBridge.
 * It is kept for compatibility but should not be used for new development.
 */
class GameBridge {
    constructor() {
        // References to key game components
        this.teamManager = null;
        this.battleManager = null;
        
        // Event listeners for game events
        this.eventListeners = {};
        
        // IMPORTANT: Do not overwrite the global BattleBridge class or instance
        console.log('GameBridge: Created legacy bridge - this system is deprecated');
        console.log('GameBridge: Preserving existing BattleBridge if it exists');
    }
    
    /**
     * Initialize the bridge with game managers
     * @param {Object} teamManager - The team manager instance
     * @param {Object} battleManager - The battle manager instance
     */
    initialize(teamManager, battleManager) {
        this.teamManager = teamManager;
        this.battleManager = battleManager;
        
        // Set up event system
        this.setupEvents();
        
        console.log('GameBridge: Initialized');
    }
    
    /**
     * Set up event system for communication
     */
    setupEvents() {
        // Create a custom event system for game events
        this.eventTypes = {
            TEAM_UPDATED: 'team_updated',
            BATTLE_STARTED: 'battle_started',
            BATTLE_ENDED: 'battle_ended',
            CHARACTER_ACTION: 'character_action',
            CHARACTER_DAMAGED: 'character_damaged',
            CHARACTER_HEALED: 'character_healed',
            CHARACTER_DEFEATED: 'character_defeated',
            STATUS_EFFECT_APPLIED: 'status_effect_applied',
            ABILITY_USED: 'ability_used'
        };
        
        // Initialize event listeners
        Object.values(this.eventTypes).forEach(type => {
            this.eventListeners[type] = [];
        });
        
        console.log('GameBridge: Event system set up');
    }
    
    /**
     * Add an event listener for a game event
     * @param {string} eventType - The type of event to listen for
     * @param {Function} callback - The callback function to execute
     */
    addEventListener(eventType, callback) {
        if (!this.eventListeners[eventType]) {
            this.eventListeners[eventType] = [];
        }
        
        this.eventListeners[eventType].push(callback);
    }
    
    /**
     * Remove an event listener
     * @param {string} eventType - The type of event
     * @param {Function} callback - The callback function to remove
     */
    removeEventListener(eventType, callback) {
        if (!this.eventListeners[eventType]) return;
        
        const index = this.eventListeners[eventType].indexOf(callback);
        if (index !== -1) {
            this.eventListeners[eventType].splice(index, 1);
        }
    }
    
    /**
     * Dispatch a game event
     * @param {string} eventType - The type of event to dispatch
     * @param {Object} data - The data to pass to event listeners
     */
    dispatchEvent(eventType, data) {
        if (!this.eventListeners[eventType]) return;
        
        this.eventListeners[eventType].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`GameBridge: Error in event listener for ${eventType}`, error);
            }
        });
    }
    
    /**
     * Patch into BattleManager to receive battle events
     */
    patchBattleManager() {
        if (!this.battleManager) {
            console.error('GameBridge: BattleManager not available for patching');
            return;
        }
        
        // Store original functions
        const originalApplyDamage = this.battleManager.applyDamage;
        const originalApplyHealing = this.battleManager.applyHealing;
        const originalProcessAbility = this.battleManager.processAbility;
        const originalAddStatusEffect = this.battleManager.addStatusEffect;
        const originalStartBattle = this.battleManager.startBattle;
        const originalEndBattle = this.battleManager.endBattle;
        
        // Patch functions to add event dispatching
        const self = this;
        
        // Patch damage function
        this.battleManager.applyDamage = function(target, amount, source) {
            const result = originalApplyDamage.call(this, target, amount, source);
            
            // Dispatch event
            self.dispatchEvent(self.eventTypes.CHARACTER_DAMAGED, {
                target,
                amount,
                source,
                result
            });
            
            // Check for defeat
            if (target.stats.hp <= 0) {
                self.dispatchEvent(self.eventTypes.CHARACTER_DEFEATED, {
                    character: target,
                    source
                });
            }
            
            return result;
        };
        
        // Patch healing function
        this.battleManager.applyHealing = function(target, amount, source) {
            const result = originalApplyHealing.call(this, target, amount, source);
            
            // Dispatch event
            self.dispatchEvent(self.eventTypes.CHARACTER_HEALED, {
                target,
                amount,
                source,
                result
            });
            
            return result;
        };
        
        // Patch ability processing
        this.battleManager.processAbility = function(character, ability, targets) {
            const result = originalProcessAbility.call(this, character, ability, targets);
            
            // Dispatch event
            self.dispatchEvent(self.eventTypes.ABILITY_USED, {
                character,
                ability,
                targets,
                result
            });
            
            return result;
        };
        
        // Patch status effect application
        this.battleManager.addStatusEffect = function(target, effect, source) {
            const result = originalAddStatusEffect.call(this, target, effect, source);
            
            // Dispatch event
            self.dispatchEvent(self.eventTypes.STATUS_EFFECT_APPLIED, {
                target,
                effect,
                source,
                result
            });
            
            return result;
        };
        
        // Patch battle start
        this.battleManager.startBattle = function(playerTeam, enemyTeam) {
            const result = originalStartBattle.call(this, playerTeam, enemyTeam);
            
            // Dispatch event
            self.dispatchEvent(self.eventTypes.BATTLE_STARTED, {
                playerTeam,
                enemyTeam
            });
            
            return result;
        };
        
        // Patch battle end
        this.battleManager.endBattle = function(winner) {
            const result = originalEndBattle.call(this, winner);
            
            // Dispatch event
            self.dispatchEvent(self.eventTypes.BATTLE_ENDED, {
                winner,
                playerTeam: this.playerTeam,
                enemyTeam: this.enemyTeam
            });
            
            return result;
        };
        
        console.log('GameBridge: BattleManager patched for event dispatching');
    }
    
    /**
     * Patch into TeamManager to receive team events
     */
    patchTeamManager() {
        if (!this.teamManager) {
            console.error('GameBridge: TeamManager not available for patching');
            return;
        }
        
        // Store original functions
        const originalSetPlayerTeam = this.teamManager.setPlayerTeam;
        const originalSetCustomEnemyTeam = this.teamManager.setCustomEnemyTeam;
        
        // Patch functions to add event dispatching
        const self = this;
        
        // Patch player team setting
        this.teamManager.setPlayerTeam = function(team) {
            const result = originalSetPlayerTeam.call(this, team);
            
            // Dispatch event
            self.dispatchEvent(self.eventTypes.TEAM_UPDATED, {
                team: 'player',
                characters: team
            });
            
            return result;
        };
        
        // Patch enemy team setting
        this.teamManager.setCustomEnemyTeam = function(team) {
            const result = originalSetCustomEnemyTeam.call(this, team);
            
            // Dispatch event
            self.dispatchEvent(self.eventTypes.TEAM_UPDATED, {
                team: 'enemy',
                characters: team
            });
            
            return result;
        };
        
        console.log('GameBridge: TeamManager patched for event dispatching');
    }
    
    /**
     * Get player team from TeamManager
     * @returns {Array} The player team
     */
    getPlayerTeam() {
        return this.teamManager ? this.teamManager.playerTeam : [];
    }
    
    /**
     * Get enemy team from TeamManager
     * @returns {Array} The enemy team
     */
    getEnemyTeam() {
        return this.teamManager ? this.teamManager.enemyTeam : [];
    }
    
    /**
     * Start a battle with the current teams
     */
    startBattle() {
        if (!this.battleManager) {
            console.error('GameBridge: BattleManager not available for battle');
            return;
        }
        
        // Start the battle with current teams
        const playerTeam = this.getPlayerTeam();
        const enemyTeam = this.getEnemyTeam();
        
        this.battleManager.startBattle(playerTeam, enemyTeam);
    }
}
