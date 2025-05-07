/**
 * Battle Manager
 * Controls the flow of battle and combat logic
 */

class BattleManager {
    /**
     * Create a new Battle Manager
     * @param {Phaser.Scene} scene - The Phaser scene for the battle
     * @param {string} battleLogId - ID of the HTML element for battle log
     */
    constructor(scene, battleLogId) {
        this.scene = scene;
        this.battleLogId = battleLogId;
        this.playerTeam = [];
        this.enemyTeam = [];
        this.currentTurn = 0;
        this.isAutoBattle = true;
        this.battleActive = false;
        this.isPaused = false;
        this.turnDelay = 6000; // Delay between turns (ms) - doubled from 3000ms for slower pace
        this.actionDelay = 3200; // Delay between actions (ms) - doubled from 1600ms for slower pace
        this.speedMultiplier = 1; // Battle speed (1x, 2x, 4x)
        this.battleUI = null;
        this.turnTimer = null;
        this.activeCharacterIndex = 0;
        this.actionQueue = [];
        this.turnActions = [];
        this.turnInProgress = false;
        this.battleBehaviors = null; // Will hold the behavior system when loaded
        this.uiMode = "dom"; // UI mode: "dom" or "phaser"
        
        // Create a simple teamManager for compatibility with behavior system
        this.teamManager = {
            getCharacterTeam: (character) => character.team
        };

        // REFACTORING: Component manager references

        // REFACTORING: References to component managers
        this.battleFlowController = null;
        this.battleInitializer = null;
        this.statusEffectManager = null;
        this.statusEffectDefinitionLoader = null;
        this.damageCalculator = null;
        this.healingProcessor = null;
        this.typeEffectivenessCalculator = null;
        this.abilityProcessor = null;
        this.actionGenerator = null;
        this.targetingSystem = null;
        this.passiveAbilityManager = null;
        this.passiveTriggerTracker = null;
        this.battleEventDispatcher = null;
        this.battleLogManager = null;
    }
    
    /**
     * Display a summary of all characters' health at the end of a turn
     * @returns {boolean} True if summary was displayed successfully
     */
    displayTurnSummary() {
        // Direct delegation - no toggle mechanism for streamlined implementation
        if (this.battleLogManager) {
            return this.battleLogManager.displayTurnSummary();
        }
        
        // Minimal fallback with warning
        console.warn("[BattleManager] BattleLogManager not available, cannot display turn summary");
        return false;
    }
    

    
    /**
     * Initialize all component managers in proper dependency order
     */
    async initializeComponentManagers() {
        console.log('BattleManager: Initializing component managers...');
        
        // 1. First initialize core dependencies (status effect system)
        if (window.StatusEffectDefinitionLoader) {
            this.statusEffectLoader = new window.StatusEffectDefinitionLoader();
            console.log('BattleManager: StatusEffectDefinitionLoader initialized');
            
            // Only initialize StatusEffectManager if loader is available
            if (window.StatusEffectManager) {
                this.statusEffectManager = new window.StatusEffectManager(this, this.statusEffectLoader);
                console.log('BattleManager: StatusEffectManager initialized');
            }
        }
        
        // 1a. Initialize BattleInitializer (required component)
        if (window.BattleInitializer) {
            this.battleInitializer = new window.BattleInitializer(this);
            console.log('BattleManager: BattleInitializer initialized');
        } else {
            console.error('BattleManager: BattleInitializer not found on global window object. CRITICAL: Battle initialization will fail.');
            throw new Error('BattleInitializer is required but not available');
        }
        
        // 2. Initialize BattleFlowController (required component)
        if (window.BattleFlowController) {
            this.battleFlowController = new window.BattleFlowController(this);
            console.log('BattleManager: BattleFlowController component initialized');
        } else {
            console.error('BattleManager: BattleFlowController not found on global window object');
            throw new Error('BattleFlowController is required but not available');
        }
        
        // 3. Initialize type effectiveness calculator
        if (window.TypeEffectivenessCalculator) {
            this.typeEffectivenessCalculator = new window.TypeEffectivenessCalculator(this);
            console.log('BattleManager: TypeEffectivenessCalculator initialized');
            

        }
        
        // 4. Initialize damage calculator
        // Note: Initialize after TypeEffectivenessCalculator to maintain dependency order
        if (window.DamageCalculator) {
            this.damageCalculator = new window.DamageCalculator(this);
            console.log('BattleManager: DamageCalculator initialized');
            

        }
        
        // 5. Initialize healing processor
        if (window.HealingProcessor) {
            this.healingProcessor = new window.HealingProcessor(this);
            console.log('BattleManager: HealingProcessor initialized');
            

        }
        
        // 6. Initialize ability processor
        if (window.AbilityProcessor) {
            this.abilityProcessor = new window.AbilityProcessor(this);
            console.log('BattleManager: AbilityProcessor initialized');
            

        }
        
        // 7. Initialize passive system components
        if (window.PassiveTriggerTracker) {
            this.passiveTriggerTracker = new window.PassiveTriggerTracker();
            console.log('BattleManager: PassiveTriggerTracker initialized');
            

        }
        
        // Initialize PassiveAbilityManager (after PassiveTriggerTracker)
        if (window.PassiveAbilityManager) {
            this.passiveAbilityManager = new window.PassiveAbilityManager(this, this.passiveTriggerTracker);
            console.log('BattleManager: PassiveAbilityManager initialized');
            

        }
        
        // 7. Initialize targeting system
        if (window.TargetingSystem) {
            this.targetingSystem = new window.TargetingSystem(this);
            console.log('BattleManager: TargetingSystem initialized');
            

        }
        
        // 8. Initialize action generator
        if (window.ActionGenerator) {
            this.actionGenerator = new window.ActionGenerator(this);
            console.log('BattleManager: ActionGenerator initialized');
            

        }
        
        // 9. Initialize event dispatcher (Stage 7)
        if (window.BattleEventDispatcher) {
            this.battleEventDispatcher = new window.BattleEventDispatcher(this);
            console.log('BattleManager: BattleEventDispatcher initialized');
            

        }
        
        // 10. Initialize battle log manager (Stage 7) - must be after event dispatcher
        if (window.BattleLogManager) {
            this.battleLogManager = new window.BattleLogManager(this, this.battleEventDispatcher);
            console.log('BattleManager: BattleLogManager initialized');
            

        }
    }
    
    /**
     * Load status effect definitions from JSON file
     * This method now simply delegates to the StatusEffectDefinitionLoader's primeDefinitions method.
     * @returns {Promise<boolean>} Success status
     */
    async loadStatusEffectDefinitions() {
        // Check if the loader is available
        if (!this.statusEffectLoader) {
            console.error('[BattleManager] StatusEffectDefinitionLoader not available! This is a critical error.');
            return false;
        }
        
        // Check if the loader has the expected method
        if (typeof this.statusEffectLoader.primeDefinitions !== 'function') {
            console.error('[BattleManager] StatusEffectDefinitionLoader is missing primeDefinitions method! This is a critical error.');
            return false;
        }
        
        // Log delegation
        console.log('[BattleManager] Delegating status effect loading to StatusEffectDefinitionLoader');
        
        try {
            // Call the loader's primeDefinitions method which handles both JSON loading and fallbacks
            await this.statusEffectLoader.primeDefinitions();
            return true;
        } catch (error) {
            console.error('[BattleManager] Error during status effect definition loading:', error);
            return false;
        }
    }
    
    // setupFallbackStatusEffects method has been removed - StatusEffectDefinitionLoader now handles all fallbacks internally

    /**
     * Initialize the battle manager
     */
    async initialize() {
        console.log('BattleManager: Initializing...');
        
        // REFACTORING: Initialize component managers
        try {
            // Initialize component managers in dependency order
            await this.initializeComponentManagers();
            
            // Component initialization completed
            console.log('BattleManager: Components initialized successfully');
        } catch (error) {
            console.error('BattleManager: Error initializing component managers:', error);
        }
        
        try {
            // Load status effect definitions via the StatusEffectDefinitionLoader
            await this.loadStatusEffectDefinitions();
            console.log('BattleManager: Status effect definitions loaded');
            
            // Initialize behavior system if available
            try {
                await this.initializeBehaviorSystem();
                console.log('BattleManager: Behavior system initialized');
            } catch (error) {
                console.warn('BattleManager: Behavior system not available, using legacy behavior:', error);
            }
                        
            console.log('BattleManager: Initialized');
        } catch (e) {
            console.error('Error initializing battle UI:', e);
            
            // Try a fallback approach for debugging
            console.log('Checking available UI classes:', {
                'window.BattleUI': typeof window.BattleUI,
                'global BattleUI': typeof BattleUI
            });
        }
    }
    
    /**
     * Force initialization of character stats and properties
     * @param {Array} team - Team of characters to initialize
     * @param {string} teamType - 'player' or 'enemy'
     * @returns {Array} Initialized team
     */
    ensureCompleteCharacterInitialization(team, teamType) {
        // Facade method that delegates to BattleInitializer
        if (this.battleInitializer) {
            return this.battleInitializer.ensureCompleteCharacterInitialization(team, teamType);
        }
        
        // This should not happen since we throw an error during initialization if BattleInitializer is missing
        console.error(`[BattleManager] CRITICAL ERROR: BattleInitializer not available for character initialization (${teamType})`);
        return []; // Return empty array as a last resort
    }

    /**
     * Start a battle with the given teams, with enhanced initialization
     * @param {Array} rawPlayerTeam - Array of player characters
     * @param {Array} rawEnemyTeam - Array of enemy characters
     */
    async startBattle(rawPlayerTeam, rawEnemyTeam) {
        // Use BattleInitializer to initialize teams
        if (this.battleInitializer) {
            const initializedTeams = this.battleInitializer.initializeTeamsAndCharacters(rawPlayerTeam, rawEnemyTeam);
            this.playerTeam = initializedTeams.playerTeam;
            this.enemyTeam = initializedTeams.enemyTeam;
        } else {
            // This should not happen since we throw an error during initialization if BattleInitializer is missing
            console.error("[BattleManager] CRITICAL ERROR: BattleInitializer not available for team initialization");
            throw new Error("BattleInitializer is required for battle initialization");
        }
        
        console.log(`[BattleManager] Starting battle with ${this.playerTeam.length} player characters and ${this.enemyTeam.length} enemy characters`);
        
        // Continue with normal battle flow via BattleFlowController
        return this.battleFlowController.startBattle(this.playerTeam, this.enemyTeam);
    }
    
    /**
     * Start the next turn
     */
    startNextTurn() {
        // Reset passive trigger tracking for the new turn
        if (this.passiveTriggerTracker) {
            this.passiveTriggerTracker.resetTurnTracking();
        } else {
            console.warn("[BattleManager] PassiveTriggerTracker not available for turn reset");
        }
        

        return this.battleFlowController.startNextTurn();
    }
    
    /**
     * Execute the next action in the queue
     */
    executeNextAction() {
        // Delegate to the flow controller
        return this.battleFlowController.executeNextAction();
    }
    
    /**
     * Apply the effect of an action to its target
     * @param {Object} action - The action to apply
     */
    applyActionEffect(action) {
        // Delegate to the ability processor if available
        if (this.abilityProcessor) {
            // Delegate directly to the component for a clean implementation
            return this.abilityProcessor.applyActionEffect(action);
        }


        console.warn("BattleManager using legacy applyActionEffect - AbilityProcessor not available");
        return this.battleFlowController.applyActionEffect(action);
    }
    
    /**
     * Finish the current turn
     */
    finishTurn() {
        // Delegate to the flow controller
        return this.battleFlowController.finishTurn();
    }
    
    /**
     * Apply damage to a character - delegated to DamageCalculator component
     * @param {Object} target - Character receiving damage
     * @param {number} amount - Amount of damage
     * @param {Object} source - Character causing damage (optional)
     * @param {Object} ability - Ability used (optional)
     * @param {string} damageType - Type of damage (default: 'passive')
     * @returns {Object} - Object with actualDamage and killed properties
     */
    applyDamage(target, amount, source = null, ability = null, damageType = 'passive') {
        // Defensive validation (match original method's early returns)
        if (!target || target.isDead || target.currentHp <= 0 || amount <= 0) {
            return { actualDamage: 0, killed: false };
        }
        
        // Ensure DamageCalculator is available
        if (!this.damageCalculator) {
            console.error("DamageCalculator not initialized! Falling back to minimal damage application.");
            
            // Minimal fallback implementation to prevent game crashes
            const previousHp = target.currentHp;
            target.currentHp = Math.max(0, target.currentHp - amount);
            const actualDamage = previousHp - target.currentHp;
            const killed = previousHp > 0 && target.currentHp <= 0;
            
            this.logMessage(`${target.name} takes ${actualDamage} damage! (HP: ${target.currentHp}/${target.stats.hp})`, 'error');
            
            return { actualDamage, killed };
        }
        
        // Delegate to the specialized calculator component
        return this.damageCalculator.applyDamage(target, amount, source, ability, damageType);
    }
    
    /**
     * Check if the battle is over
     * @returns {boolean} True if the battle is over
     */
    checkBattleEnd() {
        // Delegate to the flow controller
        return this.battleFlowController.checkBattleEnd();
    }    
    
    /**
     * Prepare a team for battle by setting initial values
     * @param {Array} team - Array of character objects
     * @returns {Array} - Prepared team for battle
     */
    prepareTeamForBattle(team) {
        // Determine team type based on current context
        const isPlayerTeam = !this.playerTeam || this.playerTeam.length === 0 || 
                          (this.playerTeam.length > 0 && this.enemyTeam && this.enemyTeam.length > 0);
        const teamType = isPlayerTeam ? 'player' : 'enemy';
        
        // Facade method that delegates to BattleInitializer with explicit teamType
        if (this.battleInitializer) {
            return this.battleInitializer.prepareTeamForBattle(team, teamType);
        }
        
        // This should not happen since we throw an error during initialization if BattleInitializer is missing
        console.error(`[BattleManager] CRITICAL ERROR: BattleInitializer not available for team preparation (${teamType})`);
        return []; // Return empty array as a last resort
    }
    
    /**
     * Generate a unique ID for a character
     * @returns {string} A unique ID
     */
    generateCharacterId() {
        // Facade method that delegates to BattleInitializer
        if (this.battleInitializer) {
            return this.battleInitializer.generateCharacterId();
        }
        
        // Safe fallback implementation that can be used even if BattleInitializer is missing
        console.warn("[BattleManager] BattleInitializer not available for ID generation, using fallback");
        return 'char_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Process status effects for all characters
     * @returns {boolean} - True if status effects were processed successfully
     */
    processStatusEffects() {
        // Defensive check
        if (!this.statusEffectManager) {
            console.error("StatusEffectManager not initialized! Cannot process status effects.");
            return false;
        }
        
        // Process status effects for all characters in both teams
        [...this.playerTeam, ...this.enemyTeam].forEach(character => {
            if (character.currentHp > 0) {
                this.statusEffectManager.processStatusEffects(character);
            }
        });
        
        return true;
    }
    
    /**
     * Add a status effect to a character
     * @param {Object} character - Character to affect
     * @param {string} statusId - ID of the status effect
     * @param {Object|null} source - Character causing the effect (or null if no specific source)
     * @param {number} duration - Number of turns the effect lasts 
     * @param {number} stacks - Number of stacks to apply (default: 1)
     * @returns {boolean} - True if effect was successfully applied
     */
    addStatusEffect(character, statusId, source, duration, stacks = 1) {
        // Defensive check
        if (!this.statusEffectManager) {
            console.error("StatusEffectManager not initialized! Cannot add status effect.");
            return false;
        }
        
        // Ensure duration is a number
        if (typeof duration !== 'number') {
            console.warn(`[BattleManager] Invalid duration parameter (${typeof duration}) in addStatusEffect for '${statusId}' - using default 3`);
            duration = 3; // Default duration
        }
        
        // Ensure stacks is a number
        if (typeof stacks !== 'number') {
            console.warn(`[BattleManager] Invalid stacks parameter (${typeof stacks}) in addStatusEffect for '${statusId}' - using default 1`);
            stacks = 1; // Default stacks
        }
        
        // Direct delegation with validated parameters
        return this.statusEffectManager.addStatusEffect(character, statusId, source, duration, stacks);
    }
    
    /**
     * Update status icons for a character
     * @param {Object} character - Character to update icons for
     * @returns {boolean} - True if icons were successfully updated
     */
    updateStatusIcons(character) {
        // Defensive check
        if (!this.statusEffectManager) {
            console.error("StatusEffectManager not initialized! Cannot update status icons.");
            return false;
        }
        
        // Direct delegation
        return this.statusEffectManager.updateStatusIcons(character);
    }
    
    /**
     * Generate a set of actions for the current turn
     */
    generateTurnActions() {
        // For each living character, generate an action
        // First player team actions
        this.playerTeam.forEach(character => {
            if (character.currentHp > 0) {
                const action = this.generateCharacterAction(character, 'player');
                if (action) this.turnActions.push(action);
            }
        });
        
        // Then enemy team actions
        this.enemyTeam.forEach(character => {
            if (character.currentHp > 0) {
                const action = this.generateCharacterAction(character, 'enemy');
                if (action) this.turnActions.push(action);
            }
        });
        
        // Sort actions by speed (highest speed goes first)
        this.turnActions.sort((a, b) => {
            return b.actor.stats.speed - a.actor.stats.speed;
        });
        
        // Queue up the actions
        this.actionQueue = [...this.turnActions];
    }
    
    /**
     * Import the behavior system if it wasn't already imported
     * This allows backward compatibility with existing code
     */
    async initializeBehaviorSystem() {
        if (!this.battleBehaviors) {
            try {
                // Try dynamic import if ESM is supported
                // Check if the file exists at various potential locations
                console.log('Attempting to load Battle Behaviors system...');
                let module;
                try {
                    module = await import('../battle_logic/BattleBehaviors.js');
                    console.log('Loaded BattleBehaviors from ../battle_logic/BattleBehaviors.js');
                } catch (e) {
                    console.warn('Failed to load from ../battle_logic/', e.message);
                    try {
                        module = await import('/js/battle_logic/BattleBehaviors.js');
                        console.log('Loaded BattleBehaviors from /js/battle_logic/BattleBehaviors.js');
                    } catch (e2) {
                        console.warn('Failed to load from absolute path', e2.message);
                        throw e2;
                    }
                }
                
                this.battleBehaviors = module.default;
                console.log('Battle Behaviors system loaded successfully');
            } catch (error) {
                // Fallback to global if already loaded via script tag
                if (window.battleBehaviors) {
                    this.battleBehaviors = window.battleBehaviors;
                    console.log('Battle Behaviors system loaded from window');
                } else {
                    console.warn('Battle Behaviors system not available:', error);
                    console.log('Using default behavior when system is not available');
                    // Create a simple default behavior system
                    this.battleBehaviors = {
                        hasBehavior: (name) => false,
                        decideAction: (name, context) => null,
                        selectTarget: (name, context) => {
                            // Simple targeting - find living enemy
                            const targets = context.potentialTargets.filter(t => 
                                t.team !== context.actor.team && t.currentHp > 0
                            );
                            return targets.length > 0 ? targets[0] : null;
                        },
                        getDefaultActionDecisionBehavior: () => 'defaultActionDecision',
                        getDefaultTargetingBehavior: () => 'defaultTargeting',
                        getTargetingBehaviorFromType: (type) => 'defaultTargeting'
                    };
                }
            }
        }
        return this.battleBehaviors;
    }
    
    /**
     * Generate an action for a character
     * @param {Object} character - The character
     * @param {string} team - 'player' or 'enemy'
     * @returns {Object|null} The action or null
     */
    generateCharacterAction(character, team) {
        // Delegate to the action generator if available
        if (this.actionGenerator) {
            return this.actionGenerator.generateCharacterAction(character, team);
        }
        

        console.warn("BattleManager using legacy generateCharacterAction - ActionGenerator not available");
        
        // Safe fallback: return null (no action) if ActionGenerator not available
        return null;
    }
    
    /**
     * Apply a random status effect to a character
     * @param {Object} target - The character to affect
     */
    applyRandomStatusEffect(target) {
        // Delegate to the ability processor if available
        if (this.abilityProcessor) {
            return this.abilityProcessor.applyRandomStatusEffect(target);
        }
        

        console.warn("BattleManager using legacy applyRandomStatusEffect - AbilityProcessor not available");
        return false;
    }
    
    /**
     * Process a single effect from an ability's effects array
     * @param {Object} effect - The effect to process
     * @param {Object} actor - The character using the ability
     * @param {Object} target - The target of the effect
     * @param {Object} ability - The ability being used
     */
    processEffect(effect, actor, target, ability) {
        // Delegate to the ability processor if available
        if (this.abilityProcessor) {
            return this.abilityProcessor.processEffect(effect, actor, target, ability);
        }
        

        console.warn("BattleManager using legacy processEffect - AbilityProcessor not available");
        return false;
    }
    
    /**
     * Calculate damage for an action.
     * Delegates calculation to DamageCalculator component.
     * @param {Object} attacker - The attacking character
     * @param {Object} target - The target character
     * @param {Object|null} ability - The ability used (if any)
     * @param {Object|null} effect - The specific effect from an ability (if any)
     * @returns {Object} - Complete damage calculation result with metadata
     * @see DamageCalculator for implementation details
     */
    calculateDamage(attacker, target, ability, effect = null) {
        // Defensive check - ensure DamageCalculator is available
        if (!this.damageCalculator) {
            console.error("DamageCalculator component not found during delegation in BattleManager!");
            // Return a safe default object matching the expected structure
            return { 
                damage: 0, 
                scalingText: '', 
                scalingStat: 0, 
                scalingStatName: '', 
                damageType: ability ? (ability.damageType || 'physical') : 'physical',
                isCritical: false,
                typeMultiplier: 1
            };
        }
        
        // Direct delegation to DamageCalculator - no adapter wrapper needed now that it returns the full object
        return this.damageCalculator.calculateDamage(attacker, target, ability, effect);
    }
    
   /**
     * Calculate type advantage multiplier.
     * Delegates calculation to the TypeEffectivenessCalculator component.
     * @param {string} attackerType - Attacker's type
     * @param {string} defenderType - Defender's type
     * @returns {number} Damage multiplier (1.5 for advantage, 0.75 for disadvantage, 1.0 otherwise)
     * @see TypeEffectivenessCalculator for implementation details
     */
    calculateTypeMultiplier(attackerType, defenderType) {
        // Delegate directly to the component
        if (this.typeEffectivenessCalculator) {
             // Call the method on the initialized component instance
             return this.typeEffectivenessCalculator.calculateTypeMultiplier(attackerType, defenderType);
        } else {
             // Fallback if the component wasn't properly initialized (should not happen in normal flow)
             console.error("TypeEffectivenessCalculator component not found during delegation in BattleManager!");
             // Return a neutral multiplier as a safe default
             return 1.0;
        }
    }
    
    /**
     * Process passive abilities for a specific trigger event
     * @param {string} trigger - The trigger event (e.g., 'onTurnStart', 'onDamageTaken')
     * @param {Object} character - The character whose passives should be checked
     * @param {Object} additionalData - Additional context data for the passive
     * @returns {Array} Array of executed passive results
     */
    processPassiveAbilities(trigger, character, additionalData = {}) {
        // Delegate to PassiveAbilityManager if available
        if (this.passiveAbilityManager) {
            return this.passiveAbilityManager.processPassiveAbilities(trigger, character, additionalData);
        }
        
        // Fallback with warning if PassiveAbilityManager is not available
        console.warn("[BattleManager] PassiveAbilityManager not available for processing passive abilities");
        return []; // Return empty results as fallback
    }
    
    /**
     * Toggle pause state
     * @returns {boolean} - New pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            // Clear any pending turn timer
            if (this.turnTimer) {
                clearTimeout(this.turnTimer);
                this.turnTimer = null;
            }
            this.logMessage('Battle paused', 'info');
        } else {
            // Resume battle
            this.logMessage('Battle resumed', 'info');
            if (!this.turnInProgress) {
                this.startNextTurn();
            } else {
                this.executeNextAction();
            }
        }
        
        return this.isPaused;
    }
    
    /**
     * Pause the battle
     * @returns {boolean} - Current pause state (should be true)
     */
    pauseBattle() {
        if (!this.isPaused) {
            // Only log and clear timer if we're actually changing state
            this.isPaused = true;
            
            // Clear any pending turn timer
            if (this.turnTimer) {
                clearTimeout(this.turnTimer);
                this.turnTimer = null;
            }
            this.logMessage('Battle paused', 'info');
        }
        
        return this.isPaused;
    }
    
    /**
     * Resume the battle
     * @returns {boolean} - Current pause state (should be false)
     */
    resumeBattle() {
        if (this.isPaused) {
            // Only log and restart if we're actually changing state
            this.isPaused = false;
            
            this.logMessage('Battle resumed', 'info');
            if (!this.turnInProgress) {
                this.startNextTurn();
            } else { 
                this.executeNextAction();
            }
        }
        
        return this.isPaused;
    }
    
    /**
     * Set battle speed
     * @param {number} multiplier - Speed multiplier (1, 2, or 3)
     */
    setSpeed(multiplier) {
        const validMultipliers = [1, 2, 3]; // Match UI options
        if (validMultipliers.includes(multiplier)) {
            // Store previous and new value for comparison
            const previousSpeed = this.speedMultiplier;
            this.speedMultiplier = multiplier;
            
            // Base timing values - doubled from original values for slower pace
            const BASE_TURN_DELAY = 6000;
            const BASE_ACTION_DELAY = 3200;
            
            // Update timing values
            this.turnDelay = BASE_TURN_DELAY / multiplier;
            this.actionDelay = BASE_ACTION_DELAY / multiplier;
            
            // Log speed change if it actually changed
            if (previousSpeed !== multiplier) {
                this.logMessage(`Battle speed set to ${multiplier}x`, 'info');
            }
            
            // Notify UI components via bridge
            if (window.battleBridge && this.uiMode === "phaser") {
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_UI_INTERACTION, {
                    action: 'speed_change',
                    speed: multiplier,
                    previousSpeed: previousSpeed,
                    turnDelay: this.turnDelay,
                    actionDelay: this.actionDelay
                });
            }
        }
    }
    
    /**
     * Log a message to the battle log
     * @param {string} message - The message to log
     * @param {string} type - The type of message (default, info, success, action, error)
     * @returns {boolean} True if logged successfully
     */
    logMessage(message, type = 'default') {
        // Direct delegation - no toggle mechanism for streamlined implementation
        if (this.battleLogManager) {
            return this.battleLogManager.logMessage(message, type);
        }
        
        // Minimal fallback implementation (no original implementation preserved)
        console.warn(`[BattleManager] BattleLogManager not available, using minimal logging`);
        console.log(`[BattleLog ${type}]: ${message}`);
        
        // Try direct UI or battleBridge communication as last resort
        if (window.battleBridge) {
            try {
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_LOG || 'BATTLE_LOG', {
                    message: message,
                    type: type
                });
            } catch (error) {
                console.error('[BattleManager] Error dispatching log event:', error);
            }
        }
        
        // Add to DOM battle log if in DOM mode and battleUI is available
        if (this.uiMode === "dom" && this.battleUI && typeof this.battleUI.addLogMessage === 'function') {
            try {
                this.battleUI.addLogMessage(message, type);
            } catch (error) {
                console.error('Error adding message to battle UI:', error);
            }
        }
        
        return false;
    }
    
   /**
     * End the battle
     * @param {string} result - Battle result ('victory', 'defeat', 'draw')
     */
    endBattle(result) {
        // Delegate to the flow controller
        this.battleFlowController.endBattle(result);
    }
    
    /**
     * Check if character was dead but now has HP, and reset death status if needed
     * @param {Object} character - The character to check
     * @returns {boolean} - True if character was revived, false otherwise
     */
    checkAndResetDeathStatus(character) {
        // Delegate to HealingProcessor if available
        if (this.healingProcessor) {
            return this.healingProcessor.checkAndResetDeathStatus(character);
        }
        
        // Original implementation
        // If character was marked as dead but now has HP, reset death status
        if (character.isDead && character.currentHp > 0) {
            character.isDead = false;
            // Add team identifier for clarity
            const teamIdentifier = character.team === 'player' ? ' (ally)' : ' (enemy)';
            this.logMessage(`${character.name}${teamIdentifier} has been revived!`, 'success');
            
            // Update UI if present
            if (this.battleUI) {
                this.battleUI.updateCharacterHealth(character, 0, true);
            }
            
            return true; // Character was revived
        }
        
        return false; // No revival occurred
    }
    
    /**
     * Apply direct healing to a target (for passive abilities, etc.).
     * This method acts as a facade, delegating core logic to HealingProcessor
     * and handling subsequent side effects like logging and passive triggers.
     * @param {Object} target - The character receiving healing
     * @param {number} amount - Amount of healing to apply
     * @param {Object} source - Character causing the healing (optional)
     * @param {Object} ability - Ability associated with the healing (optional)
     * @param {string} healType - Type of healing (e.g., 'passive', 'regen') (optional)
     * @returns {Object} - Result containing { healing: number, revived: boolean }
     */
    applyHealing(target, amount, source = null, ability = null, healType = 'passive') {
        // 1. Ensure HealingProcessor component is available
        if (!this.healingProcessor) {
            console.error('[BattleManager Utility] HealingProcessor component not found! Cannot apply direct healing.');
            // Return default object structure matching original utility method's format
            return { healing: 0, revived: false };
        }

        // 2. Delegate the core healing logic to the HealingProcessor
        // HealingProcessor handles HP capping, CHARACTER_HEALED event dispatch, and returns results.
        const result = this.healingProcessor.applyHealing(target, amount, source, ability, healType);
        const actualHealing = result.actualHealing;
        const wasRevivalPossible = result.revived; // Processor detected conditions for revival

        // 3. Handle Side Effects (Logging & Passives) here in BattleManager based on the result
        if (actualHealing > 0) {
            // Log the healing event
            const targetTeam = target.team;
            const targetInfo = `${target.name}${targetTeam === 'player' ? ' (ally)' : ' (enemy)'}`;
            const sourceInfo = source ? `${source.name}${source.team === 'player' ? ' (ally)' : ' (enemy)'}` : 'Effect';
            const message = source
                ? `${targetInfo} is healed for ${actualHealing} HP from ${sourceInfo}'s ${healType}! (HP: ${target.currentHp}/${target.stats.hp})`
                : `${targetInfo} is healed for ${actualHealing} HP from ${healType}! (HP: ${target.currentHp}/${target.stats.hp})`;
            this.logMessage(message, 'success'); // Use the BattleManager's logMessage

            // Trigger 'onHealed' passive for the target
            this.processPassiveAbilities('onHealed', target, {
                source: source,
                healAmount: actualHealing,
                ability: ability,
                healType: healType
            });

            // Trigger 'onHealingDone' for the source (if not self-healing)
            if (source && source !== target) {
                this.processPassiveAbilities('onHealingDone', source, {
                    target: target,
                    healAmount: actualHealing,
                    ability: ability,
                    healType: healType
                });
            }
        }

        // 4. Check and Reset Death Status (Delegate state change to processor)
        let resurrectionOccurred = false;
        if (wasRevivalPossible) {
             // Check processor exists and has the method before calling
             if (this.healingProcessor.checkAndResetDeathStatus) {
                // Call the processor's method to handle the actual state change (isDefeated = false) and log revival
                resurrectionOccurred = this.healingProcessor.checkAndResetDeathStatus(target);
             } else {
                 console.warn("[BM Utility Heal] HealingProcessor is missing checkAndResetDeathStatus method!");
             }
        }

        // 5. Trigger 'onRevive' passive ONLY if resurrection actually occurred
        if (resurrectionOccurred) {
            this.processPassiveAbilities('onRevive', target, {
                reviver: source,
                ability: ability,
                healType: healType
            });
        }

        // 6. Update UI (If needed for direct calls - evaluate later if purely event-driven is better)
        // Note: This direct UI call might become obsolete if UI relies solely on BattleBridge events.
        if (this.battleUI && actualHealing > 0) {
             if (typeof this.battleUI.updateCharacterHealth === 'function') {
                this.battleUI.updateCharacterHealth(target, actualHealing, true);
             }
        }

        // 7. Return the result, adapting keys for compatibility with original utility method format
        return { healing: actualHealing, revived: resurrectionOccurred };
    }
    
    // Utility methods have been removed and moved to BattleUtilities static class
    // See js/battle_logic/utilities/BattleUtilities.js
    
    /**
     * Dispatch a battle event
     * @param {string} eventType - The type of event
     * @param {Object} eventData - The event data
     * @returns {boolean} True if dispatched successfully
     */
    dispatchBattleEvent(eventType, eventData) {
        // Direct delegation - no toggle mechanism for streamlined implementation
        if (this.battleEventDispatcher) {
            return this.battleEventDispatcher.dispatchEvent(eventType, eventData);
        }
        
        // Minimal fallback implementation (no original implementation preserved)
        console.warn(`[BattleManager] BattleEventDispatcher not available, cannot dispatch ${eventType}`);
        
        // Try direct battleBridge as last resort
        if (window.battleBridge) {
            try {
                window.battleBridge.dispatchEvent(eventType, eventData);
                return true;
            } catch (error) {
                console.error(`[BattleManager] Error dispatching ${eventType}:`, error);
            }
        }
        
        return false;
    }
    
    /**
     * Dispatch an event when a character takes damage
     * @param {Object} target - The character taking damage
     * @param {number} amount - Amount of damage
     * @param {Object|null} source - Source of the damage (character or null)
     * @param {Object|null} ability - Ability that caused damage (or null)
     * @returns {boolean} - Success status
     */
    dispatchDamageEvent(target, amount, source = null, ability = null) {
        // Direct delegation - no toggle mechanism
        if (this.battleEventDispatcher) {
            return this.battleEventDispatcher.dispatchCharacterDamagedEvent(target, amount, source, ability);
        }
        
        // Minimal fallback
        console.warn(`[BattleManager] BattleEventDispatcher not available, cannot dispatch damage event`);
        
        // Try direct battleBridge as last resort
        if (window.battleBridge) {
            try {
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.CHARACTER_DAMAGED, {
                    character: target,
                    target: target,
                    amount: amount,
                    source: source,
                    ability: ability,
                    newHealth: target.currentHp,
                    maxHealth: target.stats.hp
                });
                return true;
            } catch (error) {
                console.error(`[BattleManager] Error dispatching damage event:`, error);
            }
        }
        
        return false;
    }
    
    /**
     * Dispatch an event when a character is healed
     * @param {Object} target - The character being healed
     * @param {number} amount - Amount of healing
     * @param {Object|null} source - Source of the healing (character or null)
     * @param {Object|null} ability - Ability that caused healing (or null)
     * @returns {boolean} - Success status
     */
    dispatchHealingEvent(target, amount, source = null, ability = null) {
        // Direct delegation - no toggle mechanism
        if (this.battleEventDispatcher) {
            return this.battleEventDispatcher.dispatchCharacterHealedEvent(target, amount, source, ability);
        }
        
        // Minimal fallback
        console.warn(`[BattleManager] BattleEventDispatcher not available, cannot dispatch healing event`);
        
        // Try direct battleBridge as last resort
        if (window.battleBridge) {
            try {
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.CHARACTER_HEALED, {
                    character: target,
                    target: target,
                    amount: amount,
                    source: source,
                    ability: ability,
                    newHealth: target.currentHp,
                    maxHealth: target.stats.hp
                });
                return true;
            } catch (error) {
                console.error(`[BattleManager] Error dispatching healing event:`, error);
            }
        }
        
        return false;
    }
    
    /**
     * Dispatch an event when a character performs an action
     * @param {Object} character - The character performing the action
     * @param {Object} action - The action data
     * @returns {boolean} - Success status
     */
    dispatchActionEvent(character, action) {
        // Direct delegation - no toggle mechanism
        if (this.battleEventDispatcher) {
            return this.battleEventDispatcher.dispatchCharacterActionEvent(character, action);
        }
        
        // Minimal fallback
        console.warn(`[BattleManager] BattleEventDispatcher not available, cannot dispatch action event`);
        
        // Try direct battleBridge as last resort
        if (window.battleBridge) {
            try {
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.CHARACTER_ACTION, {
                    character: character,
                    action: action
                });
                return true;
            } catch (error) {
                console.error(`[BattleManager] Error dispatching action event:`, error);
            }
        }
        
        return false;
    }
    
    /**
     * Dispatch an event when a battle ends
     * @param {string} winner - Winner of the battle ('player', 'enemy', or 'draw')
     * @param {string} reason - Reason for battle end
     * @returns {boolean} - Success status
     */
    dispatchBattleEndEvent(winner, reason = 'standard') {
        // Direct delegation - no toggle mechanism
        if (this.battleEventDispatcher) {
            return this.battleEventDispatcher.dispatchBattleEndedEvent(winner, reason);
        }
        
        // Minimal fallback
        console.warn(`[BattleManager] BattleEventDispatcher not available, cannot dispatch battle end event`);
        
        // Try direct battleBridge as last resort
        if (window.battleBridge) {
            try {
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_ENDED, {
                    winner: winner,
                    reason: reason
                });
                return true;
            } catch (error) {
                console.error(`[BattleManager] Error dispatching battle end event:`, error);
            }
        }
        
        return false;
    }
}

// Export as ES Module
// Make BattleManager available globally for traditional scripts
if (typeof window !== 'undefined') {
  window.BattleManager = BattleManager;
  console.log("BattleManager class definition loaded and exported to window.BattleManager");
}

// Legacy global assignment for maximum compatibility
window.BattleManager = BattleManager;

// End of BattleManager class
