/**
 * BattleBehaviors.js (FALLBACK VERSION)
 * 
 * Simple non-ES Module version of the battle behavior system.
 * This file provides basic functionality without requiring complex imports.
 */

// Define a global variable to store the battle behaviors
window.battleBehaviors = window.battleBehaviors || {
    /**
     * Selects a target for an ability or action based on targeting logic
     * @param {string|null} targetingLogic - Name of targeting logic to use
     * @param {object} context - Targeting context
     * @returns {Character|Character[]|null} - Selected target(s) or null if no valid target
     */
    selectTarget: function(targetingLogic, context) {
        console.log(`Using targeting logic: ${targetingLogic}`);
        
        // Default targeting - find random enemy
        const targets = context.potentialTargets.filter(t => 
            t.team !== context.actor.team && t.currentHp > 0
        );
        
        // Decide based on targeting type
        switch(targetingLogic) {
            case 'targetLowestHpEnemy':
                // Find enemy with lowest HP
                if (targets.length === 0) return null;
                return targets.sort((a, b) => 
                    (a.currentHp / a.stats.hp) - (b.currentHp / b.stats.hp)
                )[0];
                
            case 'targetLowestHpAlly':
                // Find ally with lowest HP
                const allies = context.potentialTargets.filter(t => 
                    t.team === context.actor.team && t.currentHp > 0 && t.currentHp < t.stats.hp
                );
                if (allies.length === 0) {
                    // If no injured allies, target self
                    return context.actor;
                }
                return allies.sort((a, b) => 
                    (a.currentHp / a.stats.hp) - (b.currentHp / b.stats.hp)
                )[0];
                
            case 'targetSelf':
                // Target self
                return context.actor;
                
            default:
                // Random enemy
                return targets.length > 0 ? 
                    targets[Math.floor(Math.random() * targets.length)] : null;
        }
    },
    
    /**
     * Decides which ability to use (or basic attack)
     * @param {string|null} decisionLogic - Name of action decision logic to use
     * @param {object} context - Action decision context
     * @returns {object|null} - Selected ability or null for basic attack
     */
    decideAction: function(decisionLogic, context) {
        console.log(`Using action decision logic: ${decisionLogic}`);
        
        // Check if there are any available abilities
        if (!context.availableAbilities || context.availableAbilities.length === 0) {
            return null; // Use basic attack
        }
        
        // Decide based on logic type
        switch(decisionLogic) {
            case 'alwaysUseAbilities':
                // Always use an ability if available
                return context.availableAbilities[
                    Math.floor(Math.random() * context.availableAbilities.length)
                ];
                
            case 'prioritizeHealing':
                // Check for healing abilities if there are injured allies
                const healingAbilities = context.availableAbilities.filter(a => 
                    a.isHealing || a.damageType === 'healing'
                );
                
                // Check if there are injured allies
                const allies = context.actor.team === 'player' ? 
                    context.battleManager.playerTeam : context.battleManager.enemyTeam;
                const injuredAllies = allies.filter(a => 
                    a.currentHp > 0 && a.currentHp < a.stats.hp * 0.7
                );
                
                // If there are healing abilities and injured allies, use one
                if (healingAbilities.length > 0 && injuredAllies.length > 0) {
                    return healingAbilities[
                        Math.floor(Math.random() * healingAbilities.length)
                    ];
                }
                
                // Otherwise, 50% chance to use a damage ability
                return Math.random() > 0.5 && context.availableAbilities.length > 0 ? 
                    context.availableAbilities[
                        Math.floor(Math.random() * context.availableAbilities.length)
                    ] : null;
                
            case 'defaultActionDecision':
            default:
                // 50% chance to use ability
                return Math.random() > 0.5 && context.availableAbilities.length > 0 ? 
                    context.availableAbilities[
                        Math.floor(Math.random() * context.availableAbilities.length)
                    ] : null;
        }
    },
    
    /**
     * Processes a passive ability
     * @param {string} passiveName - Name of passive behavior to execute
     * @param {object} context - Passive context
     * @returns {object} - Result of the passive ability
     */
    processPassive: function(passiveName, context) {
        console.log(`Processing passive: ${passiveName} for trigger: ${context.trigger}`);
        return { executed: true, message: 'Passive ability activated' };
    },
    
    /**
     * Executes a passive behavior with provided context
     * @param {string} name - Name of the behavior to execute
     * @param {object} context - Data to pass to the behavior function
     * @returns {object|null} - Result of the behavior function or null if not found
     */
    executePassiveBehavior: function(name, context) {
        // Implementations for common passive behaviors
        switch(name) {
            case 'passive_ApplyRegenOnTurnStart':
                if (context.trigger === 'onTurnStart' && Math.random() < 0.5) {
                    context.battleManager.addStatusEffect(context.actor, 'status_regen', 2);
                    return { executed: true, message: 'Grants Regeneration!' };
                }
                return { executed: false };
                
            case 'passive_DamageReflectOnHit':
                if (context.trigger === 'onDamageTaken' && context.additionalData.source) {
                    const reflectAmount = Math.round(context.additionalData.damageAmount * 0.2);
                    if (reflectAmount > 0) {
                        context.battleManager.applyDamage(
                            context.additionalData.source, // target
                            reflectAmount, // damage
                            context.actor, // source
                            null, // ability
                            'reflected' // damageType
                        );
                        return { executed: true, message: `Reflects ${reflectAmount} damage back to attacker!` };
                    }
                }
                return { executed: false };
                
            case 'passive_ApplyStatusOnHit':
                if (context.trigger === 'onDamageTaken' && 
                    context.additionalData.source && 
                    Math.random() < 0.3) {
                    
                    const statusId = context.ability.passiveData?.statusId || 'status_spd_down';
                    const duration = context.ability.passiveData?.duration || 2;
                    
                    context.battleManager.addStatusEffect(
                        context.additionalData.source,
                        statusId,
                        duration
                    );
                    return { executed: true, message: 'Inflicts a status effect on the attacker!' };
                }
                return { executed: false };
                
            case 'passive_TeamBuffOnBattleStart':
                if (context.trigger === 'onBattleStart') {
                    const statusId = context.ability.passiveData?.statusId || 'status_atk_up';
                    const duration = context.ability.passiveData?.duration || 3;
                    
                    const allies = context.battleManager.getAllCharacters().filter(character => 
                        character.team === context.actor.team && !character.isDead
                    );
                    
                    allies.forEach(ally => {
                        context.battleManager.addStatusEffect(ally, statusId, duration);
                    });
                    
                    return { executed: true, message: 'Buffs the team at the start of battle!' };
                }
                return { executed: false };
                
            default:
                // For unknown passives, log and return a generic result
                console.log(`No specific handling for passive '${name}', using generic behavior.`);
                return { executed: true, message: 'Activated!' };
        }
    },
    
    /**
     * Utility function to check if a specific behavior exists
     * @param {string} behaviorName - Name of the behavior to check
     * @returns {boolean} - Whether the behavior exists
     */
    hasBehavior: function(behaviorName) {
        // We'll assume we have these behaviors for simplicity
        const knownBehaviors = [
            'targetRandomEnemy',
            'targetLowestHpEnemy',
            'targetLowestHpAlly',
            'targetSelf',
            'defaultActionDecision',
            'alwaysUseAbilities',
            'prioritizeHealing'
        ];
        
        return knownBehaviors.includes(behaviorName);
    },
    
    /**
     * Utility function to get the default targeting behavior
     * @returns {string} - Name of the default targeting behavior
     */
    getDefaultTargetingBehavior: function() {
        return 'targetRandomEnemy';
    },
    
    /**
     * Utility function to get the default action decision behavior
     * @returns {string} - Name of the default action decision behavior
     */
    getDefaultActionDecisionBehavior: function() {
        return 'defaultActionDecision';
    },
    
    /**
     * Maps targetType strings to targeting behavior names
     * @param {string} targetType - Type of targeting from ability data
     * @returns {string} - Name of the corresponding targeting behavior
     */
    getTargetingBehaviorFromType: function(targetType) {
        const mapping = {
            'SingleEnemy': 'targetRandomEnemy',
            'AllEnemies': 'targetRandomEnemy', // Simplified
            'Self': 'targetSelf',
            'SingleAlly': 'targetLowestHpAlly',
            'AllAllies': 'targetLowestHpAlly', // Simplified
            'LowestHpEnemy': 'targetLowestHpEnemy',
            'HighestHpEnemy': 'targetRandomEnemy', // Simplified
            'LowestHpAlly': 'targetLowestHpAlly'
        };
        
        return mapping[targetType] || 'targetRandomEnemy';
    }
};

// CRITICAL FIX: Register with uppercase 'B' for BattleManager compatibility
window.BattleBehaviors = window.battleBehaviors;

// Enhanced debugging to confirm it's being used
window.battleBehaviors.decideAction = function(decisionLogic, context) {
    console.log(`[DEBUG] BattleBehaviors.decideAction called with logic: ${decisionLogic}`);
    console.log(`[DEBUG] Available abilities:`, context.availableAbilities?.map(a => a.name) || []);
    
    // Delegate to the original implementation
    // Check if there are any available abilities
    if (!context.availableAbilities || context.availableAbilities.length === 0) {
        return null; // Use basic attack
    }
    
    // Decide based on logic type
    switch(decisionLogic) {
        case 'alwaysUseAbilities':
            // Always use an ability if available
            return context.availableAbilities[
                Math.floor(Math.random() * context.availableAbilities.length)
            ];
            
        case 'prioritizeHealing':
            // Check for healing abilities if there are injured allies
            const healingAbilities = context.availableAbilities.filter(a => 
                a.isHealing || a.damageType === 'healing'
            );
            
            // Check if there are injured allies
            const allies = context.actor.team === 'player' ? 
                context.battleManager.playerTeam : context.battleManager.enemyTeam;
            const injuredAllies = allies.filter(a => 
                a.currentHp > 0 && a.currentHp < a.stats.hp * 0.7
            );
            
            // If there are healing abilities and injured allies, use one
            if (healingAbilities.length > 0 && injuredAllies.length > 0) {
                return healingAbilities[
                    Math.floor(Math.random() * healingAbilities.length)
                ];
            }
            
            // Otherwise, 50% chance to use a damage ability
            return Math.random() > 0.5 && context.availableAbilities.length > 0 ? 
                context.availableAbilities[
                    Math.floor(Math.random() * context.availableAbilities.length)
                ] : null;
            
        case 'defaultActionDecision':
        default:
            // 50% chance to use ability
            return Math.random() > 0.5 && context.availableAbilities.length > 0 ? 
                context.availableAbilities[
                    Math.floor(Math.random() * context.availableAbilities.length)
                ] : null;
    }
};

// Let the console know this loaded
console.log('Fallback BattleBehaviors.js loaded successfully (registered as both window.battleBehaviors and window.BattleBehaviors)');
