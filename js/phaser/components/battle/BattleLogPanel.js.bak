/**
 * BattleLogPanel.js
 * DEPRECATED: This complex panel has been replaced by DirectBattleLog.js
 * @version 0.5.0.10ce
 * @deprecated Use DirectBattleLog instead
 */

// NOTE: This entire file is marked for deletion. It has been replaced by a simpler
// DirectBattleLog implementation that doesn't use the complex panel UI.
// The code is kept for reference but will be removed in a future update.

class BattleLogPanel {
    /**
     * Create a new battle log panel
     * @param {Phaser.Scene} scene - The scene to add this panel to
     * @param {number} x - The x position of the panel
     * @param {number} y - The y position of the panel
     * @param {number} width - The width of the panel
     * @param {number} height - The height of the panel
     * @param {Object} options - Additional options for the panel
     */
    constructor(scene, x, y, width, height, options = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        // Default options
        this.options = {
            backgroundColor: 0x222233,
            backgroundAlpha: 0.95, // Further increased opacity
            textColor: '#ffffff',
            fontSize: 16, // Further increased font size
            padding: 12, // Increased padding
            maxMessages: 30, // More messages
            autoScroll: true,
            fontFamily: 'Arial',
            ...options // Override defaults with provided options
        };
        
        // Log options for debugging
        console.log('BattleLogPanel: Initialized with options:', JSON.stringify(this.options));
        
        // Initialize properties
        this.messages = [];
        this.scrollPosition = 0;
        this.isScrolling = false;
        this.isVisible = true;
        this.container = null;
        this.textObjects = [];
        this.messageTypes = {
            default: { color: '#ffffff' },   // White
            info: { color: '#4dabff' },      // Brighter blue
            success: { color: '#5aff5a' },   // Brighter green
            action: { color: '#ffee55' },    // Even brighter yellow
            error: { color: '#ff7777' },     // Even brighter red
            player: { color: '#66bbff' },    // Brighter blue for player
            enemy: { color: '#ff7777' }      // Brighter red for enemy
        };
        
        // Log message types for debugging
        console.log('BattleLogPanel: Message type colors:', JSON.stringify(this.messageTypes));
        
        // Create the UI
        this.create();
        
        // Debug - log panel position and dimensions
        console.log('BattleLogPanel: Created at position:', this.x, this.y, 'with size:', this.width, this.height);
        
        // Set up a connection to BattleBridge if possible
        this.connectToBattleBridge();
    }
    
    /**
     * Create the battle log panel UI
     */
    create() {
        // Create container
        this.container = this.scene.add.container(this.x, this.y);
        
        // Background
        this.background = this.scene.add.rectangle(
            0,
            0,
            this.width,
            this.height,
            this.options.backgroundColor,
            this.options.backgroundAlpha
        ).setOrigin(0.5);
        
        // Add border with more contrast
        this.border = this.scene.add.graphics();
        this.border.lineStyle(3, 0x4488ff, 1); // Thicker, blue border
        this.border.strokeRect(
            -this.width/2,
            -this.height/2,
            this.width, 
            this.height
        );
        
        // Create panel title
        this.titleBar = this.scene.add.rectangle(
            0,
            -this.height/2 + 15,
            this.width - 20,
            30,
            0x3366aa, // Brighter blue
            0.95 // More opaque
        ).setOrigin(0.5);
        
        this.titleText = this.scene.add.text(
            0,
            -this.height/2 + 15,
            'Battle Log',
            {
                fontFamily: this.options.fontFamily,
                fontSize: this.options.fontSize + 3, // Slightly larger
                color: '#ffffff',
                align: 'center',
                fontStyle: 'bold', // Bold text
                stroke: '#000000', // Black stroke
                strokeThickness: 2 // Thicker stroke
            }
        ).setOrigin(0.5);
        
        // Create scroll buttons
        this.createScrollButtons();
        
        // Add mask for text clipping
        const maskGraphics = this.scene.add.graphics();
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(
            this.x - this.width/2 + this.options.padding, 
            this.y - this.height/2 + 40, // Below title
            this.width - this.options.padding * 2,
            this.height - 50 // Leave space for title and controls
        );
        
        this.textMask = maskGraphics.createGeometryMask();
        
        // Create text container
        this.textContainer = this.scene.add.container(0, 0);
        this.textContainer.setMask(this.textMask);
        
        // Debug - Add visual marker for the text container origin
        const originMarker = this.scene.add.rectangle(0, 0, 10, 10, 0xff0000);
        this.textContainer.add(originMarker);
        
        // Debug - Log text container info
        console.log('BattleLogPanel: Text container created at:', this.textContainer.x, this.textContainer.y);
        // Safely log mask info without trying to access geometryMask.getBounds
        console.log('BattleLogPanel: Text mask created with parent coordinates:', 
            this.x - this.width/2 + this.options.padding, 
            this.y - this.height/2 + 40);
        
        // Debug - Add border around text area
        const textAreaBorder = this.scene.add.graphics();
        textAreaBorder.lineStyle(3, 0x00ff00, 1); // Bright green border
        textAreaBorder.strokeRect(
            -this.width/2 + this.options.padding,
            -this.height/2 + 40,
            this.width - this.options.padding * 2,
            this.height - 50
        );
        
        // Add all components to main container
        this.container.add([
            this.background,
            this.border,
            this.titleBar,
            this.titleText,
            this.textContainer,
            textAreaBorder, // Add debug border
            this.upButton,
            this.downButton,
            this.scrollTextBackground,
            this.scrollText,
            this.clearButton
        ]);
        
        // Initial state
        this.updateButtonStates();
        this.addMessage('Battle log initialized successfully', 'success');
    }
    
    /**
     * Create scroll buttons and controls
     */
    createScrollButtons() {
        const buttonStyle = {
            fontFamily: this.options.fontFamily,
            fontSize: this.options.fontSize + 4,
            color: '#ffffff',
            backgroundColor: '#444466',
            padding: { x: 10, y: 5 }
        };
        
        // Up button (at the top right)
        this.upButton = this.scene.add.text(
            this.width/2 - 30,
            -this.height/2 + 15,
            '▲',
            buttonStyle
        ).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scrollUp())
        .on('pointerover', () => this.upButton.setStyle({ backgroundColor: '#666688' }))
        .on('pointerout', () => this.upButton.setStyle({ backgroundColor: '#444466' }));
        
        // Down button (next to up button)
        this.downButton = this.scene.add.text(
            this.width/2 - 10,
            -this.height/2 + 15,
            '▼',
            buttonStyle
        ).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scrollDown())
        .on('pointerover', () => this.downButton.setStyle({ backgroundColor: '#666688' }))
        .on('pointerout', () => this.downButton.setStyle({ backgroundColor: '#444466' }));
        
        // Scroll status text
        this.scrollTextBackground = this.scene.add.rectangle(
            -this.width/2 + 60,
            -this.height/2 + 15,
            100,
            24,
            0x333344,
            0.7
        ).setOrigin(0.5);
        
        this.scrollText = this.scene.add.text(
            -this.width/2 + 60,
            -this.height/2 + 15,
            'Auto-scroll: On',
            {
                fontFamily: this.options.fontFamily,
                fontSize: this.options.fontSize - 2,
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Clear log button
        this.clearButton = this.scene.add.text(
            -this.width/2 + 140,
            -this.height/2 + 15,
            'Clear',
            buttonStyle
        ).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.clearLog())
        .on('pointerover', () => this.clearButton.setStyle({ backgroundColor: '#666688' }))
        .on('pointerout', () => this.clearButton.setStyle({ backgroundColor: '#444466' }));
    }
    
    /**
     * Connect to BattleBridge to receive events
     */
    connectToBattleBridge() {
        // Check if BattleBridge exists
        if (this.scene.battleBridge) {
            console.log('BattleLogPanel: Connecting to BattleBridge');
            
            // Set up event listeners for battle events
            const bridge = this.scene.battleBridge;
            
            // Listen for turn started
            bridge.addEventListener(bridge.eventTypes.TURN_STARTED, (data) => {
                try {
                    console.log('BattleLogPanel: TURN_STARTED event received', data);
                    this.addMessage(`Turn ${data.turnNumber}: ${data.currentCharacter.name}'s turn`, 'info');
                } catch (error) {
                    console.error('Error handling TURN_STARTED event:', error);
                }
            });
            
            // Listen for abilities
            bridge.addEventListener(bridge.eventTypes.ABILITY_USED, (data) => {
                try {
                    console.log('BattleLogPanel: ABILITY_USED event received', data);
                    const team = data.source.team === 'player' ? 'player' : 'enemy';
                    this.addMessage(`${data.source.name} uses ${data.ability.name}`, team);
                } catch (error) {
                    console.error('Error handling ABILITY_USED event:', error);
                }
            });
            
            // Listen for damage
            bridge.addEventListener(bridge.eventTypes.CHARACTER_DAMAGED, (data) => {
                try {
                    console.log('BattleLogPanel: CHARACTER_DAMAGED event received', data);
                    const team = data.target.team === 'player' ? 'player' : 'enemy';
                    this.addMessage(`${data.target.name} takes ${data.amount} damage (HP: ${data.target.currentHp}/${data.target.stats.hp})`, team);
                } catch (error) {
                    console.error('Error handling CHARACTER_DAMAGED event:', error);
                }
            });
            
            // Listen for healing
            bridge.addEventListener(bridge.eventTypes.CHARACTER_HEALED, (data) => {
                try {
                    console.log('BattleLogPanel: CHARACTER_HEALED event received', data);
                    const team = data.target.team === 'player' ? 'player' : 'enemy';
                    this.addMessage(`${data.target.name} is healed for ${data.amount} HP (HP: ${data.target.currentHp}/${data.target.stats.hp})`, team);
                } catch (error) {
                    console.error('Error handling CHARACTER_HEALED event:', error);
                }
            });
            
            // Listen for status effects
            bridge.addEventListener(bridge.eventTypes.STATUS_EFFECT_APPLIED, (data) => {
                try {
                    // Defensive check for data structure
                    if (!data || !data.target) {
                        console.warn('Invalid data for STATUS_EFFECT_APPLIED event', data);
                        return;
                    }
                    
                    // Get team for coloring
                    const team = data.target.team === 'player' ? 'player' : 'enemy';
                    
                    // Get effect information - need defensive access
                    let effectName = 'status effect';
                    
                    // Try to get the status effect name from various possible properties
                    if (data.statusEffect && data.statusEffect.name) {
                        effectName = data.statusEffect.name;
                    } else if (data.effect && data.effect.name) {
                        effectName = data.effect.name;
                    } else if (data.effect && data.effect.definitionId) {
                        effectName = data.effect.definitionId;
                    } else if (data.effectId) {
                        effectName = data.effectId;
                    }
                    
                    // Make effect name more readable by removing prefix and capitalizing
                    if (effectName.startsWith('status_')) {
                        effectName = effectName.replace('status_', '');
                    }
                    effectName = effectName.charAt(0).toUpperCase() + effectName.slice(1);
                    
                    this.addMessage(`${data.target.name} is affected by ${effectName}`, team);
                } catch (error) {
                    console.warn('Error handling STATUS_EFFECT_APPLIED event:', error);
                    // Try a more basic message as fallback
                    if (data && data.target) {
                        this.addMessage(`${data.target.name} gained a status effect`, 'info');
                    }
                }
            });
            
            // Listen for defeats
            bridge.addEventListener(bridge.eventTypes.CHARACTER_DEFEATED, (data) => {
                const team = data.character.team === 'player' ? 'player' : 'enemy';
                this.addMessage(`${data.character.name} is defeated!`, team === 'player' ? 'error' : 'success');
            });
            
            // Listen for battle end
            bridge.addEventListener(bridge.eventTypes.BATTLE_ENDED, (data) => {
                let message = '';
                let type = 'info';
                
                switch (data.winner) {
                    case 'player':
                        message = 'Victory! Your team has won the battle!';
                        type = 'success';
                        break;
                    case 'enemy':
                        message = 'Defeat! Your team has lost the battle.';
                        type = 'error';
                        break;
                    default:
                        message = 'The battle ended in a draw.';
                        type = 'info';
                }
                
                this.addMessage(message, type);
            });
            
            // Listen for the battle log events directly from BattleManager
            bridge.addEventListener(bridge.eventTypes.BATTLE_LOG, (data) => {
                try {
                    console.log('BattleLogPanel received BATTLE_LOG event:', data);
                    if (!data || !data.message) {
                        console.warn('BattleLogPanel: BATTLE_LOG event missing message data', data);
                        return;
                    }
                    this.addMessage(data.message, data.type || 'default');
                    console.log('BattleLogPanel: Added message to log:', data.message);
                } catch (error) {
                    console.warn('Error handling BATTLE_LOG event:', error);
                }
            });
            
            // Add a test message to verify panel is working properly
            this.addMessage('Battle log panel connected to battle events', 'success');
            this.addMessage('Ready for battle control input', 'info');
            this.addMessage('Test message from BattleScene via BattleBridge', 'info');
            
            console.log('BattleLogPanel: Connected to BattleBridge successfully');
        } else {
            console.warn('BattleLogPanel: BattleBridge not found, will not receive battle events');
        }
    }
    
    /**
     * Add a message to the battle log
     * @param {string} message - The message to add
     * @param {string} type - The type of message (default, info, success, error, action)
     */
    addMessage(message, type = 'default') {
        // Create timestamp
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        // Add message to array
        this.messages.push({
            text: message,
            type: type,
            timestamp: timestamp
        });
        
        // Limit message count
        if (this.messages.length > this.options.maxMessages) {
            this.messages.shift(); // Remove oldest message
        }
        
        // Render messages
        this.renderMessages();
        
        // Auto-scroll if enabled
        if (this.options.autoScroll) {
            this.scrollToBottom();
        }
    }
    
    /**
     * Render messages in the panel
     * @version 0.5.0.11 - Fixed text boundary containment
     */
    renderMessages() {
        // Clear existing text objects
        this.textObjects.forEach(obj => obj.destroy());
        this.textObjects = [];
        
        // Clear text container contents
        this.textContainer.removeAll(true);
        
        // Calculate visible range based on scroll position
        const startIndex = Math.max(0, this.messages.length - this.options.maxMessages - this.scrollPosition);
        const visibleMessages = this.messages.slice(startIndex, startIndex + this.options.maxMessages);
        
        // Calculate available width for text (accounting for padding)
        const availableWidth = this.width - (this.options.padding * 2) - 10;
        
        console.log(`Text container available width: ${availableWidth}px`);
        
        // Create text objects for each visible message
        visibleMessages.forEach((message, index) => {
            // Get color for message type
            const color = this.messageTypes[message.type]?.color || this.messageTypes.default.color;
            
            // Calculate relative Y position within container
            const yPos = index * (this.options.fontSize + 6);
            
            const textStyle = {
                fontFamily: this.options.fontFamily,
                fontSize: this.options.fontSize,
                color: color,
                wordWrap: { 
                    width: availableWidth,
                    useAdvancedWrap: true  // More accurate wrapping
                },
                stroke: '#000000',
                strokeThickness: 2,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 2,
                    stroke: true,
                    fill: true
                }
            };
            
            // Log text creation for debugging
            console.log(`Creating message ${index} at container position (${this.options.padding}, ${yPos})`);
            
            // Create message text - using CONTAINER-RELATIVE positioning
            const text = this.scene.add.text(
                this.options.padding,  // Relative X position within container
                yPos,                  // Relative Y position within container
                `[${message.timestamp}] ${message.text}`,
                textStyle
            );
            
            // Ensure text uses top-left origin
            text.setOrigin(0, 0);
            
            // Add bold for important messages
            if (message.type === 'action' || message.type === 'error' || message.type === 'success') {
                text.setFontStyle('bold');
                text.setStroke('#000000', 3);
            }
            
            // Add to text container
            this.textContainer.add(text);
            
            // Also track in our array for clean-up
            this.textObjects.push(text);
            
            console.log(`Message ${index} added to container, width=${text.width}px`);
        });
        
        // Position the textContainer appropriately within the panel
        this.textContainer.setPosition(-this.width/2 + this.options.padding, -this.height/2 + 40);
        
        // Update button states
        this.updateButtonStates();
    }
    
    /**
     * Scroll the log up
     */
    scrollUp() {
        if (this.scrollPosition < this.messages.length - this.options.maxMessages) {
            this.scrollPosition++;
            this.options.autoScroll = false; // Disable auto-scroll when manually scrolling
            this.updateScrollText();
            this.renderMessages();
        }
    }
    
    /**
     * Scroll the log down
     */
    scrollDown() {
        if (this.scrollPosition > 0) {
            this.scrollPosition--;
            this.renderMessages();
        } else {
            // If already at bottom, enable auto-scroll
            this.options.autoScroll = true;
            this.updateScrollText();
        }
    }
    
    /**
     * Scroll to the bottom of the log
     */
    scrollToBottom() {
        this.scrollPosition = 0;
        this.renderMessages();
    }
    
    /**
     * Toggle auto-scrolling
     */
    toggleAutoScroll() {
        this.options.autoScroll = !this.options.autoScroll;
        
        if (this.options.autoScroll) {
            this.scrollToBottom();
        }
        
        this.updateScrollText();
    }
    
    /**
     * Update the scroll text
     */
    updateScrollText() {
        this.scrollText.setText(`Auto-scroll: ${this.options.autoScroll ? 'On' : 'Off'}`);
    }
    
    /**
     * Clear the log
     */
    clearLog() {
        this.messages = [{
            text: 'Log cleared',
            type: 'info',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }];
        
        this.scrollPosition = 0;
        this.renderMessages();
    }
    
    /**
     * Update button states based on scroll position
     */
    updateButtonStates() {
        // Disable up button when at top
        this.upButton.setAlpha(this.scrollPosition < this.messages.length - this.options.maxMessages ? 1 : 0.5);
        
        // Disable down button when at bottom
        this.downButton.setAlpha(this.scrollPosition > 0 ? 1 : 0.5);
    }
    
    /**
     * Set the visibility of the panel
     * @param {boolean} visible - Whether the panel should be visible
     */
    setVisible(visible) {
        this.isVisible = visible;
        this.container.setVisible(visible);
    }
    
    /**
     * Toggle the visibility of the panel
     * @returns {boolean} The new visibility state
     */
    toggle() {
        this.isVisible = !this.isVisible;
        this.container.setVisible(this.isVisible);
        return this.isVisible;
    }
    
    /**
     * Resize the panel
     * @param {number} width - The new width
     * @param {number} height - The new height
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        
        // Update background
        this.background.width = width;
        this.background.height = height;
        
        // Update border
        this.border.clear();
        this.border.lineStyle(2, 0x444466, 1);
        this.border.strokeRect(
            -width/2,
            -height/2,
            width,
            height
        );
        
        // Update title bar
        this.titleBar.width = width - 20;
        this.titleBar.setPosition(0, -height/2 + 15);
        this.titleText.setPosition(0, -height/2 + 15);
        
        // Update buttons
        this.upButton.setPosition(width/2 - 30, -height/2 + 15);
        this.downButton.setPosition(width/2 - 10, -height/2 + 15);
        this.scrollTextBackground.setPosition(-width/2 + 60, -height/2 + 15);
        this.scrollText.setPosition(-width/2 + 60, -height/2 + 15);
        this.clearButton.setPosition(-width/2 + 140, -height/2 + 15);
        
        // Update mask
        const maskGraphics = this.scene.add.graphics();
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(
            this.x - width/2 + this.options.padding,
            this.y - height/2 + 40,
            width - this.options.padding * 2,
            height - 50
        );
        
        this.textMask.destroy();
        this.textMask = maskGraphics.createGeometryMask();
        this.textContainer.setMask(this.textMask);
        
        // Re-render messages
        this.renderMessages();
    }
    
    /**
     * Update method for animation or dynamic content
     * @param {number} time - The current time
     * @param {number} delta - The time since the last update
     */
    update(time, delta) {
        // Intentionally left empty for now
    }
    
    /**
     * Clean up resources used by this component
     */
    /**
     * Utility method to debug text rendering
     * Creates test text with unmissable styling
     */
    createDebugText() {
        try {
            console.log('Creating debug test text...');
            
            // Create a test text directly in the panel
            const testStyle = { 
                font: '24px Arial', 
                fill: '#FF0000',      // Bright red text
                backgroundColor: '#FFFF00',  // Yellow background
                padding: { x: 5, y: 5 }
            };
            
            // Create central test text
            const testX = this.x;
            const testY = this.y;
            const testText = this.scene.add.text(testX, testY, 'TEST TEXT RENDERING', testStyle);
            testText.setOrigin(0.5); // Center it
            testText.setDepth(100);
            
            console.log('Debug test text created at scene coords:', testX, testY);
            
            // Also create text at top-left of white area
            const cornerText = this.scene.add.text(
                this.x - this.width/2 + 20, // Left edge of panel + padding
                this.y - this.height/2 + 40, // Top of content area
                'CORNER TEXT',
                {
                    font: '20px Arial',
                    fill: '#0000FF',      // Blue text
                    backgroundColor: '#00FF00', // Green background
                    padding: { x: 5, y: 5 }
                }
            );
            cornerText.setOrigin(0, 0);
            cornerText.setDepth(100);
            
            console.log('Corner text created at absolute position:', 
                this.x - this.width/2 + 20, 
                this.y - this.height/2 + 40);
                
            return [testText, cornerText];
        } catch(e) {
            console.error("Error creating debug text:", e);
            return null;
        }
    }
    
    destroy() {
        // Remove any event listeners
        if (this.scene.battleBridge) {
            // Optionally remove specific event listeners if needed
        }
        
        // Destroy text objects directly
        this.textObjects.forEach(obj => obj.destroy());
        
        // Destroy mask if it exists
        if (this.textMask) this.textMask.destroy();
        
        // Destroy container and all children
        if (this.container) this.container.destroy();
    }
}

// Make globally accessible
window.BattleLogPanel = BattleLogPanel;
