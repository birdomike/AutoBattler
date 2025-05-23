/**
 * SoundEventHandler.js
 * 
 * Handles mapping of battle events to appropriate sound effects using the 4-tier 
 * hierarchical sound resolution system. Manages timing delays for synchronized 
 * audio-visual feedback during auto-attacks and abilities.
 * 
 * Part of Phase 1 implementation - AUTO-ATTACK SOUND SYSTEM
 */

export class SoundEventHandler {
    constructor(battleSoundManager) {
        this.soundManager = battleSoundManager;
        this.delayedSounds = new Map(); // For managing scheduled sounds with timeouts
        
        // Import AudioAssetMappings dynamically to avoid circular dependencies
        this.audioMappings = null;
        this.loadAudioMappings();
        
        // Timing configuration for different attack types
        this.timingConfig = {
            melee: {
                // Optional movement sound at action start
                movement: { delay: 0 },
                // Impact sound delayed to sync with animation
                impact: { delay: 0 }
            },
            ranged: {
                // Immediate release sound when projectile fires
                release: { delay: 0 },
                // Impact sound when projectile hits (handled by projectile system in future phases)
                impact: { delay: 800 }
            }
        };
        
        // Debug logging
        this.debugMode = true; // Enable for troubleshooting
        
        // Add audio context monitoring for debugging
        if (this.scene && this.scene.sound && this.scene.sound.context) {
            const audioContext = this.scene.sound.context;
            console.log(`[SoundEventHandler] 🎵 AUDIO CONTEXT INITIAL STATE: ${audioContext.state}`);
            
            // Monitor audio context state changes
            audioContext.addEventListener('statechange', () => {
                console.log(`[SoundEventHandler] 🔄 AUDIO CONTEXT STATE CHANGED: ${audioContext.state} at ${new Date().toLocaleTimeString()}`);
                if (audioContext.state === 'suspended') {
                    console.warn('[SoundEventHandler] ⚠️ AUDIO CONTEXT SUSPENDED - This likely explains why sounds stop working!');
                }
            });
        }
        
        console.log('[SoundEventHandler] Initialized sound event handler');
    }
    
    /**
     * Dynamically load AudioAssetMappings to avoid circular dependencies
     * @private
     */
    async loadAudioMappings() {
        try {
            const module = await import('../../data/AudioAssetMappings.js');
            this.audioMappings = module.AudioAssetMappings;
            console.log('[SoundEventHandler] AudioAssetMappings loaded successfully');
        } catch (error) {
            console.error('[SoundEventHandler] Failed to load AudioAssetMappings:', error);
            // Fallback to global if available
            if (window.AudioAssetMappings) {
                this.audioMappings = window.AudioAssetMappings;
                console.log('[SoundEventHandler] Using global AudioAssetMappings as fallback');
            }
        }
    }
    
    /**
     * Main entry point for handling battle events
     * @param {string} eventType - Type of battle event
     * @param {Object} eventData - Event data payload
     * @returns {boolean} Success state
     */
    handleBattleEvent(eventType, eventData) {
        try {
            switch (eventType) {
                case 'CHARACTER_ACTION':
                    return this.handleCharacterAction(eventData);
                
                // Future implementations for Phase 2+
                case 'CHARACTER_DAMAGED':
                    return this.handleCharacterDamaged(eventData);
                    
                case 'CHARACTER_HEALED':
                    return this.handleCharacterHealed(eventData);
                    
                default:
                    if (this.debugMode) {
                        console.log(`[SoundEventHandler] Unhandled event type: ${eventType}`);
                    }
                    return false;
            }
        } catch (error) {
            console.error(`[SoundEventHandler] Error handling event ${eventType}:`, error);
            return false;
        }
    }
    
    /**
     * Handle CHARACTER_ACTION events - primary focus for Phase 1
     * @param {Object} eventData - Contains character and action objects
     * @returns {boolean} Success state
     */
    handleCharacterAction(eventData) {
        try {
            const { character, action } = eventData;
            
            if (!character || !action) {
                console.warn('[SoundEventHandler] Invalid CHARACTER_ACTION event data:', eventData);
                return false;
            }
            
            if (this.debugMode) {
                console.log(`[SoundEventHandler] Processing CHARACTER_ACTION for ${character.name}: ${action.type}`);
            }
            
            // Handle auto-attack sounds (primary Phase 1 focus)
            if (action.type === 'autoAttack') {
                return this.handleAutoAttackAction(character);
            }
            
            // Handle ability sounds (basic implementation for Phase 1)
            if (action.type === 'ability') {
                return this.handleAbilityAction(character, action);
            }
            
            return true;
        } catch (error) {
            console.error('[SoundEventHandler] Error handling CHARACTER_ACTION:', error);
            return false;
        }
    }
    
    /**
     * Handle auto-attack sound logic with appropriate timing
     * @param {Object} character - Character performing the auto-attack
     * @returns {boolean} Success state
     */
    handleAutoAttackAction(character) {
        try {
            const attackType = character.autoAttackType;
            
            // ENHANCED DEBUG: Character data validation
            console.log(`[SoundEventHandler] 🎭 PROCESSING AUTO-ATTACK:`, {
                character: character.name,
                autoAttackType: attackType,
                hasAutoAttackType: !!attackType,
                characterData: {
                    name: character.name,
                    type: character.type,
                    role: character.role,
                    autoAttackType: character.autoAttackType
                }
            });
            
            if (!attackType) {
                console.error(`[SoundEventHandler] ❌ MISSING autoAttackType for ${character.name}! This character will have no sounds.`);
                return false;
            }
            
            if (!this.timingConfig[attackType]) {
                console.warn(`[SoundEventHandler] Unknown auto-attack type: ${attackType} for character ${character.name}`);
                return false;
            }
            
            const timing = this.timingConfig[attackType];
            
            if (attackType === 'melee') {
                // Melee: Optional movement sound + delayed impact sound
                
                // Optional: Play movement sound at action start
                // (Commented out for Phase 1 - can be enabled when movement sounds are desired)
                // this.playCharacterSound(character, 'movement');
                
                // Schedule delayed impact sound to sync with animation
                this.scheduleDelayedSound(character, 'impact', timing.impact.delay);
                
                if (this.debugMode) {
                    console.log(`[SoundEventHandler] 🛡️ MELEE: Scheduled impact for ${character.name} with ${timing.impact.delay}ms delay`);
                }
                
            } else if (attackType === 'ranged') {
                // Ranged: Immediate release sound when projectile fires
                const success = this.playCharacterSound(character, 'release');
                
                if (this.debugMode) {
                    console.log(`[SoundEventHandler] 🏹 RANGED: ${success ? 'SUCCESS' : 'FAILED'} playing release for ${character.name}`);
                }
            }
            
            return true;
        } catch (error) {
            console.error(`[SoundEventHandler] Error handling auto-attack for ${character.name}:`, error);
            return false;
        }
    }
    
    /**
     * Handle ability sound logic
     * @param {Object} character - Character using the ability
     * @param {Object} action - Action object containing ability details
     * @returns {boolean} Success state
     */
    handleAbilityAction(character, action) {
        console.log('[SoundEventHandler] === ABILITY ACTION DEBUG START ===');
        
        try {
            // Get ability ID from action data - use the correct property for sound lookup
            const actualAbilityId = action.abilityId || action.id; // This should give us 'zephyr_wind_slash'
            const eventCue = 'cast'; // Default to 'cast' for now
            
            // Enhanced logging for resolution debugging
            console.log(`[SoundEventHandler] 🌟 PROCESSING ABILITY:`);
            console.log(`  Character: ${character.name}`);
            console.log(`  Action object:`, action);
            console.log(`  Extracted abilityId for sound lookup: '${actualAbilityId}'`);
            console.log(`  Event cue to use: '${eventCue}'`);
            
            if (!actualAbilityId) {
                console.error(`[SoundEventHandler] ❌ No ability ID found in action:`, action);
                console.log('[SoundEventHandler] === ABILITY ACTION DEBUG END ===');
                return false;
            }
            
            // Check AudioAssetMappings availability
            let soundToPlay = null;
            if (this.audioMappings && this.audioMappings.helpers) {
                console.log('[SoundEventHandler] ✅ AudioAssetMappings is available');
                
                // Try Tier 1 resolution first
                soundToPlay = this.audioMappings.helpers.getAbilitySound(actualAbilityId, eventCue);
                console.log('[SoundEventHandler] Result from AudioAssetMappings.helpers.getAbilitySound():', soundToPlay);
            } else {
                console.error('[SoundEventHandler] ❌ AudioAssetMappings or its helpers are not available!');
                console.log('[SoundEventHandler] === ABILITY ACTION DEBUG END ===');
                return false;
            }
            
            // Fallback to Tier 4 default if Tier 1 not found
            if (!soundToPlay && this.audioMappings && this.audioMappings.helpers) {
                console.log(`[SoundEventHandler] Tier 1 sound for '${actualAbilityId}' ('${eventCue}') not found. Attempting Tier 4 default.`);
                
                // For now, let's manually get the default ability sound since getDefaultAbilitySound might not exist yet
                soundToPlay = this.audioMappings.helpers.resolveSound({
                    type: 'ability',
                    event: eventCue,
                    abilityId: null // This will force it to use defaults
                });
                console.log('[SoundEventHandler] Result from Tier 4 fallback:', soundToPlay);
            }
            
            if (soundToPlay && (soundToPlay.fullPath || soundToPlay.path)) {
                // TODO: Implement timing retrieval here later
                const delay = 0; // Placeholder for now
                
                // Generate expected cache key for verification
                const soundPath = soundToPlay.fullPath || soundToPlay.path;
                const expectedCacheKey = soundPath.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                console.log(`[SoundEventHandler] 🔑 Expected cache key: '${expectedCacheKey}'`);
                
                if (delay > 0) {
                    this.scene.time.delayedCall(delay, () => {
                        const success = this.soundManager.playSound(soundToPlay, 'abilities');
                        console.log(`[SoundEventHandler] ${success ? '✅' : '❌'} Delayed play result for ${actualAbilityId}`);
                    });
                } else {
                    const success = this.soundManager.playSound(soundToPlay, 'abilities');
                    console.log(`[SoundEventHandler] ${success ? '✅' : '❌'} Immediate play result for ${actualAbilityId}`);
                }
                
                console.log(`[SoundEventHandler] ✅ Attempting to play sound for ${actualAbilityId} ('${eventCue}'): ${soundPath}`);
                console.log('[SoundEventHandler] === ABILITY ACTION DEBUG END ===');
                return true;
            } else {
                console.warn(`[SoundEventHandler] ❌ No sound found (Tier 1 or Tier 4) for ability: '${actualAbilityId}', event: '${eventCue}'.`);
                if (soundToPlay) {
                    console.warn('[SoundEventHandler] Invalid soundToPlay object:', soundToPlay);
                }
                console.log('[SoundEventHandler] === ABILITY ACTION DEBUG END ===');
                return false;
            }
        } catch (error) {
            console.error(`[SoundEventHandler] ❌ Error handling ability action:`, error);
            console.log('[SoundEventHandler] === ABILITY ACTION DEBUG END ===');
            return false;
        }
    }
    
    /**
     * Handle CHARACTER_DAMAGED events (placeholder for future phases)
     * @param {Object} eventData - Damage event data
     * @returns {boolean} Success state
     */
    handleCharacterDamaged(eventData) {
        // Placeholder for Phase 2+ implementation
        // Will handle impact sounds, pain reactions, etc.
        if (this.debugMode) {
            console.log('[SoundEventHandler] CHARACTER_DAMAGED handling not yet implemented');
        }
        return true;
    }
    
    /**
     * Handle CHARACTER_HEALED events (placeholder for future phases)  
     * @param {Object} eventData - Healing event data
     * @returns {boolean} Success state
     */
    handleCharacterHealed(eventData) {
        // Placeholder for Phase 2+ implementation
        // Will handle healing chimes, restoration sounds, etc.
        if (this.debugMode) {
            console.log('[SoundEventHandler] CHARACTER_HEALED handling not yet implemented');
        }
        return true;
    }
    
    /**
     * Play a character sound immediately
     * @param {Object} character - Character object
     * @param {string} event - Sound event type ('impact', 'release', 'movement', etc.)
     * @returns {boolean} Success state
     */
    playCharacterSound(character, event) {
        try {
            const soundResult = this.soundManager.getAutoAttackSound(character, event);
            
            if (soundResult) {
                const success = this.soundManager.playSound(soundResult, 'autoAttack');
                
                if (this.debugMode && success) {
                    console.log(`[SoundEventHandler] Played sound for ${character.name} ${event}: ${soundResult.fullPath}`);
                }
                
                return success;
            } else {
                if (this.debugMode) {
                    console.warn(`[SoundEventHandler] No sound resolved for ${character.name} ${event}`);
                }
                return false;
            }
        } catch (error) {
            console.error(`[SoundEventHandler] Error playing sound for ${character.name} ${event}:`, error);
            return false;
        }
    }
    
    /**
     * Schedule a delayed sound to be played after a specified timeout
     * @param {Object} character - Character object
     * @param {string} event - Sound event type
     * @param {number} delay - Delay in milliseconds
     * @returns {boolean} Success state
     */
    scheduleDelayedSound(character, event, delay) {
        try {
            // Use character's uniqueId if available, otherwise fall back to name
            const characterKey = character.uniqueId || character.name;
            
            // Clear any existing timeout for this character  
            if (this.delayedSounds.has(characterKey)) {
                clearTimeout(this.delayedSounds.get(characterKey));
            }
            
            // Schedule the new sound with audio context resumption
            const timeoutId = setTimeout(async () => {
                try {
                    // CRITICAL FIX: Resume audio context if suspended before playing delayed sound
                    if (this.soundManager.scene.sound.context && 
                        this.soundManager.scene.sound.context.state === 'suspended') {
                        console.log(`[SoundEventHandler] ⚡ Resuming suspended audio context for delayed ${event} sound (${character.name})`);
                        await this.soundManager.scene.sound.context.resume();
                    }
                    
                    // Play the scheduled sound
                    this.playCharacterSound(character, event);
                } catch (error) {
                    console.error(`[SoundEventHandler] Error playing delayed sound for ${character.name}:`, error);
                } finally {
                    // Always clean up the timeout reference
                    this.delayedSounds.delete(characterKey);
                }
            }, delay);
            
            // Store the timeout ID for potential cancellation
            this.delayedSounds.set(characterKey, timeoutId);
            
            if (this.debugMode) {
                console.log(`[SoundEventHandler] Scheduled ${event} sound for ${character.name} in ${delay}ms`);
            }
            
            return true;
        } catch (error) {
            console.error(`[SoundEventHandler] Error scheduling delayed sound for ${character.name}:`, error);
            return false;
        }
    }
    
    /**
     * Cancel a scheduled sound for a specific character
     * @param {Object} character - Character object
     * @returns {boolean} Whether a sound was actually cancelled
     */
    cancelScheduledSound(character) {
        try {
            const characterKey = character.uniqueId || character.name;
            
            if (this.delayedSounds.has(characterKey)) {
                clearTimeout(this.delayedSounds.get(characterKey));
                this.delayedSounds.delete(characterKey);
                
                if (this.debugMode) {
                    console.log(`[SoundEventHandler] Cancelled scheduled sound for ${character.name}`);
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`[SoundEventHandler] Error cancelling scheduled sound for ${character.name}:`, error);
            return false;
        }
    }
    
    /**
     * Update timing configuration for attack types
     * @param {string} attackType - 'melee' or 'ranged'
     * @param {string} event - Event type ('impact', 'release', etc.)
     * @param {number} delay - New delay in milliseconds
     */
    setTiming(attackType, event, delay) {
        try {
            if (this.timingConfig[attackType] && this.timingConfig[attackType][event]) {
                this.timingConfig[attackType][event].delay = delay;
                console.log(`[SoundEventHandler] Updated ${attackType} ${event} timing to ${delay}ms`);
            } else {
                console.warn(`[SoundEventHandler] Unknown timing configuration: ${attackType}.${event}`);
            }
        } catch (error) {
            console.error(`[SoundEventHandler] Error setting timing:`, error);
        }
    }
    
    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`[SoundEventHandler] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Get current timing configuration (for debugging/testing)
     * @returns {Object} Current timing configuration
     */
    getTimingConfig() {
        return JSON.parse(JSON.stringify(this.timingConfig));
    }
    
    /**
     * Clean up resources and cancel all pending sounds
     */
    destroy() {
        try {
            // Cancel all pending timeouts
            this.delayedSounds.forEach((timeoutId, characterKey) => {
                clearTimeout(timeoutId);
                if (this.debugMode) {
                    console.log(`[SoundEventHandler] Cancelled pending sound for ${characterKey}`);
                }
            });
            
            // Clear the map
            this.delayedSounds.clear();
            
            console.log('[SoundEventHandler] Sound event handler destroyed and resources cleaned up');
        } catch (error) {
            console.error('[SoundEventHandler] Error during cleanup:', error);
        }
    }
}
