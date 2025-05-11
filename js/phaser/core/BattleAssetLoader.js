/**
 * BattleAssetLoader.js
 * 
 * Centralizes all asset loading logic for the battle scene, improving 
 * separation of concerns and reducing BattleScene complexity.
 * 
 * This component handles the loading of three main asset categories:
 * - UI assets (buttons, panels, indicators)
 * - Character assets (sprites, circles, placeholders)
 * - Status effect icons and their mapping definitions
 * 
 * The unified loadAssets() method provides comprehensive error tracking and 
 * aggregation, returning detailed status information while maintaining graceful
 * degradation through fallback mechanisms. Individual asset types can also be
 * loaded separately through specialized methods.
 * 
 * BattleAssetLoader is part of the BattleScene refactoring project's Phase 4,
 * extracting asset loading from BattleScene.js to improve modularity and
 * maintainability within the component-based architecture.
 * 
 * @version 0.6.4.5
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
                'Sylvanna', 'Vaelgor', 'Seraphina', 'Nyria'
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
    
    /**
     * Load status effect icons for the battle scene
     * @returns {Object} The status icon mapping
     */
    loadStatusEffectIcons() {
        console.log("[BattleAssetLoader] Loading status effect icons...");
        
        if (!this.scene || !this.scene.load) {
            console.error("[BattleAssetLoader] Cannot load status effect icons - scene or loader not available");
            return {};
        }
        
        try {
            // Get the status icon mapping
            const iconMapping = this.initStatusIconMapping();
            
            // Set the base path for status icons
            const basePath = 'assets/images/icons/status/status-icons/';
            
            // Status effect icons list
            const statusIconIds = [
                'burn', 'poison', 'regen', 'stun', 'freeze', 'shield',
                'atk_up', 'atk_down', 'def_up', 'def_down', 'spd_up', 'spd_down',
                'str_up', 'str_down', 'int_up', 'int_down', 'spi_up', 'spi_down',
                'taunt', 'evade', 'bleed', 'reflect', 'vulnerable', 'immune', 'crit_up'
            ];
            
            // Load each status icon with the AI version
            statusIconIds.forEach(iconId => {
                const key = `status_${iconId}`;
                const iconPath = iconMapping[iconId] || `${iconId}.png`;
                this.scene.load.image(key, `${basePath}${iconPath}`);
                console.log(`[BattleAssetLoader] Preloading status icon ${key} from ${basePath}${iconPath}`);
            });
            
            console.log('[BattleAssetLoader] Status effect icons preload complete');
            
            // Return the mapping for BattleScene to use
            return iconMapping;
        } catch (error) {
            console.warn('[BattleAssetLoader] Could not preload status effect icons:', error);
            return {}; // Return empty object as fallback
        }
    }
    
    /**
     * Initialize the status icon mapping
     * @returns {Object} The status icon mapping
     */
    initStatusIconMapping() {
        console.log("[BattleAssetLoader] Initializing status icon mapping...");
        
        try {
            // Try to use StatusIconMapper if available
            if (window.StatusIconMapper && typeof window.StatusIconMapper.getMapping === 'function') {
                console.log("[BattleAssetLoader] Using StatusIconMapper.getMapping()");
                return window.StatusIconMapper.getMapping();
            }
            
            // Fallback mapping if StatusIconMapper isn't available
            console.log("[BattleAssetLoader] StatusIconMapper not available, using fallback mapping");
            return {
                'atk_down': 'AI_Icons/32px/Attack Down_AI.png',
                'atk_up': 'AI_Icons/32px/AttackUp.png',
                'bleed': 'AI_Icons/32px/Bleeding_AI.png',
                'burn': 'AI_Icons/32px/Burn_AI.png',
                'crit_up': 'AI_Icons/32px/CritChanceUp_AI.png',
                'def_down': 'AI_Icons/32px/Defense Down_AI.png',
                'def_up': 'AI_Icons/32px/Defense Up_AI.png',
                'evade': 'AI_Icons/32px/Evasion_AI.png',
                'freeze': 'AI_Icons/32px/Freeze_AI.png',
                'immune': 'AI_Icons/32px/Immunity_AI.png',
                'int_down': 'AI_Icons/32px/IntellectDown_AI.png',
                'int_up': 'AI_Icons/32px/Intellect Up_AI.png',
                'poison': 'AI_Icons/32px/Poison_AI.png',
                'reflect': 'AI_Icons/32px/DamageReflect_AI.png',
                'regen': 'AI_Icons/32px/Regeneration_AI.png',
                'shield': 'AI_Icons/32px/Shield_AI.png',
                'spd_down': 'AI_Icons/32px/Speed Down_AI.png',
                'spd_up': 'AI_Icons/32px/Speed Up_AI.png',
                'spi_down': 'AI_Icons/32px/SpiritDown_AI.png',
                'spi_up': 'AI_Icons/32px/SpiritUp_AI.png',
                'str_down': 'AI_Icons/32px/StrengthDown_AI.png',
                'str_up': 'AI_Icons/32px/StrengthUp_AI.png',
                'stun': 'AI_Icons/32px/Stunned_AI.png',
                'taunt': 'AI_Icons/32px/Taunt_AI.png',
                'vulnerable': 'AI_Icons/32px/Vulnerable_AI.png'
            };
        } catch (error) {
            console.error('[BattleAssetLoader] Error initializing status icon mapping:', error);
            // Return a minimal mapping as ultimate fallback
            return {};
        }
    }
    
    /**
     * Load all assets for the battle scene in a single operation
     * @returns {Object} An object containing all asset-related mappings and statuses
     */
    loadAssets() {
        console.log("[BattleAssetLoader] Loading all battle assets...");
        
        if (!this.scene || !this.scene.load) {
            console.error("[BattleAssetLoader] Cannot load assets - scene or loader not available");
            return {
                success: false,
                uiAssetsLoaded: false,
                characterAssetsLoaded: false,
                statusIconsLoaded: false,
                statusIconMapping: {},
                errors: ["Scene or loader not available"]
            };
        }
        
        // Track loading status and errors
        const assetData = {
            success: true,
            uiAssetsLoaded: false,
            characterAssetsLoaded: false,
            statusIconsLoaded: false,
            statusIconMapping: {},
            errors: []
        };
        
        // UI Assets
        try {
            console.log("[BattleAssetLoader] Loading UI assets...");
            this.loadUIAssets();
            assetData.uiAssetsLoaded = true;
        } catch (error) {
            console.error("[BattleAssetLoader] Error loading UI assets:", error);
            assetData.errors.push("UI assets: " + error.message);
            assetData.success = false;
        }
        
        // Character Assets
        try {
            console.log("[BattleAssetLoader] Loading character assets...");
            this.loadCharacterAssets();
            assetData.characterAssetsLoaded = true;
        } catch (error) {
            console.error("[BattleAssetLoader] Error loading character assets:", error);
            assetData.errors.push("Character assets: " + error.message);
            assetData.success = false;
        }
        
        // Status Effect Icons
        try {
            console.log("[BattleAssetLoader] Loading status effect icons...");
            assetData.statusIconMapping = this.loadStatusEffectIcons();
            
            // Verify the mapping was returned successfully
            if (assetData.statusIconMapping && Object.keys(assetData.statusIconMapping).length > 0) {
                assetData.statusIconsLoaded = true;
            } else {
                assetData.errors.push("Status icons: Mapping was empty or invalid");
                assetData.success = false;
            }
        } catch (error) {
            console.error("[BattleAssetLoader] Error loading status effect icons:", error);
            assetData.errors.push("Status icons: " + error.message);
            assetData.success = false;
        }
        
        // Log summary
        if (assetData.success) {
            console.log("[BattleAssetLoader] All assets loaded successfully");
        } else {
            console.warn("[BattleAssetLoader] Some assets failed to load:", assetData.errors);
        }
        
        return assetData;
    }
    
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
