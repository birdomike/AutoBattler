/**
 * BattleBehaviors.js
 * 
 * Main entry point for the battle behavior system.
 * Imports and re-exports all behavior functionality.
 */

import behaviorRegistry from './BehaviorRegistry.js';

// Import all behaviors to ensure they're registered
import * as targetingBehaviors from './TargetingBehaviors.js';
import * as actionDecisionBehaviors from './ActionDecisionBehaviors.js';
import * as passiveBehaviors from './PassiveBehaviors.js';

/**
 * A centralized interface for executing behavior functions
 */
class BattleBehaviors {
    constructor() {
        this.registry = behaviorRegistry;
    }
    
    /**
     * Selects a target for an ability or action based on targeting logic
     * @param {string|null} targetingLogic - Name of targeting logic to use
     * @param {object} context - Targeting context
     * @returns {Character|Character[]|null} - Selected target(s) or null if no valid target
     */
    selectTarget(targetingLogic, context) {
        return this.registry.executeTargetingBehavior(targetingLogic, context);
    }
    
    /**
     * Decides which ability to use (or basic attack)
     * @param {string|null} decisionLogic - Name of action decision logic to use
     * @param {object} context - Action decision context
     * @returns {object|null} - Selected ability or null for basic attack
     */
    decideAction(decisionLogic, context) {
        return this.registry.executeActionDecisionBehavior(decisionLogic, context);
    }
    
    /**
     * Processes a passive ability
     * @param {string} passiveName - Name of passive behavior to execute
     * @param {object} context - Passive context
     * @returns {object} - Result of the passive ability
     */
    executePassiveBehavior(passiveName, context) {
        return this.registry.executePassiveBehavior(passiveName, context);
    }
    
    /**
     * Utility function to check if a specific behavior exists
     * @param {string} behaviorName - Name of the behavior to check
     * @returns {boolean} - Whether the behavior exists
     */
    hasBehavior(behaviorName) {
        return !!this.registry.allBehaviors[behaviorName];
    }
    
    /**
     * Utility function to get the default targeting behavior
     * @returns {string} - Name of the default targeting behavior
     */
    getDefaultTargetingBehavior() {
        return this.registry.defaultTargetingBehavior;
    }
    
    /**
     * Utility function to get the default action decision behavior
     * @returns {string} - Name of the default action decision behavior
     */
    getDefaultActionDecisionBehavior() {
        return this.registry.defaultActionDecisionBehavior;
    }
    
    /**
     * Maps targetType strings to targeting behavior names
     * @param {string} targetType - Type of targeting from ability data
     * @returns {string} - Name of the corresponding targeting behavior
     */
    getTargetingBehaviorFromType(targetType) {
        const mapping = {
            'SingleEnemy': 'targetRandomEnemy',
            'AllEnemies': 'targetAllEnemies',
            'Self': 'targetSelf',
            'SingleAlly': 'targetLowestHpAlly',
            'AllAllies': 'targetAllAllies',
            'LowestHpEnemy': 'targetLowestHpEnemy',
            'HighestHpEnemy': 'targetHighestHpEnemy',
            'LowestHpAlly': 'targetLowestHpAlly'
        };
        
        return mapping[targetType] || this.registry.defaultTargetingBehavior;
    }
}

// Create and export singleton instance
const battleBehaviors = new BattleBehaviors();
export default battleBehaviors;

// Re-export everything for convenience
export {
    behaviorRegistry,
    targetingBehaviors,
    actionDecisionBehaviors,
    passiveBehaviors
};
