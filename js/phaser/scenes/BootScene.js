/**
 * Boot Scene
 * The initial scene that loads critical assets and setups the game
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    /**
     * Preload essential assets for the game
     */
    preload() {
        // Display loading text
        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2, 
            'Loading...', 
            { 
                font: '32px Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // Create loading bar
        this.createLoadingBar();
        
        // Load essential UI assets
        this.load.image('button', 'assets/images/ui/button.png');
        this.load.image('panel', 'assets/images/ui/panel.png');
        
        // We'll add more assets here as needed
        
        // Show progress
        this.load.on('progress', (value) => {
            this.updateLoadingBar(value);
        });
        
        // When all assets are loaded
        this.load.on('complete', () => {
            // Clean up loading bar
            if (this.loadingBar) {
                this.loadingBar.destroy();
                this.loadingBarBg.destroy();
            }
        });
    }
    
    /**
     * Create game objects and setup the scene
     */
    create() {
        console.log('BootScene: Starting game initialization');
        
        // Initialize game settings
        this.initializeSettings();
        
        // Start the MainMenuScene (or TeamBuilderScene if we want to go directly there)
        this.scene.start('TeamBuilderScene');
    }
    
    /**
     * Create a visual loading bar
     */
    createLoadingBar() {
        const width = 400;
        const height = 30;
        const x = (this.cameras.main.width - width) / 2;
        const y = (this.cameras.main.height + 100) / 2;
        
        // Background of the loading bar
        this.loadingBarBg = this.add.rectangle(
            x + width / 2,
            y + height / 2,
            width,
            height,
            0x333333
        );
        
        // The actual loading bar that will be scaled
        this.loadingBar = this.add.rectangle(
            x + 2 + (width - 4) / 2, // Account for border
            y + 2 + (height - 4) / 2,
            width - 4, // Account for border
            height - 4,
            0x3742fa
        );
        
        // Start at 0 width
        this.loadingBar.scaleX = 0;
    }
    
    /**
     * Update the loading bar based on progress
     * @param {number} value - Progress value between 0 and 1
     */
    updateLoadingBar(value) {
        if (this.loadingBar) {
            this.loadingBar.scaleX = value;
        }
    }
    
    /**
     * Initialize game settings
     */
    initializeSettings() {
        // Set up any global game settings here
        console.log('BootScene: Game settings initialized');
    }
}
