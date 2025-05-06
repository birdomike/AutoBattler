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

    addStatusEffect(character, effectId, source, duration, stacks = 1) {
        if (!character || !effectId) {
            console.warn('[StatusEffectManager] Invalid parameters to addStatusEffect');
            return false;
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
                source: source ? source.name : 'unknown',
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
                // Use the correct method name 'dispatchEvent' instead of 'dispatch'
                battleBridge.dispatchEvent('STATUS_EFFECTS_CHANGED', {
                    character: character,
                    effects: this.getActiveEffects(character)
                });
            } else {
                // Fallback 1: Try through BattleManager if that's the pattern used elsewhere
                if (this.battleManager && this.battleManager.dispatchUIEvent) {
                    this.battleManager.dispatchUIEvent('STATUS_EFFECTS_CHANGED', {
                        character: character,
                        effects: this.getActiveEffects(character)
                    });
                } else {
                    console.log("[StatusEffectManager] Status effects changed but event dispatcher not available");
                }
            }
        } catch (err) {
            console.error('[StatusEffectManager] Error dispatching STATUS_EFFECTS_CHANGED event:', err);
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
            
            // Use dealDamage method from BattleManager to apply damage properly
            this.battleManager.dealDamage(null, character, damage, {
                isTrueDamage: true, // Bypass defense
                source: 'status',
                statusName: definition.name
            });
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
                this.battleManager.applyHealing(null, character, healing, {
                    source: 'status',
                    statusName: definition.name
                });
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
