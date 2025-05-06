/**
 * TargetingBehaviors.js
 * 
 * Collection of targeting behavior functions for the battle system.
 * These functions determine how characters select targets for their actions.
 */

import behaviorRegistry from './BehaviorRegistry.js';

/**
 * Context object expected for targeting behaviors:
 * {
 *   actor: Character,              // The character taking the action
 *   potentialTargets: Character[], // List of possible targets
 *   teamManager: TeamManager,      // Reference to TeamManager for team data
 *   ability: Object,               // The ability being used (if applicable)
 *   battleManager: BattleManager   // Reference to BattleManager for battle state
 * }
 */

/**
 * Targets a random enemy (default behavior)
 * @param {object} context - Targeting context
 * @returns {Character|null} - Selected target or null if no valid target
 */
function targetRandomEnemy(context) {
    const { actor, potentialTargets, teamManager } = context;
    
    // Filter to only include enemies that are alive
    const validTargets = potentialTargets.filter(target => {
        return teamManager.getCharacterTeam(target) !== teamManager.getCharacterTeam(actor) && 
               !target.defeated;
    });
    
    if (validTargets.length === 0) return null;
    
    // Select random target
    const randomIndex = Math.floor(Math.random() * validTargets.length);
    return validTargets[randomIndex];
}

/**
 * Targets the enemy with the lowest HP
 * @param {object} context - Targeting context
 * @returns {Character|null} - Selected target or null if no valid target
 */
function targetLowestHpEnemy(context) {
    const { actor, potentialTargets, teamManager } = context;
    
    // Filter to only include enemies that are alive
    const validTargets = potentialTargets.filter(target => {
        return teamManager.getCharacterTeam(target) !== teamManager.getCharacterTeam(actor) && 
               !target.defeated;
    });
    
    if (validTargets.length === 0) return null;
    
    // Find target with lowest HP
    return validTargets.reduce((lowestTarget, currentTarget) => {
        return (currentTarget.currentHp < lowestTarget.currentHp) ? currentTarget : lowestTarget;
    }, validTargets[0]);
}

/**
 * Targets the enemy with the highest HP
 * @param {object} context - Targeting context
 * @returns {Character|null} - Selected target or null if no valid target
 */
function targetHighestHpEnemy(context) {
    const { actor, potentialTargets, teamManager } = context;
    
    // Filter to only include enemies that are alive
    const validTargets = potentialTargets.filter(target => {
        return teamManager.getCharacterTeam(target) !== teamManager.getCharacterTeam(actor) && 
               !target.defeated;
    });
    
    if (validTargets.length === 0) return null;
    
    // Find target with highest HP
    return validTargets.reduce((highestTarget, currentTarget) => {
        return (currentTarget.currentHp > highestTarget.currentHp) ? currentTarget : highestTarget;
    }, validTargets[0]);
}

/**
 * Targets all enemies
 * @param {object} context - Targeting context
 * @returns {Character[]|null} - Array of targets or null if no valid targets
 */
function targetAllEnemies(context) {
    const { actor, potentialTargets, teamManager } = context;
    
    // Filter to only include enemies that are alive
    const validTargets = potentialTargets.filter(target => {
        return teamManager.getCharacterTeam(target) !== teamManager.getCharacterTeam(actor) && 
               !target.defeated;
    });
    
    if (validTargets.length === 0) return null;
    
    return validTargets;
}

/**
 * Targets the ally with the lowest HP
 * @param {object} context - Targeting context
 * @returns {Character|null} - Selected target or null if no valid target
 */
function targetLowestHpAlly(context) {
    const { actor, potentialTargets, teamManager } = context;
    
    // Filter to only include allies that are alive
    const validTargets = potentialTargets.filter(target => {
        return teamManager.getCharacterTeam(target) === teamManager.getCharacterTeam(actor) && 
               !target.defeated;
    });
    
    if (validTargets.length === 0) return null;
    
    // Find ally with lowest HP
    return validTargets.reduce((lowestTarget, currentTarget) => {
        return (currentTarget.currentHp < lowestTarget.currentHp) ? currentTarget : lowestTarget;
    }, validTargets[0]);
}

/**
 * Targets all allies
 * @param {object} context - Targeting context
 * @returns {Character[]|null} - Array of targets or null if no valid targets
 */
function targetAllAllies(context) {
    const { actor, potentialTargets, teamManager } = context;
    
    // Filter to only include allies that are alive
    const validTargets = potentialTargets.filter(target => {
        return teamManager.getCharacterTeam(target) === teamManager.getCharacterTeam(actor) && 
               !target.defeated;
    });
    
    if (validTargets.length === 0) return null;
    
    return validTargets;
}

/**
 * Targets self
 * @param {object} context - Targeting context
 * @returns {Character} - The actor
 */
function targetSelf(context) {
    return context.actor;
}

/**
 * Targets the enemy with the highest attack
 * @param {object} context - Targeting context
 * @returns {Character|null} - Selected target or null if no valid target
 */
function targetHighestAttackEnemy(context) {
    const { actor, potentialTargets, teamManager } = context;
    
    // Filter to only include enemies that are alive
    const validTargets = potentialTargets.filter(target => {
        return teamManager.getCharacterTeam(target) !== teamManager.getCharacterTeam(actor) && 
               !target.defeated;
    });
    
    if (validTargets.length === 0) return null;
    
    // Find target with highest attack
    return validTargets.reduce((highestTarget, currentTarget) => {
        return (currentTarget.stats.attack > highestTarget.stats.attack) ? currentTarget : highestTarget;
    }, validTargets[0]);
}

/**
 * Targets the enemy with the highest intellect
 * @param {object} context - Targeting context
 * @returns {Character|null} - Selected target or null if no valid target
 */
function targetHighestIntellectEnemy(context) {
    const { actor, potentialTargets, teamManager } = context;
    
    // Filter to only include enemies that are alive
    const validTargets = potentialTargets.filter(target => {
        return teamManager.getCharacterTeam(target) !== teamManager.getCharacterTeam(actor) && 
               !target.defeated;
    });
    
    if (validTargets.length === 0) return null;
    
    // Find target with highest intellect
    return validTargets.reduce((highestTarget, currentTarget) => {
        return (currentTarget.stats.intellect > highestTarget.stats.intellect) ? currentTarget : highestTarget;
    }, validTargets[0]);
}

/**
 * Targets adjacent enemies (main target plus adjacent ones)
 * @param {object} context - Targeting context
 * @returns {Character[]|null} - Array of targets or null if no valid targets
 */
function targetAdjacentEnemies(context) {
    const { actor, potentialTargets, teamManager } = context;
    
    // Filter to only include enemies that are alive
    const validTargets = potentialTargets.filter(target => {
        return teamManager.getCharacterTeam(target) !== teamManager.getCharacterTeam(actor) && 
               !target.defeated;
    });
    
    if (validTargets.length === 0) return null;
    
    // Get primary target (usually the one with lowest HP or random)
    const primaryTarget = validTargets.reduce((lowestTarget, currentTarget) => {
        return (currentTarget.currentHp < lowestTarget.currentHp) ? currentTarget : lowestTarget;
    }, validTargets[0]);
    
    // Get adjacent targets (implementation depends on how character positions are stored)
    // For this basic implementation, we'll just get up to 2 additional random enemies
    const otherTargets = validTargets.filter(target => target !== primaryTarget);
    const adjacentTargets = [primaryTarget];
    
    // Add up to 2 more random enemies if available
    if (otherTargets.length > 0) {
        // Shuffle other targets
        const shuffled = [...otherTargets].sort(() => 0.5 - Math.random());
        // Add up to 2 more
        for (let i = 0; i < Math.min(2, shuffled.length); i++) {
            adjacentTargets.push(shuffled[i]);
        }
    }
    
    return adjacentTargets;
}

/**
 * Targets a random ally excluding self
 * @param {object} context - Targeting context
 * @returns {Character|null} - Selected target or null if no valid target
 */
function targetRandomAlly(context) {
    const { actor, potentialTargets, teamManager } = context;
    
    // Filter to only include allies (excluding self) that are alive
    const validTargets = potentialTargets.filter(target => {
        return teamManager.getCharacterTeam(target) === teamManager.getCharacterTeam(actor) && 
               target !== actor && 
               !target.defeated;
    });
    
    if (validTargets.length === 0) return null;
    
    // Select random ally
    const randomIndex = Math.floor(Math.random() * validTargets.length);
    return validTargets[randomIndex];
}

/**
 * Targets the most injured ally (lowest HP percentage)
 * @param {object} context - Targeting context
 * @returns {Character|null} - Selected target or null if no valid target
 */
function targetMostInjuredAlly(context) {
    const { actor, potentialTargets, teamManager } = context;
    
    // Filter to only include allies that are alive
    const validTargets = potentialTargets.filter(target => {
        return teamManager.getCharacterTeam(target) === teamManager.getCharacterTeam(actor) && 
               !target.defeated;
    });
    
    if (validTargets.length === 0) return null;
    
    // Find ally with lowest HP percentage
    return validTargets.reduce((mostInjured, current) => {
        const currentHpPercent = current.currentHp / current.stats.hp;
        const mostInjuredHpPercent = mostInjured.currentHp / mostInjured.stats.hp;
        return (currentHpPercent < mostInjuredHpPercent) ? current : mostInjured;
    }, validTargets[0]);
}

/**
 * Targets all characters but marks team relationships
 * @param {object} context - Targeting context
 * @returns {Character[]|null} - Array of targets or null if no valid targets
 */
function targetAllCharacters(context) {
    const { actor, potentialTargets, teamManager } = context;
    const actorTeam = actor.team || teamManager.getCharacterTeam(actor);
    
    // Filter living characters and add team relationship info
    const validTargets = potentialTargets.filter(target => !target.defeated).map(target => {
        // Add this crucial property to identify team relationship
        const targetTeam = target.team || teamManager.getCharacterTeam(target);
        target.isAllyOf = targetTeam === actorTeam;
        return target;
    });
    
    if (validTargets.length === 0) return null;
    
    return validTargets;
}

// Register all targeting behaviors
behaviorRegistry.registerTargetingBehavior('targetRandomEnemy', targetRandomEnemy, true);  // Set as default
behaviorRegistry.registerTargetingBehavior('targetLowestHpEnemy', targetLowestHpEnemy);
behaviorRegistry.registerTargetingBehavior('targetHighestHpEnemy', targetHighestHpEnemy);
behaviorRegistry.registerTargetingBehavior('targetAllEnemies', targetAllEnemies);
behaviorRegistry.registerTargetingBehavior('targetLowestHpAlly', targetLowestHpAlly);
behaviorRegistry.registerTargetingBehavior('targetAllAllies', targetAllAllies);
behaviorRegistry.registerTargetingBehavior('targetSelf', targetSelf);
// Register new targeting behaviors
behaviorRegistry.registerTargetingBehavior('targetHighestAttackEnemy', targetHighestAttackEnemy);
behaviorRegistry.registerTargetingBehavior('targetHighestIntellectEnemy', targetHighestIntellectEnemy);
behaviorRegistry.registerTargetingBehavior('targetAdjacentEnemies', targetAdjacentEnemies);
behaviorRegistry.registerTargetingBehavior('targetRandomAlly', targetRandomAlly);
behaviorRegistry.registerTargetingBehavior('targetMostInjuredAlly', targetMostInjuredAlly);
behaviorRegistry.registerTargetingBehavior('targetAllCharacters', targetAllCharacters);

// Export individual behaviors for direct use if needed
export {
    targetRandomEnemy,
    targetLowestHpEnemy,
    targetHighestHpEnemy,
    targetAllEnemies,
    targetLowestHpAlly,
    targetAllAllies,
    targetSelf,
    // Export new targeting behaviors
    targetHighestAttackEnemy,
    targetHighestIntellectEnemy,
    targetAdjacentEnemies,
    targetRandomAlly,
    targetMostInjuredAlly,
    targetAllCharacters
};
