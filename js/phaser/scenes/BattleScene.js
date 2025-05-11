/**
 * BattleScene.js
 * Main scene for battle visualization in Phaser
 * This scene displays the battle between player and enemy teams.
 * It provides the visual representation layer that connects to
 * the BattleManager for game logic processing.
 * @version 0.6.4.9 (PhaserDebugManager implementation - Remove phase)
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
     * @param {Object} data - Battle configuration data from TeamBuilder
     */
    init(data) {
        console.log('BattleScene init with data:', data);
        this.battleConfig = data || {};

        // Store references to teams (with enhanced deep copying to prevent reference issues)
        try {
            if (this.battleConfig.playerTeam) {
                // Use deep copy with proper serialization/deserialization
                const serialized = JSON.stringify(this.battleConfig.playerTeam);
                this.playerTeam = JSON.parse(serialized);
                
                console.log(`BattleScene: Stored player team with ${this.playerTeam.length} heroes (deep copy)`);
                
                // Validate team data structure
                this.playerTeam.forEach((char, idx) => {
                    if (!char.stats) {
                        console.warn(`[BattleScene] Player character at index ${idx} (${char.name || 'unnamed'}) missing stats object`);
                        char.stats = { hp: 100, attack: 10, defense: 5, speed: 10 };
                    }
                });
            } else {
                this.playerTeam = [];
                console.warn('BattleScene: No player team provided');
            }
        
            if (this.battleConfig.enemyTeam) {
                // Use deep copy with proper serialization/deserialization
                const serialized = JSON.stringify(this.battleConfig.enemyTeam);
                this.enemyTeam = JSON.parse(serialized);
                
                console.log(`BattleScene: Stored enemy team with ${this.enemyTeam.length} heroes (deep copy)`);
                
                // Validate team data structure
                this.enemyTeam.forEach((char, idx) => {
                    if (!char.stats) {
                        console.warn(`[BattleScene] Enemy character at index ${idx} (${char.name || 'unnamed'}) missing stats object`);
                        char.stats = { hp: 100, attack: 10, defense: 5, speed: 10 };
                    }
                });
            } else {
                this.enemyTeam = [];
                console.warn('BattleScene: No enemy team provided');
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
        console.log(`BattleScene Initializing with Player Team Count: ${this.playerTeam.length}, Enemy Team Count: ${this.enemyTeam.length}`);
    }

    /**
     * Preload any assets needed for the battle scene
     */
    preload() {
        console.log('BattleScene preload starting...');

        // Try to set texture filtering to LINEAR (with error handling)
        // Note: Texture filtering is now handled in PhaserConfig.js via render settings instead
        // of trying to use textures.setFilter which isn't available in this version of Phaser
        console.log('BattleScene: Using config-level texture filtering instead of direct method');

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
        
        console.log('BattleScene preload finished.');
    }

    /**
     * Create the battle scene display
     * Sets up the basic scene elements and initializes the debug tools
     */
    create() {
        console.log('BattleScene create starting...');
        
        // Create turn indicator (using global window.TurnIndicator)
        try {
            // Use the globally registered TurnIndicator class
            if (window.TurnIndicator) {
                this.turnIndicator = new window.TurnIndicator(this);
                this.turnIndicator.setDepth(1); // Set depth to render below sprites but above background
                console.log('Turn indicator created successfully:', this.turnIndicator);
                // Verify the turnIndicator has the showAt method
                if (typeof this.turnIndicator.showAt !== 'function') {
                    console.error('WARNING: Created TurnIndicator but showAt method is missing!');
                }
            } else {
                console.error('ERROR: TurnIndicator class not found in window global scope');
                // Fallback: create a simple Graphics object if class not available
                this.turnIndicator = this.add.graphics();
                this.turnIndicator.setAlpha(0);
                // Add a basic showAt method to the graphics object for compatibility
                this.turnIndicator.showAt = (x, y, color, duration) => {
                    console.log('Using fallback showAt method');
                    this.turnIndicator.clear();
                    this.turnIndicator.setPosition(x, y);
                    this.turnIndicator.fillStyle(color, 0.7);
                    this.turnIndicator.fillCircle(0, 0, 30);
                    this.turnIndicator.setAlpha(0.7);
                };
                // Add hide method for compatibility
                this.turnIndicator.hide = (duration) => {
                    this.turnIndicator.clear();
                    this.turnIndicator.setAlpha(0);
                };
            }
        } catch (err) {
            console.error('Error creating TurnIndicator:', err);
            // Create fallback if error occurs
            this.turnIndicator = this.add.graphics();
            this.turnIndicator.setAlpha(0);
            this.turnIndicator.showAt = (x, y, color, duration) => {
                console.log('Using fallback showAt method after error');
                this.turnIndicator.clear();
                this.turnIndicator.setPosition(x, y);
                this.turnIndicator.fillStyle(color, 0.7);
                this.turnIndicator.fillCircle(0, 0, 30);
                this.turnIndicator.setAlpha(0.7);
            };
            this.turnIndicator.hide = (duration) => {
                this.turnIndicator.clear();
                this.turnIndicator.setAlpha(0);
            };
        }

        // Force Canvas smoothing specifically for this scene
        try {
            if (this.sys.game.renderer.type === Phaser.CANVAS) {
                // For Canvas renderer, we need to explicitly enable image smoothing
                const canvasContext = this.sys.canvas.getContext('2d', { willReadFrequently: true });
                canvasContext.imageSmoothingEnabled = true;
                canvasContext.imageSmoothingQuality = 'high';
                console.log('BattleScene: Canvas imageSmoothingEnabled set to true');
            }
        } catch (e) {
            console.warn('Could not configure Canvas smoothing', e);
        }

        try {
            console.log('BattleScene create: Initializing BattleUIManager...');
            // Initialize BattleUIManager for UI components
            this.initializeUIManager();

            console.log('BattleScene create: Initializing debug tools...');
            // Initialize debug tools through PhaserDebugManager if available
            this.initializeDebugManager();
            console.log('BattleScene create: Debug tools initialized.');

            console.log('BattleScene create: Initializing battle bridge...');
            // Initialize battle bridge if BattleManager is available
            this.initializeBattleBridge();
            console.log('BattleScene create: Battle bridge initialized.');

            console.log('BattleScene create: Initializing TeamDisplayManager...');
            // Initialize TeamDisplayManager for team and character visualization
            this.initializeTeamManager();
            console.log('BattleScene create: TeamDisplayManager initialized.');

            console.log('BattleScene create: Initializing BattleFXManager...');
            // Initialize BattleFXManager for visual effects
            this.initializeFXManager();
            console.log('BattleScene create: BattleFXManager initialized.');

            // If TeamDisplayManager is not available or failed, fall back to legacy method
            if (!this.teamManager || !this.playerTeamContainer) {
                console.log('BattleScene create: Falling back to legacy team creation...');
                // Create character teams for visualization
                this.createCharacterTeams(); // This now has internal try-catch blocks
                console.log('BattleScene create: Legacy character teams creation attempted.');
            }

            // Hide test pattern after teams are created (if UI manager exists)
            if (this.uiManager && (this.playerTeamContainer || this.enemyTeamContainer)) {
                this.uiManager.hideTestPattern();
            } else if (!this.uiManager) {
                console.warn('BattleScene: Cannot hide test pattern - UIManager not available');
            }

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
            
            // Test functions are registered by PhaserDebugManager
            if (this.debugManager) {
                console.log('BattleScene: Debug test functions registered through PhaserDebugManager');
            } else {
                console.warn('BattleScene: Debug test functions not available - PhaserDebugManager not initialized');
            }
            
            // The testTurnHighlightingDirectly function is now provided by PhaserDebugManager
            
            // Log that test functions are handled by PhaserDebugManager
            console.log('DIAGNOSTIC: Test functions are now managed by PhaserDebugManager');

            console.log('BattleScene created successfully');
        } catch (error) {
            // This outer catch handles errors in the main create flow
            console.error('FATAL Error in BattleScene create method:', error);
            this.showErrorMessage('FATAL: Failed to initialize battle scene: ' + error.message);
        }
    }

    /**
     * Initialize the BattleUIManager
     * @private
     */
    initializeUIManager() {
        try {
            // Check if BattleUIManager is available
            if (window.BattleUIManager) {
                console.log('BattleScene: Creating BattleUIManager instance');
                this.uiManager = new window.BattleUIManager(this);
                
                // Initialize all UI components
                if (this.uiManager.initializeUI()) {
                    console.log('BattleScene: BattleUIManager initialized successfully');
                } else {
                    console.warn('BattleScene: BattleUIManager initialization returned false');
                }
            } else {
                console.warn('BattleScene: BattleUIManager not found, using legacy UI creation');
                this.showErrorMessage('UI Manager not available - using legacy UI');
            }
        } catch (error) {
            console.error('BattleScene: Error initializing UI manager:', error);
            this.showErrorMessage('Failed to initialize UI: ' + error.message);
        }
    }

    /**
     * Initialize the TeamDisplayManager
     * @private
     */
    initializeTeamManager() {
        try {
            // Check if TeamDisplayManager is available
            if (window.TeamDisplayManager) {
                console.log('BattleScene: Creating TeamDisplayManager instance');
                
                // Create team data object with player and enemy teams
                const teamData = {
                    playerTeam: this.playerTeam || [],
                    enemyTeam: this.enemyTeam || []
                };
                
                // Create manager with scene and team data
                this.teamManager = new window.TeamDisplayManager(this, teamData);
                
                // Initialize teams and indicator
                if (this.teamManager.initialize()) {
                    console.log('BattleScene: TeamDisplayManager initialized successfully');
                    
                    // Store references to team containers for backward compatibility
                    this.playerTeamContainer = this.teamManager.playerTeamContainer;
                    this.enemyTeamContainer = this.teamManager.enemyTeamContainer;
                    
                    // Update event manager to use team manager if needed
                    if (this.eventManager && typeof this.eventManager.setTeamManager === 'function') {
                        this.eventManager.setTeamManager(this.teamManager);
                    }
                    
                    return true;
                } else {
                    console.warn('BattleScene: TeamDisplayManager initialization returned false');
                    return false;
                }
            } else {
                console.warn('BattleScene: TeamDisplayManager not found, using legacy team creation');
                return false;
            }
        } catch (error) {
            console.error('BattleScene: Error initializing team manager:', error);
            return false;
        }
    }

    /**
     * Create character teams for visualization
     * Sets up player and enemy teams with CharacterSprite components
     */
    createCharacterTeams() {
        console.log('Attempting to create character teams...'); // Log start

        // --- Player Team Creation ---
        try {
            console.log(`Creating player team container with ${this.playerTeam?.length || 0} characters.`);
            if (!this.playerTeam || this.playerTeam.length === 0) {
                 console.warn('Player team data is empty or missing!');
                 // Optionally create a placeholder if needed for testing, or just proceed
                 this.playerTeam = []; // Ensure it's an array
            }
            this.playerTeamContainer = new TeamContainer(
                this,
                this.playerTeam,
                true, // isPlayerTeam
                { x: 800, y: 600 }  // Correct position to match original implementation
            );
            console.log('Player team container created successfully.');
        } catch (error) {
            console.error('ERROR creating PLAYER TeamContainer:', error);
            this.showErrorMessage('Failed to create player team container: ' + error.message);
            // Optionally set playerTeamContainer to null or handle fallback
            this.playerTeamContainer = null;
        }

        // --- Enemy Team Creation ---
        try {
             console.log(`Checking enemy team with ${this.enemyTeam?.length || 0} characters.`);
            if (this.enemyTeam && this.enemyTeam.length > 0) {
                console.log('Creating enemy team container from provided data.');
                this.enemyTeamContainer = new TeamContainer(
                this,
                this.enemyTeam,
                false, // isPlayerTeam
                { x: 1200, y: 600 }  // Correct position to match original implementation
                );
                console.log('Enemy team container created successfully from data.');
            } else {
                console.warn('No enemy team provided or team is empty. Creating placeholder enemy.');
                const placeholderEnemyTeam = [
                    { name: 'Placeholder Enemy', type: 'neutral', team: 'enemy', stats: { hp: 50 }, id: 'placeholder_0' } // Added an ID
                ];
                this.enemyTeamContainer = new TeamContainer(
                    this,
                    placeholderEnemyTeam,
                    false, // isPlayerTeam
                    { x: 1150, y: 350 }
                );
                console.log('Placeholder enemy team container created successfully.');
                // Optionally update this.enemyTeam if needed elsewhere
                // this.enemyTeam = placeholderEnemyTeam;
            }
        } catch (error) {
            console.error('ERROR creating ENEMY TeamContainer (or placeholder):', error);
            this.showErrorMessage('Failed to create enemy team container: ' + error.message);
            // Optionally set enemyTeamContainer to null or handle fallback
            this.enemyTeamContainer = null;
        }

        console.log('Character teams creation process finished.');
    }


    
    /**
     * Clean up character teams
     */
    cleanupCharacterTeams() {
        try {
            if (this.playerTeamContainer) {
                this.playerTeamContainer.destroy();
                this.playerTeamContainer = null;
            }

            if (this.enemyTeamContainer) {
                this.enemyTeamContainer.destroy();
                this.enemyTeamContainer = null;
            }

            console.log('Character teams cleaned up');
        } catch (error) {
            console.error('Error cleaning up character teams:', error);
        }
    }

    /**
     * Update all active character visual indicators
     * Delegates to TeamDisplayManager if available
     * @param {Object} characterData - Character currently taking action
     */
    updateActiveCharacterVisuals(characterData) {
        // REFACTORING: Use TeamDisplayManager if available
        if (this.teamManager) {
            return this.teamManager.updateActiveCharacterVisuals(characterData);
        }
        
        // Original implementation follows
        try {
            if (!characterData) {
                console.warn('updateActiveCharacterVisuals: Missing character data');
                return;
            }
            
            console.log(`Updating active character visuals for ${characterData.name} (${characterData.team})`);
            
            // Clear turn indicators from all teams
            if (this.playerTeamContainer) this.playerTeamContainer.clearTurnIndicators();
            if (this.enemyTeamContainer) this.enemyTeamContainer.clearTurnIndicators();
            
            // Find the correct team container based on the character's team
            const teamContainer = characterData.team === 'player' 
                ? this.playerTeamContainer 
                : this.enemyTeamContainer;
                
            if (!teamContainer) {
                console.warn(`Could not find team container for team: ${characterData.team}`);
                return;
            }
            
            // Find the character sprite
            const characterSprite = teamContainer.getCharacterSpriteByName(characterData.name);
            
            if (characterSprite) {
                // Show the turn indicator for this character
                teamContainer.showTurnIndicator(characterData.name);
                
                // Update the UI text for current character's action using the UI manager
                if (this.uiManager) {
                    this.uiManager.updateActionTextDisplay(this.battleState.currentTurn, characterData);
                } else {
                    console.warn('Cannot update action text display - UIManager not available');
                }
                
                // Determine marker color based on team (blue for player, red for enemy)
                const markerColor = characterData.team === 'player' ? 0x4488ff : 0xff4444;
                
                // Calculate position (under the character)
                const targetX = characterSprite.container.x;
                const targetY = characterSprite.container.y + 40; // Adjust this offset for best visual placement
                
                // Get battle speed multiplier
                const speedMultiplier = this.battleManager?.speedMultiplier || 1;
                
                // Define base animation duration and adjust for battle speed
                const baseFadeDuration = 250;
                const fadeDuration = baseFadeDuration / speedMultiplier;
                
                // Show the floor indicator at the calculated position
                if (this.turnIndicator) {
                    this.turnIndicator.showAt(targetX, targetY, markerColor, fadeDuration);
                }
                
                console.log(`Turn indicator updated for ${characterData.name} at position: ${targetX},${targetY}`);
            } else {
                console.warn(`Could not find character sprite for: ${characterData.name}`);
                
                // Hide the floor indicator if we can't find the character
                if (this.turnIndicator) {
                    const baseFadeDuration = 250;
                    const speedMultiplier = this.battleManager?.speedMultiplier || 1;
                    const fadeDuration = baseFadeDuration / speedMultiplier;
                    this.turnIndicator.hide(fadeDuration);
                }
            }
        } catch (error) {
            console.error('Error updating active character visuals:', error);
        }
    }

    /**
     * Show attack animation between characters
     * Delegates to BattleFXManager
     * @param {Object} attacker - Attacking character
     * @param {Object} target - Target character
     * @param {Function} onComplete - Callback when animation completes
     * @param {Object} actionContext - Context about the action being animated
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
     * Initialize the BattleFXManager
     * @private
     */
    initializeFXManager() {
        try {
            // Check if BattleFXManager is available
            if (window.BattleFXManager) {
                console.log('BattleScene: Creating BattleFXManager instance');
                
                // Create manager with scene and TeamDisplayManager reference if available
                this.fxManager = new window.BattleFXManager(
                    this, 
                    this.teamManager || null
                );
                
                // Set reference in BattleEventManager if available
                if (this.eventManager && typeof this.eventManager.setFXManager === 'function') {
                    this.eventManager.setFXManager(this.fxManager);
                    console.log('BattleScene: Set BattleFXManager reference in BattleEventManager');
                }
                
                console.log('BattleScene: BattleFXManager initialized successfully');
                return true;
            } else {
                console.error('BattleScene: BattleFXManager not found - visual effects will not be available');
                this.showErrorMessage('Visual effects manager not available');
                return false;
            }
        } catch (error) {
            console.error('BattleScene: Error initializing FX manager:', error);
            this.showErrorMessage('Failed to initialize visual effects: ' + error.message);
            return false;
        }
    }

    /**
     * Show floating text above a character
     * Delegates to BattleFXManager
     * @param {Object} character - Character to show text above
     * @param {string} text - Text to display
     * @param {Object} style - Text style options
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
     * Initialize the PhaserDebugManager
     * @private
     */
    initializeDebugManager() {
        try {
            // Check if PhaserDebugManager is available
            if (window.PhaserDebugManager) {
                console.log('BattleScene: Creating PhaserDebugManager instance');
                
                // Create configuration from existing debug settings
                const debugConfig = {
                    enabled: this.debug.enabled,
                    showCoordinates: this.debug.showCoordinates,
                    showObjectInfo: this.debug.showObjectInfo
                };
                
                // Create manager with scene and config
                this.debugManager = new window.PhaserDebugManager(this, debugConfig);
                
                // Initialize debug tools
                const result = this.debugManager.initialize();
                console.log(`BattleScene: PhaserDebugManager initialization ${result ? 'successful' : 'failed'}`);
                return result;
            } else {
                console.error('BattleScene: PhaserDebugManager not found - debug tools will not be available');
                return false;
            }
        } catch (error) {
            console.error('BattleScene: Error initializing debug manager:', error);
            return false;
        }
    }





    /**
     * Initialize the bridge connection to BattleManager
     */
    initializeBattleBridge() {
        try {
            // Ensure turn indicator exists
            if (!this.turnIndicator) {
                try {
                    if (window.TurnIndicator) {
                        this.turnIndicator = new window.TurnIndicator(this);
                        this.turnIndicator.setDepth(1);
                    } else {
                        console.error('TurnIndicator class not found during bridge init');
                    }
                } catch (err) {
                    console.error('Error creating TurnIndicator during bridge init:', err);
                }
            }
            // Primary approach: Call the dedicated initialization function
            if (typeof window.initializeBattleBridge === 'function' && window.battleManager) {
                console.log('BattleScene: Calling initializeBattleBridge with BattleManager and BattleScene');
                const success = window.initializeBattleBridge(window.battleManager, this);
                if (success) {
                    console.log('BattleScene: Successfully initialized battle bridge');
                    // Get the bridge instance after initialization
                    this.battleBridge = window.getBattleBridge ? window.getBattleBridge() : window.battleBridge;
                    
                    // Initialize the BattleEventManager
                    this.initializeEventManager();
                } else {
                    console.warn('BattleScene: initializeBattleBridge reported failure');
                }
            }
            // Fallback #1: Use getBattleBridge accessor if available
            else if (typeof window.getBattleBridge === 'function') {
                console.log('BattleScene: Getting battleBridge through getBattleBridge()');
                this.battleBridge = window.getBattleBridge();
                
                // Initialize manually if needed
                if (this.battleBridge && window.battleManager && typeof this.battleBridge.initialize === 'function') {
                    console.log('BattleScene: Initializing battleBridge manually');
                    this.battleBridge.initialize(window.battleManager, this);
                    
                    // Initialize the BattleEventManager
                    this.initializeEventManager();
                }
            }
            // Fallback #2: Direct access as last resort
            else if (window.battleBridge && window.battleManager) {
                console.log('BattleScene: Using legacy direct access to battleBridge');
                this.battleBridge = window.battleBridge; // Use existing global INSTANCE
                this.battleBridge.initialize(window.battleManager, this); // Pass references
                
                // Initialize the BattleEventManager
                this.initializeEventManager();

                console.log('BattleBridge initialized and listeners set up.');
            } else {
                console.warn('battleBridge instance or BattleManager not found. Bridge not initialized.');
                // Add fallback to create instance if only the class exists
                if (window.BattleBridge && typeof window.BattleBridge === 'function' && window.battleManager) {
                    try {
                        console.log('Attempting to create battleBridge instance on-demand...');
                        this.battleBridge = new window.BattleBridge();
                        window.battleBridge = this.battleBridge; // Also make globally available
                        this.battleBridge.initialize(window.battleManager, this);
                        
                        // Initialize the BattleEventManager
                        this.initializeEventManager();
                        
                        console.log('Created battleBridge instance on-demand successfully');
                    } catch (instanceError) {
                        console.error('Failed to create battleBridge instance on-demand:', instanceError);
                    }
                }
            }
        } catch(error) {
            console.error('Error initializing BattleBridge:', error);
            this.showErrorMessage('Failed to connect to battle logic.');
        }
    }

    /**
     * Initialize the BattleEventManager
     * @private
     */
    initializeEventManager() {
        console.log('BattleScene.initializeEventManager: Starting with diagnostics:', {
            battleBridgeAvailable: !!this.battleBridge,
            battleEventManagerClassAvailable: typeof window.BattleEventManager === 'function',
            teamManagerAvailable: !!this.teamManager
        });
        
        try {
            if (this.battleBridge) {
                // DIAGNOSTIC: Check battleBridge's event type structure
                console.log('BattleScene.initializeEventManager: BattleBridge event types check:', {
                    hasEventTypes: !!this.battleBridge.eventTypes,
                    eventTypesList: this.battleBridge.eventTypes ? Object.keys(this.battleBridge.eventTypes) : 'none',
                    CHARACTER_ACTION: this.battleBridge.eventTypes?.CHARACTER_ACTION || 'undefined',
                    ABILITY_USED: this.battleBridge.eventTypes?.ABILITY_USED || 'undefined'
                });
                
                // Check if BattleEventManager is available
                if (window.BattleEventManager) {
                    console.log('[BattleScene.initializeEventManager] >>> About to create BattleEventManager instance.');
                    this.eventManager = new window.BattleEventManager(this, this.battleBridge);
                    console.log('[BattleScene.initializeEventManager] <<< BattleEventManager instance supposedly created. this.eventManager is:', this.eventManager);
                    
                    // DIAGNOSTIC: Verify the event manager was created properly
                    console.log('BattleScene.initializeEventManager: BattleEventManager created:', {
                        instanceCreated: !!this.eventManager,
                        hasOnCharacterAction: typeof this.eventManager?.onCharacterAction === 'function',
                        hasOnAbilityUsed: typeof this.eventManager?.onAbilityUsed === 'function'
                    });
                    
                    // Set TeamDisplayManager reference if available
                    if (this.teamManager && typeof this.eventManager.setTeamManager === 'function') {
                        this.eventManager.setTeamManager(this.teamManager);
                        console.log('BattleScene: Set TeamDisplayManager reference in BattleEventManager');
                    }
                    
                    console.log('BattleScene: BattleEventManager initialized successfully');
                } else {
                    console.warn('BattleScene: BattleEventManager not found, battle events will not be handled.');
                }
            } else {
                console.warn('BattleScene: Cannot initialize event manager - battleBridge not available');
            }
        } catch (error) {
            console.error('BattleScene: Error initializing event manager:', error);
            console.error('BattleScene: Error initializing event manager - battle events will not be handled.');
        }
    }

    /**
     * Cleanup the bridge connection
     */
    cleanupBattleBridge() {
        try {
            // Clean up the event manager first
            if (this.eventManager && typeof this.eventManager.destroy === 'function') {
                console.log('BattleScene: Cleaning up BattleEventManager');
                this.eventManager.destroy();
                this.eventManager = null;
            } else if (this.battleBridge) {
                // Legacy cleanup if no event manager is available
                this.battleBridge.removeEventListener(this.battleBridge.eventTypes.TURN_STARTED, this.handleTurnStarted.bind(this));
                console.log('BattleScene: Legacy event listener cleanup performed');
            }
            
            console.log('BattleScene: BattleBridge cleanup complete');
        } catch(error) {
            console.error('Error cleaning up BattleBridge:', error);
        }
    }





    /**
     * Get team data from scene
     * Delegates to TeamDisplayManager if available
     * @param {string} teamType - 'player' or 'enemy'
     * @returns {Array} - Deep copy of requested team data
     */
    getTeamData(teamType) {
        // REFACTORING: Use TeamDisplayManager if available
        if (this.teamManager) {
            return this.teamManager.getTeamData(teamType);
        }
        
        // Original implementation follows
        try {
            if (teamType === 'player' && this.playerTeam) {
                console.log(`BattleScene: Providing player team data with ${this.playerTeam.length} heroes`);
                return JSON.parse(JSON.stringify(this.playerTeam));
            } else if (teamType === 'enemy' && this.enemyTeam) {
                console.log(`BattleScene: Providing enemy team data with ${this.enemyTeam.length} heroes`);
                return JSON.parse(JSON.stringify(this.enemyTeam));
            } else {
                console.warn(`BattleScene: Unable to provide ${teamType} team data`);
                return [];
            }
        } catch (error) {
            console.error(`BattleScene: Error getting ${teamType} team data:`, error);
            return [];
        }
    }
    
    /**
     * Display battle outcome screen
     * Delegates to BattleUIManager
     * @param {string} winner - 'player', 'enemy', or 'draw'
     */
    showBattleOutcome(winner) {
        try {
            console.log(`BattleScene: Showing battle outcome - Winner: ${winner}`);
            
            if (this.uiManager) {
                this.uiManager.showBattleOutcome(winner);
            } else {
                console.error('BattleScene: BattleUIManager not available, cannot show battle outcome');
            }
        } catch (error) {
            console.error('Error showing battle outcome:', error);
        }
    }

    /**
     * Display error messages in the UI
     * Delegates to BattleUIManager
     * @param {string} message - The error message to show
     */
    showErrorMessage(message) {
        console.error('UI Error Message:', message); // Log to console

        if (this.uiManager) {
            this.uiManager.showErrorMessage(message);
        } else {
            console.error('BattleScene: BattleUIManager not available, cannot show error message');
        }
    }

    /**
     * Update loop for the battle scene
     * Called by Phaser on every frame to update game state
     * @param {number} time - Current time in ms since game start
     * @param {number} delta - Time in ms since last update
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
            console.error('Error in update loop:', error);
            // Don't show error messages here to avoid spamming the user
            // since this method is called many times per second
        }
    }

    /**
     * Scene shutdown handler
     * Clean up resources and listeners when the scene is stopped
     */
    shutdown() {
        console.log('BattleScene: Shutting down');

        try {
            // Clean up debug manager
            if (this.debugManager && typeof this.debugManager.destroy === 'function') {
                console.log('BattleScene: Cleaning up PhaserDebugManager');
                this.debugManager.destroy();
                this.debugManager = null;
            }

            // Clean up battle bridge (including event manager)
            this.cleanupBattleBridge();

            // Clean up TeamDisplayManager
            if (this.teamManager && typeof this.teamManager.destroy === 'function') {
                console.log('BattleScene: Cleaning up TeamDisplayManager');
                this.teamManager.destroy();
                this.teamManager = null;
            } else {
                // If TeamDisplayManager doesn't exist, use legacy cleanup
                this.cleanupCharacterTeams();
            }

            // Clean up UI manager
            if (this.uiManager && typeof this.uiManager.destroy === 'function') {
                console.log('BattleScene: Cleaning up BattleUIManager');
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
                console.log('BattleScene: Cleaning up BattleAssetLoader');
                this.assetLoader.destroy();
                this.assetLoader = null;
            }
            
            // Clean up FX manager
            if (this.fxManager && typeof this.fxManager.destroy === 'function') {
                console.log('BattleScene: Cleaning up BattleFXManager');
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

            console.log('BattleScene: Shut down successfully');
        } catch (error) {
            console.error('Error during scene shutdown:', error);
        }
    }
}

window.BattleScene = BattleScene;
