/**
 * PhaserConfig.js
 * Configuration utilities for Phaser game initialization
 * 
 * @version 0.5.0.3
 */

// Create a self-executing function to avoid global namespace pollution
(function() {
    // Create the PhaserConfig object
    const PhaserConfig = {
        /**
         * Initialize and get the container for Phaser game
         * @param {string} containerId - The ID for the container element
         * @returns {HTMLElement} - The container element
         */
        initContainer: function(containerId) {
            try {
                // Check if container exists
                let container = document.getElementById(containerId);
                
                // Create container if it doesn't exist
                if (!container) {
                    console.log(`Creating Phaser container with ID: ${containerId}`);
                    container = document.createElement('div');
                    container.id = containerId;
                    document.body.appendChild(container);
                }
                
                // Make sure it has proper styling for 4K testing (fill the viewport)
                container.style.width = '100vw';
                container.style.height = '100vh';
                container.style.position = 'fixed';
                container.style.top = '0';
                container.style.left = '0';
                container.style.margin = '0';
                container.style.padding = '0';
                container.style.overflow = 'hidden';
                container.style.zIndex = '1000';
                
                // Make sure container is visible for 4K test
                container.style.display = 'block';
                
                return container;
            } catch (error) {
                console.error('Error initializing Phaser container:', error);
                // Create emergency fallback container
                const fallbackContainer = document.createElement('div');
                fallbackContainer.id = containerId + '-fallback';
                document.body.appendChild(fallbackContainer);
                return fallbackContainer;
            }
        },
        
        /**
         * Create the Phaser game configuration
         * @param {Object} gameConfig - Game configuration from game.js
         * @returns {Object} - Phaser game configuration object
         */
        create: function(gameConfig) {
            return {
                type: Phaser.AUTO,
                width: gameConfig.width || 3840,
                height: gameConfig.height || 2160,
                parent: 'game-container',
                backgroundColor: '#333344',
                scene: [], // Scenes will be added after initialization
                render: {
                    pixelArt: false,
                    antialias: true,
                    roundPixels: true, // Changed to true for the 4K test
                    powerPreference: 'high-performance',
                    crisp: false, // Don't use crisp pixelated rendering
                    batchSize: 8192, // Increased batch size for performance
                    // Note: setFilter was removed as it's not available in this Phaser version
                    // Instead, we use these render settings for the same effect
                },
                // Canvas configuration for 4K test - allow canvas to fill the container
                canvasStyle: 'display: block; width: 100%; height: 100%;',
                // Custom canvas creation callback
                callbacks: {
                    // Configure canvas context with willReadFrequently for performance
                    // This reduces warnings about multiple readback operations
                    preBoot: function(game) {
                        if (game.canvas) {
                            const originalGetContext = game.canvas.getContext;
                            game.canvas.getContext = function(type, attributes) {
                                // Always add willReadFrequently for 2d contexts
                                if (type === '2d') {
                                    attributes = attributes || {};
                                    attributes.willReadFrequently = true;
                                }
                                return originalGetContext.call(this, type, attributes);
                            };
                            console.log('[PhaserConfig] Canvas getContext overridden with willReadFrequently=true');
                        }
                    }
                },
                scale: {
                    mode: Phaser.Scale.NONE
                    // autoCenter removed for the 4K test
                },
                resolution: 1, // Explicitly set for the 4K test
                physics: {
                    default: false  // No physics needed for this game
                }
            };
        },
        
        /**
         * Check if Phaser is properly initialized
         * @returns {boolean} - Whether Phaser is ready
         */
        isPhaserReady: function() {
            return (
                typeof Phaser !== 'undefined' && 
                window.game && 
                window.game.scene
            );
        }
    };
    
    // Make PhaserConfig available globally
    window.PhaserConfig = PhaserConfig;
    
    console.log('PhaserConfig initialized successfully');
})();
