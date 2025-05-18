/**
 * BattleInitiator - Handles battle start logic and transition
 * 
 * This component is responsible for handling battle initiation,
 * team validation, UI transition, and battle manager initialization.
 */
class BattleInitiator {
  /**
   * Create a new BattleInitiator
   * @param {TeamBuilderUI} parentUI - Reference to the main TeamBuilderUI
   */
  constructor(parentUI) {
    // Validate parent
    if (!parentUI) {
      console.error("[BattleInitiator] parentUI is required");
      return;
    }
    
    this.parentUI = parentUI;
    
    // Required references from parent
    this.teamManager = parentUI.teamManager;
    this.battleModeManager = parentUI.battleModeManager;
    this.teamSlotsManager = parentUI.teamSlotsManager;
    
    console.log("[BattleInitiator] Initialized");
  }
  
  /**
   * Start a battle with the selected team
   */
  async initiateBattle() {
    // Get state from components
    let battleMode = 'random';
    let isSelectingEnemyTeam = false;
    let playerTeam = [];
    let enemyTeam = [];
    
    // Get battle mode from BattleModeManager if available
    if (this.battleModeManager) {
      battleMode = this.battleModeManager.getBattleMode();
    } else if (this.parentUI) {
      battleMode = this.parentUI.battleMode;
    }
    
    // Get teams from TeamSlotsManager if available
    if (this.teamSlotsManager) {
      isSelectingEnemyTeam = this.teamSlotsManager.isSelectingEnemyTeam;
      playerTeam = this.teamSlotsManager.getPlayerTeam().filter(hero => hero !== null);
      enemyTeam = this.teamSlotsManager.getEnemyTeam().filter(hero => hero !== null);
    } else if (this.parentUI) {
      isSelectingEnemyTeam = this.parentUI.isSelectingEnemyTeam;
      playerTeam = this.parentUI.selectedHeroes.filter(hero => hero !== null);
      enemyTeam = this.parentUI.enemySelectedHeroes.filter(hero => hero !== null);
    }
    
    // For Custom Battle mode, we need to switch to enemy team selection if not done yet
    if (battleMode === 'custom' && !isSelectingEnemyTeam) {
      if (playerTeam.length === 0) {
        alert('Please select at least one hero for your team!');
        // Play error sound
        if (window.soundManager) {
          window.soundManager.play('error');
        }
        return;
      }
      
      // Switch to enemy team selection mode using TeamSlotsManager if available
      if (this.teamSlotsManager) {
        this.teamSlotsManager.toggleTeamSelection(true);
      } else if (this.parentUI) {
        this.parentUI.isSelectingEnemyTeam = true;
        this.parentUI.renderTeamSlots();
        this.parentUI.updateStartBattleButton();
      }
      
      // Play selection sound
      if (window.soundManager) {
        window.soundManager.play('click');
      }
      
      return; // Exit without starting battle
    }
    
    // Validate player team
    if (playerTeam.length === 0) {
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

    console.log('Starting battle with team:', playerTeam);
    console.log('Battle mode:', battleMode);

    // Initialize the team manager
    if (this.teamManager) {
      this.teamManager.setPlayerTeam(playerTeam);
      
      // For Custom battle, use the selected enemy team
      let teamGenerationPromise;
      if (battleMode === 'custom' && isSelectingEnemyTeam) {
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

      // Check if Phaser is properly initialized
      if (!window.isPhaserReady || !window.isPhaserReady()) {
        console.error('Phaser game or scene manager not ready, falling back to original battle UI');
        // Fallback to old battle UI
        this.startBattleWithDOMFallback(playerTeam, battleMode);
        return;
      }

      // Start with Phaser battle scene
      await this.startBattleWithPhaser(playerTeam, battleMode);
    } else {
      console.error('[BattleInitiator] teamManager not found. Cannot start battle.');
    }
    
    // Return success state
    return true;
  }
  
  /**
   * Dynamically load the BattleUI script and start battle
   */
  loadBattleUIAndStart() {
    const loadBattleUI = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'js/ui/BattleUI.js';
      script.onload = () => {
        console.log('[BattleInitiator] BattleUI script loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.error('[BattleInitiator] Failed to load BattleUI script');
        reject(new Error('Failed to load BattleUI script'));
      };
      document.head.appendChild(script);
    });
    
    // Try to load the script before continuing
    loadBattleUI.then(() => {
      this.startBattleWithDelay();
    }).catch(error => {
      console.error('[BattleInitiator] Error loading BattleUI:', error);
      alert('Failed to load battle system. Please refresh and try again.');
    });
  }
  
  /**
   * Start a battle with Phaser instead of DOM-based battle UI
   * @param {Array} team - The player's team
   * @param {string} battleMode - The battle mode (random, custom, campaign)
   */
  async startBattleWithPhaser(team, battleMode) {
    console.log(`[BattleInitiator] Starting Phaser battle at ${new Date().toLocaleTimeString()}`);
    console.log(`[BattleInitiator] Phaser ready check:`, {
      gameExists: !!window.game,
      isRunning: window.game?.isRunning,
      sceneManager: !!window.game?.scene,
      battleSceneRegistered: window.game?.scene?.keys?.hasOwnProperty('BattleScene')
    });

    try {
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
      const canvas = document.querySelector('#game-container canvas');
      if (canvas) {
        canvas.style.display = 'block';
      } else {
        console.warn('[BattleInitiator] Phaser canvas element not found inside #game-container.');
      }

      // Ensure BattleScene is added before starting
      if (!window.game.scene.getScene('BattleScene')) {
        if (window.BattleScene) {
          try {
            window.game.scene.add('BattleScene', window.BattleScene);
            console.log('[BattleInitiator] BattleScene added dynamically.');
          } catch (sceneAddError) {
            console.error('[BattleInitiator] Error dynamically adding BattleScene:', sceneAddError);
            alert('Failed to prepare BattleScene. Cannot start battle.');
            this.revertUIState(teamBuilderContainer, gameContainer);
            return;
          }
        } else {
          console.error('[BattleInitiator] BattleScene class not available when trying to start battle!');
          alert('BattleScene is not loaded. Cannot start battle.');
          this.revertUIState(teamBuilderContainer, gameContainer);
          return;
        }
      }

      try {
        // Prepare battle data for the scene
        const battleData = {
          playerTeam: this.teamManager.playerTeam,
          enemyTeam: this.teamManager.enemyTeam,
          battleMode: battleMode,
          battleManager: window.battleManager
        };

        // Check battleManager just before starting scene
        if (!battleData.battleManager) {
          console.error('[BattleInitiator] CRITICAL: battleManager is undefined just before starting BattleScene!');
          alert('Battle logic manager is missing. Cannot start battle.');
          this.revertUIState(teamBuilderContainer, gameContainer);
          return;
        }

        // Use polling mechanism to wait for scene to be fully registered
        await this.waitForSceneAndStart('BattleScene', battleData);
        console.log('[BattleInitiator] Phaser BattleScene started successfully');

      } catch (error) {
        console.error('[BattleInitiator] Error starting Phaser BattleScene:', error);
        alert('There was an error starting the battle. Falling back to original battle UI.');
        // Fallback to old battle UI
        this.startBattleWithDOMFallback(team, battleMode);
      }
    } catch (error) {
      console.error('[BattleInitiator] Error in startBattleWithPhaser:', error);
      // Emergency fallback
      this.startBattleWithDOMFallback(team, battleMode);
    }
  }

  /**
   * Revert UI state to team builder
   * @param {HTMLElement} teamBuilderContainer - Team builder container element
   * @param {HTMLElement} gameContainer - Game container element
   */
  revertUIState(teamBuilderContainer, gameContainer) {
    if (teamBuilderContainer) teamBuilderContainer.style.display = 'block';
    if (gameContainer) gameContainer.style.display = 'none';
  }

  /**
   * Wait for scene to be ready and start it
   * @param {string} sceneKey - The scene key to start
   * @param {Object} data - Data to pass to the scene
   * @param {number} maxAttempts - Maximum attempts to wait
   * @returns {Promise} Promise that resolves when scene starts
   */
  waitForSceneAndStart(sceneKey, data, maxAttempts = 20) {
    return new Promise((resolve, reject) => {
      const checkSceneReadyAndStart = (attempt = 1) => {
        const sceneInstance = window.game.scene.getScene(sceneKey);
        const sceneKeyExists = window.game.scene.keys.hasOwnProperty(sceneKey);

        if (sceneInstance && sceneKeyExists) {
          console.log(`[BattleInitiator] ${sceneKey} is ready on attempt ${attempt}. Starting scene...`);
          try {
            window.game.scene.start(sceneKey, data);
            resolve();
          } catch (startError) {
            console.error(`[BattleInitiator] Error during scene.start('${sceneKey}'):`, startError);
            reject(startError);
          }
        } else if (attempt < maxAttempts) {
          console.log(`[BattleInitiator] ${sceneKey} not ready yet (Attempt ${attempt}/${maxAttempts}). Waiting 100ms...`);
          setTimeout(() => checkSceneReadyAndStart(attempt + 1), 100);
        } else {
          console.error(`[BattleInitiator] ${sceneKey} failed to become ready after ${maxAttempts} attempts.`);
          reject(new Error(`${sceneKey} did not become ready in time`));
        }
      };

      checkSceneReadyAndStart();
    });
  }

  /**
   * Start a battle with the original DOM-based battle UI
   * This is used as a fallback when Phaser initialization fails
   * @param {Array} team - The player's team
   * @param {string} battleMode - The battle mode (random, custom, campaign)
   */
  startBattleWithDOMFallback(team, battleMode) {
    console.log('[BattleInitiator] Falling back to DOM-based battle UI');
    
    try {
      // Remove any existing battle UI elements
      const existingBattleUI = document.getElementById('battle-ui');
      if (existingBattleUI) {
        document.body.removeChild(existingBattleUI);
      }
      
      // Switch to battle scene
      document.getElementById('team-builder-container').classList.remove('active');
      
      // Clear the game container and make it active
      const gameContainer = document.getElementById('game-container');
      gameContainer.innerHTML = ''; // Clear any previous content
      gameContainer.classList.add('active');

      // Start the battle with DOM UI using a delay
      this.startBattleWithDelay();
    } catch (error) {
      console.error('[BattleInitiator] Error in DOM fallback:', error);
      alert('Error starting battle. Please refresh the page and try again.');
    }
  }

  /**
   * Start the battle with a delay to ensure scripts are loaded (DOM fallback)
   */
  startBattleWithDelay() {
    // Make sure the battleManager is initialized with BattleUI
    setTimeout(() => {
      try {
        // Initialize BattleUI first if needed
        if (!window.battleManager.battleUI) {
          window.battleManager.initialize();
        }
        
        // Then start the battle
        window.battleManager.startBattle(
          this.teamManager.playerTeam,
          this.teamManager.enemyTeam
        );
      } catch (error) {
        console.error('[BattleInitiator] Error starting battle:', error);
        alert('Error starting battle. See console for details.');
      }
    }, 500); // Increased delay to ensure script loading
  }

  /**
   * Handle return from Phaser battle scene
   */
  onReturnFromPhaserBattle() {
    try {
      console.log('[BattleInitiator] Returned from Phaser battle');

      // Show the team builder UI
      const teamBuilderContainer = document.getElementById('team-builder-container');
      if (teamBuilderContainer) {
        teamBuilderContainer.style.display = 'block';
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
      if (this.parentUI && this.parentUI.isSelectingEnemyTeam) {
        this.parentUI.isSelectingEnemyTeam = false;
        if (this.teamSlotsManager) {
          this.teamSlotsManager.renderTeamSlots();
        } else {
          this.parentUI.renderTeamSlots();
        }
      }

      // Update battle modes display
      if (this.battleModeManager) {
        this.battleModeManager.renderBattleModes();
      } else if (this.parentUI) {
        this.parentUI.renderBattleModes();
      }

      // Play UI sound
      if (window.soundManager) {
        window.soundManager.play('click');
      }
    } catch (error) {
      console.error('[BattleInitiator] Error in onReturnFromPhaserBattle:', error);
      // Try showing the team builder UI anyway as a fallback
      const teamBuilderContainer = document.getElementById('team-builder-container');
      if (teamBuilderContainer) teamBuilderContainer.style.display = 'block';
    }
  }

  /**
   * Legacy method name for backward compatibility  
   */
  onReturnFromBattle() {
    return this.onReturnFromPhaserBattle();
  }
}

// Make component available globally
if (typeof window !== 'undefined') {
  window.BattleInitiator = BattleInitiator;
  console.log("BattleInitiator loaded and exported to window.BattleInitiator");
  
  // Expose onReturnFromPhaserBattle as a global function for backward compatibility
  window.onReturnFromPhaserBattle = function() {
    if (window.teamBuilderUI && window.teamBuilderUI.battleInitiator) {
      window.teamBuilderUI.battleInitiator.onReturnFromPhaserBattle();
    } else {
      console.warn('[Global] onReturnFromPhaserBattle called but battleInitiator not available');
    }
  };
  
  // Legacy alias
  window.onReturnFromBattle = window.onReturnFromPhaserBattle;
}