/**
 * StatusEffectFixes.js
 * 
 * This script patches the BattleManager's status effect handling
 * to ensure it works properly in the absence of actual status_effects.json
 */

(function() {
    console.log('Applying status effect fixes...');
    
    // Check if BattleManager exists
    if (typeof window.BattleManager !== 'function') {
        console.error('BattleManager not found when applying status effect fixes!');
        return;
    }
    
    // Create a backup of the original loadStatusEffectDefinitions method
    const originalLoadMethod = window.BattleManager.prototype.loadStatusEffectDefinitions;
    
    // Replace with our enhanced version that has better fallbacks
    window.BattleManager.prototype.loadStatusEffectDefinitions = async function() {
        console.log('Enhanced loadStatusEffectDefinitions running...');
        
        try {
            // Check if definitions are already loaded
            if (this.statusEffectDefinitions) {
                return this.statusEffectDefinitions;
            }
            
            console.log('Attempting to fetch status effect definitions...');
            
            // First try the original method
            try {
                // Call the original method
                const result = await originalLoadMethod.call(this);
                // A better check for valid result
                if (result && typeof result === 'object' && Object.keys(result).length > 0) {
                    console.log('Original status effect loading succeeded!');
                    return result;
                }
                
                // Don't throw an error, just use fallbacks silently
                console.log('Original method returned no status effects, using fallbacks...');
                throw new Error('Using fallbacks instead');
            } catch (originalError) {
                console.log('Using built-in status effect definitions as fallback');
                
                // Create default status effect definitions
                console.log('Creating default status effect definitions as fallback');
                const defaultDefinitions = {
                    'burn': {
                        id: 'burn',
                        name: 'Burn',
                        description: 'Taking fire damage over time',
                        icon: 'assets/images/icons/status/burn.png',
                        type: 'DoT',
                        defaultDuration: 2,
                        maxStacks: 1,
                        behavior: {
                            trigger: 'onTurnStart',
                            action: 'Damage',
                            valueType: 'PercentMaxHP',
                            value: 0.08,
                            damageType: 'fire'
                        }
                    },
                    'regen': {
                        id: 'regen',
                        name: 'Regeneration',
                        description: 'Healing over time',
                        icon: 'assets/images/icons/status/regen.png',
                        type: 'HoT',
                        defaultDuration: 3,
                        maxStacks: 1,
                        behavior: {
                            trigger: 'onTurnStart',
                            action: 'Heal',
                            valueType: 'PercentMaxHP',
                            value: 0.05
                        }
                    },
                    'stun': {
                        id: 'stun',
                        name: 'Stunned',
                        description: 'Unable to take actions',
                        icon: 'assets/images/icons/status/stun.png',
                        type: 'Control',
                        defaultDuration: 1,
                        maxStacks: 1,
                        behavior: {
                            modifier: 'PreventAction',
                            value: true
                        }
                    },
                    'attack_up': {
                        id: 'attack_up',
                        name: 'Attack Up',
                        description: 'Attack increased by 50%',
                        icon: 'assets/images/icons/status/attack_up.png',
                        type: 'Buff',
                        defaultDuration: 3,
                        maxStacks: 1,
                        behavior: {
                            modifier: 'StatModification',
                            stat: 'Attack',
                            value: 0.5,
                            isMultiplier: true
                        }
                    },
                    'defense_up': {
                        id: 'defense_up',
                        name: 'Defense Up',
                        description: 'Defense increased by 50%',
                        icon: 'assets/images/icons/status/defense_up.png',
                        type: 'Buff',
                        defaultDuration: 3,
                        maxStacks: 1,
                        behavior: {
                            modifier: 'StatModification',
                            stat: 'Defense',
                            value: 0.5,
                            isMultiplier: true
                        }
                    }
                };
                
                this.statusEffectDefinitions = defaultDefinitions;
                console.log('Using default status effect definitions');
                return defaultDefinitions;
            }
        } catch (error) {
            console.error('Unexpected error loading status effect definitions:', error);
            // Return an empty object as fallback
            this.statusEffectDefinitions = {};
            return {};
        }
    };
    
    console.log('Status effect fixes applied successfully');
})();
