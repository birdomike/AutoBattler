/**
 * Main game initialization file
 * This will be the entry point for the AutoBattler game
 *
 * @version 0.5.0.3 (Updated with BattleManager Instantiation & Deferred Scene Add)
 */

// Global variables
let teamManager;
let teamBuilderUI;
let battleManager; // Declared here
let gameConfig = {
    width: 3840,
    height: 2160
};

// Check if BattleUI is defined
function checkBattleUI() {
    if (typeof window.BattleUI === 'undefined') {
        console.warn('BattleUI (DOM version) not defined when game.js loads! This might be ok if only using Phaser.');
    } else {
        console.log('BattleUI (DOM version) is defined and available!');
    }
}

// Wait for DOM to load before initializing the game
window.onload = async function() {
    console.log('Game loading...');

    // Check BattleUI status
    checkBattleUI();

    // Try to load config file
    await loadConfigFile();
    console.log('Config loaded, gameConfig:', gameConfig);

    // Initialize team manager
    teamManager = new TeamManager();
    console.log('TeamManager initialized');

    // Initialize team builder UI
    teamBuilderUI = new TeamBuilderUI(teamManager);
    console.log('TeamBuilderUI created, initializing...');
    await teamBuilderUI.initialize();
    console.log('TeamBuilderUI initialized');

    // Initialize Battle Manager (Crucial Step)
    // Check if BattleManager class exists before creating instance
    if (typeof window.BattleManager === 'function') {
        // Pass null for the scene initially, as Phaser isn't fully ready yet.
        // Pass the ID of your battle log container.
        battleManager = new window.BattleManager(null, 'battle-log-content'); // Instantiate the manager
        window.battleManager = battleManager; // Assign the INSTANCE to window.battleManager (lowercase 'b')
        console.log('BattleManager instance created and assigned to window.battleManager');

         // Optional but recommended: Initialize the BattleManager if it has an async initialize method
         if (battleManager && typeof battleManager.initialize === 'function') {
             // Make sure to await if initialize is async
             // *** NOTE: We removed the auto-creation of BattleUI from BattleManager.initialize ***
             await battleManager.initialize();
             console.log('BattleManager initialized (without auto-creating DOM BattleUI)');
             // BattleBridge will be initialized later by BattleScene with both components
         } else {
             console.log('BattleManager instance created (no separate initialize method found or needed).');
             // BattleBridge will be initialized later by BattleScene with both components
         }

    } else {
        console.error('BattleManager class definition not found on window! Cannot create BattleManager instance.');
        // Stop execution or show an error here
        alert("Critical Error: BattleManager class not found. Battle cannot start.");
        return; // Stop further execution in onload
    }

    // Initialize Phaser game (will be used for battle scene)
    try {
        window.game = initPhaserGame(); // Phaser game instance is assigned here
        console.log('Phaser game initialized successfully');

        // --- POTENTIAL FUTURE STEP: Link BattleManager to Phaser Scene ---
        // (Conceptual code remains unchanged)

    } catch (error) {
        console.error('Failed to initialize Phaser game:', error);
        alert('Failed to initialize Phaser. Battle cannot start.');
    }

    // --- ADDED BLOCK: Defer Adding BattleScene ---
    // Now that Phaser game instance should exist, try adding the scene
    if (window.game && window.BattleScene) {
        if (!window.game.scene.getScene('BattleScene')) { // Check if not already added
            try {
                window.game.scene.add('BattleScene', window.BattleScene);
                console.log('BattleScene added to game post-initialization.');
            } catch (sceneError) {
                 console.error("Error adding BattleScene to game:", sceneError);
                 alert("Failed to add BattleScene. Check console.");
            }
        } else {
             console.log('BattleScene was already added to the game instance.');
        }
    } else {
         if(!window.game) console.warn('Phaser game instance (window.game) not available to add scene.');
         if(!window.BattleScene) console.warn('BattleScene class not found when attempting to add scene post-initialization. Check script load order in index.html.');
    }
    // --- END ADDED BLOCK ---


    // --- Ensure Managers are Exposed Globally ---
    window.teamManager = teamManager;
    window.teamBuilderUI = teamBuilderUI;
    window.battleManager = battleManager; // Expose the created instance
    console.log("Managers exposed globally for debugging.");
};

/**
 * Load the project configuration file
 */
async function loadConfigFile() {
    // ... (loadConfigFile function remains unchanged) ...
    try {
        const response = await fetch('project.config');
        const configText = await response.text();

        // Parse the config file
        const configLines = configText.split('\n');
        let currentSection = '';

        configLines.forEach(line => {
            line = line.trim();

            // Section header
            if (line.startsWith('[') && line.endsWith(']')) {
                currentSection = line.substring(1, line.length - 1);
                return;
            }

            // Parse key-value pairs
            if (line.includes('=')) {
                const parts = line.split('=');
                const key = parts[0].trim();
                let value = parts[1].trim();

                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }

                // Store game dimensions
                if (currentSection === 'game') {
                    if (key === 'width') {
                        gameConfig.width = parseInt(value);
                    } else if (key === 'height') {
                        gameConfig.height = parseInt(value);
                    } else if (key === 'title') {
                        document.title = value;
                    }
                }
            }
        });

        console.log('Loaded game config:', gameConfig);
    } catch (error) {
        console.error('Error loading config file:', error);
        // Use default values if config file cannot be loaded
    }
}


/**
 * Initialize the Phaser game
 * @returns {Phaser.Game | null} The initialized Phaser game instance or null on error
 */
function initPhaserGame() {
    try {
        // Make sure Phaser is loaded
        if (typeof Phaser === 'undefined') {
            console.error('Phaser is not loaded! Make sure Phaser library is included before game.js');
            return null;
        }

        // Make sure PhaserConfig is loaded
        if (typeof window.PhaserConfig === 'undefined') {
            console.error('PhaserConfig is not loaded! Creating emergency configuration...');

            // Create emergency PhaserConfig (Consider moving this to a separate error handling file)
            window.PhaserConfig = {
                initContainer: function(id) {
                     const container = document.getElementById(id) || document.createElement('div');
                     if (!container.id) {
                         container.id = id;
                         document.body.appendChild(container);
                     }
                     // Ensure styling for visibility control
                     container.style.position = 'absolute'; // Or relevant positioning
                     container.style.top = '0';
                     container.style.left = '0';
                     container.style.width = '100%'; // Or specific dimensions
                     container.style.height = '100%';
                     container.style.zIndex = '1'; // Ensure it can be layered
                     container.style.display = 'none'; // Start hidden
                     return container;
                },
                create: function(config) {
                     return {
                         type: Phaser.AUTO,
                         width: config.width || 1280,
                         height: config.height || 720,
                         parent: 'game-container', // Should match initContainer ID
                         backgroundColor: '#333344',
                         scene: [] // Start with empty scene array
                     };
                }
            };
             console.error('PhaserConfig emergency fallback created. Check script load order.');
             // Re-check after creating fallback
             if (typeof window.PhaserConfig === 'undefined') {
                 throw new Error("Failed to create PhaserConfig fallback.");
             }
        }

        // Create Phaser container using our utility
        const phaserContainer = window.PhaserConfig.initContainer('game-container');
        if (!phaserContainer) {
             throw new Error("Failed to initialize Phaser container.");
        }

        // Create Phaser configuration
        const config = window.PhaserConfig.create(gameConfig);
        if (!config) {
             throw new Error("Failed to create Phaser configuration.");
        }

        // Initialize Phaser game
        let game = new Phaser.Game(config);
        if (!game) {
             throw new Error("Phaser.Game constructor failed.");
        }

        // Make sure we have a global reference *immediately* after creation
        window.game = game;

        // --- SCENE ADDITION REMOVED FROM HERE ---
        // The BattleScene will be added later in the onload function

        // Hide Phaser container initially as we start with DOM UI
        if (phaserContainer) {
            phaserContainer.style.display = 'none';
        }

        return game; // Return the game instance
    } catch (error) {
        console.error('Error initializing Phaser game:', error);
        alert('There was an error initializing the battle system. Please refresh the page and try again.');
        // Attempt to clean up partially created elements if possible
        const phaserContainer = document.getElementById('phaser-container'); // Use correct ID
        if(phaserContainer && phaserContainer.parentNode) {
            phaserContainer.parentNode.removeChild(phaserContainer);
        }
        return null;
    }
}


// Add a utility function to check if Phaser is ready
window.isPhaserReady = function() {
    return (
        typeof Phaser !== 'undefined' &&
        window.game && // Check if game instance exists
        window.game.scene && // Check if scene manager exists
        typeof window.game.scene.start === 'function' // Check if core scene method exists
    );
};

// Note: Global exposure is now handled at the end of the onload function
// to ensure variables are assigned before being exposed.