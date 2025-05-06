/**
 * DirectBattleLog.js
 * A simplified battle log that displays text directly on screen
 * @version 0.5.0.14
 */
class DirectBattleLog {
    constructor(scene, x, y, width, options = {}) {
        try {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.width = width;
            this.maxHeight = options.maxHeight || scene.cameras.main.height * 0.5; // Default to half screen height
            
            // Default options
            this.options = {
                fontSize: 16,
                fontFamily: 'Arial',
                maxMessages: 30,
                lineSpacing: 2,
                backgroundColor: 0x000000,
                backgroundAlpha: 0.3,
                padding: 10,
                maxHeight: this.maxHeight, // Use the calculated max height
                ...options
            };
            
            // Store the max height
            this.maxHeight = this.options.maxHeight;
            
            // Message storage
            this.messages = [];
            
            // Complete log history (for copying)
            this.completeLog = [];
            
            // Add message queue properties
            this.messageQueue = [];
            this.isProcessingQueue = false;
            this.messageProcessingSpeed = 200; // Base speed in ms (reduced from 800ms for better responsiveness)
            this.messageProcessingPaused = false;
            
            // Create container for all text
            // Position container at the right edge at Y=350 (aligned with teams)
            this.container = this.scene.add.container(this.x, 350);
            
            // Text message colors
            this.messageTypes = {
                default: { color: '#ffffff' },
                info: { color: '#4dabff' },
                success: { color: '#5aff5a' },
                action: { color: '#ffee55' },
                error: { color: '#ff7777' },
                player: { color: '#66bbff' },
                enemy: { color: '#ff7777' },
                critical: { color: '#ff9900' },
                type: { color: '#66ffcc' }
            };
            
            // Create semi-transparent background
            if (this.options.backgroundColor) {
                this.background = this.scene.add.rectangle(
                    0, 0, 
                    this.width, 10, // Height will be dynamically set
                    this.options.backgroundColor,
                    this.options.backgroundAlpha
                ).setOrigin(0, 0);
                this.container.add(this.background);
            }
            
            // Add control button for pausing message flow
            this.addMessagePauseToggle();
            
            // Set up event connection
            this.connectToBattleBridge();
            
            console.log('DirectBattleLog: Initialized at', this.x, this.y);
        } catch (error) {
            console.error('Error initializing DirectBattleLog:', error);
            // Create a minimal fallback
            this.container = this.scene.add.container(x, y);
            this.messages = [];
            this.messageQueue = [];
            
            // Add simple text to indicate error
            const errorText = this.scene.add.text(
                0, 0, 
                'Battle Log Error - Check Console', 
                { fontSize: '14px', fill: '#ff0000' }
            );
            this.container.add(errorText);
        }
    }
    
    /**
     * Add toggle button for pausing/resuming message flow
     */
    addMessagePauseToggle() {
        try {
            // If we already have a toggle button, remove it first
            if (this.pauseToggle && this.pauseToggle.active) {
                this.pauseToggle.destroy();
            }
            
            // Important: Use local coordinates relative to container
            const toggleButton = this.scene.add.text(
                this.width - 30, 
                10,
                '⏸️',  // Pause icon
                { 
                    fontSize: '18px', 
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: { x: 5, y: 5 }
                }
            )
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                try {
                    this.messageProcessingPaused = !this.messageProcessingPaused;
                    toggleButton.setText(this.messageProcessingPaused ? '▶️' : '⏸️');
                    
                    if (!this.messageProcessingPaused && this.messageQueue.length > 0) {
                        this.processMessageQueue(); // Resume processing
                    }
                } catch (error) {
                    console.error('Error handling toggle button click:', error);
                }
            });
            
            // Store reference to the button object
            this.pauseToggle = toggleButton;
            
            // Add to container safely
            try {
                if (this.container && this.container.add) {
                    this.container.add(this.pauseToggle);
                }
            } catch (addError) {
                console.error('Error adding pause button to container:', addError);
            }
            
            return this.pauseToggle;
        } catch (error) {
            console.error('Error creating pause toggle button:', error);
            return null;
        }
    }
    
    /**
     * Connect to BattleBridge to receive events
     */
    connectToBattleBridge() {
        // Use the global accessor function to get the bridge instance
        this.battleBridge = window.getBattleBridge();
        
        if (this.battleBridge) {
            const bridge = this.battleBridge;
            
            // Add listener specifically for speed changes
            bridge.addEventListener(bridge.eventTypes.BATTLE_UI_INTERACTION, (data) => {
                if (data.action === 'speed_change' && data.speed) {
                    this.syncWithBattleSpeed(data.speed);
                }
            });
            
            // Connect to BATTLE_LOG events
            bridge.addEventListener(bridge.eventTypes.BATTLE_LOG, (data) => {
                try {
                    console.log('DirectBattleLog received BATTLE_LOG event:', data);
                    if (!data || !data.message) {
                        console.warn('DirectBattleLog: BATTLE_LOG event missing message data', data);
                        return;
                    }
                    this.addMessage(data.message, data.type || 'default');
                } catch (error) {
                    console.warn('Error handling BATTLE_LOG event:', error);
                }
            });
            
            // Listen for turn started
            bridge.addEventListener(bridge.eventTypes.TURN_STARTED, (data) => {
                try {
                    console.log('DirectBattleLog: TURN_STARTED event received', data);
                    
                    // Check if currentCharacter exists
                    if (data.currentCharacter && data.currentCharacter.name) {
                        this.addMessage(`Turn ${data.turnNumber}: ${data.currentCharacter.name}'s turn`, 'info');
                    } else {
                        // Fallback message without character name
                        this.addMessage(`Turn ${data.turnNumber || '?'} started`, 'info');
                    }
                } catch (error) {
                    console.error('Error handling TURN_STARTED event:', error);
                    // Safe fallback
                    this.addMessage(`New turn started`, 'info');
                }
            });
            
            // Listen for CHARACTER_ACTION events (newly added)
            bridge.addEventListener(bridge.eventTypes.CHARACTER_ACTION, (data) => {
                try {
                    console.log('DirectBattleLog: CHARACTER_ACTION event received', data);
                    
                    // Skip if missing critical data
                    if (!data.character || !data.action) return;
                    
                    const character = data.character;
                    const action = data.action;
                    const team = character.team === 'player' ? 'player' : 'enemy';
                    
                    // Different handling based on action type
                    if (action.type === 'attack') {
                        // Basic attack message
                        if (action.target) {
                            this.addMessage(`${character.name} attacks ${action.target.name}`, team);
                        }
                    } else if (action.name) {
                        // Ability usage
                        const targetText = action.target ? ` on ${action.target.name}` : '';
                        this.addMessage(`${character.name} uses ${action.name}${targetText}`, team);
                    }
                } catch (error) {
                    console.error('Error handling CHARACTER_ACTION event:', error);
                }
            });
            
            // Listen for abilities
            bridge.addEventListener(bridge.eventTypes.ABILITY_USED, (data) => {
                try {
                    console.log('DirectBattleLog: ABILITY_USED event received', data);
                    const team = data.source.team === 'player' ? 'player' : 'enemy';
                    
                    // Create more detailed message if targets are available
                    let targetText = '';
                    if (data.targets && data.targets.length > 0) {
                        if (data.targets.length === 1) {
                            targetText = ` on ${data.targets[0].name}`;
                        } else {
                            targetText = ` on multiple targets`;
                        }
                    }
                    
                    this.addMessage(`${data.source.name} uses ${data.ability.name}${targetText}`, team);
                } catch (error) {
                    console.error('Error handling ABILITY_USED event:', error);
                }
            });
            
            // Listen for damage
            bridge.addEventListener(bridge.eventTypes.CHARACTER_DAMAGED, (data) => {
                try {
                    console.log('DirectBattleLog: CHARACTER_DAMAGED event received', data);
                    const team = data.target.team === 'player' ? 'player' : 'enemy';
                    
                    // Special handling for reflected damage
                    const isReflected = data.result?.damageType === 'reflected';
                    const damageSource = isReflected ? 'reflected damage from' : 'damage';
                    const sourceName = data.source ? ` from ${data.source.name}` : '';
                    
                    if (isReflected) {
                        this.addMessage(`${data.target.name} takes ${data.amount} ${damageSource} ${data.source.name} (HP: ${data.target.currentHp}/${data.target.stats.hp})`, team);
                    } else {
                        this.addMessage(`${data.target.name} takes ${data.amount} ${damageSource}${sourceName} (HP: ${data.target.currentHp}/${data.target.stats.hp})`, team);
                    }
                } catch (error) {
                    console.error('Error handling CHARACTER_DAMAGED event:', error);
                }
            });
            
            // Listen for healing
            bridge.addEventListener(bridge.eventTypes.CHARACTER_HEALED, (data) => {
                try {
                    console.log('DirectBattleLog: CHARACTER_HEALED event received', data);
                    const team = data.target.team === 'player' ? 'player' : 'enemy';
                    
                    // Include source if available
                    const sourceName = data.source ? ` by ${data.source.name}` : '';
                    this.addMessage(`${data.target.name} is healed for ${data.amount} HP${sourceName} (HP: ${data.target.currentHp}/${data.target.stats.hp})`, team);
                } catch (error) {
                    console.error('Error handling CHARACTER_HEALED event:', error);
                }
            });
            
            // Listen for passive triggers (newly added)
            bridge.addEventListener(bridge.eventTypes.PASSIVE_TRIGGERED, (data) => {
                try {
                    console.log('DirectBattleLog: PASSIVE_TRIGGERED event received', data);
                    
                    if (!data.character) return;
                    
                    const team = data.character.team === 'player' ? 'player' : 'enemy';
                    const passiveName = data.result?.message || 'passive ability triggered';
                    
                    this.addMessage(`${data.character.name}'s ${passiveName}`, team);
                } catch (error) {
                    console.error('Error handling PASSIVE_TRIGGERED event:', error);
                }
            });
            
            // Listen for status effects - already implemented
            bridge.addEventListener(bridge.eventTypes.STATUS_EFFECT_APPLIED, (data) => {
                try {
                    console.log('DirectBattleLog received STATUS_EFFECT_APPLIED event:', data);
                    
                    // Validate that essential data exists
                    if (!data || (!data.character && !data.target)) {
                        console.warn('Invalid data for STATUS_EFFECT_APPLIED event', data);
                        return;
                    }
                    
                    // Get character from either property (both are used in different contexts)
                    const character = data.character || data.target;
                    const team = character.team === 'player' ? 'player' : 'enemy';
                    
                    // Get the status effect name from various possible properties
                    let effectName = data.statusId || 'status effect';
                    
                    // Try to get the effect name from statusDefinition if available
                    if (data.statusDefinition) {
                        if (data.statusDefinition.name) {
                            effectName = data.statusDefinition.name;
                        } else if (data.statusDefinition.id) {
                            effectName = data.statusDefinition.id;
                        }
                    } 
                    // Try other potential properties if statusDefinition.name isn't available
                    else if (data.statusEffect && data.statusEffect.name) {
                        effectName = data.statusEffect.name;
                    } else if (data.effect && data.effect.name) {
                        effectName = data.effect.name;
                    }
                    
                    // Format the effect name for better readability
                    if (typeof effectName === 'string') {
                        // Remove status_ prefix if present
                        if (effectName.startsWith('status_')) {
                            effectName = effectName.replace('status_', '');
                        }
                        
                        // Replace underscores with spaces
                        effectName = effectName.replace(/_/g, ' ');
                        
                        // Capitalize first letter
                        if (effectName.length > 0) {
                            effectName = effectName.charAt(0).toUpperCase() + effectName.slice(1);
                        }
                    }
                    
                    // Create and add the message
                    const stacks = data.stacks > 1 ? ` (${data.stacks} stacks)` : '';
                    const duration = data.duration ? ` for ${data.duration} turns` : '';
                    this.addMessage(`${character.name} is affected by ${effectName}${stacks}${duration}`, team);
                } catch (error) {
                    console.warn('Error handling STATUS_EFFECT_APPLIED event:', error);
                    // Try a more basic message as fallback
                    if (data && (data.character || data.target)) {
                        const character = data.character || data.target;
                        this.addMessage(`${character.name} gained a status effect`, 'info');
                    }
                }
            });
            
            // Listen for status effects removed (newly added)
            bridge.addEventListener(bridge.eventTypes.STATUS_EFFECT_REMOVED, (data) => {
                try {
                    console.log('DirectBattleLog received STATUS_EFFECT_REMOVED event:', data);
                    
                    // Validate that essential data exists
                    if (!data || (!data.character && !data.target)) {
                        console.warn('Invalid data for STATUS_EFFECT_REMOVED event', data);
                        return;
                    }
                    
                    // Get character from either property (both are used in different contexts)
                    const character = data.character || data.target;
                    const team = character.team === 'player' ? 'player' : 'enemy';
                    
                    // Get the status effect ID from various possible properties
                    let effectName = data.statusId || 'status effect';
                    
                    // Try to get the effect name from statusDefinition if available
                    if (data.statusDefinition) {
                        if (data.statusDefinition.name) {
                            effectName = data.statusDefinition.name;
                        } else if (data.statusDefinition.id) {
                            effectName = data.statusDefinition.id;
                        }
                    }
                    
                    // Format the effect name for better readability
                    if (typeof effectName === 'string') {
                        // Remove status_ prefix if present
                        if (effectName.startsWith('status_')) {
                            effectName = effectName.replace('status_', '');
                        }
                        
                        // Replace underscores with spaces
                        effectName = effectName.replace(/_/g, ' ');
                        
                        // Capitalize first letter
                        if (effectName.length > 0) {
                            effectName = effectName.charAt(0).toUpperCase() + effectName.slice(1);
                        }
                    }
                    
                    // Create and add the message
                    this.addMessage(`${character.name}'s ${effectName} effect expired`, team);
                } catch (error) {
                    console.error('Error handling STATUS_EFFECT_REMOVED event:', error);
                    // Try a more basic message as fallback
                    if (data && (data.character || data.target)) {
                        const character = data.character || data.target;
                        this.addMessage(`${character.name}'s status effect expired`, 'info');
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
            
            // Setup direct forward from BattleManager messages via battleBridge
            // This creates a "catch-all" for messages that don't have specific event handlers
            this.setupMessageForwarder();
            
            // Add initialization messages
            this.addMessage('Battle log initialized', 'success');
            this.addMessage('Ready for battle', 'info');
            
            console.log('DirectBattleLog: Connected to BattleBridge successfully');
        } else {
            console.warn('DirectBattleLog: BattleBridge not found, will not receive battle events');
        }
    }
    
    /**
     * Setup forwarding from BattleManager messages to the battle log
     * Note: Disabled in v0.5.24.5 to prevent message duplication.
     * The issue was that this created a circular event dispatch:
     * 1. BattleManager.logMessage already dispatches events
     * 2. BattleLogManager.logMessage also dispatches events
     * 3. This method added a third dispatch of the same event
     */
    setupMessageForwarder() {
        // Skip this setup since we're already receiving events via BattleBridge properly
        console.log('DirectBattleLog: Message forwarding disabled to prevent duplication');
        
        // Original implementation commented out to preserve for reference
        /*
        if (this.scene.battleBridge && this.scene.battleBridge.battleManager) {
            const battleManager = this.scene.battleBridge.battleManager;
            
            // Store original logMessage function
            const originalLogMessage = battleManager.logMessage;
            
            // Replace with a version that also sends events to this log
            battleManager.logMessage = (message, type = 'default') => {
                // Call the original function
                originalLogMessage.call(battleManager, message, type);
                
                // Forward the message to our battle log
                this.scene.battleBridge.dispatchEvent(this.scene.battleBridge.eventTypes.BATTLE_LOG, {
                    message: message,
                    type: type
                });
            };
            
            console.log('DirectBattleLog: Setup message forwarding from BattleManager');
        }
        */
    }
    
    /**
     * Synchronize battle log speed with game speed
     * @param {number} speed - Battle speed multiplier
     */
    syncWithBattleSpeed(speed) {
        // Adjust message processing speed based on battle speed
        // Using a logarithmic scale to make higher speeds less extreme
        const scaleFactor = Math.log10(speed + 1) + 0.5;
        this.messageProcessingSpeed = Math.round(200 / scaleFactor); // Reduced base speed from 800ms to 200ms
        
        console.log(`Battle log speed adjusted: ${speed}x battle speed = ${this.messageProcessingSpeed}ms per message`);
        
        // Handle message backlog detection - more aggressive handling
        if (this.messageQueue.length > 3) { // Reduced threshold from 5 to 3
            const backlogFactor = Math.min(5, this.messageQueue.length / 2); // Increased max factor from 3 to 5, more aggressive scaling
            this.messageProcessingSpeed = Math.max(50, this.messageProcessingSpeed / backlogFactor); // Reduced minimum from 150ms to 50ms
            console.log(`Message backlog detected (${this.messageQueue.length}), adjusted to: ${this.messageProcessingSpeed}ms`);
        }
    }
    
    /**
     * Process message queue
     */
    processMessageQueue() {
        if (this.messageQueue.length === 0 || this.messageProcessingPaused) {
            this.isProcessingQueue = false;
            return;
        }
        
        this.isProcessingQueue = true;
        
        // Process one message
        const message = this.messageQueue.shift();
        this.messages.push(message);
        
        // Limit message count
        if (this.messages.length > this.options.maxMessages) {
            this.messages.shift();
        }
        
        // Update display with animation for the newest message
        this.renderMessages(true);
        
        // Schedule next message with current speed
        this.scene.time.delayedCall(
            this.messageProcessingSpeed, 
            this.processMessageQueue, 
            [], 
            this
        );
    }
    
    /**
     * Add a message to the battle log
     */
    addMessage(message, type = 'default') {
        // Create message object
        const messageObj = {
            text: message,
            type: type,
            turn: this.getCurrentTurn()
        };
        
        // Add to message queue (timestamps removed as requested)
        this.messageQueue.push(messageObj);
        
        // Also add to complete log history for copying
        this.completeLog.push(messageObj);
        
        // Start processing if not already running and not paused
        if (!this.isProcessingQueue && !this.messageProcessingPaused && this.messageQueue.length > 0) {
            this.processMessageQueue();
        }
    }
    
    /**
     * Get the current battle turn number
     */
    getCurrentTurn() {
        if (this.battleBridge && this.battleBridge.battleManager) {
            return this.battleBridge.battleManager.currentTurn || 0;
        } else if (window.battleManager) {
            return window.battleManager.currentTurn || 0;
        }
        return 0;
    }
    
    /**
     * Render all messages
     * @param {boolean} animate - Whether to animate the newest message
     */
    renderMessages(animate = false) {
        // Initialize all variables at function scope level so they're available throughout the method
        // This prevents reference errors when variables are accessed outside their declaration blocks
        let totalHeight = this.options.padding;
        let messagesToShow = [];
        let messageHeights = [];
        let totalHeightNeeded = 0;
        
        try {
            // Store current pause button state and position
            const pauseToggleState = this.messageProcessingPaused;
            const hadPauseToggle = !!this.pauseToggle;
            
            // Clear everything except the pause toggle to avoid issues
            if (this.pauseToggle) {
                // Remove the pause toggle from the container temporarily
                this.container.remove(this.pauseToggle, false); // false = don't destroy
            }
            
            // Now safely clear the container
            this.container.removeAll(true);
            
            // Recreate background if needed
            if (this.options.backgroundColor) {
                this.background = this.scene.add.rectangle(
                    0, 0, 
                    this.width, Math.min(this.maxHeight, 10), // Placeholder height, updated below and limited by maxHeight
                    this.options.backgroundColor,
                    this.options.backgroundAlpha
                ).setOrigin(0, 0);
                this.container.add(this.background);
            }
            
            // Readd the pause toggle if it existed, or create a new one
            if (hadPauseToggle && this.pauseToggle && !this.pauseToggle.destroyed) {
                // Re-add the existing toggle
                this.container.add(this.pauseToggle);
                // Ensure correct state is displayed
                this.pauseToggle.setText(pauseToggleState ? '\u25b6\ufe0f' : '\u23f8\ufe0f');
            } else {
                // Create a new toggle if needed
                this.addMessagePauseToggle();
                if (this.pauseToggle && pauseToggleState) {
                    // Restore previous pause state
                    this.messageProcessingPaused = pauseToggleState;
                    this.pauseToggle.setText('\u25b6\ufe0f');
                }
            }
        } catch (error) {
            console.error('Error in renderMessages preparations:', error);
            // If we encounter an error, try to recover by recreating the toggle
            if (!this.pauseToggle || this.pauseToggle.destroyed) {
                this.addMessagePauseToggle();
            }
        }
        
        try {
            // Track total height for background sizing
            totalHeight = this.options.padding;
            
            // Calculate available height for messages (subtracting top and bottom padding)
            const availableHeight = this.maxHeight - (this.options.padding * 2);
            
            // Reset arrays and counters
            messagesToShow = [];
            messageHeights = [];
            totalHeightNeeded = 0;
            
            // Measure all messages (starting from newest/last)
            for (let i = this.messages.length - 1; i >= 0; i--) {
                const message = this.messages[i];
                
                // Create temporary text to measure height (with proper wrapping)
                const tempText = this.scene.add.text(
                    0, 0,
                    `${message.text}`,
                    {
                        fontFamily: this.options.fontFamily,
                        fontSize: this.options.fontSize,
                        wordWrap: {
                            width: this.width - (this.options.padding * 2),
                            useAdvancedWrap: true
                        }
                    }
                );
                
                // Store the height measurement
                const messageHeight = tempText.height + this.options.lineSpacing;
                tempText.destroy(); // Remove temporary text
                
                // Check if adding this message would exceed available height
                if (totalHeightNeeded + messageHeight <= availableHeight) {
                    messagesToShow.unshift(message); // Add to beginning of array
                    messageHeights.unshift(messageHeight);
                    totalHeightNeeded += messageHeight;
                } else {
                    // No more space for messages
                    break;
                }
            }
        } catch (error) {
            console.error('Error measuring messages:', error);
            // Create empty arrays in case of error
            messagesToShow = [];
            messageHeights = [];
            totalHeightNeeded = 0;
        }
        
        try {
            // Defensive check to ensure messagesToShow is defined
            if (!messagesToShow) messagesToShow = [];
            
            // Reset total height for message positioning
            totalHeight = this.options.padding;
            
            // Now create actual text objects for messages that fit
            messagesToShow.forEach((message, index) => {
                try {
                    // Get color for this message type
                    const color = this.messageTypes[message.type]?.color || this.messageTypes.default.color;
                    
                    // Calculate position
                    const yPos = totalHeight;
                    
                    // Create text style
                    const textStyle = {
                        fontFamily: this.options.fontFamily,
                        fontSize: this.options.fontSize,
                        color: color,
                        wordWrap: {
                            width: this.width - (this.options.padding * 2),
                            useAdvancedWrap: true
                        },
                        stroke: '#000000',
                        strokeThickness: 1
                    };
                    
                    // Create text with timestamp
                    const text = this.scene.add.text(
                        this.options.padding,
                        yPos,
                        `${message.text}`,
                        textStyle
                    );
                    
                    // Add bold for important messages
                    if (message.type === 'action' || message.type === 'error' || message.type === 'success' || message.type === 'critical') {
                        text.setFontStyle('bold');
                    }
                    
                    // Add to container
                    this.container.add(text);
                    
                    // Update total height for next message
                    totalHeight += text.height + this.options.lineSpacing;
                } catch (textError) {
                    console.error('Error creating message text:', textError);
                }
            });
            
            // Update background height - capped at maxHeight
            if (this.background) {
                this.background.height = Math.min(totalHeight + this.options.padding, this.maxHeight);
            }
            
            // Add animation for the most recent message if requested
            if (animate && messagesToShow.length > 0 && this.container) {
                try {
                    // Find the most recent text object (it might not be the last one due to pause button)
                    let lastMessageText = null;
                    for (let i = this.container.length - 1; i >= 0; i--) {
                        const obj = this.container.getAt(i);
                        if (obj && obj.type === 'Text' && obj !== this.pauseToggle) {
                            lastMessageText = obj;
                            break;
                        }
                    }
                    
                    if (lastMessageText) {
                        // Start with larger scale and fade in
                        lastMessageText.setAlpha(0.7).setScale(1.05);
                        
                        // Create animation
                        this.scene.tweens.add({
                            targets: lastMessageText,
                            alpha: 1,
                            scale: 1,
                            duration: 300,
                            ease: 'Sine.easeOut'
                        });
                    }
                } catch (animError) {
                    console.error('Error animating latest message:', animError);
                }
            }
            
            // Make sure pause toggle is at the front
            if (this.pauseToggle && this.container) {
                try {
                    this.container.bringToTop(this.pauseToggle);
                } catch (error) {
                    console.error('Error bringing pause toggle to top:', error);
                }
            }
        } catch (renderError) {
            console.error('Error rendering messages:', renderError);
        }
    }
    
    /**
     * Clear all messages
     */
    clear() {
        this.messages = [];
        this.renderMessages();
    }
    
    /**
     * Destroy this battle log
     */
    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
}

// Make globally accessible 
window.DirectBattleLog = DirectBattleLog;