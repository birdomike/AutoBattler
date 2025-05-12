/**
 * HeroGridManager - Handles hero grid rendering and selection
 * 
 * This component is responsible for rendering the grid of available heroes,
 * applying filters, handling hero selection, and interfacing with the image
 * loading system for character art.
 */
class HeroGridManager {
  /**
   * Create a new HeroGridManager
   * @param {TeamBuilderUI} parentUI - Reference to the main TeamBuilderUI
   */
  constructor(parentUI) {
    // Validate parent
    if (!parentUI) {
      console.error("[HeroGridManager] parentUI is required");
      return;
    }
    
    this.parentUI = parentUI;
    
    // Required references from parent
    this.availableHeroes = parentUI.availableHeroes;
    this.typeColors = parentUI.typeColors;
    this.selectedHeroDetails = null;
    this.imageLoader = parentUI.imageLoader;
    
    // Component-specific properties
    this.activeFilters = {
      types: [],
      roles: []
    };
    
    console.log("[HeroGridManager] Initialized");
  }
  
  /**
   * Render the available heroes grid
   */
  renderHeroGrid() {
    const heroesGrid = document.getElementById('heroes-grid');
    if (!heroesGrid) {
      console.error("[HeroGridManager] Heroes grid element not found");
      return;
    }
    
    heroesGrid.innerHTML = '';

    // Filter heroes based on active filters
    let filteredHeroes = [...this.availableHeroes];
    
    // Apply type filters
    if (this.activeFilters.types.length > 0) {
      filteredHeroes = filteredHeroes.filter(hero => {
        // Split the hero's type if it contains multiple types
        const heroTypes = TeamBuilderUtils.splitTypes(hero.type);
        
        // Check if any of the hero's types match any of the active filters
        return heroTypes.some(type => this.activeFilters.types.includes(type));
      });
    }
    
    // Apply role filters
    if (this.activeFilters.roles.length > 0) {
      filteredHeroes = filteredHeroes.filter(hero => 
        this.activeFilters.roles.includes(hero.role)
      );
    }

    // Display message if no heroes match filters
    if (filteredHeroes.length === 0) {
      const noHeroes = document.createElement('div');
      noHeroes.className = 'no-heroes-message';
      noHeroes.textContent = 'No heroes match your filters';
      heroesGrid.appendChild(noHeroes);
      return;
    }

    // Create hero cards for each filtered hero
    filteredHeroes.forEach(hero => {
      const heroCard = this.createHeroCard(hero);
      heroesGrid.appendChild(heroCard);
    });
    
    // Force image loader to check for new images
    this.triggerImageLoader();
  }
  
  /**
   * Create a hero card element
   * @param {Object} hero - The hero data
   * @returns {HTMLElement} The hero card element
   */
  createHeroCard(hero) {
    const heroCard = document.createElement('div');
    heroCard.className = 'hero-card';
    
    // For multiple types, use the first type's color for the background
    const heroTypes = TeamBuilderUtils.splitTypes(hero.type);
    const primaryType = heroTypes[0] || hero.type; // Fallback to full type string if split fails
    heroCard.style.backgroundColor = `${this.typeColors[primaryType]}22`;
    heroCard.dataset.heroId = hero.id;

    // Add selected class if this is the currently selected hero
    if (this.selectedHeroDetails && this.selectedHeroDetails.id === hero.id) {
      heroCard.classList.add('selected');
    }

    const heroContent = document.createElement('div');
    heroContent.className = 'hero-card-content';

    // Create avatar container structure for character art - NO VISIBLE BACKGROUNDS
    const heroIconContainer = document.createElement('div');
    heroIconContainer.className = 'hero-avatar-container';
    heroIconContainer.dataset.characterId = hero.id;
    heroIconContainer.dataset.characterName = hero.name;
    heroIconContainer.dataset.artSynced = '0';
    
    // Create art wrapper for character images - this is all we need now
    const artWrapper = document.createElement('div');
    artWrapper.className = 'hero-art-wrapper';
    
    // Assemble the icon structure
    heroIconContainer.appendChild(artWrapper);

    const heroText = document.createElement('div');
    heroText.className = 'hero-card-text';

    const heroName = document.createElement('div');
    heroName.className = 'hero-name';
    heroName.textContent = hero.name;

    const heroType = document.createElement('div');
    heroType.className = 'hero-type';
    
    // Clear any existing content
    heroType.innerHTML = '';
    
    // Render multi-type spans
    TeamBuilderUtils.renderMultiTypeSpans(hero.type, heroType, this.typeColors);
    
    const heroRole = document.createElement('div');
    heroRole.className = 'hero-role';
    heroRole.textContent = hero.role;

    // Changed order: First add the avatar container, then add text in vertical layout
    heroContent.appendChild(heroIconContainer);
    
    // Add text elements to hero text container
    heroText.appendChild(heroName);
    heroText.appendChild(heroType);
    heroText.appendChild(heroRole);
    
    // Add text container to content
    heroContent.appendChild(heroText);

    heroCard.appendChild(heroContent);

    // Add event listener
    heroCard.addEventListener('click', () => this.selectHero(hero));
    
    // Explicitly draw character art using the central drawing function
    if (this.imageLoader && typeof this.imageLoader.drawArt === 'function') {
      this.imageLoader.drawArt(hero, heroIconContainer, false);
    } else {
      console.error("[HeroGridManager] Cannot draw art - imageLoader.drawArt not available");
    }

    return heroCard;
  }
  
  /**
   * Update active filters
   * @param {Object} filters - The new filters
   */
  updateFilters(filters) {
    if (!filters || typeof filters !== 'object') {
      console.warn("[HeroGridManager] Invalid filters provided");
      return;
    }
    
    this.activeFilters = {
      types: filters.types || [],
      roles: filters.roles || []
    };
    
    // Re-render the grid with new filters
    this.renderHeroGrid();
  }
  
  /**
   * Select a hero and notify parent
   * @param {Object} hero - The hero to select
   */
  selectHero(hero) {
    this.selectedHeroDetails = hero;
    
    // Re-render to update selection visuals
    this.renderHeroGrid();
    
    // Notify parent
    if (this.parentUI && typeof this.parentUI.onHeroSelected === 'function') {
      this.parentUI.onHeroSelected(hero);
    }
  }
  
  /**
   * Update selected hero
   * @param {Object} hero - The hero to mark as selected
   */
  updateSelectedHero(hero) {
    this.selectedHeroDetails = hero;
    
    // Trigger re-render to update selection visualization
    this.renderHeroGrid();
  }
  
  /**
   * DEPRECATED: Trigger the image loader to check for new images
   * No longer needed as art is explicitly drawn during card creation
   */
  triggerImageLoader() {
    // No-op - art is now explicitly managed in createHeroCard
    console.warn("[HeroGridManager] triggerImageLoader is deprecated - art is now explicitly drawn");
  }
}

// Make component available globally
if (typeof window !== 'undefined') {
  window.HeroGridManager = HeroGridManager;
  console.log("HeroGridManager loaded and exported to window.HeroGridManager");
}