class StatusEffectDefinitionLoader {
    constructor() {
        this.effectDefinitions = new Map();
        // Use setupFallbackDefinitions initially
        this.setupFallbackDefinitions();
        // Then try to load from JSON
        this.primeDefinitions();
        console.log('[StatusEffectDefinitionLoader] Initialized with fallback definitions, attempting to load JSON data...');
    }

    /**
     * Prime the definition loader with data from either JSON or fallback definitions.
     * This method ensures that status effect definitions are available from *some* source.
     * First attempts to load from JSON files, and if that fails uses fallback definitions.
     * @returns {Promise<boolean>} - Promise resolving to success status
     */
    async primeDefinitions() {
        console.log('[StatusEffectDefinitionLoader] Priming status effect definitions...');
        
        try {
            // Try to load from JSON first
            const jsonSuccess = await this.loadDefinitionsFromJson();
            if (jsonSuccess) {
                console.log('[StatusEffectDefinitionLoader] Successfully loaded definitions from JSON');
                return true;
            }
            
            // If JSON loading failed, ensure fallback definitions are set up
            console.log('[StatusEffectDefinitionLoader] JSON loading failed, using fallback definitions');
            const fallbackSuccess = this.setupFallbackDefinitions();
            
            return fallbackSuccess;
        } catch (error) {
            // If anything went wrong during JSON loading, use fallbacks
            console.error('[StatusEffectDefinitionLoader] Error during definition loading:', error);
            console.log('[StatusEffectDefinitionLoader] Using fallback definitions due to error');
            
            // Ensure fallbacks are set up
            const fallbackSuccess = this.setupFallbackDefinitions();
            
            // Even if fallbacks failed (shouldn't happen), return true to allow game to continue
            return fallbackSuccess;
        }
    }

    /**
     * Normalize effect definition to a standard internal format
     * @param {Object} definition - The status effect definition to normalize
     * @returns {Object} - The normalized definition
     */
    normalizeDefinition(definition) {
        // Create a copy of the definition to avoid modifying the original
        const normalized = { ...definition };
        
        // Ensure required properties exist
        normalized.id = definition.id;
        normalized.name = definition.name;
        normalized.description = definition.description;
        
        // Normalize duration (use defaultDuration if duration is not present)
        if (typeof definition.duration !== 'number' && typeof definition.defaultDuration === 'number') {
            normalized.duration = definition.defaultDuration;
        }
        
        // Normalize stackable property (infer from maxStacks if not present)
        if (typeof definition.stackable !== 'boolean' && typeof definition.maxStacks === 'number') {
            normalized.stackable = definition.maxStacks > 1;
            normalized.maxStacks = definition.maxStacks;
        }
        
        // Normalize icon path
        if (definition.icon && !definition.iconPath) {
            normalized.iconPath = definition.icon;
        } else if (!normalized.iconPath && !normalized.icon) {
            // Fallback icon if none provided
            normalized.iconPath = `assets/images/icons/status/status-icons/${normalized.id.replace('status_', '')}.png`;
        }
        
        // Handle behavior-based effect types
        if (definition.behavior && !definition.effectType) {
            // Determine effectType from behavior
            if (definition.behavior.trigger === 'onTurnStart') {
                if (definition.behavior.action === 'Damage') {
                    normalized.effectType = 'damage';
                    normalized.value = definition.behavior.value || 5;
                } else if (definition.behavior.action === 'Heal') {
                    normalized.effectType = 'healing';
                    normalized.value = definition.behavior.value || 5;
                }
            } else if (definition.behavior.modifier === 'StatModification') {
                normalized.effectType = 'statModifier';
                normalized.stat = definition.behavior.stat?.toLowerCase() || 'attack';
                normalized.value = definition.behavior.value || 5;
            } else if (definition.behavior.modifier === 'AbsorbDamage') {
                normalized.effectType = 'shield';
                normalized.value = definition.behavior.value || 10;
            } else if (definition.behavior.modifier === 'PreventAction') {
                normalized.effectType = 'control';
            } else if (definition.type === 'Buff' || definition.type === 'Debuff') {
                // Use the type property as a fallback
                normalized.effectType = definition.type.toLowerCase();
            } else {
                normalized.effectType = 'utility';  // Default fallback
            }
        }
        
        // Add missing properties for the internal format if needed
        if (!normalized.effectType) {
            normalized.effectType = 'utility';
        }
        
        return normalized;
    }

    /**
     * Load status effect definitions from JSON file
     * @param {string} [primaryPath='data/status_effects.json'] - Primary path to load from
     * @param {string} [fallbackPath='/status_effects.json'] - Fallback path if primary fails
     * @returns {Promise<boolean>} - Promise resolving to success status
     */
    async loadDefinitionsFromJson(primaryPath = 'data/status_effects.json', fallbackPath = '/status_effects.json') {
        console.log('[StatusEffectDefinitionLoader] Loading status effect definitions from JSON...');
        
        try {
            // First try to load from primary path (data directory)
            try {
                console.log(`[StatusEffectDefinitionLoader] Attempting to load from ${primaryPath}...`);
                const response = await fetch(primaryPath);
                if (!response.ok) {
                    throw new Error(`Failed to load ${primaryPath}: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                return this._processDefinitionData(data, 'primary path');
            } catch (primaryError) {
                console.warn(`[StatusEffectDefinitionLoader] Failed to load from ${primaryPath}:`, primaryError.message);
                
                // Try fallback path (root directory)
                try {
                    console.log(`[StatusEffectDefinitionLoader] Attempting to load from ${fallbackPath}...`);
                    const response = await fetch(fallbackPath);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${fallbackPath}: ${response.status} ${response.statusText}`);
                    }
                    const data = await response.json();
                    return this._processDefinitionData(data, 'fallback path');
                } catch (fallbackError) {
                    console.warn(`[StatusEffectDefinitionLoader] Failed to load from ${fallbackPath}:`, fallbackError.message);
                    throw primaryError; // Throw original error
                }
            }
        } catch (error) {
            console.error('[StatusEffectDefinitionLoader] Error loading status effect definitions:', error);
            console.log('[StatusEffectDefinitionLoader] Using fallback definitions only.');
            return false;
        }
    }
    
    /**
     * Private helper to process loaded definition data
     * @private
     * @param {Object} effectsData - The loaded JSON data
     * @param {string} source - Description of the data source for logging
     * @returns {boolean} - Success status
     */
    _processDefinitionData(effectsData, source) {
        if (!effectsData) {
            console.error(`[StatusEffectDefinitionLoader] No data received from ${source}`);
            return false;
        }
        
        // Handle different possible JSON formats
        let effectsArray = [];
        if (Array.isArray(effectsData)) {
            effectsArray = effectsData;
        } else if (typeof effectsData === 'object' && effectsData !== null) {
            // Check if it's wrapped in a "status_effects" property (common format)
            if (effectsData.status_effects && Array.isArray(effectsData.status_effects)) {
                effectsArray = effectsData.status_effects;
                console.log(`[StatusEffectDefinitionLoader] Extracted array from status_effects property with ${effectsArray.length} effects`);
            } else {
                // If it's an object with effect IDs as keys, convert to array
                effectsArray = Object.values(effectsData);
                console.log(`[StatusEffectDefinitionLoader] Converted object to array with ${effectsArray.length} effects`);
            }
        } else {
            console.error(`[StatusEffectDefinitionLoader] Expected status effect data but got: ${typeof effectsData}`);
            return false;
        }
        
        // Process the effects array
        let validCount = 0;
        effectsArray.forEach(definition => {
            if (this.validateDefinition(definition)) {
                // Normalize the definition to match our expected format
                const normalizedDef = this.normalizeDefinition(definition);
                this.effectDefinitions.set(normalizedDef.id, normalizedDef);
                validCount++;
            } else {
                // Warning is handled by validateDefinition's detailed error messages
            }
        });
        
        console.log(`[StatusEffectDefinitionLoader] Loaded ${validCount} valid status effect definitions from ${source}`);
        return validCount > 0;
    }
    
    /**
     * Legacy method to maintain backward compatibility
     * @private
     */
    _loadDefinitionsAsync() {
        console.warn('[StatusEffectDefinitionLoader] _loadDefinitionsAsync is deprecated, use loadDefinitionsFromJson instead');
        return this.loadDefinitionsFromJson();
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
        
        // Check duration - allow defaultDuration as an alternative field name
        const hasDuration = (
            (typeof definition.duration === 'number' && (definition.duration > 0 || definition.duration === -1)) ||
            (typeof definition.defaultDuration === 'number' && (definition.defaultDuration > 0 || definition.defaultDuration === -1))
        );
        
        if (!hasDuration) {
            console.debug(`[StatusEffectDefinitionLoader] Invalid or missing duration for effect: ${definition.id}`);
            return false;
        }
        
        // Check if stackable is boolean or if maxStacks is present (alternative to stackable)
        const hasStackInfo = (
            typeof definition.stackable === 'boolean' ||
            typeof definition.maxStacks === 'number'
        );
        
        if (!hasStackInfo) {
            console.debug(`[StatusEffectDefinitionLoader] Missing stacking information for effect: ${definition.id}`);
            return false;
        }
        
        // Additional validations based on effect type or behavior
        if (definition.effectType) {
            // Original format validation
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
        } else if (definition.behavior) {
            // New format validation - behavior-based effects
            // Minimal validation - we'll normalize during processing
            if (typeof definition.behavior !== 'object') {
                console.debug(`[StatusEffectDefinitionLoader] Invalid behavior property for effect: ${definition.id}`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Setup fallback status effect definitions if loading fails
     * Provides a comprehensive set of default status effects that
     * cover all common game scenarios.
     * @returns {boolean} - Success status
     */
    setupFallbackDefinitions() {
        console.log('[StatusEffectDefinitionLoader] Setting up fallback definitions');
        
        // Clear existing definitions to ensure we don't have duplicates
        this.effectDefinitions.clear();
        
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
        
        return true; // Indicate successful setup
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