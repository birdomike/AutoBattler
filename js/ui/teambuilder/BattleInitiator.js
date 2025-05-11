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
  initiateBattle() {
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

    // Initialize the battle manager and start the battle
    if (this.teamManager) {
      this.teamManager.setPlayerTeam(playerTeam);
      
      // For Custom battle, use the selected enemy team
      if (battleMode === 'custom' && isSelectingEnemyTeam) {
        if (enemyTeam.length > 0) {
          this.teamManager.setCustomEnemyTeam(enemyTeam);
        } else {
          // Fallback if somehow no enemies were selected
          this.teamManager.generateEnemyTeam('random');
        }
      } else {
        // For other modes, generate enemy team as usual
        this.teamManager.generateEnemyTeam(battleMode);
      }
      
      // Start the battle with our teams
      if (window.battleManager) {
        // We need to ensure BattleUI is available before starting the battle
        if (typeof window.BattleUI === 'undefined') {
          console.error('BattleUI class not found, attempting to load it');
          
          // Dynamically load the BattleUI script
          this.loadBattleUIAndStart();
        } else {
          // BattleUI is available, proceed with starting the battle
          this.startBattleWithDelay();
        }
      } else {
        console.error('[BattleInitiator] battleManager not found. Cannot start battle.');
      }
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
   * Start the battle with a delay to ensure scripts are loaded
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
}

// Make component available globally
if (typeof window !== 'undefined') {
  window.BattleInitiator = BattleInitiator;
  console.log("BattleInitiator loaded and exported to window.BattleInitiator");
}