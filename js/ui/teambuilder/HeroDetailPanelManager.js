/**
 * HeroDetailPanelManager - Handles hero details panel display and management
 * 
 * This component is responsible for rendering and updating the hero details
 * panel in the TeamBuilder UI, including stats, abilities, and type relations.
 */
class HeroDetailPanelManager {
  /**
   * Create a new HeroDetailPanelManager
   * @param {TeamBuilderUI} parentUI - Reference to the main TeamBuilderUI
   */
  constructor(parentUI) {
    // Validate parent
    if (!parentUI) {
      console.error("[HeroDetailPanelManager] parentUI is required");
      return;
    }
    
    this.parentUI = parentUI;
    
    // Required references from parent
    this.typeColors = parentUI.typeColors;
    this.rarityColors = parentUI.rarityColors;
    this.availableHeroes = parentUI.availableHeroes;
    
    // Component-specific properties
    this.previousHeroId = null;
    this.detailContentElement = document.getElementById('detail-content');
    
    if (!this.detailContentElement) {
      console.error("[HeroDetailPanelManager] Could not find detail-content element");
    }
    
    console.log("[HeroDetailPanelManager] Initialized");
  }
  
  /**
   * Render hero details in the panel
   * @param {Object} hero - The hero to display
   */
  renderDetails(hero) {
    if (!this.detailContentElement) {
      console.error("[HeroDetailPanelManager] Cannot render details - detail-content element not found");
      return;
    }
    
    // Keep track of previous hero ID for intelligent comparison
    this.previousHeroId = hero ? hero.id : null;
    
    // CRITICAL: Disable art observer during detail panel updates
    if (window.disableArtObserver) {
      window.disableArtObserver();
    }
    
    try {
      // OPTIMIZATION: Instead of clearing all content, preserve the wrapper structure
      const existingDetail = this.detailContentElement.querySelector('.detail-hero');
      const existingWrapper = this.detailContentElement.querySelector('.hero-avatar-container.detail-icon-container');
      
      // Only clear content if either:
      // 1. No hero is selected (show empty state) OR
      // 2. No existing detail content exists
      if (!hero) {
        // Just emptying content for "no hero selected" state
        this.detailContentElement.innerHTML = '';
        
        // No hero selected - show empty state and exit
        const detailEmpty = document.createElement('div');
        detailEmpty.className = 'detail-empty';
        detailEmpty.textContent = 'Select a hero to view details';
        this.detailContentElement.appendChild(detailEmpty);
        return;
      }
      
      // If details already exist with a wrapper, update the existing details
      // This preserves the image container for ALL heroes, not just Aqualia
      if (existingDetail && existingWrapper) {
        console.log(`[HeroDetailPanelManager] Preserving art wrapper while updating details for ${hero.name}`);
        this.updateExistingDetails(hero, existingDetail);
        return;
      }
      
      // Regular rendering for other heroes or first-time rendering
      const detailHero = document.createElement('div');
      detailHero.className = 'detail-hero';
      
      // For multiple types, use the first type's color for the background
      const heroTypes = TeamBuilderUtils.splitTypes(hero.type);
      const primaryType = heroTypes[0] || hero.type; // Fallback to full type string if split fails
      detailHero.style.backgroundColor = `${this.typeColors[primaryType]}22`;

      // Header section
      const detailHeader = document.createElement('div');
      detailHeader.className = 'detail-header';

      // Create avatar container structure for character art - NO VISIBLE BACKGROUNDS
      const detailIconContainer = document.createElement('div');
      detailIconContainer.className = 'hero-avatar-container detail-icon-container';
      detailIconContainer.dataset.characterId = hero.id;
      detailIconContainer.dataset.characterName = hero.name;
      // No background color set - will only be visible if character art exists
      
      // Create art wrapper for character images
      const artWrapper = document.createElement('div');
      artWrapper.className = 'hero-art-wrapper';
      
      // Assemble the icon structure
      detailIconContainer.appendChild(artWrapper);

      const detailNameType = document.createElement('div');
      detailNameType.className = 'detail-name-type';

      const heroName = document.createElement('h3');
      heroName.textContent = hero.name;

      const detailTags = document.createElement('div');
      detailTags.className = 'detail-tags';

      // Handle multiple types in the detail tags
      const types = TeamBuilderUtils.splitTypes(hero.type);
      
      // Create a type tag for each type
      types.forEach(type => {
        const typeTag = document.createElement('span');
        typeTag.className = 'detail-tag';
        typeTag.style.backgroundColor = this.typeColors[type];
        typeTag.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        detailTags.appendChild(typeTag);
      });
      
      const roleTag = document.createElement('span');
      roleTag.className = 'detail-tag';
      roleTag.style.backgroundColor = '#2f3542';
      roleTag.textContent = hero.role;

      // Type tags already appended in the loop above
      detailTags.appendChild(roleTag);
      // Rarity tag removed in v0.6.7.5

      detailNameType.appendChild(heroName);
      detailNameType.appendChild(detailTags);

      detailHeader.appendChild(detailIconContainer);
      detailHeader.appendChild(detailNameType);

      // Stats section
      const detailStats = document.createElement('div');
      detailStats.className = 'detail-stats';

      // Add CSS to detail-stats to use flex-column
      detailStats.style.display = 'flex';
      detailStats.style.flexDirection = 'column';
      detailStats.style.gap = '8px';

      // First row of stats (existing)
      const statsRow1 = document.createElement('div');
      statsRow1.className = 'stats-row';
      statsRow1.style.display = 'flex';
      statsRow1.style.justifyContent = 'space-between';
      statsRow1.style.gap = '8px';

      const hpStat = TeamBuilderUtils.createStatBox('HP', hero.stats.hp, 'Health Points - How much damage a character can take before being defeated');
      const atkStat = TeamBuilderUtils.createStatBox('ATK', hero.stats.attack, 'Attack Power - Determines basic attack damage');
      const defStat = TeamBuilderUtils.createStatBox('DEF', hero.stats.defense, 'Defense - Reduces damage taken from attacks');
      const spdStat = TeamBuilderUtils.createStatBox('SPD', hero.stats.speed, 'Speed - Determines turn order in battle (higher goes first)');

      statsRow1.appendChild(hpStat);
      statsRow1.appendChild(atkStat);
      statsRow1.appendChild(defStat);
      statsRow1.appendChild(spdStat);

      // Only add second row if expanded stats exist
      if (hero.stats.strength && hero.stats.intellect && hero.stats.spirit) {
        // Second row of stats (new)
        const statsRow2 = document.createElement('div');
        statsRow2.className = 'stats-row';
        statsRow2.style.display = 'flex';
        statsRow2.style.justifyContent = 'space-between';
        statsRow2.style.gap = '8px';

        const strStat = TeamBuilderUtils.createStatBox('STR', hero.stats.strength, 'Strength - Increases physical ability damage');
        const intStat = TeamBuilderUtils.createStatBox('INT', hero.stats.intellect, 'Intellect - Increases spell ability damage');
        const spiStat = TeamBuilderUtils.createStatBox('SPI', hero.stats.spirit, 'Spirit - Increases healing effectiveness');

        statsRow2.appendChild(strStat);
        statsRow2.appendChild(intStat);
        statsRow2.appendChild(spiStat);

        // Add both rows
        detailStats.appendChild(statsRow1);
        detailStats.appendChild(statsRow2);
      } else {
        // Just add the first row if no expanded stats
        detailStats.appendChild(statsRow1);
      }

      // Abilities section
      const detailAbilities = document.createElement('div');
      detailAbilities.className = 'detail-abilities';

      const abilitiesTitle = document.createElement('h4');
      abilitiesTitle.textContent = 'Abilities';

      detailAbilities.appendChild(abilitiesTitle);

      hero.abilities.forEach(ability => {
        const abilityBox = document.createElement('div');
        abilityBox.className = 'ability-box';
        
        // Determine ability's elemental type from effects for styling
        let abilityType = hero.type; // Default to character's type
        
        // If this is an active ability with effects, try to find a damage type
        if (ability.effects && Array.isArray(ability.effects)) {
          // Look for the first damage effect with a damageType
          const damageEffect = ability.effects.find(effect => 
            effect.type === 'Damage' && effect.damageType);
          
          if (damageEffect && damageEffect.damageType) {
            abilityType = damageEffect.damageType;
          }
        }
        
        // Apply the type color with reduced opacity (22 = 13% opacity in hex)
        if (this.typeColors[abilityType]) {
          abilityBox.style.backgroundColor = `${this.typeColors[abilityType]}22`;
          // Add a subtle left border with higher opacity for visual distinction
          abilityBox.style.borderLeft = `3px solid ${this.typeColors[abilityType]}66`;
        }

        const abilityName = document.createElement('div');
        abilityName.className = 'ability-name';
        abilityName.textContent = ability.name;

        const abilityDesc = document.createElement('div');
        abilityDesc.className = 'ability-desc';
        abilityDesc.textContent = ability.description;

        abilityBox.appendChild(abilityName);
        abilityBox.appendChild(abilityDesc);
        detailAbilities.appendChild(abilityBox);
        
        // Add tooltip with more detailed info
        if (window.tooltipManager) {
          const cooldownText = ability.cooldown > 0 ? `Cooldown: ${ability.cooldown} turns` : 'No cooldown';
          
          // Get detailed scaling information with formula
          const detailedScaling = TeamBuilderUtils.getDetailedScalingText(ability, hero);
          
          const tooltipContent = `
            <div class="tooltip-title">${ability.name}</div>
            <div>${ability.description}</div>
            <div class="tooltip-content">
              ${detailedScaling.damageText}
              <div>${cooldownText}</div>
              <div>Type: ${ability.damageType || (ability.isHealing ? 'Healing' : 'Damage')}</div>
              <div>${detailedScaling.scalingText}</div>
            </div>
          `;
          
          window.tooltipManager.addTooltip(abilityBox, tooltipContent);
          abilityBox.classList.add('has-tooltip');
        }
      });

      // Type Relations section
      const detailTypeRelations = document.createElement('div');
      detailTypeRelations.className = 'detail-type-relations';

      const typeRelationsTitle = document.createElement('h4');
      typeRelationsTitle.textContent = 'Type Relations';
      detailTypeRelations.appendChild(typeRelationsTitle);

      // Get all hero types
      const typeArray = TeamBuilderUtils.splitTypes(hero.type);
      
      // Create a container for type sections
      const typeSectionsContainer = document.createElement('div');
      typeSectionsContainer.className = 'type-sections-container';
      detailTypeRelations.appendChild(typeSectionsContainer);
      
      // For each hero type, create a separate section
      typeArray.forEach(heroType => {
        // Create a section for this type
        const typeSection = document.createElement('div');
        typeSection.className = 'type-section';
        
        // Add type header if multiple types
        if (typeArray.length > 1) {
          const typeHeader = document.createElement('div');
          typeHeader.className = 'type-section-header';
          typeHeader.style.color = this.typeColors[heroType];
          typeHeader.textContent = heroType.charAt(0).toUpperCase() + heroType.slice(1) + ' Type';
          typeHeader.style.fontWeight = 'bold';
          typeHeader.style.marginBottom = '5px';
          typeSection.appendChild(typeHeader);
        }
        
        // Create columns for this type
        const columnsContainer = document.createElement('div');
        columnsContainer.className = 'type-columns-container';
        columnsContainer.style.display = 'flex';
        columnsContainer.style.justifyContent = 'space-between';
        typeSection.appendChild(columnsContainer);
        
        // Advantages column
        const advantagesColumn = document.createElement('div');
        advantagesColumn.className = 'type-column';

        const advantagesHeading = document.createElement('h5');
        advantagesHeading.textContent = 'Advantages';
        advantagesColumn.appendChild(advantagesHeading);

        // Disadvantages column
        const disadvantagesColumn = document.createElement('div');
        disadvantagesColumn.className = 'type-column';

        const disadvantagesHeading = document.createElement('h5');
        disadvantagesHeading.textContent = 'Disadvantages';
        disadvantagesColumn.appendChild(disadvantagesHeading);
        
        // Get type relations based on current type
        let advantageType = null;
        let advantageColor = null;
        let disadvantageType = null;
        let disadvantageColor = null;
        let advantageIcon = '';
        let disadvantageIcon = '';

        // Set relationships based on type
        switch (heroType) {
          case 'fire':
            advantageType = 'Nature';
            advantageColor = this.typeColors.nature;
            disadvantageType = 'Water';
            disadvantageColor = this.typeColors.water;
            advantageIcon = '🌿';
            disadvantageIcon = '💧';
            break;
          case 'water':
            advantageType = 'Fire';
            advantageColor = this.typeColors.fire;
            disadvantageType = 'Nature';
            disadvantageColor = this.typeColors.nature;
            advantageIcon = '🔥';
            disadvantageIcon = '🌿';
            break;
          case 'nature':
            advantageType = 'Water';
            advantageColor = this.typeColors.water;
            disadvantageType = 'Fire';
            disadvantageColor = this.typeColors.fire;
            advantageIcon = '💧';
            disadvantageIcon = '🔥';
            break;
          case 'light':
            advantageType = 'Dark';
            advantageColor = this.typeColors.dark;
            disadvantageType = 'Dark';
            disadvantageColor = this.typeColors.dark;
            advantageIcon = '🌑';
            disadvantageIcon = '🌑';
            break;
          case 'dark':
            advantageType = 'Light';
            advantageColor = this.typeColors.light;
            disadvantageType = 'Light';
            disadvantageColor = this.typeColors.light;
            advantageIcon = '✨';
            disadvantageIcon = '✨';
            break;
          case 'air':
            advantageType = 'Earth';
            advantageColor = this.typeColors.earth || '#8B4513';
            disadvantageType = 'Electric';
            disadvantageColor = '#F7DF1E'; // Yellow for electric
            advantageIcon = '🌍';
            disadvantageIcon = '⚡';
            break;
          case 'ice':
            advantageType = 'Nature';
            advantageColor = this.typeColors.nature;
            disadvantageType = 'Fire';
            disadvantageColor = this.typeColors.fire;
            advantageIcon = '🌿';
            disadvantageIcon = '🔥';
            break;
        }
        
        // Create advantage box if applicable
        if (advantageType) {
          const advantageBox = document.createElement('div');
          advantageBox.className = 'advantage-box';

          const typeName = document.createElement('span');
          typeName.className = 'type-relation-title';
          typeName.innerHTML = `${advantageIcon} ${advantageType} ${advantageIcon}`;
          typeName.style.color = advantageColor;

          advantageBox.appendChild(typeName);

          // Add tooltip for detailed info
          if (window.tooltipManager) {
            const tooltipContent = `<div class="tooltip-title">Type Advantage</div>
                <div class="tooltip-content">${heroType.charAt(0).toUpperCase() + heroType.slice(1)} does 50% more damage to ${advantageType} types.</div>`;
            window.tooltipManager.addTooltip(advantageBox, tooltipContent);
          }

          advantagesColumn.appendChild(advantageBox);
        } else {
          // No advantages case
          const noAdvantages = document.createElement('div');
          noAdvantages.className = 'advantage-box';
          noAdvantages.textContent = 'None';
          noAdvantages.style.color = 'var(--text-muted)';
          noAdvantages.style.justifyContent = 'center';
          advantagesColumn.appendChild(noAdvantages);
        }

        // Create disadvantage box if applicable
        if (disadvantageType) {
          const disadvantageBox = document.createElement('div');
          disadvantageBox.className = 'disadvantage-box';

          const typeName = document.createElement('span');
          typeName.className = 'type-relation-title';
          typeName.innerHTML = `${disadvantageIcon} ${disadvantageType} ${disadvantageIcon}`;
          typeName.style.color = disadvantageColor;

          disadvantageBox.appendChild(typeName);

          // Add tooltip for detailed info
          if (window.tooltipManager) {
            const tooltipContent = `<div class="tooltip-title">Type Disadvantage</div>
                <div class="tooltip-content">${heroType.charAt(0).toUpperCase() + heroType.slice(1)} takes 50% more damage from ${disadvantageType} types.</div>`;
            window.tooltipManager.addTooltip(disadvantageBox, tooltipContent);
          }

          disadvantagesColumn.appendChild(disadvantageBox);
        } else {
          // No disadvantages case
          const noDisadvantages = document.createElement('div');
          noDisadvantages.className = 'disadvantage-box';
          noDisadvantages.textContent = 'None';
          noDisadvantages.style.color = 'var(--text-muted)';
          noDisadvantages.style.justifyContent = 'center';
          disadvantagesColumn.appendChild(noDisadvantages);
        }
        
        // Add columns to the columns container
        columnsContainer.appendChild(advantagesColumn);
        columnsContainer.appendChild(disadvantagesColumn);
        
        // Add this type section to the sections container
        typeSectionsContainer.appendChild(typeSection);
        
        // Add separator if not the last type
        if (typeArray.indexOf(heroType) < typeArray.length - 1) {
          const separator = document.createElement('hr');
          separator.style.margin = '10px 0';
          separator.style.borderTop = '1px solid #555';
          typeSectionsContainer.appendChild(separator);
        }
      });

      // Add all sections to the detail content
      detailHero.appendChild(detailHeader);
      detailHero.appendChild(detailStats);
      detailHero.appendChild(detailAbilities);
      detailHero.appendChild(detailTypeRelations);

      this.detailContentElement.appendChild(detailHero);
      
      // If this character has art, add it directly without relying on the observer
      if (window.CHARACTER_IMAGE_CACHE && window.CHARACTER_IMAGE_CACHE[hero.name]) {
        this.addArtToPanel(hero, detailIconContainer);
      }
    } finally {
      // Re-enable art observer after all detail panel updates are complete
      if (window.enableArtObserver) {
        window.enableArtObserver();
      }
    }
  }
  
  /**
   * Update an existing hero details panel without rebuilding the entire DOM structure
   * @param {Object} hero - The hero to display
   * @param {HTMLElement} detailHero - The existing detail hero element
   */
  updateExistingDetails(hero, detailHero) {
    if (!hero || !detailHero) {
      console.error("[HeroDetailPanelManager] Missing hero or detailHero element for updating");
      return;
    }
    
    // Disable observer while updating
    if (window.disableArtObserver) {
      window.disableArtObserver();
    }
    
    try {
      // Important: Update the data attributes on the wrapper to match the new hero
      const detailIconContainer = detailHero.querySelector('.hero-avatar-container.detail-icon-container');
      if (detailIconContainer) {
        // Update the container to reflect the new character
        detailIconContainer.dataset.characterId = hero.id;
        detailIconContainer.dataset.characterName = hero.name;
        
        // Add art directly if available, bypassing observer
        if (window.CHARACTER_IMAGE_CACHE && window.CHARACTER_IMAGE_CACHE[hero.name]) {
          this.addArtToPanel(hero, detailIconContainer);
        }
      }
      
      // Update background color for the detail hero container
      if (detailHero) {
        // For multiple types, use the first type's color for the background
        const heroTypes = TeamBuilderUtils.splitTypes(hero.type);
        const primaryType = heroTypes[0] || hero.type; // Fallback to full type
        detailHero.style.backgroundColor = `${this.typeColors[primaryType]}22`;
      }
    
      // Update the hero name and tags
      const heroNameEl = detailHero.querySelector('.detail-name-type h3');
      if (heroNameEl) heroNameEl.textContent = hero.name;
      
      // Update the type, role, and rarity tags
      const detailTags = detailHero.querySelector('.detail-tags');
      if (detailTags) {
        // Clear existing tags and recreate them
        detailTags.innerHTML = '';
        
        // Create a type tag for each type
        const types = TeamBuilderUtils.splitTypes(hero.type);
        types.forEach(type => {
          const typeTag = document.createElement('span');
          typeTag.className = 'detail-tag';
          typeTag.style.backgroundColor = this.typeColors[type];
          typeTag.textContent = type.charAt(0).toUpperCase() + type.slice(1);
          detailTags.appendChild(typeTag);
        });
        
        // Add role and rarity tags
        const roleTag = document.createElement('span');
        roleTag.className = 'detail-tag';
        roleTag.style.backgroundColor = '#2f3542';
        roleTag.textContent = hero.role;
        detailTags.appendChild(roleTag);
        
        // Rarity tag removed in v0.6.7.5
      }
      
      // Get or create stats container
      const detailStats = detailHero.querySelector('.detail-stats');
      if (detailStats) {
        // Clear existing stat rows
        detailStats.innerHTML = '';

        // First row of stats (existing)
        const statsRow1 = document.createElement('div');
        statsRow1.className = 'stats-row';
        statsRow1.style.display = 'flex';
        statsRow1.style.justifyContent = 'space-between';
        statsRow1.style.gap = '8px';

        const hpStat = TeamBuilderUtils.createStatBox('HP', hero.stats.hp, 'Health Points - How much damage a character can take before being defeated');
        const atkStat = TeamBuilderUtils.createStatBox('ATK', hero.stats.attack, 'Attack Power - Determines basic attack damage');
        const defStat = TeamBuilderUtils.createStatBox('DEF', hero.stats.defense, 'Defense - Reduces damage taken from attacks');
        const spdStat = TeamBuilderUtils.createStatBox('SPD', hero.stats.speed, 'Speed - Determines turn order in battle (higher goes first)');
        
        statsRow1.appendChild(hpStat);
        statsRow1.appendChild(atkStat);
        statsRow1.appendChild(defStat);
        statsRow1.appendChild(spdStat);
        
        // Only add second row if expanded stats exist
        if (hero.stats.strength && hero.stats.intellect && hero.stats.spirit) {
          // Second row of stats (new)
          const statsRow2 = document.createElement('div');
          statsRow2.className = 'stats-row';
          statsRow2.style.display = 'flex';
          statsRow2.style.justifyContent = 'space-between';
          statsRow2.style.gap = '8px';

          const strStat = TeamBuilderUtils.createStatBox('STR', hero.stats.strength, 'Strength - Increases physical ability damage');
          const intStat = TeamBuilderUtils.createStatBox('INT', hero.stats.intellect, 'Intellect - Increases spell ability damage');
          const spiStat = TeamBuilderUtils.createStatBox('SPI', hero.stats.spirit, 'Spirit - Increases healing effectiveness');

          statsRow2.appendChild(strStat);
          statsRow2.appendChild(intStat);
          statsRow2.appendChild(spiStat);

          // Add rows to stats container
          detailStats.appendChild(statsRow1);
          detailStats.appendChild(statsRow2);
        } else {
          // Just add the first row if no expanded stats
          detailStats.appendChild(statsRow1);
        }
      }
      
      // Update abilities (a bit more complex - might need to rebuild this section)
      const abilitiesContainer = detailHero.querySelector('.detail-abilities');
      if (abilitiesContainer) {
        // Keep the title but replace all ability boxes
        const abilitiesTitle = abilitiesContainer.querySelector('h4');
        abilitiesContainer.innerHTML = '';
        abilitiesContainer.appendChild(abilitiesTitle);
        
        // Re-add all abilities
        hero.abilities.forEach(ability => {
          const abilityBox = document.createElement('div');
          abilityBox.className = 'ability-box';
        
          // Determine ability's elemental type from effects for styling
          let abilityType = hero.type; // Default to character's type
          
          // If this is an active ability with effects, try to find a damage type
          if (ability.effects && Array.isArray(ability.effects)) {
            // Look for the first damage effect with a damageType
            const damageEffect = ability.effects.find(effect => 
              effect.type === 'Damage' && effect.damageType);
            
            if (damageEffect && damageEffect.damageType) {
              abilityType = damageEffect.damageType;
            }
          }
        
          // Apply the type color with reduced opacity (22 = 13% opacity in hex)
          if (this.typeColors[abilityType]) {
            abilityBox.style.backgroundColor = `${this.typeColors[abilityType]}22`;
            // Add a subtle left border with higher opacity for visual distinction
            abilityBox.style.borderLeft = `3px solid ${this.typeColors[abilityType]}66`;
          }

          const abilityName = document.createElement('div');
          abilityName.className = 'ability-name';
          abilityName.textContent = ability.name;

          const abilityDesc = document.createElement('div');
          abilityDesc.className = 'ability-desc';
          abilityDesc.textContent = ability.description;

          abilityBox.appendChild(abilityName);
          abilityBox.appendChild(abilityDesc);
          abilitiesContainer.appendChild(abilityBox);
                
          // Re-add tooltips
          if (window.tooltipManager) {
            const cooldownText = ability.cooldown > 0 ? `Cooldown: ${ability.cooldown} turns` : 'No cooldown';
            
            // Get detailed scaling information with formula
            const detailedScaling = TeamBuilderUtils.getDetailedScalingText(ability, hero);
            
            const tooltipContent = `
              <div class="tooltip-title">${ability.name}</div>
              <div>${ability.description}</div>
              <div class="tooltip-content">
                ${detailedScaling.damageText}
                <div>${cooldownText}</div>
                <div>Type: ${ability.damageType || (ability.isHealing ? 'Healing' : 'Damage')}</div>
                <div>${detailedScaling.scalingText}</div>
              </div>
            `;
            
            window.tooltipManager.addTooltip(abilityBox, tooltipContent);
            abilityBox.classList.add('has-tooltip');
          }
        });
      }
      
      // For type relations, simply remove the old section and recreate it
      const oldTypeRelations = detailHero.querySelector('.detail-type-relations');
      if (oldTypeRelations) {
        oldTypeRelations.remove();
      }
      
      // Create new type relations section
      const detailTypeRelations = document.createElement('div');
      detailTypeRelations.className = 'detail-type-relations';

      const typeRelationsTitle = document.createElement('h4');
      typeRelationsTitle.textContent = 'Type Relations';
      detailTypeRelations.appendChild(typeRelationsTitle);

      // Get all hero types
      const heroTypes = TeamBuilderUtils.splitTypes(hero.type);
      
      // Create a container for type sections
      const typeSectionsContainer = document.createElement('div');
      typeSectionsContainer.className = 'type-sections-container';
      detailTypeRelations.appendChild(typeSectionsContainer);
      
      // For each hero type, create a separate section
      heroTypes.forEach(heroType => {
        // Create a section for this type
        const typeSection = document.createElement('div');
        typeSection.className = 'type-section';
        
        // Add type header if multiple types
        if (heroTypes.length > 1) {
          const typeHeader = document.createElement('div');
          typeHeader.className = 'type-section-header';
          typeHeader.style.color = this.typeColors[heroType];
          typeHeader.textContent = heroType.charAt(0).toUpperCase() + heroType.slice(1) + ' Type';
          typeHeader.style.fontWeight = 'bold';
          typeHeader.style.marginBottom = '5px';
          typeSection.appendChild(typeHeader);
        }
        
        // Create columns for this type
        const columnsContainer = document.createElement('div');
        columnsContainer.className = 'type-columns-container';
        columnsContainer.style.display = 'flex';
        columnsContainer.style.justifyContent = 'space-between';
        typeSection.appendChild(columnsContainer);
        
        // Advantages column
        const advantagesColumn = document.createElement('div');
        advantagesColumn.className = 'type-column';

        const advantagesHeading = document.createElement('h5');
        advantagesHeading.textContent = 'Advantages';
        advantagesColumn.appendChild(advantagesHeading);

        // Disadvantages column
        const disadvantagesColumn = document.createElement('div');
        disadvantagesColumn.className = 'type-column';

        const disadvantagesHeading = document.createElement('h5');
        disadvantagesHeading.textContent = 'Disadvantages';
        disadvantagesColumn.appendChild(disadvantagesHeading);
        
        // Get type relations based on current type
        let advantageType = null;
        let advantageColor = null;
        let disadvantageType = null;
        let disadvantageColor = null;
        let advantageIcon = '';
        let disadvantageIcon = '';

        // Set relationships based on type
        switch (heroType) {
          case 'fire':
            advantageType = 'Nature';
            advantageColor = this.typeColors.nature;
            disadvantageType = 'Water';
            disadvantageColor = this.typeColors.water;
            advantageIcon = '🌿';
            disadvantageIcon = '💧';
            break;
          case 'water':
            advantageType = 'Fire';
            advantageColor = this.typeColors.fire;
            disadvantageType = 'Nature';
            disadvantageColor = this.typeColors.nature;
            advantageIcon = '🔥';
            disadvantageIcon = '🌿';
            break;
          case 'nature':
            advantageType = 'Water';
            advantageColor = this.typeColors.water;
            disadvantageType = 'Fire';
            disadvantageColor = this.typeColors.fire;
            advantageIcon = '💧';
            disadvantageIcon = '🔥';
            break;
          case 'light':
            advantageType = 'Dark';
            advantageColor = this.typeColors.dark;
            disadvantageType = 'Dark';
            disadvantageColor = this.typeColors.dark;
            advantageIcon = '🌑';
            disadvantageIcon = '🌑';
            break;
          case 'dark':
            advantageType = 'Light';
            advantageColor = this.typeColors.light;
            disadvantageType = 'Light';
            disadvantageColor = this.typeColors.light;
            advantageIcon = '✨';
            disadvantageIcon = '✨';
            break;
          case 'air':
            advantageType = 'Earth';
            advantageColor = this.typeColors.earth || '#8B4513';
            disadvantageType = 'Electric';
            disadvantageColor = '#F7DF1E'; // Yellow for electric
            advantageIcon = '🌍';
            disadvantageIcon = '⚡';
            break;
          case 'ice':
            advantageType = 'Nature';
            advantageColor = this.typeColors.nature;
            disadvantageType = 'Fire';
            disadvantageColor = this.typeColors.fire;
            advantageIcon = '🌿';
            disadvantageIcon = '🔥';
            break;
        }
        
        // Create advantage box if applicable
        if (advantageType) {
          const advantageBox = document.createElement('div');
          advantageBox.className = 'advantage-box';

          const typeName = document.createElement('span');
          typeName.className = 'type-relation-title';
          typeName.innerHTML = `${advantageIcon} ${advantageType} ${advantageIcon}`;
          typeName.style.color = advantageColor;

          advantageBox.appendChild(typeName);

          // Add tooltip for detailed info
          if (window.tooltipManager) {
            const tooltipContent = `<div class="tooltip-title">Type Advantage</div>
                <div class="tooltip-content">${heroType.charAt(0).toUpperCase() + heroType.slice(1)} does 50% more damage to ${advantageType} types.</div>`;
            window.tooltipManager.addTooltip(advantageBox, tooltipContent);
          }

          advantagesColumn.appendChild(advantageBox);
        } else {
          // No advantages case
          const noAdvantages = document.createElement('div');
          noAdvantages.className = 'advantage-box';
          noAdvantages.textContent = 'None';
          noAdvantages.style.color = 'var(--text-muted)';
          noAdvantages.style.justifyContent = 'center';
          advantagesColumn.appendChild(noAdvantages);
        }

        // Create disadvantage box if applicable
        if (disadvantageType) {
          const disadvantageBox = document.createElement('div');
          disadvantageBox.className = 'disadvantage-box';

          const typeName = document.createElement('span');
          typeName.className = 'type-relation-title';
          typeName.innerHTML = `${disadvantageIcon} ${disadvantageType} ${disadvantageIcon}`;
          typeName.style.color = disadvantageColor;

          disadvantageBox.appendChild(typeName);

          // Add tooltip for detailed info
          if (window.tooltipManager) {
            const tooltipContent = `<div class="tooltip-title">Type Disadvantage</div>
                <div class="tooltip-content">${heroType.charAt(0).toUpperCase() + heroType.slice(1)} takes 50% more damage from ${disadvantageType} types.</div>`;
            window.tooltipManager.addTooltip(disadvantageBox, tooltipContent);
          }

          disadvantagesColumn.appendChild(disadvantageBox);
        } else {
          // No disadvantages case
          const noDisadvantages = document.createElement('div');
          noDisadvantages.className = 'disadvantage-box';
          noDisadvantages.textContent = 'None';
          noDisadvantages.style.color = 'var(--text-muted)';
          noDisadvantages.style.justifyContent = 'center';
          disadvantagesColumn.appendChild(noDisadvantages);
        }
        
        // Add columns to the columns container
        columnsContainer.appendChild(advantagesColumn);
        columnsContainer.appendChild(disadvantagesColumn);
        
        // Add this type section to the sections container
        typeSectionsContainer.appendChild(typeSection);
        
        // Add separator if not the last type
        if (heroTypes.indexOf(heroType) < heroTypes.length - 1) {
          const separator = document.createElement('hr');
          separator.style.margin = '10px 0';
          separator.style.borderTop = '1px solid #555';
          typeSectionsContainer.appendChild(separator);
        }
      });

      // Find a good position to add the type relations - after abilities if it exists
      const abilitiesSection = detailHero.querySelector('.detail-abilities');
      if (abilitiesSection) {
        abilitiesSection.after(detailTypeRelations);
      } else {
        detailHero.appendChild(detailTypeRelations);
      }
    
    } finally {
      // Re-enable the observer when done
      if (window.enableArtObserver) {
        window.enableArtObserver();
      }
    }
  }
  
  /**
   * Add character art directly to a detail panel without using the observer
   * @param {Object} hero - The hero to display art for
   * @param {HTMLElement} detailIconContainer - The container for the art
   */
  addArtToPanel(hero, detailIconContainer) {
    if (!hero || !detailIconContainer) {
      console.error("[HeroDetailPanelManager] Missing hero or detailIconContainer");
      return;
    }
    
    // Find art wrapper or create one
    let artWrapper = detailIconContainer.querySelector('.hero-art-wrapper');
    if (!artWrapper) {
      artWrapper = document.createElement('div');
      artWrapper.className = 'hero-art-wrapper';
      artWrapper.style.display = 'block';
      detailIconContainer.appendChild(artWrapper);
    }
    
    // Clear any existing art
    while (artWrapper.firstChild) {
      artWrapper.removeChild(artWrapper.firstChild);
    }
    
    // Clone image from cache
    const newImg = window.CHARACTER_IMAGE_CACHE[hero.name].cloneNode(true);
    
    // Set styling for detail view
    newImg.className = 'character-art team-builder-art';
    newImg.alt = hero.name;
    newImg.style.position = 'absolute';
    
    // Get character positioning data
    const character = this.availableHeroes.find(c => c.id == hero.id);
    const artSettings = character?.detailArt || character?.teamBuilderArt || character?.art || {};
    
    // Apply custom positioning for this character
    newImg.style.left = artSettings.left || '-30px';
    newImg.style.top = artSettings.top || '-45px';
    newImg.style.width = artSettings.width || '140px';
    newImg.style.height = artSettings.height || '140px';
    newImg.style.visibility = 'visible';
    newImg.style.display = 'block';
    newImg.style.zIndex = '100';
    
    // Add the image to the wrapper
    artWrapper.appendChild(newImg);
    
    // Add relevant classes
    detailIconContainer.classList.add('has-art');
    const detailHero = detailIconContainer.closest('.detail-hero');
    if (detailHero) detailHero.classList.add('has-art');
  }
  
  /**
   * Clear the details panel
   */
  clearDetails() {
    if (!this.detailContentElement) {
      console.error("[HeroDetailPanelManager] Cannot clear details - detail-content element not found");
      return;
    }
    
    this.detailContentElement.innerHTML = '';
    
    // Show empty state
    const detailEmpty = document.createElement('div');
    detailEmpty.className = 'detail-empty';
    detailEmpty.textContent = 'Select a hero to view details';
    this.detailContentElement.appendChild(detailEmpty);
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Clean up any resources or event listeners
    console.log("[HeroDetailPanelManager] Destroyed");
    this.parentUI = null;
    this.availableHeroes = null;
  }
}

// Make component available globally
if (typeof window !== 'undefined') {
  window.HeroDetailPanelManager = HeroDetailPanelManager;
  console.log("HeroDetailPanelManager loaded and exported to window.HeroDetailPanelManager");
}
