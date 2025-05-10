class StatusEffectManager {
    constructor(battleManager, definitionLoader) {
        this.battleManager = battleManager;
        this.definitionLoader = definitionLoader;
        console.log('[StatusEffectManager] Initialized with definition loader');
    }

    processStatusEffects(character) {
        if (!character || !character.statusEffects || !Array.isArray(character.statusEffects)) {
            return; // Nothing to process
        }

        // Track effects to remove after processing
        const effectsToRemove = [];
        
        // Process each status effect
        character.statusEffects.forEach(effect => {
            try {
                // Get definition for this effect
                const definition = this.definitionLoader.getDefinition(effect.id);
                if (!definition) return; // Skip if definition not found
                
                // Skip processing if character is defeated (unless it's a revival effect)
                if (character.defeated && definition.effectType !== 'revival') {
                    return;
                }
                
                // Process based on effect type
                switch (definition.effectType) {
                    case 'damage':
                        this._processDamageEffect(character, effect, definition);
                        break;
                    case 'healing':
                        this._processHealingEffect(character, effect, definition);
                        break;
                    case 'statModifier':
                        // Stat modifiers are applied when added and removed when expired
                        // No per-turn processing needed
                        break;
                    case 'shield':
                        // Shields are handled during damage calculation
                        // No per-turn processing needed
                        break;
                    case 'control':
                        // Control effects are checked during action selection
                        // No per-turn processing needed
                        break;
                }
                
                // Decrease duration
                if (effect.duration > 0) { // Skip permanent effects (-1)
                    effect.duration--;
                    
                    // Mark for removal if duration reached 0
                    if (effect.duration <= 0) {
                        effectsToRemove.push(effect.id);
                    }
                }
            } catch (err) {
                console.error(`[StatusEffectManager] Error processing effect ${effect.id}:`, err);
            }
        });
        
        // Remove expired effects
        effectsToRemove.forEach(effectId => {
            this.removeStatusEffect(character, effectId);
        });
        
        // Update UI
        this.updateStatusIcons(character);
    }

    /**
     * Add a status effect to a character
     * @param {Object} character - The character to apply the effect to
     * @param {string} effectId - The ID of the effect to apply
     * @param {Object|null} source - The character causing the effect (or null if no specific source)
     * @param {number} duration - How many turns the effect lasts
     * @param {number} stacks - Number of stacks to apply (for stackable effects)
     * @returns {boolean} - Whether the effect was successfully applied
     */
    addStatusEffect(character, effectId, source, duration, stacks = 1) {
        // Parameter validation and position checking
        if (!character || !effectId) {
            console.warn('[StatusEffectManager] Invalid parameters to addStatusEffect: missing character or effectId');
            return false;
        }
        
        // PARAMETER VALIDATION: Check for potential parameter misalignment
        if (typeof source === 'number' && (duration === undefined || typeof duration === 'object')) {
            console.warn(`[StatusEffectManager] POTENTIAL PARAMETER MISALIGNMENT in addStatusEffect call for '${effectId}'`);
            console.warn(`[StatusEffectManager] The 'source' parameter appears to be a number (${source}), which might be duration mistakenly passed as source.`);
            console.warn(`[StatusEffectManager] Correct parameter order: addStatusEffect(character, effectId, source, duration, stacks)`);
            
            // HOTFIX: Attempt to fix parameter order if it appears to be misaligned
            // If source is a number and duration is undefined or an object, assume source was meant to be duration
            if (duration === undefined) {
                duration = source;
                source = null;
                console.warn(`[StatusEffectManager] Auto-corrected parameters: using ${duration} as duration and null as source`);
            }
        }
        
        // HOTFIX: Ensure duration is always a number to prevent circular references
        if (typeof duration !== 'number') {
            console.error(`[StatusEffectManager] Invalid duration parameter (${typeof duration}) in addStatusEffect for '${effectId}'`);
            // Get definition to use its default duration
            const definition = this.definitionLoader.getDefinition(effectId);
            // Use definition's duration, or a fallback value of 3
            duration = (definition && typeof definition.duration === 'number') ? definition.duration : 3;
            console.log(`[StatusEffectManager] Using default duration: ${duration}`);
        }
        
        // Ensure character has statusEffects array
        if (!character.statusEffects) {
            character.statusEffects = [];
        }
        
        // Get definition for this effect
        const definition = this.definitionLoader.getDefinition(effectId);
        if (!definition) {
            console.warn(`[StatusEffectManager] Cannot apply unknown effect: ${effectId}`);
            return false;
        }
        
        // Check for existing effect
        const existingEffect = character.statusEffects.find(e => e.id === effectId);
        
        if (existingEffect) {
            // Effect already exists - handle based on stacking rules
            if (definition.stackable) {
                // Increase stacks (up to max)
                const newStacks = Math.min(
                    (existingEffect.stacks || 1) + stacks, 
                    definition.maxStacks || 99
                );
                existingEffect.stacks = newStacks;
                
                // Reset duration if the new duration is longer
                if (duration > existingEffect.duration) {
                    existingEffect.duration = duration;
                }
                
                // Log stacking behavior
                this.battleManager.logMessage(
                    `${character.name} (${character.team === 'player' ? 'ally' : 'enemy'}) now has ${newStacks} stacks of ${definition.name}!`,
                    'status'
                );
            } else {
                // Non-stacking - just refresh duration
                existingEffect.duration = duration;
                
                // Log refresh
                this.battleManager.logMessage(
                    `${definition.name} refreshed on ${character.name} (${character.team === 'player' ? 'ally' : 'enemy'})!`,
                    'status'
                );
            }
        } else {
            // New effect - create and add
            const newEffect = {
                id: effectId,
                duration: duration,
                sourceId: source ? source.uniqueId : null, // CORRECTED: Store source uniqueId instead of source object
                stacks: definition.stackable ? stacks : 1
            };
            
            character.statusEffects.push(newEffect);
            
            // Apply immediate effects for certain types
            if (definition.effectType === 'statModifier') {
                this._applyStatModifier(character, definition, newEffect.stacks);
            }
            
            // Log new effect
            this.battleManager.logMessage(
                `${character.name} (${character.team === 'player' ? 'ally' : 'enemy'}) is affected by ${definition.name}!`,
                'status'
            );
        }
        
        // MODIFIED v0.6.3.32_StatusDefinitionPropagationFix: Dispatch STATUS_EFFECT_APPLIED event with full definition
        // The existing or newly created effect has the correct stacks and sourceId
        const effectToUse = existingEffect || newEffect;
        this.dispatchStatusEffectApplied(character, effectId, effectToUse.duration, definition, effectToUse.stacks || 1, source);
        
        // Dispatch event to update UI
        this.updateStatusIcons(character);
        
        return true;
    }

    removeStatusEffect(character, effectId) {
        if (!character || !character.statusEffects || !effectId) {
            return false;
        }
        
        // Find the effect index
        const effectIndex = character.statusEffects.findIndex(e => e.id === effectId);
        if (effectIndex === -1) {
            return false; // Effect not found
        }
        
        // Get the effect
        const effect = character.statusEffects[effectIndex];
        
        // Get definition for this effect
        const definition = this.definitionLoader.getDefinition(effectId);
        if (!definition) {
            // Just remove it if we can't find the definition
            character.statusEffects.splice(effectIndex, 1);
            return true;
        }
        
        // Handle cleanup for certain effect types
        if (definition.effectType === 'statModifier') {
            this._removeStatModifier(character, definition, effect.stacks);
        }
        
        // Remove the effect
        character.statusEffects.splice(effectIndex, 1);
        
        // Log removal if not defeated
        if (!character.defeated) {
            this.battleManager.logMessage(
                `${definition.name} has worn off from ${character.name} (${character.team === 'player' ? 'ally' : 'enemy'})!`,
                'status'
            );
        }
        
        // Update UI
        this.updateStatusIcons(character);
        
        return true;
    }

    /**
     * Dispatches a STATUS_EFFECT_APPLIED event with full definition data
     * @param {Object} character - The character the effect is applied to
     * @param {string} statusId - The ID of the status effect
     * @param {number} duration - The duration of the effect
     * @param {Object} definition - The complete status effect definition object
     * @param {number} stacks - Number of stacks of the effect
     * @param {Object} source - The character that caused the effect
     */
    dispatchStatusEffectApplied(character, statusId, duration, definition, stacks = 1, source = null) {
        if (!character || !statusId || !definition) {
            console.warn('[StatusEffectManager] Cannot dispatch STATUS_EFFECT_APPLIED: missing required parameters');
            return;
        }
        
        try {
            // Get bridge instance using correct accessor pattern
            const battleBridge = window.getBattleBridge ? window.getBattleBridge() : window.battleBridge;
            
            if (battleBridge && typeof battleBridge.dispatchEvent === 'function') {
                // Use STATUS_EFFECT_APPLIED event type
                const eventType = battleBridge.eventTypes.STATUS_EFFECT_APPLIED || 'status_effect_applied';
                
                // Dispatch event with full definition included
                battleBridge.dispatchEvent(eventType, {
                    character: character,
                    statusId: statusId,
                    duration: duration,
                    stacks: stacks,
                    source: source,
                    statusDefinition: definition // Include the full definition
                });
                console.log(`[StatusEffectManager] Dispatched STATUS_EFFECT_APPLIED for ${statusId} with full definition`); 
            } else {
                // Fallback: Try through BattleManager if that's the pattern used elsewhere
                if (this.battleManager && this.battleManager.dispatchUIEvent) {
                    // Try to use the constant from BattleBridge if available
                    const eventType = window.battleBridge?.eventTypes?.STATUS_EFFECT_APPLIED || 'status_effect_applied';
                    this.battleManager.dispatchUIEvent(eventType, {
                        character: character,
                        statusId: statusId,
                        duration: duration,
                        stacks: stacks,
                        source: source,
                        statusDefinition: definition // Include the full definition
                    });
                    console.log(`[StatusEffectManager] Dispatched STATUS_EFFECT_APPLIED via battleManager for ${statusId} with full definition`);
                } else if (this.battleManager && this.battleManager.battleEventDispatcher) {
                    // Try using battleEventDispatcher if available
                    this.battleManager.battleEventDispatcher.dispatchStatusEffectAppliedEvent(
                        character, statusId, duration, stacks, definition
                    );
                    console.log(`[StatusEffectManager] Dispatched STATUS_EFFECT_APPLIED via battleEventDispatcher for ${statusId} with full definition`);
                } else {
                    console.warn("[StatusEffectManager] Cannot dispatch STATUS_EFFECT_APPLIED: no event dispatcher available");
                }
            }
        } catch (err) {
            console.error('[StatusEffectManager] Error dispatching STATUS_EFFECT_APPLIED event:', err);
        }
    }
    
    getActiveEffects(character) {
        if (!character || !character.statusEffects) {
            return [];
        }
        
        // Return copy of status effects with enriched data
        return character.statusEffects.map(effect => {
            const definition = this.definitionLoader.getDefinition(effect.id);
            if (!definition) {
                return {
                    ...effect,
                    name: `Unknown Effect (${effect.id})`,
                    description: 'An unknown status effect',
                    iconPath: 'assets/images/icons/status/status-icons/unknown.png',
                    effectType: 'unknown'
                };
            }
            
            return {
                ...effect,
                name: definition.name,
                description: definition.description,
                iconPath: definition.iconPath,
                effectType: definition.effectType
            };
        });
    }

    updateStatusIcons(character) {
        if (!character) return;
        
        // We use the battleBridge to communicate with the UI
        try {
            // Get bridge instance using correct accessor pattern
            const battleBridge = window.getBattleBridge ? window.getBattleBridge() : window.battleBridge;
            
            if (battleBridge && typeof battleBridge.dispatchEvent === 'function') {
                // v0.5.27.4_StatusEffectParameterFix: Use STATUS_EFFECT_UPDATED instead of STATUS_EFFECTS_CHANGED
                // for consistency with BridgeEventFix
                battleBridge.dispatchEvent(battleBridge.eventTypes.STATUS_EFFECT_UPDATED, {
                    character: character,
                    effects: this.getActiveEffects(character)
                });
            } else {
                // Fallback 1: Try through BattleManager if that's the pattern used elsewhere
                if (this.battleManager && this.battleManager.dispatchUIEvent) {
                    // Try to use the constant from BattleBridge if available
                    const eventType = window.battleBridge?.eventTypes?.STATUS_EFFECT_UPDATED || 'status_effect_updated';
                    this.battleManager.dispatchUIEvent(eventType, {
                        character: character,
                        effects: this.getActiveEffects(character)
                    });
                } else {
                    console.log("[StatusEffectManager] Status effects changed but event dispatcher not available");
                }
            }
        } catch (err) {
            console.error('[StatusEffectManager] Error dispatching STATUS_EFFECT_UPDATED event:', err);
        }
    }

    hasEffectType(character, effectType) {
        if (!character || !character.statusEffects) return false;
        
        return character.statusEffects.some(effect => {
            const definition = this.definitionLoader.getDefinition(effect.id);
            return definition && definition.effectType === effectType;
        });
    }

    hasEffect(character, effectId) {
        if (!character || !character.statusEffects) return false;
        return character.statusEffects.some(effect => effect.id === effectId);
    }

    getEffectValue(character, effectId) {
        if (!character || !character.statusEffects) return 0;
        
        const effect = character.statusEffects.find(e => e.id === effectId);
        if (!effect) return 0;
        
        const definition = this.definitionLoader.getDefinition(effectId);
        if (!definition) return 0;
        
        // Return base value * stacks
        return definition.value * (effect.stacks || 1);
    }

    getEffectStacks(character, effectId) {
        if (!character || !character.statusEffects) return 0;
        
        const effect = character.statusEffects.find(e => e.id === effectId);
        if (!effect) return 0;
        
        return effect.stacks || 1;
    }

    // Private helper methods
    _processDamageEffect(character, effect, definition) {
        if (!character || character.defeated) return;
        
        // Calculate damage based on stacks
        const baseDamage = definition.value;
        const stacks = effect.stacks || 1;
        const damage = baseDamage * stacks;
        
        // Apply damage
        if (damage > 0) {
            this.battleManager.logMessage(
                `${character.name} (${character.team === 'player' ? 'ally' : 'enemy'}) takes ${damage} damage from ${definition.name}!`,
                'damage'
            );
            
            // Resolve the source character from sourceId
            // UPDATED in v0.6.0.3: Use BattleUtilities.getCharacterByUniqueId instead of battleManager.getCharacterByUniqueId
            // This aligns with Phase 3 refactoring where utility methods were moved out of BattleManager
            let sourceCharacter = null;
            const sourceIdToFind = effect.sourceId || (effect.source && typeof effect.source === 'object' ? effect.source.uniqueId : null);
            
            if (sourceIdToFind) {
                if (window.BattleUtilities) {
                    sourceCharacter = BattleUtilities.getCharacterByUniqueId(
                        sourceIdToFind,
                        this.battleManager.playerTeam, // Pass playerTeam
                        this.battleManager.enemyTeam  // Pass enemyTeam
                    );
                } else {
                    console.warn("[StatusEffectManager] BattleUtilities not available for getCharacterByUniqueId lookup.");
                    sourceCharacter = null;
                }
            }
            
            // Legacy handling for string name sources (not implemented - old approach not reliable)
            
            // HOTFIX (0.5.27.2_Hotfix8): Use applyDamage instead of dealDamage
            this.battleManager.applyDamage(
                character,         // target
                damage,            // amount
                sourceCharacter,   // source (resolved from sourceId, can be null)
                null,              // ability (null for status effects)
                effect.id || 'status_effect'  // damageType (use effect.id if available)
            );
        }
    }

    _processHealingEffect(character, effect, definition) {
        if (!character) return;
        
        // Calculate healing based on stacks
        const baseHealing = definition.value;
        const stacks = effect.stacks || 1;
        const healing = baseHealing * stacks;
        
        // Apply healing
        if (healing > 0) {
            this.battleManager.logMessage(
                `${character.name} (${character.team === 'player' ? 'ally' : 'enemy'}) restores ${healing} health from ${definition.name}!`,
                'healing'
            );
            
            // Use appropriate method from BattleManager
            if (typeof this.battleManager.applyHealing === 'function') {
                // Resolve the source character from sourceId
                // UPDATED in v0.6.0.3: Use BattleUtilities.getCharacterByUniqueId instead of battleManager.getCharacterByUniqueId
                // This aligns with Phase 3 refactoring where utility methods were moved out of BattleManager
                let sourceCharacter = null;
                const sourceIdToFind = effect.sourceId || (effect.source && typeof effect.source === 'object' ? effect.source.uniqueId : null);
                
                if (sourceIdToFind) {
                    if (window.BattleUtilities) {
                        sourceCharacter = BattleUtilities.getCharacterByUniqueId(
                            sourceIdToFind,
                            this.battleManager.playerTeam, // Pass playerTeam
                            this.battleManager.enemyTeam  // Pass enemyTeam
                        );
                    } else {
                        console.warn("[StatusEffectManager] BattleUtilities not available for getCharacterByUniqueId lookup.");
                        sourceCharacter = null;
                    }
                }
                
                // Legacy handling for string name sources (not implemented - old approach not reliable)

                const finalSourceForApplyHealing = sourceCharacter || character; // Fallback to the target character for self-effects
                
                // HOTFIX (0.5.27.2_Hotfix8): Fix parameter order - character being healed must be first
                this.battleManager.applyHealing(
                    character,       // target (character being healed)
                    healing,         // amount
                    finalSourceForApplyHealing, // source (resolved from sourceId or fallback to self)
                    null,              // ability (null for status effects)
                    definition.name || 'Regeneration'   // healType (use definition.name if available)
                );
            } else {
                // Fallback for older versions
                character.stats.hp = Math.min(
                    character.stats.hp + healing,
                    character.stats.maxHp
                );
                
                // Check if this healing revived the character
                if (character.defeated && character.stats.hp > 0) {
                    character.defeated = false;
                    this.battleManager.logMessage(
                        `${character.name} (${character.team === 'player' ? 'ally' : 'enemy'}) has been revived!`,
                        'revival'
                    );
                }
            }
        }
    }

    _applyStatModifier(character, definition, stacks) {
        if (!character || !definition.stat) return;
        
        // Calculate total modifier
        const totalModifier = definition.value * (stacks || 1);
        
        // Skip if no effect
        if (totalModifier === 0) return;
        
        // Apply the modifier
        // Store original value if not already stored
        if (character.originalStats === undefined) {
            character.originalStats = {};
        }
        
        if (character.originalStats[definition.stat] === undefined) {
            character.originalStats[definition.stat] = character.stats[definition.stat];
        }
        
        // Apply the modifier
        character.stats[definition.stat] += totalModifier;
        
        // Log the change
        const direction = totalModifier > 0 ? 'increased' : 'decreased';
        this.battleManager.logMessage(
            `${character.name}'s ${definition.stat} ${direction} by ${Math.abs(totalModifier)}!`,
            'status'
        );
    }

    _removeStatModifier(character, definition, stacks) {
        if (!character || !definition.stat) return;
        
        // Calculate total modifier
        const totalModifier = definition.value * (stacks || 1);
        
        // Skip if no effect
        if (totalModifier === 0) return;
        
        // Check if we have original stats
        if (character.originalStats && character.originalStats[definition.stat] !== undefined) {
            // Restore original value
            character.stats[definition.stat] = character.originalStats[definition.stat];
            delete character.originalStats[definition.stat];
            
            // Clean up originalStats if empty
            if (Object.keys(character.originalStats).length === 0) {
                delete character.originalStats;
            }
        } else {
            // Fallback: just remove the modifier
            character.stats[definition.stat] -= totalModifier;
        }
    }
}

// Make StatusEffectManager available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.StatusEffectManager = StatusEffectManager;
    console.log("StatusEffectManager class definition loaded and exported to window.StatusEffectManager");
}

// Legacy global assignment for maximum compatibility
window.StatusEffectManager = StatusEffectManager;
