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
    
    // Collapsible state for filter groups
    this.expandedSections = {
      types: false, // Default collapsed
      roles: false  // Default collapsed
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

    // Add CSS for collapsible filters if not already added
    this.addCollapsibleFilterStyles();

    // Create type filters
    const typeFilters = document.createElement('div');
    typeFilters.className = 'filter-group';
    if (this.expandedSections.types) {
      typeFilters.classList.add('expanded');
    }
    
    const typeLabel = document.createElement('div');
    typeLabel.className = 'filter-label';
    
    // Add active filter count if any
    const activeTypeCount = this.activeFilters.types.length;
    let typeLabelText = 'Filter by Type';
    if (activeTypeCount > 0) {
      const typeCountBadge = document.createElement('span');
      typeCountBadge.className = 'filter-badge';
      typeCountBadge.textContent = activeTypeCount;
      typeLabel.appendChild(document.createTextNode(typeLabelText));
      typeLabel.appendChild(typeCountBadge);
    } else {
      typeLabel.textContent = typeLabelText;
    }
    
    // Add toggle icon
    const typeToggleIcon = document.createElement('span');
    typeToggleIcon.className = 'filter-toggle-icon';
    typeToggleIcon.innerHTML = this.expandedSections.types ? '▲' : '▼';
    typeLabel.appendChild(typeToggleIcon);
    
    // Make label clickable to toggle
    typeLabel.addEventListener('click', () => this.toggleSectionExpanded('types'));
    
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
    if (this.expandedSections.roles) {
      roleFilters.classList.add('expanded');
    }
    
    const roleLabel = document.createElement('div');
    roleLabel.className = 'filter-label';
    
    // Add active filter count if any
    const activeRoleCount = this.activeFilters.roles.length;
    let roleLabelText = 'Filter by Role';
    if (activeRoleCount > 0) {
      const roleCountBadge = document.createElement('span');
      roleCountBadge.className = 'filter-badge';
      roleCountBadge.textContent = activeRoleCount;
      roleLabel.appendChild(document.createTextNode(roleLabelText));
      roleLabel.appendChild(roleCountBadge);
    } else {
      roleLabel.textContent = roleLabelText;
    }
    
    // Add toggle icon
    const roleToggleIcon = document.createElement('span');
    roleToggleIcon.className = 'filter-toggle-icon';
    roleToggleIcon.innerHTML = this.expandedSections.roles ? '▲' : '▼';
    roleLabel.appendChild(roleToggleIcon);
    
    // Make label clickable to toggle
    roleLabel.addEventListener('click', () => this.toggleSectionExpanded('roles'));
    
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
    typeButtonsContainer.className = 'filter-buttons filter-buttons-container';
    
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
    roleButtonsContainer.className = 'filter-buttons filter-buttons-container';
    
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
  
  /**
   * Toggle the expanded/collapsed state of a filter section
   * @param {string} sectionType - 'types' or 'roles'
   */
  toggleSectionExpanded(sectionType) {
    this.expandedSections[sectionType] = !this.expandedSections[sectionType];
    
    // Play sound
    if (window.soundManager) {
      window.soundManager.play('click');
    }
    
    // Re-render filters to update UI
    this.renderFilters();
  }
  
  /**
   * Add CSS styles for collapsible filters if not already added
   */
  addCollapsibleFilterStyles() {
    // Check if styles are already added
    if (document.getElementById('collapsible-filter-styles')) {
      return;
    }
    
    const styleEl = document.createElement('style');
    styleEl.id = 'collapsible-filter-styles';
    styleEl.textContent = `
      .filter-group {
        margin-bottom: 8px;
        border: 1px solid #2d3748;
        border-radius: 8px;
        overflow: hidden;
        background-color: rgba(30, 39, 56, 0.8);
      }
      
      .filter-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background-color: rgba(30, 39, 56, 0.9);
        cursor: pointer;
        user-select: none;
      }
      
      .filter-label:hover {
        background-color: rgba(45, 55, 72, 0.9);
      }
      
      .filter-buttons-container {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
        padding: 0 10px;
      }
      
      .filter-group.expanded .filter-buttons-container {
        max-height: 500px; /* Large enough to fit content */
        padding: 10px;
      }
      
      .filter-toggle-icon {
        margin-left: 10px;
        transition: transform 0.3s ease;
      }
      
      .filter-group.expanded .filter-toggle-icon {
        transform: rotate(180deg);
      }
      
      .filter-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        background-color: #2b6cb0;
        margin-left: 8px;
      }
    `;
    
    document.head.appendChild(styleEl);
  }
}

// Make component available globally
if (typeof window !== 'undefined') {
  window.FilterManager = FilterManager;
  console.log("FilterManager loaded and exported to window.FilterManager");
}