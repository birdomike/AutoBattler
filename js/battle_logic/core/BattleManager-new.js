/**
 * Battle Manager
 * Controls the flow of battle and combat logic
 * Updated to work with the Tailwind CSS-based BattleUI
 * Version 0.5.1.2b - Added CHARACTER_ACTION event dispatching for action indicators
 * Version 0.5.1.3 - Added refactoring toggle mechanism
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

        // REFACTORING: Toggle mechanism for refactored implementation
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
     * Load status effect definitions from JSON file
     */
    async loadStatusEffectDefinitions() {
        // REFACTORING: Use new implementation if toggle is enabled
        if (this.useNewImplementation && this.statusEffectDefinitionLoader) {
            this.statusEffectDefinitions = await this.statusEffectDefinitionLoader.loadDefinitions();
            return this.statusEffectDefinitions;
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
        if (this.useNewImplementation && this.statusEffectDefinitionLoader) {
            return this.statusEffectDefinitionLoader.setupFallbackDefinitions();
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
        return this.statusEffectDefinitions;
    }

    /**
     * Initialize the battle manager
     */
    async initialize() {
        console.log('BattleManager: Initializing...');
        
        // REFACTORING: Initialize all component managers if toggle is enabled
        if (this.useNewImplementation) {
            try {
                console.log('BattleManager: Using new refactored implementation');
                
                // Initialize component managers (importing dynamically to avoid circular dependencies)
                try {
                    // Import all required manager classes
                    const BattleFlowController = (await import('./BattleFlowController.js')).default;
                    const BattleInitializer = (await import('./BattleInitializer.js')).default;
                    const StatusEffectManager = (await import('../status/StatusEffectManager.js')).default;
                    const StatusEffectDefinitionLoader = (await import('../status/StatusEffectDefinitionLoader.js')).default;
                    const DamageCalculator = (await import('../damage/DamageCalculator.js')).default;
                    const HealingProcessor = (await import('../damage/HealingProcessor.js')).default;
                    const TypeEffectivenessCalculator = (await import('../damage/TypeEffectivenessCalculator.js')).default;
                    const AbilityProcessor = (await import('../abilities/AbilityProcessor.js')).default;
                    const ActionGenerator = (await import('../abilities/ActionGenerator.js')).default;
                    const TargetingSystem = (await import('../abilities/TargetingSystem.js')).default;
                    const PassiveAbilityManager = (await import('../passives/PassiveAbilityManager.js')).default;
                    const PassiveTriggerTracker = (await import('../passives/PassiveTriggerTracker.js')).default;
                    const BattleEventDispatcher = (await import('../events/BattleEventDispatcher.js')).default;
                    const BattleLogManager = (await import('../events/BattleLogManager.js')).default;
                    
                    // Create instances of all managers
                    this.battleFlowController = new BattleFlowController(this);
                    this.battleInitializer = new BattleInitializer(this);
                    this.statusEffectManager = new StatusEffectManager(this);
                    this.statusEffectDefinitionLoader = new StatusEffectDefinitionLoader(this);
                    this.damageCalculator = new DamageCalculator(this);
                    this.healingProcessor = new HealingProcessor(this);
                    this.typeEffectivenessCalculator = new TypeEffectivenessCalculator(this);
                    this.abilityProcessor = new AbilityProcessor(this);
                    this.actionGenerator = new ActionGenerator(this);
                    this.targetingSystem = new TargetingSystem(this);
                    this.passiveAbilityManager = new PassiveAbilityManager(this);
                    this.passiveTriggerTracker = new PassiveTriggerTracker(this);
                    this.battleEventDispatcher = new BattleEventDispatcher(this);
                    this.battleLogManager = new BattleLogManager(this, this.battleEventDispatcher);
                    
                    // Set up relationships between managers
                    this.passiveAbilityManager.setTriggerTracker(this.passiveTriggerTracker);
                    
                    console.log('BattleManager: All component managers initialized successfully');
                } catch (error) {
                    console.error('BattleManager: Error initializing component managers:', error);
                    // Fall back to original implementation on error
                    this.useNewImplementation = false;
                    console.log('BattleManager: Falling back to original implementation due to initialization error');
                }
            } catch (error) {
                console.error('BattleManager: Error in new implementation path:', error);
                // Fall back to original implementation on any error
                this.useNewImplementation = false;
            }
        }
        
        // Continue with original implementation if toggle is disabled or fallback needed
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
     * Start a battle with the given teams
     * @param {Array} playerTeam - Array of player characters
     * @param {Array} enemyTeam - Array of enemy characters
     */
    async startBattle(playerTeam, enemyTeam) {
        // REFACTORING: Use new implementation if toggle is enabled
        if (this.useNewImplementation && this.battleFlowController) {
            return this.battleFlowController.startBattle(playerTeam, enemyTeam);
        }

        // Original implementation
        // Make sure status effect definitions are loaded
        if (!this.statusEffectDefinitions) {
            try {
                await this.loadStatusEffectDefinitions();
            } catch (error) {
                console.warn('Could not load status effect definitions:', error);
            }
        }
        
        // Make sure behavior system is loaded
        if (!this.battleBehaviors) {
            try {
                await this.initializeBehaviorSystem();
            } catch (error) {
                console.warn('Could not initialize behavior system:', error);
            }
        }
        
        // Make sure the UI is initialized and ready
        if (!this.battleUI || !this.battleUI.isSetup) {
            console.log('Re-initializing battle UI before battle start, uiMode:', this.uiMode);
            try {
                // Check UI mode to determine which UI to initialize
                if (this.uiMode === "phaser") {
                    console.log('Using Phaser scene for battle visualization, skipping DOM UI initialization');
                } else {
                    // Initialize DOM UI for "dom" mode
                    if (!this.battleUI) {
                        if (typeof window.BattleUI === 'undefined') {
                            console.error('BattleUI class is not defined! Cannot create BattleUI instance.');
                            throw new Error('BattleUI class is not defined!');
                        }
                        console.log('Creating new DOM BattleUI instance');
                        this.battleUI = new window.BattleUI(this.scene, this);
                    }
                    this.battleUI.initialize();
                }
            } catch (error) {
                console.error('Failed to initialize BattleUI:', error);
                throw error;
            }
        }

        // Validate playerTeam and ensure it's an array
        if (!playerTeam || !Array.isArray(playerTeam)) {
            console.warn('Invalid playerTeam provided to startBattle, using empty array');
            playerTeam = [];
        }
        
        // Deep copy the player team to avoid reference issues
        const playerTeamCopy = playerTeam.length > 0 ? JSON.parse(JSON.stringify(playerTeam)) : [];
        console.log(`PlayerTeam before preparation: ${playerTeamCopy.length} heroes`);
        this.playerTeam = this.prepareTeamForBattle(playerTeamCopy);
        console.log(`PlayerTeam after preparation: ${this.playerTeam.length} heroes`);
        
        // Validate player team was prepared correctly
        if (this.playerTeam.length === 0 && playerTeam.length > 0) {
            console.error('Failed to prepare player team properly. Original length:', playerTeam.length);
        }
        
        // Check if enemy team is empty or undefined and generate one if needed
        if (!enemyTeam || enemyTeam.length === 0) {
            console.log('No enemy team provided, generating a random one');
            // Create a simple enemy team for testing
            enemyTeam = [
                {
                    id: 4,
                    name: "Vaelgor",
                    type: "dark",
                    role: "Knight",
                    stats: {
                        hp: 120,
                        attack: 18,
                        defense: 12
                    },
                    abilities: [
                        {
                            name: "Shadow Strike",
                            damage: 28,
                            cooldown: 3,
                            isHealing: false,
                            description: "Attacks from the shadows for heavy damage"
                        },
                        {
                            name: "Void Barrier",
                            damage: 20,
                            cooldown: 4,
                            isHealing: true,
                            description: "Creates a barrier of dark energy that absorbs damage"
                        }
                    ]
                },
                {
                    id: 3,
                    name: "Sylvanna",
                    type: "nature",
                    role: "Ranger",
                    stats: {
                        hp: 90,
                        attack: 15,
                        defense: 15
                    },
                    abilities: [
                        {
                            name: "Vine Whip",
                            damage: 20,
                            cooldown: 2,
                            isHealing: false,
                            description: "Strikes with vines that can ensnare the target"
                        },
                        {
                            name: "Nature's Blessing",
                            damage: 25,
                            cooldown: 4,
                            isHealing: true,
                            description: "Channels the power of nature to heal wounds"
                        }
                    ]
                },
                {
                    id: 5,
                    name: "Lumina",
                    type: "light",
                    role: "Cleric",
                    stats: {
                        hp: 85,
                        attack: 16,
                        defense: 14
                    },
                    abilities: [
                        {
                            name: "Holy Smite",
                            damage: 22,
                            cooldown: 3,
                            isHealing: false,
                            description: "Channels divine light into a powerful attack"
                        },
                        {
                            name: "Divine Protection",
                            damage: 26,
                            cooldown: 4,
                            isHealing: true,
                            description: "Surrounds an ally with divine light, healing wounds"
                        }
                    ]
                }
            ];
        }
        
        // Validate enemyTeam and ensure it's an array
        if (!enemyTeam || !Array.isArray(enemyTeam)) {
            console.warn('Invalid enemyTeam provided to startBattle, using empty array');
            enemyTeam = [];
        }
        
        // Deep copy the enemy team to avoid reference issues
        const enemyTeamCopy = enemyTeam.length > 0 ? JSON.parse(JSON.stringify(enemyTeam)) : [];
        console.log(`EnemyTeam before preparation: ${enemyTeamCopy.length} enemies`);
        this.enemyTeam = this.prepareTeamForBattle(enemyTeamCopy);
        console.log(`EnemyTeam after preparation: ${this.enemyTeam.length} enemies`);
        
        // Validate enemy team was prepared correctly
        if (this.enemyTeam.length === 0 && enemyTeam.length > 0) {
            console.error('Failed to prepare enemy team properly. Original length:', enemyTeam.length);
        }
        
        // Reset battle state
        this.currentTurn = 0;
        this.battleActive = true;
        this.isPaused = false;
        this.activeCharacterIndex = 0;
        this.actionQueue = [];
        this.turnActions = [];
        this.turnInProgress = false;
        this.statusEffects = {};
        
        // Initialize passive trigger tracking at battle level
        this.passiveTriggersThisBattle = new Map();
        
        // Render characters on UI
        if (this.battleUI) {
            this.battleUI.renderCharacters(this.playerTeam, this.enemyTeam);
        }
        
        // Log battle start
        this.logMessage('Battle started!');
        this.logMessage(`${this.playerTeam.length} heroes vs ${this.enemyTeam.length} enemies`);
        console.log('Battle started with teams:', this.playerTeam, this.enemyTeam);
        
        // Process battle start passive abilities for all characters
        [...this.playerTeam, ...this.enemyTeam].forEach(character => {
            if (character.currentHp > 0) {
                this.processPassiveAbilities('onBattleStart', character);
            }
        });
        
        // Start first turn
        this.startNextTurn();
    }
    
    // Rest of the BattleManager methods...
    // ... (include all other methods here with the toggle mechanism)

    /**
     * Log a message to the battle log
     * @param {string} message - The message to log
     * @param {string} type - The type of message (default, info, success, action, error)
     */
    logMessage(message, type = 'default') {
        // REFACTORING: Use new implementation if toggle is enabled
        if (this.useNewImplementation && this.battleLogManager) {
            return this.battleLogManager.logMessage(message, type);
        }

        // Original implementation
        // Log to console for debugging
        console.log(`[Battle] ${message}`);
        
        // Dispatch event through BattleBridge if available and in phaser UI mode
        if (window.battleBridge && this.uiMode === "phaser") {
            window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_LOG, {
                message: message,
                type: type
            });
        }
        
        // Continue with DOM UI log if in DOM mode
        if (this.uiMode === "dom" && this.battleUI) {
            this.battleUI.log(message, type);
        }
    }
}

// Export as ES Module
export default BattleManager;

// Also make available as a global
if (typeof window !== 'undefined') {
    window.BattleManager = BattleManager;
}
