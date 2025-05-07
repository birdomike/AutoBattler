# BattleEventDispatcher Implementation Plan

## Overview

The BattleEventDispatcher will serve as a centralized event bus for the battle system, replacing direct calls to `window.battleBridge.dispatchEvent()` with a more structured, reliable approach. This component will standardize event dispatching, add validation, improve error handling, and provide convenience methods for common event types.

## Component Objectives

1. **Event Standardization**: Use consistent property naming and event structure
2. **Enhanced Validation**: Verify events have required properties before dispatch
3. **Improved Error Handling**: Robust error catching and reporting
4. **Custom Event Support**: Allow component-specific event listeners
5. **Backward Compatibility**: Maintain support for existing event consumers
6. **Fallback Mechanism**: Graceful degradation when dependencies are missing
7. **Specialized Helper Methods**: Convenience methods for common event types

## Core Class Definition

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
        this.eventTypes = window.battleBridge?.eventTypes || this.getDefaultEventTypes();
        
        // Verify battleBridge availability
        if (window.battleBridge) {
            this.initialized = true;
            console.log("[BattleEventDispatcher] Initialized with battleBridge");
        } else {
            console.warn("[BattleEventDispatcher] battleBridge not found - events may not dispatch correctly");
        }
    }

    /**
     * Get default event types if battleBridge is not available
     * @returns {Object} Default event type constants
     */
    getDefaultEventTypes() {
        return {
            BATTLE_INITIALIZED: 'battle_initialized',
            BATTLE_STARTED: 'battle_started',
            BATTLE_ENDED: 'battle_ended',
            TURN_STARTED: 'turn_started',
            TURN_ENDED: 'turn_ended',
            CHARACTER_ACTION: 'character_action',
            CHARACTER_DAMAGED: 'character_damaged',
            CHARACTER_HEALED: 'character_healed',
            CHARACTER_DEFEATED: 'character_defeated',
            STATUS_EFFECT_APPLIED: 'status_effect_applied',
            STATUS_EFFECT_REMOVED: 'status_effect_removed',
            STATUS_EFFECT_UPDATED: 'status_effect_updated',
            STATUS_EFFECTS_CHANGED: 'status_effects_changed',
            ABILITY_USED: 'ability_used',
            PASSIVE_TRIGGERED: 'passive_triggered',
            BATTLE_UI_INTERACTION: 'battle_ui_interaction',
            BATTLE_LOG: 'battle_log'
        };
    }

    // Core event methods here...
}
```

## Core Method Definitions

### 1. Core Event Dispatching

```javascript
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
```

### 2. Specialized Event Methods

```javascript
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
 * @param {Object} target - The damaged character
 * @param {number} amount - The damage amount
 * @param {Object} source - The damage source
 * @param {Object} ability - The ability used
 * @returns {boolean} True if dispatched successfully
 */
dispatchCharacterDamagedEvent(target, amount, source = null, ability = null) {
    // Validate parameters
    if (!target) {
        console.error("[BattleEventDispatcher] Cannot dispatch CHARACTER_DAMAGED: target is missing");
        return false;
    }
    
    if (typeof amount !== 'number' || isNaN(amount)) {
        console.warn("[BattleEventDispatcher] Invalid damage amount:", amount);
        amount = 0;
    }
    
    // Create a standardized event with both property naming patterns
    return this.dispatchEvent(this.eventTypes.CHARACTER_DAMAGED || 'CHARACTER_DAMAGED', {
        character: target, // Primary standardized property
        target: target,    // Backward compatibility
        newHealth: target.currentHp,
        maxHealth: target.stats?.hp || 100,
        amount,
        source,
        ability
    });
}

/**
 * Dispatch a character healed event
 * @param {Object} target - The healed character
 * @param {number} amount - The healing amount
 * @param {Object} source - The healing source
 * @param {Object} ability - The ability used
 * @returns {boolean} True if dispatched successfully
 */
dispatchCharacterHealedEvent(target, amount, source = null, ability = null) {
    // Validate parameters
    if (!target) {
        console.error("[BattleEventDispatcher] Cannot dispatch CHARACTER_HEALED: target is missing");
        return false;
    }
    
    if (typeof amount !== 'number' || isNaN(amount)) {
        console.warn("[BattleEventDispatcher] Invalid healing amount:", amount);
        amount = 0;
    }
    
    // Create a standardized event with both property naming patterns
    return this.dispatchEvent(this.eventTypes.CHARACTER_HEALED || 'CHARACTER_HEALED', {
        character: target, // Primary standardized property
        target: target,    // Backward compatibility
        newHealth: target.currentHp,
        maxHealth: target.stats?.hp || 100,
        amount,
        source,
        ability
    });
}

/**
 * Dispatch a character action event
 * @param {Object} character - The acting character
 * @param {Object} action - The action data
 * @returns {boolean} True if dispatched successfully
 */
dispatchCharacterActionEvent(character, action) {
    // Validate parameters
    if (!character) {
        console.error("[BattleEventDispatcher] Cannot dispatch CHARACTER_ACTION: character is missing");
        return false;
    }
    
    if (!action) {
        console.warn("[BattleEventDispatcher] Invalid action data, using empty object");
        action = {};
    }
    
    // Create event data
    return this.dispatchEvent(this.eventTypes.CHARACTER_ACTION || 'CHARACTER_ACTION', {
        character,
        action
    });
}

// Additional specialized methods for STATUS_EFFECT, ABILITY_USED, etc.
```

## Integration with BattleManager

```javascript
// In BattleManager.js - initializeComponentManagers method

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

## BattleManager Facade Method

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

## Helper Methods for Common Events

```javascript
/**
 * Dispatch an event when a character takes damage
 * @param {Object} target - The character taking damage
 * @param {number} amount - Amount of damage
 * @param {Object|null} source - Source of the damage (character or null)
 * @param {Object|null} ability - Ability that caused damage (or null)
 * @returns {boolean} - Success status
 */
dispatchDamageEvent(target, amount, source = null, ability = null) {
    // Direct delegation - no toggle mechanism
    if (this.battleEventDispatcher) {
        return this.battleEventDispatcher.dispatchCharacterDamagedEvent(target, amount, source, ability);
    }
    
    // Minimal fallback
    console.warn(`[BattleManager] BattleEventDispatcher not available, cannot dispatch damage event`);
    
    // Try direct battleBridge as last resort
    if (window.battleBridge) {
        try {
            window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.CHARACTER_DAMAGED, {
                character: target,
                target: target,
                amount: amount,
                source: source,
                ability: ability,
                newHealth: target.currentHp,
                maxHealth: target.stats.hp
            });
            return true;
        } catch (error) {
            console.error(`[BattleManager] Error dispatching damage event:`, error);
        }
    }
    
    return false;
}

// Similar helper methods for healing, actions, etc.
```

## Implementation Approach

### Phase 1: Core Implementation

1. **Create Component File**:
   - Create `js/battle_logic/events/BattleEventDispatcher.js`
   - Implement the core class with constructor and basic validation
   - Add global window exports for compatibility

2. **Implement Core Methods**:
   - `dispatchEvent` - Main event dispatch method
   - `addEventHandler` - Custom event listener registration
   - `removeEventHandler` - Custom event listener removal
   - `notifyListeners` - Custom event notification

3. **Add Helper Methods**:
   - Implement specialized event dispatch methods for common events
   - Include validation and error handling for each

**Testing/Validation After Phase 1:**
- The game should remain 100% operable with no errors
- Component exists but isn't integrated with BattleManager yet
- **Required Test**: Run a basic smoke test by starting the game and running a battle
- **Validation Method**: Verify no errors appear in console related to the new file
- **Success Criteria**: Game functions exactly as before, no console errors related to the new component

### Phase 2: BattleManager Integration

1. **Add Component Initialization**:
   - Update `BattleManager.initializeComponentManagers()` to initialize BattleEventDispatcher
   - Add verification of core methods

2. **Create Facade Method**:
   - Implement `BattleManager.dispatchBattleEvent()` facade method
   - Include robust fallback for when component isn't available

3. **Add Script Tags**:
   - Update `index.html` to include the new component file
   - Ensure proper loading order (before BattleManager)

**Testing/Validation After Phase 2:**
- **This is the critical integration point** - the game MUST remain fully operable
- Component now receives events through BattleManager facade methods
- **Required Tests**:
  1. Complete battle sequence with player and enemy teams
  2. Monitor console for errors or warnings related to event dispatch
  3. Verify all UI elements update correctly (health bars, battle log messages, etc.)
  4. Test the facade methods directly from browser console if possible
- **Validation Method**: Use browser developer tools to monitor network activity and console output
- **Success Criteria**: All UI components receive and process events correctly, no console errors

### Phase 3: Implementation Verification

1. **Basic Event Dispatch Test**:
   - Verify events are properly dispatched and received
   - Test fallback behavior when dependencies aren't available

2. **Helper Method Tests**:
   - Verify specialized event methods work correctly
   - Test validation of parameters

3. **Data Structure Verification**:
   - Ensure event data structures match the inventory
   - Verify backward compatibility property naming

**Testing/Validation After Phase 3:**
- Component is fully operational and handling events correctly
- **Required Tests**: 
  1. Create a test checklist based on Event Inventory for each event type
  2. Verify error handling by intentionally passing invalid data
  3. Confirm both old (`character`) and new (`source`/`target`) property names work
- **Validation Method**: Use browser console to directly call methods and inspect results
- **Success Criteria**: All tests pass with expected results and proper error handling

### Phase 4: Comprehensive Testing

1. **Battle Flow Testing**:
   - Test complete battle scenarios with events
   - Verify all UI components update correctly

2. **Edge Case Testing**:
   - Test with missing or incomplete data
   - Test error handling and recovery

3. **Performance Assessment**:
   - Evaluate any performance impact from additional validation
   - Look for optimization opportunities

**Final Validation:**
- Component is fully integrated and handling all edge cases
- **Required Tests**:
  1. Complete multiple battles with different team compositions
  2. Test with large numbers of status effects to check performance
  3. Test all specialized convenience methods
- **Validation Method**: Observe game behavior and check console for warnings/errors
- **Success Criteria**: No visual glitches, no console errors, consistent performance

## Fallback Strategies

### Direct BattleBridge Fallback
For cases when BattleEventDispatcher is unavailable or fails, BattleManager methods will fall back to using window.battleBridge directly:

```javascript
// In BattleManager.js facade methods
if (window.battleBridge) {
    try {
        window.battleBridge.dispatchEvent(eventType, eventData);
        return true;
    } catch (error) {
        console.error(`[BattleManager] Error dispatching event:`, error);
    }
}
```

### Missing Event Data Recovery
For missing or invalid event data, provide safe defaults:

```javascript
// In specialized event methods
if (!target) {
    console.error("[BattleEventDispatcher] Cannot dispatch CHARACTER_DAMAGED: target is missing");
    return false;
}

if (typeof amount !== 'number' || isNaN(amount)) {
    console.warn("[BattleEventDispatcher] Invalid damage amount:", amount);
    amount = 0; // Safe default
}
```

## Integration with Existing Systems

### BattleBridge Compatibility
The implementation will maintain full compatibility with battleBridge:

1. **Event Type Constants**: Use battleBridge's event types when available
2. **Event Data Structure**: Maintain the same data structure for events
3. **Event Property Naming**: Include both source/target and character naming patterns

### BattleLogManager Integration
The BattleLogManager will eventually listen to semantic events from BattleEventDispatcher:

1. **Initial Integration**: BattleEventDispatcher provides `dispatchBattleLogEvent` as a direct path
2. **Future Architecture**: BattleLogManager will register handlers for semantic events and dispatch log events in response

## Documentation

### High-Level Changelog
```
### Version 0.5.28.1 - BattleEventDispatcher Implementation
- **Technical**: Added BattleEventDispatcher for centralized event handling
- **Technical**: Enhanced event validation and error handling
- **Technical**: Improved event naming consistency
- **Technical**: Added specialized helper methods for common event types
```

### Detailed Technical Changelog
A separate `CHANGELOG_0.5.28.1_BattleEventDispatcher.md` file will include implementation details, challenges, and decisions made during implementation.

## Success Criteria

1. **All Events Correctly Dispatched**: Events reach their intended consumers
2. **Consistent Data Structure**: Event data follows the patterns in the inventory
3. **Backward Compatibility**: Existing components continue to work without modification
4. **Enhanced Validation**: Invalid events produce helpful error messages
5. **No Performance Regression**: No noticeable slowdown in the battle system
6. **Clean Error Handling**: Errors are properly caught and reported
7. **Modular Design**: Code is well-organized with clear single responsibility

Following this plan will ensure a smooth implementation of the BattleEventDispatcher component while maintaining compatibility with existing systems.
