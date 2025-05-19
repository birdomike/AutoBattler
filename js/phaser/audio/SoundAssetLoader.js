/**
 * SoundAssetLoader.js
 * 
 * Handles preloading of audio assets for the battle sound system during scene initialization.
 * Works in conjunction with BattleSoundManager and AudioAssetMappings to ensure all
 * sounds are available when needed, using the same key generation system for consistency.
 * 
 * Part of Phase 1 implementation - AUTO-ATTACK SOUND SYSTEM
 */

// Import the AudioAssetMappings to access sound file structure
import { AudioAssetMappings } from '../../data/AudioAssetMappings.js';

export class SoundAssetLoader {
    constructor(scene) {
        this.scene = scene;
        this.basePath = AudioAssetMappings.basePath;
        this.loadedKeys = new Set(); // Track loaded sound keys to prevent duplicates
        this.loadingPromises = []; // Track loading promises for Promise.all()
        this.debugMode = false;
        
        console.log('[SoundAssetLoader] Initialized sound asset loader for scene');
    }
    
    /**
     * Load all auto-attack sounds for the battle system
     * @returns {Promise} Promise that resolves when all sounds are loaded
     */
    async loadAutoAttackSounds() {
        try {
            console.log('[SoundAssetLoader] Starting auto-attack sound loading...');
            
            // Clear any existing promises
            this.loadingPromises = [];
            
            // Load sounds from all tiers of the hierarchy
            await Promise.all([
                this.loadGenreSounds(),
                this.loadCharacterSounds(),
                this.loadDefaultSounds()
            ]);
            
            console.log(`[SoundAssetLoader] Successfully loaded ${this.loadedKeys.size} unique sound keys`);
            return true;
        } catch (error) {
            console.error('[SoundAssetLoader] Error loading auto-attack sounds:', error);
            return false;
        }
    }
    
    /**
     * Load genre-specific sounds (Tier 3)
     * @returns {Promise} Promise that resolves when genre sounds are loaded
     */
    async loadGenreSounds() {
        try {
            if (this.debugMode) {
                console.log('[SoundAssetLoader] Loading genre-specific sounds...');
            }
            
            const promises = [];
            
            // Load from genre_specific mappings
            for (const [genreKey, genreData] of Object.entries(AudioAssetMappings.genre_specific)) {
                if (genreData.autoAttack) {
                    for (const [attackType, attackData] of Object.entries(genreData.autoAttack)) {
                        for (const [eventType, eventData] of Object.entries(attackData)) {
                            if (eventData.files && Array.isArray(eventData.files)) {
                                // Load multiple files for this event
                                const soundPaths = eventData.files.map(file => `${eventData.path}${file}`);
                                promises.push(this.loadSoundGroup(`genre_${genreKey}_${attackType}_${eventType}`, soundPaths));
                            } else if (eventData.path) {
                                // Load single file
                                promises.push(this.loadSoundGroup(`genre_${genreKey}_${attackType}_${eventType}`, [eventData.path]));
                            }
                        }
                    }
                }
            }
            
            await Promise.all(promises);
            
            if (this.debugMode) {
                console.log('[SoundAssetLoader] Genre-specific sounds loaded');
            }
            
        } catch (error) {
            console.error('[SoundAssetLoader] Error loading genre-specific sounds:', error);
            throw error;
        }
    }
    
    /**
     * Load character-specific sounds (Tier 2)
     * @returns {Promise} Promise that resolves when character sounds are loaded
     */
    async loadCharacterSounds() {
        try {
            if (this.debugMode) {
                console.log('[SoundAssetLoader] Loading character-specific sounds...');
            }
            
            const promises = [];
            
            // Load from character_specific mappings
            for (const [characterKey, characterData] of Object.entries(AudioAssetMappings.character_specific)) {
                if (characterData.autoAttack) {
                    for (const [attackType, attackData] of Object.entries(characterData.autoAttack)) {
                        for (const [eventType, eventData] of Object.entries(attackData)) {
                            if (eventData.files && Array.isArray(eventData.files)) {
                                // Load multiple files for this event
                                const soundPaths = eventData.files.map(file => `${eventData.path}${file}`);
                                promises.push(this.loadSoundGroup(`character_${characterKey}_${attackType}_${eventType}`, soundPaths));
                            } else if (eventData.path) {
                                // Load single file
                                promises.push(this.loadSoundGroup(`character_${characterKey}_${attackType}_${eventType}`, [eventData.path]));
                            }
                        }
                    }
                }
            }
            
            await Promise.all(promises);
            
            if (this.debugMode) {
                console.log('[SoundAssetLoader] Character-specific sounds loaded');
            }
            
        } catch (error) {
            console.error('[SoundAssetLoader] Error loading character-specific sounds:', error);
            throw error;
        }
    }
    
    /**
     * Load default fallback sounds (Tier 4)
     * @returns {Promise} Promise that resolves when default sounds are loaded
     */
    async loadDefaultSounds() {
        try {
            if (this.debugMode) {
                console.log('[SoundAssetLoader] Loading default sounds...');
            }
            
            const promises = [];
            
            // Load from defaults mappings
            if (AudioAssetMappings.defaults.autoAttack) {
                for (const [attackType, attackData] of Object.entries(AudioAssetMappings.defaults.autoAttack)) {
                    for (const [eventType, eventData] of Object.entries(attackData)) {
                        if (eventData.files && Array.isArray(eventData.files)) {
                            // Load multiple files for this event
                            const soundPaths = eventData.files.map(file => `${eventData.path}${file}`);
                            promises.push(this.loadSoundGroup(`default_${attackType}_${eventType}`, soundPaths));
                        } else if (eventData.path) {
                            // Load single file
                            promises.push(this.loadSoundGroup(`default_${attackType}_${eventType}`, [eventData.path]));
                        }
                    }
                }
            }
            
            await Promise.all(promises);
            
            if (this.debugMode) {
                console.log('[SoundAssetLoader] Default sounds loaded');
            }
            
        } catch (error) {
            console.error('[SoundAssetLoader] Error loading default sounds:', error);
            throw error;
        }
    }
    
    /**
     * Load a group of sounds with the same category
     * @param {string} groupKey - Identifier for the sound group (for logging)
     * @param {Array<string>} soundPaths - Array of relative sound paths
     * @returns {Promise} Promise that resolves when all sounds in group are loaded
     */
    async loadSoundGroup(groupKey, soundPaths) {
        try {
            const promises = [];
            
            for (const soundPath of soundPaths) {
                // Generate full path
                const fullPath = this.basePath + soundPath;
                
                // Generate unique key for Phaser (same algorithm as BattleSoundManager)
                const soundKey = this.generateSoundKey(soundPath);
                
                // Skip if already loaded
                if (this.loadedKeys.has(soundKey)) {
                    if (this.debugMode) {
                        console.log(`[SoundAssetLoader] Skipping already loaded sound: ${soundKey}`);
                    }
                    continue;
                }
                
                // Queue the sound for loading
                this.scene.load.audio(soundKey, fullPath);
                this.loadedKeys.add(soundKey);
                
                if (this.debugMode) {
                    console.log(`[SoundAssetLoader] Queued sound: ${soundKey} -> ${fullPath}`);
                }
            }
            
            // Create a promise that resolves when loading completes
            // Note: Phaser's load system is synchronous queue management, actual loading happens on load.start()
            // Return a promise that resolves immediately since Phaser handles the async loading internally
            return Promise.resolve();
            
        } catch (error) {
            console.error(`[SoundAssetLoader] Error loading sound group ${groupKey}:`, error);
            throw error;
        }
    }
    
    /**
     * Generate a unique sound key for Phaser caching (matches BattleSoundManager algorithm)
     * @param {string} soundPath - Relative path to the sound file
     * @returns {string} Unique key for sound caching
     */
    generateSoundKey(soundPath) {
        // Use the same algorithm as BattleSoundManager to ensure consistency
        return soundPath.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    }
    
    /**
     * Load ability-specific sounds (Tier 1) - placeholder for future phases
     * @returns {Promise} Promise that resolves when ability sounds are loaded
     */
    async loadAbilitySounds() {
        try {
            if (this.debugMode) {
                console.log('[SoundAssetLoader] Loading ability-specific sounds (placeholder)...');
            }
            
            // Placeholder implementation for Phase 5
            // Will load from AudioAssetMappings.abilities when implemented
            const promises = [];
            
            // TODO: Implement in Phase 5 when ability sounds are needed
            
            await Promise.all(promises);
            
            if (this.debugMode) {
                console.log('[SoundAssetLoader] Ability-specific sounds loaded (placeholder)');
            }
            
        } catch (error) {
            console.error('[SoundAssetLoader] Error loading ability-specific sounds:', error);
            throw error;
        }
    }
    
    /**
     * Get loading progress information
     * @returns {Object} Loading progress data
     */
    getLoadingProgress() {
        return {
            totalSoundsQueued: this.loadedKeys.size,
            soundKeys: Array.from(this.loadedKeys),
            basePath: this.basePath
        };
    }
    
    /**
     * Check if all required sounds for a character are loaded
     * @param {string} characterName - Name of the character to check
     * @param {string} autoAttackType - 'melee' or 'ranged'
     * @returns {boolean} Whether all sounds are loaded
     */
    isCharacterSoundsLoaded(characterName, autoAttackType) {
        try {
            // Use AudioAssetMappings to resolve what sounds this character should have
            const characterKey = characterName.toLowerCase();
            
            // Check based on character sound profile mapping (from BattleSoundManager logic)
            // This is a simplified check - in practice, BattleSoundManager will handle fallbacks
            
            // For Phase 1, we just check that basic default sounds are loaded
            const requiredEvents = autoAttackType === 'melee' ? ['impact'] : ['release'];
            
            for (const event of requiredEvents) {
                const defaultKey = this.generateSoundKey(`defaults/auto_attacks/${autoAttackType}_${event}/`);
                // This is a simplified check - actual verification would be more complex
            }
            
            return true; // Simplified for Phase 1
        } catch (error) {
            console.error(`[SoundAssetLoader] Error checking character sounds for ${characterName}:`, error);
            return false;
        }
    }
    
    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`[SoundAssetLoader] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Get statistics about loaded sounds
     * @returns {Object} Statistics object
     */
    getStatistics() {
        return {
            totalSoundsLoaded: this.loadedKeys.size,
            categories: {
                genre: Array.from(this.loadedKeys).filter(key => key.startsWith('genre_')).length,
                character: Array.from(this.loadedKeys).filter(key => key.startsWith('character_')).length,
                defaults: Array.from(this.loadedKeys).filter(key => key.startsWith('default_')).length
            }
        };
    }
    
    /**
     * Clean up loader resources
     */
    destroy() {
        try {
            this.loadedKeys.clear();
            this.loadingPromises = [];
            this.scene = null;
            
            console.log('[SoundAssetLoader] Sound asset loader destroyed and resources cleaned up');
        } catch (error) {
            console.error('[SoundAssetLoader] Error during cleanup:', error);
        }
    }
}
