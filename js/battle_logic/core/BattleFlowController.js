/**
 * BattleFlowController.js
 * Controls the flow of battle, turn sequencing, and action execution
 */

class BattleFlowController {
    /**
     * Create a new Battle Flow Controller
     * @param {Object} battleManager - The main battle manager
     */
    constructor(battleManager) {
        this.battleManager = battleManager;
        this.currentTurn = 0;
        this.turnInProgress = false;
        this.actionQueue = [];
        this.turnActions = [];
    }

    /**
     * Start a battle with the given teams
     * @param {Array} playerTeam - Array of player characters
     * @param {Array} enemyTeam - Array of enemy characters
     */
    async startBattle(playerTeam, enemyTeam) {
        try {
            console.log("[BattleFlowController] Starting battle with proper implementation");
            
            // Load status effect definitions if needed
            if (!this.battleManager.statusEffectDefinitions) {
                try {
                    await this.battleManager.loadStatusEffectDefinitions();
                    console.log('[BattleFlowController] Status effect definitions loaded');
                } catch (error) {
                    console.warn('[BattleFlowController] Could not load status effect definitions:', error);
                    // Setup fallback definitions
                    this.battleManager.setupFallbackStatusEffects();
                }
            }
            
            // Initialize behavior system if needed
            if (!this.battleManager.battleBehaviors) {
                try {
                    await this.battleManager.initializeBehaviorSystem();
                    console.log('[BattleFlowController] Battle behavior system initialized');
                } catch (error) {
                    console.warn('[BattleFlowController] Could not initialize behavior system:', error);
                }
            }
            
            // Check UI based on mode
            if (this.battleManager.uiMode === "phaser") {
                console.log('[BattleFlowController] Using Phaser scene for battle visualization');
            } else if (this.battleManager.uiMode === "dom" && !this.battleManager.battleUI) {
                // Only initialize DOM UI if in DOM mode and UI not already initialized
                console.log('[BattleFlowController] Initializing DOM battle UI');
                if (typeof window.BattleUI === 'undefined') {
                    console.error('[BattleFlowController] BattleUI class is not defined!');
                } else {
                    this.battleManager.battleUI = new window.BattleUI(this.battleManager.scene, this.battleManager);
                    this.battleManager.battleUI.initialize();
                }
            }

            // Validate player team
            if (!playerTeam || !Array.isArray(playerTeam)) {
                console.warn('[BattleFlowController] Invalid playerTeam provided, using empty array');
                playerTeam = [];
            }
            
            // Deep copy the player team to avoid reference issues
            const playerTeamCopy = playerTeam.length > 0 ? JSON.parse(JSON.stringify(playerTeam)) : [];
            console.log(`[BattleFlowController] PlayerTeam before preparation: ${playerTeamCopy.length} heroes`);            
            // DIAGNOSTIC (REMOVE LATER): Added log before player team preparation
            console.log('[BattleFlowController.startBattle] Attempting to prepare player team via BattleManager.');
            
            // Store the prepared player team directly in BattleManager
            this.battleManager.playerTeam = this.battleManager.prepareTeamForBattle(playerTeamCopy);
            console.log(`[BattleFlowController] PlayerTeam after preparation: ${this.battleManager.playerTeam.length} heroes`);
            
            // Check if enemy team is empty or undefined and generate one if needed
            if (!enemyTeam || enemyTeam.length === 0) {
                console.log('[BattleFlowController] No enemy team provided, generating a random one');
                // Create a simple enemy team
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
            
            // Validate enemy team
            if (!enemyTeam || !Array.isArray(enemyTeam)) {
                console.warn('[BattleFlowController] Invalid enemyTeam provided, using empty array');
                enemyTeam = [];
            }
            
            // Deep copy the enemy team
            const enemyTeamCopy = enemyTeam.length > 0 ? JSON.parse(JSON.stringify(enemyTeam)) : [];
            console.log(`[BattleFlowController] EnemyTeam before preparation: ${enemyTeamCopy.length} enemies`);
            
            // DIAGNOSTIC (REMOVE LATER): Added log before enemy team preparation
            console.log('[BattleFlowController.startBattle] Attempting to prepare enemy team via BattleManager.');
            
            // Store the prepared enemy team directly in BattleManager
            this.battleManager.enemyTeam = this.battleManager.prepareTeamForBattle(enemyTeamCopy);
            console.log(`[BattleFlowController] EnemyTeam after preparation: ${this.battleManager.enemyTeam.length} enemies`);
            
            // Reset battle state variables
            this.battleManager.currentTurn = 0;
            this.battleManager.battleActive = true;
            this.battleManager.isPaused = false;
            this.battleManager.activeCharacterIndex = 0;
            this.battleManager.actionQueue = [];
            this.battleManager.turnActions = [];
            this.battleManager.turnInProgress = false;
            this.battleManager.statusEffects = {};
            
            // TEMPORARY DIAGNOSTIC - Remove after bug fix
            console.log(`[BattleFlowController] DIAGNOSTIC - Post-initialization team status:`);
            console.log(`  Player Team (${this.battleManager.playerTeam.length} characters):`, 
                this.battleManager.playerTeam.map(c => ({ name: c.name, team: c.team, hp: c.currentHp })));
            console.log(`  Enemy Team (${this.battleManager.enemyTeam.length} characters):`, 
                this.battleManager.enemyTeam.map(c => ({ name: c.name, team: c.team, hp: c.currentHp })));
            
            // Initialize passive trigger tracking at battle level
            this.battleManager.passiveTriggersThisBattle = new Map();
            
            // Render characters on UI if DOM mode
            if (this.battleManager.battleUI) {
                this.battleManager.battleUI.renderCharacters(this.battleManager.playerTeam, this.battleManager.enemyTeam);
            }
            
            // Log battle start
            this.battleManager.logMessage('Battle started!', 'info');
            this.battleManager.logMessage(`${this.battleManager.playerTeam.length} heroes vs ${this.battleManager.enemyTeam.length} enemies`, 'info');
            console.log('[BattleFlowController] Battle started with teams:', this.battleManager.playerTeam, this.battleManager.enemyTeam);
            
            // Process battle start passive abilities for all characters
            [...this.battleManager.playerTeam, ...this.battleManager.enemyTeam].forEach(character => {
                if (character.currentHp > 0) {
                    this.battleManager.processPassiveAbilities('onBattleStart', character);
                }
            });
            
            // Start first turn by calling our own method directly
            this.startNextTurn();
            
        } catch (error) {
            console.error('[BattleFlowController] Error starting battle:', error);
            throw error;
        }
    }

    /**
     * Starts the next turn in the battle sequence
     * Migrated from BattleManager.startNextTurn
     */
    async startNextTurn() {
        // Guard clauses
        if (!this.battleManager.battleActive) {
            console.log("[BattleFlowController] Battle not active, cannot start next turn");
            return;
        }
        
        if (this.battleManager.isPaused || this.battleManager.turnInProgress) {
            console.log("[BattleFlowController] Battle is paused or turn already in progress, cannot start next turn");
            return;
        }
        
        // Increment turn counter
        this.battleManager.currentTurn++;
        
        // Log turn started message
        this.battleManager.logMessage(`Turn ${this.battleManager.currentTurn} started`, 'info');
        
        // Set turn in progress flag
        this.battleManager.turnInProgress = true;
        
        // Reset passive triggers for all characters
        this.battleManager.playerTeam.forEach(char => {
            if (char) char.passiveTriggeredThisTurn = {};
        });
        this.battleManager.enemyTeam.forEach(char => {
            if (char) char.passiveTriggeredThisTurn = {};
        });
        
        // Update UI if available
        if (this.battleManager.battleUI) {
            this.battleManager.battleUI.update();
        }
        
        // Process passive abilities for turn start
        this.battleManager.processPassiveAbilities('onTurnStart', null, { turnNumber: this.battleManager.currentTurn });
        
        // Process status effects
        this.battleManager.processStatusEffects();
        
        // Reset action queues
        this.battleManager.actionQueue = [];
        this.battleManager.turnActions = [];
        
        // Generate turn actions
        this.battleManager.generateTurnActions();
        
        // REORDERED: Now determine the current character AFTER generating actions
        const currentChar = this.battleManager.actionQueue && this.battleManager.actionQueue.length > 0 
            ? this.battleManager.actionQueue[0]?.actor 
            : null;
        
        // Dispatch TURN_STARTED event directly through battleBridge
        if (window.battleBridge) {
            try {
                console.log(`[BattleFlowController] Dispatching TURN_STARTED for turn ${this.battleManager.currentTurn}`);
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.TURN_STARTED, {
                    character: currentChar, // Use 'character' for consistency
                    currentCharacter: currentChar, // Keep for backward compatibility
                    turnNumber: this.battleManager.currentTurn
                });
            } catch (error) {
                console.error('[BattleFlowController] Error dispatching TURN_STARTED event:', error);
            }
        }
        
        // Schedule next action
        setTimeout(() => {
            this.battleManager.executeNextAction();
        }, 500);
    }

    /**
     * Generate a set of actions for the current turn
     */
    generateTurnActions() {
        console.log("[BattleFlowController] generateTurnActions called - SHELL IMPLEMENTATION");
        return this.battleManager.generateTurnActions();
    }

    /**
     * Execute the next action in the queue
     * Migrated from BattleManager.executeNextAction
     */
    async executeNextAction() {
        // Guard clauses
        if (!this.battleManager.battleActive || this.battleManager.isPaused) {
            this.battleManager.turnInProgress = false;
            return;
        }
        
        if (this.battleManager.actionQueue.length === 0) {
            this.finishTurn();
            return;
        }
        
        const action = this.battleManager.actionQueue.shift();
        
        // Check if the actor is still alive before proceeding
        if (action.actor.isDefeated || action.actor.currentHp <= 0) {
            console.log(`Skipping action for defeated character: ${action.actor.name}`);
            // Skip to next action
            this.executeNextAction();
            return;
        }
        
        // Check if the target is still alive (unless it's a healing ability)
        const isHealing = action.ability && (action.ability.isHealing || action.ability.damageType === 'healing');
        if (!isHealing && (action.target.isDefeated || action.target.currentHp <= 0)) {
            // Target is defeated, find a new target
            console.log(`Original target defeated, finding new target for ${action.actor.name}`);
            
            // Determine possible targets based on team
            const possibleTargets = action.team === 'player' ? this.battleManager.enemyTeam : this.battleManager.playerTeam;
            
            // Filter for living targets
            const livingTargets = possibleTargets.filter(target => !target.isDefeated && target.currentHp > 0);
            
            if (livingTargets.length === 0) {
                // No valid targets left, skip this action
                console.log(`No valid targets left for ${action.actor.name}, skipping action`);
                this.executeNextAction();
                return;
            }
            
            // Select a new random target
            action.target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            console.log(`New target selected: ${action.target.name}`);
            
            // Recalculate damage for the new target
            const { damage, scalingText, scalingStat } = this.battleManager.calculateDamage(action.actor, action.target, action.ability);
            action.damage = damage;
            action.scalingText = scalingText;
            action.scalingStat = scalingStat;
        }
        
        // Add team to actor and target if not set
        if (!action.actor.team) {
            action.actor.team = action.team;
        }
        
        if (!action.target.team) {
            action.target.team = action.team === 'player' ? 'enemy' : 'player';
        }
        
        // Generate uniqueId for actor and target if needed
        if (!action.actor.uniqueId) {
            action.actor.uniqueId = `${action.actor.team}_${action.actor.id}`;
        }
        
        if (!action.target.uniqueId) {
            action.target.uniqueId = `${action.target.team}_${action.target.id}`;
        }
        
        // Log the action (DISABLED FOR BATTLE LOG - sent to console only)
        let message;
        // Add team info to actor and target names for better clarity
        const actorName = `${action.actor.name}${action.team === 'player' ? ' (ally)' : ' (enemy)'}`;        
        const targetName = `${action.target.name}${action.team === 'player' ? ' (enemy)' : ' (ally)'}`;        
        
        if (action.useAbility) {
            // Handle different ability types in log message
            if (action.ability.isHealing || action.ability.damageType === 'healing') {
                message = `${actorName} uses [${action.ability.name}] to heal ${targetName}!`;
            } else if (action.ability.damageType === 'utility') {
                message = `${actorName} uses [${action.ability.name}]!`;
            } else {
                message = `${actorName} uses [${action.ability.name}] on ${targetName}!`;
            }
        } else {
            message = `${actorName} attacks ${targetName} for ${action.damage} damage!`;
        }
        // DEACTIVATED: No longer send to Battle Log, only log to console
        console.log(`[BattleFlowController.executeNextAction - Simpler Log Block - DEACTIVATED FOR BATTLE LOG]: ${message}`);
        
        // Generate and log proper action declaration for the battle log
        if (action && action.actor) {
            console.log(`[BattleFlowController.executeNextAction - Detailed Log] Action received:`, JSON.parse(JSON.stringify(action)));
            
            // Add team identifiers for clarity
            const actorName = `${action.actor.name}${action.team === 'player' ? ' (ally)' : ' (enemy)'}`;
            
            // Create the message based on action type and target type
            let actionDeclaration = "";
            
            if (action.useAbility && action.ability) {
                // Format for different targeting scenarios
                if (Array.isArray(action.target)) {
                    const targetCount = action.target.length;
                    actionDeclaration = `${actorName} uses [${action.ability.name}] on ${targetCount} targets!`;
                } else {
                    const targetName = `${action.target.name}${action.target.team === 'player' ? ' (ally)' : ' (enemy)'}`;
                    actionDeclaration = `${actorName} uses [${action.ability.name}] on ${targetName}!`;
                }
            } else {
                // Auto attack message
                const targetName = action.target ? `${action.target.name}${action.target.team === 'player' ? ' (ally)' : ' (enemy)'}` : "target";
                actionDeclaration = `${actorName} performs an auto attack on ${targetName}!`;
            }
            
            // Log the action declaration
            console.log(`[BattleFlowController.executeNextAction - Detailed Log] Built actionDeclaration for Battle Log: "${actionDeclaration}"`);
            console.log(`[BattleFlowController.executeNextAction - Detailed Log] Action object for this declaration:`, JSON.parse(JSON.stringify(action)));
            if (this.battleManager && typeof this.battleManager.logMessage === 'function') {
            console.log(`[BattleFlowController.executeNextAction - Detailed Log] Calling this.battleManager.logMessage for action declaration.`);
            this.battleManager.logMessage(actionDeclaration, 'action');
            } else {
            console.error('[BattleFlowController.executeNextAction - Detailed Log] this.battleManager.logMessage is NOT available or not a function for action declaration!');
            }
        }
        
        // Dispatch CHARACTER_ACTION event directly via BattleBridge
        if (window.battleBridge) {
            try {
                console.log(`[BattleFlowController] Dispatching CHARACTER_ACTION event for ${action.actor.name}`);
                
                // TEMPORARY DIAGNOSTIC - Remove after bug fix
                if (action && action.actor && action.target) {
                    console.log(`[BattleFlowController DIAGNOSTIC] Processed action: ${action.actor.name} (Team: ${action.actor.team}) targeting ${action.target.name ? action.target.name : 'multi-target'} (Target Team: ${action.target.team ? action.target.team : 'N/A'}). Is same team (if single target): ${action.target.name && action.actor.team === action.target.team}`);
                }
                
                if (action.useAbility) {
                    // For ability actions
                    window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.CHARACTER_ACTION, {
                        character: action.actor,
                        action: {
                            type: 'ability',
                            actionType: 'ability', // Ensure both type and actionType are set for consistency
                            name: action.ability.name,
                            abilityName: action.ability.name,
                            target: action.target
                        }
                    });
                } else {
                    // For auto-attack actions
                    window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.CHARACTER_ACTION, {
                        character: action.actor,
                        action: {
                            type: 'autoAttack',
                            actionType: 'autoAttack', // Ensure both type and actionType are set for consistency
                            name: 'Auto Attack',
                            abilityName: 'Auto Attack', // Add abilityName for consistency
                            target: action.target
                        }
                    });
                }
            } catch (error) {
                console.error('[BattleFlowController] Error dispatching CHARACTER_ACTION event:', error);
            }
        }
        
        // Apply action effect directly
        console.log('[BFC executeNextAction] About to call this.applyActionEffect. Action Actor:', action?.actor?.name, 'Action Type:', action?.actionType);
        console.log('[BFC executeNextAction] Is this.battleManager.applyActionEffect the BattleBridge patched version? (Look for "BattleBridge: applyActionEffect patched method called" in its definition if we log the function itself). Function Def:', this.battleManager.applyActionEffect.toString().substring(0, 200) + "..."); // Log first 200 chars of function
        await this.applyActionEffect(action);
        
        // DIAGNOSTIC: Trace executeNextAction flow - Remove later
        console.log(`>>> BFC.executeNextAction: Effect applied for ${action?.actor?.name}.`);
        
        console.log(`>>> BFC.executeNextAction: Checking battle end...`);
        if (await this.checkBattleEnd()) {
            console.log(`>>> BFC.executeNextAction: Battle ended, returning.`);
            return; // Battle ended, don't continue
        }
        console.log(`>>> BFC.executeNextAction: Battle not ended.`);
        
        console.log(`>>> BFC.executeNextAction: Scheduling next action...`);
        const actualDelay = this.battleManager.actionDelay / this.battleManager.speedMultiplier;
        setTimeout(() => {
            this.executeNextAction();
        }, actualDelay);
    }

    /**
     * Apply the effect of an action to its target
     * Migrated from BattleManager.applyActionEffect
     * @param {Object} action - The action to apply
     */
    async applyActionEffect(action) {
        // [DEBUGGING] Log the action object
        console.log(`[BattleFlowController.applyActionEffect] Entered. Action received:`, JSON.parse(JSON.stringify(action)));
        // Get team info for clearer logging
        const actorTeam = action.team;
        const targetTeam = actorTeam === 'player' ? 'enemy' : 'player';
        
        // HOTFIX8: Enhanced multi-target handling
        // Handle array of targets (for multi-target abilities)
        if (Array.isArray(action.target)) {
            console.log(`[BattleFlowController] Processing multi-target action with ${action.target.length} targets`);
            
            
            
            // Process each target individually
            for (let i = 0; i < action.target.length; i++) {
                const target = action.target[i];
                
                // Create a single-target version of the action
                const singleAction = {
            ...action, 
            target,
            // Explicitly copy these properties to ensure they propagate correctly for AoE abilities
            actionType: action.actionType || (action.useAbility ? 'ability' : 'autoAttack'),
            abilityName: action.useAbility && action.ability ? action.ability.name : 'Auto Attack',
            // Mark this as a sub-action from an AoE ability to prevent duplicate CHARACTER_ACTION events
            _isAoeSubAction: true
        };
                
                // HOTFIX8: Use pre-calculated damage if available
                if (action.isMultiTarget && action.targetDamages && action.targetDamages[i]) {
                    singleAction.damage = action.targetDamages[i].damage;
                }
                
                await this.applyActionEffect(singleAction);
            }
            return;
        }
        
        // Check if this is an action with the new effects array
        if (action.ability && action.ability.effects && Array.isArray(action.ability.effects) && action.ability.effects.length > 0) {
            // Store the target's original health before processing effects
            const originalHealth = action.target.currentHp;
            
            // New effect system - process each effect in the array
            for (const effect of action.ability.effects) {
                this.battleManager.processEffect(effect, action.actor, action.target, action.ability);
            }
            
            // After processing all effects, check if health has changed
            const newHealth = action.target.currentHp;
            const healthChange = originalHealth - newHealth;
            
            // If health decreased (damage was dealt)
            if (healthChange > 0) {
                console.log(`Effects array reduced ${action.target.name}'s health by ${healthChange}`);
                
                // Dispatch CHARACTER_DAMAGED event
                if (window.battleBridge && healthChange > 0) {
                    try {
                        window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.CHARACTER_DAMAGED, {
                            character: action.target,
                            target: action.target,
                            newHealth: action.target.currentHp,
                            maxHealth: action.target.stats.hp,
                            amount: healthChange,
                            source: action.actor,
                            ability: action.ability
                        });
                    } catch (error) {
                        console.error('[BattleFlowController] Error dispatching CHARACTER_DAMAGED event:', error);
                    }
                }
            } 
            // If health increased (healing was applied)
            else if (healthChange < 0) {
                const healAmount = Math.abs(healthChange);
                console.log(`Effects array increased ${action.target.name}'s health by ${healAmount}`);
                
                // Dispatch CHARACTER_HEALED event
                if (window.battleBridge && healAmount > 0) {
                    try {
                        window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.CHARACTER_HEALED, {
                            character: action.target,
                            target: action.target,
                            newHealth: action.target.currentHp,
                            maxHealth: action.target.stats.hp,
                            amount: healAmount,
                            source: action.actor,
                            ability: action.ability
                        });
                    } catch (error) {
                        console.error('[BattleFlowController] Error dispatching CHARACTER_HEALED event:', error);
                    }
                }
            }
            
            return;
        }
        
        // Legacy action processing
        if (action.ability && (action.ability.isHealing || action.ability.damageType === 'healing')) {
            // Defensive check for HealingProcessor
            if (!this.battleManager.healingProcessor) {
                console.error("[BattleFlowController] HealingProcessor component not found! Cannot apply healing.");
                return; // Exit early if component is missing
            }
            
            // Call the HealingProcessor to apply the healing and get results
            const result = this.battleManager.healingProcessor.applyHealing(
                action.target,
                action.damage,           // The pre-calculated potential healing amount
                action.actor,            // Source of healing
                action.ability,          // Ability used
                action.ability.name || 'healing'  // Healing type
            );
            
            // Get healing results
            const actualHealing = result.actualHealing;
            const revived = result.revived;
            
            // Check and reset death status if needed
            if (revived) {
                this.battleManager.healingProcessor.checkAndResetDeathStatus(action.target);
            }
            
            // Include team info in the log message for healing too
            const targetTeam = action.target.team;
            const targetInfo = `${action.target.name}${targetTeam === 'player' ? ' (ally)' : ' (enemy)'}`;
            
            // Add scaling information to healing message
            if (action.scalingText) {
                this.battleManager.logMessage(`${targetInfo} is healed for ${actualHealing} HP ${action.scalingText}! (HP: ${action.target.currentHp}/${action.target.stats.hp})`, 'success');
            } else {
                this.battleManager.logMessage(`${targetInfo} is healed for ${actualHealing} HP! (HP: ${action.target.currentHp}/${action.target.stats.hp})`, 'success');
            }
            
            // Process healing-related passive abilities
            
            // 1. onHealed for the target
            if (actualHealing > 0) {
                this.battleManager.processPassiveAbilities('onHealed', action.target, {
                    source: action.actor,
                    healAmount: actualHealing,
                    ability: action.ability,
                    healPercent: action.target.stats.hp > 0 ? actualHealing / action.target.stats.hp : 0 // Add healing percentage
                });
                
                // Show passive trigger visual feedback if using BattleUI
                if (this.battleManager.battleUI && this.battleManager.battleUI.showPassiveEffect) {
                    this.battleManager.battleUI.showPassiveEffect(action.target, 'Healing received');
                }
            }
            
            // 2. onHealingDone for the healer
            if (actualHealing > 0 && action.actor !== action.target) { // Only trigger for healing others
                this.battleManager.processPassiveAbilities('onHealingDone', action.actor, {
                    target: action.target,
                    healAmount: actualHealing,
                    ability: action.ability,
                    healPercent: action.target.stats.hp > 0 ? actualHealing / action.target.stats.hp : 0 // Add healing percentage
                });
                
                // Show passive trigger visual feedback if using BattleUI
                if (this.battleManager.battleUI && this.battleManager.battleUI.showPassiveEffect) {
                    this.battleManager.battleUI.showPassiveEffect(action.actor, 'Healing done');
                }
            }
            
            // Process revival passive if character was revived
            if (revived) {
                this.battleManager.processPassiveAbilities('onRevive', action.target, {
                    reviver: action.actor,
                    ability: action.ability
                });
            }
            
            // Add regeneration status if it's a healing ability
            if (Math.random() < 0.5) { // 50% chance
                this.battleManager.addStatusEffect(action.target, 'regen', 2);
            }
        } else if (action.ability && action.ability.damageType === 'utility') {
            // Utility ability - special effects instead of damage
            const targetTeam = action.target.team;
            const targetInfo = `${action.target.name}${targetTeam === 'player' ? ' (ally)' : ' (enemy)'}`;
            
            // Handle different utility effects
            if (action.ability.name === "Evasive Maneuver") {
                // Add evasion effect (this is just a placeholder, evasion mechanic would need to be implemented)
                this.battleManager.logMessage(`${targetInfo} becomes harder to hit!`, 'info');
                this.battleManager.addStatusEffect(action.target, 'defense_up', 2);
            } else {
                // Generic utility effect message
                this.battleManager.logMessage(`${targetInfo} is affected by ${action.ability.name}!`, 'info');
            }
        } else {
            // Damaging action
            // Declare variables for tracking damage and killed state
            let actualDamage = 0;
            let killed = false;
            
             // Ensure DamageCalculator component is available
            if (!this.battleManager.damageCalculator) {
                 console.error('[BattleFlowController] DamageCalculator component not found! Cannot apply damage.');
                 return; // Or handle error appropriately
            }

            // Directly use DamageCalculator to apply damage and get results
            const result = this.battleManager.damageCalculator.applyDamage(
                action.target,
                action.damage,        // The pre-calculated potential damage
                action.actor,
                action.ability,
                action.damageType || 'physical' // Pass damage type or default
            );

            // Store the result values locally for subsequent processing
            actualDamage = result.actualDamage; // Assign from result
            killed = result.killed;             // Assign from result
            
            // Include team info in the log message for clarity when characters share names
            // For targets, we need to use opposite team designation from the actor
            const targetTeam = action.team === 'player' ? 'enemy' : 'player';
            const targetInfo = `${action.target.name}${targetTeam === 'player' ? ' (ally)' : ' (enemy)'}`;
            
            // Add scaling information to damage message
            if (action.scalingText) {
                this.battleManager.logMessage(`${targetInfo} takes ${actualDamage} damage ${action.scalingText}! (HP: ${action.target.currentHp}/${action.target.stats.hp})`, action.useAbility ? 'error' : 'default');
            } else {
                this.battleManager.logMessage(`${targetInfo} takes ${actualDamage} damage! (HP: ${action.target.currentHp}/${action.target.stats.hp})`, action.useAbility ? 'error' : 'default');
            }
            
            // Process damage-related passive abilities
            
            // 1. onDamageTaken for the target
            if (actualDamage > 0) {
                this.battleManager.processPassiveAbilities('onDamageTaken', action.target, {
                    source: action.actor,
                    damageAmount: actualDamage,
                    ability: action.ability,
                    wasCritical: false, // TODO: Add critical hit tracking
                    reflectionDepth: 0 // Initialize reflection depth tracking
                });
            }
            
            // 2. onDamageDealt for the attacker
            if (actualDamage > 0) {
                this.battleManager.processPassiveAbilities('onDamageDealt', action.actor, {
                    target: action.target,
                    damageAmount: actualDamage,
                    ability: action.ability,
                    wasCritical: false, // TODO: Add critical hit tracking
                    damagePercent: action.target.stats.hp > 0 ? actualDamage / action.target.stats.hp : 0 // Add damage percentage
                });
            }
            
            // Handle defeat logic separately from damage application
            if (killed) {
                action.target.isDefeated = true;
                action.target.currentHp = 0; // Ensure HP doesn't go below 0
                // Use the same targetInfo for defeat message
                this.battleManager.logMessage(`${targetInfo} is defeated! ⚰️`, 'error'); // Added coffin emoji for visibility
                
                // Process defeat passive abilities
                this.battleManager.processPassiveAbilities('onDefeat', action.target, {
                    killer: action.actor,
                    ability: action.ability
                });
                
                // Process on-kill passive ability with visual feedback
                const killResults = this.battleManager.processPassiveAbilities('onKill', action.actor, {
                    defeated: action.target,
                    ability: action.ability
                });
                
                // Show visual feedback for kill effects if there were executed passives
                if (killResults && killResults.length > 0 && this.battleManager.battleUI && this.battleManager.battleUI.showPassiveEffect) {
                    const passiveNames = killResults
                        .filter(result => result.executed)
                        .map(result => {
                            // Extract passive name from message if available
                            if (result.message && result.message.includes("'s")) {
                                return result.message.split("'s")[1].trim();
                            }
                            return 'Kill Effect';
                        });
                    
                    if (passiveNames.length > 0) {
                        // Show the passive effect visualization
                        this.battleManager.battleUI.showPassiveEffect(action.actor, passiveNames[0]);
                    }
                }
            }
        }
    }
    
    /**
     * Finish the current turn
     */
    async finishTurn() {
        // Set turn flag to false
        this.battleManager.turnInProgress = false;
        
        // Reduce ability cooldowns for all characters on both teams
        console.log('[BattleFlowController] Reducing ability cooldowns at end of turn');
        
        // Process player team cooldowns
        this.battleManager.playerTeam.forEach(character => {
            if (character && character.abilities && Array.isArray(character.abilities)) {
                character.abilities.forEach(ability => {
                    if (ability && ability.currentCooldown && ability.currentCooldown > 0) {
                        ability.currentCooldown--;
                        console.log(`[BattleFlowController] Reduced ${character.name}'s ${ability.name} cooldown to ${ability.currentCooldown}`);
                    }
                });
            }
        });
        
        // Process enemy team cooldowns
        this.battleManager.enemyTeam.forEach(character => {
            if (character && character.abilities && Array.isArray(character.abilities)) {
                character.abilities.forEach(ability => {
                    if (ability && ability.currentCooldown && ability.currentCooldown > 0) {
                        ability.currentCooldown--;
                        console.log(`[BattleFlowController] Reduced ${character.name}'s ${ability.name} cooldown to ${ability.currentCooldown}`);
                    }
                });
            }
        });
        
        // Delegate end-of-turn passive processing
        this.battleManager.processPassiveAbilities('onTurnEnd', null, { controller: this });
        
        // Delegate turn summary logging
        this.battleManager.displayTurnSummary();
        
        // Check if battle has ended
        const battleOver = await this.checkBattleEnd();
        
        // If battle continues, schedule next turn
        if (!battleOver) {
            const baseDelay = this.battleManager.turnDelay;
            const speedMultiplier = this.battleManager.speedMultiplier;
            const actualDelay = baseDelay / speedMultiplier;
            
            setTimeout(() => this.startNextTurn(), actualDelay);
        }
        
        // Dispatch TURN_ENDED event
        if (window.battleBridge) {
            try {
                console.log('[BattleFlowController] Dispatching TURN_ENDED event');
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.TURN_ENDED, {
                    turnNumber: this.battleManager.currentTurn
                });
            } catch (error) {
                console.error('[BattleFlowController] Error dispatching TURN_ENDED event:', error);
            }
        }
    }

    /**
     * Check if the battle is over
     * @returns {boolean} True if the battle is over
     */
    async checkBattleEnd() {
        // Count defeated members in each team- UPDATED: Use isDefeated for consistency with applyActionEffect
const playerDefeated = this.battleManager.playerTeam.filter(char => char.isDefeated || char.currentHp <= 0).length;
const enemyDefeated = this.battleManager.enemyTeam.filter(char => char.isDefeated || char.currentHp <= 0).length;
        
        // Determine if all players or all enemies are defeated
        const allPlayersDefeated = playerDefeated >= this.battleManager.playerTeam.length;
        const allEnemiesDefeated = enemyDefeated >= this.battleManager.enemyTeam.length;
        
        // If battle has ended, call endBattle with appropriate result
        if (allPlayersDefeated || allEnemiesDefeated) {
            let result = 'draw';
            
            if (allPlayersDefeated && !allEnemiesDefeated) {
                result = 'defeat';
            } else if (!allPlayersDefeated && allEnemiesDefeated) {
                result = 'victory';
            }
            
            await this.endBattle(result);
            return true;
        }
        
        return false;
    }
    
    /**
     * End the battle with the given result
     * @param {string} result - The battle result ('victory', 'defeat', or 'draw')
     */
    async endBattle(result) {
        // TEMPORARY DEBUGGING: Log entry to endBattle with result
        console.log("[DEBUG BattleFlowController] endBattle called with result:", result);
        console.trace("[DEBUG BattleFlowController] endBattle entry stack trace");
        
        // Set battle state to inactive
        this.battleManager.battleActive = false;
        
        // Clear the turn timer
        clearTimeout(this.battleManager.turnTimer);
        
        // Delegate end-of-battle passive processing
        this.battleManager.processPassiveAbilities('onBattleEnd', { result });
        
        // Log battle result
        const resultMessages = {
            'victory': 'Victory! All enemies have been defeated.',
            'defeat': 'Defeat! Your team has been defeated.',
            'draw': 'Draw! Both teams have been defeated.'
        };
        
        this.battleManager.logMessage(resultMessages[result], 'battle-result');
        
        // Dispatch BATTLE_ENDED Event
        if (window.battleBridge) {
            try {
                console.log(`[BattleFlowController] Dispatching BATTLE_ENDED event. Winner: ${result}`);
                // TEMPORARY DEBUGGING: Log what we're about to dispatch and stack trace
                console.log("[DEBUG BattleFlowController] Directly dispatching BATTLE_ENDED via battleBridge. Winner:", result);
                console.trace("[DEBUG BattleFlowController] Direct dispatch stack trace");
                
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_ENDED, { winner: result });
            } catch (error) { 
                console.error('[BattleFlowController] Error dispatching BATTLE_ENDED event:', error); 
            }
        }
        
        // Delegate DOM UI update
        if (this.battleManager.battleUI) {
            console.log("[DEBUG BattleFlowController] Calling battleUI.showBattleResult with result:", result);
            this.battleManager.battleUI.showBattleResult(result);
        }
    }
}

// Make BattleFlowController available globally for traditional scripts
if (typeof window !== 'undefined') {
  window.BattleFlowController = BattleFlowController;
  console.log("BattleFlowController class definition loaded and exported to window.BattleFlowController");
}

// Legacy global assignment for maximum compatibility
window.BattleFlowController = BattleFlowController;