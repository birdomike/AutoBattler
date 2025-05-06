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
        
        // HOTFIX (0.5.27.2_Hotfix1): Add additional common status effect IDs with "status_" prefix
        // This addresses issues with status_regen and status_spd_down specifically
        
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
        
        // HOTFIX (0.5.27.2_Hotfix1): Add specific definitions for problematic status effects
        // Add status_regen effect
        this.effectDefinitions.set('status_regen', {
            id: 'status_regen',
            name: 'Regeneration',
            description: 'Recovering health over time',
            effectType: 'healing',
            value: 5,
            duration: 3,
            stackable: true,
            maxStacks: 3,
            iconPath: 'assets/images/icons/status/status-icons/regeneration.png',
            behavior: {
                trigger: 'onTurnStart',
                action: 'Heal',
                valueType: 'PercentMaxHP',
                value: 0.05
            }
        });
        
        // Add status_spd_down effect
        this.effectDefinitions.set('status_spd_down', {
            id: 'status_spd_down',
            name: 'Speed Down',
            description: 'Speed is decreased',
            effectType: 'statModifier',
            stat: 'speed',
            value: -2,
            duration: 3,
            stackable: false,
            iconPath: 'assets/images/icons/status/status-icons/speeddown.png'
        });
        
        console.log(`[StatusEffectDefinitionLoader] Added ${fallbackEffects.length + 2} fallback definitions (including specific additions for status_regen and status_spd_down)`);
    }

    generateFallbackDefinition(effectId) {
        // HOTFIX: Helper to generate meaningful fallback definitions based on the effectId
        // Handles specific problematic status effects like status_regen and status_spd_down
        const lowerEffectId = effectId.toLowerCase();
        
        // Auto-detect effect type based on name
        let effectType = 'unknown';
        let duration = 2;
        let value = 0;
        let stackable = false;
        let stat = null;
        let name = `Unknown Effect (${effectId})`;
        let description = 'An unknown status effect';
        let iconPath = 'assets/images/icons/status/status-icons/unknown.png';
        
        // Try to intelligently determine effect type from ID
        if (lowerEffectId.includes('burn') || lowerEffectId.includes('poison') || lowerEffectId.includes('bleed')) {
            effectType = 'damage';
            value = 5;
            duration = 3;
            stackable = true;
            name = lowerEffectId.includes('burn') ? 'Burn' : 
                  lowerEffectId.includes('poison') ? 'Poison' : 'Bleed';
            description = `Taking damage over time from ${name.toLowerCase()}`;
            iconPath = `assets/images/icons/status/status-icons/${name.toLowerCase()}.png`;
        }
        else if (lowerEffectId.includes('regen') || lowerEffectId.includes('heal')) {
            effectType = 'healing';
            value = 5;
            duration = 3;
            stackable = true;
            name = 'Regeneration';
            description = 'Recovering health over time';
            iconPath = 'assets/images/icons/status/status-icons/regeneration.png';
        }
        else if (lowerEffectId.includes('stun') || lowerEffectId.includes('freeze') || lowerEffectId.includes('paralyze')) {
            effectType = 'control';
            duration = 1;
            name = lowerEffectId.includes('stun') ? 'Stun' : 
                  lowerEffectId.includes('freeze') ? 'Freeze' : 'Paralyze';
            description = 'Unable to take actions';
            iconPath = `assets/images/icons/status/status-icons/${name.toLowerCase()}.png`;
        }
        else if (lowerEffectId.includes('shield') || lowerEffectId.includes('protect')) {
            effectType = 'shield';
            value = 10;
            duration = 2;
            name = 'Shield';
            description = 'Absorbs incoming damage';
            iconPath = 'assets/images/icons/status/status-icons/shield.png';
        }
        // Stat modifiers
        else if (lowerEffectId.includes('atk') || lowerEffectId.includes('attack')) {
            effectType = 'statModifier';
            stat = 'attack';
            value = lowerEffectId.includes('down') ? -5 : 5;
            duration = 3;
            name = value > 0 ? 'Attack Up' : 'Attack Down';
            description = `Attack power is ${value > 0 ? 'increased' : 'decreased'}`;
            iconPath = `assets/images/icons/status/status-icons/${name.replace(' ', '').toLowerCase()}.png`;
        }
        else if (lowerEffectId.includes('def') || lowerEffectId.includes('defense')) {
            effectType = 'statModifier';
            stat = 'defense';
            value = lowerEffectId.includes('down') ? -5 : 5;
            duration = 3;
            name = value > 0 ? 'Defense Up' : 'Defense Down';
            description = `Defense is ${value > 0 ? 'increased' : 'decreased'}`;
            iconPath = `assets/images/icons/status/status-icons/${name.replace(' ', '').toLowerCase()}.png`;
        }
        else if (lowerEffectId.includes('spd') || lowerEffectId.includes('speed')) {
            effectType = 'statModifier';
            stat = 'speed';
            value = lowerEffectId.includes('down') ? -2 : 2;
            duration = 3;
            name = value > 0 ? 'Speed Up' : 'Speed Down';
            description = `Speed is ${value > 0 ? 'increased' : 'decreased'}`;
            iconPath = `assets/images/icons/status/status-icons/${name.replace(' ', '').toLowerCase()}.png`;
        }
        
        const fallbackDefinition = {
            id: effectId,
            name: name,
            description: description,
            effectType: effectType,
            duration: duration,
            stackable: stackable,
            iconPath: iconPath
        };
        
        // Add type-specific properties
        if (effectType === 'damage' || effectType === 'healing' || effectType === 'shield') {
            fallbackDefinition.value = value;
        }
        if (effectType === 'statModifier') {
            fallbackDefinition.stat = stat;
            fallbackDefinition.value = value;
        }
        if (stackable) {
            fallbackDefinition.maxStacks = 3; // Default max stacks
        }
        
        // For healing effects like regeneration, add a behavior property
        if (effectType === 'healing') {
            fallbackDefinition.behavior = {
                trigger: 'onTurnStart',
                action: 'Heal',
                valueType: 'PercentMaxHP',
                value: 0.05
            };
        }
        
        console.warn(`[StatusEffectDefinitionLoader] Generated fallback definition for '${effectId}': ${JSON.stringify(fallbackDefinition)}`);
        return fallbackDefinition;
    }
    
    getDefinition(effectId) {
        if (!effectId) {
            console.warn('[StatusEffectDefinitionLoader] getDefinition called with null/undefined effectId');
            return null;
        }
        
        // HOTFIX (0.5.27.2_Hotfix8): Immediately generate and cache missing definitions
        if (!this.effectDefinitions.has(effectId)) {
            // Generate a fallback definition and cache it for future use
            const fallbackDefinition = this.generateFallbackDefinition(effectId);
            this.effectDefinitions.set(effectId, fallbackDefinition);
            
            // Log generation but not as a warning
            console.log(`[StatusEffectDefinitionLoader] Generated and cached fallback definition for: ${effectId}`);
        }
        
        return this.effectDefinitions.get(effectId);
    }
}

// Make StatusEffectDefinitionLoader available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.StatusEffectDefinitionLoader = StatusEffectDefinitionLoader;
    console.log("StatusEffectDefinitionLoader class definition loaded and exported to window.StatusEffectDefinitionLoader");
}

// Legacy global assignment for maximum compatibility
window.StatusEffectDefinitionLoader = StatusEffectDefinitionLoader;
