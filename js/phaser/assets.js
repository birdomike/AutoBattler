/**
 * Assets Manager
 * Handles loading and organizing game assets
 */
class AssetsManager {
    constructor() {
        // Will store information about assets
        this.assets = {
            // Character assets
            characters: {},
            
            // UI assets
            ui: {},
            
            // Effect assets
            effects: {},
            
            // Arena backgrounds
            arenas: {}
        };
    }
    
    /**
     * Initialize the assets manager
     */
    initialize() {
        // Catalog arena backgrounds
        this.catalogArenaBackgrounds();
        
        // Catalog UI assets
        this.catalogUIAssets();
        
        // Catalog character assets
        this.catalogCharacterAssets();
        
        console.log('AssetsManager: Initialized');
    }
    
    /**
     * Catalog available arena backgrounds
     */
    catalogArenaBackgrounds() {
        // Get arena backgrounds from existing game
        this.assets.arenas = {
            'default': 'assets/images/Arena Art/default.png',
            'grassyfield': 'assets/images/Arena Art/Grassy Field.png'
            // More will be added as they become available
        };
    }
    
    /**
     * Catalog UI assets
     */
    catalogUIAssets() {
        // Basic UI assets
        this.assets.ui = {
            // Buttons
            'button': 'assets/images/ui/button.png',
            'button-hover': 'assets/images/ui/button-hover.png',
            
            // Panels
            'panel': 'assets/images/ui/panel.png',
            'slot': 'assets/images/ui/slot.png',
            
            // Icons
            'health-icon': 'assets/images/icons/health.png',
            'attack-icon': 'assets/images/icons/attack.png',
            'defense-icon': 'assets/images/icons/defense.png',
            'speed-icon': 'assets/images/icons/speed.png'
            
            // More will be added as needed
        };
    }
    
    /**
     * Catalog character assets
     */
    catalogCharacterAssets() {
        // Use the existing TeamBuilderImageLoader to get character images
        if (window.TeamBuilderImageLoader) {
            const loader = new window.TeamBuilderImageLoader();
            this.assets.characters = loader.characterImages || {};
        } else {
            // Fallback to hard-coded paths
            this.assets.characters = {
                'Aqualia': 'assets/images/Character Art/Aqualia.png',
                'Vaelgor': 'assets/images/Character Art/Vaelgor.png',
                'Sylvanna': 'assets/images/Character Art/Sylvanna.png',
                'Lumina': 'assets/images/Character Art/Lumina.png'
                // More can be added as they become available
            };
        }
    }
    
    /**
     * Get the path to a character image
     * @param {string} characterName - The name of the character
     * @returns {string} The path to the character image
     */
    getCharacterImagePath(characterName) {
        return this.assets.characters[characterName] || '';
    }
    
    /**
     * Get the path to an arena background
     * @param {string} arenaKey - The key of the arena
     * @returns {string} The path to the arena background
     */
    getArenaBackgroundPath(arenaKey) {
        return this.assets.arenas[arenaKey] || this.assets.arenas['default'];
    }
    
    /**
     * Get the path to a UI asset
     * @param {string} assetKey - The key of the UI asset
     * @returns {string} The path to the UI asset
     */
    getUIAssetPath(assetKey) {
        return this.assets.ui[assetKey] || '';
    }
    
    /**
     * Preload assets into a Phaser scene
     * @param {Phaser.Scene} scene - The scene to preload assets into
     * @param {string} type - The type of assets to preload ('characters', 'ui', 'arenas', 'all')
     */
    preloadAssets(scene, type = 'all') {
        if (!scene || !scene.load) {
            console.error('AssetsManager: Invalid scene provided for preloading');
            return;
        }
        
        // Preload character assets
        if (type === 'all' || type === 'characters') {
            for (const [name, path] of Object.entries(this.assets.characters)) {
                if (path) {
                    scene.load.image(`character-${name.toLowerCase()}`, path);
                }
            }
        }
        
        // Preload UI assets
        if (type === 'all' || type === 'ui') {
            for (const [key, path] of Object.entries(this.assets.ui)) {
                if (path) {
                    scene.load.image(`ui-${key}`, path);
                }
            }
        }
        
        // Preload arena backgrounds
        if (type === 'all' || type === 'arenas') {
            for (const [key, path] of Object.entries(this.assets.arenas)) {
                if (path) {
                    scene.load.image(`arena-${key}`, path);
                }
            }
        }
    }
}
