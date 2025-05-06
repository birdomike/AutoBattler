/**
 * Team Builder Scene
 * Allows players to select and customize their team
 */
class TeamBuilderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TeamBuilderScene' });
        
        this.teamManager = null;
        this.selectedHeroes = [null, null, null];
        this.selectedHeroDetails = null;
    }
    
    /**
     * Load assets needed for the team builder
     */
    preload() {
        // Load character images
        // We'll use existing character art initially
        
        // Load UI elements
        this.load.image('grid-bg', 'assets/images/ui/grid-bg.png');
        this.load.image('slot-bg', 'assets/images/ui/slot-bg.png');
        
        // You can add more specific assets later
    }
    
    /**
     * Create the team builder interface
     */
    create() {
        console.log('TeamBuilderScene: Creating Phaser team builder UI');
        
        // Get reference to the existing TeamManager
        this.teamManager = window.teamManager;
        
        // Add "Toggle UI" button that switches between DOM and Phaser
        this.createToggleButton();
        
        // Currently, we'll start with a simple placeholder UI
        // that shows a working Phaser scene with some text
        this.createPlaceholderUI();
        
        // Create events to communicate with DOM UI
        this.setupEvents();
    }
    
    /**
     * Update loop for the scene
     */
    update() {
        // Will be used for animations and interactions
    }
    
    /**
     * Create a button to toggle between DOM and Phaser UI
     */
    createToggleButton() {
        const button = this.add.rectangle(100, 50, 180, 40, 0x3742fa)
            .setInteractive();
        
        const text = this.add.text(100, 50, 'Toggle to DOM UI', { 
            fontSize: '16px',
            fill: '#ffffff' 
        }).setOrigin(0.5);
        
        button.on('pointerdown', () => {
            console.log('Switching to DOM UI');
            // Signal to switch back to DOM UI
            this.toggleToDomUI();
        });
        
        button.on('pointerover', () => {
            button.fillColor = 0x2536e0;
        });
        
        button.on('pointerout', () => {
            button.fillColor = 0x3742fa;
        });
    }
    
    /**
     * Create placeholder UI elements
     */
    createPlaceholderUI() {
        // Add background
        this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x232a40,
            0.8
        );
        
        // Add title
        this.add.text(
            this.cameras.main.width / 2,
            100,
            'Team Builder (Phaser UI)',
            {
                fontSize: '42px',
                fontFamily: 'Bebas Neue',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // Add subtitle
        this.add.text(
            this.cameras.main.width / 2,
            160,
            'This is a placeholder for the Phaser-based team builder',
            {
                fontSize: '18px',
                fontFamily: 'Open Sans',
                fill: '#a4b0be'
            }
        ).setOrigin(0.5);
        
        // Add information
        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'Phaser UI integration in progress...\nClick "Toggle to DOM UI" to return to the original interface',
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                fill: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
    }
    
    /**
     * Setup event listeners to communicate with DOM UI
     */
    setupEvents() {
        // Create custom events for communication
        // Will be expanded as we implement more features
    }
    
    /**
     * Toggle back to DOM UI
     */
    toggleToDomUI() {
        // Signal to UIManager to show the DOM UI
        if (window.uiManager) {
            window.uiManager.showDomUI();
        } else {
            // Fallback if uiManager isn't initialized yet
            const phaserContainer = document.getElementById('phaser-container');
            if (phaserContainer) {
                phaserContainer.style.display = 'none';
            }
            
            // Show the team builder container
            const teamBuilderContainer = document.getElementById('team-builder-container');
            if (teamBuilderContainer) {
                teamBuilderContainer.classList.add('active');
            }
            
            // Hide the game container
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.classList.remove('active');
            }
        }
    }
}
