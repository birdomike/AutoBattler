/**
 * UI Manager
 * Handles switching between DOM and Phaser UIs
 */
class UIManager {
    constructor() {
        this.currentUI = 'dom'; // 'dom' or 'phaser'
        this.game = null; // Will hold the Phaser game instance
        this.scenes = {}; // Will hold references to scenes
    }
    
    /**
     * Initialize the UI Manager
     * @param {Object} game - Phaser game instance
     */
    initialize(game) {
        this.game = game;
        
        // Store references to DOM elements
        this.domElements = {
            teamBuilder: document.getElementById('team-builder-container'),
            gameContainer: document.getElementById('game-container'),
            phaserContainer: document.getElementById('phaser-container')
        };
        
        // Add UI toggle buttons to DOM
        this.addDomToggleButtons();
        
        console.log('UIManager: Initialized');
    }
    
    /**
     * Add toggle buttons to the DOM UI
     */
    addDomToggleButtons() {
        // Create toggle button for team builder
        const teamBuilderContainer = this.domElements.teamBuilder;
        if (teamBuilderContainer) {
            const toggleButton = document.createElement('button');
            toggleButton.textContent = 'Try Phaser UI';
            toggleButton.className = 'phaser-toggle-btn';
            toggleButton.style.position = 'absolute';
            toggleButton.style.top = '20px';
            toggleButton.style.right = '20px';
            toggleButton.style.zIndex = '1000';
            toggleButton.style.backgroundColor = '#3742fa';
            toggleButton.style.color = 'white';
            toggleButton.style.border = 'none';
            toggleButton.style.padding = '8px 16px';
            toggleButton.style.borderRadius = '4px';
            toggleButton.style.cursor = 'pointer';
            
            toggleButton.addEventListener('click', () => {
                this.showPhaserUI('TeamBuilderScene');
            });
            
            teamBuilderContainer.appendChild(toggleButton);
        }
        
        // The battle UI toggle button will be added when battle starts
    }
    
    /**
     * Register a scene with the UI Manager
     * @param {string} key - The scene key
     * @param {Phaser.Scene} scene - The scene instance
     */
    registerScene(key, scene) {
        this.scenes[key] = scene;
    }
    
    /**
     * Show the DOM UI
     */
    showDomUI() {
        // Hide Phaser container
        if (this.domElements.phaserContainer) {
            this.domElements.phaserContainer.style.display = 'none';
        }
        
        // Show appropriate DOM container based on current context
        if (this.currentUI === 'battle') {
            // Show game container for battle
            if (this.domElements.gameContainer) {
                this.domElements.gameContainer.classList.add('active');
            }
            
            // Hide team builder
            if (this.domElements.teamBuilder) {
                this.domElements.teamBuilder.classList.remove('active');
            }
        } else {
            // Show team builder for team selection
            if (this.domElements.teamBuilder) {
                this.domElements.teamBuilder.classList.add('active');
            }
            
            // Hide game container
            if (this.domElements.gameContainer) {
                this.domElements.gameContainer.classList.remove('active');
            }
        }
        
        this.currentUI = 'dom';
        console.log('UIManager: Switched to DOM UI');
    }
    
    /**
     * Show the Phaser UI with the specified scene
     * @param {string} sceneKey - The scene to show
     */
    showPhaserUI(sceneKey) {
        // Make sure the game is initialized
        if (!this.game) {
            console.error('UIManager: Phaser game not initialized');
            return;
        }
        
        // Show Phaser container
        if (this.domElements.phaserContainer) {
            this.domElements.phaserContainer.style.display = 'block';
        }
        
        // Hide DOM UI containers
        if (this.domElements.teamBuilder) {
            this.domElements.teamBuilder.classList.remove('active');
        }
        
        if (this.domElements.gameContainer) {
            this.domElements.gameContainer.classList.remove('active');
        }
        
        // Start the appropriate scene
        try {
            // Stop all active scenes
            const activeScenes = this.game.scene.getScenes(true);
            activeScenes.forEach(scene => {
                if (scene.scene.key !== sceneKey) {
                    scene.scene.stop();
                }
            });
            
            // Start or resume the requested scene
            if (!this.game.scene.isActive(sceneKey)) {
                this.game.scene.start(sceneKey);
            } else {
                this.game.scene.resume(sceneKey);
            }
            
            // Update current UI state
            this.currentUI = sceneKey === 'BattleScene' ? 'battle' : 'phaser';
            console.log(`UIManager: Switched to Phaser UI (${sceneKey})`);
        } catch (error) {
            console.error(`UIManager: Error starting scene ${sceneKey}`, error);
        }
    }
    
    /**
     * Start a battle with the specified teams in Phaser
     * @param {Array} playerTeam - The player's team
     * @param {Array} enemyTeam - The enemy team
     */
    startBattleInPhaser(playerTeam, enemyTeam) {
        // Show Phaser UI with BattleScene
        this.showPhaserUI('BattleScene');
        
        // Get reference to BattleScene
        const battleScene = this.game.scene.getScene('BattleScene');
        if (battleScene) {
            // Start the battle
            battleScene.startBattle(playerTeam, enemyTeam);
        }
    }
}
