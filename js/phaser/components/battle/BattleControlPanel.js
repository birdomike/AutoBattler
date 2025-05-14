/**
 * BattleControlPanel.js
 * UI component for controlling battle flow in the Phaser Battle Scene
 * 
 * @version 0.5.4.0
 */

class BattleControlPanel extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        // Track panel state
        this.state = {
            battleStarted: false,
            battlePaused: false,
            currentSpeed: 1
        };
        
        // Configuration for tooltip-style panel
        this.config = {
            backgroundColor: 0x111825,  // Dark navy blue background (same as tooltips)
            backgroundAlpha: 0.9,       // Slightly less transparent
            borderColor: 0x3498db,      // Bright blue border (same as tooltips)
            borderWidth: 1,             // Thinner border
            cornerRadius: 6,            // Rounded corners
            textColor: '#ffffff',       // White text
            buttonSpacing: 8,           // Space between buttons
            padding: 10                 // Internal padding
        };
        
        // Create panel components
        this.createPanel();
        
        // Add to scene and make interactive
        scene.add.existing(this);
    }
    
    /**
     * Create the panel background and controls
     */
    createPanel() {
        try {
            // Calculate compact panel size
            const buttonWidth = 45; // Reduced from 60 to make more compact
            const buttonHeight = 30;
            const buttonSpacing = 5; // Reduced from 8 to make more compact
            const width = (buttonWidth * 6) + (buttonSpacing * 7) + (this.config.padding * 2);
            const height = buttonHeight + (this.config.padding * 2) + 20; // Extra space for title
            
            // Create container for background and border
            this.bgContainer = this.scene.add.container(0, 0);
            this.add(this.bgContainer);
            
            // Create background with gradient fill (like tooltips)
            this.graphics = this.scene.add.graphics();
            
            // Create gradient background
            const bgTopColor = this.config.backgroundColor;
            const bgBottomColor = Phaser.Display.Color.IntegerToRGB(bgTopColor);
            bgBottomColor.r = Math.max(0, bgBottomColor.r - 10);
            bgBottomColor.g = Math.max(0, bgBottomColor.g - 10);
            bgBottomColor.b = Math.max(0, bgBottomColor.b - 10);
            const bgBottomColorInt = Phaser.Display.Color.GetColor(
                bgBottomColor.r, 
                bgBottomColor.g, 
                bgBottomColor.b
            );
            
            // Draw background with subtle gradient
            this.graphics.fillGradientStyle(
                bgTopColor, bgTopColor,  // Top colors
                bgBottomColorInt, bgBottomColorInt,  // Bottom colors
                this.config.backgroundAlpha
            );
            
            // Draw rounded rectangle background (centered at 0,0)
            this.graphics.fillRoundedRect(
                -width/2,
                -height/2,
                width,
                height,
                this.config.cornerRadius
            );
            
            // Draw border
            this.graphics.lineStyle(
                this.config.borderWidth,
                this.config.borderColor,
                1
            );
            this.graphics.strokeRoundedRect(
                -width/2 + this.config.borderWidth/2,
                -height/2 + this.config.borderWidth/2,
                width - this.config.borderWidth,
                height - this.config.borderWidth,
                this.config.cornerRadius
            );
            
            this.bgContainer.add(this.graphics);
            
            // Add panel title (small and at the top)
            this.titleText = this.scene.add.text(
                0, -height/2 + 10, 
                'Battle Controls', 
                { 
                    fontFamily: 'Arial', 
                    fontSize: '12px', 
                    color: this.config.textColor,
                    align: 'center'
                }
            ).setOrigin(0.5, 0.5);
            this.add(this.titleText);
            
            // Calculate button positions
            const startX = -width/2 + this.config.padding + buttonWidth/2;
            const buttonsY = 0;
            
            // Create Start/Pause Battle button as icon button (toggles between states)
            this.startPauseButton = this.createIconButton(
                startX, 
                buttonsY, 
                '▶️', // Play icon only for initial state
                () => this.onStartPauseButtonClicked(),
                'Start/Pause Battle'
            );
            
            // Create Speed buttons (1x, 2x, 3x)
            const speeds = [1, 2, 3];
            this.speedButtons = [];
            
            speeds.forEach((speed, index) => {
                const x = startX + (index + 1) * (buttonWidth + buttonSpacing);
                const button = this.createCompactButton(
                    x,
                    buttonsY,
                    `${speed}x`,
                    () => this.onSpeedButtonClicked(speed)
                );
                
                // Store reference for later use
                this.speedButtons.push(button);
                
                // Highlight 1x speed by default
                if (speed === 1) {
                    this.highlightSpeedButton(button);
                }
            });
            
            // Add a vertical divider after speed controls
            this.addVerticalDivider(startX + 4 * (buttonWidth + buttonSpacing) - buttonSpacing/2);
            
            // Add copy log button after divider
            this.copyButton = this.createIconButton(
                startX + 5 * (buttonWidth + buttonSpacing),
                buttonsY,
                '📋', // Clipboard icon
                () => this.copyBattleLog(),
                'Copy Battle Log'
            );
            
        } catch (error) {
            console.error('Error creating compact battle control panel:', error);
            // Create a minimal fallback panel in case of error
            this.createFallbackPanel();
        }
    }
    
    /**
     * Create a minimal fallback panel in case of error
     */
    createFallbackPanel() {
        // Simple background
        this.graphics = this.scene.add.graphics();
        this.graphics.fillStyle(0x222233, 0.8);
        this.graphics.fillRect(-100, -20, 200, 40);
        this.add(this.graphics);
        
        // Simple start button
        this.startPauseButton = this.scene.add.text(
            0, 0, 
            'Start', 
            { 
                fontFamily: 'Arial', 
                fontSize: '14px', 
                color: '#FFFFFF', 
                backgroundColor: '#225588',
                padding: { x: 8, y: 4 }
            }
        ).setOrigin(0.5, 0.5)
         .setInteractive({ useHandCursor: true })
         .on('pointerdown', () => this.onStartPauseButtonClicked());
        
        this.add(this.startPauseButton);
    }
    
    /**
     * Create a compact button styled like tooltips
     */
    createCompactButton(x, y, text, callback, tooltip = null) {
        // Create a container for the button
        const buttonContainer = this.scene.add.container(x, y);
        
        // Button dimensions
        const buttonWidth = 45; // Reduced from 60 to make more compact
        const buttonHeight = 30;
        
        // Create button background (rounded rectangle)
        const buttonGraphics = this.scene.add.graphics();
        buttonGraphics.fillStyle(0x225588, 1);
        buttonGraphics.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 4);
        buttonGraphics.lineStyle(1, 0x3498db, 1);
        buttonGraphics.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 4);
        
        // Create button text
        const buttonText = this.scene.add.text(
            0, 0, 
            text, 
            { 
                fontFamily: 'Arial', 
                fontSize: '12px', 
                color: '#FFFFFF',
                align: 'center'
            }
        ).setOrigin(0.5, 0.5);
        
        // Add components to container
        buttonContainer.add([buttonGraphics, buttonText]);
        
        // Make interactive with hitArea for better touch/click
        const hitArea = new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight);
        buttonGraphics.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => {
                buttonGraphics.clear();
                buttonGraphics.fillStyle(0x3daddf, 1);
                buttonGraphics.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 4);
                buttonGraphics.lineStyle(1, 0x3498db, 1);
                buttonGraphics.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 4);
                buttonText.setScale(1.05);
            })
            .on('pointerout', () => {
                buttonGraphics.clear();
                buttonGraphics.fillStyle(0x225588, 1);
                buttonGraphics.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 4);
                buttonGraphics.lineStyle(1, 0x3498db, 1);
                buttonGraphics.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 4);
                buttonText.setScale(1);
            })
            .on('pointerdown', () => {
                buttonGraphics.clear();
                buttonGraphics.fillStyle(0x1a4266, 1);
                buttonGraphics.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 4);
                buttonGraphics.lineStyle(1, 0x3498db, 1);
                buttonGraphics.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 4);
                buttonText.setScale(0.95);
                
                // Play button sound if available
                if (window.soundManager) {
                    window.soundManager.play('click');
                }
            })
            .on('pointerup', () => {
                buttonGraphics.clear();
                buttonGraphics.fillStyle(0x3daddf, 1);
                buttonGraphics.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 4);
                buttonGraphics.lineStyle(1, 0x3498db, 1);
                buttonGraphics.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 4);
                buttonText.setScale(1.05);
                callback();
            });
        
        // Add the button container to the panel
        this.add(buttonContainer);
        
        // Store references for highlighting/unhighlighting
        buttonContainer.graphics = buttonGraphics;
        buttonContainer.text = buttonText;
        
        return buttonContainer;
    }
    
    /**
     * Create an icon button with emoji
     */
    createIconButton(x, y, iconText, callback, tooltip = null) {
        // Create a container for the button
        const buttonContainer = this.scene.add.container(x, y);
        
        // Button dimensions - square for icons
        const buttonSize = 30; // Reduced from 36 to make more compact
        
        // Create button background (rounded rectangle)
        const buttonGraphics = this.scene.add.graphics();
        buttonGraphics.fillStyle(0x225588, 1);
        buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
        buttonGraphics.lineStyle(1, 0x3498db, 1);
        buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
        
        // Create button icon text
        const iconTextObj = this.scene.add.text(
            0, 0, 
            iconText, 
            { 
                fontFamily: 'Arial', 
                fontSize: '20px', 
                color: '#FFFFFF',
                align: 'center'
            }
        ).setOrigin(0.5, 0.5);
        
        // Add components to container
        buttonContainer.add([buttonGraphics, iconTextObj]);
        
        // Add tooltip if provided
        if (tooltip) {
            buttonContainer.tooltip = tooltip;
            
            buttonGraphics.on('pointerover', () => {
                if (this.currentTooltip) {
                    this.currentTooltip.destroy();
                }
                
                this.currentTooltip = this.scene.add.text(
                    buttonContainer.x,
                    buttonContainer.y - 30,
                    tooltip,
                    {
                        fontFamily: 'Arial',
                        fontSize: '12px',
                        color: '#ffffff',
                        backgroundColor: '#000000',
                        padding: { x: 5, y: 3 }
                    }
                ).setOrigin(0.5, 1)
                 .setDepth(1000);
                
                this.scene.add.existing(this.currentTooltip);
            });
            
            buttonGraphics.on('pointerout', () => {
                if (this.currentTooltip) {
                    this.currentTooltip.destroy();
                    this.currentTooltip = null;
                }
            });
        }
        
        // Make interactive with hitArea for better touch/click
        const hitArea = new Phaser.Geom.Rectangle(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize);
        buttonGraphics.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => {
                buttonGraphics.clear();
                buttonGraphics.fillStyle(0x3daddf, 1);
                buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                buttonGraphics.lineStyle(1, 0x3498db, 1);
                buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                iconTextObj.setScale(1.05);
            })
            .on('pointerout', () => {
                buttonGraphics.clear();
                buttonGraphics.fillStyle(0x225588, 1);
                buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                buttonGraphics.lineStyle(1, 0x3498db, 1);
                buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                iconTextObj.setScale(1);
            })
            .on('pointerdown', () => {
                buttonGraphics.clear();
                buttonGraphics.fillStyle(0x1a4266, 1);
                buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                buttonGraphics.lineStyle(1, 0x3498db, 1);
                buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                iconTextObj.setScale(0.95);
                
                // Play button sound if available
                if (window.soundManager) {
                    window.soundManager.play('click');
                }
            })
            .on('pointerup', () => {
                buttonGraphics.clear();
                buttonGraphics.fillStyle(0x3daddf, 1);
                buttonGraphics.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                buttonGraphics.lineStyle(1, 0x3498db, 1);
                buttonGraphics.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 4);
                iconTextObj.setScale(1.05);
                callback();
            });
        
        // Add the button container to the panel
        this.add(buttonContainer);
        
        // Store references for highlighting/unhighlighting
        buttonContainer.graphics = buttonGraphics;
        buttonContainer.icon = iconTextObj;
        
        return buttonContainer;
    }
    
    /**
     * Add a vertical divider line
     */
    addVerticalDivider(x) {
        // Create a subtle vertical line as visual separator
        const divider = this.scene.add.line(x, 0, 0, -15, 0, 15, 0x4dabff, 0.4);
        this.add(divider);
        return divider;
    }
    
    /**
     * Handle Start/Pause button click
     */
    onStartPauseButtonClicked() {
        try {
            // Toggle between start and pause based on current state
            if (!this.state.battleStarted) {
                this.startBattle();
            } else {
                this.togglePause();
            }
        } catch (error) {
            console.error('Error with battle control:', error);
            this.showFloatingMessage('Error controlling battle', 0xff0000);
        }
    }
    
    /**
     * Start the battle
     */
    startBattle() {
        // Use global accessor function to get bridge instance
        const battleBridge = window.getBattleBridge();
        
        // Dispatch appropriate event to bridge
        if (battleBridge) {
            console.log('BattleControlPanel: Start Battle clicked');
            
            // Get the team data from the scene
            const playerTeam = this.scene.playerTeam || [];
            const enemyTeam = this.scene.enemyTeam || [];
            
            console.log(`BattleControlPanel: Using team data from scene - Player: ${playerTeam.length} heroes, Enemy: ${enemyTeam.length} heroes`);
            
            // Send a test message to the battle log to verify working
            battleBridge.dispatchEvent(battleBridge.eventTypes.BATTLE_LOG, {
                message: "Battle starting",
                type: "action"
            });
            
            battleBridge.dispatchEvent(battleBridge.eventTypes.BATTLE_UI_INTERACTION, {
                action: 'start_battle',
                source: 'ui_control',
                playerTeamSize: playerTeam.length,
                enemyTeamSize: enemyTeam.length
            });
            
            // Call start battle method on bridge if it exists, passing team data
            if (typeof battleBridge.startBattle === 'function') {
                // Make deep copies of the team data
                const playerTeamCopy = JSON.parse(JSON.stringify(playerTeam));
                const enemyTeamCopy = JSON.parse(JSON.stringify(enemyTeam));
                
                battleBridge.startBattle(playerTeamCopy, enemyTeamCopy);
            } else {
                // Alternative: call directly on BattleManager
                if (this.scene.battleConfig && this.scene.battleConfig.battleManager) {
                    // Make deep copies of the team data
                    const playerTeamCopy = JSON.parse(JSON.stringify(playerTeam));
                    const enemyTeamCopy = JSON.parse(JSON.stringify(enemyTeam));
                    
                    this.scene.battleConfig.battleManager.startBattle(playerTeamCopy, enemyTeamCopy);
                }
            }
            
            // Update button states
            this.state.battleStarted = true;
            this.startPauseButton.icon.setText('⏸️'); // Pause icon
            
            // Show success message
            this.showFloatingMessage('Battle Started!');
        } else {
            console.error('BattleControlPanel: No battle bridge found');
            this.showFloatingMessage('Error: Battle system not ready', 0xff0000);
        }
    }
    
    /**
     * Toggle battle pause state
     */
    togglePause() {
        // Toggle paused state
        this.state.battlePaused = !this.state.battlePaused;
        
        // Update button icon
        this.startPauseButton.icon.setText(this.state.battlePaused ? '▶️' : '⏸️'); // Play or Pause icons
        
        // Call appropriate method on bridge
        const battleBridge = window.getBattleBridge();
        if (battleBridge) {
            if (this.state.battlePaused) {
                // Use requestPause method which will call battleManager.pauseBattle()
                battleBridge.requestPause();
                this.showFloatingMessage('Battle Paused');
            } else {
                // Use requestResume method which will call battleManager.resumeBattle()
                battleBridge.requestResume();
                this.showFloatingMessage('Battle Resumed');
            }
        } else if (window.battleManager) {
            // Direct fallback to battleManager if bridge not available
            if (this.state.battlePaused) {
                window.battleManager.pauseBattle();
                this.showFloatingMessage('Battle Paused');
            } else {
                window.battleManager.resumeBattle();
                this.showFloatingMessage('Battle Resumed');
            }
        } else {
            console.warn('No bridge or battleManager available for pause control');
            this.showFloatingMessage('Pause control unavailable', 0xffaa00);
        }
    }
    
    /**
     * Handle Speed button click
     * @param {number} speed - The speed multiplier
     */
    onSpeedButtonClicked(speed) {
        try {
            // Only proceed if battle has started
            if (!this.state.battleStarted) {
                this.showFloatingMessage('Start the battle first!', 0xffff00);
                return;
            }
            
            console.log(`BattleControlPanel: Speed ${speed}x clicked`);
            
            // Update speed state
            this.state.currentSpeed = speed;
            
            // Highlight the selected speed button
            this.speedButtons.forEach(button => {
                if (button.text.text === `${speed}x`) {
                    this.highlightSpeedButton(button);
                } else {
                    this.unhighlightSpeedButton(button);
                }
            });
            
            // Call speed change method on bridge if it exists
            const battleBridge = window.getBattleBridge();
            if (battleBridge) {
                battleBridge.requestSpeedChange(speed);
            }
            
            // Show success message
            this.showFloatingMessage(`Speed: ${speed}x`);
        } catch (error) {
            console.error('Error changing battle speed:', error);
            this.showFloatingMessage('Error changing speed', 0xff0000);
        }
    }
    
    /**
     * Highlight a speed button to show it's active
     * @param {Phaser.GameObjects.Container} button - The button to highlight
     */
    highlightSpeedButton(button) {
        button.graphics.clear();
        button.graphics.fillStyle(0x44aa88, 1);
        button.graphics.fillRoundedRect(-30, -15, 60, 30, 4);
        button.graphics.lineStyle(2, 0x4dffc3, 1);
        button.graphics.strokeRoundedRect(-30, -15, 60, 30, 4);
    }
    
    /**
     * Remove highlight from a speed button
     * @param {Phaser.GameObjects.Container} button - The button to unhighlight
     */
    unhighlightSpeedButton(button) {
        button.graphics.clear();
        button.graphics.fillStyle(0x225588, 1);
        button.graphics.fillRoundedRect(-30, -15, 60, 30, 4);
        button.graphics.lineStyle(1, 0x3498db, 1);
        button.graphics.strokeRoundedRect(-30, -15, 60, 30, 4);
    }
    
    /**
     * Show a floating message above the panel
     * @param {string} message - The message to display
     * @param {number} color - Text color (hex)
     */
    showFloatingMessage(message, color = 0xffffff) {
        const text = this.scene.add.text(
            0, -40, 
            message, 
            { 
                fontFamily: 'Arial', 
                fontSize: '14px', 
                color: `#${color.toString(16).padStart(6, '0')}`,
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5, 0.5);
        
        this.add(text);
        
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
     * Update the panel state based on battle events
     * @param {object} data - Event data
     */
    onBattleEvent(data) {
        if (!data || !data.type) return;
        
        switch (data.type) {
            case 'battle_started':
                this.state.battleStarted = true;
                this.startPauseButton.icon.setText('⏸️'); // Pause icon
                break;
                
            case 'battle_ended':
                this.state.battleStarted = false;
                this.state.battlePaused = false;
                this.startPauseButton.icon.setText('▶️'); // Play icon only
                // Reset speed to 1x
                this.onSpeedButtonClicked(1);
                break;
        }
    }
    
    /**
     * Copy battle log to clipboard
     */
    copyBattleLog() {
        try {
            // Get the battle log from the scene
            const battleLog = this.scene.battleLog;
            
            if (!battleLog || !battleLog.completeLog || battleLog.completeLog.length === 0) {
                this.showFloatingMessage('No battle log to copy', 0xffaa00);
                return;
            }
            
            // Format log text
            const logText = battleLog.completeLog.map(entry => {
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
                this.copyButton.graphics.fillRoundedRect(-18, -18, 36, 36, 4);
                this.copyButton.graphics.lineStyle(1, 0x3498db, 1);
                this.copyButton.graphics.strokeRoundedRect(-18, -18, 36, 36, 4);
                
                // Show "Copied!" message
                const feedbackText = this.scene.add.text(
                    this.copyButton.x, 
                    this.copyButton.y - 30, 
                    'Copied!', 
                    { 
                        fontFamily: 'Arial', 
                        fontSize: '14px', 
                        color: '#48bb78',
                        stroke: '#000000',
                        strokeThickness: 2,
                    }
                ).setOrigin(0.5, 0.5);
                
                // Add feedback text to the scene directly for proper z-index
                this.scene.add.existing(feedbackText);
                
                // Animate feedback text
                this.scene.tweens.add({
                    targets: feedbackText,
                    y: this.copyButton.y - 40,
                    alpha: 0,
                    duration: 1500,
                    ease: 'Power2',
                    onComplete: () => {
                        feedbackText.destroy();
                    }
                });
                
                // Reset button color after delay
                this.scene.time.delayedCall(1000, () => {
                    this.copyButton.graphics.clear();
                    this.copyButton.graphics.fillStyle(0x225588, 1);
                    this.copyButton.graphics.fillRoundedRect(-18, -18, 36, 36, 4);
                    this.copyButton.graphics.lineStyle(1, 0x3498db, 1);
                    this.copyButton.graphics.strokeRoundedRect(-18, -18, 36, 36, 4);
                });
            }
            
            // Show success message
            this.showFloatingMessage('Battle log copied!', 0x48bb78);
        } else {
            // Show error message
            this.showFloatingMessage('Failed to copy', 0xff0000);
        }
    }
}

// Ensure the class is globally accessible
if (typeof window !== 'undefined') {
    window.BattleControlPanel = BattleControlPanel;
}