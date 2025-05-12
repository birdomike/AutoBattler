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
    
    // View mode state management (full or compact)
    this.viewMode = localStorage.getItem('heroGridViewMode') || 'full'; // Default to 'full'
    
    console.log("[HeroGridManager] Initialized with view mode: " + this.viewMode);
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
    
    // Clear the grid
    heroesGrid.innerHTML = '';
    
    // Apply view mode class
    heroesGrid.className = `heroes-grid view-${this.viewMode}`;

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

    // Create avatar container structure for character art
    const heroIconContainer = document.createElement('div');
    heroIconContainer.className = 'hero-avatar-container';
    heroIconContainer.dataset.characterId = hero.id;
    heroIconContainer.dataset.characterName = hero.name;
    heroIconContainer.dataset.artSynced = '0';
    
    // Create art wrapper for character images
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
    
    // Render multi-type spans
    TeamBuilderUtils.renderMultiTypeSpans(hero.type, heroType, this.typeColors);
    
    const heroRole = document.createElement('div');
    heroRole.className = 'hero-role';
    heroRole.textContent = hero.role;

    // Add text elements to hero text container
    heroText.appendChild(heroName);
    heroText.appendChild(heroType);
    heroText.appendChild(heroRole);
    
    // Assemble the card based on view mode
    if (this.viewMode === 'full') {
      // Full view: Art above, text below (vertical layout)
      heroContent.appendChild(heroIconContainer);
      heroContent.appendChild(heroText);
    } else {
      // Compact view: Art beside text (horizontal layout)
      heroContent.appendChild(heroIconContainer);
      heroContent.appendChild(heroText);
    }

    heroCard.appendChild(heroContent);

    // Add event listener
    heroCard.addEventListener('click', () => this.selectHero(hero));
    
    // Explicitly draw character art using the central drawing function
    if (this.imageLoader && typeof this.imageLoader.drawArt === 'function') {
      this.imageLoader.drawArt(hero, heroIconContainer, false, this.viewMode);
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
  
  /**
   * Set the grid view mode (full or compact)
   * @param {string} mode - The view mode ('full' or 'compact')
   */
  setViewMode(mode) {
    if (mode !== 'full' && mode !== 'compact') {
      console.warn("[HeroGridManager] Invalid view mode: " + mode);
      return;
    }
    
    this.viewMode = mode;
    localStorage.setItem('heroGridViewMode', mode);
    
    // Re-render with new view mode
    this.renderHeroGrid();
    
    // Update toggle button appearance
    this.updateViewToggle();
  }

  /**
   * Toggle between full and compact view modes
   */
  toggleViewMode() {
    const newMode = this.viewMode === 'full' ? 'compact' : 'full';
    this.setViewMode(newMode);
    
    // Play sound effect if available
    if (window.soundManager) {
      window.soundManager.play('click');
    }
  }

  /**
   * Update the view toggle button appearance
   */
  updateViewToggle() {
    const toggleButton = document.getElementById('toggle-view');
    if (!toggleButton) return;
    
    // Update active class
    toggleButton.classList.toggle('active', this.viewMode === 'compact');
    
    // Update icon
    const icon = toggleButton.querySelector('.toggle-icon svg');
    if (icon) {
      if (this.viewMode === 'full') {
        icon.innerHTML = `<path d="M3 3h5v5H3V3zm8 0h5v5h-5V3zm8 0h5v5h-5V3zM3 11h5v5H3v-5zm8 0h5v5h-5v-5zm8 0h5v5h-5v-5zM3 19h5v5H3v-5zm8 0h5v5h-5v-5zm8 0h5v5h-5v-5z" />`;
      } else {
        icon.innerHTML = `<path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z" />`;
      }
    }
    
    // Update label
    const label = toggleButton.querySelector('.toggle-label');
    if (label) {
      label.textContent = this.viewMode === 'full' ? 'Compact View' : 'Full View';
    }
  }

  /**
   * Initialize the view toggle button
   */
  initializeViewToggle() {
    // Create section title wrapper if it doesn't exist
    let sectionTitle = document.querySelector('#available-heroes > h2');
    if (!sectionTitle) return;
    
    // Check if wrapper already exists
    if (!sectionTitle.querySelector('.section-header-wrapper')) {
      // Create wrapper for title and toggle
      const wrapper = document.createElement('div');
      wrapper.className = 'section-header-wrapper';
      wrapper.style.display = 'flex';
      wrapper.style.justifyContent = 'space-between';
      wrapper.style.alignItems = 'center';
      
      // Move title into wrapper
      const titleText = sectionTitle.textContent;
      sectionTitle.textContent = '';
      
      const title = document.createElement('span');
      title.textContent = titleText;
      wrapper.appendChild(title);
      
      // Create toggle button
      const toggle = document.createElement('button');
      toggle.id = 'toggle-view';
      toggle.className = 'toggle-view-button';
      toggle.title = 'Toggle between compact and full view';
      toggle.style.background = 'var(--darker-bg)';
      toggle.style.border = 'none';
      toggle.style.borderRadius = '4px';
      toggle.style.padding = '6px 10px';
      toggle.style.color = 'var(--text)';
      toggle.style.cursor = 'pointer';
      toggle.style.display = 'flex';
      toggle.style.alignItems = 'center';
      toggle.style.gap = '5px';
      toggle.style.transition = 'all 0.2s';
      
      // Create icon
      const iconSpan = document.createElement('span');
      iconSpan.className = 'toggle-icon';
      iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none">
        <!-- Icon will be populated in updateViewToggle() -->
      </svg>`;
      
      // Create label
      const labelSpan = document.createElement('span');
      labelSpan.className = 'toggle-label';
      labelSpan.textContent = 'View';
      
      toggle.appendChild(iconSpan);
      toggle.appendChild(labelSpan);
      
      // Add click event
      toggle.addEventListener('click', () => this.toggleViewMode());
      
      wrapper.appendChild(toggle);
      
      // Replace section title with wrapper
      sectionTitle.appendChild(wrapper);
      
      // Update toggle appearance based on current mode
      this.updateViewToggle();
    }
  }
}

// Make component available globally
if (typeof window !== 'undefined') {
  window.HeroGridManager = HeroGridManager;
  console.log("HeroGridManager loaded and exported to window.HeroGridManager");
}