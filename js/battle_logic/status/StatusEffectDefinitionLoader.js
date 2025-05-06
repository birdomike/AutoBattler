class StatusEffectDefinitionLoader {
    constructor() {
        this.effectDefinitions = new Map();
        // Use setupFallbackDefinitions initially
        this.setupFallbackDefinitions();
        // Then try to load from JSON
        this._loadDefinitionsAsync();
        console.log('[StatusEffectDefinitionLoader] Initialized with fallback definitions, loading JSON data...');
    }

    _loadDefinitionsAsync() {
        // Load definitions in the background
        fetch('data/status_effects.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load status effects: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(effectsData => {
                if (!effectsData) {
                    console.error("[StatusEffectDefinitionLoader] No data received from status_effects.json");
                    return;
                }
                
                // Handle both array and object formats
                let effectsArray = [];
                if (Array.isArray(effectsData)) {
                    effectsArray = effectsData;
                } else if (typeof effectsData === 'object' && effectsData !== null) {
                    // If it's an object with effect IDs as keys, convert to array
                    effectsArray = Object.values(effectsData);
                    console.log(`[StatusEffectDefinitionLoader] Converted object to array with ${effectsArray.length} effects`);
                } else {
                    console.error("[StatusEffectDefinitionLoader] Expected status effect data but got:", typeof effectsData);
                    return;
                }
                
                // Process the effects array
                let validCount = 0;
                effectsArray.forEach(definition => {
                    if (this.validateDefinition(definition)) {
                        this.effectDefinitions.set(definition.id, definition);
                        validCount++;
                    } else {
                        // Warning is handled by validateDefinition's detailed error messages
                    }
                });
                console.log(`[StatusEffectDefinitionLoader] Loaded ${validCount} valid status effect definitions from JSON`);
            })
            .catch(error => {
                console.error('[StatusEffectDefinitionLoader] Error loading status effects:', error);
                // Fallbacks already set up in constructor
            });
    }

    validateDefinition(definition) {
        // Check required fields
        if (!definition || typeof definition !== 'object') {
            console.debug('[StatusEffectDefinitionLoader] Definition is not an object');
            return false;
        }
        
        if (!definition.id || typeof definition.id !== 'string') {
            console.debug('[StatusEffectDefinitionLoader] Missing or invalid id property');
            return false;
        }
        
        if (!definition.name || typeof definition.name !== 'string') {
            console.debug(`[StatusEffectDefinitionLoader] Missing or invalid name for effect: ${definition.id}`);
            return false;
        }
        
        if (!definition.description || typeof definition.description !== 'string') {
            console.debug(`[StatusEffectDefinitionLoader] Missing or invalid description for effect: ${definition.id}`);
            return false;
        }
        
        // Check duration
        if (typeof definition.duration !== 'number' || definition.duration <= 0) {
            if (definition.duration !== -1) { // -1 is valid for permanent effects
                console.debug(`[StatusEffectDefinitionLoader] Invalid duration for effect: ${definition.id}`);
                return false;
            }
        }
        
        // Check if stackable is boolean
        if (typeof definition.stackable !== 'boolean') {
            console.debug(`[StatusEffectDefinitionLoader] stackable property must be boolean for effect: ${definition.id}`);
            return false;
        }
        
        // Additional validations based on effect type
        if (definition.effectType === 'damage' && typeof definition.value !== 'number') {
            console.debug(`[StatusEffectDefinitionLoader] Missing or invalid value for damage effect: ${definition.id}`);
            return false;
        }
        
        if (definition.effectType === 'healing' && typeof definition.value !== 'number') {
            console.debug(`[StatusEffectDefinitionLoader] Missing or invalid value for healing effect: ${definition.id}`);
            return false;
        }
        
        if (definition.effectType === 'statModifier') {
            if (!definition.stat || typeof definition.stat !== 'string') {
                console.debug(`[StatusEffectDefinitionLoader] Missing or invalid stat for stat modifier effect: ${definition.id}`);
                return false;
            }
            if (typeof definition.value !== 'number') {
                console.debug(`[StatusEffectDefinitionLoader] Missing or invalid value for stat modifier effect: ${definition.id}`);
                return false;
            }
        }
        
        return true;
    }

    setupFallbackDefinitions() {
        console.log('[StatusEffectDefinitionLoader] Setting up fallback definitions');
        
        // Core status effects as fallback
        const fallbackEffects = [
            {
                id: 'burn',
                name: 'Burn',
                description: 'Taking damage over time from fire',
                effectType: 'damage',
                value: 5,
                duration: 3,
                stackable: true,
                maxStacks: 3,
                iconPath: 'assets/images/icons/status/status-icons/burn.png'
            },
            {
                id: 'poison',
                name: 'Poison',
                description: 'Taking damage over time from toxins',
                effectType: 'damage',
                value: 4,
                duration: 4,
                stackable: true,
                maxStacks: 5,
                iconPath: 'assets/images/icons/status/status-icons/poison.png'
            },
            {
                id: 'bleed',
                name: 'Bleed',
                description: 'Taking damage over time from bleeding',
                effectType: 'damage',
                value: 6,
                duration: 3,
                stackable: true,
                maxStacks: 3,
                iconPath: 'assets/images/icons/status/status-icons/bleed.png'
            },
            {
                id: 'stun',
                name: 'Stun',
                description: 'Unable to take actions',
                effectType: 'control',
                duration: 1,
                stackable: false,
                iconPath: 'assets/images/icons/status/status-icons/stun.png'
            },
            {
                id: 'freeze',
                name: 'Freeze',
                description: 'Unable to take actions and vulnerable to damage',
                effectType: 'control',
                duration: 2,
                stackable: false,
                iconPath: 'assets/images/icons/status/status-icons/freeze.png'
            },
            {
                id: 'regeneration',
                name: 'Regeneration',
                description: 'Recovering health over time',
                effectType: 'healing',
                value: 5,
                duration: 3,
                stackable: true,
                maxStacks: 3,
                iconPath: 'assets/images/icons/status/status-icons/regeneration.png'
            },
            {
                id: 'attackUp',
                name: 'Attack Up',
                description: 'Attack power is increased',
                effectType: 'statModifier',
                stat: 'attack',
                value: 5,
                duration: 3,
                stackable: false,
                iconPath: 'assets/images/icons/status/status-icons/attackUp.png'
            },
            {
                id: 'defenseUp',
                name: 'Defense Up',
                description: 'Defense is increased',
                effectType: 'statModifier',
                stat: 'defense',
                value: 5,
                duration: 3,
                stackable: false,
                iconPath: 'assets/images/icons/status/status-icons/defenseUp.png'
            },
            {
                id: 'attackDown',
                name: 'Attack Down',
                description: 'Attack power is decreased',
                effectType: 'statModifier',
                stat: 'attack',
                value: -5,
                duration: 3,
                stackable: false,
                iconPath: 'assets/images/icons/status/status-icons/attackDown.png'
            },
            {
                id: 'defenseDown',
                name: 'Defense Down',
                description: 'Defense is decreased',
                effectType: 'statModifier',
                stat: 'defense',
                value: -5,
                duration: 3,
                stackable: false,
                iconPath: 'assets/images/icons/status/status-icons/defenseDown.png'
            },
            {
                id: 'speedUp',
                name: 'Speed Up',
                description: 'Speed is increased',
                effectType: 'statModifier',
                stat: 'speed',
                value: 2,
                duration: 3,
                stackable: false,
                iconPath: 'assets/images/icons/status/status-icons/speedUp.png'
            },
            {
                id: 'speedDown',
                name: 'Speed Down',
                description: 'Speed is decreased',
                effectType: 'statModifier',
                stat: 'speed',
                value: -2,
                duration: 3,
                stackable: false,
                iconPath: 'assets/images/icons/status/status-icons/speedDown.png'
            },
            {
                id: 'shield',
                name: 'Shield',
                description: 'Absorbs incoming damage',
                effectType: 'shield',
                value: 10,
                duration: 3,
                stackable: false,
                iconPath: 'assets/images/icons/status/status-icons/shield.png'
            }
        ];
        
        // Add fallback definitions to map
        fallbackEffects.forEach(effect => {
            this.effectDefinitions.set(effect.id, effect);
        });
        
        console.log(`[StatusEffectDefinitionLoader] Added ${fallbackEffects.length} fallback definitions`);
    }

    getDefinition(effectId) {
        if (!effectId) {
            console.warn('[StatusEffectDefinitionLoader] getDefinition called with null/undefined effectId');
            return null;
        }
        
        const definition = this.effectDefinitions.get(effectId);
        
        if (!definition) {
            console.warn(`[StatusEffectDefinitionLoader] Effect definition not found for: ${effectId}`);
            // Return a generic unknown effect
            return {
                id: effectId,
                name: `Unknown Effect (${effectId})`,
                description: 'An unknown status effect',
                effectType: 'unknown',
                duration: 1,
                stackable: false,
                iconPath: 'assets/images/icons/status/status-icons/unknown.png'
            };
        }
        
        return definition;
    }
}

// Make StatusEffectDefinitionLoader available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.StatusEffectDefinitionLoader = StatusEffectDefinitionLoader;
    console.log("StatusEffectDefinitionLoader class definition loaded and exported to window.StatusEffectDefinitionLoader");
}

// Legacy global assignment for maximum compatibility
window.StatusEffectDefinitionLoader = StatusEffectDefinitionLoader;
