/**
 * BattleSoundManager - Core battle audio management system
 * Uses the 4-tier hierarchical resolution system for battlefield sound effects
 */
export class BattleSoundManager {
    constructor(scene) {
        this.scene = scene;
        this.audioContext = scene.sound;
        this.loadedSounds = new Map(); // Maps sound keys to loaded audio objects
        
        // Volume settings by category - can be adjusted for user preferences
        this.volumeSettings = {
            master: 0.8,
            autoAttack: 0.9,
            abilities: 1.0,
            reactions: 0.7,
            ambient: 0.6
        };
        
        // Debug mode for testing
        this.debugMode = false;
        
        console.log('[BattleSoundManager] Initialized sound manager for battle scene');
    }
    
    /**
     * Get the appropriate auto-attack sound for a character using 4-tier resolution
     * @param {Object} character - Complete character object
     * @param {string} event - Sound event type ('impact', 'release', 'movement')
     * @returns {Object|null} Sound result object with fullPath property, or null if not found
     */
    getAutoAttackSound(character, event) {
        try {
            // Get character's sound profile from the data files (they use 4-tier resolution)
            // This will be imported from AbilityAnimationConfig when that integration is complete
            const characterKey = this.getCharacterSoundProfile(character.name);
            
            // Use 4-tier resolution to find the appropriate sound
            const soundResult = this.resolve4TierSound({
                type: 'autoAttack',
                characterKey: characterKey,
                autoAttackType: character.autoAttackType,
                event: event
            });
            
            if (this.debugMode && soundResult) {
                console.log(`[BattleSoundManager] Resolved sound for ${character.name} ${event}:`, soundResult.fullPath);
            }
            
            return soundResult;
            
        } catch (error) {
            console.error(`[BattleSoundManager] Error resolving auto-attack sound for ${character.name}:`, error);
            return null;
        }
    }
    
    /**
     * Get character's sound profile mapping (temporary implementation until data integration)
     * @param {string} characterName - Name of the character
     * @returns {string|null} Path-based character key or null for defaults
     */
    getCharacterSoundProfile(characterName) {
        // TODO: This will eventually be imported from AbilityAnimationConfig.characterSoundProfiles
        // For now, using hardcoded mapping
        const profileMapping = {
            // Genre-specific mappings - characters sharing thematic sounds
            'drakarion': 'genre_specific/sword_melee_genre',
            'caste': 'genre_specific/sword_melee_genre', 
            'vaelgor': 'genre_specific/sword_melee_genre',
            
            // Character-specific mappings - truly unique sounds
            'sylvanna': 'character_specific/sylvanna',
            
            // Default fallbacks - use generic sounds
            'lumina': null,
            'zephyr': null
        };
        
        return profileMapping[characterName.toLowerCase()] || null;
    }
    
    /**
     * 4-tier sound resolution implementation
     * @param {Object} params - Resolution parameters
     * @returns {Object|null} Sound result with fullPath or null
     */
    resolve4TierSound(params) {
        const { type, characterKey, autoAttackType, event } = params;
        
        try {
            // Tier 1: Ability-specific (not implemented for auto-attacks, would be for special abilities)
            // Skip for auto-attacks
            
            // Tier 2: Character-specific resolution  
            if (characterKey && characterKey.startsWith('character_specific/')) {
                const characterResult = this.resolveCharacterSpecificSound(characterKey, autoAttackType, event);
                if (characterResult) return characterResult;
            }
            
            // Tier 3: Genre-specific resolution
            if (characterKey && characterKey.startsWith('genre_specific/')) {
                const genreResult = this.resolveGenreSpecificSound(characterKey, autoAttackType, event);
                if (genreResult) return genreResult;
            }
            
            // Tier 4: Default fallback
            const defaultResult = this.resolveDefaultSound(autoAttackType, event);
            if (defaultResult) return defaultResult;
            
            console.warn(`[BattleSoundManager] No sound found for ${type} with characterKey: ${characterKey}, autoAttackType: ${autoAttackType}, event: ${event}`);
            return null;
            
        } catch (error) {
            console.error('[BattleSoundManager] Error in 4-tier sound resolution:', error);
            return null;
        }
    }
    
    /**
     * Resolve character-specific sounds (Tier 2)
     * @param {string} characterKey - Character key like 'character_specific/sylvanna'
     * @param {string} autoAttackType - 'melee' or 'ranged'
     * @param {string} event - 'impact', 'release', etc.
     * @returns {Object|null} Sound result or null
     */
    resolveCharacterSpecificSound(characterKey, autoAttackType, event) {
        try {
            // Extract character name from key
            const characterName = characterKey.split('/')[1];
            
            if (characterName === 'sylvanna' && autoAttackType === 'ranged' && event === 'release') {
                // Sylvanna has unique bow sounds
                const bowSounds = ['Bow Attack 1.wav', 'Bow Attack 2.wav'];
                const randomSound = bowSounds[Math.floor(Math.random() * bowSounds.length)];
                
                return {
                    fullPath: `character_specific/Sylvanna/${randomSound}`,
                    source: 'character_specific',
                    characterName: characterName
                };
            }
            
            return null;
        } catch (error) {
            console.error(`[BattleSoundManager] Error resolving character-specific sound:`, error);
            return null;
        }
    }
    
    /**
     * Resolve genre-specific sounds (Tier 3)
     * @param {string} characterKey - Genre key like 'genre_specific/sword_melee_genre' 
     * @param {string} autoAttackType - 'melee' or 'ranged'
     * @param {string} event - 'impact', 'release', etc.
     * @returns {Object|null} Sound result or null
     */
    resolveGenreSpecificSound(characterKey, autoAttackType, event) {
        try {
            // Extract genre name from key
            const genreName = characterKey.split('/')[1];
            
            if (genreName === 'sword_melee_genre' && autoAttackType === 'melee' && event === 'impact') {
                // Sword melee genre has multiple attack sounds - select randomly
                const swordSounds = ['Sword Attack 1.wav', 'Sword Attack 2.wav', 'Sword Attack 3.wav'];
                const randomSound = swordSounds[Math.floor(Math.random() * swordSounds.length)];
                
                return {
                    fullPath: `genre_specific/Sword Melee Genre/${randomSound}`,
                    source: 'genre_specific',
                    genreName: genreName
                };
            }
            
            return null;
        } catch (error) {
            console.error(`[BattleSoundManager] Error resolving genre-specific sound:`, error);
            return null;
        }
    }
    
    /**
     * Resolve default fallback sounds (Tier 4)
     * @param {string} autoAttackType - 'melee' or 'ranged'
     * @param {string} event - 'impact', 'release', etc.
     * @returns {Object|null} Sound result or null
     */
    resolveDefaultSound(autoAttackType, event) {
        try {
            // Default sound mappings
            const defaultMappings = {
                melee: {
                    impact: 'defaults/auto_attacks/melee_impact/punch flesh 13.wav'
                },
                ranged: {
                    release: 'defaults/auto_attacks/ranged_release/woosh_default.wav'
                }
            };
            
            const soundPath = defaultMappings[autoAttackType]?.[event];
            if (soundPath) {
                return {
                    fullPath: soundPath,
                    source: 'defaults',
                    autoAttackType: autoAttackType,
                    event: event
                };
            }
            
            return null;
        } catch (error) {
            console.error(`[BattleSoundManager] Error resolving default sound:`, error);
            return null;
        }
    }
    
    /**
     * Play a resolved sound with proper volume and category settings
     * @param {Object} soundResult - Result from getAutoAttackSound()
     * @param {string} category - Volume category ('autoAttack', 'abilities', etc.)
     * @returns {boolean} Success state
     */
    playSound(soundResult, category = 'autoAttack') {
        try {
            if (!soundResult || !soundResult.fullPath) {
                console.warn('[BattleSoundManager] Cannot play sound - no valid sound result provided');
                return false;
            }
            
            // Calculate final volume
            const categoryVolume = this.volumeSettings[category] || 1.0;
            const finalVolume = this.volumeSettings.master * categoryVolume;
            
            // Generate a key for the sound
            const soundKey = this.generateSoundKey(soundResult.fullPath);
            
            // Check if sound is already loaded
            if (this.loadedSounds.has(soundKey)) {
                const sound = this.loadedSounds.get(soundKey);
                sound.play({ volume: finalVolume });
                
                if (this.debugMode) {
                    console.log(`[BattleSoundManager] Playing cached sound: ${soundResult.fullPath} at volume ${finalVolume}`);
                }
                return true;
            }
            
            // Load and play the sound
            const fullAssetPath = `assets/audio/InCombat_Sounds/${soundResult.fullPath}`;
            const sound = this.scene.sound.add(soundKey, { 
                volume: finalVolume,
                // Add sound pooling for performance
                pool: 2
            });
            
            // Store in cache for future use
            this.loadedSounds.set(soundKey, sound);
            
            // Play the sound
            sound.play();
            
            if (this.debugMode) {
                console.log(`[BattleSoundManager] Playing new sound: ${soundResult.fullPath} at volume ${finalVolume}`);
            }
            
            return true;
            
        } catch (error) {
            console.error('[BattleSoundManager] Error playing sound:', error);
            return false;
        }
    }
    
    /**
     * Generate a unique key for sound caching
     * @param {string} soundPath - Path to the sound file
     * @returns {string} Unique key for caching
     */
    generateSoundKey(soundPath) {
        // Convert path to a valid cache key
        return soundPath.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    }
    
    /**
     * Set volume for a specific category
     * @param {string} category - Volume category
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setVolume(category, volume) {
        if (this.volumeSettings.hasOwnProperty(category)) {
            this.volumeSettings[category] = Math.max(0, Math.min(1, volume));
            console.log(`[BattleSoundManager] Set ${category} volume to ${this.volumeSettings[category]}`);
        } else {
            console.warn(`[BattleSoundManager] Unknown volume category: ${category}`);
        }
    }
    
    /**
     * Get current volume for a category
     * @param {string} category - Volume category
     * @returns {number} Current volume level
     */
    getVolume(category) {
        return this.volumeSettings[category] || 1.0;
    }
    
    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`[BattleSoundManager] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Clean up resources and stop all sounds
     */
    destroy() {
        try {
            // Stop all cached sounds
            this.loadedSounds.forEach((sound, key) => {
                if (sound && sound.destroy) {
                    sound.destroy();
                }
            });
            
            // Clear cache
            this.loadedSounds.clear();
            
            console.log('[BattleSoundManager] Sound manager destroyed and resources cleaned up');
        } catch (error) {
            console.error('[BattleSoundManager] Error during cleanup:', error);
        }
    }
}
