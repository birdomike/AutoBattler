/**
 * BattleFlowController
 * Handles battle flow management separate from BattleManager
 * Part of BattleManager refactoring - Stage 3
 * Version 0.5.9 - 2025-05-20
 */

class BattleFlowController {
    /**
     * Create a new BattleFlowController
     * @param {BattleManager} battleManager - The BattleManager instance
     */
    constructor(battleManager) {
        console.log('[BattleFlowController] Initializing');
        this.battleManager = battleManager;
        
        // Register globally for testing/debugging
        window.battleFlowController = this;
    }
    
    /**
     * Enable the flow controller in the BattleManager
     * @returns {boolean} Success status
     */
    enableFlowController() {
        if (this.battleManager) {
            console.log("[BattleFlowController] Enabling flow controller");
            this.battleManager.useNewFlowController = true;
            return true;
        }
        return false;
    }
    
    /**
     * Disable the flow controller in the BattleManager
     * @returns {boolean} Success status
     */
    disableFlowController() {
        if (this.battleManager) {
            console.log("[BattleFlowController] Disabling flow controller");
            this.battleManager.useNewFlowController = false;
            return true;
        }
        return false;
    }
    
    /**
     * Starts a battle with the provided teams
     * @param {Array} playerTeam - Array of player characters
     * @param {Array} enemyTeam - Array of enemy characters
     * @returns {Promise<boolean>} Promise resolving to battle start success
     */
    async startBattle(playerTeam, enemyTeam) {
        console.log("[BattleFlowController] Starting battle");
        
        try {
            // 1. Preparation phase
            await this.prepareForBattle();
            
            // 2. Team preparation - delegate team preparation to BattleManager
            const preparedPlayerTeam = this.battleManager.prepareTeamForBattle(
                this.deepCopyTeam(playerTeam)
            );
            this.battleManager.playerTeam = preparedPlayerTeam;
            
            const preparedEnemyTeam = this.battleManager.prepareTeamForBattle(
                this.deepCopyTeam(enemyTeam)
            );
            this.battleManager.enemyTeam = preparedEnemyTeam;
            
            // 3. Reset battle state in BattleManager
            this.resetBattleState();
            
            // 4. Render UI (just delegate this operation to BattleManager)
            this.renderUI(preparedPlayerTeam, preparedEnemyTeam);
            
            // 5. Log battle start
            this.battleManager.logMessage('Battle started!');
            this.battleManager.logMessage(
                `${preparedPlayerTeam.length} heroes vs ${preparedEnemyTeam.length} enemies`
            );
            console.log('Battle started with teams:', preparedPlayerTeam, preparedEnemyTeam);
            
            // 6. Process battle start passive abilities
            this.processBattleStartPassives();
            
            // 7. Start first turn
            this.battleManager.startNextTurn();
            
            return true; // Battle started successfully
        } catch (error) {
            console.error("[BattleFlowController] Error starting battle:", error);
            return false; // Battle failed to start
        }
    }
    
    /**
     * Deep copies a team to prevent reference issues
     * @param {Array} team - Team to copy
     * @returns {Array} Deep copy of team
     * @private
     */
    deepCopyTeam(team) {
        if (!team || !Array.isArray(team)) {
            console.warn('[BattleFlowController] Invalid team provided, using empty array');
            return [];
        }
        return team.length > 0 ? JSON.parse(JSON.stringify(team)) : [];
    }
    
    /**
     * Prepares battle systems (status effects, behavior system)
     * @returns {Promise<void>}
     * @private
     */
    async prepareForBattle() {
        console.log("[BattleFlowController] Preparing battle systems");
        
        // Ensure status effect definitions are loaded
        if (!this.battleManager.statusEffectDefinitions) {
            try {
                await this.battleManager.loadStatusEffectDefinitions();
            } catch (error) {
                console.warn('[BattleFlowController] Status effect definitions not available, using fallback behavior:', error);
            }
        }
        
        // Ensure behavior system is initialized
        if (!this.battleManager.battleBehaviors) {
            try {
                await this.battleManager.initializeBehaviorSystem();
            } catch (error) {
                console.warn('[BattleFlowController] Behavior system not available, using legacy behavior:', error);
            }
        }
        
        // Ensure UI is initialized
        this.ensureUIInitialized();
    }
    
    /**
     * Ensures the appropriate UI is initialized based on uiMode
     * @private
     */
    ensureUIInitialized() {
        const uiMode = this.battleManager.uiMode;
        
        if (uiMode === "phaser") {
            console.log('[BattleFlowController] Using Phaser scene for battle visualization');
        } else if (!this.battleManager.battleUI || !this.battleManager.battleUI.isSetup) {
            console.log('[BattleFlowController] Initializing DOM UI for battle');
            try {
                // Create a BattleUI instance if it doesn't exist
                if (!this.battleManager.battleUI) {
                    if (typeof window.BattleUI === 'undefined') {
                        console.error('[BattleFlowController] BattleUI class is not defined! Cannot create BattleUI instance.');
                        throw new Error('BattleUI class is not defined!');
                    }
                    console.log('[BattleFlowController] Creating new DOM BattleUI instance');
                    this.battleManager.battleUI = new window.BattleUI(this.battleManager.scene, this.battleManager);
                }
                
                // Initialize the UI
                this.battleManager.battleUI.initialize();
            } catch (error) {
                console.error('[BattleFlowController] Failed to initialize BattleUI:', error);
                throw error;
            }
        }
    }
    
    /**
     * Resets battle state variables in BattleManager
     * @private
     */
    resetBattleState() {
        console.log("[BattleFlowController] Resetting battle state");
        
        // Reset core battle state variables
        this.battleManager.currentTurn = 0;
        this.battleManager.battleActive = true;
        this.battleManager.isPaused = false;
        this.battleManager.activeCharacterIndex = 0;
        this.battleManager.actionQueue = [];
        this.battleManager.turnActions = [];
        this.battleManager.turnInProgress = false;
        this.battleManager.statusEffects = {};
        
        // Initialize passive trigger tracking at battle level
        this.battleManager.passiveTriggersThisBattle = new Map();
    }
    
    /**
     * Renders characters in the UI
     * @param {Array} playerTeam - Prepared player team
     * @param {Array} enemyTeam - Prepared enemy team
     * @private
     */
    renderUI(playerTeam, enemyTeam) {
        console.log("[BattleFlowController] Rendering characters in UI");
        
        // Delegate to BattleManager's UI for DOM mode
        if (this.battleManager.uiMode !== "phaser" && this.battleManager.battleUI) {
            this.battleManager.battleUI.renderCharacters(playerTeam, enemyTeam);
        }
        
        // For Phaser UI, dispatch event through BattleBridge
        if (this.battleManager.uiMode === "phaser" && window.battleBridge) {
            try {
                // Dispatch BATTLE_STARTED event with team data
                window.battleBridge.dispatchEvent(
                    window.battleBridge.eventTypes.BATTLE_STARTED, 
                    { 
                        playerTeam, 
                        enemyTeam 
                    }
                );
                console.log('[BattleFlowController] Dispatched BATTLE_STARTED event for Phaser UI');
            } catch (error) {
                console.error('[BattleFlowController] Error dispatching BATTLE_STARTED event:', error);
            }
        }
    }
    
    /**
    * Processes battle start passive abilities
    * @private
    */
processBattleStartPassives() {
    console.log("[BattleFlowController] Processing battle start passive abilities");
    
    const allCharacters = [
    ...this.battleManager.playerTeam, 
    ...this.battleManager.enemyTeam
    ];
    
    allCharacters.forEach(character => {
    // Enhanced validation before processing passives
    if (!character) {
    console.warn("[BattleFlowController] Skipping null character reference in battle start passives");
    return;
    }
    
    // Validate character has required properties
    if (!character.name) {
    console.warn(`[BattleFlowController] Character missing name property in battle start passives`);
    return;
    }
    
    // Check character is alive
    if (character.currentHp <= 0 || character.isDead) {
    console.debug(`[BattleFlowController] Skipping passive processing for defeated character: ${character.name}`);
    return;
    }
    
    // Check character has passives to process
    if (!Array.isArray(character.passiveAbilities) || character.passiveAbilities.length === 0) {
    console.debug(`[BattleFlowController] Character has no passive abilities: ${character.name}`);
    return;
    }
    
    // All validation passed, process passive abilities
    this.battleManager.processPassiveAbilities('onBattleStart', character);
    });
}

/**
 * Start the next turn in the battle sequence
 * @returns {boolean} Success status
 */
startNextTurn() {
    console.log("[BattleFlowController] Starting next turn");
    
    try {
        // 1. Increment turn counter
        this.battleManager.currentTurn++;
        
        // 2. Mark turn as in progress
        this.battleManager.turnInProgress = true;
        
        // 3. Process status effects
        this.battleManager.processStatusEffects();
        
        // 4. Process turn start passive abilities
        this.processTurnStartPassives();
        
        // 5. Generate actions for all characters
        this.battleManager.generateTurnActions();
        
        // 6. Start executing actions
        if (this.battleManager.actionQueue && this.battleManager.actionQueue.length > 0) {
            // Log the new turn
            this.battleManager.logMessage(`Turn ${this.battleManager.currentTurn} begins!`, 'info');
            
            // Execute the first action
            setTimeout(() => {
                if (!this.battleManager.isPaused) {
                    this.executeNextAction();
                }
            }, 1000);
            
            return true;
        } else {
            // No actions to execute
            console.warn("[BattleFlowController] No actions to execute in turn");
            this.finishTurn();
            return false;
        }
    } catch (error) {
        console.error("[BattleFlowController] Error starting next turn:", error);
        return false;
    }
}

/**
 * Process turn start passive abilities for all characters
 * @private
 */
processTurnStartPassives() {
    console.log("[BattleFlowController] Processing turn start passive abilities");
    
    const allCharacters = [
        ...this.battleManager.playerTeam, 
        ...this.battleManager.enemyTeam
    ];
    
    allCharacters.forEach(character => {
        // Skip if character is invalid or defeated
        if (!character || character.isDead || character.currentHp <= 0) {
            return;
        }
        
        // Process turn start passives
        this.battleManager.processPassiveAbilities('onTurnStart', character);
    });
}

/**
 * Execute the next action in the queue
 * @returns {boolean} Success status
 */
executeNextAction() {
    console.log("[BattleFlowController] Executing next action");
    
    try {
        // Check if battle is paused
        if (this.battleManager.isPaused) {
            console.log("[BattleFlowController] Battle is paused, not executing action");
            return false;
        }
        
        // Check if there are actions to execute
        if (!this.battleManager.actionQueue || this.battleManager.actionQueue.length === 0) {
            console.log("[BattleFlowController] No more actions in queue, finishing turn");
            this.finishTurn();
            return false;
        }
        
        // Get the next action
        const action = this.battleManager.actionQueue.shift();
        
        // Check if actor is still alive
        if (action.actor.isDead || action.actor.currentHp <= 0) {
            console.log(`[BattleFlowController] Actor ${action.actor.name} is defeated, skipping action`);
            this.executeNextAction();
            return false;
        }
        
        // Apply the action
        this.battleManager.applyActionEffect(action);
        
        // Schedule next action or finish turn
        setTimeout(() => {
            if (!this.battleManager.isPaused) {
                // Check if battle has ended
                if (this.battleManager.checkBattleEnd()) {
                    console.log("[BattleFlowController] Battle has ended during action execution");
                    return;
                }
                
                // Execute next action or finish turn
                if (this.battleManager.actionQueue && this.battleManager.actionQueue.length > 0) {
                    this.executeNextAction();
                } else {
                    this.finishTurn();
                }
            }
        }, this.battleManager.actionDelay);
        
        return true;
    } catch (error) {
        console.error("[BattleFlowController] Error executing action:", error);
        return false;
    }
}

/**
 * Finish the current turn
 * @returns {boolean} Success status
 */
finishTurn() {
    console.log("[BattleFlowController] Finishing turn");
    
    try {
        // Mark turn as not in progress
        this.battleManager.turnInProgress = false;
        
        // Clear action queues
        this.battleManager.actionQueue = [];
        this.battleManager.turnActions = [];
        
        // Display turn summary
        this.battleManager.displayTurnSummary();
        
        // Check if battle has ended
        if (this.battleManager.checkBattleEnd()) {
            console.log("[BattleFlowController] Battle has ended after turn completion");
            return true;
        }
        
        // Start next turn after delay
        setTimeout(() => {
            if (!this.battleManager.isPaused && this.battleManager.battleActive) {
                this.battleManager.startNextTurn();
            }
        }, this.battleManager.turnDelay);
        
        return true;
    } catch (error) {
        console.error("[BattleFlowController] Error finishing turn:", error);
        return false;
    }
}
}

// Make the class globally available
window.BattleFlowController = BattleFlowController;

// Log that the file has been loaded
console.log('BattleFlowController.js: Loaded and registered globally');
