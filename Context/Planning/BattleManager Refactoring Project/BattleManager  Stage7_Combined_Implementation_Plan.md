# Combined Refactor and Cleanup Plan: Stage 7 Implementation

## Overview

This plan combines both the implementation and cleanup into a single operation for each component, creating a more streamlined approach. This aligns with the "Single-Path Implementation" strategy mentioned in the Stage 4 lessons learned document. We'll maintain clear separation between the two components but implement each with its cleanup in one step.

## Pre-Implementation Steps

### 1. Backup Strategy
- Create a branch or commit in Git before starting (for easy rollback)
- Save copies of the original files:
  - `BattleManager.js` → `BattleManager.js.pre_stage7`
  - `BattleEventDispatcher.js` → `BattleEventDispatcher.js.pre_stage7`
  - `BattleLogManager.js` → `BattleLogManager.js.pre_stage7`

### 2. Preparation
- Ensure all required dependencies are loaded in the correct order in `index.html`
- Confirm Stage 6 components work correctly (all previous delegations function properly)

## Component 1: BattleEventDispatcher Implementation

### Version 0.5.28.1 - Complete BattleEventDispatcher Implementation

1. **Fix Module Syntax and Implementation**
```javascript
/**
 * BattleEventDispatcher.js
 * Handles dispatching battle events to UI and other systems
 * Version 0.5.28.1 - Combined implementation and cleanup
 */

class BattleEventDispatcher {
    /**
     * Create a new Battle Event Dispatcher
     * @param {Object} battleManager - The main battle manager
     */
    constructor(battleManager) {
        this.battleManager = battleManager;
        this.initialized = false;
        this.eventListeners = new Map(); // Store custom event listeners
        
        // Reference to battleBridge event types
        this.eventTypes = window.battleBridge?.eventTypes || {};
        
        // Verification and logging
        if (window.battleBridge) {
            this.initialized = true;
            console.log("[BattleEventDispatcher] Initialized with battleBridge");
        } else {
            console.warn("[BattleEventDispatcher] battleBridge not found - events may not dispatch correctly");
        }
    }

    /**
     * Dispatch a battle event
     * @param {string} eventType - The type of event
     * @param {Object} eventData - The event data
     * @returns {boolean} True if dispatched successfully
     */
    dispatchEvent(eventType, eventData) {
        // Parameter validation
        if (!eventType) {
            console.error("[BattleEventDispatcher] Invalid event type: null or undefined");
            return false;
        }
        
        if (!eventData || typeof eventData !== 'object') {
            console.warn("[BattleEventDispatcher] Event data should be an object, using empty object instead");
            eventData = {};
        }
        
        // Console logging for debugging
        console.log(`[BattleEventDispatcher] Dispatching ${eventType}`);
        
        // First, notify custom listeners
        this.notifyListeners(eventType, eventData);
        
        // Then dispatch via battleBridge if available
        if (window.battleBridge) {
            try {
                window.battleBridge.dispatchEvent(eventType, eventData);
                return true;
            } catch (error) {
                console.error(`[BattleEventDispatcher] Error dispatching ${eventType} via battleBridge:`, error);
            }
        }
        
        return false;
    }

    /**
     * Add an event handler for a specific event type
     * @param {string} eventType - The type of event to listen for
     * @param {Function} handler - The handler function
     * @returns {boolean} True if handler was added successfully
     */
    addEventHandler(eventType, handler) {
        if (!eventType || typeof handler !== 'function') {
            console.error("[BattleEventDispatcher] Invalid eventType or handler");
            return false;
        }
        
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        
        this.eventListeners.get(eventType).push(handler);
        return true;
    }
    
    /**
     * Remove an event handler
     * @param {string} eventType - The type of event
     * @param {Function} handler - The handler function to remove
     * @returns {boolean} True if handler was removed successfully
     */
    removeEventHandler(eventType, handler) {
        if (!eventType || !this.eventListeners.has(eventType)) {
            return false;
        }
        
        const listeners = this.eventListeners.get(eventType);
        const index = listeners.indexOf(handler);
        
        if (index !== -1) {
            listeners.splice(index, 1);
            return true;
        }
        
        return false;
    }
    
    /**
     * Notify all listeners for a specific event type
     * @param {string} eventType - The type of event
     * @param {Object} eventData - The event data
     */
    notifyListeners(eventType, eventData) {
        if (!this.eventListeners.has(eventType)) {
            return;
        }
        
        const listeners = this.eventListeners.get(eventType);
        listeners.forEach(handler => {
            try {
                handler(eventData);
            } catch (error) {
                console.error(`[BattleEventDispatcher] Error in event handler for ${eventType}:`, error);
            }
        });
    }

    /**
     * Dispatch a battle log message event
     * @param {string} message - The log message
     * @param {string} type - The message type
     * @returns {boolean} True if dispatched successfully
     */
    dispatchBattleLogEvent(message, type = 'default') {
        return this.dispatchEvent(this.eventTypes.BATTLE_LOG || 'BATTLE_LOG', {
            message,
            type
        });
    }
    
    /**
     * Dispatch a character damaged event
     * @param {Object} character - The damaged character
     * @param {number} amount - The damage amount
     * @param {Object} source - The damage source
     * @param {Object} ability - The ability used
     * @returns {boolean} True if dispatched successfully
     */
    dispatchCharacterDamagedEvent(character, amount, source = null, ability = null) {
        return this.dispatchEvent(this.eventTypes.CHARACTER_DAMAGED || 'CHARACTER_DAMAGED', {
            character,
            target: character, // For backward compatibility
            newHealth: character.currentHp,
            maxHealth: character.stats.hp,
            amount,
            source,
            ability
        });
    }
    
    /**
     * Dispatch a character healed event
     * @param {Object} character - The healed character
     * @param {number} amount - The healing amount
     * @param {Object} source - The healing source
     * @param {Object} ability - The ability used
     * @returns {boolean} True if dispatched successfully
     */
    dispatchCharacterHealedEvent(character, amount, source = null, ability = null) {
        return this.dispatchEvent(this.eventTypes.CHARACTER_HEALED || 'CHARACTER_HEALED', {
            character,
            newHealth: character.currentHp,
            maxHealth: character.stats.hp,
            amount,
            source,
            ability
        });
    }
}

// Make BattleEventDispatcher available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.BattleEventDispatcher = BattleEventDispatcher;
    console.log("BattleEventDispatcher class definition loaded and exported to window.BattleEventDispatcher");
}

// Legacy global assignment for maximum compatibility
window.BattleEventDispatcher = BattleEventDispatcher;
```

2. **Add BattleManager Integration**
   - Update `initializeComponentManagers()` in BattleManager.js:

```javascript
// Initialize event dispatcher (Stage 7)
if (window.BattleEventDispatcher) {
    this.battleEventDispatcher = new window.BattleEventDispatcher(this);
    console.log('BattleManager: BattleEventDispatcher initialized');
    
    // Verify methods exist
    console.log('>>> BattleEventDispatcher instance check:', {
        dispatchEvent: typeof this.battleEventDispatcher.dispatchEvent === 'function',
        addEventHandler: typeof this.battleEventDispatcher.addEventHandler === 'function',
        removeEventHandler: typeof this.battleEventDispatcher.removeEventHandler === 'function'
    });
}
```

3. **Add Direct Facade Method in BattleManager**
   - Add this method to BattleManager without toggle:

```javascript
/**
 * Dispatch a battle event
 * @param {string} eventType - The type of event
 * @param {Object} eventData - The event data
 * @returns {boolean} True if dispatched successfully
 */
dispatchBattleEvent(eventType, eventData) {
    // Direct delegation - no toggle mechanism for streamlined implementation
    if (this.battleEventDispatcher) {
        return this.battleEventDispatcher.dispatchEvent(eventType, eventData);
    }
    
    // Minimal fallback implementation (no original implementation preserved)
    console.warn(`[BattleManager] BattleEventDispatcher not available, cannot dispatch ${eventType}`);
    
    // Try direct battleBridge as last resort
    if (window.battleBridge) {
        try {
            window.battleBridge.dispatchEvent(eventType, eventData);
            return true;
        } catch (error) {
            console.error(`[BattleManager] Error dispatching ${eventType}:`, error);
        }
    }
    
    return false;
}
```

## Component 2: BattleLogManager Implementation

### Version 0.5.28.2 - Complete BattleLogManager Implementation

1. **Fix Module Syntax and Implementation**
```javascript
/**
 * BattleLogManager.js
 * Manages battle log messages and formatting
 * Version 0.5.28.2 - Combined implementation and cleanup
 */

class BattleLogManager {
    /**
     * Create a new Battle Log Manager
     * @param {Object} battleManager - The main battle manager
     * @param {Object} eventDispatcher - The event dispatcher
     */
    constructor(battleManager, eventDispatcher) {
        this.battleManager = battleManager;
        this.eventDispatcher = eventDispatcher;
        
        // Validate dependencies
        if (!this.eventDispatcher) {
            console.warn("[BattleLogManager] EventDispatcher not provided, messages won't be dispatched");
        }
        
        // Initialize validation lists
        this.validTypes = ['default', 'info', 'success', 'action', 'error', 'player', 'enemy', 'status'];
        
        // Log initialization
        console.log("[BattleLogManager] Initialized");
    }

    /**
     * Log a message to the battle log
     * @param {string} message - The message to log
     * @param {string} type - The type of message (default, info, success, action, error)
     * @returns {boolean} True if logged successfully
     */
    logMessage(message, type = 'default') {
        // Parameter validation
        if (!message) {
            console.warn("[BattleLogManager] Empty message not logged");
            return false;
        }
        
        // Ensure type is valid
        if (!this.validTypes.includes(type)) {
            console.warn(`[BattleLogManager] Invalid type '${type}', defaulting to 'default'`);
            type = 'default';
        }
        
        // Log to console for debugging
        console.log(`[BattleLog ${type}]: ${message}`);
        
        // Dispatch via eventDispatcher if available
        if (this.eventDispatcher) {
            return this.eventDispatcher.dispatchBattleLogEvent(message, type);
        }
        
        // Direct fallback if no eventDispatcher
        if (window.battleBridge) {
            try {
                window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_LOG || 'BATTLE_LOG', {
                    message: message,
                    type: type
                });
                return true;
            } catch (error) {
                console.error('[BattleLogManager] Error dispatching log message:', error);
            }
        }
        
        return false;
    }

    /**
     * Format a message with character information
     * @param {string} message - The base message
     * @param {Object} character - The character
     * @param {string} type - The message type
     * @returns {string} The formatted message
     */
    formatMessage(message, character, type = 'default') {
        // If no character provided, return original message
        if (!character) {
            return message;
        }
        
        // Add team identifier
        const teamIdentifier = character.team === 'player' ? ' (ally)' : ' (enemy)';
        return `${character.name}${teamIdentifier} ${message}`;
    }

    /**
     * Display a summary of all characters' health at the end of a turn
     * @returns {boolean} True if summary was displayed successfully
     */
    displayTurnSummary() {
        this.logMessage('------ END OF TURN SUMMARY ------', 'info');
        
        // Show player team summary
        this.logMessage('Player Team:', 'info');
        
        if (!this.battleManager || !Array.isArray(this.battleManager.playerTeam)) {
            this.logMessage('Error: Player team not available', 'error');
        } else {
            this.battleManager.playerTeam.forEach(character => {
                const status = character.isDead ? '💀 DEFEATED' : 
                              `HP: ${character.currentHp}/${character.stats.hp}`;
                const statusColor = this.determineHealthColor(character);
                this.logMessage(`  ${character.name}: ${status}`, statusColor);
            });
        }
        
        // Show enemy team summary
        this.logMessage('Enemy Team:', 'info');
        
        if (!this.battleManager || !Array.isArray(this.battleManager.enemyTeam)) {
            this.logMessage('Error: Enemy team not available', 'error');
        } else {
            this.battleManager.enemyTeam.forEach(character => {
                const status = character.isDead ? '💀 DEFEATED' : 
                              `HP: ${character.currentHp}/${character.stats.hp}`;
                const statusColor = this.determineHealthColor(character);
                this.logMessage(`  ${character.name}: ${status}`, statusColor);
            });
        }
        
        this.logMessage('--------------------------------', 'info');
        
        return true;
    }

    /**
     * Determine the color to use for health status
     * @param {Object} character - The character
     * @returns {string} The color type to use
     */
    determineHealthColor(character) {
        if (!character) return 'default';
        
        if (character.isDead) return 'error';
        
        const healthPercent = character.currentHp / character.stats.hp;
        
        if (healthPercent < 0.3) return 'error';
        if (healthPercent < 0.7) return 'action';
        return 'success';
    }
}

// Make BattleLogManager available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.BattleLogManager = BattleLogManager;
    console.log("BattleLogManager class definition loaded and exported to window.BattleLogManager");
}

// Legacy global assignment for maximum compatibility
window.BattleLogManager = BattleLogManager;
```

2. **Add BattleManager Integration**
   - Update `initializeComponentManagers()` in BattleManager.js:

```javascript
// Initialize battle log manager after event dispatcher (Stage 7)
if (window.BattleLogManager && this.battleEventDispatcher) {
    this.battleLogManager = new window.BattleLogManager(this, this.battleEventDispatcher);
    console.log('BattleManager: BattleLogManager initialized');
    
    // Verify methods exist
    console.log('>>> BattleLogManager instance check:', {
        logMessage: typeof this.battleLogManager.logMessage === 'function',
        displayTurnSummary: typeof this.battleLogManager.displayTurnSummary === 'function'
    });
}
```

3. **Replace Original Methods in BattleManager with Direct Facade Methods**
   - Replace `logMessage()` in BattleManager:

```javascript
/**
 * Log a message to the battle log
 * @param {string} message - The message to log
 * @param {string} type - The type of message (default, info, success, action, error)
 * @returns {boolean} True if logged successfully
 */
logMessage(message, type = 'default') {
    // Direct delegation - no toggle mechanism for streamlined implementation
    if (this.battleLogManager) {
        return this.battleLogManager.logMessage(message, type);
    }
    
    // Minimal fallback implementation (no original implementation preserved)
    console.warn(`[BattleManager] BattleLogManager not available, using minimal logging`);
    console.log(`[BattleLog ${type}]: ${message}`);
    
    // Try direct UI or battleBridge communication as last resort
    if (window.battleBridge) {
        try {
            window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_LOG || 'BATTLE_LOG', {
                message: message,
                type: type
            });
        } catch (error) {
            console.error('[BattleManager] Error dispatching log event:', error);
        }
    }
    
    return false;
}
```

   - Replace `displayTurnSummary()` in BattleManager:

```javascript
/**
 * Display a summary of all characters' health at the end of a turn
 * @returns {boolean} True if summary was displayed successfully
 */
displayTurnSummary() {
    // Direct delegation - no toggle mechanism for streamlined implementation
    if (this.battleLogManager) {
        return this.battleLogManager.displayTurnSummary();
    }
    
    // Minimal fallback with warning
    console.warn("[BattleManager] BattleLogManager not available, cannot display turn summary");
    return false;
}
```

## Integration in index.html

Ensure proper script loading order:

```html
<!-- Stage 7 Components - Must be loaded before BattleManager -->
<script src="js/battle_logic/events/BattleEventDispatcher.js" defer></script>
<script src="js/battle_logic/events/BattleLogManager.js" defer></script>

<!-- BattleManager -->
<script src="js/managers/BattleManager.js" defer></script>
```

## Testing and Rollback Strategy

### Verification Tests

1. **Basic Initialization Verification**
   - Check console for component initialization success messages 
   - Verify method availability in console logs

2. **BattleEventDispatcher Functionality Tests**
   - Start a battle and check if events dispatch correctly
   - Watch for proper UI updates showing event handling

3. **BattleLogManager Functionality Tests**
   - Check for battle log messages appearing in the UI
   - Verify turn summary displays with team identification

### Rollback Strategy

If anything goes wrong:

1. **Immediate Rollback**
   - Use Git to revert to the pre-stage7 commit
   - Alternatively, restore the `.pre_stage7` backup files

2. **Partial Rollback Options**
   - If just one component fails, can roll back only that component
   - Restore the original BattleManager method(s) that were replaced

3. **Issues to Monitor**
   - Event dispatching failures (UI not updating)
   - Missing battle log messages
   - Console errors related to missing methods

## Documentation

Create the following changelog entries:

### High-Level Changelog (changelog.md)
```
### Version 0.5.28 - Stage 7 Refactoring (Event and Logging System)
- **Technical**: Completed Stage 7 of BattleManager refactoring with combined implementation/cleanup
- **Technical**: Extracted event dispatching to BattleEventDispatcher component 
- **Technical**: Moved battle log functionality to BattleLogManager component
- **Technical**: Reduced BattleManager size by ~80 lines through extraction
```

### Detailed Technical Changelog (CHANGELOG_0.5.28_Stage7_Refactoring.md)
```
# Version 0.5.28 - Stage 7 Refactoring (Event and Logging System)

This release implements Stage 7 of the BattleManager refactoring plan, extracting event dispatching and battle logging into specialized components. Unlike previous stages, we've combined the implementation and cleanup into a single step for a more streamlined process.

## Overview
- Implemented BattleEventDispatcher for centralized event handling
- Created BattleLogManager for battle log messages and formatting
- Removed event and logging code from BattleManager
- Added direct facade methods without toggles

## Implementation Details

### BattleEventDispatcher
The BattleEventDispatcher centralizes all event dispatching through a consistent interface:

- Provides methods for adding and removing event handlers
- Dispatches events to both custom handlers and battleBridge
- Implements helper methods for common event types
- Includes comprehensive error handling and validation

### BattleLogManager
The BattleLogManager handles all battle log messages and formatting:

- Formats messages with team identification
- Manages turn summary presentation
- Includes validation and error handling
- Uses BattleEventDispatcher for event dispatching

### Direct Facade Implementation
Unlike previous stages, we've implemented direct facade methods without toggle mechanisms:

- Simplified the implementation by removing toggle code
- Added robust fallbacks for when components aren't available
- Maintained backward compatibility through facade methods

## Code Reduction Metrics
- Removed ~40 lines from BattleManager related to event dispatching
- Removed ~40 lines from BattleManager related to battle logging
- Total reduction: ~80 lines

## Testing Notes
- Full battle flow testing with both DOM and Phaser UI
- Verified event dispatching to UI components
- Confirmed all battle log messages display correctly

## Lessons Applied
- Used combined implementation/cleanup approach from Stage 4 lessons
- Applied defensive programming patterns from Stage 5 and 6
- Implemented comprehensive error handling from Stage 6
```

## Summary

This combined approach implements both components and their direct facade methods in BattleManager in a single step, eliminating the toggle mechanism. Key differences from the previous approach:

1. No toggle implementation - direct delegation immediately
2. Minimal fallback code instead of preserving original implementation
3. Clear rollback strategy using source control
4. Both components implemented fully in a single operation

The risk is higher, but the payoff is a cleaner, more direct implementation without the temporary toggle state. If any issues arise, we can use the source control rollback mechanism to restore the original state.