/**
 * CoordinateDisplay.js
 * Provides a coordinate grid overlay and mouse position tracking for debugging
 * Toggle with Alt+G
 */

class CoordinateDisplay {
    /**
     * @param {Phaser.Scene} scene - The scene to attach to
     * @param {Object} config - Configuration options
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        
        // Configuration with defaults
        this.config = {
            gridSpacing: config.gridSpacing || 50,
            showGrid: config.showGrid !== undefined ? config.showGrid : true,
            showCoordinates: config.showCoordinates !== undefined ? config.showCoordinates : true,
            gridColor: config.gridColor || 0x00ff00,
            gridAlpha: config.gridAlpha || 0.3,
            textColor: config.textColor || '#00ff00',
            fontSize: config.fontSize || 12,
            fontFamily: config.fontFamily || 'Arial',
            backgroundColor: config.backgroundColor || '#000000',
            backgroundAlpha: config.backgroundAlpha || 0.7,
            enabled: config.enabled !== undefined ? config.enabled : false
        };
        
        // Graphics objects
        this.gridContainer = null;
        this.grid = null;
        this.coordinateText = null;
        
        // State tracking
        this.enabled = this.config.enabled;
        
        // Create the display elements
        this.create();
    }
    
    /**
     * Create the grid and coordinate display
     */
    create() {
        // Create a container to hold grid graphics and text labels
        this.gridContainer = this.scene.add.container();
        this.gridContainer.setDepth(1000); // Ensure it's above other elements
        
        // Create the grid graphics object
        this.grid = this.scene.add.graphics();
        this.gridContainer.add(this.grid); // Add graphics to container
        
        // Create coordinate text
        this.coordinateText = this.scene.add.text(10, 10, 'X: 0 Y: 0', {
            fontFamily: this.config.fontFamily,
            fontSize: this.config.fontSize,
            color: this.config.textColor,
            backgroundColor: this.config.backgroundColor + Math.floor(this.config.backgroundAlpha * 255).toString(16).padStart(2, '0'),
            padding: { x: 5, y: 2 }
        });
        this.coordinateText.setDepth(1001); // Above grid
        this.coordinateText.setScrollFactor(0); // Fixed to camera
        
        // Set initial visibility
        this.gridContainer.visible = this.config.showGrid && this.enabled;
        this.coordinateText.visible = this.config.showCoordinates && this.enabled;
        
        // Draw the initial grid
        this.drawGrid();
        
        // Add mouse move listener for coordinate tracking
        this.scene.input.on('pointermove', this.updateCoordinates, this);
        
        // Add keyboard shortcut for toggling (Alt+G)
        this.scene.input.keyboard.on('keydown-G', (event) => {
            if (event.altKey) {
                event.preventDefault(); // Prevent browser's default behavior
                this.toggle();
            }
        });
        
        console.log('CoordinateDisplay: Created (toggle with Alt+G)');
    }
    
    /**
     * Draw the coordinate grid
     */
    drawGrid() {
        // Clear any existing grid
        this.grid.clear();
        
        if (!this.config.showGrid || !this.enabled) return;
        
        // Set line style
        this.grid.lineStyle(1, this.config.gridColor, this.config.gridAlpha);
        
        // Get scene dimensions
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Draw vertical lines
        for (let x = 0; x < width; x += this.config.gridSpacing) {
            this.grid.beginPath();
            this.grid.moveTo(x, 0);
            this.grid.lineTo(x, height);
            this.grid.strokePath();
            
            // Add coordinate label for x
            if (x > 0) {
                const text = this.scene.add.text(x, 0, x.toString(), {
                    fontFamily: this.config.fontFamily,
                    fontSize: 10,
                    color: this.config.textColor
                });
                text.setDepth(1000);
                text.setOrigin(0.5, 0);
                this.gridContainer.add(text); // Add to container so it gets destroyed with grid
            }
        }
        
        // Draw horizontal lines
        for (let y = 0; y < height; y += this.config.gridSpacing) {
            this.grid.beginPath();
            this.grid.moveTo(0, y);
            this.grid.lineTo(width, y);
            this.grid.strokePath();
            
            // Add coordinate label for y
            if (y > 0) {
                const text = this.scene.add.text(0, y, y.toString(), {
                    fontFamily: this.config.fontFamily,
                    fontSize: 10,
                    color: this.config.textColor
                });
                text.setDepth(1000);
                text.setOrigin(0, 0.5);
                this.gridContainer.add(text); // Add to container so it gets destroyed with grid
            }
        }
    }
    
    /**
     * Update the coordinate display based on mouse position
     * @param {Phaser.Input.Pointer} pointer - The mouse/touch pointer
     */
    updateCoordinates(pointer) {
        if (!this.config.showCoordinates || !this.enabled) return;
        
        // Get pointer world position (taking into account camera scroll)
        const x = Math.floor(pointer.worldX);
        const y = Math.floor(pointer.worldY);
        
        // Update the text display
        this.coordinateText.setText(`X: ${x} Y: ${y}`);
    }
    
    /**
     * Toggle the coordinate display on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        
        // Update visibility
        this.gridContainer.visible = this.config.showGrid && this.enabled;
        this.coordinateText.visible = this.config.showCoordinates && this.enabled;
        
        // Redraw grid if turning on
        if (this.enabled && this.config.showGrid) {
            this.drawGrid();
        }
        
        console.log(`CoordinateDisplay: ${this.enabled ? 'Enabled' : 'Disabled'} (toggle with Alt+G)`);
    }
    
    /**
     * Set grid spacing
     * @param {number} spacing - Grid line spacing in pixels
     */
    setGridSpacing(spacing) {
        this.config.gridSpacing = spacing;
        this.drawGrid();
    }
    
    /**
     * Toggle grid visibility
     * @param {boolean} visible - Whether the grid should be visible
     */
    setGridVisible(visible) {
        this.config.showGrid = visible;
        this.gridContainer.visible = visible && this.enabled;
        if (visible && this.enabled) {
            this.drawGrid();
        }
    }
    
    /**
     * Toggle coordinate display visibility
     * @param {boolean} visible - Whether coordinates should be visible
     */
    setCoordinatesVisible(visible) {
        this.config.showCoordinates = visible;
        this.coordinateText.visible = visible && this.enabled;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        // Remove event listeners
        this.scene.input.off('pointermove', this.updateCoordinates, this);
        
        // Destroy graphics objects
        if (this.gridContainer) this.gridContainer.destroy();
        if (this.coordinateText) this.coordinateText.destroy();
        
        console.log('CoordinateDisplay: Destroyed');
    }
}

// Make the class globally available
window.CoordinateDisplay = CoordinateDisplay;