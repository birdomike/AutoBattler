# BattleScene Phase 4 Refactoring Guide: Asset Loading Extraction

## Component Overview: BattleAssetLoader

**Purpose**: Centralize all asset loading logic for the battle scene, improving separation of concerns and reducing BattleScene complexity.

**New File**: `js/phaser/core/BattleAssetLoader.js`

**Code to Extract**:
- Logic from `preload()` method in BattleScene
- `preloadStatusEffectIcons()` method
- `initStatusIconMapping()` method

**Estimated Lines Removed**: ~40-60 lines

## Implementation Plan

### Stage 1: Create BattleAssetLoader & Extract UI Asset Loading

#### Part 1: Create the BattleAssetLoader Component with UI Asset Loading
```javascript
// New file: js/phaser/core/BattleAssetLoader.js
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
        
        // Load UI assets (copied from BattleScene.preload)
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
    }
    
    // Other methods will be added in subsequent stages
    
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
```

#### Part 2: Update HTML and Modify BattleScene.preload() to Use BattleAssetLoader for UI Assets
```javascript
// In BattleScene.js preload()
preload() {
    // Initialize BattleAssetLoader for UI assets
    if (window.BattleAssetLoader) {
        this.assetLoader = new BattleAssetLoader(this);
        this.assetLoader.loadUIAssets();
        
        // REMAINING ORIGINAL CODE for other assets (character, status icons)
        // Load character assets
        this.load.image('character-circle', 'assets/images/ui/character-circle.png');
        // ...other character assets...
        
        // Load status effect icons
        this.preloadStatusEffectIcons();
    } else {
        console.warn("[BattleScene] BattleAssetLoader not available, using original loading code");
        
        // Original UI asset loading code as fallback
        this.load.image('return-button', 'assets/images/icons/return.png');
        this.load.image('next-turn', 'assets/images/icons/next-turn.png');
        // ...other UI assets...
        
        // Continue with other asset loading
        this.load.image('character-circle', 'assets/images/ui/character-circle.png');
        // ...other character assets...
        
        // Load status effect icons
        this.preloadStatusEffectIcons();
    }
}
```

#### Part 3: Test and Verify UI Asset Loading
- Start a battle and confirm all UI elements display correctly
- Check console for any errors related to UI assets

#### Part 4: Remove Original UI Asset Loading Code
```javascript
// In BattleScene.js preload()
preload() {
    // Initialize BattleAssetLoader for UI assets
    if (window.BattleAssetLoader) {
        this.assetLoader = new BattleAssetLoader(this);
        this.assetLoader.loadUIAssets();
        
        // REMAINING ORIGINAL CODE for other assets (character, status icons)
        // Load character assets
        this.load.image('character-circle', 'assets/images/ui/character-circle.png');
        // ...other character assets...
        
        // Load status effect icons
        this.preloadStatusEffectIcons();
    } else {
        console.error("[BattleScene] BattleAssetLoader not available - cannot load UI assets!");
        
        // Fall back to basic loading (no UI elements)
        // Load character assets
        this.load.image('character-circle', 'assets/images/ui/character-circle.png');
        // ...other character assets...
        
        // Load status effect icons
        this.preloadStatusEffectIcons();
    }
}
```

### Stage 2: Extract Character Asset Loading

#### Part 1: Add Character Asset Loading to BattleAssetLoader
```javascript
// Add to BattleAssetLoader.js
loadCharacterAssets() {
    console.log("[BattleAssetLoader] Loading character assets...");
    
    // Load character assets (copied from BattleScene.preload)
    this.scene.load.image('character-circle', 'assets/images/ui/character-circle.png');
    this.scene.load.image('character-circle-player', 'assets/images/ui/character-circle-player.png');
    this.scene.load.image('character-circle-enemy', 'assets/images/ui/character-circle-enemy.png');
    // ...other character assets...
}
```

#### Part 2: Update BattleScene.preload() to Use BattleAssetLoader for Character Assets
```javascript
// In BattleScene.js preload()
preload() {
    // Initialize BattleAssetLoader for UI and character assets
    if (window.BattleAssetLoader) {
        this.assetLoader = new BattleAssetLoader(this);
        this.assetLoader.loadUIAssets();
        this.assetLoader.loadCharacterAssets();
        
        // REMAINING ORIGINAL CODE for status icons
        // Load status effect icons
        this.preloadStatusEffectIcons();
    } else {
        console.error("[BattleScene] BattleAssetLoader not available - cannot load assets!");
        
        // Fall back to critical status effect loading only
        this.preloadStatusEffectIcons();
    }
}
```

#### Part 3: Test and Verify Character Asset Loading
- Start a battle and confirm all character elements display correctly
- Check console for any errors related to character assets

#### Part 4: Remove Original Character Asset Loading Code
- The code is already removed in Part 2, since we're now using the asset loader's method

### Stage 3: Extract Status Effect Icon Loading

#### Part 1: Add Status Effect Icon Loading to BattleAssetLoader
```javascript
// Add to BattleAssetLoader.js
loadStatusEffectIcons() {
    console.log("[BattleAssetLoader] Loading status effect icons...");
    
    // Copy the full implementation from BattleScene.preloadStatusEffectIcons
    const statusIconsPath = 'assets/images/icons/status/status-icons/';
    
    // Load all status effect icons
    this.scene.load.image('status_attack_up', `${statusIconsPath}attack-up.png`);
    this.scene.load.image('status_attack_down', `${statusIconsPath}attack-down.png`);
    // ...and all other status icon loading code
}

initStatusIconMapping() {
    console.log("[BattleAssetLoader] Initializing status icon mapping...");
    
    // Copy the full implementation from BattleScene.initStatusIconMapping
    return {
        'status_attack_up': { key: 'status_attack_up', tint: 0x00ff00 },
        'status_attack_down': { key: 'status_attack_down', tint: 0xff0000 },
        // ...and all other mapping entries
    };
}
```

#### Part 2: Update BattleScene.preload() to Use BattleAssetLoader for Status Effect Icons
```javascript
// In BattleScene.js preload()
preload() {
    // Initialize BattleAssetLoader for all assets
    if (window.BattleAssetLoader) {
        this.assetLoader = new BattleAssetLoader(this);
        this.assetLoader.loadUIAssets();
        this.assetLoader.loadCharacterAssets();
        this.assetLoader.loadStatusEffectIcons();
        
        // Store the status icon mapping returned by the loader
        this.statusIconMapping = this.assetLoader.initStatusIconMapping();
    } else {
        console.error("[BattleScene] BattleAssetLoader not available - cannot load assets!");
        
        // Fall back to original status effect loading
        this.preloadStatusEffectIcons();
        this.statusIconMapping = this.initStatusIconMapping();
    }
}
```

#### Part 3: Test and Verify Status Effect Icon Loading
- Start a battle with characters that apply status effects
- Verify that status effect icons appear correctly
- Check status effect tooltips for correct information

#### Part 4: Remove Original Status Effect Methods
```javascript
// In BattleScene.js preload()
preload() {
    // Initialize BattleAssetLoader for all assets
    if (window.BattleAssetLoader) {
        this.assetLoader = new BattleAssetLoader(this);
        this.assetLoader.loadUIAssets();
        this.assetLoader.loadCharacterAssets();
        this.assetLoader.loadStatusEffectIcons();
        
        // Store the status icon mapping returned by the loader
        this.statusIconMapping = this.assetLoader.initStatusIconMapping();
    } else {
        console.error("[BattleScene] BattleAssetLoader not available - cannot load assets!");
        // Critical failure - no fallback
    }
}

// REMOVE these methods entirely from BattleScene.js
// preloadStatusEffectIcons() - REMOVED
// initStatusIconMapping() - REMOVED
```

### Stage 4: Finalize BattleAssetLoader with Full Asset Loading

#### Part 1: Combine All Loading in a Master Method
```javascript
// Add to BattleAssetLoader.js
loadAssets() {
    if (!this.scene || !this.scene.load) {
        console.error("[BattleAssetLoader] Cannot load assets - scene or loader not available");
        return;
    }
    
    console.log("[BattleAssetLoader] Loading all battle assets...");
    this.loadUIAssets();
    this.loadCharacterAssets();
    this.loadStatusEffectIcons();
}
```

#### Part 2: Update BattleScene.preload() to Use the Combined Method
```javascript
// In BattleScene.js preload()
preload() {
    // Initialize BattleAssetLoader for all assets using single method
    if (window.BattleAssetLoader) {
        this.assetLoader = new BattleAssetLoader(this);
        this.assetLoader.loadAssets();
        
        // Store the status icon mapping returned by the loader
        this.statusIconMapping = this.assetLoader.initStatusIconMapping();
    } else {
        console.error("[BattleScene] BattleAssetLoader not available - falling back to minimal asset loading");
        
        // MINIMAL FALLBACK LOADING - just enough to show an error and basic functionality
        // Critical UI assets for error display
        this.load.image('return-button', 'assets/images/icons/return.png');
        this.load.image('character-circle', 'assets/images/ui/character-circle.png');
        
        // Minimal status effect placeholder
        this.load.image('status_placeholder', 'assets/images/icons/status/status-icons/placeholder.png');
        
        // Create minimal status mapping
        this.statusIconMapping = {
            'default': { key: 'status_placeholder', tint: 0xFFFFFF }
        };
        
        // Set a flag to show an error message to the user during create()
        this.showAssetLoadingError = true;
    }
}

// Then in create(), we'd add:
create() {
    // existing code...
    
    // Display error message if asset loading failed
    if (this.showAssetLoadingError) {
        this.createErrorMessage("Asset loading incomplete. Some visual elements may be missing.");
    }
    
    // existing code...
}

// Add a helper method for error messages
createErrorMessage(message) {
    const x = this.cameras.main.width / 2;
    const y = 100;
    const style = {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ff0000',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
    };
    
    const text = this.add.text(x, y, message, style).setOrigin(0.5);
    text.setDepth(1000); // Make sure it appears on top
}
```

#### Part 3: Final Testing and Verification
- Perform comprehensive testing of all battle functionality
- Verify all assets load correctly
- Check for any console errors or visual issues

## Verification Checklist

After implementing each stage, confirm:

1. **Functionality**:
   - All assets load correctly
   - UI components appear as expected
   - Character visuals display properly
   - Status effect icons show correctly

2. **Console Output**:
   - No errors or unexpected warnings
   - BattleAssetLoader logs appear as expected
   - Asset loading completes successfully

3. **Code Quality**:
   - BattleAssetLoader follows component design principles
   - Proper error handling for all operations
   - Clear logging for debugging
   - No duplicate asset loading

## Documentation Updates

After completing the refactoring:

1. **Update High-Level Changelog**:
   ```
   ### [0.6.4.0] - 2025-05-XX
   #### Changed
   - Refactored asset loading from BattleScene into dedicated BattleAssetLoader component
   - Improved separation of concerns in BattleScene
   - Reduced BattleScene complexity by ~XX lines
   ```

2. **Create Technical Changelog**:
   Create `Changelogs\Technical Changelogs\CHANGELOG_0.6.4.0_BattleAssetLoader.md` with:
   - Detailed explanation of the refactoring
   - Lines of code removed/added metrics
   - Benefits of the new component architecture
   - Any challenges or special considerations

## Key Improvements in This Approach

1. **Following Extract-Verify-Remove at Each Stage**:
   - Each stage extracts a specific part of asset loading
   - We verify functionality immediately after extraction
   - We remove the original code from BattleScene once verified
   - Only then do we proceed to the next stage

2. **Incremental Functionality Transfer**:
   - UI assets first (lowest risk, easiest to verify)
   - Character assets second
   - Status effect icons last (most complex with mapping)

3. **Progressive Risk Management**:
   - Early stages have fallbacks to original code
   - Later stages have more confident error handling
   - Complete removal only happens after each piece is verified

4. **Graceful Degradation**:
   - Minimal fallback loading ensures basic functionality even if the component fails
   - User-facing error message communicates issues clearly
   - Critical navigation elements remain functional