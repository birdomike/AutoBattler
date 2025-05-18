/**
 * DirectBattleLog.js
 * A simplified battle log that displays text directly on screen
 * @version 0.7.5.11
 */
class DirectBattleLog {
    constructor(scene, x, y, width, options = {}) {
        try {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.width = width;
            this.maxHeight = (options.maxHeight || scene.cameras.main.height * 0.5) + 60; // Add 30px extra space
            
            // Default options
            this.options = {
                fontSize: 16,
                fontFamily: "'Cinzel', serif",
                maxMessages: 30,
                lineSpacing: 2,
                backgroundColor: 0x000000,
                backgroundAlpha: 0.3,
                padding: 10,
                maxHeight: this.maxHeight, // Use the calculated max height
                // Card frame options
                cardStyle: {
                    borderWidth: 6,
                    cornerRadius: 12,
                    borderColor: 0xFFFFFF, // White border
                    backgroundColor: 0x000000, // Black background
                    backgroundAlpha: 0.4,
                    nameplateHeight: 30,
                    nameplateBgColor: 0x000000,
                    nameplateBgAlpha: 0.6
                },
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
            
            // Create container for control buttons positioned above the battle log frame
            this.controlButtonsContainer = this.scene.add.container(0, -30); // Position above frame
            this.container.add(this.controlButtonsContainer); // Add to container property, not 'this'
            
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
            
            // Create card frame-style background
            this.createCardFrame()
            
            // Legacy background (now handled by card frame)
            this.background = this.backdrop; // Reference the backdrop created in createCardFrame
            
            // Add control button for pausing message flow
            this.addMessagePauseToggle();
            
            // Add control button for copying battle log
            this.addCopyButton();
            
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
     * Positioned in the control buttons container above the battle log frame
     */
    addMessagePauseToggle() {
        try {
            // If we already have a toggle button, remove it first
            if (this.pauseToggle && this.pauseToggle.active) {
                this.pauseToggle.destroy();
            }
            
            // Create a container for the button
            const toggleContainer = this.scene.add.container(0, 0);
            
            // Button dimensions - square for icons
            const buttonSize = 30;
            
            // Create button background (rounded rectangle)
            const buttonGraphics = this.scene.add.graphics();
            buttonGraphics.fillStyle(0x225588, 1);
            buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
            buttonGraphics.lineStyle(1, 0x3498db, 1);
            buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
            
            // Create button icon
            const iconText = this.scene.add.text(
                0, 0, 
                '⏸️',  // Pause icon
                { 
                    fontFamily: 'Arial', 
                    fontSize: '20px', 
                    color: '#FFFFFF',
                    align: 'center'
                }
            ).setOrigin(0.5, 0.5);
            
            // Add graphics and icon to container
            toggleContainer.add([buttonGraphics, iconText]);
            
            // Add tooltip
            buttonGraphics.on('pointerover', () => {
                buttonGraphics.clear();
                buttonGraphics.fillStyle(0x3daddf, 1);
                buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                buttonGraphics.lineStyle(1, 0x3498db, 1);
                buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                iconText.setScale(1.05);
                
                // Create tooltip
                if (this.pauseTooltip) {
                    this.pauseTooltip.destroy();
                }
                
                this.pauseTooltip = this.scene.add.text(
                    toggleContainer.x,
                    toggleContainer.y - 30,
                    this.messageProcessingPaused ? 'Resume Messages' : 'Pause Messages',
                    {
                        fontFamily: 'Arial',
                        fontSize: '12px',
                        color: '#ffffff',
                        backgroundColor: '#000000',
                        padding: { x: 5, y: 3 }
                    }
                ).setOrigin(0.5, 1)
                 .setDepth(1000);
                
                this.controlButtonsContainer.add(this.pauseTooltip);
            });
            
            buttonGraphics.on('pointerout', () => {
                buttonGraphics.clear();
                buttonGraphics.fillStyle(0x225588, 1);
                buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                buttonGraphics.lineStyle(1, 0x3498db, 1);
                buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                iconText.setScale(1);
                
                if (this.pauseTooltip) {
                    this.pauseTooltip.destroy();
                    this.pauseTooltip = null;
                }
            });
            
            // Make the button interactive
            const hitArea = new Phaser.Geom.Rectangle(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize);
            buttonGraphics.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
                .on('pointerdown', () => {
                    try {
                        // Apply button press effect
                        buttonGraphics.clear();
                        buttonGraphics.fillStyle(0x1a4266, 1);
                        buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                        buttonGraphics.lineStyle(1, 0x3498db, 1);
                        buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                        iconText.setScale(0.95);
                        
                        // Toggle pause state
                        this.messageProcessingPaused = !this.messageProcessingPaused;
                        iconText.setText(this.messageProcessingPaused ? '▶️' : '⏸️');
                        
                        if (!this.messageProcessingPaused && this.messageQueue.length > 0) {
                            this.processMessageQueue(); // Resume processing
                        }
                        
                        // Play button sound if available
                        if (window.soundManager) {
                            window.soundManager.play('click');
                        }
                    } catch (error) {
                        console.error('Error handling toggle button click:', error);
                    }
                })
                .on('pointerup', () => {
                    buttonGraphics.clear();
                    buttonGraphics.fillStyle(0x3daddf, 1);
                    buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                    buttonGraphics.lineStyle(1, 0x3498db, 1);
                    buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                    iconText.setScale(1.05);
                });
            
            // Position the button in the control container (right edge)
            toggleContainer.x = this.width / 2 - buttonSize - 15; // Positioned at right edge with space for copy button
            
            // Store references for updating
            toggleContainer.graphics = buttonGraphics;
            toggleContainer.icon = iconText;
            this.pauseToggle = toggleContainer;
            
            // Add to control buttons container
            this.controlButtonsContainer.add(this.pauseToggle);
            
            return this.pauseToggle;
        } catch (error) {
            console.error('Error creating pause toggle button:', error);
            return null;
        }
    }
    
    /**
     * Add copy button for copying battle log contents
     * Positioned in the control buttons container above the battle log frame
     */
    addCopyButton() {
        try {
            // If we already have a copy button, remove it first
            if (this.copyButton && this.copyButton.active) {
                this.copyButton.destroy();
            }
            
            // Create a container for the button
            const copyContainer = this.scene.add.container(0, 0);
            
            // Button dimensions - square for icons
            const buttonSize = 30;
            
            // Create button background (rounded rectangle)
            const buttonGraphics = this.scene.add.graphics();
            buttonGraphics.fillStyle(0x225588, 1);
            buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
            buttonGraphics.lineStyle(1, 0x3498db, 1);
            buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
            
            // Create button icon
            const iconText = this.scene.add.text(
                0, 0, 
                '📋',  // Clipboard icon
                { 
                    fontFamily: 'Arial', 
                    fontSize: '20px', 
                    color: '#FFFFFF',
                    align: 'center'
                }
            ).setOrigin(0.5, 0.5);
            
            // Add graphics and icon to container
            copyContainer.add([buttonGraphics, iconText]);
            
            // Add tooltip
            buttonGraphics.on('pointerover', () => {
                buttonGraphics.clear();
                buttonGraphics.fillStyle(0x3daddf, 1);
                buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                buttonGraphics.lineStyle(1, 0x3498db, 1);
                buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                iconText.setScale(1.05);
                
                // Create tooltip
                if (this.copyTooltip) {
                    this.copyTooltip.destroy();
                }
                
                this.copyTooltip = this.scene.add.text(
                    copyContainer.x,
                    copyContainer.y - 30,
                    'Copy Battle Log',
                    {
                        fontFamily: 'Arial',
                        fontSize: '12px',
                        color: '#ffffff',
                        backgroundColor: '#000000',
                        padding: { x: 5, y: 3 }
                    }
                ).setOrigin(0.5, 1)
                 .setDepth(1000);
                
                this.controlButtonsContainer.add(this.copyTooltip);
            });
            
            buttonGraphics.on('pointerout', () => {
                buttonGraphics.clear();
                buttonGraphics.fillStyle(0x225588, 1);
                buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                buttonGraphics.lineStyle(1, 0x3498db, 1);
                buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                iconText.setScale(1);
                
                if (this.copyTooltip) {
                    this.copyTooltip.destroy();
                    this.copyTooltip = null;
                }
            });
            
            // Make the button interactive
            const hitArea = new Phaser.Geom.Rectangle(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize);
            buttonGraphics.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
                .on('pointerdown', () => {
                    try {
                        // Apply button press effect
                        buttonGraphics.clear();
                        buttonGraphics.fillStyle(0x1a4266, 1);
                        buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                        buttonGraphics.lineStyle(1, 0x3498db, 1);
                        buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                        iconText.setScale(0.95);
                        
                        // Play button sound if available
                        if (window.soundManager) {
                            window.soundManager.play('click');
                        }
                    } catch (error) {
                        console.error('Error handling copy button press:', error);
                    }
                })
                .on('pointerup', () => {
                    buttonGraphics.clear();
                    buttonGraphics.fillStyle(0x3daddf, 1);
                    buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                    buttonGraphics.lineStyle(1, 0x3498db, 1);
                    buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                    iconText.setScale(1.05);
                    
                    // Execute copy action
                    this.copyBattleLog();
                });
            
            // Position the button in the control container (right edge)
            copyContainer.x = this.width / 2 - 10; // Positioned at right edge
            
            // Store references for updating
            copyContainer.graphics = buttonGraphics;
            copyContainer.icon = iconText;
            this.copyButton = copyContainer;
            
            // Add to control buttons container
            this.controlButtonsContainer.add(this.copyButton);
            
            return this.copyButton;
        } catch (error) {
            console.error('Error creating copy button:', error);
            return null;
        }
    }
    
    /**
     * Copy battle log to clipboard
     */
    copyBattleLog() {
        try {
            if (!this.completeLog || this.completeLog.length === 0) {
                this.showFloatingMessage('No battle log to copy', 0xffaa00);
                return;
            }
            
            // Format log text
            const logText = this.completeLog.map(entry => {
                // Include turn number for context if available
                const turnPrefix = entry.turn > 0 ? `[Turn ${entry.turn}] ` : '';
                return `${turnPrefix}${entry.text}`;
            }).join('\n');
            
            // Copy to clipboard
            this.copyToClipboard(logText);
        } catch (error) {
            console.error('Error copying battle log:', error);
            this.showFloatingMessage('Error copying log', 0xff0000);
        }
    }
    
    /**
     * Copy text to clipboard with fallback
     */
    copyToClipboard(text) {
        // Try using the clipboard API with fallback
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    this.showCopyFeedback(true);
                })
                .catch(err => {
                    console.error('Clipboard API failed:', err);
                    this.fallbackCopy(text);
                });
        } else {
            this.fallbackCopy(text);
        }
    }
    
    /**
     * Fallback copy method using textarea
     */
    fallbackCopy(text) {
        try {
            // Create temporary textarea element
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed'; // Avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            // Execute copy command
            const successful = document.execCommand('copy');
            this.showCopyFeedback(successful);
            
            // Clean up
            document.body.removeChild(textArea);
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showFloatingMessage('Copy failed', 0xff0000);
        }
    }
    
    /**
     * Show visual feedback when copy succeeds
     */
    showCopyFeedback(success) {
        if (success) {
            // Flash the copy button
            if (this.copyButton && this.copyButton.graphics) {
                // Store original color
                const originalFillColor = this.copyButton.graphics.fillStyle;
                
                // Change to success color
                this.copyButton.graphics.clear();
                this.copyButton.graphics.fillStyle(0x48bb78, 1); // Green success color
                this.copyButton.graphics.fillRoundedRect(-15, -15, 30, 30, 4);
                this.copyButton.graphics.lineStyle(1, 0x3498db, 1);
                this.copyButton.graphics.strokeRoundedRect(-15, -15, 30, 30, 4);
                
                // Show "Copied!" message
                this.showFloatingMessage('Battle log copied!', 0x48bb78);
                
                // Reset button color after delay
                this.scene.time.delayedCall(1000, () => {
                    if (this.copyButton && this.copyButton.graphics) {
                        this.copyButton.graphics.clear();
                        this.copyButton.graphics.fillStyle(0x225588, 1);
                        this.copyButton.graphics.fillRoundedRect(-15, -15, 30, 30, 4);
                        this.copyButton.graphics.lineStyle(1, 0x3498db, 1);
                        this.copyButton.graphics.strokeRoundedRect(-15, -15, 30, 30, 4);
                    }
                });
            } else {
                this.showFloatingMessage('Battle log copied!', 0x48bb78);
            }
        } else {
            // Show error message
            this.showFloatingMessage('Failed to copy', 0xff0000);
        }
    }
    
    /**
     * Show a floating message above the battle log
     * @param {string} message - The message to display
     * @param {number} color - Text color (hex)
     */
    showFloatingMessage(message, color = 0xffffff) {
        const text = this.scene.add.text(
            this.width / 2, -40, 
            message, 
            { 
                fontFamily: 'Arial', 
                fontSize: '14px', 
                color: `#${color.toString(16).padStart(6, '0')}`,
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5, 0.5);
        
        this.container.add(text);
        
        // Animate the message
        this.scene.tweens.add({
            targets: text,
            y: -60,
            alpha: 0,
            duration: 1200,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
            }
        });
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
                    console.log('DirectBattleLog: BATTLE_LOG event received. Type:', data.type, 'Message:', data.message);
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
            
            // TEMPORARILY COMMENTED OUT TO DIAGNOSE ACTION MESSAGES ISSUE
            /*
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
            */
            
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
                // TEMPORARY DEBUGGING: Log what the event listener received
                console.log("[DEBUG DirectBattleLog] BATTLE_ENDED event received. data.winner:", data.winner, "Full event data:", data);
                console.trace("[DEBUG DirectBattleLog] BATTLE_ENDED listener stack trace");
                
                let message = '';
                let type = 'info';
                
                switch (data.winner) {
                    case 'player':
                    case 'victory': // Added in case 'victory' is being passed
                        message = 'Victory! Your team has won the battle!';
                        type = 'success';
                        break;
                    case 'enemy':
                    case 'defeat': // Added in case 'defeat' is being passed
                        message = 'Defeat! Your team has lost the battle.';
                        type = 'error';
                        break;
                    default:
                        // TEMPORARY DEBUGGING: Log when we're about to use the draw message
                        console.warn("[DEBUG DirectBattleLog] Using DEFAULT CASE (draw) for data.winner:", data.winner);
                        message = 'The battle ended in a draw.';
                        type = 'info';
                }
                
                // TEMPORARY DEBUGGING: Log the final message that will be added
                console.log("[DEBUG DirectBattleLog] Adding final battle end message:", message);
                
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
        
        // Special logging for action messages being processed
        if (message.type === 'action') {
            console.log(`[DirectBattleLog.processMessageQueue] ACTION MESSAGE BEING PROCESSED FROM QUEUE: "${message.text}"`);
        }
        
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
        // Special logging for action messages
        if (type === 'action') {
            console.log(`[DirectBattleLog.addMessage] ACTION MESSAGE RECEIVED TO ADD: "${message}"`);
        }
        
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
     * Create card frame visual elements
     */
    createCardFrame() {
        try {
            const style = this.options.cardStyle;
            const initialHeight = this.maxHeight; // Use maximum height from the start

            // Create backdrop (semi-transparent background)
            this.backdrop = this.scene.add.rectangle(
                style.borderWidth, style.borderWidth, 
                this.width - (style.borderWidth * 2), initialHeight - (style.borderWidth * 2),
                style.backgroundColor,
                style.backgroundAlpha
            ).setOrigin(0, 0);
            this.container.add(this.backdrop);

            // Create frame border
            this.frameBorder = this.scene.add.graphics();
            this.frameBorder.lineStyle(style.borderWidth, style.borderColor, 1);
            this.frameBorder.strokeRoundedRect(
                0, 0,
                this.width, initialHeight,
                style.cornerRadius
            );
            this.container.add(this.frameBorder);

            // Add nameplate at the bottom
            this.nameplateBg = this.scene.add.rectangle(
                style.borderWidth, initialHeight - style.nameplateHeight,
                this.width - (style.borderWidth * 2), style.nameplateHeight,
                style.nameplateBgColor,
                style.nameplateBgAlpha
            ).setOrigin(0, 0);
            this.container.add(this.nameplateBg);

            // Add "Battle Log" text
            this.nameplateText = this.scene.add.text(
                this.width / 2, initialHeight - (style.nameplateHeight / 2),
                "Battle Log",
                {
                    fontFamily: this.options.fontFamily,
                    fontSize: 16,
                    color: '#FFFFFF',
                    align: 'center'
                }
            ).setOrigin(0.5, 0.5);
            this.container.add(this.nameplateText);

            // Position nameplate and text properly
            this.updateCardFrameVisuals(initialHeight);

            return true;
        } catch (error) {
            console.error('Error creating card frame:', error);
            return false;
        }
    }

    /**
     * Update card frame visuals based on new height
     * @param {number} newHeight - New height of the battle log
     */
    updateCardFrameVisuals(newHeight) {
        try {
            const style = this.options.cardStyle;
            
            // Add a buffer to ensure text doesn't overflow the frame
            const frameHeight = newHeight + 50; // Add 50px extra buffer
            
            // Update backdrop
            if (this.backdrop) {
                this.backdrop.height = frameHeight - (style.borderWidth * 2);
            }
            
            // Update frame border
            if (this.frameBorder) {
                this.frameBorder.clear();
                this.frameBorder.lineStyle(style.borderWidth, style.borderColor, 1);
                this.frameBorder.strokeRoundedRect(
                    0, 0,
                    this.width, frameHeight,
                    style.cornerRadius
                );
            }
            
            // Update nameplate position
            if (this.nameplateBg) {
                this.nameplateBg.y = frameHeight - style.nameplateHeight;
            }
            
            // Update nameplate text position
            if (this.nameplateText) {
                this.nameplateText.y = frameHeight - (style.nameplateHeight / 2);
            }
        } catch (error) {
            console.error('Error updating card frame visuals:', error);
        }
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
            // Store control buttons container to preserve it
            const controlButtons = this.controlButtonsContainer;
            const pauseState = this.messageProcessingPaused;
            
            // Temporarily remove control buttons container from main container
            if (controlButtons) {
                this.container.remove(controlButtons, false); // false = don't destroy
            }
            
            // Now safely clear the container - this destroys all child objects including our frame elements
            this.container.removeAll(true);
            
            // Recreate card frame elements (they were destroyed by removeAll)
            this.createCardFrame();
            
            // Legacy background reference
            this.background = this.backdrop;
            
            // Re-add control buttons container if it existed
            if (controlButtons && !controlButtons.destroyed) {
                this.controlButtonsContainer = controlButtons;
                this.container.add(this.controlButtonsContainer);
            } else {
                // If container was somehow destroyed, recreate it
                this.controlButtonsContainer = this.scene.add.container(0, -30);
                this.container.add(this.controlButtonsContainer);
                
                // Also recreate the buttons
                this.addMessagePauseToggle();
                this.addCopyButton();
            }
            
            // Ensure pause state is maintained
            if (this.pauseToggle && this.pauseToggle.icon) {
                this.messageProcessingPaused = pauseState;
                this.pauseToggle.icon.setText(pauseState ? '▶️' : '⏸️');
            }
        } catch (error) {
            console.error('Error in renderMessages preparations:', error);
            // If we encounter an error, try to recover by recreating the control buttons
            if (!this.controlButtonsContainer || this.controlButtonsContainer.destroyed) {
                this.controlButtonsContainer = this.scene.add.container(0, -30);
                this.container.add(this.controlButtonsContainer);
                this.addMessagePauseToggle();
                this.addCopyButton();
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
            
            // Always maintain maximum height for the card frame
            this.updateCardFrameVisuals(this.maxHeight);
            
            // Add animation for the most recent message if requested
            if (animate && messagesToShow.length > 0 && this.container) {
                try {
                    // Find the most recent text object (it might not be the last one due to control buttons)
                    let lastMessageText = null;
                    for (let i = this.container.length - 1; i >= 0; i--) {
                        const obj = this.container.getAt(i);
                        if (obj && obj.type === 'Text' && obj !== this.pauseToggle && obj !== this.nameplateText) {
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
            
            // Make sure control buttons container is at the front
            if (this.controlButtonsContainer && this.container) {
                try {
                    this.container.bringToTop(this.controlButtonsContainer);
                } catch (error) {
                    console.error('Error bringing control buttons to top:', error);
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
        // Clean up card frame elements explicitly
        if (this.frameBorder) {
            this.frameBorder.destroy();
            this.frameBorder = null;
        }
        
        if (this.backdrop) {
            this.backdrop.destroy();
            this.backdrop = null;
        }
        
        if (this.nameplateBg) {
            this.nameplateBg.destroy();
            this.nameplateBg = null;
        }
        
        if (this.nameplateText) {
            this.nameplateText.destroy();
            this.nameplateText = null;
        }
        
        // Clean up control buttons
        if (this.controlButtonsContainer) {
            this.controlButtonsContainer.destroy();
            this.controlButtonsContainer = null;
        }
        
        // Destroy container which will clean up any remaining child objects
        if (this.container) {
            this.container.destroy();
        }
    }
}

// Make globally accessible 
window.DirectBattleLog = DirectBattleLog;