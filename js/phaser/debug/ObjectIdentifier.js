/**
 * ObjectIdentifier.js
 * Provides object identification and inspection for debugging
 */

class ObjectIdentifier {
    /**
     * @param {Phaser.Scene} scene - The scene to attach to
     * @param {Object} config - Configuration options
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        
        // Configuration with defaults
        this.config = {
            enabled: config.enabled !== undefined ? config.enabled : true,
            showBounds: config.showBounds !== undefined ? config.showBounds : true,
            highlightColor: config.highlightColor || 0xffff00,
            highlightAlpha: config.highlightAlpha || 0.5,
            textColor: config.textColor || '#ffffff',
            backgroundColor: config.backgroundColor || '#000000',
            backgroundAlpha: config.backgroundAlpha || 0.7,
            fontSize: config.fontSize || 12,
            fontFamily: config.fontFamily || 'Arial',
            margin: config.margin || 5,
            padding: config.padding || { x: 5, y: 3 },
            showDepth: config.showDepth !== undefined ? config.showDepth : true,
            showPosition: config.showPosition !== undefined ? config.showPosition : true,
            showSize: config.showSize !== undefined ? config.showSize : true,
            showType: config.showType !== undefined ? config.showType : true,
            showName: config.showName !== undefined ? config.showName : true,
            onlyInteractive: config.onlyInteractive !== undefined ? config.onlyInteractive : false
        };
        
        // State tracking
        this.enabled = this.config.enabled;
        this.highlight = null;
        this.infoPanel = null;
        this.pinnedObjects = [];
        this.pinnedPanels = [];
        
        // Create the display elements
        this.create();
        
        // Make available globally for debugging
        window.ObjectIdentifier = this;
    }
    
    /**
     * Create the identifier components
     */
    create() {
        // Create a graphics object for highlighting objects
        this.highlight = this.scene.add.graphics();
        this.highlight.setDepth(999); // Ensure it's above most elements
        
        // Create info panel container for hover info
        this.infoPanel = this.scene.add.container(0, 0);
        this.infoPanel.setDepth(1000); // Above highlight
        
        // Background for the panel
        const infoBg = this.scene.add.graphics();
        this.infoPanel.add(infoBg);
        
        // Text for the panel
        const infoText = this.scene.add.text(
            this.config.padding.x,
            this.config.padding.y,
            'Hover over an object',
            {
                fontFamily: this.config.fontFamily,
                fontSize: this.config.fontSize,
                color: this.config.textColor,
                wordWrap: { width: 300 }
            }
        );
        this.infoPanel.add(infoText);
        
        // Set panel properties
        this.infoPanel.bg = infoBg;
        this.infoPanel.text = infoText;
        this.infoPanel.visible = false;
        
        // Add keyboard shortcut for toggling (Ctrl+I)
        this.scene.input.keyboard.on('keydown-I', (event) => {
            if (this.scene.input.keyboard.checkModifierKey(event, 'ctrl')) {
                this.toggle();
            }
        });
        
        // Add mouse events for object identification
        this.scene.input.on('pointermove', this.onPointerMove, this);
        this.scene.input.on('pointerdown', this.onPointerDown, this);
        
        console.log('ObjectIdentifier: Created');
    }
    
    /**
     * Handle pointer movement
     * @param {Phaser.Input.Pointer} pointer - The pointer device
     */
    onPointerMove(pointer) {
        if (!this.enabled) return;
        
        // Hide highlight and info panel initially
        this.highlight.clear();
        this.infoPanel.visible = false;
        
        // Get objects under the pointer
        const objects = this.getObjectsUnderPointer(pointer);
        if (objects.length === 0) return;
        
        // Get the top object
        const object = objects[0];
        
        // Highlight the object
        this.highlightObject(object);
        
        // Show object information
        this.showObjectInfo(object, pointer.x, pointer.y);
    }
    
    /**
     * Handle pointer down (click)
     * @param {Phaser.Input.Pointer} pointer - The pointer device
     */
    onPointerDown(pointer) {
        if (!this.enabled || pointer.button !== 0) return;
        
        // Get objects under the pointer
        const objects = this.getObjectsUnderPointer(pointer);
        if (objects.length === 0) return;
        
        // Get the top object
        const object = objects[0];
        
        // Pin or unpin the object
        const existingIndex = this.pinnedObjects.indexOf(object);
        if (existingIndex !== -1) {
            // Object already pinned, remove it
            this.unpinObject(existingIndex);
        } else {
            // Pin the object
            this.pinObject(object);
        }
    }
    
    /**
     * Get objects under the pointer
     * @param {Phaser.Input.Pointer} pointer - The pointer device
     * @returns {Array} Array of game objects
     */
    getObjectsUnderPointer(pointer) {
        // Get all input-enabled objects under the pointer
        let objects = this.scene.input.hitTestPointer(pointer);
        
        // If we only want interactive objects or no objects were found with hitTest
        if (this.config.onlyInteractive || objects.length === 0) {
            return objects;
        }
        
        // For non-interactive objects, we need to do a custom check
        // Get all game objects in the scene
        const allObjects = this.scene.children.list;
        
        // Filter objects that intersect with the pointer position
        const nonInteractiveObjects = allObjects.filter(obj => {
            // Skip if it's not a game object or already in our list
            if (!obj.getBounds || objects.includes(obj)) return false;
            
            // Get object bounds
            const bounds = obj.getBounds();
            
            // Check if pointer is within bounds
            return bounds.contains(pointer.x, pointer.y);
        });
        
        // Merge and sort by depth (highest depth first)
        objects = [...objects, ...nonInteractiveObjects]
            .sort((a, b) => b.depth - a.depth);
        
        return objects;
    }
    
    /**
     * Highlight a game object
     * @param {Phaser.GameObjects.GameObject} object - The object to highlight
     */
    highlightObject(object) {
        if (!this.config.showBounds || !object.getBounds) return;
        
        // Get object bounds
        const bounds = object.getBounds();
        
        // Draw highlight rectangle
        this.highlight.lineStyle(2, this.config.highlightColor, 1);
        this.highlight.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        // Fill with semi-transparent color
        this.highlight.fillStyle(this.config.highlightColor, this.config.highlightAlpha);
        this.highlight.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
    
    /**
     * Show information about a game object
     * @param {Phaser.GameObjects.GameObject} object - The object to show info for
     * @param {number} x - X position of the pointer
     * @param {number} y - Y position of the pointer
     */
    showObjectInfo(object, x, y) {
        // Build info text
        const infoLines = [];
        
        // Check if pinned
        const isPinned = this.pinnedObjects.includes(object);
        
        // Type
        if (this.config.showType) {
            const type = object.type || object.constructor.name;
            infoLines.push(`Type: ${type}`);
        }
        
        // Name
        if (this.config.showName && object.name) {
            infoLines.push(`Name: ${object.name}`);
        }
        
        // Position
        if (this.config.showPosition) {
            infoLines.push(`Position: (${Math.round(object.x)}, ${Math.round(object.y)})`);
        }
        
        // Size (if available)
        if (this.config.showSize && (object.width !== undefined && object.height !== undefined)) {
            infoLines.push(`Size: ${Math.round(object.width)} × ${Math.round(object.height)}`);
        }
        
        // Depth (z-order)
        if (this.config.showDepth && object.depth !== undefined) {
            infoLines.push(`Depth: ${object.depth}`);
        }
        
        // Alpha (transparency)
        if (object.alpha !== undefined) {
            infoLines.push(`Alpha: ${object.alpha.toFixed(2)}`);
        }
        
        // Origin
        if (object.originX !== undefined && object.originY !== undefined) {
            infoLines.push(`Origin: (${object.originX.toFixed(2)}, ${object.originY.toFixed(2)})`);
        }
        
        // Visibility
        infoLines.push(`Visible: ${object.visible}`);
        
        // Interactive
        infoLines.push(`Interactive: ${object.input ? 'Yes' : 'No'}`);
        
        // Pin status
        infoLines.push(`Status: ${isPinned ? '📌 Pinned' : 'Click to pin'}`);
        
        // Set info text
        const infoText = infoLines.join('\n');
        this.infoPanel.text.setText(infoText);
        
        // Resize background
        const bounds = this.infoPanel.text.getBounds();
        this.infoPanel.bg.clear();
        this.infoPanel.bg.fillStyle(
            parseInt(this.config.backgroundColor.replace('#', '0x')),
            this.config.backgroundAlpha
        );
        this.infoPanel.bg.fillRect(
            0,
            0,
            bounds.width + (this.config.padding.x * 2),
            bounds.height + (this.config.padding.y * 2)
        );
        
        // Position panel near pointer, but ensure it stays on screen
        let panelX = x + this.config.margin;
        let panelY = y + this.config.margin;
        
        // Adjust if panel would go off right edge
        if (panelX + bounds.width + (this.config.padding.x * 2) > this.scene.cameras.main.width) {
            panelX = x - this.config.margin - bounds.width - (this.config.padding.x * 2);
        }
        
        // Adjust if panel would go off bottom edge
        if (panelY + bounds.height + (this.config.padding.y * 2) > this.scene.cameras.main.height) {
            panelY = y - this.config.margin - bounds.height - (this.config.padding.y * 2);
        }
        
        // Position the panel
        this.infoPanel.setPosition(panelX, panelY);
        this.infoPanel.visible = true;
    }
    
    /**
     * Pin an object for continued display
     * @param {Phaser.GameObjects.GameObject} object - The object to pin
     */
    pinObject(object) {
        // Add to pinned objects
        this.pinnedObjects.push(object);
        
        // Create pinned panel
        const panel = this.scene.add.container(10, 10 + (this.pinnedPanels.length * 150));
        panel.setDepth(1001); // Above other interface elements
        
        // Background for the panel
        const bg = this.scene.add.graphics();
        panel.add(bg);
        
        // Title for the panel
        const title = this.scene.add.text(
            this.config.padding.x,
            this.config.padding.y,
            `📌 ${object.name || object.type || object.constructor.name}`,
            {
                fontFamily: this.config.fontFamily,
                fontSize: this.config.fontSize + 2,
                color: this.config.textColor,
                fontStyle: 'bold'
            }
        );
        panel.add(title);
        
        // Object properties
        const propsText = this.scene.add.text(
            this.config.padding.x,
            title.height + (this.config.padding.y * 2),
            'Loading properties...',
            {
                fontFamily: this.config.fontFamily,
                fontSize: this.config.fontSize,
                color: this.config.textColor,
                wordWrap: { width: 250 }
            }
        );
        panel.add(propsText);
        
        // Close button
        const closeBtn = this.scene.add.text(
            240,
            this.config.padding.y,
            '✖',
            {
                fontFamily: this.config.fontFamily,
                fontSize: this.config.fontSize + 2,
                color: '#ff6666'
            }
        );
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => {
            const index = this.pinnedObjects.indexOf(object);
            if (index !== -1) {
                this.unpinObject(index);
            }
        });
        panel.add(closeBtn);
        
        // Store references
        panel.bg = bg;
        panel.title = title;
        panel.propsText = propsText;
        panel.closeBtn = closeBtn;
        panel.object = object;
        
        // Update the panel content
        this.updatePinnedPanel(panel);
        
        // Add to pinned panels
        this.pinnedPanels.push(panel);
        
        // Rearrange panels
        this.arrangePinnedPanels();
    }
    
    /**
     * Unpin an object
     * @param {number} index - The index of the object to unpin
     */
    unpinObject(index) {
        // Remove object and panel
        this.pinnedObjects.splice(index, 1);
        const panel = this.pinnedPanels.splice(index, 1)[0];
        
        // Destroy the panel
        panel.destroy();
        
        // Rearrange remaining panels
        this.arrangePinnedPanels();
    }
    
    /**
     * Update a pinned panel's content
     * @param {Phaser.GameObjects.Container} panel - The panel to update
     */
    updatePinnedPanel(panel) {
        const object = panel.object;
        
        // Build properties text
        let propsLines = [];
        
        try {
            // Extract key properties
            const props = {
                // Position and dimensions
                x: Math.round(object.x),
                y: Math.round(object.y),
                width: object.width !== undefined ? Math.round(object.width) : 'N/A',
                height: object.height !== undefined ? Math.round(object.height) : 'N/A',
                
                // Visual properties
                visible: object.visible,
                alpha: object.alpha !== undefined ? object.alpha.toFixed(2) : 'N/A',
                depth: object.depth,
                
                // Transform
                scaleX: object.scaleX !== undefined ? object.scaleX.toFixed(2) : 'N/A',
                scaleY: object.scaleY !== undefined ? object.scaleY.toFixed(2) : 'N/A',
                rotation: object.rotation !== undefined ? (object.rotation * (180/Math.PI)).toFixed(1) + '°' : 'N/A'
            };
            
            // Format properties
            Object.entries(props).forEach(([key, value]) => {
                propsLines.push(`${key}: ${value}`);
            });
            
            // For text objects, also show text content
            if (object.text !== undefined) {
                propsLines.push('');
                propsLines.push('Text: ' + (object.text.length > 30 ? object.text.substring(0, 30) + '...' : object.text));
            }
            
            // Panel content
            panel.propsText.setText(propsLines.join('\n'));
            
            // Resize background
            const titleBounds = panel.title.getBounds();
            const propsBounds = panel.propsText.getBounds();
            const width = Math.max(titleBounds.width, propsBounds.width) + (this.config.padding.x * 3) + panel.closeBtn.width;
            const height = titleBounds.height + propsBounds.height + (this.config.padding.y * 3);
            
            panel.bg.clear();
            panel.bg.fillStyle(parseInt(this.config.backgroundColor.replace('#', '0x')), this.config.backgroundAlpha);
            panel.bg.lineStyle(1, 0xffffff, 0.5);
            panel.bg.fillRoundedRect(0, 0, width, height, 5);
            panel.bg.strokeRoundedRect(0, 0, width, height, 5);
            
            // Update close button position
            panel.closeBtn.setPosition(width - this.config.padding.x - panel.closeBtn.width, this.config.padding.y);
        } catch (error) {
            console.error('Error updating pinned panel:', error);
            panel.propsText.setText('Error getting properties');
        }
    }
    
    /**
     * Arrange pinned panels vertically
     */
    arrangePinnedPanels() {
        this.pinnedPanels.forEach((panel, index) => {
            panel.setPosition(10, 10 + (index * 160));
        });
    }
    
    /**
     * Update pinned panels with current object properties
     */
    update() {
        if (!this.enabled) return;
        
        this.pinnedPanels.forEach(panel => {
            this.updatePinnedPanel(panel);
        });
    }
    
    /**
     * Toggle the object identifier on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        
        // Update visibility
        this.highlight.visible = this.enabled;
        this.infoPanel.visible = false;
        
        // Update pinned panels
        this.pinnedPanels.forEach(panel => {
            panel.visible = this.enabled;
        });
        
        console.log(`ObjectIdentifier: ${this.enabled ? 'Enabled' : 'Disabled'}`);
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        // Remove event listeners
        this.scene.input.off('pointermove', this.onPointerMove, this);
        this.scene.input.off('pointerdown', this.onPointerDown, this);
        
        // Destroy graphics objects
        if (this.highlight) this.highlight.destroy();
        if (this.infoPanel) this.infoPanel.destroy();
        
        // Destroy pinned panels
        this.pinnedPanels.forEach(panel => panel.destroy());
        this.pinnedPanels = [];
        this.pinnedObjects = [];
        
        console.log('ObjectIdentifier: Destroyed');
    }
}

// Make the class globally available
window.ObjectIdentifier = ObjectIdentifier;