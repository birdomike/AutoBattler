/**
 * Sound Manager
 * Manages sound effects for the UI
 */

class SoundManager {
    /**
     * Create a new Sound Manager
     */
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.volume = 0.5;
        this.audioContext = null;
        
        try {
            // Try to create audio context for generating sounds
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            console.log('AudioContext initialized');
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
        
        // Initialize sound system (no UI creation - handled by SettingsManager)
        this.initialize();
    }

    /**
     * Initialize sound effects
     */
    initialize() {
        // Define sound effects - this will use the generated sounds
        // until actual sound files are available
        this.registerSound('click', 'assets/audio/click.mp3');
        this.registerSound('hover', 'assets/audio/hover.mp3');
        this.registerSound('select', 'assets/audio/select.mp3');
        this.registerSound('add', 'assets/audio/add.mp3');
        this.registerSound('remove', 'assets/audio/remove.mp3');
        this.registerSound('error', 'assets/audio/error.mp3');
        this.registerSound('battle_start', 'assets/audio/battle_start.mp3');
        
        console.log('Sound effects registered');
    }
    
    /**
     * Set master volume (for SettingsManager integration)
     * @param {number} volume - Volume level (0-1)
     */
    setMasterVolume(volume) {
        this.setVolume(volume);
    }
    
    /**
     * Get master volume (for SettingsManager integration)
     * @returns {number} - Current volume level (0-1)
     */
    getMasterVolume() {
        return this.volume;
    }
    
    /**
     * Set mute state (for SettingsManager integration)
     * @param {boolean} muted - Mute state
     */
    setMuted(muted) {
        this.muted = muted;
        console.log(`Sound ${this.muted ? 'muted' : 'unmuted'} via SettingsManager`);
    }
    
    /**
     * Get mute state (for SettingsManager integration)
     * @returns {boolean} - Current mute state
     */
    isMuted() {
        return this.muted;
    }

    /**
     * Register a sound with both file and generated fallback
     * @param {string} id - Sound identifier
     * @param {string} path - Path to sound file
     */
    registerSound(id, path) {
        this.sounds[id] = {
            path: path,
            loaded: false,
            audio: null
        };
        
        // Try to load the sound file
        this.loadSoundFile(id, path);
    }
    
    /**
     * Try to load an actual sound file
     * @param {string} id - Sound identifier
     * @param {string} path - Path to sound file
     */
    loadSoundFile(id, path) {
        // Create an audio element
        const audio = new Audio();
        
        // Set up event listeners
        audio.oncanplaythrough = () => {
            console.log(`Sound loaded: ${id}`);
            this.sounds[id].loaded = true;
            this.sounds[id].audio = audio;
        };
        
        audio.onerror = () => {
            console.log(`Could not load sound file: ${path}. Will use generated sound instead.`);
        };
        
        // Load the file
        try {
            audio.src = path;
            audio.load();
        } catch (e) {
            console.warn(`Error loading sound file ${path}:`, e);
        }
    }

    /**
     * Play a sound effect
     * @param {string} id - Sound identifier
     */
    play(id) {
        if (this.muted || !this.sounds[id]) return;
        
        try {
            // If the sound file is loaded, play it
            if (this.sounds[id].loaded && this.sounds[id].audio) {
                const soundInstance = this.sounds[id].audio.cloneNode();
                soundInstance.volume = this.volume;
                soundInstance.play();
            } else {
                // Otherwise, generate a sound
                this.generateSound(id);
            }
        } catch (e) {
            console.warn(`Error playing sound ${id}:`, e);
        }
    }
    
    /**
     * Generate a sound using Web Audio API
     * @param {string} id - Sound identifier
     */
    generateSound(id) {
        if (!this.audioContext) return;
        
        try {
            // Create oscillator
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Set volume
            gainNode.gain.value = this.volume * 0.3; // Lower volume for generated sounds
            
            // Configure sound based on type
            switch (id) {
                case 'click':
                    oscillator.type = 'square';
                    oscillator.frequency.value = 800;
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.1);
                    break;
                    
                case 'hover':
                    oscillator.type = 'sine';
                    oscillator.frequency.value = 600;
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.08);
                    break;
                    
                case 'select':
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(900, this.audioContext.currentTime + 0.2);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                    break;
                    
                case 'add':
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                    break;
                    
                case 'remove':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.3);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                    break;
                    
                case 'error':
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(180, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime + 0.2);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                    break;
                    
                case 'battle_start':
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
                    oscillator.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.3);
                    oscillator.frequency.exponentialRampToValueAtTime(900, this.audioContext.currentTime + 0.5);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.7);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.7);
                    break;
                    
                default:
                    oscillator.type = 'sine';
                    oscillator.frequency.value = 440;
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.2);
            }
            
            console.log(`Generated sound: ${id}`);
            
        } catch (e) {
            console.warn(`Error generating sound ${id}:`, e);
        }
    }

    /**
     * Set sound volume
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        console.log(`Volume set to ${this.volume}`);
    }

    /**
     * Toggle mute state
     * @returns {boolean} - New mute state
     */
    toggleMute() {
        this.muted = !this.muted;
        console.log(`Sound ${this.muted ? 'muted' : 'unmuted'}`);
        return this.muted;
    }

    /**
     * Add hover sound to an element
     * @param {HTMLElement} element - Element to add sound to
     */
    addHoverSound(element) {
        // Hover sounds disabled - too distracting
        // Previously: element.addEventListener('mouseenter', () => this.play('hover'));
    }

    /**
     * Add click sound to an element
     * @param {HTMLElement} element - Element to add sound to
     */
    addClickSound(element) {
        element.addEventListener('click', () => {
            this.play('click');
        });
    }
    
    /**
     * Add sounds to common UI elements
     */
    addSoundsToUI() {
        // Add sounds to all buttons
        document.querySelectorAll('button').forEach(button => {
            this.addHoverSound(button);
            this.addClickSound(button);
        });
        
        // Add sounds to battle mode selectors
        document.querySelectorAll('.battle-mode').forEach(mode => {
            this.addHoverSound(mode);
            mode.addEventListener('click', () => {
                this.play('select');
            });
        });
        
        // Add sounds to hero cards
        document.querySelectorAll('.hero-card').forEach(card => {
            this.addHoverSound(card);
            card.addEventListener('click', () => {
                this.play('select');
            });
        });
        
        // Add sounds to team slots
        document.querySelectorAll('.slot-empty').forEach(slot => {
            this.addHoverSound(slot);
            slot.addEventListener('click', () => {
                this.play('add');
            });
        });
        
        // Add sounds to remove buttons
        document.querySelectorAll('.remove-hero').forEach(button => {
            this.addHoverSound(button);
            button.addEventListener('click', () => {
                this.play('remove');
            });
        });
        
        // Start battle button
        const startButton = document.getElementById('start-battle');
        if (startButton) {
            this.addHoverSound(startButton);
            startButton.addEventListener('click', () => {
                if (!startButton.disabled) {
                    this.play('battle_start');
                } else {
                    this.play('error');
                }
            });
        }
        
        console.log('Added sounds to UI elements');
    }
}

// Create a singleton instance
const soundManager = new SoundManager();

// Make it available globally
window.soundManager = soundManager;

// Add sound effects to UI elements once the page is fully loaded
window.addEventListener('load', () => {
    // Wait a moment for all UI elements to be created
    setTimeout(() => {
        window.soundManager.addSoundsToUI();
    }, 1000);
});
