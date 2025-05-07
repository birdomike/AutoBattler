/**
 * PassiveBehaviors.js
 * 
 * Collection of passive behavior functions for the battle system.
 * These functions define how passive abilities trigger and what effects they apply.
 */

import behaviorRegistry from './BehaviorRegistry.js';

/**
 * Context object expected for passive behaviors:
 * {
 *   actor: Character,              // The character with the passive ability
 *   ability: Object,               // The passive ability being triggered
 *   battleManager: BattleManager,  // Reference to BattleManager for battle state
 *   teamManager: TeamManager,      // Reference to TeamManager for team data
 *   trigger: String,               // What triggered this passive (onTurnStart, onHit, etc.)
 *   additionalData: Object         // Contextual data based on the trigger (damage amount, source, etc.)
 * }
 */

/**
 * -----------------------------------------------
 * Passive Trigger Types Reference
 * -----------------------------------------------
 * onBattleStart    - When battle begins
 * onBattleEnd      - When battle ends
 * onTurnStart      - At start of a new turn
 * onTurnEnd        - At end of a turn
 * onActionStart    - Before an action is executed
 * onActionEnd      - After an action is executed
 * onDamageDealt    - After dealing damage to a target
 * onDamageTaken    - After taking damage from a source
 * onHealed         - After being healed
 * onHealingDone    - After healing a target
 * onKill           - After defeating an enemy
 * onDefeat         - When character is defeated
 * onRevive         - When character is revived
 * onStatusApplied  - When a status effect is applied to character
 * onStatusRemoved  - When a status effect expires or is removed
 * -----------------------------------------------
 */

/**
 * Applies regeneration status effect at the start of the turn
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_ApplyRegenOnTurnStart(context) {
    const { actor, battleManager, trigger } = context;
    
    // Only execute if trigger matches
    if (trigger !== 'onTurnStart') return { executed: false };
    
    // Verify character has valid health before proceeding
    if (!actor || !actor.stats || !actor.stats.hp || isNaN(actor.currentHp)) {
        console.error('Cannot apply regen to character with invalid health state:', actor);
        return { executed: false };
    }
    
    // Apply regeneration status effect
    // v0.5.27.4_StatusEffectParameterFix: Adding sourceId check and ensuring actor is passed as source
    // This function was showing as error source for 'Invalid duration parameter (object)'
    // Updated to use consistent 5-parameter format with explicit stacks
    battleManager.addStatusEffect(actor, 'status_regen', actor, 2, 1);
    
    return {
        executed: true,
        message: `${actor.name}'s passive ability grants Regeneration!`
    };
}

/**
 * Reflects a portion of damage back to the attacker when hit
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_DamageReflectOnHit(context) {
    const { actor, battleManager, trigger, additionalData } = context;
    
    // Only execute if trigger matches and additional data is provided
    if (trigger !== 'onDamageTaken' || !additionalData) return { executed: false };
    
    const { source, damageAmount, reflectionDepth = 0 } = additionalData;
    
    // Limit reflection depth to prevent infinite chains
    if (reflectionDepth >= 2) { // Maximum of 2 reflection cycles (initial hit + 2 reflections)
        console.debug(`Max reflection depth (${reflectionDepth}) reached, stopping reflection chain`);
        return { executed: false };
    }
    
    // Do nothing if source is not defined or it's self-damage
    if (!source || source === actor) return { executed: false };
    
    // Validate damage amount before calculations
    if (typeof damageAmount !== 'number' || isNaN(damageAmount) || damageAmount <= 0) {
        console.error('Invalid damage amount for reflection:', damageAmount);
        return { executed: false };
    }
    
    // Check if source is valid
    if (!source || !source.currentHp || isNaN(source.currentHp)) {
        console.error('Invalid source for damage reflection');
        return { executed: false };
    }
    
    // Check if source and actor are on different teams (prevent friendly fire)
    if (source.team === actor.team) {
        console.debug(`Skipping damage reflection to ${source.name} as they are on the same team as ${actor.name}`);
        return { executed: false };
    }
    
    // Calculate reflected damage (20% of damage taken)
    const reflectAmount = Math.round(Math.max(1, damageAmount * 0.2));
    
    // Implement a minimum threshold for reflection to prevent endless small reflections
    if (reflectAmount <= 2 && reflectionDepth > 0) {
        console.debug(`Reflection amount (${reflectAmount}) too small for secondary reflection, stopping chain`);
        return { executed: false };
    }
    
    // Apply reflected damage with increased reflection depth
    battleManager.applyDamage(
        source,                 // target (the original attacker)
        reflectAmount,          // damage amount
        actor,                  // source (self)
        null,                   // no ability
        'reflected',            // damage type
        { reflectionDepth: reflectionDepth + 1 } // Track reflection depth
    );
    
    return {
        executed: true,
        message: `${actor.name}'s passive ability reflects ${reflectAmount} damage back to ${source.name}!`
    };
}

/**
 * Has a chance to apply a status effect to the attacker when hit
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_ApplyStatusOnHit(context) {
    const { actor, ability, battleManager, trigger, additionalData } = context;
    
    // Only execute if trigger matches and additional data is provided
    if (trigger !== 'onDamageTaken' || !additionalData) return { executed: false };
    
    const { source } = additionalData;
    
    // Do nothing if source is not defined or it's self-damage
    if (!source || source === actor) return { executed: false };
    
    // Check for ability-specific configuration
    const statusId = ability.passiveData?.statusId || 'status_spd_down';
    const chance = ability.passiveData?.chance || 0.25;
    const duration = ability.passiveData?.duration || 2;
    
    // Random chance to apply status
    if (Math.random() < chance) {
        // FIXED (v0.5.27.2_FixStatusEffectCalls): Added actor as source parameter
        battleManager.addStatusEffect(source, statusId, actor, duration);
        
        return {
            executed: true,
            message: `${actor.name}'s passive ability applies a status effect to ${source.name}!`
        };
    }
    
    return { executed: false };
}

/**
 * Provides a buff to allies at the start of battle
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_TeamBuffOnBattleStart(context) {
    const { actor, ability, battleManager, teamManager, trigger } = context;
    
    // Only execute if trigger matches
    if (trigger !== 'onBattleStart') return { executed: false };
    
    // Get all allies
    const actorTeam = teamManager.getCharacterTeam(actor);
    const allies = battleManager.getAllCharacters().filter(character => 
        teamManager.getCharacterTeam(character) === actorTeam && !character.defeated
    );
    
    // Check for ability-specific configuration
    let statusId = 'status_atk_up';
    let duration = 3;
    
    // Safely extract passiveData if it exists
    if (ability && ability.passiveData) {
        statusId = ability.passiveData.statusId || statusId;
        duration = ability.passiveData.duration || duration;
    }
    
    // Apply buff to all allies
    let applied = 0;
    allies.forEach(ally => {
        // Skip if ally has invalid health
        if (!ally || isNaN(ally.currentHp)) {
            console.warn('Skipping buff application to ally with invalid health:', ally);
            return;
        }
        
        // Ensure duration is a number
        let effectDuration = duration;
        if (typeof effectDuration !== 'number') {
            console.warn(`[passive_TeamBuffOnBattleStart] Invalid duration (${typeof duration}) - using default 3`);
            effectDuration = 3;
        }
        
        // FIXED (v0.5.27.2_FixStatusEffectCalls): Added actor as source parameter
        // Updated to use consistent 5-parameter format with explicit stacks
        battleManager.addStatusEffect(ally, statusId, actor, effectDuration, 1);
        applied++;
    });
    
    return {
        executed: true,
        message: `${actor.name}'s passive ability buffs the team at the start of battle!`,
        affected: applied
    };
}

/**
 * Increases critical hit chance after landing a critical hit
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_CriticalMomentum(context) {
    const { actor, battleManager, trigger, additionalData } = context;
    
    // Only execute if trigger matches and was a critical hit
    if (trigger !== 'onDamageDealt' || !additionalData || !additionalData.wasCritical) {
        return { executed: false };
    }
    
    // Apply critical chance buff
    // FIXED (v0.5.27.3_CircularReferenceHotfix): Added actor as source parameter
    // Updated to use consistent 5-parameter format with explicit stacks
    battleManager.addStatusEffect(actor, 'status_crit_up', actor, 2, 1);
    
    return {
        executed: true,
        message: `${actor.name}'s passive ability increases critical chance after landing a critical hit!`
    };
}

/**
 * Applies a damage buff after killing an enemy
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_KillBuff(context) {
    const { actor, battleManager, trigger, additionalData } = context;
    
    // Only execute if trigger matches
    if (trigger !== 'onKill') return { executed: false };
    
    // Apply attack up buff after a kill
    // FIXED (v0.5.27.2_FixStatusEffectCalls): Added actor as source parameter
    // Updated to use consistent 5-parameter format with explicit stacks
    battleManager.addStatusEffect(actor, 'status_atk_up', actor, 2, 1);
    
    return {
        executed: true,
        message: `${actor.name}'s bloodlust increases attack after defeating an enemy!`
    };
}

/**
 * Applies a healing effect to the character when their HP falls below a threshold
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_LastStand(context) {
    const { actor, ability, battleManager, trigger, additionalData } = context;
    
    // Only execute if trigger matches and has damage data
    if (trigger !== 'onDamageTaken' || !additionalData) return { executed: false };
    
    // Check health threshold (default 30% of max HP)
    const threshold = ability.passiveData?.threshold || 0.3;
    const healthPercent = actor.currentHp / actor.stats.hp;
    
    // Check if we crossed the threshold with this damage
    const previousHealth = actor.currentHp + additionalData.damageAmount;
    const previousPercent = previousHealth / actor.stats.hp;
    
    if (previousPercent >= threshold && healthPercent < threshold) {
        // We just crossed the threshold, trigger the heal
        const healAmount = Math.floor(actor.stats.hp * 0.15); // Heal for 15% of max HP
        
        // Apply healing
        battleManager.applyHealing(actor, healAmount, actor, null, 'passive');
        
        // Apply defense buff
        // FIXED (v0.5.27.2_FixStatusEffectCalls): Added actor as source parameter
        // Updated to use consistent 5-parameter format with explicit stacks
        battleManager.addStatusEffect(actor, 'status_def_up', actor, 2, 1);
        
        return {
            executed: true,
            message: `${actor.name}'s last stand activates at low health, granting healing and defense!`
        };
    }
    
    return { executed: false };
}

/**
 * Applies a shield to allies at low health
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_ProtectiveInstinct(context) {
    const { actor, battleManager, teamManager, trigger } = context;
    
    // Only execute if trigger matches
    if (trigger !== 'onTurnStart') return { executed: false };
    
    // Get all allies
    const actorTeam = teamManager.getCharacterTeam(actor);
    const allies = battleManager.getAllCharacters().filter(character => 
        teamManager.getCharacterTeam(character) === actorTeam && 
        character !== actor && // Not self
        !character.defeated && 
        (character.currentHp / character.stats.hp) < 0.4 // Below 40% health
    );
    
    // If there are low-health allies, protect them
    if (allies.length > 0) {
        let protectedCount = 0;
        
        // Apply shield to up to 2 allies
        for (let i = 0; i < Math.min(2, allies.length); i++) {
            // FIXED (v0.5.27.2_FixStatusEffectCalls): Added actor as source parameter
            // Updated to use consistent 5-parameter format with explicit stacks
            battleManager.addStatusEffect(allies[i], 'status_shield', actor, 1, 1);
            protectedCount++;
        }
        
        if (protectedCount > 0) {
            return {
                executed: true,
                message: `${actor.name}'s protective instinct shields ${protectedCount} injured ${protectedCount === 1 ? 'ally' : 'allies'}!`,
                affected: protectedCount
            };
        }
    }
    
    return { executed: false };
}

/**
 * Provides a counter-attack when taking damage
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_Counterattack(context) {
    const { actor, battleManager, trigger, additionalData } = context;
    
    // Only execute if trigger matches
    if (trigger !== 'onDamageTaken' || !additionalData || !additionalData.source) {
        return { executed: false };
    }
    
    // Get the attacker
    const attacker = additionalData.source;
    
    // Check if attacker is valid and still alive
    if (!attacker || attacker.isDead || attacker.currentHp <= 0) {
        return { executed: false };
    }
    
    // Counter with 40% of strength as damage
    const counterDamage = Math.floor(actor.stats.strength * 0.4);
    
    // Apply counter damage
    const result = battleManager.applyDamage(
        attacker,           // target (original attacker)
        counterDamage,      // damage amount
        actor,              // source (self)
        null,               // no ability
        'counter'           // damage type
    );
    
    return {
        executed: true,
        message: `${actor.name} counters the attack, dealing ${counterDamage} damage to ${attacker.name}!`,
        damage: result.damage
    };
}

/**
 * Applies a debuff to enemies when the turn starts
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_Intimidate(context) {
    const { actor, ability, battleManager, teamManager, trigger } = context;
    
    // Only execute on turn start and with 25% chance
    if (trigger !== 'onTurnStart' || Math.random() > 0.25) {
        return { executed: false };
    }
    
    // Get enemies
    const actorTeam = teamManager.getCharacterTeam(actor);
    const enemies = battleManager.getAllCharacters().filter(character => 
        teamManager.getCharacterTeam(character) !== actorTeam && 
        !character.defeated
    );
    
    // If there are enemies, intimidate them
    if (enemies.length > 0) {
        // Choose a random enemy
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        
        // Check for ability-specific configuration
        const statusId = ability.passiveData?.statusId || 'status_atk_down';
        const duration = ability.passiveData?.duration || 1;
        
        // Apply status effect
        // FIXED (v0.5.27.2_FixStatusEffectCalls): Added actor as source parameter
        // Updated to use consistent 5-parameter format with explicit stacks
        battleManager.addStatusEffect(target, statusId, actor, duration, 1);
        
        return {
            executed: true,
            message: `${actor.name}'s intimidating presence weakens ${target.name}!`
        };
    }
    
    return { executed: false };
}

/**
 * Apply an effect when killing an enemy
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_OnKillEffect(context) {
    const { actor, battleManager, trigger, additionalData, ability } = context;
    
    // Only execute if trigger matches and has defeated data
    if (trigger !== 'onKill' || !additionalData || !additionalData.defeated) {
        return { executed: false };
    }
    
    // Get the defeated enemy
    const defeated = additionalData.defeated;
    
    // Get effect data from passive configuration
    const effectType = ability.passiveData?.effectType || 'heal';
    const effectValue = ability.passiveData?.value || 0.1; // Default to 10% of max HP
    const statusId = ability.passiveData?.statusId || 'status_atk_up';
    const duration = ability.passiveData?.duration || 2;
    
    // Apply different effects based on configuration
    switch (effectType) {
        case 'heal':
            // Heal self based on max HP
            const healAmount = Math.floor(actor.stats.hp * effectValue);
            battleManager.applyHealing(actor, healAmount, actor, null, 'passive');
            
            return {
                executed: true,
                message: `${actor.name} absorbs life essence, healing for ${healAmount} HP!`
            };
            
        case 'buff':
            // Apply a status buff to self
            // FIXED (v0.5.27.2_FixStatusEffectCalls): Added actor as source parameter
            // Updated to use consistent 5-parameter format with explicit stacks
            battleManager.addStatusEffect(actor, statusId, actor, duration, 1);
            
            return {
                executed: true,
                message: `${actor.name}'s power grows after defeating ${defeated.name}!`
            };
            
        case 'aoe_damage':
            // Apply AoE damage to all enemies
            const enemyTeam = defeated.team === 'player' ? battleManager.playerTeam : battleManager.enemyTeam;
            const damageAmount = Math.floor(actor.stats.strength * 0.2); // Base on strength
            let damageCount = 0;
            
            enemyTeam.forEach(enemy => {
                if (enemy.currentHp > 0 && enemy !== defeated) {
                    battleManager.applyDamage(enemy, damageAmount, actor, null, 'passive');
                    damageCount++;
                }
            });
            
            if (damageCount > 0) {
                return {
                    executed: true,
                    message: `${actor.name}'s power explodes, dealing ${damageAmount} damage to nearby enemies!`
                };
            }
            break;
    }
    
    return { executed: false };
}

/**
 * Increases critical hit chance after certain triggers
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_CriticalHitBoost(context) {
    const { actor, battleManager, trigger, additionalData, ability } = context;
    
    // Get configuration
    const triggers = ability.passiveData?.triggers || ['onDamageDealt'];
    const duration = ability.passiveData?.duration || 2;
    const bonusAmount = ability.passiveData?.bonusAmount || 0.15; // 15% increased crit chance
    
    // Check if this trigger is in our list of valid triggers
    if (!triggers.includes(trigger)) {
        return { executed: false };
    }
    
    // Add validation for specific trigger conditions
    if (trigger === 'onDamageDealt') {
        // Only trigger on significant damage (more than 15% of target's max HP)
        if (!additionalData || !additionalData.target || !additionalData.damageAmount) {
            return { executed: false };
        }
        
        const target = additionalData.target;
        const damage = additionalData.damageAmount;
        const damagePercent = target.stats.hp > 0 ? damage / target.stats.hp : 0;
        
        if (damagePercent < 0.15) {
            return { executed: false };
        }
    }
    
    // Apply critical hit buff
    // FIXED (v0.5.27.2_FixStatusEffectCalls): Added actor as source parameter
    // Fixed: Use consistent 5-parameter format with numeric stacks
    let stackCount = (typeof bonusAmount === 'number' && bonusAmount > 0) ? Math.ceil(bonusAmount) : 1;
    battleManager.addStatusEffect(actor, 'status_crit_up', actor, duration, stackCount);
    
    return {
        executed: true,
        message: `${actor.name}'s critical hit chance increases!`
    };
}

/**
 * Applies a status effect to targets when hitting them
 * @param {object} context - Passive behavior context
 * @returns {object} - Result of the passive ability
 */
function passive_StatusOnHit(context) {
    const { actor, battleManager, trigger, additionalData, ability } = context;
    
    // Only execute on damage dealt
    if (trigger !== 'onDamageDealt' || !additionalData || !additionalData.target) {
        return { executed: false };
    }
    
    const target = additionalData.target;
    
    // Skip if target is already defeated
    if (target.currentHp <= 0 || target.isDead) {
        return { executed: false };
    }
    
    // Get configuration from passive data
    const statusId = ability.passiveData?.statusId || 'status_bleed';
    const chance = ability.passiveData?.chance || 0.25; // 25% chance by default
    const duration = ability.passiveData?.duration || 2;
    
    // Roll for chance
    if (Math.random() < chance) {
        // Apply the status effect
        // FIXED (v0.5.27.2_FixStatusEffectCalls): Added actor as source parameter
        // Updated to use consistent 5-parameter format with explicit stacks
        battleManager.addStatusEffect(target, statusId, actor, duration, 1);
        
        // Get a readable name for the status
        let statusName = statusId;
        if (statusId.startsWith('status_')) {
            statusName = statusId.replace('status_', '').replace('_', ' ');
            // Capitalize first letter
            statusName = statusName.charAt(0).toUpperCase() + statusName.slice(1);
        }
        
        return {
            executed: true,
            message: `${actor.name}'s attack inflicts ${statusName} on ${target.name}!`
        };
    }
    
    return { executed: false };
}

// Register all passive behaviors
behaviorRegistry.registerPassiveBehavior('passive_ApplyRegenOnTurnStart', passive_ApplyRegenOnTurnStart);
behaviorRegistry.registerPassiveBehavior('passive_DamageReflectOnHit', passive_DamageReflectOnHit);
behaviorRegistry.registerPassiveBehavior('passive_ApplyStatusOnHit', passive_ApplyStatusOnHit);
behaviorRegistry.registerPassiveBehavior('passive_TeamBuffOnBattleStart', passive_TeamBuffOnBattleStart);
behaviorRegistry.registerPassiveBehavior('passive_CriticalMomentum', passive_CriticalMomentum);
behaviorRegistry.registerPassiveBehavior('passive_KillBuff', passive_KillBuff);
behaviorRegistry.registerPassiveBehavior('passive_LastStand', passive_LastStand);
behaviorRegistry.registerPassiveBehavior('passive_ProtectiveInstinct', passive_ProtectiveInstinct);
behaviorRegistry.registerPassiveBehavior('passive_Counterattack', passive_Counterattack);
behaviorRegistry.registerPassiveBehavior('passive_Intimidate', passive_Intimidate);
behaviorRegistry.registerPassiveBehavior('passive_OnKillEffect', passive_OnKillEffect);
behaviorRegistry.registerPassiveBehavior('passive_CriticalHitBoost', passive_CriticalHitBoost);
behaviorRegistry.registerPassiveBehavior('passive_StatusOnHit', passive_StatusOnHit);

// Export individual behaviors for direct use if needed
export {
    passive_ApplyRegenOnTurnStart,
    passive_DamageReflectOnHit,
    passive_ApplyStatusOnHit,
    passive_TeamBuffOnBattleStart,
    passive_CriticalMomentum,
    passive_KillBuff,
    passive_LastStand,
    passive_ProtectiveInstinct,
    passive_Counterattack,
    passive_Intimidate,
    passive_OnKillEffect,
    passive_CriticalHitBoost,
    passive_StatusOnHit
};
