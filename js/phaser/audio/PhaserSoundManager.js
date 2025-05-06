/**
 * PhaserSoundManager.js
 * 
 * Manages audio for the Phaser-based battle system. Handles loading,
 * playing, and configuring sounds based on game events.
 */

class PhaserSoundManager {
    constructor(scene) {
        // Check for existing instance
        if (scene.soundManager) {
            console.warn('A sound manager already exists for this scene. Returning existing instance.');
            return scene.soundManager;
        }

        this.scene = scene;
        this.sounds = {};
        this.categories = {
            attack: [], // slap sounds
            ability: [], // splash sounds
            movement: [], // woosh sounds
            ui: [] // UI sounds
        };
        this.config = {
            masterVolume: 0.8,  // Default at 80%
            muted: false,
            categoryVolumes: {
                attack: 0.9,
                ability: 1.0,
                movement: 0.7,
                ui: 0.6
            }
        };
        
        // Initialize the sound manager
        this.initialize();
    }
    
    /**
     * Initialize the sound manager
     */
    initialize() {
        console.log('Initializing Phaser Sound Manager');
        
        // Load default sounds if not already loaded
        this.loadDefaultSounds();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Load default battle sounds
     */
    loadDefaultSounds() {