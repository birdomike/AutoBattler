/**
 * Index file for the battle logic system
 * Provides a central point for importing all battle behavior components
 */

// Export main interface
export { default as battleBehaviors } from './BattleBehaviors.js';

// Export registry and individual behavior collections
export { default as behaviorRegistry } from './BehaviorRegistry.js';
export * as targetingBehaviors from './TargetingBehaviors.js';
export * as actionDecisionBehaviors from './ActionDecisionBehaviors.js';
export * as passiveBehaviors from './PassiveBehaviors.js';

// Export test utilities
export * as behaviorTesting from './BehaviorRegistryTest.js';

// For direct script inclusion, attach to window
if (typeof window !== 'undefined') {
    // Import and set up on window for direct browser usage
    import('./BattleBehaviors.js').then(module => {
        window.battleBehaviors = module.default;
        console.log('Battle Behaviors system loaded and available at window.battleBehaviors');
    });
}
