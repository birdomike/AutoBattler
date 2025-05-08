/**
 * BattleScene.js
 * Main scene for battle visualization in Phaser
 * This scene displays the battle between player and enemy teams.
 * It provides the visual representation layer that connects to
 * the BattleManager for game logic processing.
 * @version 0.6.2.1 (with BattleUIManager integration)
 */

import TurnIndicator from '../components/battle/TurnIndicator.js';
// Note: BattleEventManager and BattleUIManager are included via traditional script tags in index.html

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
        this.testPattern = null; // Initialize to null

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

        // Preload all character images in a centralized location
        try {
            // Basic placeholder asset
            this.load.image('character-circle', 'assets/images/icons/character-circle.png');
            
            // Preload all combat-optimized character art - this is the proper place to load assets
            const characterArt = [
                'Aqualia', 'Drakarion', 'Zephyr', 'Lumina', 
                'Sylvanna', 'Vaelgor', 'Seraphina' 
            ];
            
            // Special case for Caste due to parentheses in filename
            const casteKey = 'character_Caste';
            const castePath = 'assets/images/Character Art/Combat_Version/Caste.png';
            this.load.image(casteKey, castePath);
            console.log(`BattleScene: Preloading combat-optimized character image ${casteKey} from ${castePath}`);
            
            characterArt.forEach(name => {
                const key = `character_${name}`;
                // Use the combat-optimized versions of character art
                const path = `assets/images/Character Art/Combat_Version/${name}.png`;
                this.load.image(key, path);
                console.log(`BattleScene: Preloading combat-optimized character image ${key} from ${path}`);
            });
            
            console.log('BattleScene: Character art preload complete');
            
            // Preload status effect icons - call our dedicated method instead
            this.preloadStatusEffectIcons();
        } catch (error) {
            console.warn('BattleScene: Could not preload character art:', error);
        }
        
        console.log('BattleScene preload finished.');
    }

    /**
     * Create the battle scene display
     * Sets up the basic scene elements and initializes the debug tools
     */
    create() {
        console.log('BattleScene create starting...');
        
        // Create turn indicator (using static import from top of file)
        try {
            this.turnIndicator = new TurnIndicator(this);
            this.turnIndicator.setDepth(1); // Set depth to render below sprites but above background
            console.log('Turn indicator created successfully:', this.turnIndicator);
            // Verify the turnIndicator has the showAt method
            if (typeof this.turnIndicator.showAt !== 'function') {
                console.error('WARNING: Created TurnIndicator but showAt method is missing!');
            }
        } catch (err) {
            console.error('Error creating TurnIndicator:', err);
            // Fallback: create a simple Graphics object if instantiation fails
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
            // Initialize debug tools if available
            this.initializeDebugTools();
            console.log('BattleScene create: Debug tools initialized.');

            console.log('BattleScene create: Initializing battle bridge...');
            // Initialize battle bridge if BattleManager is available
            this.initializeBattleBridge();
            console.log('BattleScene create: Battle bridge initialized.');

            console.log('BattleScene create: Creating character teams...');
            // Create character teams for visualization
            this.createCharacterTeams(); // This now has internal try-catch blocks
            console.log('BattleScene create: Character teams creation attempted.');

            // Hide test pattern after teams are created
            if (this.uiManager && (this.playerTeamContainer || this.enemyTeamContainer)) {
                this.uiManager.hideTestPattern();
            }

            // Mark as initialized
            this.isInitialized = true;
            
            // Make test functions available globally for debugging
            window.testHealthUpdate = this.testHealthUpdate.bind(this);
            window.testActionIndicator = this.testActionIndicator.bind(this);

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
                { x: 800, y: 600 }  // Changed from 400 to 600
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
                { x: 1200, y: 600 }  // Changed from 400 to 600
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
                    { x: 1200, y: 400 }
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
     * Preload status effect icons with AI-generated versions
     */
    preloadStatusEffectIcons() {
        try {
            console.log('BattleScene: Preloading status effect icons...');
            
            // Initialize status icon mapping
            this.initStatusIconMapping();
            
            // Set the base path for status icons
            this.load.path = 'assets/images/icons/status/status-icons/';
            
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
                const iconPath = this.statusIconMapping[iconId] || `${iconId}.png`;
                this.load.image(key, iconPath);
                console.log(`BattleScene: Preloading status icon ${key} from ${iconPath}`);
            });
            
            // Reset the path after loading status icons
            this.load.path = '';
            
            console.log('BattleScene: Status effect icons preload complete');
        } catch (error) {
            console.warn('BattleScene: Could not preload status effect icons:', error);
        }
    }
    
    /**
     * Initialize the status icon mapping
     */
    initStatusIconMapping() {
        this.statusIconMapping = window.StatusIconMapper ? 
            window.StatusIconMapper.getMapping() : 
            {
                // Fallback mapping if StatusIconMapper isn't available
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
     * @param {Object} characterData - Character currently taking action
     */
    updateActiveCharacterVisuals(characterData) {
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
                
                // Update the UI text for current character's action
                // Use the UI manager if available, otherwise use the scene's method
                if (this.uiManager) {
                    this.uiManager.updateActionTextDisplay(this.battleState.currentTurn, characterData);
                } else {
                    this.updateActionTextDisplay(this.battleState.currentTurn, characterData);
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
     * @param {Object} attacker - Attacking character
     * @param {Object} target - Target character
     * @param {Function} onComplete - Callback when animation completes
     */
    showAttackAnimation(attacker, target, onComplete) {
        try {
            if (!attacker || !target) {
                if (onComplete) onComplete();
                return;
            }

            // Find sprites
            const attackerTeamContainer = attacker.team === 'player'
                ? this.playerTeamContainer
                : this.enemyTeamContainer;

            const targetTeamContainer = target.team === 'player'
                ? this.playerTeamContainer
                : this.enemyTeamContainer;

            if (!attackerTeamContainer || !targetTeamContainer) {
                if (onComplete) onComplete();
                return;
            }

            const attackerSprite = attackerTeamContainer.getCharacterSpriteByName(attacker.name);
            const targetSprite = targetTeamContainer.getCharacterSpriteByName(target.name);

            if (!attackerSprite || !targetSprite) {
                if (onComplete) onComplete();
                return;
            }

            attackerSprite.showAttackAnimation(targetSprite, onComplete);
        } catch (error) {
            console.error('Error showing attack animation:', error);
            if (onComplete) onComplete();
        }
    }

    /**
     * Show floating text above a character
     * @param {Object} character - Character to show text above
     * @param {string} text - Text to display
     * @param {Object} style - Text style options
     */
    showFloatingText(character, text, style = {}) {
        try {
            if (!character) return;

            const teamContainer = character.team === 'player'
                ? this.playerTeamContainer
                : this.enemyTeamContainer;

            if (!teamContainer) return;

            const sprite = teamContainer.getCharacterSpriteByName(character.name);

            if (!sprite) return;

            sprite.showFloatingText(text, style);
        } catch (error) {
            console.error('Error showing floating text:', error);
        }
    }

    /**
     * Initialize debug tools like coordinate display and object identifier
     */
    initializeDebugTools() {
        if (!this.debug.enabled) return;

        try {
            if (typeof CoordinateDisplay !== 'undefined' && this.debug.showCoordinates) {
                this.coordinateDisplay = new CoordinateDisplay(this);
                console.log('CoordinateDisplay initialized');
            } else if (this.debug.showCoordinates) {
                console.warn('CoordinateDisplay class not found.');
            }

            if (typeof ObjectIdentifier !== 'undefined' && this.debug.showObjectInfo) {
                this.objectIdentifier = new ObjectIdentifier(this);
                console.log('ObjectIdentifier initialized');
            } else if (this.debug.showObjectInfo) {
                console.warn('ObjectIdentifier class not found.');
            }
        } catch (error) {
            console.error('Error initializing debug tools:', error);
            this.showErrorMessage('Failed to load debug tools');
        }
    }

    /**
     * Cleanup debug tools
     */
    cleanupDebugTools() {
        try {
            if (this.coordinateDisplay && typeof this.coordinateDisplay.destroy === 'function') {
                this.coordinateDisplay.destroy();
                this.coordinateDisplay = null;
                console.log('CoordinateDisplay destroyed.');
            }
            if (this.objectIdentifier && typeof this.objectIdentifier.destroy === 'function') {
                this.objectIdentifier.destroy();
                this.objectIdentifier = null;
                console.log('ObjectIdentifier destroyed.');
            }
        } catch(error) {
            console.error('Error cleaning up debug tools:', error);
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
                    this.turnIndicator = new TurnIndicator(this);
                    this.turnIndicator.setDepth(1);
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
        try {
            if (this.battleBridge) {
                // Check if BattleEventManager is available
                if (window.BattleEventManager) {
                    console.log('BattleScene: Creating BattleEventManager instance');
                    this.eventManager = new window.BattleEventManager(this, this.battleBridge);
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
     * Test health bar updates manually (for debugging)
     * @param {string} teamType - 'player' or 'enemy'
     * @param {number} characterIndex - Index of the character in the team
     * @param {number} newHealth - New health value to set
     */
    testHealthUpdate(teamType = 'player', characterIndex = 0, newHealth = 50) {
        try {
            // Get the appropriate team container
            const teamContainer = teamType === 'player' ? this.playerTeamContainer : this.enemyTeamContainer;
            if (!teamContainer) {
                console.error(`testHealthUpdate: ${teamType} team container not found`);
                return;
            }
            
            // Get the character array for reference values
            const characterArray = teamType === 'player' ? this.playerTeam : this.enemyTeam;
            if (!characterArray || characterArray.length === 0) {
                console.error(`testHealthUpdate: ${teamType} team array is empty`);
                return;
            }
            
            // Validate characterIndex
            if (characterIndex < 0 || characterIndex >= characterArray.length) {
                console.error(`testHealthUpdate: Invalid character index ${characterIndex} for ${teamType} team`);
                return;
            }
            
            // Get character data
            const character = characterArray[characterIndex];
            const maxHealth = character.stats.hp || 100;
            
            // Update character's health in data structure
            character.currentHp = newHealth;
            
            // Create mock event data
            const mockEventData = {
                character: character,
                newHealth: newHealth,
                amount: character.currentHp - newHealth // Simulated damage/healing amount
            };
            
            // If we have an event manager, use it to dispatch the event
            if (this.eventManager) {
                const eventType = newHealth < character.currentHp ? 
                    this.battleBridge.eventTypes.CHARACTER_DAMAGED : 
                    this.battleBridge.eventTypes.CHARACTER_HEALED;
                
                this.battleBridge.dispatchEvent(eventType, mockEventData);
                
                console.log(`testHealthUpdate: Event dispatched for ${character.name}'s health to ${newHealth}/${maxHealth}`);
            } else {
                // Don't attempt to call methods that have been moved to the event manager
                console.warn('testHealthUpdate: BattleEventManager not available, cannot update health visually');
            }
            
            // Make function available in window for console testing
            window.testHealthUpdate = this.testHealthUpdate.bind(this);
        } catch (error) {
            console.error(`testHealthUpdate: Error:`, error);
        }
    }

    /**
     * Test action indicator manually (for debugging)
     * @param {string} teamType - 'player' or 'enemy'
     * @param {number} characterIndex - Index of the character in the team
     * @param {string} actionText - Action text to display
     */
    testActionIndicator(teamType = 'player', characterIndex = 0, actionText = 'Test Action') {
        try {
            // Get the appropriate team container
            const teamContainer = teamType === 'player' ? this.playerTeamContainer : this.enemyTeamContainer;
            if (!teamContainer) {
                console.error(`testActionIndicator: ${teamType} team container not found`);
                return;
            }
            
            // Get the character array for reference
            const characterArray = teamType === 'player' ? this.playerTeam : this.enemyTeam;
            if (!characterArray || characterArray.length === 0) {
                console.error(`testActionIndicator: ${teamType} team array is empty`);
                return;
            }
            
            // Validate characterIndex
            if (characterIndex < 0 || characterIndex >= characterArray.length) {
                console.error(`testActionIndicator: Invalid character index ${characterIndex} for ${teamType} team`);
                return;
            }
            
            // Get character data
            const character = characterArray[characterIndex];
            
            // Get character sprite
            const characterSprite = teamContainer.getCharacterSpriteByName(character.name);
            if (!characterSprite) {
                console.error(`testActionIndicator: Could not find sprite for ${character.name}`);
                return;
            }
            
            // Show action text
            characterSprite.showActionText(actionText);
            
            console.log(`testActionIndicator: Showed '${actionText}' for ${character.name} (${teamType} team)`);
        } catch (error) {
            console.error(`testActionIndicator: Error:`, error);
        }
    }

    /**
     * Get team data from scene
     * Returns copies of team data to prevent reference issues
     * @param {string} teamType - 'player' or 'enemy'
     * @returns {Array} - Deep copy of requested team data
     */
    getTeamData(teamType) {
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
     * Delegates to BattleUIManager if available
     * @param {string} winner - 'player', 'enemy', or 'draw'
     */
    showBattleOutcome(winner) {
        try {
            console.log(`BattleScene: Showing battle outcome - Winner: ${winner}`);
            
            // Use BattleUIManager if available
            if (this.uiManager) {
                this.uiManager.showBattleOutcome(winner);
                return;
            }
            
            // Legacy implementation if BattleUIManager is not available
            console.warn('BattleScene: BattleUIManager not available, using legacy outcome screen');
            
            // Create container for outcome elements
            const container = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2);
            container.setDepth(1000); // Ensure it appears above everything else
            
            // Add semi-transparent background
            const background = this.add.rectangle(
                0, 0, 
                this.cameras.main.width, 
                this.cameras.main.height, 
                0x000000, 0.7
            );
            container.add(background);
            
            // Create outcome message
            let message = '';
            let color = 0xffffff;
            
            // Handle different possible winner values
            if (winner === 'player' || winner === 'victory') {
                message = 'VICTORY!';
                color = 0x00ff00; // Green
            } else if (winner === 'enemy' || winner === 'defeat') {
                message = 'DEFEAT';
                color = 0xff0000; // Red
            } else if (winner === 'draw') {
                message = 'DRAW';
                color = 0xffff00; // Yellow
            } else {
                // Fallback for genuinely unexpected winner values
                console.warn(`[BattleScene] showBattleOutcome received unexpected winner value: '${winner}'. Defaulting UI to DRAW.`);
                message = 'DRAW';
                color = 0x808080; // Gray
            }
            
            // Add outcome text
            const outcomeText = this.add.text(
                0, -50,
                message,
                {
                    fontFamily: 'Arial',
                    fontSize: '64px',
                    color: `#${color.toString(16).padStart(6, '0')}`,
                    stroke: '#000000',
                    strokeThickness: 6,
                    align: 'center',
                    shadow: { color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 8 }
                }
            ).setOrigin(0.5);
            container.add(outcomeText);
            
            // Add return button
            const returnButton = this.add.text(
                0, 50,
                'Return to Team Builder',
                {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#ffffff',
                    backgroundColor: '#555555',
                    padding: { x: 20, y: 10 }
                }
            ).setOrigin(0.5).setInteractive({ useHandCursor: true });
            
            returnButton.on('pointerover', () => returnButton.setBackgroundColor('#777777'));
            returnButton.on('pointerout', () => returnButton.setBackgroundColor('#555555'));
            returnButton.on('pointerdown', () => {
                console.log('Return to Team Builder requested by user after battle');
                this.returnToTeamBuilder();
            });
            
            container.add(returnButton);
            
            // Add animation
            this.tweens.add({
                targets: container,
                scale: { from: 0.5, to: 1 },
                alpha: { from: 0, to: 1 },
                duration: 500,
                ease: 'Back.easeOut'
            });
            
            // Store reference to cleanup later
            this.outcomeContainer = container;
            
        } catch (error) {
            console.error('Error showing battle outcome:', error);
        }
    }

    /**
     * Display error messages in the UI
     * Delegates to BattleUIManager if available
     * @param {string} message - The error message to show
     */
    showErrorMessage(message) {
        console.error('UI Error Message:', message); // Log to console

        // Use BattleUIManager if available
        if (this.uiManager) {
            this.uiManager.showErrorMessage(message);
            return;
        }

        // Legacy implementation if BattleUIManager is not available
        try {
            // Create or update an error text object on the screen
            if (this.errorText) {
                this.errorText.setText(`ERROR: ${message}`);
            } else {
                this.errorText = this.add.text(
                    this.cameras.main.centerX,
                    30, // Position near top-center
                    `ERROR: ${message}`,
                    {
                        fontFamily: 'Arial',
                        fontSize: '16px',
                        color: '#ff0000', // Red color for errors
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: { x: 10, y: 5 },
                        wordWrap: { width: this.cameras.main.width - 40 }
                    }
                ).setOrigin(0.5, 0).setDepth(1001); // Ensure it's visible
            }
            // Optionally fade out the error after some time
            this.time.delayedCall(5000, () => {
                if (this.errorText) {
                    this.errorText.destroy();
                    this.errorText = null;
                }
            }, [], this);
        } catch (error) {
            console.error('Error showing error message:', error);
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
            // Clean up debug tools
            this.cleanupDebugTools();

            // Clean up battle bridge (including event manager)
            this.cleanupBattleBridge();

            // Clean up character teams
            this.cleanupCharacterTeams();

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
