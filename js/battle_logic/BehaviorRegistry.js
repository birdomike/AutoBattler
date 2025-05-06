/**
 * BehaviorRegistry.js
 * 
 * Centralized registry for all behavior functions used in the battle system.
 * This enables a flexible "behavior delegation" pattern where specific logic
 * can be referenced by name and dynamically executed.
 */

class BehaviorRegistry {
    constructor() {
        // Initialize registries for different behavior types
        this.targetingBehaviors = {};
        this.actionDecisionBehaviors = {};
        this.passiveBehaviors = {};
        
        // Track all registered behaviors for debugging
        this.allBehaviors = {};
        
        // Default behaviors
        this.defaultTargetingBehavior = null;
        this.defaultActionDecisionBehavior = null;
    }

    /**
     * Register a targeting behavior function
     * @param {string} name - Unique name to reference this behavior
     * @param {Function} behaviorFn - The behavior function
     * @param {boolean} isDefault - Whether this should be the default behavior
     * @returns {BehaviorRegistry} - For method chaining
     */
    registerTargetingBehavior(name, behaviorFn, isDefault = false) {
        this.targetingBehaviors[name] = behaviorFn;
        this.allBehaviors[name] = { type: 'targeting', fn: behaviorFn };
        
        if (isDefault) {
            this.defaultTargetingBehavior = name;
        }
        
        return this;
    }

    /**
     * Register an action decision behavior function
     * @param {string} name - Unique name to reference this behavior
     * @param {Function} behaviorFn - The behavior function
     * @param {boolean} isDefault - Whether this should be the default behavior
     * @returns {BehaviorRegistry} - For method chaining
     */
    registerActionDecisionBehavior(name, behaviorFn, isDefault = false) {
        this.actionDecisionBehaviors[name] = behaviorFn;
        this.allBehaviors[name] = { type: 'actionDecision', fn: behaviorFn };
        
        if (isDefault) {
            this.defaultActionDecisionBehavior = name;
        }
        
        return this;
    }

    /**
     * Register a passive behavior function
     * @param {string} name - Unique name to reference this behavior
     * @param {Function} behaviorFn - The behavior function
     * @returns {BehaviorRegistry} - For method chaining
     */
    registerPassiveBehavior(name, behaviorFn) {
        this.passiveBehaviors[name] = behaviorFn;
        this.allBehaviors[name] = { type: 'passive', fn: behaviorFn };
        
        return this;
    }

    /**
     * Get a targeting behavior function by name
     * @param {string} name - Name of the behavior to retrieve
     * @returns {Function|null} - The behavior function or null if not found
     */
    getTargetingBehavior(name) {
        // If name is null/undefined or behavior doesn't exist, return default
        if (!name || !this.targetingBehaviors[name]) {
            if (this.defaultTargetingBehavior) {
                return this.targetingBehaviors[this.defaultTargetingBehavior];
            }
            console.warn(`No targeting behavior found for '${name}' and no default set`);
            return null;
        }
        
        return this.targetingBehaviors[name];
    }

    /**
     * Get an action decision behavior function by name
     * @param {string} name - Name of the behavior to retrieve
     * @returns {Function|null} - The behavior function or null if not found
     */
    getActionDecisionBehavior(name) {
        // If name is null/undefined or behavior doesn't exist, return default
        if (!name || !this.actionDecisionBehaviors[name]) {
            if (this.defaultActionDecisionBehavior) {
                return this.actionDecisionBehaviors[this.defaultActionDecisionBehavior];
            }
            console.warn(`No action decision behavior found for '${name}' and no default set`);
            return null;
        }
        
        return this.actionDecisionBehaviors[name];
    }

    /**
     * Get a passive behavior function by name
     * @param {string} name - Name of the behavior to retrieve
     * @returns {Function|null} - The behavior function or null if not found
     */
    getPassiveBehavior(name) {
        // If name is null/undefined or behavior doesn't exist, return null
        if (!name || !this.passiveBehaviors[name]) {
            console.warn(`No passive behavior found for '${name}'`);
            return null;
        }
        
        return this.passiveBehaviors[name];
    }

    /**
     * Execute a targeting behavior with provided context
     * @param {string} name - Name of the behavior to execute
     * @param {object} context - Data to pass to the behavior function
     * @returns {object|null} - Result of the behavior function or null if not found
     */
    executeTargetingBehavior(name, context) {
        const behaviorFn = this.getTargetingBehavior(name);
        if (!behaviorFn) return null;
        
        try {
            return behaviorFn(context);
        } catch (error) {
            console.error(`Error executing targeting behavior '${name}':`, error);
            // Fall back to default if available
            if (name !== this.defaultTargetingBehavior && this.defaultTargetingBehavior) {
                console.warn(`Falling back to default targeting behavior`);
                return this.executeTargetingBehavior(this.defaultTargetingBehavior, context);
            }
            return null;
        }
    }

    /**
     * Execute an action decision behavior with provided context
     * @param {string} name - Name of the behavior to execute
     * @param {object} context - Data to pass to the behavior function
     * @returns {object|null} - Result of the behavior function or null if not found
     */
    executeActionDecisionBehavior(name, context) {
        const behaviorFn = this.getActionDecisionBehavior(name);
        if (!behaviorFn) return null;
        
        try {
            return behaviorFn(context);
        } catch (error) {
            console.error(`Error executing action decision behavior '${name}':`, error);
            // Fall back to default if available
            if (name !== this.defaultActionDecisionBehavior && this.defaultActionDecisionBehavior) {
                console.warn(`Falling back to default action decision behavior`);
                return this.executeActionDecisionBehavior(this.defaultActionDecisionBehavior, context);
            }
            return null;
        }
    }

    /**
     * Execute a passive behavior with provided context
     * @param {string} name - Name of the behavior to execute
     * @param {object} context - Data to pass to the behavior function
     * @returns {object|null} - Result of the behavior function or null if not found
     */
    executePassiveBehavior(name, context) {
        const behaviorFn = this.getPassiveBehavior(name);
        if (!behaviorFn) return null;
        
        try {
            return behaviorFn(context);
        } catch (error) {
            console.error(`Error executing passive behavior '${name}':`, error);
            return null;
        }
    }

    /**
     * Utility method to list all registered behaviors
     * @returns {object} - Map of all registered behaviors by type
     */
    listAllBehaviors() {
        return {
            targeting: Object.keys(this.targetingBehaviors),
            actionDecision: Object.keys(this.actionDecisionBehaviors),
            passive: Object.keys(this.passiveBehaviors),
            defaultTargeting: this.defaultTargetingBehavior,
            defaultActionDecision: this.defaultActionDecisionBehavior
        };
    }
}

// Create singleton instance
const behaviorRegistry = new BehaviorRegistry();

// Export singleton
export default behaviorRegistry;
