/**
 * BattleAssetLoader.js
 * 
 * Centralizes all asset loading logic for the battle scene, improving 
 * separation of concerns and reducing BattleScene complexity.
 * 
 * @version 0.6.4.0
 */

class BattleAssetLoader {
    constructor(scene) {
        if (!scene) {
            console.error("[BattleAssetLoader] Missing required scene reference");
            return;
        }
        
        this.scene = scene;
        console.log("[BattleAssetLoader] Initializing...");
    }
    
    loadUIAssets() {
        console.log("[BattleAssetLoader] Loading UI assets...");
        
        // Make sure the scene and loader are available
        if (!this.scene || !this.scene.load) {
            console.error("[BattleAssetLoader] Cannot load UI assets - scene or loader not available");
            return;
        }
        
        // Load UI assets (extracted from BattleScene.preload)
        this.scene.load.image('return-button', 'assets/images/icons/return.png');
        this.scene.load.image('next-turn', 'assets/images/icons/next-turn.png');
        this.scene.load.image('play', 'assets/images/icons/play.png');
        this.scene.load.image('pause', 'assets/images/icons/pause.png');
        this.scene.load.image('speed-1', 'assets/images/icons/speed-1.png');
        this.scene.load.image('speed-2', 'assets/images/icons/speed-2.png');
        this.scene.load.image('speed-3', 'assets/images/icons/speed-3.png');
        this.scene.load.image('health-bar-bg', 'assets/images/ui/health-bar-bg.png');
        this.scene.load.image('health-bar', 'assets/images/ui/health-bar.png');
        this.scene.load.image('turn-indicator', 'assets/images/ui/turn-indicator.png');
        
        console.log("[BattleAssetLoader] UI assets loading complete");
    }
    
    /**
     * Load character assets for the battle scene
     */
    loadCharacterAssets() {
        console.log("[BattleAssetLoader] Loading character assets...");
        
        if (!this.scene || !this.scene.load) {
            console.error("[BattleAssetLoader] Cannot load character assets - scene or loader not available");
            return;
        }
        
        try {
            // Basic placeholder asset
            this.scene.load.image('character-circle', 'assets/images/icons/character-circle.png');
            
            // Preload all combat-optimized character art
            const characterArt = [
                'Aqualia', 'Drakarion', 'Zephyr', 'Lumina', 
                'Sylvanna', 'Vaelgor', 'Seraphina' 
            ];
            
            // Special case for Caste due to parentheses in filename
            const casteKey = 'character_Caste';
            const castePath = 'assets/images/Character Art/Combat_Version/Caste.png';
            this.scene.load.image(casteKey, castePath);
            console.log(`[BattleAssetLoader] Preloading combat-optimized character image ${casteKey} from ${castePath}`);
            
            characterArt.forEach(name => {
                const key = `character_${name}`;
                // Use the combat-optimized versions of character art
                const path = `assets/images/Character Art/Combat_Version/${name}.png`;
                this.scene.load.image(key, path);
                console.log(`[BattleAssetLoader] Preloading combat-optimized character image ${key} from ${path}`);
            });
            
            console.log('[BattleAssetLoader] Character art preload complete');
        } catch (error) {
            console.warn('[BattleAssetLoader] Could not preload character art:', error);
        }
    }
    
    // Placeholder for future methods:
    // loadStatusEffectIcons() - Stage 3
    // initStatusIconMapping() - Stage 3
    // loadAssets() - Stage 4
    
    // Lifecycle methods
    destroy() {
        console.log("[BattleAssetLoader] Cleaning up");
        // Reset references
        this.scene = null;
    }
}

// Make component available globally
if (typeof window !== 'undefined') {
    window.BattleAssetLoader = BattleAssetLoader;
    console.log("BattleAssetLoader loaded and exported to window.BattleAssetLoader");
}
