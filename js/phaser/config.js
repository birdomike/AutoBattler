/**
 * Phaser Game Configuration
 * This file contains the configuration for the Phaser game instance
 */

class PhaserConfig {
    /**
     * Create a Phaser game configuration
     * @param {Object} gameConfig - The game configuration settings
     * @returns {Object} Phaser game configuration object
     */
    static create(gameConfig) {
        // Default settings if not provided
        const width = gameConfig?.width || 1920;
        const height = gameConfig?.height || 1080;
        
        return {
            type: Phaser.AUTO,
            width: width,
            height: height,
            parent: 'phaser-container',
            backgroundColor: '#141e2e',
            transparent: true,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            // We'll add scenes dynamically after they're loaded
            scene: []
        };
    }
    
    /**
     * Initialize the Phaser container in the DOM
     * @param {string} parentId - The ID of the parent container
     * @returns {HTMLElement} The created Phaser container
     */
    static initContainer(parentId = 'game-container') {
        const gameContainer = document.getElementById(parentId);
        
        // Check if container already exists
        let phaserContainer = document.getElementById('phaser-container');
        if (phaserContainer) {
            return phaserContainer;
        }
        
        // Create container if it doesn't exist
        phaserContainer = document.createElement('div');
        phaserContainer.id = 'phaser-container';
        phaserContainer.style.position = 'absolute';
        phaserContainer.style.top = '0';
        phaserContainer.style.left = '0';
        phaserContainer.style.width = '100%';
        phaserContainer.style.height = '100%';
        phaserContainer.style.zIndex = '0';
        gameContainer.appendChild(phaserContainer);
        
        return phaserContainer;
    }
}
