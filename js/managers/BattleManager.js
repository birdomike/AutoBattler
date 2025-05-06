/**
 * Battle Manager
 * Controls the flow of battle and combat logic
 * Updated to work with the Tailwind CSS-based BattleUI
 * Version 0.5.1.2b - Added CHARACTER_ACTION event dispatching for action indicators
 * Version 0.5.1.3 - Added refactoring toggle mechanism
 * Version 0.5.2.0 - Stage 1 cleanup: Removed legacy methods and duplicates
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
        this.statusEffects = {}; // Store status effects by character ID
        this.battleBehaviors = null; // Will hold the behavior system when loaded
        this.statusEffectDefinitions = null; // Will hold status effect definitions from JSON
        this.uiMode = "dom"; // UI mode: "dom" or "phaser"
        
        // Create a simple teamManager for compatibility with behavior system
        this.teamManager = {
            getCharacterTeam: (character) => character.team
        };

        // REFACTORING: Component manager references
        this.useNewImplementation = false; // Toggle to switch between original and new code

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
     */
    displayTurnSummary() {
        // REFACTORING: Use new implementation if toggle is enabled
        if (this.useNewImplementation && this.battleLogManager) {
            return this.battleLogManager.displayTurnSummary();
        }

        // Original implementation
        this.logMessage('------ END OF TURN SUMMARY ------', 'info');
        
        // Show player team summary
        this.logMessage('Player Team:', 'info');
        this.playerTeam.forEach(character => {
            const status = character.isDead ? '💀 DEFEATED' : `HP: ${character.currentHp}/${character.stats.hp}`;
            const statusColor = character.isDead ? 'error' : 
                               (character.currentHp < character.stats.hp * 0.3) ? 'error' :
                               (character.currentHp < character.stats.hp * 0.7) ? 'action' : 'success';
            this.logMessage(`  ${character.name}: ${status}`, statusColor);
        });
        
        // Show enemy team summary
        this.logMessage('Enemy Team:', 'info');
        this.enemyTeam.forEach(character => {
            const status = character.isDead ? '💀 DEFEATED' : `HP: ${character.currentHp}/${character.stats.hp}`;
            const statusColor = character.isDead ? 'error' : 
                               (character.currentHp < character.stats.hp * 0.3) ? 'error' :
                               (character.currentHp < character.stats.hp * 0.7) ? 'action' : 'success';
            this.logMessage(`  ${character.name}: ${status}`, statusColor);
        });
        
        this.logMessage('--------------------------------', 'info');
    }
    
    /**
     * Add a toggle method for testing
     */
    toggleImplementation() {
        this.useNewImplementation = !this.useNewImplementation;
        console.log(`Implementation toggled. Using new implementation: ${this.useNewImplementation}`);
        return this.useNewImplementation;
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
        
        // 2. Initialize BattleFlowController (required component)
        if (window.BattleFlowController) {
            this.battleFlowController = new window.BattleFlowController(this);
            console.log('BattleManager: BattleFlowController component initialized');

            // ADD THESE DIAGNOSTIC LINES:
            console.log('>>> Instance Check Immediately After Creation:');
            console.log('>>> this.battleFlowController instance:', this.battleFlowController);
            console.log('>>> typeof this.battleFlowController.startNextTurn:', typeof this.battleFlowController?.startNextTurn);
            // Also check a few other methods expected on the prototype
            console.log('>>> typeof this.battleFlowController.executeNextAction:', typeof this.battleFlowController?.executeNextAction);
            console.log('>>> typeof this.battleFlowController.finishTurn:', typeof this.battleFlowController?.finishTurn);
        } else {
            console.error('BattleManager: BattleFlowController not found on global window object');
            throw new Error('BattleFlowController is required but not available');
        }
        
        // 3. Initialize type effectiveness calculator
        if (window.TypeEffectivenessCalculator) {
            this.typeEffectivenessCalculator = new window.TypeEffectivenessCalculator(this);
            console.log('BattleManager: TypeEffectivenessCalculator initialized');
            
            // Diagnostic check
            console.log('>>> TypeEffectivenessCalculator instance check:',
                typeof this.typeEffectivenessCalculator.calculateTypeMultiplier);
        }
        
        // 4. Initialize damage calculator
        // Note: Initialize after TypeEffectivenessCalculator to maintain dependency order
        if (window.DamageCalculator) {
            this.damageCalculator = new window.DamageCalculator(this);
            console.log('BattleManager: DamageCalculator initialized');
            
            // Verify method exists and is callable
            console.log('>>> DamageCalculator instance check:', 
                typeof this.damageCalculator.calculateDamage);
        }
        
        // 5. Initialize healing processor
        if (window.HealingProcessor) {
            this.healingProcessor = new window.HealingProcessor(this);
            console.log('BattleManager: HealingProcessor initialized');
            
            // Verify methods exist
            console.log('>>> HealingProcessor instance check:', {
                applyHealing: typeof this.healingProcessor.applyHealing,
                checkAndResetDeathStatus: typeof this.healingProcessor.checkAndResetDeathStatus
            });
        }
        
        // 6. Initialize ability processor
        if (window.AbilityProcessor) {
            this.abilityProcessor = new window.AbilityProcessor(this);
            console.log('BattleManager: AbilityProcessor initialized');
            
            // Verify methods exist
            console.log('>>> AbilityProcessor instance check:', {
                processEffect: typeof this.abilityProcessor.processEffect,
                applyActionEffect: typeof this.abilityProcessor.applyActionEffect,
                applyRandomStatusEffect: typeof this.abilityProcessor.applyRandomStatusEffect
            });
        }
        
        // 7. Initialize passive system components
        if (window.PassiveTriggerTracker) {
            this.passiveTriggerTracker = new window.PassiveTriggerTracker();
            console.log('BattleManager: PassiveTriggerTracker initialized');
            
            // Verify methods exist
            console.log('>>> PassiveTriggerTracker instance check:', {
                recordTrigger: typeof this.passiveTriggerTracker.recordTrigger,
                hasFiredThisTurn: typeof this.passiveTriggerTracker.hasFiredThisTurn,
                resetTurnTracking: typeof this.passiveTriggerTracker.resetTurnTracking
            });
        }
        
        // Initialize PassiveAbilityManager (after PassiveTriggerTracker)
        if (window.PassiveAbilityManager) {
            this.passiveAbilityManager = new window.PassiveAbilityManager(this, this.passiveTriggerTracker);
            console.log('BattleManager: PassiveAbilityManager initialized');
            
            // Verify methods exist
            console.log('>>> PassiveAbilityManager instance check:', {
                processPassiveAbilities: typeof this.passiveAbilityManager.processPassiveAbilities,
                executePassiveBehavior: typeof this.passiveAbilityManager.executePassiveBehavior
            });
        }
        
        // 7. Initialize targeting system
        if (window.TargetingSystem) {
            this.targetingSystem = new window.TargetingSystem(this);
            console.log('BattleManager: TargetingSystem initialized');
            
            // Verify methods exist
            console.log('>>> TargetingSystem instance check:', {
                selectTarget: typeof this.targetingSystem.selectTarget
            });
        }
        
        // 8. Initialize action generator
        if (window.ActionGenerator) {
            this.actionGenerator = new window.ActionGenerator(this);
            console.log('BattleManager: ActionGenerator initialized');
            
            // Verify methods exist
            console.log('>>> ActionGenerator instance check:', {
                generateCharacterAction: typeof this.actionGenerator.generateCharacterAction
            });
        }
    }
    
    /**
     * Load status effect definitions from JSON file
     */
    async loadStatusEffectDefinitions() {
        // REFACTORING: Use new implementation if toggle is enabled
        if (this.useNewImplementation && this.statusEffectLoader) {
            return this.statusEffectLoader.getDefinition ? true : false; // Just check if method exists
        }

        // Original implementation
        try {
            // First try to load from data directory
            console.log('Attempting to load status effect definitions from data directory...');
            try {
                const response = await fetch('/data/status_effects.json');
                if (!response.ok) {
                    throw new Error(`Failed to load data/status_effects.json: ${response.status}`);
                }
                const data = await response.json();
                this.statusEffectDefinitions = {};
                
                // Process each status effect
                if (data && data.status_effects && Array.isArray(data.status_effects)) {
                    data.status_effects.forEach(effect => {
                        if (effect && effect.id) {
                            this.statusEffectDefinitions[effect.id] = effect;
                        }
                    });
                }
                
                console.log(`Loaded ${Object.keys(this.statusEffectDefinitions).length} status effect definitions from data directory`);
            } catch (e) {
                console.warn('Failed to load from data directory:', e.message);
                // Try fallback to root directory
                try {
                    const response = await fetch('/status_effects.json');
                    if (!response.ok) {
                        throw new Error(`Failed to load status_effects.json: ${response.status}`);
                    }
                    const data = await response.json();
                    this.statusEffectDefinitions = {};
                    
                    // Process each status effect
                    if (data && data.status_effects && Array.isArray(data.status_effects)) {
                        data.status_effects.forEach(effect => {
                            if (effect && effect.id) {
                                this.statusEffectDefinitions[effect.id] = effect;
                            }
                        });
                    }
                    
                    console.log(`Loaded ${Object.keys(this.statusEffectDefinitions).length} status effect definitions from root directory`);
                } catch (fallbackError) {
                    console.warn('Failed to load from root directory:', fallbackError.message);
                    throw e;
                }
            }
        } catch (error) {
            console.error('Error loading status effect definitions:', error);
            // Create basic fallback definitions
            this.setupFallbackStatusEffects();
            throw error;
        }
    }
    
    /**
     * Setup fallback status effect definitions if loading fails
     */
    setupFallbackStatusEffects() {
        // REFACTORING: Use new implementation if toggle is enabled
        if (this.useNewImplementation && this.statusEffectLoader) {
            return this.statusEffectLoader.setupFallbackDefinitions ? this.statusEffectLoader.setupFallbackDefinitions() : false;
        }

        // Original implementation
        console.log('Setting up fallback status effect definitions');
        this.statusEffectDefinitions = {
            'status_burn': {
                id: 'status_burn',
                name: 'Burn',
                description: 'Taking fire damage over time',
                type: 'DoT',
                defaultDuration: 2,
                maxStacks: 1,
                behavior: {
                    trigger: 'onTurnStart',
                    action: 'Damage',
                    valueType: 'PercentMaxHP',
                    value: 0.05
                }
            },
            'status_regen': {
                id: 'status_regen',
                name: 'Regeneration',
                description: 'Healing over time',
                type: 'HoT',
                defaultDuration: 3,
                maxStacks: 1,
                behavior: {
                    trigger: 'onTurnStart',
                    action: 'Heal',
                    valueType: 'PercentMaxHP',
                    value: 0.05
                }
            }
        };
    }

    /**
     * Initialize the battle manager
     */
    async initialize() {
        console.log('BattleManager: Initializing...');
        
        // REFACTORING: Initialize component managers
        try {
            // Initialize component managers in dependency order
            await this.initializeComponentManagers();
            
            // Set useNewImplementation flag based on successful initialization of required components
            this.useNewImplementation = !!(this.statusEffectLoader && 
                                          this.statusEffectManager && 
                                          this.battleFlowController && 
                                          this.typeEffectivenessCalculator &&
                                          this.damageCalculator &&
                                          this.healingProcessor &&
                                          this.abilityProcessor &&
                                          this.targetingSystem &&
                                          this.passiveTriggerTracker);
            console.log(`BattleManager: Using new implementation: ${this.useNewImplementation}`);
        } catch (error) {
            console.error('BattleManager: Error initializing component managers:', error);
            this.useNewImplementation = false;
            console.log('BattleManager: Falling back to original implementation due to initialization error');
        }
        
        try {
            // Load status effect definitions
            try {
                await this.loadStatusEffectDefinitions();
                console.log('BattleManager: Status effect definitions loaded');
            } catch (error) {
                console.warn('BattleManager: Status effect definitions not available, using fallback behavior:', error);
            }
            
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
        if (!team || !Array.isArray(team)) {
            console.error(`[BattleManager] Cannot initialize ${teamType} team: Invalid or missing team data`);
            return [];
        }
        
        console.log(`[BattleManager] Starting initialization for ${teamType} team with ${team.length} characters`);
        
        // Create complete team with proper initialization
        return team.map((character, index) => {
            // Skip invalid characters
            if (!character) {
                console.warn(`[BattleManager] Skipping invalid character at index ${index} in ${teamType} team`);
                return null;
            }
            
            try {
                // Create a new character object with all required properties
                const completeChar = {
                    ...character,
                    name: character.name || `Unknown ${teamType} ${index}`,
                    team: teamType,
                    uniqueId: character.uniqueId || `${teamType}_${character.name || 'unknown'}_${character.id || index}`,
                    id: character.id || `char_${Math.random().toString(36).substr(2, 9)}`,
                    currentHp: character.currentHp !== undefined ? character.currentHp : (character.stats?.hp || 100),
                    isDead: character.isDead || false
                };
                
                // Ensure stats object exists and has required properties
                completeChar.stats = completeChar.stats || {};
                completeChar.stats.hp = completeChar.stats.hp || 100;
                completeChar.stats.attack = completeChar.stats.attack || 10;
                completeChar.stats.defense = completeChar.stats.defense || 5;
                completeChar.stats.speed = completeChar.stats.speed || 10;
                completeChar.stats.strength = completeChar.stats.strength || 10;
                completeChar.stats.intellect = completeChar.stats.intellect || 10;
                completeChar.stats.spirit = completeChar.stats.spirit || 10;
                
                // Ensure abilities array exists
                completeChar.abilities = Array.isArray(completeChar.abilities) ? completeChar.abilities : [];
                
                // Initialize ability cooldowns and identify passive abilities
                completeChar.passiveAbilities = [];
                
                // Filter out any undefined abilities and ensure all abilities have basic properties
                completeChar.abilities = completeChar.abilities.filter(ability => ability != null).map(ability => {
                    // Ensure ability has basic required properties
                    ability.name = ability.name || 'Unnamed Ability';
                    ability.id = ability.id || `ability_${Math.random().toString(36).substr(2, 9)}`;
                    ability.currentCooldown = ability.currentCooldown || 0;
                    return ability;
                });
                
                // Now identify passive abilities after filtering
                completeChar.abilities.forEach(ability => {
                    // Identify passive abilities and store them separately for quick reference
                    if (ability.abilityType === 'Passive') {
                        completeChar.passiveAbilities.push(ability);
                    }
                });
                
                // Do final validation check for critical properties
                if (!completeChar.name) {
                    console.error(`[BattleManager] Character initialization missing name property after processing, using default`);
                    completeChar.name = `Unknown ${teamType} ${index}`;
                }
                
                if (typeof completeChar.currentHp !== 'number') {
                    console.error(`[BattleManager] Character ${completeChar.name} has invalid currentHp after processing, using default`);
                    completeChar.currentHp = completeChar.stats.hp || 100;
                }
                
                console.log(`[BattleManager] Completed initialization for ${completeChar.name} (${teamType})`);
                return completeChar;
            } catch (error) {
                console.error(`[BattleManager] Error during character initialization at index ${index}:`, error);
                console.error(`[BattleManager] Character data that caused error:`, JSON.stringify(character));
                // Return null to filter out this character
                return null;
            }
        }).filter(char => char !== null); // Filter out any null entries
    }

    /**
     * Start a battle with the given teams, with enhanced initialization
     * @param {Array} rawPlayerTeam - Array of player characters
     * @param {Array} rawEnemyTeam - Array of enemy characters
     */
    async startBattle(rawPlayerTeam, rawEnemyTeam) {
        // Reset passive tracking for the new battle
        if (this.passiveTriggerTracker) {
            this.passiveTriggerTracker.resetBattleTracking();
        } else {
            console.warn("[BattleManager] PassiveTriggerTracker not available for battle reset");
        }
        
        // Perform deep copy and enhanced initialization of teams
        this.playerTeam = this.ensureCompleteCharacterInitialization(
            JSON.parse(JSON.stringify(rawPlayerTeam || [])), 
            'player'
        );
        
        this.enemyTeam = this.ensureCompleteCharacterInitialization(
            JSON.parse(JSON.stringify(rawEnemyTeam || [])), 
            'enemy'
        );
        
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
        
        console.log('>>> BM.startNextTurn called. Checking this.battleFlowController...');
        console.log('>>> this.battleFlowController instance:', this.battleFlowController);
        console.log('>>> typeof this.battleFlowController.startNextTurn:', typeof this.battleFlowController?.startNextTurn);
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
        // REFACTORING: Use new implementation if toggle is enabled
        if (this.useNewImplementation && this.abilityProcessor) {
            // Delegate directly to the component for a clean implementation
            return this.abilityProcessor.applyActionEffect(action);
        }

        // Original implementation has been removed (v0.5.26.1_Cleanup)
        // Implementation now in AbilityProcessor.applyActionEffect
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
        // Check if this is a player team based on current context
        const isPlayerTeam = !this.playerTeam || this.playerTeam.length === 0 || 
                          (this.playerTeam.length > 0 && this.enemyTeam && this.enemyTeam.length > 0);
        const teamType = isPlayerTeam ? 'player' : 'enemy';
        
        console.log(`Preparing ${teamType} team with ${team.length} characters`);
        
        // Validation check
        if (!team || !Array.isArray(team)) {
            console.error(`Invalid team provided for ${teamType}, using empty array`);
            return [];
        }
        
        // Map characters to battle-ready format and filter out nulls
        const preparedTeam = team.map((character, index) => {
            // Character validation
            if (!character) {
                console.error(`Null character at index ${index} in ${teamType} team`);
                return null;
            }
            
            // No need for deep copy since we already copied at the higher level
            const battleChar = character;
            
            // Set battle-specific properties
            battleChar.currentHp = battleChar.stats.hp;
            battleChar.isDead = false;
            
            // Ensure character has a unique ID
            if (!battleChar.id) {
                battleChar.id = this.generateCharacterId();
            }
            
            // Create a more robust uniqueId that includes team info and name
            battleChar.uniqueId = `${teamType}_${battleChar.name}_${battleChar.id}`;
            
            // Store team info on the character
            battleChar.team = teamType;
            
            // Initialize ability cooldowns and identify passive abilities
            if (battleChar.abilities) {
                battleChar.passiveAbilities = [];
                
                battleChar.abilities.forEach(ability => {
                    // Initialize cooldown for active abilities
                    ability.currentCooldown = 0;
                    
                    // Identify passive abilities and store them separately for quick reference
                    if (ability.abilityType === 'Passive') {
                        battleChar.passiveAbilities.push(ability);
                    }
                });
            }
            
            return battleChar;
        }).filter(char => char !== null); // Filter out any null entries
        
        console.log(`Finished preparing ${teamType} team: ${preparedTeam.length} valid characters`);
        return preparedTeam;
    }
    
    /**
     * Generate a unique ID for a character
     * @returns {string} A unique ID
     */
    generateCharacterId() {
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
     * @param {number} duration - Number of turns the effect lasts (optional, uses default if not specified)
     * @param {number|Object} value - Value for the effect (if applicable)
     * @returns {boolean} - True if effect was successfully applied
     */
    addStatusEffect(character, statusId, duration, value) {
        // Defensive check
        if (!this.statusEffectManager) {
            console.error("StatusEffectManager not initialized! Cannot add status effect.");
            return false;
        }
        
        // Direct delegation
        return this.statusEffectManager.addStatusEffect(character, statusId, null, duration, 1);
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
        // REFACTORING: Use new implementation if toggle is enabled
        if (this.useNewImplementation && this.actionGenerator) {
            return this.actionGenerator.generateCharacterAction(character, team);
        }
        
        // Original implementation has been removed (v0.5.26.3_Cleanup)
        // Implementation now in ActionGenerator.generateCharacterAction
        console.warn("BattleManager using legacy generateCharacterAction - ActionGenerator not available");
        
        // Safe fallback: return null (no action) if ActionGenerator not available
        return null;
    }
    
    /**
     * Apply a random status effect to a character
     * @param {Object} target - The character to affect
     */
    applyRandomStatusEffect(target) {
        // REFACTORING: Use new implementation if toggle is enabled
        if (this.useNewImplementation && this.abilityProcessor) {
            return this.abilityProcessor.applyRandomStatusEffect(target);
        }
        
        // Original implementation has been removed (v0.5.26.1_Cleanup)
        // Implementation now in AbilityProcessor.applyRandomStatusEffect
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
        // REFACTORING: Use new implementation if toggle is enabled
        if (this.useNewImplementation && this.abilityProcessor) {
            return this.abilityProcessor.processEffect(effect, actor, target, ability);
        }
        
        // Original implementation has been removed (v0.5.26.1_Cleanup)
        // Implementation now in AbilityProcessor.processEffect
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
        // REFACTORING: Use new implementation if toggle is enabled
        if (this.useNewImplementation && this.passiveAbilityManager) {
            return this.passiveAbilityManager.processPassiveAbilities(trigger, character, additionalData);
        }
        
        // Skip if character is defeated or has no passive abilities
        if (!character || character.isDead || character.currentHp <= 0 || !character.passiveAbilities || !character.passiveAbilities.length) {
            return [];
        }
        
        // Will store results from executed passives
        const results = [];
        
        // Skip if we don't have the behavior system
        if (!this.battleBehaviors) {
            return results;
        }
        
        // Check for PassiveTriggerTracker component
        if (!this.passiveTriggerTracker) {
            console.warn("[BattleManager] PassiveTriggerTracker not available for processing passive abilities");
        }
        
        // Process each passive ability
        character.passiveAbilities.forEach(ability => {
            // Skip if this passive has already been triggered this turn for this trigger type
            const passiveId = ability.id || ability.name;
            
            let hasTriggeredThisTurn = false;
            
            if (this.passiveTriggerTracker) {
                // Use the PassiveTriggerTracker to check if already triggered
                hasTriggeredThisTurn = this.passiveTriggerTracker.hasFiredThisTurn(character, passiveId, trigger);
            } else {
                // Without tracker, default to allowing passives to trigger (permissive fallback)
                hasTriggeredThisTurn = false;
            }
            
            if (hasTriggeredThisTurn) {
                console.debug(`Skipping duplicate trigger of ${passiveId} for ${character.name}, already triggered this turn`);
                return; // Skip this passive ability
            }
            
            // Special handling for onBattleStart trigger - needs battle-level tracking
            if (trigger === 'onBattleStart') {
                let hasTriggeredThisBattle = false;
                
                if (this.passiveTriggerTracker) {
                    // Use the PassiveTriggerTracker to check if already triggered in battle
                    hasTriggeredThisBattle = this.passiveTriggerTracker.hasFiredThisBattle(character, passiveId, trigger);
                } else {
                    // Without tracker, default to allowing passives to trigger
                    hasTriggeredThisBattle = false;
                }
                
                // Check if this has already been triggered in this battle
                if (hasTriggeredThisBattle) {
                    console.debug(`Skipping duplicate battle start trigger: ${ability.name} for ${character.name}`);
                    return; // Skip this passive ability
                }
            }
            
            // Check if this passive has a trigger that matches the current trigger
            if (ability.passiveTrigger === trigger) {
                // Create context for the passive behavior
                const passiveContext = {
                    actor: character,
                    ability: ability,
                    battleManager: this,
                    teamManager: this.teamManager,
                    trigger: trigger,
                    additionalData: additionalData
                };
                
                // Get the behavior function name
                const behaviorName = ability.passiveBehavior;
                
                // If the passive has a behavior function and our system has it registered
                if (behaviorName && this.battleBehaviors.hasBehavior(behaviorName)) {
                    try {
                        // Execute the passive behavior
                        const result = this.battleBehaviors.executePassiveBehavior(behaviorName, passiveContext);
                        
                        // If passive executed successfully, add to results and log message
                        if (result && result.executed) {
                            // Mark this passive as triggered for this turn and trigger type
                            if (this.passiveTriggerTracker) {
                                // Record in the PassiveTriggerTracker
                                this.passiveTriggerTracker.recordTrigger(character, passiveId, trigger);
                            }
                            
                            results.push(result);
                            
                            // Log the passive activation if a message was provided
                            if (result.message) {
                                const teamIdentifier = character.team === 'player' ? ' (ally)' : ' (enemy)';
                                this.logMessage(`${character.name}${teamIdentifier}'s passive ability: ${result.message}`, 'action');
                            }
                        }
                    } catch (error) {
                        console.error(`Error executing passive ability '${ability.name}':`, error);
                    }
                }
            }
        });
        
        return results;
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
     * Modified in v0.5.24.5 to prevent duplicate message dispatching
     * @param {string} message - The message to log
     * @param {string} type - The type of message (default, info, success, action, error)
     */
    logMessage(message, type = 'default') {
        // REFACTORING: Use new implementation if toggle is enabled and BattleLogManager exists
        if (this.useNewImplementation && this.battleLogManager) {
            // Delegate to BattleLogManager without any additional dispatching here
            return this.battleLogManager.logMessage(message, type);
        }

        // Original implementation - only dispatch once
        // Log to console for debugging
        console.log(`[BattleLog ${type}]: ${message}`);
        
        // Dispatch event through BattleBridge if available
        if (window.battleBridge) {
            try {
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_LOG, {
                    message: message,
                    type: type
                });
            } catch (error) {
                console.warn('Failed to dispatch battle log event:', error);
            }
        }
        
        // Add to DOM battle log if in DOM mode and battleUI is available
        if (this.uiMode === "dom" && this.battleUI) {
            try {
                this.battleUI.addLogMessage(message, type);
            } catch (error) {
                console.error('Error adding message to battle UI:', error);
            }
        }
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
        if (this.useNewImplementation && this.healingProcessor) {
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
    
    /**
     * Get all characters from both teams
     * @returns {Array} Array of all characters in the battle
     */
    getAllCharacters() {
        return [...this.playerTeam, ...this.enemyTeam];
    }
    
    /**
     * Shuffle an array randomly
     * @param {Array} array - The array to shuffle
     * @returns {Array} The shuffled array
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
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
console.log("BattleManager class defined:", typeof BattleManager);
console.log("window.BattleManager assigned:", typeof window.BattleManager);

// Force assignment if needed
if (typeof BattleManager === 'function' && typeof window.BattleManager !== 'function') {
    console.log("Fixing window.BattleManager assignment");
    window.BattleManager = BattleManager;
}
