/**
 * TeamSlotsManager - Handles team slot rendering and management
 * 
 * This component is responsible for rendering team slots, handling hero
 * addition and removal, calculating team synergies, and toggling between
 * player and enemy team selection.
 */
class TeamSlotsManager {
  /**
   * Create a new TeamSlotsManager
   * @param {TeamBuilderUI} parentUI - Reference to the main TeamBuilderUI
   */
  constructor(parentUI) {
    // Validate parent
    if (!parentUI) {
      console.error("[TeamSlotsManager] parentUI is required");
      return;
    }
    
    this.parentUI = parentUI;
    
    // Required references from parent
    this.teamManager = parentUI.teamManager;
    this.typeColors = parentUI.typeColors;
    this.imageLoader = parentUI.imageLoader;
    
    // Component-specific properties
    this.selectedHeroes = parentUI.selectedHeroes || [null, null, null];
    this.enemySelectedHeroes = parentUI.enemySelectedHeroes || [null, null, null];
    this.isSelectingEnemyTeam = parentUI.isSelectingEnemyTeam || false;
    this.currentSelectedHero = null;
    
    console.log("[TeamSlotsManager] Initialized");
  }
  
  /**
   * Get the current view mode from HeroGridManager if available
   * @returns {string} The current view mode ('full' or 'compact')
   */
  getViewMode() {
    // Try to get the viewMode from HeroGridManager
    if (this.parentUI && this.parentUI.heroGridManager && this.parentUI.heroGridManager.viewMode) {
      return this.parentUI.heroGridManager.viewMode;
    }
    
    // Fallback to 'full' if not available
    return 'full';
  }
  
  /**
   * Render the team slots
   */
  renderTeamSlots() {
    const teamSlots = document.getElementById('team-slots');
    if (!teamSlots) {
      console.error("[TeamSlotsManager] Team slots element not found");
      return;
    }
    
    teamSlots.innerHTML = '';
    
    // Add team heading that shows which team we're building
    const teamHeading = document.createElement('div');
    teamHeading.className = 'team-heading team-heading-change';
    teamHeading.id = 'team-heading';
    teamHeading.textContent = this.isSelectingEnemyTeam ? 'Enemy Team' : 'Your Team';
    teamHeading.style.color = this.isSelectingEnemyTeam ? '#ff4757' : '#1e90ff';
    teamSlots.appendChild(teamHeading);
    
    // Add class to container if selecting enemy team
    if (this.isSelectingEnemyTeam) {
      teamSlots.classList.add('is-selecting-enemy');
    } else {
      teamSlots.classList.remove('is-selecting-enemy');
    }
    
    // Get the right array based on what we're selecting
    const currentTeam = this.isSelectingEnemyTeam ? this.enemySelectedHeroes : this.selectedHeroes;

    // Create 3 team slots
    for (let i = 0; i < 3; i++) {
      const slotElement = document.createElement('div');
      slotElement.className = 'team-slot';

      const slotLabel = document.createElement('div');
      slotLabel.className = 'slot-label';
      slotLabel.textContent = `${i + 1}${TeamBuilderUtils.getOrdinalSuffix(i + 1)} Pick`;

      const slotContent = document.createElement('div');
      slotContent.className = 'slot-content';
      
      // Enemy team styling is handled by CSS via the is-selecting-enemy class

      if (currentTeam[i]) {
        // Slot is filled
        slotContent.classList.add('slot-filled');
        // For multiple types, use the first type's color for the background
        const heroTypes = TeamBuilderUtils.splitTypes(currentTeam[i].type);
        const primaryType = heroTypes[0] || currentTeam[i].type; // Fallback to full type
        slotContent.style.backgroundColor = `${this.typeColors[primaryType]}33`;

        const heroDetails = document.createElement('div');
        heroDetails.className = 'hero-details';
        
        // Create avatar container structure for character art - NO VISIBLE BACKGROUNDS
        const heroIconContainer = document.createElement('div');
        heroIconContainer.className = 'hero-avatar-container';
        heroIconContainer.dataset.characterId = currentTeam[i].id;
        heroIconContainer.dataset.characterName = currentTeam[i].name;
        heroIconContainer.dataset.artSynced = '0';
        // No background color set - will only be visible if character art exists
        
        // Create art wrapper for character images
        const artWrapper = document.createElement('div');
        artWrapper.className = 'hero-art-wrapper';
        
        // Assemble the icon structure
        heroIconContainer.appendChild(artWrapper);
        
        // Explicitly draw the character art
        console.log(`[TeamSlotsManager] Processing filled slot ${i} for ${currentTeam[i].name}`);
        console.log(`[TeamSlotsManager] heroIconContainer DOM element:`, heroIconContainer);
        console.log(`[TeamSlotsManager] imageLoader availability:`, {
          imageLoader: Boolean(this.imageLoader),
          drawArtMethod: this.imageLoader ? typeof this.imageLoader.drawArt === 'function' : 'N/A'
        });
        
        if (this.imageLoader && typeof this.imageLoader.drawArt === 'function') {
          // Get the current view mode from HeroGridManager
          const viewMode = this.getViewMode();
          console.log(`[TeamSlotsManager] Drawing team slot art for ${currentTeam[i].name} with viewMode: ${viewMode}`);
          this.imageLoader.drawArt(currentTeam[i], heroIconContainer, false, viewMode);
          
          // Verify art creation
          console.log(`[TeamSlotsManager] Art wrapper status after drawArt:`, {
            wrapper: heroIconContainer.querySelector('.hero-art-wrapper'),
            hasImg: heroIconContainer.querySelector('.hero-art-wrapper img') ? true : false
          });
        }

        const heroInfo = document.createElement('div');
        heroInfo.className = 'hero-info';

        const heroName = document.createElement('div');
        heroName.className = 'hero-name';
        heroName.style.fontWeight = 'bold';
        heroName.textContent = currentTeam[i].name;

        const heroType = document.createElement('div');
        heroType.className = 'hero-type';
        heroType.style.fontSize = '12px';
        
        // Render multi-type spans
        TeamBuilderUtils.renderMultiTypeSpans(currentTeam[i].type, heroType, this.typeColors);
        
        const heroRole = document.createElement('div');
        heroRole.className = 'hero-role';
        heroRole.style.fontSize = '12px';
        heroRole.textContent = currentTeam[i].role;

        // Basic stats
        const heroStats = document.createElement('div');
        heroStats.className = 'hero-stats';
        heroStats.style.fontSize = '12px';
        heroStats.style.color = '#a4b0be';
        heroStats.textContent = `HP: ${currentTeam[i].stats.hp} | ATK: ${currentTeam[i].stats.attack} | DEF: ${currentTeam[i].stats.defense}`;
        
        // Add advanced stats in condensed format
        const heroAdvStats = document.createElement('div');
        heroAdvStats.className = 'hero-adv-stats';
        heroAdvStats.style.fontSize = '11px';
        heroAdvStats.style.color = '#a4b0be';
        
        // Check if expanded stats exist before displaying them
        if (currentTeam[i].stats.strength && currentTeam[i].stats.intellect && currentTeam[i].stats.spirit) {
          heroAdvStats.textContent = `STR: ${currentTeam[i].stats.strength} | INT: ${currentTeam[i].stats.intellect} | SPI: ${currentTeam[i].stats.spirit}`;
          heroInfo.appendChild(heroAdvStats);
        }

        heroInfo.appendChild(heroName);
        heroInfo.appendChild(heroType);
        heroInfo.appendChild(heroRole);
        heroInfo.appendChild(heroStats);

        heroDetails.appendChild(heroIconContainer);
        heroDetails.appendChild(heroInfo);

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-hero';
        removeButton.textContent = '×';
        removeButton.dataset.slotIndex = i;
        removeButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeHeroFromTeam(i);
        });

        slotContent.appendChild(heroDetails);
        slotContent.appendChild(removeButton);
      } else {
        // Slot is empty
        slotContent.classList.add('slot-empty');

        const emptyText = document.createElement('span');
        if (this.currentSelectedHero) {
          emptyText.textContent = `Click to place ${this.currentSelectedHero.name} here`;
        } else {
          emptyText.textContent = 'Select a hero first';
          emptyText.style.color = '#a4b0be';
        }

        slotContent.appendChild(emptyText);
        slotContent.dataset.slotIndex = i;
        slotContent.addEventListener('click', () => this.addHeroToTeam(i));
      }

      slotElement.appendChild(slotLabel);
      slotElement.appendChild(slotContent);
      teamSlots.appendChild(slotElement);
    }
    
    // If we're in enemy selection mode, add a Back button to return to player team
    if (this.isSelectingEnemyTeam) {
      const backButton = document.createElement('button');
      backButton.className = 'enemy-team-control-btn';
      backButton.textContent = 'Back to Your Team';
      backButton.addEventListener('click', () => {
        this.toggleTeamSelection(false);
      });
      teamSlots.appendChild(backButton);
    }

    // Update synergies - only show for player team
    if (!this.isSelectingEnemyTeam) {
      this.renderTeamSynergies();
    }
    
    // Notify parent to update the start battle button
    this.notifyBattleButtonUpdate();
    
    // Art is explicitly drawn during team slot rendering
    
    // Verify art was properly added after a short delay to ensure DOM updates
    setTimeout(() => this.verifyTeamSlotArt(), 100);
  }

  /**
   * Add a hero to the team at the specified position
   * @param {number} position - The slot position (0-2)
   */
  addHeroToTeam(position) {
    if (!this.currentSelectedHero) {
      console.log("[TeamSlotsManager] No hero selected to add");
      return;
    }
    
    console.log(`[TeamSlotsManager] Adding ${this.currentSelectedHero.name} to position ${position}`);
    
    // Determine which team we're modifying
    const targetTeam = this.isSelectingEnemyTeam ? this.enemySelectedHeroes : this.selectedHeroes;

    // Check if hero is already in team
    const existingIndex = targetTeam.findIndex(h => h && h.id === this.currentSelectedHero.id);
    if (existingIndex !== -1) {
      console.log(`[TeamSlotsManager] Removing ${this.currentSelectedHero.name} from position ${existingIndex} first`);
      targetTeam[existingIndex] = null;
    }

    // Update the correct team
    if (this.isSelectingEnemyTeam) {
      this.enemySelectedHeroes[position] = this.currentSelectedHero;
    } else {
      this.selectedHeroes[position] = this.currentSelectedHero;
    }
    
    console.log(`[TeamSlotsManager] Team data updated, calling renderTeamSlots()`);
    this.renderTeamSlots();
    
    // Play add sound
    if (window.soundManager) {
      window.soundManager.play('add');
    }
  }

  /**
   * Remove a hero from a team slot
   * @param {number} position - The slot position (0-2)
   */
  removeHeroFromTeam(position) {
    // Remove from the appropriate team
    if (this.isSelectingEnemyTeam) {
      this.enemySelectedHeroes[position] = null;
    } else {
      this.selectedHeroes[position] = null;
    }
    
    this.renderTeamSlots();
    
    // Play remove sound
    if (window.soundManager) {
      window.soundManager.play('remove');
    }
  }

  /**
   * Render the team synergies
   */
  renderTeamSynergies() {
    const synergiesList = document.getElementById('synergies-list');
    if (!synergiesList) {
      console.error("[TeamSlotsManager] Synergies list element not found");
      return;
    }
    
    synergiesList.innerHTML = '';

    const synergies = this.calculateSynergies();

    if (synergies.length > 0) {
      synergies.forEach(synergy => {
        const synergyItem = document.createElement('li');
        synergyItem.textContent = synergy;
        synergiesList.appendChild(synergyItem);
      });
    } else {
      const noSynergies = document.createElement('li');
      noSynergies.textContent = 'No active synergies yet';
      noSynergies.style.color = '#a4b0be';
      synergiesList.appendChild(noSynergies);
    }
  }

  /**
   * Calculate team synergies
   * @returns {string[]} An array of synergy descriptions
   */
  calculateSynergies() {
    const heroes = this.selectedHeroes.filter(hero => hero !== null);
    if (heroes.length < 2) return [];

    const types = [];
    const roles = [];
    
    // Handle multiple types
    heroes.forEach(hero => {
      const heroTypes = TeamBuilderUtils.splitTypes(hero.type);
      types.push(...heroTypes);
      roles.push(hero.role);
    });
    
    const typeCounts = {};
    types.forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const roleCounts = {};
    roles.forEach(role => {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    const synergies = [];
    
    // Check for type synergies
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count >= 2) {
        synergies.push(`${type.charAt(0).toUpperCase() + type.slice(1)} Alliance (${count}): +${count * 10}% ${type} damage`);
      }
    });
    
    // Check for role synergies
    if (roleCounts['Warrior'] >= 2) synergies.push('Warrior (2): +20% defense');
    if (roleCounts['Mage'] >= 2) synergies.push('Mage (2): +20% ability power');
    if (roleCounts['Ranger'] >= 2) synergies.push('Ranger (2): +15% attack speed');
    if (roleCounts['Knight'] >= 2) synergies.push('Knight (2): +25% max health');
    if (roleCounts['Assassin'] >= 2) synergies.push('Assassin (2): +30% critical hit chance');
    if (roleCounts['Cleric'] >= 2) synergies.push('Cleric (2): +40% healing effectiveness');
    
    return synergies;
  }

  /**
   * Toggle between player and enemy team selection
   * @param {boolean} isSelectingEnemy - Whether to select enemy team
   */
  toggleTeamSelection(isSelectingEnemy) {
    this.isSelectingEnemyTeam = isSelectingEnemy;
    this.renderTeamSlots();
    
    // Notify parent for battle button update
    this.notifyBattleButtonUpdate();
    
    // Notify parent of team selection change
    if (this.parentUI && typeof this.parentUI.onTeamSelectionChanged === 'function') {
      this.parentUI.onTeamSelectionChanged(isSelectingEnemy);
    }
  }

  /**
   * Update team display based on the battle mode
   * @param {string} battleMode - The selected battle mode
   */
  updateTeamDisplay(battleMode) {
    // Reset enemy team selection when changing away from custom mode
    if (battleMode !== 'custom' && this.isSelectingEnemyTeam) {
      this.isSelectingEnemyTeam = false;
      this.renderTeamSlots();
    }
  }

  /**
   * Notify parent to update the start battle button
   */
  notifyBattleButtonUpdate() {
    if (this.parentUI && typeof this.parentUI.updateStartBattleButton === 'function') {
      this.parentUI.updateStartBattleButton();
    }
  }
  
  /**
   * Get the player team
   * @returns {Array} The player team array
   */
  getPlayerTeam() {
    return this.selectedHeroes;
  }
  
  /**
   * Get the enemy team
   * @returns {Array} The enemy team array
   */
  getEnemyTeam() {
    return this.enemySelectedHeroes;
  }
  
  /**
   * Get the current team being edited
   * @returns {Array} The current team array
   */
  getCurrentTeam() {
    return this.isSelectingEnemyTeam ? this.enemySelectedHeroes : this.selectedHeroes;
  }
  
  /**
   * Set the selected hero
   * @param {Object} hero - The selected hero
   */
  setSelectedHero(hero) {
    this.currentSelectedHero = hero;
    
    // Refresh the team slots display to update empty slot text
    this.renderTeamSlots();
  }
  
  /**
   * DEPRECATED: Trigger the image loader to check for new images
   * No longer needed as art is now explicitly drawn during team slot rendering
   */
  triggerImageLoader() {
    // No-op - art is now explicitly managed in renderTeamSlots
    console.warn("[TeamSlotsManager] triggerImageLoader is deprecated - art is now explicitly drawn");
  }
  
  /**
   * Verify art was added to team slots (debugging function)
   */
  verifyTeamSlotArt() {
    console.log("[TeamSlotsManager] Verifying team slot art...");
    
    // Get all team slots
    const slotContents = document.querySelectorAll('.team-slot .slot-content');
    
    slotContents.forEach((slotContent, index) => {
      const heroDetails = slotContent.querySelector('.hero-details');
      if (!heroDetails) {
        console.log(`[TeamSlotsManager] Slot ${index}: Empty slot`);
        return;
      }
      
      const avatarContainer = heroDetails.querySelector('.hero-avatar-container');
      const artWrapper = avatarContainer ? avatarContainer.querySelector('.hero-art-wrapper') : null;
      const img = artWrapper ? artWrapper.querySelector('img') : null;
      
      console.log(`[TeamSlotsManager] Slot ${index} DOM structure:`, {
        hasAvatarContainer: Boolean(avatarContainer),
        hasArtWrapper: Boolean(artWrapper),
        hasImage: Boolean(img),
        artWrapperDisplay: artWrapper ? artWrapper.style.display : 'N/A',
        imageStyles: img ? {
          width: img.style.width,
          height: img.style.height,
          position: img.style.position,
          left: img.style.left,
          top: img.style.top
        } : 'N/A'
      });
    });
  }
}

// Make component available globally
if (typeof window !== 'undefined') {
  window.TeamSlotsManager = TeamSlotsManager;
  console.log("TeamSlotsManager loaded and exported to window.TeamSlotsManager");
}