/**
 * BattleScene.js
 * 
 * High-level orchestrator for the battle visualization system in Phaser.
 * 
 * This scene coordinates specialized manager components:
 * - BattleUIManager: Handles UI elements and error messages
 * - TeamDisplayManager: Controls team visualization and active character indicators
 * - BattleEventManager: Manages battle events and communications between systems
 * - BattleFXManager: Handles visual effects like floating text and animations
 * - BattleAssetLoader: Centralizes asset loading for battle elements
 * 
 * The scene initializes these components, manages their lifecycle, and
 * delegates functionality to them rather than implementing it directly.
 * 
 * @version 0.6.4.20 (Final Cleanup Stage 9: Documentation and Formatting)
 */

// TurnIndicator is loaded via traditional script in index.html
// Note: BattleEventManager, BattleUIManager, and TeamDisplayManager are included via traditional script tags in index.html

// Define the BattleScene class
export default class BattleScene extends Phaser.Scene {

    constructor() {
        super({
            key: 'BattleScene'
        });

        // Track initialization
        this.isInitialized = false;

        // Battle state
        this.battleState = {
            isStarted: false,
            isPaused: false,
            currentSpeed: 1,
            currentTurn: 0,
            activeCharacter: null
        };
        
        // Track active character data
        this.activeCharacter = null;
        
        // Track last turn event time for debouncing
        this.lastTurnEventTime = 0;

        // Debug settings
        this.debug = {
            enabled: true,
            showCoordinates: true,
            showObjectInfo: false
        };

        // References to battle components
        this.components = {};
        this.playerTeamContainer = null; // Initialize to null
        this.enemyTeamContainer = null; // Initialize to null

        // Make available globally for debugging
        window.BattleScene = this;
    }

    /**
     * Initialize the scene with battle configuration
     * Creates deep copies of team data to prevent reference issues during battle
     */
    init(data) {
        this.battleConfig = data || {};

        // Store references to teams (with enhanced deep copying to prevent reference issues)
        try {
            if (this.battleConfig.playerTeam) {
                // Use deep copy with proper serialization/deserialization
                const serialized = JSON.stringify(this.battleConfig.playerTeam);
                this.playerTeam = JSON.parse(serialized);
                
                // Validate team data structure
                this.playerTeam.forEach((char, idx) => {
                    if (!char.stats) {
                        console.warn(`[BattleScene] Player character at index ${idx} (${char.name || 'unnamed'}) missing stats object`);
                        char.stats = { hp: 100, attack: 10, defense: 5, speed: 10 };
                    }
                });
            } else {
                this.playerTeam = [];
                console.warn('[BattleScene] No player team provided');
            }
        
            if (this.battleConfig.enemyTeam) {
                // Use deep copy with proper serialization/deserialization
                const serialized = JSON.stringify(this.battleConfig.enemyTeam);
                this.enemyTeam = JSON.parse(serialized);
                
                // Validate team data structure
                this.enemyTeam.forEach((char, idx) => {
                    if (!char.stats) {
                        console.warn(`[BattleScene] Enemy character at index ${idx} (${char.name || 'unnamed'}) missing stats object`);
                        char.stats = { hp: 100, attack: 10, defense: 5, speed: 10 };
                    }
                });
            } else {
                this.enemyTeam = [];
                console.warn('[BattleScene] No enemy team provided');
            }
        } catch (error) {
            console.error('[BattleScene] Error processing team data:', error);
            // Create fallback empty teams
            this.playerTeam = [];
            this.enemyTeam = [];
        }

        // Track debug mode from URL parameter if present
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('debug')) {
            this.debug.enabled = urlParams.get('debug') !== 'false';
        }
    }

    /**
     * Preload assets needed for the battle scene via BattleAssetLoader
     * Returns early with minimal assets if BattleAssetLoader is unavailable
     */
    preload() {
        // Try to set texture filtering to LINEAR (with error handling)
        // Note: Texture filtering is now handled in PhaserConfig.js via render settings instead
        // of trying to use textures.setFilter which isn't available in this version of Phaser

        // Initialize BattleAssetLoader for all assets using a single component
        if (window.BattleAssetLoader) {
            this.assetLoader = new window.BattleAssetLoader(this);
            
            // Use unified asset loading method
            const assetData = this.assetLoader.loadAssets();
            
            // Process the asset loading results
            if (assetData.success) {
                console.log("[BattleScene] Asset loading completed successfully");
                this.statusIconMapping = assetData.statusIconMapping;
            } else {
                console.error("[BattleScene] Asset loading encountered issues:", assetData.errors);
                
                // Store status icon mapping if available, even with partial success
                this.statusIconMapping = assetData.statusIconMapping || {};
                
                // If status icon mapping is empty or invalid, use a minimal fallback
                if (!this.statusIconMapping || Object.keys(this.statusIconMapping).length === 0) {
                    console.warn("[BattleScene] Using minimal fallback for status icon mapping");
                    this.statusIconMapping = {
                        'default': 'AI_Icons/32px/Placeholder_AI.png'
                    };
                }
                
                // Set flag to show error message to the user
                this.showAssetLoadingError = true;
                
                // Generate more specific error message based on what failed
                let errorComponents = [];
                if (!assetData.uiAssetsLoaded) errorComponents.push("UI");
                if (!assetData.characterAssetsLoaded) errorComponents.push("Characters");
                if (!assetData.statusIconsLoaded) errorComponents.push("Status Effects");
                
                this.assetLoadingErrorDetails = errorComponents.length > 0 ?
                    `Failed to load: ${errorComponents.join(", ")}` : 
                    "Some assets failed to load";
            }
        } else {
            console.error("[BattleScene] BattleAssetLoader not available - falling back to minimal asset loading");
            
            // MINIMAL FALLBACK LOADING - just enough to show an error and basic functionality
            // Critical UI assets for error display
            this.load.image('return-button', 'assets/images/icons/return.png');
            
            // Minimal character assets for basic display
            this.load.image('character-circle', 'assets/images/icons/character-circle.png');
            
            // Minimal status effect placeholder
            this.load.image('status_placeholder', 'assets/images/icons/status/status-icons/AI_Icons/32px/Placeholder_AI.png');
            
            // Create minimal status mapping
            this.statusIconMapping = {
                'default': 'AI_Icons/32px/Placeholder_AI.png'
            };
            
            // Set a flag to show an error message to the user
            this.showAssetLoadingError = true;
        }
    }

    /**
     * Create the battle scene display
     * Initializes all manager components in the correct sequence
     * Displays error message if asset loading failed
     */
    create() {
        // Force Canvas smoothing specifically for this scene
        this.configureCanvasSmoothing();

        try {
            this.initializeUIManager();
            this.initializeDebugManager();
            this.initializeBattleBridge();
            this.initializeTeamManager();
            this.initializeFXManager();

            // Mark as initialized
            this.isInitialized = true;
            
            // Display error message if asset loading failed
            if (this.showAssetLoadingError) {
                // Show more specific error message if available
                const errorMessage = this.assetLoadingErrorDetails ?
                    `Asset loading incomplete. ${this.assetLoadingErrorDetails}` :
                    "Asset loading incomplete. UI elements may be missing.";
                
                this.showErrorMessage(errorMessage);
            }

            console.log('[BattleScene] Created successfully');
        } catch (error) {
            // This outer catch handles errors in the main create flow
            console.error('FATAL Error in BattleScene create method:', error);
            this.showErrorMessage('FATAL: Failed to initialize battle scene: ' + error.message);
        }
    }

    /**
     * Configures Canvas smoothing for improved visual quality
     * Must be called during scene creation to ensure proper rendering
     * @private
     */
    configureCanvasSmoothing() {
        try {
            if (this.sys.game.renderer.type === Phaser.CANVAS) {
                // For Canvas renderer, we need to explicitly enable image smoothing
                const canvasContext = this.sys.canvas.getContext('2d', { willReadFrequently: true });
                canvasContext.imageSmoothingEnabled = true;
                canvasContext.imageSmoothingQuality = 'high';
            }
        } catch (e) {
            console.warn('Could not configure Canvas smoothing', e);
        }
    }

    /**
     * Initializes the BattleUIManager component
     * Handles UI creation and error message display
     * @private
     * @returns {boolean} Success state
     */
    initializeUIManager() {
        try {
            if (!window.BattleUIManager) {
                console.error('[BattleScene] BattleUIManager not found - UI components will not be available');
                this.showErrorMessage('UI Manager not available');
                return false;
            }
            
            // Instantiate the manager
            this.uiManager = new window.BattleUIManager(this);
            
            // Initialize UI components
            const success = this.uiManager.initializeUI();
            if (!success) {
                console.error('[BattleScene] BattleUIManager initialization failed');
                this.showErrorMessage('Failed to initialize UI components');
                return false;
            }
            
            console.log('[BattleScene] BattleUIManager initialized successfully');
            return true;
        } catch (error) {
            console.error('[BattleScene] Error initializing UI manager:', error);
            this.showErrorMessage('Failed to initialize UI: ' + error.message);
            return false;
        }
    }

    /**
     * Initializes the TeamDisplayManager component
     * Handles team visualization and active character indicators
     * @private
     * @returns {boolean} Success state
     */
    initializeTeamManager() {
        try {
            if (!window.TeamDisplayManager) {
                console.error('[BattleScene] TeamDisplayManager not found - team display will not be available');
                this.showErrorMessage('Team display manager not available');
                return false;
            }
            
            // Create team data object
            const teamData = {
                playerTeam: this.playerTeam || [],
                enemyTeam: this.enemyTeam || []
            };
            
            // Instantiate the manager
            this.teamManager = new window.TeamDisplayManager(this, teamData);
            
            // Initialize teams and indicators
            const success = this.teamManager.initialize();
            if (!success) {
                console.error('[BattleScene] TeamDisplayManager initialization failed');
                this.showErrorMessage('Failed to initialize team display');
                return false;
            }
            
            // Store references to team containers for backward compatibility
            this.playerTeamContainer = this.teamManager.playerTeamContainer;
            this.enemyTeamContainer = this.teamManager.enemyTeamContainer;
            
            // Update event manager to use team manager if available
            if (this.eventManager && typeof this.eventManager.setTeamManager === 'function') {
                this.eventManager.setTeamManager(this.teamManager);
            }
            
            // Hide test pattern after teams are created
            if (this.uiManager && (this.playerTeamContainer || this.enemyTeamContainer)) {
                this.uiManager.hideTestPattern();
            } else if (!this.uiManager) {
                console.warn('[BattleScene] Cannot hide test pattern - UIManager not available');
            }
            
            console.log('[BattleScene] TeamDisplayManager initialized successfully');
            return true;
        } catch (error) {
            console.error('[BattleScene] Error initializing team manager:', error);
            this.showErrorMessage('Failed to initialize team display: ' + error.message);
            return false;
        }
    }



    /**
     * Delegates to TeamDisplayManager to update active character indicators
     */
    updateActiveCharacterVisuals(characterData) {
        if (!this.teamManager) {
            console.error('Cannot update active character visuals - TeamDisplayManager not available');
            return;
        }
        return this.teamManager.updateActiveCharacterVisuals(characterData);
    }

    /**
     * Shows attack animation between characters via BattleFXManager
     * Ensures callback is called even if animation fails
     */
    showAttackAnimation(attacker, target, onComplete, actionContext) {
        try {
            if (this.fxManager) {
                this.fxManager.showAttackAnimation(attacker, target, onComplete, actionContext);
            } else {
                console.error('[BattleScene] Cannot show attack animation - BattleFXManager not available');
                if (onComplete) onComplete(); // Ensure callback is called even if animation fails
            }
        } catch (error) {
            console.error('[BattleScene] Error showing attack animation:', error);
            if (onComplete) onComplete();
        }
    }

    /**
     * Initializes the BattleFXManager component
     * Handles visual effects like floating text and animations
     * @private
     * @returns {boolean} Success state
     */
    initializeFXManager() {
        try {
            if (!window.BattleFXManager) {
                console.error('[BattleScene] BattleFXManager not found - visual effects will not be available');
                this.showErrorMessage('Visual effects manager not available');
                return false;
            }
            
            // Instantiate the manager
            this.fxManager = new window.BattleFXManager(this, this.teamManager || null);
            
            // Set reference in BattleEventManager if available
            if (this.eventManager && typeof this.eventManager.setFXManager === 'function') {
                this.eventManager.setFXManager(this.fxManager);
            }
            
            console.log('[BattleScene] BattleFXManager initialized successfully');
            return true;
        } catch (error) {
            console.error('[BattleScene] Error initializing FX manager:', error);
            this.showErrorMessage('Failed to initialize visual effects: ' + error.message);
            return false;
        }
    }

    /**
     * Displays floating text above characters via BattleFXManager
     */
    showFloatingText(character, text, style = {}) {
        try {
            if (this.fxManager) {
                this.fxManager.showFloatingText(character, text, style);
            } else {
                console.error('[BattleScene] Cannot show floating text - BattleFXManager not available');
            }
        } catch (error) {
            console.error('[BattleScene] Error showing floating text:', error);
        }
    }

    /**
     * Initializes the PhaserDebugManager component
     * Handles debug tools and testing functions
     * @private
     * @returns {boolean} Success state
     */
    initializeDebugManager() {
        try {
            if (!window.PhaserDebugManager) {
                console.error('[BattleScene] PhaserDebugManager not found - debug tools will not be available');
                // Debug tools are not critical to gameplay, so no user-facing error message
                return false;
            }
            
            // Create debug configuration
            const debugConfig = {
                enabled: this.debug.enabled,
                showCoordinates: this.debug.showCoordinates,
                showObjectInfo: this.debug.showObjectInfo
            };
            
            // Instantiate the manager
            this.debugManager = new window.PhaserDebugManager(this, debugConfig);
            
            // Initialize debug tools
            const success = this.debugManager.initialize();
            if (!success) {
                console.error('[BattleScene] PhaserDebugManager initialization failed');
                this.showErrorMessage('Debug tools failed to initialize');
                return false;
            }
            
            // Log debug function registration status
            console.log('[BattleScene] Debug test functions registered through PhaserDebugManager');
            return true;
        } catch (error) {
            console.error('[BattleScene] Error initializing debug manager:', error);
            this.showErrorMessage('Debug tools initialization error: ' + error.message);
            return false;
        }
    }





    /**
     * Initializes the bridge connection to BattleManager
     * Uses multiple fallback approaches if primary method fails
     * @private
     * @returns {boolean} Success state
     */
    initializeBattleBridge() {
        try {
            // Primary approach: Use the centralized initialization function
            if (window.initializeBattleBridge && window.battleManager) {
                const success = window.initializeBattleBridge(window.battleManager, this);
                
                if (success) {
                    // Get the bridge instance after initialization
                    this.battleBridge = window.getBattleBridge ? window.getBattleBridge() : window.battleBridge;
                    
                    // Initialize the event manager now that we have battleBridge
                    this.initializeEventManager();
                    
                    console.log('[BattleScene] Battle bridge initialized successfully');
                    return true;
                } else {
                    console.error('[BattleScene] initializeBattleBridge reported failure');
                    this.showErrorMessage('Failed to initialize battle connection');
                    return false;
                }
            }
            
            // Fallback approach: Try to get or create battleBridge directly
            console.warn('[BattleScene] initializeBattleBridge function not available, trying fallback approaches');
            
            // Fallback 1: Use getBattleBridge accessor
            if (window.getBattleBridge && window.battleManager) {
                this.battleBridge = window.getBattleBridge();
                
                if (this.battleBridge) {
                    // Initialize manually if needed
                    if (typeof this.battleBridge.initialize === 'function') {
                        this.battleBridge.initialize(window.battleManager, this);
                    }
                    
                    this.initializeEventManager();
                    return true;
                }
            }
            
            // Fallback 2: Use direct access to global instance
            if (window.battleBridge && window.battleManager) {
                this.battleBridge = window.battleBridge;
                
                if (typeof this.battleBridge.initialize === 'function') {
                    this.battleBridge.initialize(window.battleManager, this);
                }
                
                this.initializeEventManager();
                return true;
            }
            
            // Fallback 3: Create new instance if only class is available
            if (window.BattleBridge && typeof window.BattleBridge === 'function' && window.battleManager) {
                this.battleBridge = new window.BattleBridge();
                window.battleBridge = this.battleBridge; // Make globally available
                
                if (typeof this.battleBridge.initialize === 'function') {
                    this.battleBridge.initialize(window.battleManager, this);
                }
                
                this.initializeEventManager();
                return true;
            }
            
            // All approaches failed
            console.error('[BattleScene] Could not initialize battle bridge - no valid approach found');
            this.showErrorMessage('Failed to connect to battle logic');
            return false;
        } catch (error) {
            console.error('[BattleScene] Error initializing BattleBridge:', error);
            this.showErrorMessage('Failed to connect to battle logic: ' + error.message);
            return false;
        }
    }

    /**
     * Initializes the BattleEventManager component
     * Requires battleBridge to be initialized first
     * @private
     * @returns {boolean} Success state
     */
    initializeEventManager() {
        try {
            if (!this.battleBridge) {
                console.error('[BattleScene] Cannot initialize event manager - battleBridge not available');
                this.showErrorMessage('Battle event system not available - connect to battle logic first');
                return false;
            }
            
            if (!window.BattleEventManager) {
                console.error('[BattleScene] BattleEventManager not found - battle events will not be handled');
                this.showErrorMessage('Battle event system not available');
                return false;
            }
            
            // Instantiate the manager
            this.eventManager = new window.BattleEventManager(this, this.battleBridge);
            
            // Set TeamDisplayManager reference if available
            if (this.teamManager && typeof this.eventManager.setTeamManager === 'function') {
                this.eventManager.setTeamManager(this.teamManager);
            }
            
            console.log('[BattleScene] BattleEventManager initialized successfully');
            return true;
        } catch (error) {
            console.error('[BattleScene] Error initializing event manager:', error);
            this.showErrorMessage('Failed to initialize battle events: ' + error.message);
            return false;
        }
    }

    /**
     * Cleans up the bridge connection and event manager
     */
    cleanupBattleBridge() {
        try {
            // Clean up the event manager
            if (this.eventManager && typeof this.eventManager.destroy === 'function') {
                console.log('[BattleScene] Cleaning up BattleEventManager');
                this.eventManager.destroy();
                this.eventManager = null;
            }
            
            console.log('[BattleScene] BattleBridge cleanup complete');
        } catch(error) {
            console.error('Error cleaning up BattleBridge:', error);
        }
    }





    /**
     * Delegates to TeamDisplayManager to retrieve team data
     * Returns empty array if TeamDisplayManager is unavailable
     */
    getTeamData(teamType) {
        if (!this.teamManager) {
            console.error(`Cannot get ${teamType} team data - TeamDisplayManager not available`);
            return [];
        }
        return this.teamManager.getTeamData(teamType);
    }
    
    /**
     * Displays battle outcome screen via BattleUIManager
     */
    showBattleOutcome(winner) {
        try {
            console.log(`[BattleScene] Showing battle outcome - Winner: ${winner}`);
            
            if (this.uiManager) {
                this.uiManager.showBattleOutcome(winner);
            } else {
                console.error('[BattleScene] BattleUIManager not available, cannot show battle outcome');
            }
        } catch (error) {
            console.error('Error showing battle outcome:', error);
        }
    }

    /**
     * Displays user-facing error messages through the BattleUIManager
     * Falls back to console error if BattleUIManager is unavailable
     */
    showErrorMessage(message) {
        console.error('[BattleScene] UI Error Message:', message); // Log to console

        if (this.uiManager) {
            this.uiManager.showErrorMessage(message);
        } else {
            console.error('[BattleScene] BattleUIManager not available, cannot show error message');
        }
    }

    /**
     * Updates game state on every frame
     * Handles debug tools and team container updates
     * Contains error handling to prevent errors from breaking the game loop
     */
    update(time, delta) {
        try {
            // Update debug tools if enabled
            if (this.debug.enabled) {
                if (this.objectIdentifier && typeof this.objectIdentifier.update === 'function') {
                    this.objectIdentifier.update();
                }
                // No separate update needed for CoordinateDisplay as it uses pointer events
            }

            // Update character teams if present
            if (this.playerTeamContainer) {
                this.playerTeamContainer.update();
            }

            if (this.enemyTeamContainer) {
                this.enemyTeamContainer.update();
            }
        } catch (error) {
            console.error('[BattleScene] Error in update loop:', error);
            // Don't show error messages here to avoid spamming the user
            // since this method is called many times per second
        }
    }

    /**
     * Cleans up resources when scene is stopped
     * Destroys all manager components and clears references
     */
    shutdown() {
        console.log('[BattleScene] Shutting down');

        try {
            // Clean up debug manager
            if (this.debugManager && typeof this.debugManager.destroy === 'function') {
                console.log('[BattleScene] Cleaning up PhaserDebugManager');
                this.debugManager.destroy();
                this.debugManager = null;
            }

            // Clean up battle bridge (including event manager)
            this.cleanupBattleBridge();

            // Clean up TeamDisplayManager
            if (this.teamManager && typeof this.teamManager.destroy === 'function') {
                console.log('[BattleScene] Cleaning up TeamDisplayManager');
                this.teamManager.destroy();
                this.teamManager = null;
            } else if (this.playerTeamContainer || this.enemyTeamContainer) {
                // Direct cleanup of any remaining team containers
                console.warn('[BattleScene] TeamDisplayManager not available - cleaning up containers directly');
                
                if (this.playerTeamContainer) {
                    this.playerTeamContainer.destroy();
                    this.playerTeamContainer = null;
                }
                
                if (this.enemyTeamContainer) {
                    this.enemyTeamContainer.destroy();
                    this.enemyTeamContainer = null;
                }
            }

            // Clean up UI manager
            if (this.uiManager && typeof this.uiManager.destroy === 'function') {
                console.log('[BattleScene] Cleaning up BattleUIManager');
                this.uiManager.destroy();
                this.uiManager = null;
            }

            // Clean up keyboard listeners
            if (this.input && this.input.keyboard) {
                this.input.keyboard.off('keydown-D', this.handleDebugKeypress, this);
            }

            // Clean up tweens
            this.tweens.killAll();
        
            // Clean up asset loader
            if (this.assetLoader && typeof this.assetLoader.destroy === 'function') {
                console.log('[BattleScene] Cleaning up BattleAssetLoader');
                this.assetLoader.destroy();
                this.assetLoader = null;
            }
            
            // Clean up FX manager
            if (this.fxManager && typeof this.fxManager.destroy === 'function') {
                console.log('[BattleScene] Cleaning up BattleFXManager');
                this.fxManager.destroy();
                this.fxManager = null;
            }

            // Clean up local references
            this.battleConfig = null;
            this.playerTeam = null;
            this.enemyTeam = null;
            this.components = {};
            
            // Clean up turn indicator
            if(this.turnIndicator) { 
                this.turnIndicator.destroy(); 
                this.turnIndicator = null; 
            }

            console.log('[BattleScene] Shut down successfully');
        } catch (error) {
            console.error('[BattleScene] Error during scene shutdown:', error);
        }
    }
}

window.BattleScene = BattleScene;
