/**
 * TeamBuilderUIUpdates.js
 * Updates to the TeamBuilderUI class to support Phaser Battle Scene transition
 *
 * @version 0.5.0.3 (with added diagnostics)
 */

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if TeamBuilderUI exists
    if (typeof TeamBuilderUI !== 'function') {
        console.error('TeamBuilderUIUpdates: TeamBuilderUI class not found!');
        return;
    }

    /**
     * Start a battle with Phaser instead of DOM-based battle UI
     * @param {Array} team - The player's team
     * @param {string} battleMode - The battle mode (random, custom, campaign)
     */
    TeamBuilderUI.prototype.startBattleWithPhaser = async function(team, battleMode) {

        // --- BEGIN DIAGNOSTIC LOGS ---
        console.log(`[DEBUG] startBattleWithPhaser called at ${new Date().toLocaleTimeString()}`);
        console.log(`[DEBUG] window.game exists? `, !!window.game);
        if (window.game) {
            console.log(`[DEBUG] window.game.isRunning? `, window.game.isRunning); // Check if Phaser game loop is running
            console.log(`[DEBUG] window.game.scene exists? `, !!window.game.scene); // Check if scene manager exists
            if (window.game.scene) {
                 // Use Object.keys on the keys object provided by Phaser's scene manager
                 console.log(`[DEBUG] Scene keys known to Phaser: `, Object.keys(window.game.scene.keys));
                 // Check if the key 'BattleScene' exists within the keys object
                 console.log(`[DEBUG] BattleScene registered? `, window.game.scene.keys.hasOwnProperty('BattleScene'));
                 // Attempt to retrieve the scene instance; will be null if not added or inactive
                 console.log(`[DEBUG] Attempting to get BattleScene instance: `, window.game.scene.getScene('BattleScene'));
            } else {
                console.error("[DEBUG] window.game.scene is NOT defined!");
            }
        } else {
             console.error("[DEBUG] window.game is NOT defined when startBattleWithPhaser is called!");
        }
        // Log the data *before* preparing it, ensuring window.battleManager is checked
        console.log(`[DEBUG] Battle data prerequisites:`, { team, battleMode, battleManager: window.battleManager });
        // --- END DIAGNOSTIC LOGS ---


        try {
            // If no team is provided, use the selected heroes
            if (!team) {
                team = this.selectedHeroes.filter(hero => hero !== null);
            }

            // If no battle mode is provided, use the current mode
            if (!battleMode) {
                battleMode = this.battleMode;
            }

            console.log('Starting Phaser battle with team:', team);
            console.log('Battle mode:', battleMode);

            if (team.length === 0) {
                alert('Please select at least one hero for your team!');
                // Play error sound
                if (window.soundManager) {
                    window.soundManager.play('error');
                }
                return;
            }

            // Play battle start sound
            if (window.soundManager) {
                window.soundManager.play('battle_start');
            }

            // Initialize the team manager
            if (this.teamManager) {
                this.teamManager.setPlayerTeam(team);

                // For Custom battle, use the selected enemy team
                let teamGenerationPromise;
                if (battleMode === 'custom' && this.isSelectingEnemyTeam) {
                    const enemyTeam = this.enemySelectedHeroes.filter(hero => hero !== null);
                    if (enemyTeam.length > 0) {
                        this.teamManager.setCustomEnemyTeam(enemyTeam);
                        teamGenerationPromise = Promise.resolve(); // No async work needed
                    } else {
                        // Fallback if somehow no enemies were selected
                        teamGenerationPromise = this.teamManager.generateEnemyTeam('random');
                    }
                } else {
                    // For other modes, generate enemy team as usual
                    teamGenerationPromise = this.teamManager.generateEnemyTeam(battleMode);
                }
                
                // Wait for team generation to complete before proceeding
                console.log('Waiting for enemy team generation to complete...');
                try {
                    await teamGenerationPromise;
                    console.log('Enemy team generation complete, proceeding with battle');
                } catch (error) {
                    console.error('Error during enemy team generation:', error);
                    alert('Error generating enemy team. Please try again.');
                    return;
                }

                // Check if Phaser is properly initialized using the utility function
                if (!window.isPhaserReady || !window.isPhaserReady()) {
                    console.error('Phaser game or scene manager not ready, falling back to original battle UI');
                    // Fallback to old battle UI, but only if not already in a fallback loop
                    if (!this._fallingBack) {
                        this._fallingBack = true;
                        this.startBattleWithOriginalUI(team, battleMode);
                        setTimeout(() => { this._fallingBack = false; }, 500); // Reset fallback flag after a delay
                    }
                    return;
                }

                // Hide the team builder UI
                const teamBuilderContainer = document.getElementById('team-builder-container');
                if (teamBuilderContainer) {
                    teamBuilderContainer.style.display = 'none';
                }

                // Show Phaser container
                const gameContainer = document.getElementById('game-container');
                if (gameContainer) {
                    gameContainer.style.display = 'block';
                }

                // Get Phaser canvas and ensure it's visible
                const canvas = document.querySelector('#game-container canvas'); // More specific selector
                if (canvas) {
                    canvas.style.display = 'block';
                } else {
                    console.warn("Phaser canvas element not found inside #game-container.");
                }

                // --- Ensure BattleScene is Added Before Starting ---
                if (!window.game.scene.getScene('BattleScene')) {
                     if (window.BattleScene) {
                         try {
                             window.game.scene.add('BattleScene', window.BattleScene);
                             console.log('[startBattleWithPhaser] BattleScene added dynamically.');
                         } catch (sceneAddError) {
                              console.error("Error dynamically adding BattleScene:", sceneAddError);
                              alert("Failed to prepare BattleScene. Cannot start battle.");
                              // Attempt to revert UI state
                              if (teamBuilderContainer) teamBuilderContainer.style.display = 'block';
                              if (gameContainer) gameContainer.style.display = 'none';
                              return;
                         }
                     } else {
                         console.error("BattleScene class not available when trying to start battle!");
                         alert("BattleScene is not loaded. Cannot start battle.");
                          // Attempt to revert UI state
                         if (teamBuilderContainer) teamBuilderContainer.style.display = 'block';
                         if (gameContainer) gameContainer.style.display = 'none';
                         return;
                     }
                 }
                 // --- End Scene Add Check ---


                try {
                    // Prepare battle data for the scene
                    const battleData = {
                        playerTeam: this.teamManager.playerTeam,
                        enemyTeam: this.teamManager.enemyTeam,
                        battleMode: battleMode,
                        battleManager: window.battleManager // Ensure this uses the correct global instance
                    };

                    // Check battleManager just before starting scene
                    if(!battleData.battleManager) {
                        console.error("CRITICAL: battleManager is undefined just before starting BattleScene!");
                        alert("Battle logic manager is missing. Cannot start battle.");
                         // Attempt to revert UI state
                         if (teamBuilderContainer) teamBuilderContainer.style.display = 'block';
                         if (gameContainer) gameContainer.style.display = 'none';
                        return;
                    }

                    // Implement polling mechanism to wait for scene to be fully registered
                    const checkSceneReadyAndStart = (sceneKey, data, maxAttempts = 20, attempt = 1) => {
                        const sceneInstance = window.game.scene.getScene(sceneKey);
                        // Also check if the key is known, as getScene might return null even if added but not fully ready
                        const sceneKeyExists = window.game.scene.keys.hasOwnProperty(sceneKey); 

                        if (sceneInstance && sceneKeyExists) {
                            console.log(`[DEBUG] BattleScene is ready on attempt ${attempt}. Starting scene...`);
                            try {
                                window.game.scene.start(sceneKey, data);
                                console.log('Phaser BattleScene started successfully via check.');
                            } catch (startError) {
                                console.error(`[DEBUG] Error during scene.start('${sceneKey}'):`, startError);
                                alert(`Failed to start BattleScene even after it seemed ready. Error: ${startError.message}`);
                                // Revert UI state
                                if (teamBuilderContainer) teamBuilderContainer.style.display = 'block';
                                if (gameContainer) gameContainer.style.display = 'none';
                            }
                        } else if (attempt < maxAttempts) {
                            console.log(`[DEBUG] BattleScene not ready yet (Attempt ${attempt}/${maxAttempts}). Waiting 100ms...`);
                            setTimeout(() => checkSceneReadyAndStart(sceneKey, data, maxAttempts, attempt + 1), 100);
                        } else {
                            console.error(`[DEBUG] BattleScene failed to become ready after ${maxAttempts} attempts.`);
                            alert("Error: Battle scene did not become ready in time. Cannot start battle.");
                            // Revert UI state
                            if (teamBuilderContainer) teamBuilderContainer.style.display = 'block';
                            if (gameContainer) gameContainer.style.display = 'none';
                        }
                    };

                    // Use the polling check instead of directly starting the scene
                    checkSceneReadyAndStart('BattleScene', battleData);
                    console.log('Initiated polling for BattleScene readiness');

                } catch (error) {
                    console.error('Error starting Phaser BattleScene:', error);
                    // Show error message to user
                    alert('There was an error starting the battle. Falling back to original battle UI.');

                    // Fallback to old battle UI
                    if (!this._fallingBack) {
                        this._fallingBack = true;
                        this.startBattleWithOriginalUI(team, battleMode);
                        setTimeout(() => { this._fallingBack = false; }, 500);
                    }
                }
            } else {
                 console.error("TeamManager not available in startBattleWithPhaser!");
                 alert("Team Manager error. Cannot start battle.");
            }
        } catch (error) {
            console.error('Error in startBattleWithPhaser:', error);
            // Attempt emergency fallback to original battle UI
            if (!this._fallingBack) {
                this._fallingBack = true;
                 // Ensure team is defined for fallback
                 const fallbackTeam = team || this.selectedHeroes.filter(hero => hero !== null);
                 const fallbackMode = battleMode || this.battleMode;
                this.startBattleWithOriginalUI(fallbackTeam, fallbackMode);
                setTimeout(() => { this._fallingBack = false; }, 500);
            }
        }
    };

    /**
     * Start a battle with the original DOM-based battle UI
     * This is used as a fallback when Phaser initialization fails
     * @param {Array} team - The player's team
     * @param {string} battleMode - The battle mode (random, custom, campaign)
     */
    TeamBuilderUI.prototype.startBattleWithOriginalUI = function(team, battleMode) {
        // Use the original startBattle method that was saved
        if (typeof this.startBattleOriginal === 'function') {
            console.log('Falling back to original battle UI');
            // Call the original function which handles its own logic
            this.startBattleOriginal();
        } else {
            console.error('Original startBattle method not found, cannot fallback');
            // Show error message to user
            alert('There was an error starting the battle. Please refresh the page and try again.');
        }
    };

    /**
     * Handle return from Phaser battle scene
     */
    TeamBuilderUI.prototype.onReturnFromPhaserBattle = function() {
        try {
            console.log('Returned from Phaser battle');

            // Show the team builder UI
            const teamBuilderContainer = document.getElementById('team-builder-container');
            if (teamBuilderContainer) {
                teamBuilderContainer.style.display = 'block'; // Or 'flex', check your CSS
            }

            // Hide Phaser container
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.style.display = 'none';
            }

            // Hide canvas specifically
            const canvas = document.querySelector('#game-container canvas');
            if (canvas) {
                canvas.style.display = 'none';
            }

            // Reset enemy team selection if needed
            if (this.isSelectingEnemyTeam) {
                this.isSelectingEnemyTeam = false;
                this.renderTeamSlots();
            }

            // Update battle modes display
            this.renderBattleModes();

            // Play UI sound
            if (window.soundManager) {
                window.soundManager.play('click');
            }
        } catch (error) {
            console.error('Error in onReturnFromPhaserBattle:', error);
            // Try showing the team builder UI anyway as a fallback
             const teamBuilderContainer = document.getElementById('team-builder-container');
             if(teamBuilderContainer) teamBuilderContainer.style.display = 'block'; // Or 'flex'
        }
    };

    /**
     * Legacy method name for backward compatibility
     */
    TeamBuilderUI.prototype.onReturnFromBattle = TeamBuilderUI.prototype.onReturnFromPhaserBattle;

    /**
     * Override the original startBattle to use Phaser version
     * Original method will be kept as fallback
     */
    // Ensure startBattleOriginal actually exists before trying to assign it
    if (typeof TeamBuilderUI.prototype.startBattle === 'function') {
         TeamBuilderUI.prototype.startBattleOriginal = TeamBuilderUI.prototype.startBattle;
    } else {
         console.error("Original TeamBuilderUI.prototype.startBattle not found for backup!");
         // Define a dummy original if needed to prevent errors later, though this indicates a bigger problem
         TeamBuilderUI.prototype.startBattleOriginal = function() { console.error("startBattleOriginal fallback called - original missing!"); };
    }


    TeamBuilderUI.prototype.startBattle = async function() {
        // For Custom Battle mode, we need to switch to enemy team selection if not done yet
        if (this.battleMode === 'custom' && !this.isSelectingEnemyTeam) {
            // Filter out empty slots
            const team = this.selectedHeroes.filter(hero => hero !== null);

            if (team.length === 0) {
                alert('Please select at least one hero for your team!');
                // Play error sound
                if (window.soundManager) {
                    window.soundManager.play('error');
                }
                return;
            }

            // Switch to enemy team selection mode
            this.isSelectingEnemyTeam = true;
            this.renderTeamSlots();
            this.updateStartBattleButton();

            // Play selection sound
            if (window.soundManager) {
                window.soundManager.play('click');
            }

            return; // Exit without starting battle
        }

        // Get the selected team
        const team = this.selectedHeroes.filter(hero => hero !== null);

        // Check if we should use Phaser battle scene or fallback to original
        const usePhaser = true; // Set to true to always use Phaser, false to use original

        if (usePhaser) {
            // Call the Phaser-specific method
            await this.startBattleWithPhaser(team, this.battleMode);
        } else {
            // Call the original DOM-based method (if it was correctly backed up)
             if (typeof this.startBattleOriginal === 'function') {
                 this.startBattleOriginal();
             } else {
                  console.error("Cannot call original startBattle - backup failed.");
                  alert("Error initiating battle.");
             }
        }
    };

    console.log('TeamBuilderUIUpdates: Successfully added methods and diagnostics to TeamBuilderUI prototype');
});