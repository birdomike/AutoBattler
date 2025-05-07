/**
 * AbilityProcessor.js
 * Processes ability effects and execution
 * Version 0.5.26.1 - Initial implementation of AbilityProcessor component
 * 
 * REFACTORING PURPOSE:
 * This component extracts ability processing logic from BattleManager.js as part
 * of the modular refactoring effort, following the Clean As You Go approach.
 * It handles all aspects of applying ability effects to targets, processing different
 * effect types, and managing ability interactions.
 */

class AbilityProcessor {
    /**
     * Create a new Ability Processor
     * @param {Object} battleManager - The main battle manager
     */
    constructor(battleManager) {
        this.battleManager = battleManager;
        
        // Log initialization with version info
        console.log("[AbilityProcessor] Version 0.5.26.1 - Initializing AbilityProcessor component");
    }

    /**
     * Apply the effect of an action to its target
     * @param {Object} action - The action to apply
     * REFACTORING: Extracted from BattleManager.applyActionEffect and BattleFlowController.applyActionEffect
     */
    applyActionEffect(action) {
        // Defensive check for null/undefined action
        if (!action) {
            console.error("[AbilityProcessor] Cannot apply effect of undefined action");
            return;
        }

        // Get team info for clearer logging
        const actorTeam = action.team;
        const targetTeam = actorTeam === 'player' ? 'enemy' : 'player';
        
        // Handle array of targets (for multi-target abilities)
        if (Array.isArray(action.target)) {
            // Process each target individually
            for (const target of action.target) {
                // Create a single-target version of the action
                const singleAction = {...action, target};
                this.applyActionEffect(singleAction);
            }
            return;
        }
        
        // Check if this is an action with the new effects array
        if (action.ability && action.ability.effects && Array.isArray(action.ability.effects) && action.ability.effects.length > 0) {
            // Store the target's original health before processing effects
            const originalHealth = action.target.currentHp;
            
            // New effect system - process each effect in the array
            for (const effect of action.ability.effects) {
                this.processEffect(effect, action.actor, action.target, action.ability);
            }
            
            // After processing all effects, check if health has changed
            const newHealth = action.target.currentHp;
            const healthChange = originalHealth - newHealth;
            
            // If health decreased (damage was dealt)
            if (healthChange > 0) {
                console.log(`[AbilityProcessor] Effects array reduced ${action.target.name}'s health by ${healthChange}`);
                
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
                        console.error('[AbilityProcessor] Error dispatching CHARACTER_DAMAGED event:', error);
                    }
                }
            } 
            // If health increased (healing was applied)
            else if (healthChange < 0) {
                const healAmount = Math.abs(healthChange);
                console.log(`[AbilityProcessor] Effects array increased ${action.target.name}'s health by ${healAmount}`);
                
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
                        console.error('[AbilityProcessor] Error dispatching CHARACTER_HEALED event:', error);
                    }
                }
            }
            
            return;
        }
        
        // Legacy action processing
        if (action.ability && (action.ability.isHealing || action.ability.damageType === 'healing')) {
            // Defensive check for HealingProcessor
            if (!this.battleManager.healingProcessor) {
                console.error("[AbilityProcessor] HealingProcessor component not found! Cannot apply healing.");
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
            // Updated to use consistent 5-parameter format with explicit source and stacks
                this.battleManager.addStatusEffect(action.target, 'regen', action.actor, 2, 1);
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
                 console.error('[AbilityProcessor] DamageCalculator component not found! Cannot apply damage.');
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
     * Process a single effect from an ability's effects array
     * @param {Object} effect - The effect to process
     * @param {Object} actor - The character using the ability
     * @param {Object} target - The target of the effect
     * @param {Object} ability - The ability being used
     * REFACTORING: Extracted from BattleManager.processEffect
     */
    processEffect(effect, actor, target, ability) {
        // Defensive checks for null/undefined parameters
        if (!effect) {
            console.error("[AbilityProcessor] Cannot process undefined effect");
            return;
        }
        if (!actor) {
            console.error("[AbilityProcessor] Cannot process effect with undefined actor");
            return;
        }
        if (!target) {
            console.error("[AbilityProcessor] Cannot process effect with undefined target");
            return;
        }

        // Get team identifiers for logging
        const actorTeamId = actor.team === 'player' ? ' (ally)' : ' (enemy)';
        const targetTeamId = target.team === 'player' ? ' (ally)' : ' (enemy)';
        const actorInfo = `${actor.name}${actorTeamId}`;
        const targetInfo = `${target.name}${targetTeamId}`;
        
        // Check if this effect should apply based on team relationships
        const isTargetAlly = target.team === actor.team || target.isAllyOf === true;
        
        // Skip if effect shouldn't apply to allies but target is an ally
        if (effect.targetAllies === false && isTargetAlly) {
            console.debug(`[AbilityProcessor] Skipping effect on ${target.name}: ally=${isTargetAlly}, effect allows allies: false`);
            return; // Skip this effect
        }
        
        // Skip if effect shouldn't apply to enemies but target is an enemy
        if (effect.targetEnemies === false && !isTargetAlly) {
            console.debug(`[AbilityProcessor] Skipping effect on ${target.name}: ally=${isTargetAlly}, effect allows enemies: false`);
            return; // Skip this effect
        }
        
        console.debug(`[AbilityProcessor] Processing effect on ${target.name}: isAlly=${isTargetAlly}, effect allows allies: ${effect.targetAllies !== false}, effect allows enemies: ${effect.targetEnemies !== false}`);
        
        // Handle different effect types
        switch (effect.type) {
            case 'Damage':
            case 'damage':
                // Only apply damage if target is an enemy or area damage specifically allows allies
                if (!isTargetAlly || effect.targetAllies === true) {
                    // Check if DamageCalculator component is available
                    if (!this.battleManager.damageCalculator) {
                        console.error("[AbilityProcessor] DamageCalculator component not found! Cannot calculate damage.");
                        return; // Exit early if component is missing
                    }
                    
                    // Calculate damage for this specific effect
                    const damageResult = this.battleManager.damageCalculator.calculateDamage(actor, target, ability, effect);
                    const damage = damageResult.damage;
                    
                    // Apply damage to target
                    target.currentHp = Math.max(0, target.currentHp - damage);
                    
                    // Log the damage
                    if (damageResult.scalingText) {
                        this.battleManager.logMessage(`${targetInfo} takes ${damage} damage ${damageResult.scalingText}! (HP: ${target.currentHp}/${target.stats.hp})`, 'error');
                    } else {
                        this.battleManager.logMessage(`${targetInfo} takes ${damage} damage! (HP: ${target.currentHp}/${target.stats.hp})`, 'error');
                    }
                    
                    // Dispatch CHARACTER_DAMAGED event for UI updates
                    if (window.battleBridge && damage > 0) {
                        try {
                            window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.CHARACTER_DAMAGED, {
                                character: target,
                                target: target, // Keep both for backwards compatibility
                                newHealth: target.currentHp,
                                maxHealth: target.stats.hp,
                                amount: damage,
                                source: actor,
                                ability: ability
                            });
                        } catch (error) {
                            console.error('[AbilityProcessor] Error dispatching CHARACTER_DAMAGED event:', error);
                        }
                    }
                    
                    // Check if target died
                    if (target.currentHp <= 0) {
                        target.isDead = true;
                        target.currentHp = 0; // Ensure HP doesn't go below 0
                        this.battleManager.logMessage(`${targetInfo} is defeated! ⚰️`, 'error');
                        
                        // Process defeat and kill passives
                        this.battleManager.processPassiveAbilities('onDefeat', target, {
                            killer: actor,
                            ability: ability
                        });
                        
                        this.battleManager.processPassiveAbilities('onKill', actor, {
                            defeated: target,
                            ability: ability
                        });
                    }
                    
                    // Process damage-related passive abilities
                    if (damage > 0) {
                        // onDamageTaken for the target
                        this.battleManager.processPassiveAbilities('onDamageTaken', target, {
                            source: actor,
                            damageAmount: damage,
                            ability: ability,
                            wasCritical: damageResult.isCritical || false,
                            reflectionDepth: 0 // Initialize reflection depth tracking
                        });
                        
                        // onDamageDealt for the attacker
                        this.battleManager.processPassiveAbilities('onDamageDealt', actor, {
                            target: target,
                            damageAmount: damage,
                            ability: ability,
                            wasCritical: damageResult.isCritical || false
                        });
                    }
                }
                break;
                
            case 'Healing':
            case 'healing':
                // Only apply healing if target is an ally or area healing specifically allows enemies
                if (isTargetAlly || effect.targetEnemies === true) {
                    // Check if HealingProcessor component is available
                    if (!this.battleManager.healingProcessor) {
                        console.error("[AbilityProcessor] HealingProcessor component not found! Cannot apply healing.");
                        return; // Exit early if component is missing
                    }
                    
                    // Calculate the healing amount using damage calculator as a base (healers use damage calculation too)
                    const healResult = this.battleManager.damageCalculator.calculateDamage(actor, target, ability, effect);
                    const healAmount = healResult.damage; // We reuse damage calculation for healing
                    
                    // Apply healing using the HealingProcessor
                    const result = this.battleManager.healingProcessor.applyHealing(
                        target,
                        healAmount,     // The calculated healing amount
                        actor,          // Source of healing
                        ability,        // Ability used
                        effect.type || 'healing'  // Healing type
                    );
                    
                    // Get actual healing applied and revival status
                    const actualHealing = result.actualHealing;
                    const revived = result.revived;
                    
                    // Check and reset death status if needed
                    if (revived) {
                        this.battleManager.healingProcessor.checkAndResetDeathStatus(target);
                    }
                    
                    // Log the healing with scaling info if available
                    if (healResult.scalingText) {
                        this.battleManager.logMessage(`${targetInfo} is healed for ${actualHealing} HP ${healResult.scalingText}! (HP: ${target.currentHp}/${target.stats.hp})`, 'success');
                    } else {
                        this.battleManager.logMessage(`${targetInfo} is healed for ${actualHealing} HP! (HP: ${target.currentHp}/${target.stats.hp})`, 'success');
                    }
                    
                    // Process healing-related passive abilities
                    if (actualHealing > 0) {
                        // onHealed for the target
                        this.battleManager.processPassiveAbilities('onHealed', target, {
                            source: actor,
                            healAmount: actualHealing,
                            ability: ability
                        });
                        
                        // onHealingDone for the healer (if not self-healing)
                        if (actor !== target) {
                            this.battleManager.processPassiveAbilities('onHealingDone', actor, {
                                target: target,
                                healAmount: actualHealing,
                                ability: ability
                            });
                        }
                    }
                    
                    // Process revival passive if character was revived
                    if (revived) {
                        this.battleManager.processPassiveAbilities('onRevive', target, {
                            reviver: actor,
                            ability: ability
                        });
                    }
                }
                break;
                
            case 'ApplyStatus':
            case 'applyStatus':
                // Check if StatusEffectManager component is available
                if (!this.battleManager.statusEffectManager) {
                    console.error("[AbilityProcessor] StatusEffectManager component not found! Cannot apply status effect.");
                    return; // Exit early if component is missing
                }
                
                // Apply status based on team relationships
                // Buffs typically go to allies, debuffs to enemies
                const statusId = effect.statusEffectId;
                const duration = effect.duration || 2;
                let applyStatus = true;
                
                // Get the definition to check if it's a buff or debuff
                const statusDef = this.battleManager.statusEffectLoader ? 
                    this.battleManager.statusEffectLoader.getDefinition(statusId) : 
                    (this.battleManager.statusEffectDefinitions ? this.battleManager.statusEffectDefinitions[statusId] : null);
                
                const isBuffType = statusDef && (statusDef.type === 'Buff' || statusDef.type === 'HoT' || statusDef.type === 'Shield');
                const isDebuffType = statusDef && (statusDef.type === 'Debuff' || statusDef.type === 'DoT' || statusDef.type === 'Control');
                
                // Check default targeting behavior if not explicitly specified
                // By default, buffs go to allies and debuffs go to enemies
                if (effect.targetAllies === undefined && effect.targetEnemies === undefined) {
                    if (isBuffType && !isTargetAlly) applyStatus = false;
                    if (isDebuffType && isTargetAlly) applyStatus = false;
                }
                
                // Check if the status effect has a chance component
                if (effect.chance && effect.chance < 1.0) {
                    // Only apply if random roll succeeds
                    applyStatus = applyStatus && (Math.random() < effect.chance);
                    if (!applyStatus) {
                        this.battleManager.logMessage(`${actorInfo}'s attempt to inflict ${statusId} failed!`, 'info');
                    }
                }
                
                // Apply the status effect if applicable
                if (applyStatus) {
                    // Get status name for better messaging
                    const statusName = statusDef ? statusDef.name : statusId;
                    
                    // Apply status effect using the StatusEffectManager
                    const applied = this.battleManager.statusEffectManager.addStatusEffect(target, statusId, actor, duration, 1); // Added explicit stacks parameter
                    
                    if (applied) {
                        // Log the application
                        if (isBuffType) {
                            this.battleManager.logMessage(`${targetInfo} gains ${statusName} for ${duration} turns!`, 'success');
                        } else {
                            this.battleManager.logMessage(`${targetInfo} is afflicted with ${statusName} for ${duration} turns!`, 'error');
                        }
                        
                        // Update status icons
                        this.battleManager.statusEffectManager.updateStatusIcons(target);
                    }
                }
                break;
                
            case 'StatBuff':
            case 'statBuff':
                // Apply stat buffs based on team relationships
                // By default, positive stat mods go to allies, negative to enemies
                const isPositiveMod = !effect.value || effect.value > 0;
                
                // Skip if doesn't match team targeting rules
                if ((isPositiveMod && !isTargetAlly && effect.targetEnemies !== true) ||
                    (!isPositiveMod && isTargetAlly && effect.targetAllies !== true)) {
                    break;
                }
                
                // Not fully implemented yet, will add in Pass 6 with status effect system refactor
                this.battleManager.logMessage(`${targetInfo} receives a stat modification from ${actorInfo}!`, 'info');
                
                // For now, map common stat buffs to existing status effects
                if (effect.targetStat === 'Attack') {
                    // Updated to use consistent 5-parameter format with explicit source and stacks
                    this.battleManager.addStatusEffect(target, isPositiveMod ? 'status_atk_up' : 'status_atk_down', actor, effect.duration || 3, 1);
                } else if (effect.targetStat === 'Defense') {
                    // Updated to use consistent 5-parameter format with explicit source and stacks
                    this.battleManager.addStatusEffect(target, isPositiveMod ? 'status_def_up' : 'status_def_down', actor, effect.duration || 3, 1);
                }
                break;
                
            default:
                // Unknown effect type
                this.battleManager.logMessage(`Unknown effect type: ${effect.type}`, 'info');
        }
    }

    /**
     * Apply a random status effect to a character
     * @param {Object} target - The character to affect
     * REFACTORING: Extracted from BattleManager.applyRandomStatusEffect
     */
    applyRandomStatusEffect(target) {
        // Defensive check for target
        if (!target) {
            console.error("[AbilityProcessor] Cannot apply random status effect to undefined target");
            return;
        }

        // Defensive check for StatusEffectManager
        if (!this.battleManager.statusEffectManager) {
            console.error("[AbilityProcessor] StatusEffectManager component not found! Cannot apply random status effect.");
            return;
        }
        
        // Get all damage over time effects from definitions if available
        let possibleEffects = [];
        let statusDefinitions = null;
        
        // Get status definitions based on which component is available
        if (this.battleManager.statusEffectLoader) {
            // New implementation with loader
            statusDefinitions = this.battleManager.statusEffectLoader.getAllDefinitions();
        } else if (this.battleManager.statusEffectDefinitions) {
            // Original implementation
            statusDefinitions = this.battleManager.statusEffectDefinitions;
        }
        
        if (statusDefinitions) {
            // Get all DoT effects from the definitions
            const dotEffects = Object.entries(statusDefinitions)
                .filter(([id, def]) => def.type === 'DoT' || def.type === 'Debuff')
                .map(([id, def]) => ({ id, duration: def.defaultDuration || 2 }));
            
            if (dotEffects.length > 0) {
                possibleEffects = dotEffects;
            }
        }
        
        // Fallback to hardcoded effects if no definitions or filtered list is empty
        if (possibleEffects.length === 0) {
            possibleEffects = [
                { id: 'status_burn', duration: 2 },
                { id: 'status_stun', duration: 1 },
                { id: 'status_spd_down', duration: 2 }
            ];
        }
        
        // Select a random effect
        const randomEffect = possibleEffects[Math.floor(Math.random() * possibleEffects.length)];
        
        // Apply the effect
        const applied = this.battleManager.statusEffectManager.addStatusEffect(
            target, 
            randomEffect.id, 
            null, // No source for random effects
            randomEffect.duration,
            1 // Explicit stacks parameter
        );
        
        if (applied) {
            // Get effect name for better messaging
            let effectName = randomEffect.id;
            if (statusDefinitions && statusDefinitions[randomEffect.id]) {
                effectName = statusDefinitions[randomEffect.id].name || randomEffect.id;
            }
            
            // Log the application with team identifier
            const targetTeamId = target.team === 'player' ? ' (ally)' : ' (enemy)';
            this.battleManager.logMessage(`${target.name}${targetTeamId} is afflicted with ${effectName} for ${randomEffect.duration} turns!`, 'error');
            
            // Update status icons
            this.battleManager.statusEffectManager.updateStatusIcons(target);
        }
    }
}

// Make AbilityProcessor available globally for traditional scripts
if (typeof window !== 'undefined') {
  window.AbilityProcessor = AbilityProcessor;
  console.log("AbilityProcessor class definition loaded and exported to window.AbilityProcessor");
}

// Legacy global assignment for maximum compatibility
window.AbilityProcessor = AbilityProcessor;