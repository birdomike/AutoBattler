/**
 * BattleModeManager - Handles battle mode selection and battle button state
 * 
 * This component is responsible for rendering battle mode options,
 * handling mode selection, and updating the start battle button state.
 */
class BattleModeManager {
  /**
   * Create a new BattleModeManager
   * @param {TeamBuilderUI} parentUI - Reference to the main TeamBuilderUI
   */
  constructor(parentUI) {
    // Validate parent
    if (!parentUI) {
      console.error("[BattleModeManager] parentUI is required");
      return;
    }
    
    this.parentUI = parentUI;
    
    // Required references from parent
    this.teamManager = parentUI.teamManager;
    this.teamSlotsManager = parentUI.teamSlotsManager;
    
    // Component-specific properties
    this.battleMode = parentUI.battleMode || 'random';
    this.battleModes = [
      {
        id: 'random',
        name: 'Random Opponent',
        description: 'Battle against a randomly generated team'
      },
      {
        id: 'custom',
        name: 'Custom Battle',
        description: 'Choose your opponent\'s team composition'
      },
      {
        id: 'campaign',
        name: 'Campaign Mode',
        description: 'Fight through increasingly difficult encounters'
      }
    ];
    
    console.log("[BattleModeManager] Initialized");
  }
  
  /**
   * Render battle mode options
   */
  renderBattleModes() {
    const battleModesContainer = document.getElementById('battle-modes');
    if (!battleModesContainer) {
      console.error("[BattleModeManager] Battle modes container not found");
      return;
    }
    
    battleModesContainer.innerHTML = '';

    // Get team selection state from TeamSlotsManager if available
    const isSelectingEnemyTeam = this.teamSlotsManager ? 
      this.teamSlotsManager.isSelectingEnemyTeam : 
      (this.parentUI.isSelectingEnemyTeam || false);

    this.battleModes.forEach(mode => {
      const modeElement = document.createElement('div');
      
      // Add special class for custom mode when selecting enemy team
      let selectedClass = mode.id === this.battleMode ? 'selected' : '';
      if (mode.id === 'custom' && this.battleMode === 'custom' && isSelectingEnemyTeam) {
        selectedClass = 'selected enemy-selection-active';
      }
      
      modeElement.className = `battle-mode ${selectedClass}`;
      modeElement.dataset.modeId = mode.id;

      const modeName = document.createElement('div');
      modeName.className = 'battle-mode-name';
      modeName.textContent = mode.name;
      
      // Add indicator for enemy team selection
      if (mode.id === 'custom' && this.battleMode === 'custom' && isSelectingEnemyTeam) {
        modeName.innerHTML = `${mode.name} <span style="color: #ff4757; font-size: 12px;">(Selecting Enemy)</span>`;
      }

      const modeDesc = document.createElement('div');
      modeDesc.className = 'battle-mode-desc';
      modeDesc.textContent = mode.description;

      modeElement.appendChild(modeName);
      modeElement.appendChild(modeDesc);
      battleModesContainer.appendChild(modeElement);

      // Add event listener
      modeElement.addEventListener('click', () => {
        // Only allow changing battle mode if not in enemy selection mode
        if (!isSelectingEnemyTeam || mode.id === this.battleMode) {
          this.selectBattleMode(mode.id);
        } else {
          // If in enemy selection, show a message that they should complete or cancel enemy selection first
          if (window.soundManager) {
            window.soundManager.play('error');
          }
          alert('Please complete enemy team selection or click "Back to Your Team" before changing battle mode');
        }
      });
    });
    
    // Update the start battle button
    this.updateStartBattleButton();
  }

  /**
   * Update the start battle button state
   */
  updateStartBattleButton() {
    const startButton = document.getElementById('start-battle');
    if (!startButton) {
      console.error("[BattleModeManager] Start battle button not found");
      return;
    }
    
    // Get teams and state from TeamSlotsManager if available
    let selectedHeroes = this.parentUI.selectedHeroes || [];
    let enemySelectedHeroes = this.parentUI.enemySelectedHeroes || [];
    let isSelectingEnemyTeam = this.parentUI.isSelectingEnemyTeam || false;
    
    if (this.teamSlotsManager) {
      selectedHeroes = this.teamSlotsManager.getPlayerTeam();
      enemySelectedHeroes = this.teamSlotsManager.getEnemyTeam();
      isSelectingEnemyTeam = this.teamSlotsManager.isSelectingEnemyTeam;
    }
    
    const hasTeamMembers = selectedHeroes.some(hero => hero !== null);
    
    // For Custom Battle mode, we need to check if we're ready to select enemy team
    if (this.battleMode === 'custom' && !isSelectingEnemyTeam) {
      // If we have team members but haven't begun enemy team selection
      if (hasTeamMembers) {
        startButton.textContent = 'Choose Enemy Team';
        startButton.disabled = false;
      } else {
        startButton.textContent = 'Start Battle';
        startButton.disabled = true;
      }
    } else {
      // For Random and Campaign modes, or if we're already selecting enemy team
      startButton.textContent = 'Start Battle';
      
      if (isSelectingEnemyTeam) {
        // When selecting enemy team, we need at least one enemy
        startButton.disabled = !enemySelectedHeroes.some(hero => hero !== null);
      } else {
        // For Random or Campaign, just check player team
        startButton.disabled = !hasTeamMembers;
      }
    }
  }
  
  /**
   * Select a battle mode
   * @param {string} modeId - The ID of the selected mode
   */
  selectBattleMode(modeId) {
    // Validate mode ID
    if (!this.battleModes.some(mode => mode.id === modeId)) {
      console.error(`[BattleModeManager] Invalid battle mode: ${modeId}`);
      return;
    }
    
    this.battleMode = modeId;
    
    // Re-render battle modes with new selection
    this.renderBattleModes();
    
    // Get state from TeamSlotsManager if available
    let isSelectingEnemyTeam = this.parentUI.isSelectingEnemyTeam || false;
    
    if (this.teamSlotsManager) {
      isSelectingEnemyTeam = this.teamSlotsManager.isSelectingEnemyTeam;
    }
    
    // Reset enemy selection when changing modes
    if (isSelectingEnemyTeam && modeId !== 'custom') {
      // Use TeamSlotsManager if available
      if (this.teamSlotsManager) {
        this.teamSlotsManager.toggleTeamSelection(false);
      } else if (this.parentUI) {
        this.parentUI.isSelectingEnemyTeam = false;
        this.parentUI.renderTeamSlots();
      }
    }
    
    // Update TeamSlotsManager if available
    if (this.teamSlotsManager && typeof this.teamSlotsManager.updateTeamDisplay === 'function') {
      this.teamSlotsManager.updateTeamDisplay(modeId);
    }
    
    // Notify parent that battle mode has changed
    if (this.parentUI && typeof this.parentUI.onBattleModeChanged === 'function') {
      this.parentUI.onBattleModeChanged(modeId);
    }
    
    // Play select sound
    if (window.soundManager) {
      window.soundManager.play('click');
    }
  }
  
  /**
   * Get the current battle mode
   * @returns {string} The current battle mode ID
   */
  getBattleMode() {
    return this.battleMode;
  }
  
  /**
   * Set the battle mode without triggering updates
   * @param {string} modeId - The ID of the battle mode to set
   */
  setBattleMode(modeId) {
    // Validate mode ID
    if (!this.battleModes.some(mode => mode.id === modeId)) {
      console.error(`[BattleModeManager] Invalid battle mode: ${modeId}`);
      return;
    }
    
    this.battleMode = modeId;
  }
}

// Make component available globally
if (typeof window !== 'undefined') {
  window.BattleModeManager = BattleModeManager;
  console.log("BattleModeManager loaded and exported to window.BattleModeManager");
}