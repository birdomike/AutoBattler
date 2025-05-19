// Import data configuration files
import { AudioAssetMappings } from '../../data/AudioAssetMappings.js';
import { AbilityAnimationConfig } from '../../data/AbilityAnimationConfig.js';

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
        this.debugMode = true; // Enable debug mode by default for troubleshooting
        
        // Audio context suspension handling
        this.audioContextResumed = false;
        this.setupAudioContextHandler();
        
        console.log('[BattleSoundManager] Initialized sound manager for battle scene');
    }
    
    /**
     * Setup audio context resumption on user interaction
     * This handles browser autoplay policy that suspends audio context
     */
    setupAudioContextHandler() {
        const resumeAudioContext = async () => {
            try {
                if (this.scene.sound.context) {
                    if (this.scene.sound.context.state === 'suspended') {
                        await this.scene.sound.context.resume();
                        console.log('[BattleSoundManager] Audio context resumed on user interaction');
                    }
                    this.audioContextResumed = true;
                    
                    // Remove the event listeners once resumed
                    this.scene.input.off('pointerdown', resumeAudioContext);
                    document.removeEventListener('click', resumeAudioContext);
                    document.removeEventListener('keydown', resumeAudioContext);
                }
            } catch (error) {
                console.error('[BattleSoundManager] Error resuming audio context:', error);
            }
        };
        
        // Set up multiple event listeners to catch user interaction
        this.scene.input.on('pointerdown', resumeAudioContext);
        document.addEventListener('click', resumeAudioContext);
        document.addEventListener('keydown', resumeAudioContext);
        
        // Check initial audio context state
        if (this.scene.sound.context) {
            console.log('[BattleSoundManager] Initial audio context state:', this.scene.sound.context.state);
        }
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
     * Get character's sound profile mapping from AbilityAnimationConfig
     * @param {string} characterName - Name of the character
     * @returns {string|null} Path-based character key or null for defaults
     */
    getCharacterSoundProfile(characterName) {
        try {
            // Use the imported AbilityAnimationConfig for character sound profiles
            return AbilityAnimationConfig.characterSoundProfiles[characterName.toLowerCase()] || null;
        } catch (error) {
            console.error(`[BattleSoundManager] Error getting character sound profile for ${characterName}:`, error);
            return null;
        }
    }
    
    /**
     * 4-tier sound resolution implementation using AudioAssetMappings
     * @param {Object} params - Resolution parameters
     * @returns {Object|null} Sound result with fullPath or null
     */
    resolve4TierSound(params) {
        try {
            // Use AudioAssetMappings for the complete 4-tier resolution
            const soundResult = AudioAssetMappings.helpers.resolveSound(params);
            
            if (this.debugMode && soundResult) {
                console.log(`[BattleSoundManager] 4-tier resolution result:`, soundResult);
            }
            
            return soundResult;
        } catch (error) {
            console.error('[BattleSoundManager] Error in 4-tier sound resolution:', error);
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
            
            // Check audio context state
            if (this.scene.sound.context && this.scene.sound.context.state === 'suspended') {
                console.warn('[BattleSoundManager] Audio context is suspended - user interaction required to resume audio');
                return false;
            }
            
            // Calculate final volume
            const categoryVolume = this.volumeSettings[category] || 1.0;
            const finalVolume = this.volumeSettings.master * categoryVolume;
            
            // Generate a key for the sound (AudioAssetMappings includes the base path)
            const soundKey = this.generateSoundKey(soundResult.fullPath);
            
            if (this.debugMode) {
                console.log(`[BattleSoundManager] Attempting to play sound:`, {
                    fullPath: soundResult.fullPath,
                    soundKey: soundKey,
                    finalVolume: finalVolume,
                    category: category,
                    masterVolume: this.volumeSettings.master,
                    categoryVolume: categoryVolume
                });
            }
            
            // Check if sound is already loaded
            if (this.loadedSounds.has(soundKey)) {
                const sound = this.loadedSounds.get(soundKey);
                
                if (this.debugMode) {
                    console.log(`[BattleSoundManager] Using cached sound. Sound state:`, {
                        isPlaying: sound.isPlaying,
                        isPaused: sound.isPaused,
                        volume: sound.volume,
                        duration: sound.duration
                    });
                }
                
                sound.play({ volume: finalVolume });
                
                if (this.debugMode) {
                    console.log(`[BattleSoundManager] ✅ Played cached sound: ${soundResult.fullPath} at volume ${finalVolume}`);
                }
                return true;
            }
            
            // Check if the sound key exists in Phaser's cache
            if (!this.scene.cache.audio.exists(soundKey)) {
                console.error(`[BattleSoundManager] Sound key '${soundKey}' not found in Phaser audio cache!`);
                console.log('[BattleSoundManager] Available audio keys:', this.scene.cache.audio.entries.keys);
                return false;
            }
            
            // The fullPath from AudioAssetMappings already includes the base path
            const sound = this.scene.sound.add(soundKey, { 
                volume: finalVolume,
                // Add sound pooling for performance
                pool: 2
            });
            
            if (this.debugMode) {
                console.log(`[BattleSoundManager] Created new sound object:`, {
                    key: soundKey,
                    sound: sound,
                    soundManager: this.scene.sound,
                    audioContext: this.scene.sound.context
                });
            }
            
            // Store in cache for future use
            this.loadedSounds.set(soundKey, sound);
            
            // Play the sound
            const playResult = sound.play();
            
            if (this.debugMode) {
                console.log(`[BattleSoundManager] ✅ Play command sent:`, {
                    fullPath: soundResult.fullPath,
                    volume: finalVolume,
                    playResult: playResult,
                    soundState: {
                        isPlaying: sound.isPlaying,
                        isPaused: sound.isPaused,
                        volume: sound.volume
                    }
                });
                if (soundResult.hasVariations) {
                    console.log(`[BattleSoundManager] Selected variation: ${soundResult.selectedFile} (${soundResult.totalVariations} total)`);
                }
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
        // Extract relative path from full path to match SoundAssetLoader key generation
        let relativePath = soundPath;
        if (soundPath.startsWith(AudioAssetMappings.basePath)) {
            relativePath = soundPath.substring(AudioAssetMappings.basePath.length);
        }
        
        // Convert relative path to a valid cache key (same algorithm as SoundAssetLoader)
        return relativePath.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
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
            
            // Clean up audio context event listeners
            if (this.scene && this.scene.input) {
                this.scene.input.removeAllListeners('pointerdown');
            }
            document.removeEventListener('click', this.resumeAudioContext);
            document.removeEventListener('keydown', this.resumeAudioContext);
            
            console.log('[BattleSoundManager] Sound manager destroyed and resources cleaned up');
        } catch (error) {
            console.error('[BattleSoundManager] Error during cleanup:', error);
        }
    }
}
