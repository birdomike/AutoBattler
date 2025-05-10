# Gameplan: Removing DOM-Based Battle System

## Phase 1: Preparation

### 1. Create Backup
```bash
# First, create a backup of the entire project
cp -r C:\Personal\AutoBattler C:\Personal\AutoBattler_Backup
```

### 2. Add Improved Phaser Error Handling
Edit `js/ui/TeamBuilderUIUpdates.js`:
- Modify `startBattleWithPhaser()` to replace DOM fallback with improved error messages
- Goal: Ensure players receive useful feedback when Phaser fails instead of silently failing

## Phase 2: Remove DOM Battle UI Files

### 1. Remove Direct Dependencies - Files to Delete
- `js/ui/BattleUI.js` - Primary DOM battle UI implementation
- `js/ui/BattleUIDebug.js` - Debug utilities for DOM battle UI

### 2. Update HTML Dependencies
Edit `index.html` to remove:
```html
<script src="js/ui/BattleUI.js" defer></script>
<script src="js/ui/BattleUIDebug.js" defer></script>
```

## Phase 3: Clean TeamBuilderUIUpdates.js

Edit `js/ui/TeamBuilderUIUpdates.js`:

1. Remove Fallback Implementation
```javascript
// Delete the entire method
TeamBuilderUI.prototype.startBattleWithOriginalUI = function(team, battleMode) {...}
```

2. Replace Fallback References:
```javascript
// Replace fallback code:
if (!window.isPhaserReady || !window.isPhaserReady()) {
    console.error('Phaser game or scene manager not ready, falling back to original battle UI');
    // REMOVE THIS BLOCK:
    if (!this._fallingBack) {
        this._fallingBack = true;
        this.startBattleWithOriginalUI(team, battleMode);
        setTimeout(() => { this._fallingBack = false; }, 500);
    }
    return;
}

// WITH:
if (!window.isPhaserReady || !window.isPhaserReady()) {
    console.error('Phaser game or scene manager not ready');
    alert('Battle system could not be initialized. Please refresh your browser and try again.');
    // Show the team builder UI again
    const teamBuilderContainer = document.getElementById('team-builder-container');
    if (teamBuilderContainer) teamBuilderContainer.style.display = 'block';
    // Hide game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) gameContainer.style.display = 'none';
    return;
}
```

3. Remove Checking for Original Method
```javascript
// Delete this entire block:
// Ensure startBattleOriginal actually exists before trying to assign it
if (typeof TeamBuilderUI.prototype.startBattle === 'function') {
     TeamBuilderUI.prototype.startBattleOriginal = TeamBuilderUI.prototype.startBattle;
} else {
     console.error("Original TeamBuilderUI.prototype.startBattle not found for backup!");
     TeamBuilderUI.prototype.startBattleOriginal = function() { console.error("startBattleOriginal fallback called - original missing!"); };
}
```

4. Update startBattle Method
```javascript
// Replace conditional block with always-Phaser approach:
TeamBuilderUI.prototype.startBattle = async function() {
    // For Custom Battle mode, we need to switch to enemy team selection if not done yet
    if (this.battleMode === 'custom' && !this.isSelectingEnemyTeam) {
        // [Keep all existing custom battle mode handling]
        return;
    }

    // Get the selected team
    const team = this.selectedHeroes.filter(hero => hero !== null);
    
    // Start battle with Phaser (no fallback condition)
    await this.startBattleWithPhaser(team, this.battleMode);
};
```

## Phase 4: Clean BattleManager.js

Edit `js/managers/BattleManager.js`:

1. Remove uiMode Toggle
```javascript
// In the constructor, replace:
this.uiMode = "dom"; // UI mode: "dom" or "phaser"

// With:
this.uiMode = "phaser"; // Only support Phaser UI mode now
```

2. Simplify All Methods with DOM-Specific Branches
- `logMessage` method - Remove DOM-specific branch
- `displayBattleLog` method - Remove DOM-specific branch
- Any other methods containing `if (this.uiMode === "dom")` blocks

3. Remove Reference to this.battleUI
```javascript
// In constructor:
this.battleUI = null; // Remove or repurpose this property
```

4. Clean Up initialize() Method
```javascript
// Remove any code that initializes DOM-based UI:
async initialize() {
    // Keep all component initialization code
    // Remove any reference to BattleUI initialization
    
    // Keep behavior system initialization
    
    console.log('BattleManager: Initialized');
}
```

## Phase 5: Clean BattleBridge.js

Edit `js/phaser/bridge/BattleBridge.js`:

1. Remove UI Mode Conditionals
```javascript
// Replace all code like this:
if (this.uiMode === "phaser") {
    self.dispatchEvent(self.eventTypes.STATUS_EFFECT_APPLIED, {
        // event data
    });
}

// With direct dispatch:
self.dispatchEvent(self.eventTypes.STATUS_EFFECT_APPLIED, {
    // event data
});
```

2. Update patchBattleManager Method
```javascript
// Remove any DOM-specific conditionals in patched methods
// Ensure all events are dispatched unconditionally
```

3. Remove DOM-Specific Safety Checks
```javascript
// Remove checks that only apply to DOM mode
```

## Phase 6: Clean Remaining Files

### 1. DirectImageLoader.js
Evaluate if this utility can be removed completely. If it's still needed by TeamBuilder:
- Remove the automatic DOM modification behavior for battle UI
- Add comment indicating it's only for TeamBuilder UI

```javascript
// In injectCharacterImages:
injectCharacterImages: function() {
    // Check if we're in a battle screen
    const battleUI = document.getElementById('battle-ui');
    if (!battleUI) return; // This check will now immediately return
    
    // Rest of function won't execute during battle
}
```

### 2. game.js

```javascript
// Replace:
function checkBattleUI() {
    if (typeof window.BattleUI === 'undefined') {
        console.warn('BattleUI (DOM version) not defined when game.js loads! This might be ok if only using Phaser.');
    } else {
        console.log('BattleUI (DOM version) is defined and available!');
    }
}

// With:
function checkBattleUI() {
    // BattleUI (DOM version) has been removed - Phaser UI is now the only option
    console.log('Using Phaser-based battle visualization exclusively');
}
```

### 3. BattleEventManager and Event Handlers
- Review `js/phaser/core/BattleEventManager.js` for any DOM-specific fallbacks
- Ensure all event handlers connect only to Phaser components

## Phase 7: Status Effect Handling

Review and clean up:
- `js/battle_logic/status/StatusEffectManager.js` - May contain DOM-specific references for status display
- `js/battle_logic/events/BattleEventDispatcher.js` - May have conditional event dispatching

## Phase 8: Testing Plan

1. Test Each Core Feature After Removal:
   - Team selection
   - Battle initiation
   - Auto-attacks and abilities
   - Status effects
   - Damage/healing display
   - Turn progression
   - Battle outcome

2. Test Edge Cases:
   - Verify error handling works when Phaser fails to initialize
   - Test with various team compositions
   - Test multiple consecutive battles

3. Test Performance:
   - Measure any performance improvements 
   - Check for memory leaks 

## Implementation Workflow

Follow this order for maximum safety:

1. Make backup of codebase
2. Implement improved error handling in TeamBuilderUIUpdates.js
3. Remove DOM UI script tags from index.html but keep files
4. Update TeamBuilderUIUpdates.js to remove fallback
5. Clean all DOM-specific branches from BattleManager.js
6. Clean all conditional dispatching from BattleBridge.js
7. Update any remaining files with DOM-specific code
8. Test thoroughly after each significant change
9. Only after successful testing, delete the actual DOM UI files

## Files to Keep

- `js/utilities/TeamBuilderImageLoader.js` - Keep (used by TeamBuilder UI)
- `js/utilities/DirectImageLoader.js` - Keep but modify (still used by TeamBuilder)
- `js/ui/SoundManager.js` - Keep (used by both UIs)
- `js/ui/TooltipManager.js` - Keep (used by both UIs)

## Potential Issues to Watch For

1. TeamBuilder UI still needing SoundManager or DirectImageLoader
2. Unexpected dependencies on DOM-based battle UI in Phaser components
3. Error handling for Phaser initialization failures
4. Global references that might be undefined after DOM UI removal

By following this detailed gameplan, you'll be able to safely remove the DOM-based battle system while maintaining the full functionality of your Phaser-based implementation, resulting in a cleaner, more maintainable codebase.
