/**
 * BattleScene.js
 * Main scene for battle visualization in Phaser
 * * This scene displays the battle between player and enemy teams.
 * It provides the visual representation layer that connects to
 * the BattleManager for game logic processing.
 * * @version 0.5.1.4 (with Turn Indicator feature)
 */

import TurnIndicator from '../components/battle/TurnIndicator.js';
// Note: BattleEventManager is included via traditional script tag in index.html

// Define the BattleScene class
export default class BattleScene extends Phaser.Scene {
    /**
     * Set up core event listeners for battle events
     */
    setupCoreEventListeners() {
        if (!this.battleBridge) {
            console.error('BattleScene: Cannot set up core event listeners - BattleBridge not connected');
            return;
        }
        
        // Listen for turn started events - only update turn number, not character highlight
        const boundHandler = this.handleTurnStarted.bind(this);
        // First, remove any existing listeners to prevent duplicates
        this.battleBridge.removeEventListener(this.battleBridge.eventTypes.TURN_STARTED, boundHandler);
        // Then add the listener with proper binding
        this.battleBridge.addEventListener(this.battleBridge.eventTypes.TURN_STARTED, (data) => {
            this.handleTurnStarted(data); // Call the handler (now only updates turn number)
        });
        console.log('TURN_STARTED event listener bound with correct context');
        
        // Listen for CHARACTER_ACTION events to update which character is active
        this.battleBridge.addEventListener(this.battleBridge.eventTypes.CHARACTER_ACTION, (data) => {
            console.log(`[BattleScene] >>> CHARACTER_ACTION Event Received. Character: ${data.character?.name} (Team: ${data.character?.team})`);
            this.updateActiveCharacterVisuals(data.character); // Update indicators for currently acting character
        });
        console.log('CHARACTER_ACTION event listener registered for turn indicator updates');
        
        // Add a test to verify the context
        setTimeout(() => {
            console.log('handleTurnStarted "this" context check:', this);
            console.log('Is turnIndicator available in context?', Boolean(this.turnIndicator));
        }, 1000);

        // Listen for character damaged events for floating text
        this.battleBridge.addEventListener(this.battleBridge.eventTypes.CHARACTER_DAMAGED, (data) => {
            console.log(`Bridge Event: ${data.target?.name} damaged by ${data.source?.name || 'effect'} for ${data.amount}`);
            this.showFloatingText(data.target, `-${data.amount}`, { color: '#ff0000' }); // Red for damage
        });

        // Listen for character healed events for floating text
        this.battleBridge.addEventListener(this.battleBridge.eventTypes.CHARACTER_HEALED, (data) => {
            console.log(`Bridge Event: ${data.target?.name} healed by ${data.source?.name || 'effect'} for ${data.amount}`);
            this.showFloatingText(data.target, `+${data.amount}`, { color: '#00ff00' }); // Green for healing
        });

        // Listen for battle ended events
        this.battleBridge.addEventListener(this.battleBridge.eventTypes.BATTLE_ENDED, (data) => {
            console.log(`Bridge Event: Battle ended. Result: ${data.winner}`);
            // Show battle outcome screen
            this.showBattleOutcome(data.winner);
        });
        
        // Listen for status effect events
        this.setupStatusEffectListeners();
        
        console.log('BattleScene: Core event listeners registered');
    }
    
    /**
     * Set up event listeners for status effects
     */
    setupStatusEffectListeners() {
        if (!this.battleBridge) {
            console.error('BattleScene: Cannot set up status effect listeners - BattleBridge not connected');
            return;
        }
        
        // Listen for STATUS_EFFECT_APPLIED events
        this.battleBridge.addEventListener(
            this.battleBridge.eventTypes.STATUS_EFFECT_APPLIED, 
            this.handleStatusEffectApplied.bind(this)
        );
        
        // Listen for STATUS_EFFECT_REMOVED events
        this.battleBridge.addEventListener(
            this.battleBridge.eventTypes.STATUS_EFFECT_REMOVED, 
            this.handleStatusEffectRemoved.bind(this)
        );
        
        // Listen for STATUS_EFFECT_UPDATED events
        this.battleBridge.addEventListener(
            this.battleBridge.eventTypes.STATUS_EFFECT_UPDATED, 
            this.handleStatusEffectUpdated.bind(this)
        );
        
        console.log('BattleScene: Status effect listeners registered');
    }
    
    /**
     * Handle status effect applied event
     * @param {Object} data - Event data including character and status effect info
     */
    handleStatusEffectApplied(data) {
        console.log(`BattleScene: handleStatusEffectApplied called with data:`, data);
        
        try {
            // Extract data safely with defaults
            const character = data.character;
            const statusId = data.statusId;
            const duration = data.duration || 0;
            const stacks = data.stacks || 1;
            const statusDefinition = data.statusDefinition || {};
            
            if (!character || !statusId) {
                console.warn('BattleScene: Status effect applied event missing character or statusId');
                return;
            }
            
            console.log(`BattleScene: Status effect applied - ${character.name} received ${statusId} for ${duration} turns`);
            
            // Determine which team the character belongs to
            const teamContainer = character.team === 'player' ? this.playerTeamContainer : this.enemyTeamContainer;
            
            if (!teamContainer) {
                console.warn(`BattleScene: Could not find team container for ${character.name}`);
                return;
            }
            
            // Get the character sprite
            const characterSprite = teamContainer.getCharacterSpriteByName(character.name);
            
            if (!characterSprite || !characterSprite.statusEffectContainer) {
                console.warn(`BattleScene: Could not find character sprite or status effect container for ${character.name}`);
                return;
            }
            
            // For visual feedback, show text above character
            const statusName = statusDefinition.name || statusId.replace('status_', '').toUpperCase();
            characterSprite.showFloatingText(`${statusName}`, { color: '#ffff00' }); // Yellow for status effects
            
            // Nothing more to do - the event will be handled by the StatusEffectContainer component
            // which listens directly to the same events via the battleBridge
        } catch (error) {
            console.error('BattleScene: Error handling status effect applied:', error);
        }
    }
    
    /**
     * Handle status effect removed event
     * @param {Object} data - Event data including character and status effect info
     */
    handleStatusEffectRemoved(data) {
        console.log(`BattleScene: handleStatusEffectRemoved called with data:`, data);
        
        try {
            // Extract data safely with defaults
            const character = data.character;
            const statusId = data.statusId;
            
            if (!character || !statusId) {
                console.warn('BattleScene: Status effect removed event missing character or statusId');
                return;
            }
            
            console.log(`BattleScene: Status effect removed - ${statusId} removed from ${character.name}`);
            
            // Determine which team the character belongs to
            const teamContainer = character.team === 'player' ? this.playerTeamContainer : this.enemyTeamContainer;
            
            if (!teamContainer) {
                console.warn(`BattleScene: Could not find team container for ${character.name}`);
                return;
            }
            
            // Get the character sprite
            const characterSprite = teamContainer.getCharacterSpriteByName(character.name);
            
            if (!characterSprite || !characterSprite.statusEffectContainer) {
                console.warn(`BattleScene: Could not find character sprite or status effect container for ${character.name}`);
                return;
            }
            
            // For visual feedback, show text above character
            const statusName = statusId.replace('status_', '').toUpperCase();
            characterSprite.showFloatingText(`${statusName} EXPIRED`, { color: '#aaaaaa' }); // Gray for expired status
            
            // Nothing more to do - the event will be handled by the StatusEffectContainer component
            // which listens directly to the same events via the battleBridge
        } catch (error) {
            console.error('BattleScene: Error handling status effect removed:', error);
        }
    }
    
    /**
     * Handle status effect updated event
     * @param {Object} data - Event data including character and status effect info
     */
    handleStatusEffectUpdated(data) {
        console.log(`BattleScene: handleStatusEffectUpdated called with data:`, data);
        
        // Nothing to do here - the event will be handled by the StatusEffectContainer component
        // which listens directly to the same events via the battleBridge
    }
    /**
     * Set up event listeners for character health updates
     */
    setupHealthUpdateListeners() {
        if (!this.battleBridge) {
            console.error('BattleScene: Cannot set up health update listeners - BattleBridge not connected');
            return;
        }
        
        // Listen for CHARACTER_DAMAGED events - use event type constants directly
        this.battleBridge.addEventListener(this.battleBridge.eventTypes.CHARACTER_DAMAGED, this.onCharacterDamaged.bind(this));
        
        // Listen for CHARACTER_HEALED events - use event type constants directly
        this.battleBridge.addEventListener(this.battleBridge.eventTypes.CHARACTER_HEALED, this.onCharacterHealed.bind(this));
        
        console.log('BattleScene: Health update listeners registered with event types:', {
            'damaged': this.battleBridge.eventTypes.CHARACTER_DAMAGED,
            'healed': this.battleBridge.eventTypes.CHARACTER_HEALED
        });
    }
    
    /**
     * Handle character damaged event
     * @param {Object} data - Event data including character and health info
     */
    onCharacterDamaged(data) {
        // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
        // TODO: REMOVE or MOVE after bug fix / refactoring
        console.log(`[HEALTH DEBUG] BattleScene.onCharacterDamaged entry: data received:`, data);
        // END TEMPORARY DIAGNOSTIC CODE
        
        // Debug log the full data received
        console.log(`BattleScene: onCharacterDamaged called with data:`, data);
        
        // Extract data safely with defaults
        const character = data.character || data.target;
        const newHealth = data.newHealth !== undefined ? data.newHealth : character.currentHp;
        const maxHealth = character?.stats?.hp || 100;
        
        // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
        // TODO: REMOVE or MOVE after bug fix / refactoring
        console.log(`[HEALTH DEBUG] Character info: id=${character?.id}, uniqueId=${character?.uniqueId}, name=${character?.name}, team=${character?.team}`);
        // END TEMPORARY DIAGNOSTIC CODE
        
        console.log(`BattleScene: Character damaged - ${character?.name} health now ${newHealth}/${maxHealth}`);
        
        // Determine which team the character belongs to
        const teamContainer = character?.team === 'player' ? this.playerTeamContainer : this.enemyTeamContainer;
        
        // Update the character's health bar
        if (teamContainer) {
            // Log available identifiers for debugging
            console.log(`Available identifiers for ${character?.name}:`, {
                id: character.id,
                uniqueId: character.uniqueId,
                name: character.name,
                team: character.team
            });
            
            // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
            // TODO: REMOVE or MOVE after bug fix / refactoring
            console.log(`[HEALTH DEBUG] BattleScene.onCharacterDamaged: Before calling findCharacterSprite for ${character?.name}`);
            // END TEMPORARY DIAGNOSTIC CODE
            
            // Use the new enhanced findCharacterSprite method that handles team-prefixed IDs
            const sprite = teamContainer.findCharacterSprite(character);
            
            if (sprite) {
                // Update the health directly on the sprite
                sprite.updateHealth(newHealth, maxHealth);
                console.log(`Health bar updated for ${character?.name} successfully using enhanced character finding`);
                return;
            }
            
            // If we get here, the character wasn't found - try using updateCharacterHealth directly
            // as it may have its own implementation for finding characters
            const updateResult = teamContainer.updateCharacterHealth(character, newHealth, maxHealth);
            console.log(`Health bar update for ${character?.name} result: ${updateResult ? 'success' : 'failed'} using fallback method`);
        } else {
            console.warn(`BattleScene: Could not find team container for ${character?.name}`);
        }
    }
    
    /**
     * Handle character healed event
     * @param {Object} data - Event data including character and health info
     */
    onCharacterHealed(data) {
        // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
        // TODO: REMOVE or MOVE after bug fix / refactoring
        console.log(`[HEALTH DEBUG] BattleScene.onCharacterHealed entry: data received:`, data);
        // END TEMPORARY DIAGNOSTIC CODE
        
        // Debug log the full data received
        console.log(`BattleScene: onCharacterHealed called with data:`, data);
        
        // Extract data safely with defaults
        const character = data.character || data.target;
        const newHealth = data.newHealth !== undefined ? data.newHealth : character.currentHp;
        const maxHealth = character?.stats?.hp || 100;
        
        // TEMPORARY DIAGNOSTIC CODE - HEALTH BAR BUG
        // TODO: REMOVE or MOVE after bug fix / refactoring
        console.log(`[HEALTH DEBUG] Character info: id=${character?.id}, uniqueId=${character?.uniqueId}, name=${character?.name}, team=${character?.team}`);
        // END TEMPORARY DIAGNOSTIC CODE
        
        console.log(`BattleScene: Character healed - ${character?.name} health now ${newHealth}/${maxHealth}`);
        
        // Determine which team the character belongs to
        const teamContainer = character?.team === 'player' ? this.playerTeamContainer : this.enemyTeamContainer;
        
        // Update the character's health bar
        if (teamContainer) {
            // Log available identifiers for debugging
            console.log(`Available identifiers for ${character?.name}:`, {
                id: character.id,
                uniqueId: character.uniqueId,
                name: character.name,
                team: character.team
            });
            
            // Use the new enhanced findCharacterSprite method that handles team-prefixed IDs
            const sprite = teamContainer.findCharacterSprite(character);
            
            if (sprite) {
                // Update the health directly on the sprite
                sprite.updateHealth(newHealth, maxHealth);
                console.log(`Health bar updated for ${character?.name} successfully using enhanced character finding`);
                return;
            }
            
            // If we get here, the character wasn't found - try using updateCharacterHealth directly
            // as it may have its own implementation for finding characters
            const updateResult = teamContainer.updateCharacterHealth(character, newHealth, maxHealth);
            console.log(`Health bar update for ${character?.name} result: ${updateResult ? 'success' : 'failed'} using fallback method`);
        } else {
            console.warn(`BattleScene: Could not find team container for ${character?.name}`);
        }
    }
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
            console.log('BattleScene create: Creating background...');
            // Create plain background for now
            this.createBackground();
            console.log('BattleScene create: Background created.');

            console.log('BattleScene create: Creating scene title...');
            // Add scene title for testing
            this.createSceneTitle();
            console.log('BattleScene create: Scene title created.');

            console.log('BattleScene create: Creating return button...');
            // Add return button (temporary)
            this.createReturnButton();
            console.log('BattleScene create: Return button created.');

            console.log('BattleScene create: Creating test pattern...');
            // Add test pattern to confirm rendering
            this.createTestPattern();
            console.log('BattleScene create: Test pattern created.');

            console.log('BattleScene create: Creating welcome message...');
            // Add welcome message to confirm battle data
            this.createWelcomeMessage();
            console.log('BattleScene create: Welcome message created.');

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

            console.log('BattleScene create: Creating debug panel...');
            // Add debug controls panel
            this.createDebugPanel();
            console.log('BattleScene create: Debug panel created.');
            
            console.log('BattleScene create: Creating battle controls...');
            // Add battle control panel
            this.createBattleControls();
            console.log('BattleScene create: Battle controls created.');
            
            console.log('BattleScene create: Creating battle log panel...');
            // Add battle log panel
            this.createBattleLogPanel();
            console.log('BattleScene create: Battle log panel created.');

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

        // Hide test pattern *only if* at least one container was successfully created
        if (this.testPattern && (this.playerTeamContainer || this.enemyTeamContainer)) {
             console.log('Hiding test pattern as character containers seem to exist.');
            this.testPattern.setVisible(false);
        } else if (this.testPattern) {
             console.warn('Not hiding test pattern because character container creation might have failed.');
        }
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
     * Handle turn started event
     * @param {Object} eventData - Event data for turn start
     */
    handleTurnStarted(eventData) {
        // --- Anti-Recursion Guard START ---
        const now = Date.now();
        const debounceTime = 100; // Only process if last event was > 100ms ago
        if (this.lastTurnEventTime && (now - this.lastTurnEventTime < debounceTime)) {
            console.warn(`[BattleScene] handleTurnStarted: Debouncing duplicate TURN_STARTED event for turn ${eventData?.turnNumber}. Ignoring.`);
            return; // Ignore likely duplicate event
        }
        this.lastTurnEventTime = now;
        // --- Anti-Recursion Guard END ---
        
        // Enhanced defensive check for this.turnIndicator
        if (!this.turnIndicator || typeof this.turnIndicator.showAt !== 'function') {
            console.warn('turnIndicator is missing or invalid inside handleTurnStarted', this.turnIndicator);
            
            // First check if we have a Text object instead of a TurnIndicator instance
            if (this.turnIndicator && this.turnIndicator.type === 'Text') {
                // Store the text indicator separately so we don't lose it
                this.turnTextIndicator = this.turnIndicator;
            }
            
            // Try to recreate the turn indicator if it's missing
            try {
                this.turnIndicator = new TurnIndicator(this);
                this.turnIndicator.setDepth(1);
            } catch (err) {
                console.error('Failed to create turn indicator:', err);
                
                // Create a fallback using Graphics
                try {
                    this.turnIndicator = this.add.graphics();
                    // Add a compatible showAt method
                    this.turnIndicator.showAt = (x, y, color, duration) => {
                        this.turnIndicator.clear();
                        this.turnIndicator.fillStyle(color, 0.7);
                        this.turnIndicator.fillCircle(x, y, 30);
                        this.turnIndicator.setAlpha(0.7);
                        
                        // Simple fade-in effect
                        this.turnIndicator.alpha = 0;
                        this.tweens.add({
                            targets: this.turnIndicator,
                            alpha: 0.7,
                            duration: duration || 300
                        });
                    };
                } catch (graphicsErr) {
                    console.error('Failed to create even fallback turn indicator:', graphicsErr);
                    return; // Exit the method if we can't create any indicator
                }
            }
        }
        
        // Get the new active character
        const newActiveCharacter = eventData.character || eventData.currentCharacter;
        
        if (!newActiveCharacter) {
            console.warn('Missing character data in TURN_STARTED event');
            return;
        }
        
        // Store the active character reference and update turn number
        this.activeCharacter = newActiveCharacter;
        this.battleState.currentTurn = eventData.turnNumber || this.battleState.currentTurn;
        
        // Update the turn number portion of the UI text - no longer handles turn indicator
        this.updateTurnNumberDisplay(this.battleState.currentTurn);
        
        console.log(`Turn ${this.battleState.currentTurn} started with first character: ${newActiveCharacter.name}`);
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
                this.updateActionTextDisplay(this.battleState.currentTurn, characterData);
                
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
     * Update the turn number display only
     * @param {number} turnNumber - The current turn number
     */
    /**
     * Safely gets or creates a text object
     * @param {string} objectKey - Reference property name ('turnTextIndicator', etc.)
     * @param {Object} position - {x, y} coordinates
     * @param {string} defaultText - Default text to display
     * @param {Object} style - Text style options
     * @returns {Phaser.GameObjects.Text} - Valid text object
     */
    safeGetTextObject(objectKey, position, defaultText, style) {
        try {
            // Check if the text object exists and is valid
            const currentObj = this[objectKey];
            
            if (currentObj && currentObj.active && !currentObj.destroyed) {
                // Object exists and is valid - return it
                return currentObj;
            }
            
            // Create new text object if needed
            console.log(`[BattleScene] Recreating ${objectKey} text object`);
            
            // Destroy old object if it exists but is invalid
            if (currentObj) {
                try {
                    currentObj.destroy();
                } catch (e) {
                    console.warn(`[BattleScene] Error destroying old ${objectKey}:`, e);
                }
            }
            
            // Create new text object
            const newObj = this.add.text(
                position.x,
                position.y,
                defaultText,
                style
            ).setOrigin(0.5);
            
            // Store for future reference
            this[objectKey] = newObj;
            
            return newObj;
        } catch (error) {
            console.error(`[BattleScene] Error in safeGetTextObject for ${objectKey}:`, error);
            return null;
        }
    }

    /**
     * Update the turn number display only
     * @param {number} turnNumber - The current turn number
     */
    updateTurnNumberDisplay(turnNumber) {
        try {
            // Define standard text style
            const indicatorStyle = {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: '#444444',
                padding: { x: 10, y: 5 }
            };
            
            // Position at the top of the screen
            const position = { 
                x: this.cameras.main.width / 2,
                y: 80
            };
            
            // Get character name from current text if available
            let characterName = '';
            if (this.turnTextIndicator && this.turnTextIndicator.text) {
                const characterNameMatch = this.turnTextIndicator.text.match(/: ([^']+)'s Action/i);
                characterName = characterNameMatch ? characterNameMatch[1] : '';
            }
            
            // Format text based on available information
            const text = characterName 
                ? `TURN ${turnNumber}: ${characterName}'s Action`
                : `TURN ${turnNumber}`;
                
            // Get or create text object safely
            const textObj = this.safeGetTextObject(
                'turnTextIndicator', 
                position, 
                text, 
                indicatorStyle
            );
            
            // If we got a valid text object, update it
            if (textObj) {
                try {
                    textObj.setText(text);
                    
                    // Add animation effect if not already animated
                    if (!this.tweens.isTweening(textObj)) {
                        this.tweens.add({
                            targets: textObj,
                            scale: { from: 0.8, to: 1 },
                            duration: 300,
                            ease: 'Back.easeOut'
                        });
                    }
                } catch (textError) {
                    console.error('[BattleScene] Error updating turn text:', textError);
                    // Reset for recreation next time
                    this.turnTextIndicator = null;
                }
            }
            
            console.log(`Turn number display updated to ${turnNumber}`);
        } catch (error) {
            console.error('Error updating turn number display:', error);
            // Reset for recreation next time
            this.turnTextIndicator = null;
        }
    }
    
    /**
     * Update the action text display with character information
     * @param {number} turnNumber - The current turn number
     * @param {Object} character - The character performing an action
     */
    /**
     * Update the action text display with character information
     * @param {number} turnNumber - The current turn number
     * @param {Object} character - The character performing an action
     */
    updateActionTextDisplay(turnNumber, character) {
        try {
            if (!character) return;
            
            // Background color based on team
            const backgroundColor = character.team === 'player' ? '#225588' : '#882255';
            
            // Create or update the text with character's information
            const text = `TURN ${turnNumber}: ${character.name}'s Action`;
            const indicatorStyle = {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: backgroundColor,
                padding: { x: 10, y: 5 }
            };
            
            // Position at the top of the screen
            const position = { 
                x: this.cameras.main.width / 2,
                y: 80
            };
            
            // Get or create text object safely
            const textObj = this.safeGetTextObject(
                'turnTextIndicator', 
                position, 
                text, 
                indicatorStyle
            );
            
            // If we got a valid text object, update it
            if (textObj) {
                try {
                    textObj.setText(text);
                    textObj.setBackgroundColor(backgroundColor);
                    
                    // Add or restart animation effect
                    this.tweens.killTweensOf(textObj);
                    this.tweens.add({
                        targets: textObj,
                        scale: { from: 0.9, to: 1 },
                        duration: 300,
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            // Only add bounce if object is still valid
                            if (textObj.active && !textObj.destroyed) {
                                this.tweens.add({
                                    targets: textObj,
                                    y: { from: 80, to: 85 },
                                    duration: 1500,
                                    yoyo: true,
                                    repeat: -1,
                                    ease: 'Sine.easeInOut'
                                });
                            }
                        }
                    });
                } catch (textError) {
                    console.error('[BattleScene] Error updating action text:', textError);
                    // Reset for recreation next time
                    this.turnTextIndicator = null;
                }
            }
            
            console.log(`Action text updated for ${character.name} on turn ${turnNumber}`);
        } catch (error) {
            console.error('Error updating action text display:', error);
            // Reset for recreation next time
            this.turnTextIndicator = null;
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
     * Create a test pattern to verify the scene is rendering correctly
     * This is a temporary visual element to confirm Phaser is working
     */
    createTestPattern() {
        try {
            // Create a container for test elements
            const testContainer = this.add.container(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2
            );

            // Add colorful circles in different positions
            const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
            const radius = 30;

            for (let i = 0; i < colors.length; i++) {
                const angle = (i / colors.length) * Math.PI * 2;
                const x = Math.cos(angle) * 100;
                const y = Math.sin(angle) * 100;

                const circle = this.add.circle(x, y, radius, colors[i], 0.8);
                testContainer.add(circle);

                // Add pulsing animation
                this.tweens.add({
                    targets: circle,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 500 + (i * 100),
                    yoyo: true,
                    repeat: -1
                });
            }

            // Add version text
            const versionText = this.add.text(0, 0, 'Battle Scene v0.5.0.4b', { // *** UPDATED VERSION ***
                fontFamily: 'Arial',
                fontSize: 16,
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);

            testContainer.add(versionText);

            // Store reference
            this.testPattern = testContainer;

            console.log('Test pattern created successfully');
        } catch (error) {
            console.error('Error creating test pattern:', error);
        }
    }

    /**
     * Create a welcome message showing battle data
     * Displays player team and enemy team information
     */
    createWelcomeMessage() {
        try {
            // Create player team summary
            const playerTeamNames = this.playerTeam.map(character => character.name).join(', ');
            const playerTeamText = `Player Team (${this.playerTeam.length}): ${playerTeamNames || 'None'}`;

            // Create enemy team summary
            // Ensure enemyTeam is an array before mapping
            const safeEnemyTeam = Array.isArray(this.enemyTeam) ? this.enemyTeam : [];
            const enemyTeamNames = safeEnemyTeam.map(character => character.name).join(', ');
            const enemyTeamText = `Enemy Team (${safeEnemyTeam.length}): ${enemyTeamNames || 'None'}`;

            // Create battle mode text
            const battleModeText = `Battle Mode: ${this.battleConfig.battleMode || 'Unknown'}`;

            // Create welcome message
            const welcomeText = this.add.text(
                this.cameras.main.width / 2,
                120,
                `Battle Scene Initialized!\n${playerTeamText}\n${enemyTeamText}\n${battleModeText}`,
                {
                    fontFamily: 'Arial',
                    fontSize: 20,
                    color: '#ffffff',
                    align: 'center',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setOrigin(0.5);

            // Add to scene
            this.welcomeMessage = welcomeText;

            console.log('Welcome message created successfully');
        } catch (error) {
            console.error('Error creating welcome message:', error);
        }
    }

    /**
     * Create the background for the battle scene
     */
    createBackground() {
        try {
            // Create a gradient background
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;

            // Create background rectangle
            this.add.rectangle(
                width / 2,
                height / 2,
                width,
                height,
                0x333344 // Navy blue color
            );

            // Add some visual interest with diagonal lines
            const graphics = this.add.graphics();
            graphics.lineStyle(2, 0xffffff, 0.1);

            // Draw grid lines
            const spacing = 80;
            for (let i = 0; i < width + height; i += spacing) {
                graphics.moveTo(0, i);
                graphics.lineTo(i, 0);
            }

            graphics.strokePath();

            console.log('Background created successfully');
        } catch (error) {
            console.error('Error creating background:', error);
        }
    }

    /**
     * Create the scene title
     */
    createSceneTitle() {
        try {
            this.sceneTitle = this.add.text(
                this.cameras.main.width / 2,
                50,
                'Battle Scene',
                {
                    fontFamily: 'Arial',
                    fontSize: 36,
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            ).setOrigin(0.5);

            // Add simple animation
            this.tweens.add({
                targets: this.sceneTitle,
                y: 40,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            console.log('Scene title created successfully');
        } catch (error) {
            console.error('Error creating scene title:', error);
        }
    }

    /**
     * Create the return button to go back to the TeamBuilder
     */
     createReturnButton() {
         // ** Implementation Added for v0.5.0.4b Fix **
         try {
             const button = this.add.text(
                 this.cameras.main.width - 100,
                 50,
                 'Return',
                 {
                     fontFamily: 'Arial',
                     fontSize: '20px',
                     color: '#ffffff',
                     backgroundColor: '#555555',
                     padding: { x: 15, y: 8 }
                 }
             ).setOrigin(0.5).setInteractive({ useHandCursor: true });

             button.on('pointerdown', () => {
                 console.log('Return button clicked');
                 this.returnToTeamBuilder();
             });

             button.on('pointerover', () => {
                 button.setBackgroundColor('#777777');
             });

             button.on('pointerout', () => {
                 button.setBackgroundColor('#555555');
             });

             this.returnButton = button;
             console.log('Return button created successfully');
         } catch (error) {
             console.error('Error creating return button:', error);
             this.showErrorMessage('Failed to create return button');
         }
     }

     /**
     * Handle returning to the TeamBuilder scene/UI
     */
     returnToTeamBuilder() {
         try {
             console.log('Returning to Team Builder...');
             
             // Clean up battle state
             if (window.battleBridge) {
                 window.battleBridge.cleanupBattleState();
             }

             // Stop the current scene properly
             this.scene.stop();

             // Hide Phaser container and show DOM UI
             const phaserContainer = document.getElementById('game-container');
             if (phaserContainer) {
                 phaserContainer.style.display = 'none';
             }
             const teamBuilderContainer = document.getElementById('team-builder-container');
             if (teamBuilderContainer) {
                 teamBuilderContainer.style.display = 'block'; // Or 'flex' depending on your CSS
             }

             // Optionally, notify TeamBuilderUI if it exists
             if (window.teamBuilderUI && typeof window.teamBuilderUI.onReturnFromPhaserBattle === 'function') {
                 window.teamBuilderUI.onReturnFromPhaserBattle();
             } else {
                 console.warn('TeamBuilderUI or onReturnFromPhaserBattle not found.');
             }

         } catch (error) {
             console.error('Error returning to Team Builder:', error);
             // Add fallback in case of error during transition
             alert('Error returning to Team Builder. Please refresh if needed.');
             const teamBuilderContainer = document.getElementById('team-builder-container');
             if (teamBuilderContainer) teamBuilderContainer.style.display = 'block';
         }
     }

    /**
     * Initialize debug tools like coordinate display and object identifier
     */
     initializeDebugTools() {
        // ** Implementation Added for v0.5.0.4b Fix **
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
         // ** Implementation Added for v0.5.0.4b Fix **
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
         // ** Refactored for v0.6.1.1 - BattleEventManager implementation **
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
                      console.warn('BattleScene: BattleEventManager not found, using legacy event setup');
                      // Fallback to legacy approach if BattleEventManager is not available
                      this.setupHealthUpdateListeners();
                      this.setupActionIndicatorListeners();
                      this.setupCoreEventListeners();
                  }
              } else {
                  console.warn('BattleScene: Cannot initialize event manager - battleBridge not available');
              }
          } catch (error) {
              console.error('BattleScene: Error initializing event manager:', error);
              // Fallback to legacy approach if there's an error
              this.setupHealthUpdateListeners();
              this.setupActionIndicatorListeners();
              this.setupCoreEventListeners();
          }
     }

     /**
      * Cleanup the bridge connection
      */
      cleanupBattleBridge() {
         // ** Refactored for v0.6.1.1 - BattleEventManager implementation **
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
      * Create the debug controls panel
      */
      createDebugPanel() {
          // Debug panel disabled to avoid UI clutter
          return; // Skip creating debug panel entirely
      }


     /**
     * Create the battle log for displaying battle events
     */
     createBattleLogPanel() {
        try {
            // Check if DirectBattleLog class exists
            if (typeof DirectBattleLog === 'function') {
                // Calculate half screen height for max height constraint
                const halfScreenHeight = this.cameras.main.height * 0.5;
                
                // Create the direct battle log in the right side of the screen
                this.battleLog = new DirectBattleLog(
                    this, 
                    this.cameras.main.width - 350, // X position (right side)
                    50,                            // Y position (top)
                    300,                           // Width
                    {
                        backgroundColor: 0x000000,
                        backgroundAlpha: 0.5,
                        fontSize: 16,
                        maxMessages: 30,
                        padding: 10,
                        maxHeight: halfScreenHeight // Limit height to half the screen
                    }
                );
                
                // For testing only - send a test message through BattleBridge if available
                if (this.battleBridge) {
                    console.log('BattleScene: Sending test message through BattleBridge');
                    this.battleBridge.dispatchEvent(this.battleBridge.eventTypes.BATTLE_LOG, {
                        message: 'Test message from BattleScene via BattleBridge',
                        type: 'info'
                    });
                } else {
                    console.warn('BattleScene: BattleBridge not available for test message');
                }
                
                // Add direct access for testing in console
                window.battleLog = this.battleLog;
                
                console.log('Battle log created successfully');
            } else {
                console.error('DirectBattleLog class not found');
                this.showErrorMessage('Battle log not available');
            }
        } catch (error) {
            console.error('Error creating battle log:', error);
            this.showErrorMessage('Failed to create battle log');
        }
    }
    
    /**
     * Create the battle control panel
     * Adds UI controls for starting battle, changing speed, pausing/resuming
     */
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
            
            // Call the appropriate event handler
            if (newHealth < character.currentHp) {
                console.log(`Testing damage event for ${character.name} (${teamType} team) to ${newHealth}/${maxHealth}`);
                this.onCharacterDamaged(mockEventData);
            } else {
                console.log(`Testing healing event for ${character.name} (${teamType} team) to ${newHealth}/${maxHealth}`);
                this.onCharacterHealed(mockEventData);
            }
            
            console.log(`testHealthUpdate: Updated ${character.name}'s health to ${newHealth}/${maxHealth}`);
            
            // Make function available in window for console testing
            window.testHealthUpdate = this.testHealthUpdate.bind(this);
        } catch (error) {
            console.error(`testHealthUpdate: Error:`, error);
        }
    }

    /**
     * Set up event listeners for character actions
     */
    setupActionIndicatorListeners() {
        if (!this.battleBridge) {
            console.error('BattleScene: Cannot set up action listeners - BattleBridge not connected');
            return;
        }
        
        // Listen for CHARACTER_ACTION events - this will now handle turn indicators too
        this.battleBridge.addEventListener(this.battleBridge.eventTypes.CHARACTER_ACTION, this.onCharacterAction.bind(this));
        
        // Listen for ABILITY_USED events
        this.battleBridge.addEventListener(this.battleBridge.eventTypes.ABILITY_USED, this.onAbilityUsed.bind(this));
        
        console.log('BattleScene: Action indicator listeners registered');
    }
    
    /**
     * Handle character action event
     * @param {Object} data - Event data including character and action info
     */
    onCharacterAction(data) {
        console.log(`BattleScene: onCharacterAction called with data:`, data);
        
        try {
            // Extract data safely with defaults
            const character = data.character;
            
            // Extract action info from the action object
            const action = data.action || {};
            const actionType = action.type || 'autoAttack';
            const actionName = action.name || (actionType === 'ability' ? action.abilityName : actionType);
            
            if (!character) {
                console.warn('BattleScene: Character action event missing character data');
                return;
            }
            
            console.log(`BattleScene: Character action - ${character.name} performing ${actionType}: ${actionName}`);
            
            // Update the active character visuals for the turn indicator and UI text
            this.updateActiveCharacterVisuals(character);
            
            // Determine which team the character belongs to
            const teamContainer = character.team === 'player' ? this.playerTeamContainer : this.enemyTeamContainer;
            
            if (!teamContainer) {
                console.warn(`BattleScene: Could not find team container for ${character.name}`);
                return;
            }
            
            // Get the character sprite
            const characterSprite = teamContainer.getCharacterSpriteByName(character.name);
            
            if (!characterSprite) {
                console.warn(`BattleScene: Could not find character sprite for ${character.name}`);
                return;
            }
            
            // Format the action text based on the action type
            let actionText = '';
            
            if (actionType === 'autoAttack') {
                actionText = 'Auto Attack';
            } else if (actionType === 'ability') {
                actionText = `Ability: ${actionName}`;
            } else if (actionType === 'status') {
                actionText = `Status: ${actionName}`;
            } else {
                actionText = actionName;
            }
            
            // Show the action text above the character
            characterSprite.showActionText(actionText);
            
        } catch (error) {
            console.error('BattleScene: Error handling character action:', error);
        }
    }
    
    /**
     * Handle ability used event
     * @param {Object} data - Event data including character and ability info
     */
    onAbilityUsed(data) {
        console.log(`BattleScene: onAbilityUsed called with data:`, data);
        
        try {
            // Extract data safely with defaults
            const character = data.character || data.source;
            const ability = data.ability || {};
            const abilityName = ability.name || 'Unknown Ability';
            
            if (!character) {
                console.warn('BattleScene: Ability used event missing character data');
                return;
            }
            
            console.log(`BattleScene: Ability used - ${character.name} using ${abilityName}`);
            
            // Determine which team the character belongs to
            const teamContainer = character.team === 'player' ? this.playerTeamContainer : this.enemyTeamContainer;
            
            if (!teamContainer) {
                console.warn(`BattleScene: Could not find team container for ${character.name}`);
                return;
            }
            
            // Get the character sprite
            const characterSprite = teamContainer.getCharacterSpriteByName(character.name);
            
            if (!characterSprite) {
                console.warn(`BattleScene: Could not find character sprite for ${character.name}`);
                return;
            }
            
            // Show the ability text above the character
            characterSprite.showActionText(`Ability: ${abilityName}`);
            
        } catch (error) {
            console.error('BattleScene: Error handling ability used:', error);
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
    
     createBattleControls() {
     try {
     // Create debug test buttons (only in development mode)
     if (this.debug.enabled) {
          // Create button for testing action indicators
          const actionTestButton = this.add.text(
              100, 90, 'Test Action', {
                  fontFamily: 'Arial',
                  fontSize: '16px',
                  color: '#ffffff',
                  backgroundColor: '#333333',
                  padding: { x: 10, y: 5 }
              }
          ).setInteractive({ useHandCursor: true });
          
          actionTestButton.on('pointerdown', () => {
              // Test showing action indicator for player team character at index 0
              if (this.playerTeam && this.playerTeam.length > 0) {
                  this.testActionIndicator('player', 0, 'Ability: Fireball');
              }
          });
          
          actionTestButton.on('pointerover', () => actionTestButton.setBackgroundColor('#555555'));
          actionTestButton.on('pointerout', () => actionTestButton.setBackgroundColor('#333333'));
          
          // Create button for testing health bar updates
                  const testButton = this.add.text(
                      100, 50, 'Test Health', {
                          fontFamily: 'Arial',
                          fontSize: '16px',
                          color: '#ffffff',
                          backgroundColor: '#333333',
                          padding: { x: 10, y: 5 }
                      }
                  ).setInteractive({ useHandCursor: true });
                  
                  testButton.on('pointerdown', () => {
                      // Test player team character at index 0 with 50% health
                      if (this.playerTeam && this.playerTeam.length > 0) {
                          const character = this.playerTeam[0];
                          const maxHealth = character.stats.hp;
                          const newHealth = Math.floor(maxHealth * 0.5); // 50% health
                          this.testHealthUpdate('player', 0, newHealth);
                      }
                  });
                  
                  testButton.on('pointerover', () => testButton.setBackgroundColor('#555555'));
                  testButton.on('pointerout', () => testButton.setBackgroundColor('#333333'));
              }
              
              // Create the battle control panel at the bottom of the screen
              if (typeof BattleControlPanel === 'function') {
                 this.battleControlPanel = new BattleControlPanel(
                     this,
                     this.cameras.main.width / 2, // center horizontally
                     this.cameras.main.height - 50 // position near bottom
                 );
                 
                 // Set up event listeners for battle events
                 if (this.battleBridge) {
                     // Listen for battle events to update control panel
                     this.battleBridge.addEventListener(this.battleBridge.eventTypes.BATTLE_STARTED, 
                         (data) => this.battleControlPanel.onBattleEvent(data));
                     this.battleBridge.addEventListener(this.battleBridge.eventTypes.BATTLE_ENDED, 
                         (data) => this.battleControlPanel.onBattleEvent(data));
                     this.battleBridge.addEventListener(this.battleBridge.eventTypes.TURN_STARTED, 
                         (data) => this.onTurnStarted(data));
                 }
                 
                 console.log('Battle control panel created successfully');
             } else {
                 console.error('BattleControlPanel class not found');
                 this.showErrorMessage('Battle controls not available');
             }
         } catch (error) {
             console.error('Error creating battle control panel:', error);
             this.showErrorMessage('Failed to create battle controls');
         }
     }
     
     /**
      * Handle turn started event from BattleManager
      * @param {object} data - Turn data including currentCharacter
      */
     onTurnStarted(data) {
         try {
             console.log(`Turn ${data.turnNumber} started. Character: ${data.currentCharacter?.name}`);
             
             // Update battle state
             this.battleState.currentTurn = data.turnNumber;
             this.battleState.activeCharacter = data.currentCharacter;
             
             // Update the turn number only - don't set active character visuals here
             this.updateTurnNumberDisplay(data.turnNumber);
         } catch (error) {
             console.error('Error handling turn started event:', error);
         }
     }

     /**
     * Handle debug keypress events
     */
     handleDebugKeypress(event) {
        // Removed to clean up UI
        return;
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
     * @param {string} winner - 'player', 'enemy', or 'draw'
     */
    showBattleOutcome(winner) {
        try {
            console.log(`BattleScene: Showing battle outcome - Winner: ${winner}`);
            
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
            
            // FIXED: Now properly handles 'victory' and 'defeat' values
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
      * @param {string} message - The error message to show
      */
      showErrorMessage(message) {
          console.error('UI Error Message:', message); // Log to console

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
      }

    /**
     * Update loop for the battle scene
     * Called by Phaser on every frame to update game state
     * * @param {number} time - Current time in ms since game start
     * @param {number} delta - Time in ms since last update
     */
    update(time, delta) {
        // Ensure proper try...catch block structure
        try {

            // Update debug tools if enabled
            if (this.debug.enabled) {
                // Update object identifier if it exists and has an update method
                if (this.objectIdentifier && typeof this.objectIdentifier.update === 'function') {
                    this.objectIdentifier.update();
                } // Closing brace for objectIdentifier check

                // Update coordinate display if it exists and has an update method
                // No separate update needed for CoordinateDisplay as it uses pointer events

            } // Closing brace for debug.enabled check

            // Update character teams if present
            if (this.playerTeamContainer) {
                this.playerTeamContainer.update();
            } // Closing brace for playerTeamContainer check

            if (this.enemyTeamContainer) {
                this.enemyTeamContainer.update();
            } // Closing brace for enemyTeamContainer check

        } catch (error) { // Closing brace for try block, starting catch block
            console.error('Error in update loop:', error);
            // Don't show error messages here to avoid spamming the user
            // since this method is called many times per second
        } // Closing brace for catch block
    } // Closing brace for update method

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

            // Clean up keyboard listeners
            if (this.input && this.input.keyboard) {
                this.input.keyboard.off('keydown-D', this.handleDebugKeypress, this);
                // Remove other specific key listeners if they were added (e.g., for Ctrl+G, Ctrl+I)
                // This requires knowing exactly which keys were registered
            }

            // Clean up tweens
            this.tweens.killAll();

            // Clean up local references
            this.battleConfig = null;
            this.playerTeam = null;
            this.enemyTeam = null;
            this.components = {};
            
            // Clean up battle control panel if it exists
            if(this.battleControlPanel) { this.battleControlPanel.destroy(); this.battleControlPanel = null; }
            if(this.battleLog) { this.battleLog.destroy(); this.battleLog = null; }

            // Clean up potential UI elements added
            if(this.errorText) { this.errorText.destroy(); this.errorText = null; }
            if(this.sceneTitle) { this.sceneTitle.destroy(); this.sceneTitle = null; }
            if(this.returnButton) { this.returnButton.destroy(); this.returnButton = null; }
            if(this.testPattern) { this.testPattern.destroy(); this.testPattern = null; }
            if(this.welcomeMessage) { this.welcomeMessage.destroy(); this.welcomeMessage = null; }
            if(this.debugPanel) { this.debugPanel.destroy(); this.debugPanel = null; }
            // Clean up both turn indicators
            if(this.turnIndicator) { 
                this.turnIndicator.destroy(); 
                this.turnIndicator = null; 
            }
            if(this.turnTextIndicator) {
                this.turnTextIndicator.destroy();
                this.turnTextIndicator = null;
            }
            if(this.outcomeContainer) { this.outcomeContainer.destroy(); this.outcomeContainer = null; }


            console.log('BattleScene: Shut down successfully');
        } catch (error) {
            console.error('Error during scene shutdown:', error);
        }
    } // Closing brace for shutdown method

} // Closing brace for the BattleScene class

window.BattleScene = BattleScene;