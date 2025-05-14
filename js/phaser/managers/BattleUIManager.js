/**
 * BattleUIManager.js
 * Manager for all UI components in the Battle Scene
 * 
 * Handles creation and management of:
 * - Background and scene visuals
 * - HUD elements (turn indicators, battle info)
 * - UI panels (battle log, controls)
 * - Battle outcome screens
 * 
 * @version 0.6.2.1
 */

class BattleUIManager {
    /**
     * Constructor for BattleUIManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     */
    constructor(scene) {
        // Validate dependencies
        if (!scene) {
            console.error("[BattleUIManager] Missing required scene reference");
            return;
        }
        
        this.scene = scene;
        this.components = {};
        
        console.log("[BattleUIManager] Initialized");
    }
    
    /**
     * Initialize all UI components
     */
    initializeUI() {
        try {
            console.log("[BattleUIManager] Creating UI components...");
            
            // Create background elements
            this.createBackground();
            
            // Create scene titles and header elements
            this.createSceneTitle();
            this.createWelcomeMessage();
            this.createReturnButton();
            
            // Create test pattern (for development only)
            this.createTestPattern();
            
            // Create battle controls and log
            this.createBattleControls();
            this.createBattleLogPanel();
            
            // Initialize text displays
            this.initializeTextDisplays();
            
            console.log("[BattleUIManager] UI components created successfully");
            return true;
        } catch (error) {
            console.error("[BattleUIManager] Error initializing UI:", error);
            this.showErrorMessage("Failed to initialize battle UI: " + error.message);
            return false;
        }
    }
    
    /**
     * Initialize text displays for turn and action information
     * @private
     */
    initializeTextDisplays() {
        // Initialize placeholders for text indicators
        this.turnTextIndicator = null;
        this.actionTextIndicator = null;
    }
    
    /**
     * Create the background for the battle scene
     */
    createBackground() {
        try {
            // Create a gradient background
            const width = this.scene.cameras.main.width;
            const height = this.scene.cameras.main.height;

            // Create background rectangle
            this.scene.add.rectangle(
                width / 2,
                height / 2,
                width,
                height,
                0x333344 // Navy blue color
            );

            // Add some visual interest with diagonal lines
            const graphics = this.scene.add.graphics();
            graphics.lineStyle(2, 0xffffff, 0.1);

            // Draw grid lines
            const spacing = 80;
            for (let i = 0; i < width + height; i += spacing) {
                graphics.moveTo(0, i);
                graphics.lineTo(i, 0);
            }

            graphics.strokePath();
            
            // Store reference for cleanup
            this.components.background = graphics;

            console.log("[BattleUIManager] Background created successfully");
        } catch (error) {
            console.error("[BattleUIManager] Error creating background:", error);
        }
    }
    
    /**
     * Create the scene title
     */
    createSceneTitle() {
        try {
            const sceneTitle = this.scene.add.text(
                50, // Moved further left
                50,
                '', // 'Battle Scene' text removed for being unnecessary - TODO: This function could be cleaned up entirely in a future refactor
                {
                    fontFamily: 'Arial',
                    fontSize: 24, // Reduced from 36
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4,
                resolution: 1 // Set text resolution to match the game's base resolution for this test
                }
            ).setOrigin(0.0, 0.5); // Left-align horizontally, keep vertical centering

            // Store reference for cleanup
            this.components.sceneTitle = sceneTitle;

            console.log("[BattleUIManager] Scene title created successfully");
        } catch (error) {
            console.error("[BattleUIManager] Error creating scene title:", error);
        }
    }
    
    /**
     * Create the return button to go back to the TeamBuilder
     */
    createReturnButton() {
        try {
            const button = this.scene.add.text(
                this.scene.cameras.main.width - 100,
                50,
                'Return',
                {
                    fontFamily: 'Arial',
                    fontSize: '20px',
                    color: '#ffffff',
                    backgroundColor: '#555555',
                    padding: { x: 15, y: 8 },
                resolution: 1 // Set text resolution to match the game's base resolution for this test
                }
            ).setOrigin(0.5).setInteractive({ useHandCursor: true });

            button.on('pointerdown', () => {
                console.log("[BattleUIManager] Return button clicked");
                this.returnToTeamBuilder();
            });

            button.on('pointerover', () => {
                button.setBackgroundColor('#777777');
            });

            button.on('pointerout', () => {
                button.setBackgroundColor('#555555');
            });
            
            // Store reference for cleanup
            this.components.returnButton = button;

            console.log("[BattleUIManager] Return button created successfully");
        } catch (error) {
            console.error("[BattleUIManager] Error creating return button:", error);
            this.showErrorMessage('Failed to create return button');
        }
    }
    
    /**
     * Handle returning to the TeamBuilder scene/UI
     */
    returnToTeamBuilder() {
        try {
            console.log("[BattleUIManager] Returning to Team Builder...");
            
            // Clean up battle state
            if (window.battleBridge) {
                window.battleBridge.cleanupBattleState();
            }

            // Stop the current scene properly
            this.scene.scene.stop();

            // Hide Phaser container and show DOM UI
            const phaserContainer = document.getElementById('game-container');
            if (phaserContainer) {
                phaserContainer.style.display = 'none';
            }
            const teamBuilderContainer = document.getElementById('team-builder-container');
            if (teamBuilderContainer) {
                teamBuilderContainer.style.display = 'block'; // Or 'flex' depending on your CSS
            }

            // Optionally, notify TeamBuilderUI if it exists
            if (window.teamBuilderUI && typeof window.teamBuilderUI.onReturnFromPhaserBattle === 'function') {
                window.teamBuilderUI.onReturnFromPhaserBattle();
            } else {
                console.warn("[BattleUIManager] TeamBuilderUI or onReturnFromPhaserBattle not found.");
            }

        } catch (error) {
            console.error("[BattleUIManager] Error returning to Team Builder:", error);
            // Add fallback in case of error during transition
            alert('Error returning to Team Builder. Please refresh if needed.');
            const teamBuilderContainer = document.getElementById('team-builder-container');
            if (teamBuilderContainer) teamBuilderContainer.style.display = 'block';
        }
    }
    
    /**
     * Create a welcome message showing battle data
     */
    createWelcomeMessage() {
        try {
            // Safely access team data from scene
            const playerTeam = this.scene.playerTeam || [];
            const enemyTeam = this.scene.enemyTeam || [];
            
            // Create player team summary
            const playerTeamNames = playerTeam.map(character => character.name).join(', ');
            const playerTeamText = `Player Team (${playerTeam.length}): ${playerTeamNames || 'None'}`;

            // Create enemy team summary
            const enemyTeamNames = enemyTeam.map(character => character.name).join(', ');
            const enemyTeamText = `Enemy Team (${enemyTeam.length}): ${enemyTeamNames || 'None'}`;

            // Create battle mode text
            const battleModeText = `Battle Mode: ${this.scene.battleConfig?.battleMode || 'Unknown'}`;

            // Create welcome message
            const welcomeText = this.scene.add.text(
                50, // Moved further left
                80, // Moved up to remove empty space
                `${playerTeamText}\n${enemyTeamText}\n${battleModeText}`,
                {
                    fontFamily: 'Arial',
                    fontSize: 16, // Reduced from 20
                    color: '#ffffff',
                    align: 'left', // Changed from center to left
                    stroke: '#000000',
                    strokeThickness: 2,
                resolution: 1 // Set text resolution to match the game's base resolution for this test
                }
            ).setOrigin(0.0, 0.5); // Left-align horizontally, keep vertical centering
            
            // Store reference for cleanup
            this.components.welcomeMessage = welcomeText;

            console.log("[BattleUIManager] Welcome message created successfully");
        } catch (error) {
            console.error("[BattleUIManager] Error creating welcome message:", error);
        }
    }
    
    /**
     * Create a test pattern to verify the scene is rendering correctly
     * This is a temporary visual element to confirm Phaser is working
     */
    createTestPattern() {
        try {
            // Create a container for test elements
            const testContainer = this.scene.add.container(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2
            );

            // Add colorful circles in different positions
            const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
            const radius = 30;

            for (let i = 0; i < colors.length; i++) {
                const angle = (i / colors.length) * Math.PI * 2;
                const x = Math.cos(angle) * 100;
                const y = Math.sin(angle) * 100;

                const circle = this.scene.add.circle(x, y, radius, colors[i], 0.8);
                testContainer.add(circle);

                // Add pulsing animation
                this.scene.tweens.add({
                    targets: circle,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 500 + (i * 100),
                    yoyo: true,
                    repeat: -1
                });
            }

            // Add version text
            const versionText = this.scene.add.text(0, 0, 'Battle Scene v0.6.2.1', {
                fontFamily: 'Arial',
                fontSize: 16,
                color: '#ffffff',
                align: 'center',
                resolution: 1 // Set text resolution to match the game's base resolution for this test
            }).setOrigin(0.5);

            testContainer.add(versionText);
            
            // Store reference for cleanup
            this.components.testPattern = testContainer;

            console.log("[BattleUIManager] Test pattern created successfully");
        } catch (error) {
            console.error("[BattleUIManager] Error creating test pattern:", error);
        }
    }
    
    /**
     * Create the battle control panel
     * Adds UI controls for starting battle, changing speed, pausing/resuming
     */
    createBattleControls() {
        try {
            // Create the battle control panel at the bottom of the screen
            if (typeof BattleControlPanel === 'function') {
                const battleControlPanel = new BattleControlPanel(
                    this.scene,
                    50, // 50px from left edge, aligned with other UI elements
                    this.scene.cameras.main.height - 50 // position near bottom
                );
                
                // Store reference for cleanup
                this.components.battleControlPanel = battleControlPanel;
                
                console.log("[BattleUIManager] Battle control panel created successfully");
            } else {
                console.error("[BattleUIManager] BattleControlPanel class not found");
                this.showErrorMessage('Battle controls not available');
            }
        } catch (error) {
            console.error("[BattleUIManager] Error creating battle control panel:", error);
            this.showErrorMessage('Failed to create battle controls');
        }
    }
    
    /**
     * Create the battle log for displaying battle events
     */
    createBattleLogPanel() {
        try {
            // Check if DirectBattleLog class exists
            if (typeof DirectBattleLog === 'function') {
                // Calculate half screen height for max height constraint
                const halfScreenHeight = this.scene.cameras.main.height * 0.5;
                
                // Create the direct battle log in the right side of the screen
                const battleLog = new DirectBattleLog(
                    this.scene, 
                    this.scene.cameras.main.width - 350, // X position (right side)
                    50,                                  // Y position (top)
                    300,                                 // Width
                    {
                        backgroundColor: 0x000000,
                        backgroundAlpha: 0.5,
                        fontSize: 16,
                        maxMessages: 30,
                        padding: 10,
                        maxHeight: halfScreenHeight // Limit height to half the screen
                    }
                );
                
                // Store reference for cleanup
                this.components.battleLog = battleLog;
                
                // Make the battle log accessible to the scene
                this.scene.battleLog = battleLog;
                
                // Add direct access for testing in console
                window.battleLog = battleLog;
                
                // Register the battle log with the event manager if available
                if (this.scene.eventManager && typeof this.scene.eventManager.setBattleLog === 'function') {
                    this.scene.eventManager.setBattleLog(battleLog);
                    console.log("[BattleUIManager] Registered battle log with BattleEventManager");
                } else {
                    console.warn("[BattleUIManager] BattleEventManager not available or missing setBattleLog method");
                }
                
                console.log("[BattleUIManager] Battle log created successfully");
            } else {
                console.error("[BattleUIManager] DirectBattleLog class not found");
                this.showErrorMessage('Battle log not available');
            }
        } catch (error) {
            console.error("[BattleUIManager] Error creating battle log:", error);
            this.showErrorMessage('Failed to create battle log');
        }
    }
    
    /**
     * Update the turn number display only
     * @param {number} turnNumber - The current turn number
     */
    updateTurnNumberDisplay(turnNumber) {
        try {
            // Define standard text style
            const indicatorStyle = {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: '#444444',
                padding: { x: 10, y: 5 },
                resolution: 1 // Set text resolution to match the game's base resolution for this test
            };
            
            // Position at the top of the screen
            const position = { 
                x: this.scene.cameras.main.width / 2,
                y: 80
            };
            
            // Get character name from current text if available
            let characterName = '';
            if (this.turnTextIndicator && this.turnTextIndicator.text) {
                const characterNameMatch = this.turnTextIndicator.text.match(/: ([^']+)'s Action/i);
                characterName = characterNameMatch ? characterNameMatch[1] : '';
            }
            
            // Format text based on available information
            const text = characterName 
                ? `TURN ${turnNumber}: ${characterName}'s Action`
                : `TURN ${turnNumber}`;
                
            // Get or create text object safely
            const textObj = this.safeGetTextObject(
                'turnTextIndicator', 
                position, 
                text, 
                indicatorStyle
            );
            
            // If we got a valid text object, update it
            if (textObj) {
                try {
                    textObj.setText(text);
                    
                    // Add animation effect if not already animated
                    if (!this.scene.tweens.isTweening(textObj)) {
                        this.scene.tweens.add({
                            targets: textObj,
                            scale: { from: 0.8, to: 1 },
                            duration: 300,
                            ease: 'Back.easeOut'
                        });
                    }
                } catch (textError) {
                    console.error('[BattleUIManager] Error updating turn text:', textError);
                    // Reset for recreation next time
                    this.turnTextIndicator = null;
                }
            }
            
            console.log(`[BattleUIManager] Turn number display updated to ${turnNumber}`);
        } catch (error) {
            console.error('[BattleUIManager] Error updating turn number display:', error);
            // Reset for recreation next time
            this.turnTextIndicator = null;
        }
    }
    
    /**
     * Update the action text display with character information
     * @param {number} turnNumber - The current turn number
     * @param {Object} character - The character performing an action
     */
    updateActionTextDisplay(turnNumber, character) {
        try {
            if (!character) return;
            
            // Background color based on team
            const backgroundColor = character.team === 'player' ? '#225588' : '#882255';
            
            // Create or update the text with character's information
            const text = `TURN ${turnNumber}: ${character.name}'s Action`;
            const indicatorStyle = {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: backgroundColor,
                padding: { x: 10, y: 5 }
            };
            
            // Position at the top of the screen
            const position = { 
                x: this.scene.cameras.main.width / 2,
                y: 80
            };
            
            // Get or create text object safely
            const textObj = this.safeGetTextObject(
                'turnTextIndicator', 
                position, 
                text, 
                indicatorStyle
            );
            
            // If we got a valid text object, update it
            if (textObj) {
                try {
                    textObj.setText(text);
                    textObj.setBackgroundColor(backgroundColor);
                    
                    // Add or restart animation effect
                    this.scene.tweens.killTweensOf(textObj);
                    this.scene.tweens.add({
                        targets: textObj,
                        scale: { from: 0.9, to: 1 },
                        duration: 300,
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            // Only add bounce if object is still valid
                            if (textObj.active && !textObj.destroyed) {
                                this.scene.tweens.add({
                                    targets: textObj,
                                    y: { from: 80, to: 85 },
                                    duration: 1500,
                                    yoyo: true,
                                    repeat: -1,
                                    ease: 'Sine.easeInOut'
                                });
                            }
                        }
                    });
                } catch (textError) {
                    console.error('[BattleUIManager] Error updating action text:', textError);
                    // Reset for recreation next time
                    this.turnTextIndicator = null;
                }
            }
            
            console.log(`[BattleUIManager] Action text updated for ${character.name} on turn ${turnNumber}`);
        } catch (error) {
            console.error('[BattleUIManager] Error updating action text display:', error);
            // Reset for recreation next time
            this.turnTextIndicator = null;
        }
    }
    
    /**
     * Safely gets or creates a text object
     * @param {string} objectKey - Reference property name ('turnTextIndicator', etc.)
     * @param {Object} position - {x, y} coordinates
     * @param {string} defaultText - Default text to display
     * @param {Object} style - Text style options
     * @returns {Phaser.GameObjects.Text} - Valid text object
     */
    safeGetTextObject(objectKey, position, defaultText, style) {
        try {
            // Check if the text object exists and is valid
            const currentObj = this[objectKey];
            
            if (currentObj && currentObj.active && !currentObj.destroyed) {
                // Object exists and is valid - return it
                return currentObj;
            }
            
            // Create new text object if needed
            console.log(`[BattleUIManager] Recreating ${objectKey} text object`);
            
            // Destroy old object if it exists but is invalid
            if (currentObj) {
                try {
                    currentObj.destroy();
                } catch (e) {
                    console.warn(`[BattleUIManager] Error destroying old ${objectKey}:`, e);
                }
            }
            
            // Create new text object
            const newObj = this.scene.add.text(
                position.x,
                position.y,
                defaultText,
                style
            ).setOrigin(0.5);
            
            // Store for future reference
            this[objectKey] = newObj;
            
            return newObj;
        } catch (error) {
            console.error(`[BattleUIManager] Error in safeGetTextObject for ${objectKey}:`, error);
            return null;
        }
    }
    
    /**
     * Display battle outcome screen
     * @param {string} winner - 'player', 'enemy', or 'draw'
     */
    showBattleOutcome(winner) {
        try {
            console.log(`[BattleUIManager] Showing battle outcome - Winner: ${winner}`);
            
            // Create container for outcome elements
            const container = this.scene.add.container(this.scene.cameras.main.width / 2, this.scene.cameras.main.height / 2);
            container.setDepth(1000); // Ensure it appears above everything else
            
            // Add semi-transparent background
            const background = this.scene.add.rectangle(
                0, 0, 
                this.scene.cameras.main.width, 
                this.scene.cameras.main.height, 
                0x000000, 0.7
            );
            container.add(background);
            
            // Create outcome message
            let message = '';
            let color = 0xffffff;
            
            // Handle different possible winner values
            if (winner === 'player' || winner === 'victory') {
                message = 'VICTORY!';
                color = 0x00ff00; // Green
            } else if (winner === 'enemy' || winner === 'defeat') {
                message = 'DEFEAT';
                color = 0xff0000; // Red
            } else if (winner === 'draw') {
                message = 'DRAW';
                color = 0xffff00; // Yellow
            } else {
                // Fallback for genuinely unexpected winner values
                console.warn(`[BattleUIManager] showBattleOutcome received unexpected winner value: '${winner}'. Defaulting UI to DRAW.`);
                message = 'DRAW';
                color = 0x808080; // Gray
            }
            
            // Add outcome text
            const outcomeText = this.scene.add.text(
                0, -50,
                message,
                {
                    fontFamily: 'Arial',
                    fontSize: '64px',
                    color: `#${color.toString(16).padStart(6, '0')}`,
                    stroke: '#000000',
                    strokeThickness: 6,
                    align: 'center',
                    resolution: 1, // Set text resolution to match the game's base resolution for this test
                    shadow: { color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 8 }
                }
            ).setOrigin(0.5);
            container.add(outcomeText);
            
            // Add return button
            const returnButton = this.scene.add.text(
                0, 50,
                'Return to Team Builder',
                {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#ffffff',
                    backgroundColor: '#555555',
                    padding: { x: 20, y: 10 },
                    resolution: 1 // Set text resolution to match the game's base resolution for this test
                }
            ).setOrigin(0.5).setInteractive({ useHandCursor: true });
            
            returnButton.on('pointerover', () => returnButton.setBackgroundColor('#777777'));
            returnButton.on('pointerout', () => returnButton.setBackgroundColor('#555555'));
            returnButton.on('pointerdown', () => {
                console.log('[BattleUIManager] Return to Team Builder requested by user after battle');
                this.returnToTeamBuilder();
            });
            
            container.add(returnButton);
            
            // Add animation
            this.scene.tweens.add({
                targets: container,
                scale: { from: 0.5, to: 1 },
                alpha: { from: 0, to: 1 },
                duration: 500,
                ease: 'Back.easeOut'
            });
            
            // Store reference to cleanup later
            this.components.outcomeContainer = container;
            
        } catch (error) {
            console.error('[BattleUIManager] Error showing battle outcome:', error);
        }
    }
    
    /**
     * Display error messages in the UI
     * @param {string} message - The error message to show
     */
    showErrorMessage(message) {
        console.error('[BattleUIManager] UI Error Message:', message); // Log to console

        try {
            // Create or update an error text object on the screen
            if (this.components.errorText) {
                this.components.errorText.setText(`ERROR: ${message}`);
            } else {
                const errorText = this.scene.add.text(
                    this.scene.cameras.main.centerX,
                    30, // Position near top-center
                    `ERROR: ${message}`,
                    {
                        fontFamily: 'Arial',
                        fontSize: '16px',
                        color: '#ff0000', // Red color for errors
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: { x: 10, y: 5 },
                        resolution: 1, // Set text resolution to match the game's base resolution for this test
                        wordWrap: { width: this.scene.cameras.main.width - 40 }
                    }
                ).setOrigin(0.5, 0).setDepth(1001); // Ensure it's visible
                
                this.components.errorText = errorText;
                
                // Optionally fade out the error after some time
                this.scene.time.delayedCall(5000, () => {
                    if (this.components.errorText) {
                        this.components.errorText.destroy();
                        this.components.errorText = null;
                    }
                }, [], this);
            }
        } catch (error) {
            console.error('[BattleUIManager] Error showing error message:', error);
        }
    }
    
    /**
     * Hide the test pattern when no longer needed
     */
    hideTestPattern() {
        if (this.components.testPattern) {
            this.components.testPattern.setVisible(false);
            console.log("[BattleUIManager] Test pattern hidden");
        }
    }
    
    /**
     * Clean up all UI components
     */
    destroy() {
        try {
            console.log("[BattleUIManager] Cleaning up UI components...");
            
            // Destroy all tracked components
            Object.entries(this.components).forEach(([key, component]) => {
                try {
                    if (component) {
                        if (typeof component.destroy === 'function') {
                            component.destroy();
                        } else if (component.active !== undefined) {
                            // For Phaser game objects that might not have destroy method
                            component.setVisible(false);
                            component.setActive(false);
                        }
                        console.log(`[BattleUIManager] Cleaned up ${key}`);
                    }
                } catch (error) {
                    console.error(`[BattleUIManager] Error destroying component ${key}:`, error);
                }
            });
            
            // Clear component references
            this.components = {};
            
            // Clean up text indicators
            if (this.turnTextIndicator) {
                this.turnTextIndicator.destroy();
                this.turnTextIndicator = null;
            }
            
            console.log("[BattleUIManager] UI components cleaned up successfully");
        } catch (error) {
            console.error("[BattleUIManager] Error during UI cleanup:", error);
        }
    }
}

// Make available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.BattleUIManager = BattleUIManager;
    console.log("BattleUIManager class definition loaded and exported to window.BattleUIManager");
}
