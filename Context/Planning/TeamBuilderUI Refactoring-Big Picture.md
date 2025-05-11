# TeamBuilderUI Refactoring: Big Picture

## Extract-Verify-Remove Methodology

Based on lessons learned from previous refactoring efforts, we'll follow a strict Extract-Verify-Remove cycle for each component:

1. **Extract**:
   - Define the complete component interface first (all methods and properties)
   - Create the new component with ALL required methods (even as stubs initially)
   - Update TeamBuilderUI.js to delegate to the new component
   - Implement parameter validation and defensive checks

2. **Verify**:
   - Test the complete TeamBuilder flow with the new component
   - Validate component interactions and dependencies
   - Verify visual appearance and functionality match the original

3. **Remove**:
   - **Immediately** remove original implementation after verification
   - Document lines of code removed and file size reduction
   - Keep only thin delegation methods in TeamBuilderUI.js

**Important**: We will complete all three steps for each component before moving to the next component. This prevents accumulation of technical debt and ensures clear responsibility boundaries.

## Phased Implementation Plan

### Phase 1: TeamBuilderUtils and Infrastructure
- Create folder structure
- Define interfaces for all planned components
- Extract TeamBuilderUtils.js with shared functionality
- Create dependency maps showing component interactions
- Establish validation patterns for component method checking

### Phase 2: HeroDetailPanelManager
- Define complete interface for HeroDetailPanelManager
- Implement HeroDetailPanelManager.js with all required methods
- Update TeamBuilderUI.js to delegate detail rendering
- Verify detail panel functionality
- Remove original implementation code
- Document lines of code removed

### Phase 3: FilterManager
- Define complete interface for FilterManager
- Implement FilterManager.js with all required methods
- Update TeamBuilderUI.js to delegate filter rendering/handling
- Verify filter functionality
- Remove original implementation code
- Document lines of code removed

### Phase 4: HeroGridManager
- Define complete interface for HeroGridManager
- Implement HeroGridManager.js with all required methods
- Update TeamBuilderUI.js to delegate grid rendering
- Verify grid functionality with filters
- Remove original implementation code
- Document lines of code removed

### Phase 5: TeamSlotsManager
- Define complete interface for TeamSlotsManager
- Implement TeamSlotsManager.js with all required methods
- Update TeamBuilderUI.js to delegate team management
- Verify team slot functionality
- Remove original implementation code
- Document lines of code removed

### Phase 6: Battle Mode and Initiation
- Define interfaces for BattleModeManager and BattleInitiator
- Implement both components with all required methods
- Update TeamBuilderUI.js to delegate battle mode/initiation
- Verify battle flow functionality
- Remove original implementation code
- Document lines of code removed

## Overall Architecture

The refactored system will transform TeamBuilderUI from a monolithic class into an orchestrator that delegates to specialized manager components:

```
TeamBuilderUI (orchestrator)
├── TeamBuilderUtils (shared utility functions)
├── FilterManager (handles type/role filtering)
├── HeroGridManager (displays available heroes)
├── TeamSlotsManager (manages team composition)
├── HeroDetailPanelManager (displays hero details)
├── BattleModeManager (handles battle mode selection)
└── BattleInitiator (handles battle start logic)
```

**Component Dependencies Map**:

```
TeamBuilderUI → All components (initialization and coordination)
HeroGridManager → FilterManager (needs filter state for rendering)
HeroGridManager → TeamBuilderUtils (for type handling methods)
TeamSlotsManager → TeamBuilderUtils (for type handling methods)
HeroDetailPanelManager → TeamBuilderUtils (for type handling methods)
BattleInitiator → TeamSlotsManager (needs team data)
BattleInitiator → BattleModeManager (needs battle mode)
```

This dependency map guides our implementation order, with less-dependent components implemented first.

## File Structure

```
C:\Personal\AutoBattler\
└── js\
    └── ui\
        ├── TeamBuilderUI.js (simplified orchestrator)
        └── teambuilder\
            ├── FilterManager.js
            ├── HeroGridManager.js
            ├── TeamSlotsManager.js
            ├── HeroDetailPanelManager.js
            ├── BattleModeManager.js
            └── BattleInitiator.js
```

## Detailed Component Specifications

### 1. FilterManager (js/ui/teambuilder/FilterManager.js)

**Responsibilities:**
- Render and manage type/role filters
- Track active filter state
- Handle filter toggle events
- Notify parent of filter changes

**Properties to Extract:**
- `activeFilters`
- `typeColors` (copy, as multiple managers need this)

**Methods to Extract:**
- `renderFilters()`
- New method: `toggleFilter(filterType, filterValue)`

**Interface with TeamBuilderUI:**
- Constructor accepts TeamBuilderUI reference
- Provides `getActiveFilters()` method
- Provides callback when filters change: `onFiltersChanged`

**Key Code Blocks:**
```javascript
// Callback pattern for filter changes
toggleFilter(type, value) {
  // Update filter state
  // ...
  
  // Notify parent
  if (this.parentUI && typeof this.parentUI.onFiltersChanged === 'function') {
    this.parentUI.onFiltersChanged(this.activeFilters);
  }
}
```

### 2. HeroGridManager (js/ui/teambuilder/HeroGridManager.js)

**Responsibilities:**
- Render the grid of available heroes based on filters
- Handle hero selection
- Manage character art containers for the grid
- Trigger image loading for heroes

**Properties to Extract:**
- Reference to `availableHeroes`
- Reference to `typeColors`
- Reference to `selectedHeroDetails`

**Methods to Extract:**
- `renderHeroGrid()`
- `splitTypes()` (utility method needed by multiple managers)
- `renderMultiTypeSpans()` (utility method needed by multiple managers)

**Interface with TeamBuilderUI:**
- Constructor accepts TeamBuilderUI reference
- Provides `selectHero(hero)` for selection handling
- Accepts `updateGrid(filters)` to refresh based on filter changes

**Key Code Blocks:**
```javascript
updateGrid(filters) {
  this.activeFilters = filters;
  this.render();
}

// Selection handler called when hero card clicked
onHeroCardClick(hero) {
  if (this.parentUI && typeof this.parentUI.onHeroSelected === 'function') {
    this.parentUI.onHeroSelected(hero);
  }
}
```

### 3. TeamSlotsManager (js/ui/teambuilder/TeamSlotsManager.js)

**Responsibilities:**
- Render team slots (player and enemy)
- Handle adding/removing heroes from teams
- Calculate and display team synergies
- Toggle between player/enemy team selection
- Manage character art in team slots

**Properties to Extract:**
- `selectedHeroes`
- `enemySelectedHeroes`
- `isSelectingEnemyTeam`
- Reference to `typeColors`

**Methods to Extract:**
- `renderTeamSlots()`
- `renderTeamSynergies()`
- `calculateSynergies()`
- `addHeroToTeam(position)`
- `removeHeroFromTeam(position)`
- `getOrdinalSuffix(n)` (utility method)

**Interface with TeamBuilderUI:**
- Constructor accepts TeamBuilderUI reference
- Provides `getPlayerTeam()` and `getEnemyTeam()`
- Provides `setSelectedHero(hero)` to update selected hero
- Provides `toggleTeamSelection()` to switch between player/enemy team

**Key Code Blocks:**
```javascript
// Selecting enemy/player team toggle
toggleTeamSelection(isSelectingEnemy) {
  this.isSelectingEnemyTeam = isSelectingEnemy;
  this.render();
  
  // Notify parent for battle button update
  if (this.parentUI && typeof this.parentUI.onTeamSelectionChanged === 'function') {
    this.parentUI.onTeamSelectionChanged(isSelectingEnemy);
  }
}
```

### 4. HeroDetailPanelManager (js/ui/teambuilder/HeroDetailPanelManager.js)

**Responsibilities:**
- Render detailed hero information
- Display hero stats, abilities, and type relations
- Handle direct art display in the detail panel
- Manage tooltips for abilities and stats

**Properties to Extract:**
- Reference to `typeColors`
- Reference to `rarityColors`
- Reference to `availableHeroes` (for art settings)

**Methods to Extract:**
- `renderHeroDetails()`
- `updateExistingHeroDetails(detailHero)`
- `addArtToDetailPanel(hero, detailIconContainer)`
- `createStatBox(label, value, tooltip)`
- `getDetailedScalingText(ability, hero)`

**Interface with TeamBuilderUI:**
- Constructor accepts TeamBuilderUI reference
- Provides `renderDetails(hero)` method
- Provides `clearDetails()` method

**Key Code Blocks:**
```javascript
// Clear details panel when no hero selected
clearDetails() {
  const detailContent = document.getElementById('detail-content');
  detailContent.innerHTML = '';
  
  // Show empty state
  const detailEmpty = document.createElement('div');
  detailEmpty.className = 'detail-empty';
  detailEmpty.textContent = 'Select a hero to view details';
  detailContent.appendChild(detailEmpty);
}
```

### 5. BattleModeManager (js/ui/teambuilder/BattleModeManager.js)

**Responsibilities:**
- Render battle mode options
- Handle battle mode selection
- Update start battle button state

**Properties to Extract:**
- `battleMode`

**Methods to Extract:**
- `renderBattleModes()`
- `updateStartBattleButton()`

**Interface with TeamBuilderUI:**
- Constructor accepts TeamBuilderUI reference
- Provides `getBattleMode()` method
- Notifies parent via `onBattleModeChanged(mode)`

**Key Code Blocks:**
```javascript
selectBattleMode(mode) {
  this.battleMode = mode;
  this.render();
  
  // Notify parent
  if (this.parentUI && typeof this.parentUI.onBattleModeChanged === 'function') {
    this.parentUI.onBattleModeChanged(mode);
  }
}
```

### 6. BattleInitiator (js/ui/teambuilder/BattleInitiator.js)

**Responsibilities:**
- Handle battle start logic
- Transition to battle UI
- Initialize battle manager with teams

**Methods to Extract:**
- `startBattle()`
- `startBattleWithDelay()`

**Interface with TeamBuilderUI:**
- Constructor accepts TeamBuilderUI reference and TeamManager
- Provides `initiateBattle(playerTeam, enemyTeam, battleMode)` method

**Key Code Blocks:**
```javascript
// Central method to start battle
initiateBattle(playerTeam, enemyTeam, battleMode) {
  // Validation logic
  if (playerTeam.length === 0) {
    alert('Please select at least one hero for your team!');
    // Play error sound
    if (window.soundManager) {
      window.soundManager.play('error');
    }
    return false;
  }
  
  // UI transition logic
  // ...
  
  // Battle initialization
  // ...
  
  return true;
}
```

## Shared Utility Functions

Methods used by multiple managers will be extracted into `TeamBuilderUtils.js`, with static methods for accessibility:

```javascript
// js/ui/teambuilder/TeamBuilderUtils.js
class TeamBuilderUtils {
  // Type handling methods
  static splitTypes(typeString) { /* ... */ }
  static renderMultiTypeSpans(typeString, container, typeColors) { /* ... */ }
  
  // UI helper methods
  static getOrdinalSuffix(n) { /* ... */ }
  
  // Validation helpers
  static validateParameter(param, name, defaultValue = null) {
    if (param === undefined || param === null) {
      console.warn(`[TeamBuilderUtils] Missing parameter: ${name}, using default`); 
      return defaultValue;
    }
    return param;
  }
  
  // Component availability check
  static checkComponentMethod(component, methodName) {
    return component && typeof component[methodName] === 'function';
  }
}

// Make utilities available globally for traditional scripts
if (typeof window !== 'undefined') {
  window.TeamBuilderUtils = TeamBuilderUtils;
  console.log("TeamBuilderUtils loaded and exported to window.TeamBuilderUtils");
}
```

These utilities will provide consistent patterns for validation, error handling, and common operations across all components.

## Refactored TeamBuilderUI.js

The refactored TeamBuilderUI becomes an orchestrator that:

1. Initializes all managers
2. Handles cross-manager communication
3. Loads initial data
4. Delegates rendering and user interactions

### Component Initialization with Validation

Each component will be initialized with validation to ensure it's properly constructed:

```javascript
// Initialize the Hero Detail Panel Manager
initializeHeroDetailManager() {
  try {
    if (!window.HeroDetailPanelManager) {
      console.error("HeroDetailPanelManager not found! Detail panel will not function.");
      return false;
    }
    
    this.heroDetailManager = new window.HeroDetailPanelManager(this);
    
    // Verify required methods exist
    const methodCheck = {
      renderDetails: typeof this.heroDetailManager.renderDetails === 'function',
      clearDetails: typeof this.heroDetailManager.clearDetails === 'function'
    };
    
    console.log(`HeroDetailPanelManager initialized with methods:`, methodCheck);
    
    if (!methodCheck.renderDetails || !methodCheck.clearDetails) {
      console.error("HeroDetailPanelManager missing required methods!");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing HeroDetailPanelManager:", error);
    return false;
  }
}
```

### Delegation Methods with Error Handling

Each delegation method will include proper error handling:

```javascript
// Delegate to HeroDetailPanelManager
renderHeroDetails() {
  if (this.heroDetailManager && typeof this.heroDetailManager.renderDetails === 'function') {
    return this.heroDetailManager.renderDetails(this.selectedHeroDetails);
  }
  
  console.error("Cannot render hero details - HeroDetailPanelManager not available");
  // Minimal fallback behavior
  const detailContent = document.getElementById('detail-content');
  if (detailContent) {
    detailContent.innerHTML = '<div class="detail-error">Error loading hero details</div>';
  }
}
```

### Progress Tracking Metrics

We'll maintain metrics throughout the refactoring:

```
Original TeamBuilderUI.js: ~2000 lines
Phase 2 complete: ~1650 lines (-350 lines)
Phase 3 complete: ~1450 lines (-200 lines)
...
Final size: ~400 lines (-1600 lines total)
```

```javascript
// Simplified structure for refactored TeamBuilderUI.js
class TeamBuilderUI {
  constructor(teamManager) {
    // Original properties
    this.teamManager = teamManager || null;
    this.availableHeroes = [];
    this.selectedHeroDetails = null;
    this.imageLoader = null;
    
    // Type and rarity color definitions remain here as shared resources
    this.typeColors = { /* ... */ };
    this.rarityColors = { /* ... */ };
    
    // Initialize managers
    this.filterManager = new FilterManager(this);
    this.heroGridManager = new HeroGridManager(this);
    this.teamSlotsManager = new TeamSlotsManager(this);
    this.heroDetailManager = new HeroDetailPanelManager(this);
    this.battleModeManager = new BattleModeManager(this);
    this.battleInitiator = new BattleInitiator(this, teamManager);
  }
  
  // Load data and initialize UI
  async initialize() {
    // Load hero data
    await this.loadHeroData();
    
    // Initialize image loader
    await this.initializeImageLoader();
    
    // Initialize all UI components
    this.filterManager.render();
    this.heroGridManager.render();
    this.teamSlotsManager.render();
    this.battleModeManager.render();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  // Event handlers that coordinate between managers
  onHeroSelected(hero) {
    this.selectedHeroDetails = hero;
    this.heroGridManager.updateSelectedHero(hero);
    this.heroDetailManager.renderDetails(hero);
    this.teamSlotsManager.setSelectedHero(hero);
  }
  
  onFiltersChanged(filters) {
    this.heroGridManager.updateGrid(filters);
  }
  
  onTeamSelectionChanged(isSelectingEnemy) {
    this.battleModeManager.updateStartButton(
      this.teamSlotsManager.getPlayerTeam(),
      this.teamSlotsManager.getEnemyTeam(),
      isSelectingEnemy
    );
  }
  
  onBattleModeChanged(mode) {
    this.teamSlotsManager.updateTeamDisplay(mode);
    this.battleModeManager.updateStartButton(
      this.teamSlotsManager.getPlayerTeam(),
      this.teamSlotsManager.getEnemyTeam(),
      this.teamSlotsManager.isSelectingEnemyTeam
    );
  }
  
  // Start battle event handler
  onStartBattleClicked() {
    const playerTeam = this.teamSlotsManager.getPlayerTeam();
    const enemyTeam = this.teamSlotsManager.getEnemyTeam();
    const battleMode = this.battleModeManager.getBattleMode();
    
    this.battleInitiator.initiateBattle(playerTeam, enemyTeam, battleMode);
  }
  
  // Remaining methods to load data and set up listeners
  // ...
}
```

## Implementation Guidelines

### Defensive Programming Patterns

All components must implement these defensive patterns:

1. **Parameter Validation**: Check all input parameters at the start of methods
   ```javascript
   if (!hero) {
     console.error("[ComponentName] Missing required hero parameter");
     return; // Early exit
   }
   ```

2. **Component Dependency Checks**: Verify component dependencies before use
   ```javascript
   if (!this.imageLoader) {
     console.warn("[ComponentName] ImageLoader not available, visual elements may be missing");
     // Graceful degradation...
   }
   ```

3. **Graceful Degradation**: Provide fallback behavior when components fail
   ```javascript
   renderSomething() {
     try {
       // Primary implementation...
     } catch (error) {
       console.error("[ComponentName] Error rendering:", error);
       // Display minimal fallback UI
     }
   }
   ```

4. **Error Isolation**: Use try/catch to prevent cascade failures
   ```javascript
   // Wrap critical operations in try/catch
   try {
     // Critical operation
   } catch (error) {
     console.error("[ComponentName] Operation failed:", error);
     // Recover or provide fallback
   }
   ```

### Component Structure Template

Each component should follow this structure:

```javascript
/**
 * ComponentName - ResponsibilityDescription
 */
class ComponentName {
  /**
   * Create a new ComponentName
   * @param {TeamBuilderUI} parentUI - Reference to the main TeamBuilderUI
   */
  constructor(parentUI) {
    this.parentUI = parentUI;
    
    // Validate parent
    if (!parentUI) {
      console.error("[ComponentName] parentUI is required");
      return;
    }
    
    // Required references from parent
    this.requiredProperty = parentUI.requiredProperty;
    
    // Component-specific properties
    this.internalState = null;
    
    console.log("[ComponentName] Initialized");
  }
  
  /**
   * Primary render method
   * @param {Object} data - Data needed for rendering
   */
  render(data) {
    // Parameter validation
    data = TeamBuilderUtils.validateParameter(data, 'data', {});
    
    try {
      // Implementation...
    } catch (error) {
      console.error("[ComponentName] Render error:", error);
      // Fallback rendering
    }
  }
  
  // Other public methods...
  
  /**
   * Clean up resources
   */
  destroy() {
    // Clean up any resources or event listeners
    console.log("[ComponentName] Destroyed");
  }
}

// Make component available globally
if (typeof window !== 'undefined') {
  window.ComponentName = ComponentName;
  console.log("ComponentName loaded and exported to window.ComponentName");
}
```

### Other Key Considerations

1. **Art Handling**: Each manager inherits the current art handling approach to ensure consistent behavior during refactoring.

2. **Event Communication**: Use callback functions for inter-manager communication with clear naming conventions.

3. **Shared Resources**: Type colors and rarity colors remain in TeamBuilderUI and are passed to components that need them.

4. **Testing Strategy**: Full user-flow testing after each component extraction and before removing original code.

5. **Documentation**: Complete JSDoc comments for all components, methods, and parameters.

6. **Line Count Metrics**: Track lines of code removed with each refactoring step to measure progress.
