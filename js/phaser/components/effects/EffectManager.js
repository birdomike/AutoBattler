/**
 * EffectManager.js
 * Manages and displays visual effects for abilities in the battle scene
 */
class EffectManager {
    /**
     * Create a new EffectManager
     * @param {Phaser.Scene} scene - The scene this effect manager belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.effects = {};
        this.activeEffects = [];
        
        // Initialize particle emitters and effect definitions
        this.initializeEffects();

        // Track particles for cleanup
        this.particleManagers = [];
    }

    /**
     * Initialize effect definitions and particle emitters
     */
    initializeEffects() {
        // Define effect types
        this.effects = {
            // Fire effects
            fire: {
                color: 0xff4400,
                secondaryColor: 0xff8800,
                particleCount: 40,
                lifespan: 800,
                scale: { start: 0.2, end: 0 },
                speed: { min: 50, max: 100 },
                createEffect: (x, y, targetX, targetY) => this.createFireEffect(x, y, targetX, targetY)
            },
            
            // Water effects
            water: {
                color: