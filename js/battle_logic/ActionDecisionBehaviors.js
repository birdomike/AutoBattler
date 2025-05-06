/**
 * ActionDecisionBehaviors.js
 * 
 * Collection of action decision behavior functions for the battle system.
 * These functions determine how characters decide which ability to use (or basic attack).
 */

import behaviorRegistry from './BehaviorRegistry.js';

/**
 * Context object expected for action decision behaviors:
 * {
 *   actor: Character,              // The character taking the action
 *   availableAbilities: Object[],  // List of abilities with cooldown === 0
 *   battleManager: BattleManager,  // Reference to BattleManager for battle state
 *   teamManager: TeamManager       // Reference to TeamManager for team data
 * }
 */

/**
 * Default 50% chance to use an ability if available (matches original behavior)
 * @param {object} context - Action decision context
 * @returns {object|null} - Selected ability or null for basic attack
 */
function decideAction_Random50Percent(context) {
    const { availableAbilities } = context;
    
    // If no abilities are available, use basic attack
    if (!availableAbilities || availableAbilities.length === 0) {
        return null; // Null indicates basic attack
    }
    
    // 50% chance to use an ability (from original BattleManager)
    if (Math.random() > 0.5) {
        // Select random ability from available ones
        const randomIndex = Math.floor(Math.random() * availableAbilities.length);
        return availableAbilities[randomIndex];
    }
    
    // Use basic attack
    return null;
}

/**
 * Uses weighted random selection for ability choice
 * @param {object} context - Action decision context
 * @returns {object|null} - Selected ability or null for basic attack
 */
function decideAction_WeightedRandomAbility(context) {
    const { actor, availableAbilities } = context;
    
    // If no abilities are available, use basic attack
    if (!availableAbilities || availableAbilities.length === 0) {
        return null; // Null indicates basic attack
    }
    
    // Use character's abilityAffinity if defined, or default to 0.7 (70% chance to consider ability)
    const abilityAffinity = actor.abilityAffinity || 0.7;
    
    // Check if we should consider using an ability at all
    if (Math.random() < abilityAffinity) {
        // Calculate total weight of all available abilities
        let totalWeight = 0;
        for (const ability of availableAbilities) {
            // Use ability's selectionWeight or default to 1.0
            const weight = ability.selectionWeight || 1.0;
            totalWeight += weight;
        }
        
        // Generate random weight
        let randomWeight = Math.random() * totalWeight;
        
        // Find the ability that corresponds to this weight
        for (const ability of availableAbilities) {
            const weight = ability.selectionWeight || 1.0;
            randomWeight -= weight;
            
            if (randomWeight <= 0) {
                return ability;
            }
        }
        
        // Fallback in case of rounding errors
        return availableAbilities[availableAbilities.length - 1];
    }
    
    // Use basic attack
    return null;
}

/**
 * Prioritizes healing abilities when allies are below health threshold
 * @param {object} context - Action decision context
 * @returns {object|null} - Selected ability or null for basic attack
 */
function decideAction_PrioritizeHeal(context) {
    const { actor, availableAbilities, teamManager, battleManager } = context;
    
    // If no abilities are available, use basic attack
    if (!availableAbilities || availableAbilities.length === 0) {
        return null;
    }
    
    // Get actor's team
    const actorTeam = teamManager.getCharacterTeam(actor);
    
    // Check team health status
    const allCharacters = battleManager.getAllCharacters();
    const allies = allCharacters.filter(character => 
        teamManager.getCharacterTeam(character) === actorTeam && !character.defeated
    );
    
    // Calculate average health percentage of team
    let totalHealthPercent = 0;
    allies.forEach(ally => {
        totalHealthPercent += (ally.currentHp / ally.stats.hp);
    });
    const avgHealthPercent = totalHealthPercent / allies.length;
    
    // Check if any ally is below 50% health
    const needsHealing = allies.some(ally => (ally.currentHp / ally.stats.hp) < 0.5);
    
    // If healing is needed
    if (needsHealing) {
        // Find healing abilities
        const healingAbilities = availableAbilities.filter(ability => 
            ability.isHealing || ability.damageType === 'healing'
        );
        
        if (healingAbilities.length > 0) {
            // Get the healing ability with highest selectionWeight
            return healingAbilities.reduce((best, current) => {
                const currentWeight = current.selectionWeight || 1.0;
                const bestWeight = best.selectionWeight || 1.0;
                return currentWeight > bestWeight ? current : best;
            }, healingAbilities[0]);
        }
    }
    
    // If team is healthy or no healing abilities available
    // Use weighted random selection like normal
    return decideAction_WeightedRandomAbility(context);
}

/**
 * Always prioritizes offensive abilities
 * @param {object} context - Action decision context
 * @returns {object|null} - Selected ability or null for basic attack
 */
function decideAction_PrioritizeOffense(context) {
    const { availableAbilities } = context;
    
    // If no abilities are available, use basic attack
    if (!availableAbilities || availableAbilities.length === 0) {
        return null;
    }
    
    // Filter out healing/utility abilities
    const offensiveAbilities = availableAbilities.filter(ability => 
        !ability.isHealing && ability.damageType !== 'healing' && ability.damageType !== 'utility'
    );
    
    if (offensiveAbilities.length > 0) {
        // Select the offensive ability with highest selectionWeight
        return offensiveAbilities.reduce((best, current) => {
            const currentWeight = current.selectionWeight || 1.0;
            const bestWeight = best.selectionWeight || 1.0;
            return currentWeight > bestWeight ? current : best;
        }, offensiveAbilities[0]);
    }
    
    // If no offensive abilities available, fall back to weighted random selection
    return decideAction_WeightedRandomAbility(context);
}

/**
 * Prioritizes defensive abilities, especially when health is low
 * @param {object} context - Action decision context
 * @returns {object|null} - Selected ability or null for basic attack
 */
function decideAction_Defensive(context) {
    const { actor, availableAbilities, teamManager, battleManager } = context;
    
    // If no abilities are available, use basic attack
    if (!availableAbilities || availableAbilities.length === 0) {
        return null;
    }
    
    // Calculate health percentage
    const healthPercent = actor.currentHp / actor.stats.hp;
    
    // Check if health is below 50%
    const isLowHealth = healthPercent < 0.5;
    
    // Higher chance to use abilities when health is low
    const abilityAffinity = isLowHealth ? 0.9 : 0.7;
    
    // First check if we should consider using an ability at all
    if (Math.random() < abilityAffinity) {
        // Categorize available abilities
        const defensiveAbilities = availableAbilities.filter(ability => {
            // Consider abilities that provide shields, healing, or defensive buffs
            if (ability.isHealing || ability.damageType === 'healing') return true;
            if (ability.damageType === 'utility') return true;
            
            // Check for defensive effects in the effects array
            if (ability.effects && Array.isArray(ability.effects)) {
                return ability.effects.some(effect => 
                    (effect.type === 'ApplyStatus' && 
                    ['status_def_up', 'status_shield', 'status_regen', 'status_evade'].includes(effect.statusEffectId)) ||
                    (effect.type === 'StatBuff' && 
                    ['Defense', 'MaxHP'].includes(effect.targetStat))
                );
            }
            
            return false;
        });
        
        // If low health and defensive abilities available, use them
        if (isLowHealth && defensiveAbilities.length > 0) {
            // Select defensive ability with highest weight
            return defensiveAbilities.reduce((best, current) => {
                const currentWeight = current.selectionWeight || 1.0;
                const bestWeight = best.selectionWeight || 1.0;
                return currentWeight > bestWeight ? current : best;
            }, defensiveAbilities[0]);
        }
        
        // Otherwise use weighted selection from all abilities
        // Calculate total weight with higher weight for defensive abilities
        let totalWeight = 0;
        for (const ability of availableAbilities) {
            let weight = ability.selectionWeight || 1.0;
            
            // Increase weight for defensive abilities
            if (defensiveAbilities.includes(ability)) {
                weight *= 1.5; // 50% higher weight for defensive abilities
            }
            
            totalWeight += weight;
        }
        
        // Generate random weight
        let randomWeight = Math.random() * totalWeight;
        
        // Find the ability that corresponds to this weight
        for (const ability of availableAbilities) {
            let weight = ability.selectionWeight || 1.0;
            
            // Increase weight for defensive abilities
            if (defensiveAbilities.includes(ability)) {
                weight *= 1.5;
            }
            
            randomWeight -= weight;
            
            if (randomWeight <= 0) {
                return ability;
            }
        }
        
        // Fallback in case of rounding errors
        return availableAbilities[availableAbilities.length - 1];
    }
    
    // Use basic attack
    return null;
}

/**
 * Always tries to use abilities if available, prioritizing by selection weight
 * @param {object} context - Action decision context
 * @returns {object|null} - Selected ability or null for basic attack
 */
function decideAction_AlwaysUseAbilities(context) {
    const { availableAbilities } = context;
    
    // If no abilities are available, use basic attack
    if (!availableAbilities || availableAbilities.length === 0) {
        return null;
    }
    
    // Select the ability with highest selectionWeight
    return availableAbilities.reduce((best, current) => {
        const currentWeight = current.selectionWeight || 1.0;
        const bestWeight = best.selectionWeight || 1.0;
        return currentWeight > bestWeight ? current : best;
    }, availableAbilities[0]);
}

// Register all action decision behaviors
behaviorRegistry.registerActionDecisionBehavior('decideAction_Random50Percent', decideAction_Random50Percent, true); // Set as default
behaviorRegistry.registerActionDecisionBehavior('decideAction_WeightedRandomAbility', decideAction_WeightedRandomAbility);
behaviorRegistry.registerActionDecisionBehavior('decideAction_PrioritizeHeal', decideAction_PrioritizeHeal);
behaviorRegistry.registerActionDecisionBehavior('decideAction_PrioritizeOffense', decideAction_PrioritizeOffense);
behaviorRegistry.registerActionDecisionBehavior('decideAction_AlwaysUseAbilities', decideAction_AlwaysUseAbilities);
behaviorRegistry.registerActionDecisionBehavior('decideAction_Defensive', decideAction_Defensive);

// Export individual behaviors for direct use if needed
export {
    decideAction_Random50Percent,
    decideAction_WeightedRandomAbility,
    decideAction_PrioritizeHeal,
    decideAction_PrioritizeOffense,
    decideAction_AlwaysUseAbilities,
    decideAction_Defensive
};
