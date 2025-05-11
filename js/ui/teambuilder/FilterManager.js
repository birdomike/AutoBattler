/**
 * FilterManager - Handles filter rendering and state management
 * 
 * This component is responsible for rendering and managing the type and role
 * filters in the TeamBuilder UI, including tracking active filters and
 * notifying parent components of filter changes.
 */
class FilterManager {
  /**
   * Create a new FilterManager
   * @param {TeamBuilderUI} parentUI - Reference to the main TeamBuilderUI
   */
  constructor(parentUI) {
    // Validate parent
    if (!parentUI) {
      console.error("[FilterManager] parentUI is required");
      return;
    }
    
    this.parentUI = parentUI;
    
    // Required references from parent
    this.typeColors = parentUI.typeColors;
    
    // Component-specific properties
    this.activeFilters = {
      types: [],
      roles: []
    };
    
    console.log("[FilterManager] Initialized");
  }
  
  /**
   * Render filter options for types and roles
   */
  renderFilters() {
    const heroesSection = document.getElementById('available-heroes');
    
    // Check if filter section already exists
    let filterSection = document.getElementById('hero-filters');
    if (!filterSection) {
      filterSection = document.createElement('div');
      filterSection.id = 'hero-filters';
      
      // Insert filters before the heroes grid
      const heroesGrid = document.getElementById('heroes-grid');
      heroesSection.insertBefore(filterSection, heroesGrid);
    } else {
      filterSection.innerHTML = '';
    }

    // Create type filters
    const typeFilters = document.createElement('div');
    typeFilters.className = 'filter-group';
    
    const typeLabel = document.createElement('div');
    typeLabel.className = 'filter-label';
    typeLabel.textContent = 'Filter by Type:';
    typeFilters.appendChild(typeLabel);
    
    // Use all 22 types from the design
    const allTypes = [
      'fire', 'water', 'nature', 'electric', 'ice', 'rock', 'metal', 'air', 
      'light', 'dark', 'psychic', 'poison', 'physical', 'arcane', 'mechanical', 
      'void', 'crystal', 'storm', 'ethereal', 'blood', 'plague', 'gravity'
    ];
    
    const typeButtonsContainer = this.createTypeButtons(allTypes);
    typeFilters.appendChild(typeButtonsContainer);
    filterSection.appendChild(typeFilters);
    
    // Create role filters
    const roleFilters = document.createElement('div');
    roleFilters.className = 'filter-group';
    
    const roleLabel = document.createElement('div');
    roleLabel.className = 'filter-label';
    roleLabel.textContent = 'Filter by Role:';
    roleFilters.appendChild(roleLabel);
    
    // Use all 22 roles from the design
    const allRoles = [
      'Warrior', 'Sentinel', 'Berserker', 'Ranger', 'Assassin', 'Bulwark',
      'Mage', 'Invoker', 'Sorcerer', 'Summoner', 'Occultist', 'Mystic',
      'Champion', 'Wildcaller', 'Striker', 'Emissary', 'Elementalist',
      'Warden', 'Skirmisher', 'Battlemage', 'Venomancer', 'Trickster'
    ];
    
    const roleButtonsContainer = this.createRoleButtons(allRoles);
    roleFilters.appendChild(roleButtonsContainer);
    filterSection.appendChild(roleFilters);
    
    // Add clear filters button (only if filters are active)
    this.addClearFiltersButton(filterSection);
  }

  /**
   * Create type filter buttons
   * @param {string[]} types - List of types to create buttons for
   * @returns {HTMLElement} - Container with type buttons
   */
  createTypeButtons(types) {
    const typeButtonsContainer = document.createElement('div');
    typeButtonsContainer.className = 'filter-buttons';
    
    types.forEach(type => {
      const typeButton = document.createElement('button');
      typeButton.className = `filter-button ${this.activeFilters.types.includes(type) ? 'active' : ''}`;
      typeButton.dataset.type = type;
      
      // Special handling for Ethereal to use higher opacity and black text
      if (type === 'ethereal') {
        typeButton.style.backgroundColor = `${this.typeColors[type]}EE`; // 93% opacity for Ethereal
        typeButton.style.color = '#000000'; // Black text for Ethereal
        typeButton.style.fontWeight = 'bold'; // Make text bolder for better contrast
      } else {
        // Normal styling for other types
        typeButton.style.backgroundColor = `${this.typeColors[type]}88`; // Regular opacity
      }
      
      typeButton.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      
      // Add event listener
      typeButton.addEventListener('click', () => this.toggleFilter('types', type));
      
      // Add hover sound
      if (window.soundManager) {
        window.soundManager.addHoverSound(typeButton);
      }
      
      typeButtonsContainer.appendChild(typeButton);
    });
    
    return typeButtonsContainer;
  }

  /**
   * Create role filter buttons
   * @param {string[]} roles - List of roles to create buttons for
   * @returns {HTMLElement} - Container with role buttons
   */
  createRoleButtons(roles) {
    const roleButtonsContainer = document.createElement('div');
    roleButtonsContainer.className = 'filter-buttons';
    
    roles.forEach(role => {
      const roleButton = document.createElement('button');
      roleButton.className = `filter-button ${this.activeFilters.roles.includes(role) ? 'active' : ''}`;
      roleButton.dataset.role = role;
      roleButton.textContent = role;
      
      // Add event listener
      roleButton.addEventListener('click', () => this.toggleFilter('roles', role));
      
      // Add hover sound
      if (window.soundManager) {
        window.soundManager.addHoverSound(roleButton);
      }
      
      roleButtonsContainer.appendChild(roleButton);
    });
    
    return roleButtonsContainer;
  }

  /**
   * Add clear filters button if filters are active
   * @param {HTMLElement} filterSection - The filter section to add button to
   */
  addClearFiltersButton(filterSection) {
    const hasActiveFilters = this.activeFilters.types.length > 0 || this.activeFilters.roles.length > 0;
    if (hasActiveFilters) {
      const clearButton = document.createElement('button');
      clearButton.className = 'clear-filters-btn';
      clearButton.id = 'clear-filters-btn';
      clearButton.textContent = 'Clear Filters';
      
      clearButton.addEventListener('click', () => this.clearFilters());
      
      // Add hover sound
      if (window.soundManager) {
        window.soundManager.addHoverSound(clearButton);
      }
      
      filterSection.appendChild(clearButton);
    }
  }

  /**
   * Toggle a filter on or off
   * @param {string} filterType - 'types' or 'roles'
   * @param {string} value - The filter value to toggle
   */
  toggleFilter(filterType, value) {
    const index = this.activeFilters[filterType].indexOf(value);
    if (index === -1) {
      // Add filter
      this.activeFilters[filterType].push(value);
    } else {
      // Remove filter
      this.activeFilters[filterType].splice(index, 1);
    }
    
    // Re-render filters to update UI
    this.renderFilters();
    
    // Play sound
    if (window.soundManager) {
      window.soundManager.play('click');
    }
    
    // Notify parent of filter change
    this.notifyFiltersChanged();
  }

  /**
   * Clear all active filters
   */
  clearFilters() {
    this.activeFilters.types = [];
    this.activeFilters.roles = [];
    
    // Re-render filters to update UI
    this.renderFilters();
    
    // Play sound
    if (window.soundManager) {
      window.soundManager.play('click');
    }
    
    // Notify parent of filter change
    this.notifyFiltersChanged();
  }

  /**
   * Get active filters
   * @returns {Object} Current active filters
   */
  getActiveFilters() {
    return this.activeFilters;
  }

  /**
   * Set active filters 
   * @param {Object} filters - Filters to set
   */
  setActiveFilters(filters) {
    if (filters && typeof filters === 'object') {
      this.activeFilters = {
        types: filters.types || [],
        roles: filters.roles || []
      };
      
      // Re-render to reflect new filters
      this.renderFilters();
    }
  }

  /**
   * Notify parent component of filter changes
   */
  notifyFiltersChanged() {
    if (this.parentUI && typeof this.parentUI.onFiltersChanged === 'function') {
      this.parentUI.onFiltersChanged(this.activeFilters);
    }
  }
}

// Make component available globally
if (typeof window !== 'undefined') {
  window.FilterManager = FilterManager;
  console.log("FilterManager loaded and exported to window.FilterManager");
}