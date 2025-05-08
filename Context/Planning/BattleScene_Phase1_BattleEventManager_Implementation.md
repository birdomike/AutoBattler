# Revised Technical Gameplan: BattleEventManager Implementation

## 1. Code to Remove from BattleScene.js

The following methods will be completely removed from BattleScene.js and relocated to BattleEventManager:

```javascript
// Event Setup Methods (~80-90 lines)
setupCoreEventListeners()
setupStatusEffectListeners() 
setupHealthUpdateListeners()
setupActionIndicatorListeners()

// Event Handler Methods (~130-140 lines)
handleTurnStarted(eventData)
handleStatusEffectApplied(data)
handleStatusEffectRemoved(data)
handleStatusEffectUpdated(data)
onCharacterDamaged(data)
onCharacterHealed(data)
onCharacterAction(data)
onAbilityUsed(data)
```

**Total Lines to Remove from BattleScene.js: ~210-230 lines**

## 2. Component Design

### 2.1 Interface Definition
```javascript
class BattleEventManager {
    constructor(scene, battleBridge) {...}
    initialize() {...}
    
    // Event Setup Methods (moved from BattleScene)
    setupCoreEventListeners() {...}
    setupStatusEffectListeners() {...}
    setupHealthUpdateListeners() {...}
    setupActionIndicatorListeners() {...}
    
    // Event Handler Methods (moved from BattleScene)
    handleTurnStarted(data) {...}
    handleStatusEffectApplied(data) {...}
    handleStatusEffectRemoved(data) {...}
    handleStatusEffectUpdated(data) {...}
    onCharacterDamaged(data) {...}
    onCharacterHealed(data) {...}
    onCharacterAction(data) {...}
    onAbilityUsed(data) {...}
    
    // Lifecycle Methods
    cleanup() {...}
    destroy() {...}
}
```

### 2.2 Dependency Map
```
BattleEventManager → BattleBridge (for event listening)
BattleEventManager → BattleScene (for delegate methods)
```

## 3. Implementation Steps

### 3.1 Create New Component File
Create `C:\Personal\AutoBattler\js\phaser\core\BattleEventManager.js` with:
- Constructor with validation
- Global registration pattern
- Event setup and handler methods (copied from BattleScene)
- Proper cleanup/destroy methods
- Defensive implementation patterns

### 3.2 Update BattleScene.js
- Add initialization of BattleEventManager in `create()`
- Remove all extracted methods
- Add destruction in `shutdown()`
- Minor code to connect component

### 3.3 HTML Updates
Add script tag to ensure the component loads in the correct order:
```html
<!-- After BattleBridge but before BattleScene -->
<script src="js/phaser/bridge/BattleBridge.js" defer></script>
<script src="js/phaser/core/BattleEventManager.js" defer></script>
<script src="js/phaser/scenes/BattleScene.js" defer></script>
```

## 4. Key Implementation Details

### 4.1 Method Binding for Event Handlers
```javascript
// In initialize() method:
// Bind all event handlers to preserve 'this' context
this.handleTurnStarted = this.handleTurnStarted.bind(this);
this.onCharacterDamaged = this.onCharacterDamaged.bind(this);
this.onCharacterHealed = this.onCharacterHealed.bind(this);
// ... bind other handlers
```

### 4.2 Event Registration with Bound Methods
```javascript
// In setupCoreEventListeners():
this.battleBridge.addEventListener(
    this.battleBridge.eventTypes.TURN_STARTED, 
    this.handleTurnStarted
);
```

### 4.3 Scene Integration in BattleScene.js
```javascript
// In BattleScene.create():
// Initialize battle event manager
if (this.battleBridge) {
    this.eventManager = new BattleEventManager(this, this.battleBridge);
}
```

### 4.4 Proper Cleanup in BattleScene.js
```javascript
// In BattleScene.shutdown():
if (this.eventManager) {
    this.eventManager.destroy();
    this.eventManager = null;
}
```

## 5. Core Method Implementation

### 5.1 Constructor with Validation
```javascript
constructor(scene, battleBridge) {
    // Validate dependencies
    if (!scene) {
        console.error("[BattleEventManager] Missing required scene reference");
        return;
    }
    
    if (!battleBridge) {
        console.error("[BattleEventManager] Missing required battleBridge reference");
        return;
    }
    
    this.scene = scene;
    this.battleBridge = battleBridge;
    this.boundHandlers = new Map(); // For tracking bound handlers
    
    console.log("[BattleEventManager] Initializing...");
    this.initialize();
}
```

### 5.2 Proper Event Listening Cleanup
```javascript
cleanup() {
    console.log("[BattleEventManager] Cleaning up event listeners");
    
    // Remove all registered event listeners
    if (this.battleBridge) {
        // Remove all listeners using the bound handlers we stored
        for (const [eventType, handler] of this.boundHandlers.entries()) {
            this.battleBridge.removeEventListener(eventType, handler);
        }
    }
    
    // Clear tracking map
    this.boundHandlers.clear();
    
    console.log("[BattleEventManager] Event listeners cleaned up");
}
```

## 6. Success Criteria

1. **Code Reduction**: 
   - BattleScene.js reduced by ~210-230 lines
   - All event setup and handler methods removed
   - BattleScene no longer directly interacts with battleBridge events

2. **Functionality Preservation**:
   - All battle events (damage, healing, turns, etc.) continue to work exactly as before
   - No visual or behavioral changes to the game
   - No new console errors

3. **Code Organization**:
   - Event handling logic centralized in dedicated component
   - BattleScene focused on scene lifecycle and visual management
   - Clear component boundaries established

## 7. Test Points

1. Start a battle and verify:
   - Turn indicator updates properly
   - Character actions display correctly
   - Health updates show properly
   - Status effects appear/disappear correctly
   - Floating damage text appears as expected

2. Check console for expected diagnostics:
   - BattleEventManager initialization logs
   - Event registration confirmations
   - No unexpected errors

3. End battle and verify:
   - No memory leaks (event listeners properly removed)
   - Clean return to team builder

This implementation follows the successful refactoring patterns established in previous components, maintaining the same defensive programming approach while extracting a significant portion of code from BattleScene.js.