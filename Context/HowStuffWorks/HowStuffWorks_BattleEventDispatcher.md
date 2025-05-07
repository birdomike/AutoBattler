# How The Battle Event System Works

*As of **Version 0.5.28.1 - BattleEventDispatcher Implementation (Phase 3)***

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Event Flow](#event-flow)
4. [Component Integration](#component-integration)
5. [Event Types and Structure](#event-types-and-structure)
6. [Implementation Details](#implementation-details)
7. [Usage Examples](#usage-examples)
8. [Error Handling](#error-handling)
9. [Future Directions](#future-directions)

## Overview

The Battle Event System is a core communication infrastructure that enables different components of the AutoBattler game to communicate without direct dependencies. It follows a mediator pattern, allowing battle-related events (damage, healing, actions, etc.) to flow from the core battle logic to various UI components and other systems through a standardized interface.

Prior to version 0.5.28.1, battle events were dispatched directly through the `battleBridge` global object, requiring components to know about this specific implementation and leading to inconsistent event structures. The new system introduces the `BattleEventDispatcher` as a dedicated component for handling all event dispatching with improved validation, standardization, and error handling, while maintaining backward compatibility.

## Architecture

The battle event system uses a layered architecture with clear separation of concerns:

```
┌───────────────────┐     ┌────────────────────┐     ┌────────────────┐     ┌──────────────────┐
│                   │     │                    │     │                │     │                  │
│  Battle Logic     │────▶│  BattleManager     │────▶│  Event         │────▶│  UI Components   │
│  Components       │     │  (Facade Methods)  │     │  Dispatcher    │     │  (Listeners)     │
│                   │     │                    │     │                │     │                  │
└───────────────────┘     └────────────────────┘     └────────────────┘     └──────────────────┘
        │                           ▲                        │                        ▲
        │                           │                        │                        │
        │                           │                        │                        │
        └───────────────────────────┘                        └────────────────────────┘
             Direct Component                                    UI Event
             Communication                                       Consumption
                                                                 
```

### Key Components

1. **BattleEventDispatcher** (`js/battle_logic/events/BattleEventDispatcher.js`)
   - Centralized event dispatching component
   - Validates event data before dispatching
   - Standardizes event structures
   - Provides specialized methods for common event types

2. **BattleManager** (`js/managers/BattleManager.js`)
   - Contains facade methods that delegate to the dispatcher
   - Provides fallback mechanisms when the dispatcher isn't available
   - Coordinates between game logic and event system

3. **BattleBridge** (`js/phaser/bridge/BattleBridge.js`)
   - Underlying event bus that BattleEventDispatcher uses
   - Maintains listeners and handles final event delivery
   - Links the core battle logic with Phaser UI components

4. **UI Components** (Various Phaser components)
   - Register as listeners for specific event types
   - Update visuals in response to game state changes communicated via events

## Event Flow

Events flow through the system in a specific sequence:

1. **Origination**: A battle logic component (e.g., DamageCalculator) needs to notify the system about an event (e.g., character taking damage)

2. **Facade Method Call**:
   ```javascript
   // Component calls the appropriate facade method on BattleManager
   this.battleManager.dispatchDamageEvent(target, damage, source, ability);
   ```

3. **Event Dispatching**:
   - BattleManager delegates to BattleEventDispatcher
   - BattleEventDispatcher validates and standardizes the event data
   - BattleEventDispatcher dispatches the event to battleBridge

4. **Event Propagation**:
   - BattleBridge delivers the event to all registered listeners
   - Listeners update UI or trigger game logic in response

5. **Response Handling**: Any component that needs to react to the event does so through its registered listener

### Example Flow: Character Damage

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│                 │     │                 │     │                      │
│ DamageCalculator│     │ BattleManager   │     │ BattleEventDispatcher│
│                 │     │                 │     │                      │
└────────┬────────┘     └────────┬────────┘     └──────────┬───────────┘
         │                       │                         │
         │ applyDamage()         │                         │
         │───────────────────────▶                         │
         │                       │                         │
         │                       │ dispatchDamageEvent()   │
         │                       │─────────────────────────▶
         │                       │                         │
         │                       │                         │ validate data
         │                       │                         │◀────────────▶
         │                       │                         │
         │                       │                         │ dispatch to battleBridge
         │                       │                         │───────────────────────────┐
         │                       │                         │                           │
         │                       │                         │                           ▼
         │                       │                         │             ┌─────────────────────┐
         │                       │                         │             │                     │
         │                       │                         │             │ BattleBridge        │
         │                       │                         │             │                     │
         │                       │                         │             └──────────┬──────────┘
         │                       │                         │                        │
         │                       │                         │                        │ notify listeners
         │                       │                         │                        │───────────────┐
         │                       │                         │                        │               │
         │                       │                         │                        │               ▼
         │                       │                         │             ┌──────────────────────────┐
         │                       │                         │             │                          │
         │                       │                         │             │ UI Components            │
         │                       │                         │             │ (CharacterSprite, etc.) │
         │                       │                         │             │                          │
         │                       │                         │             └──────────────────────────┘
         │                       │                         │
```

## Component Integration

### BattleEventDispatcher

The BattleEventDispatcher initializes with a reference to BattleManager and creates a standardized interface for all battle events:

```javascript
class BattleEventDispatcher {
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
    
    // Core methods and specialized event methods...
}
```

### BattleManager Integration

BattleManager initializes the BattleEventDispatcher during component initialization:

```javascript
async initializeComponentManagers() {
    // ... other components initialization
    
    // Initialize event dispatcher (Stage 7)
    if (window.BattleEventDispatcher) {
        this.battleEventDispatcher = new window.BattleEventDispatcher(this);
        console.log('BattleManager: BattleEventDispatcher initialized');
        
        // Verify methods exist
        console.log('>>> BattleEventDispatcher instance check:', {
            dispatchEvent: typeof this.battleEventDispatcher.dispatchEvent === 'function',
            dispatchCharacterDamagedEvent: typeof this.battleEventDispatcher.dispatchCharacterDamagedEvent === 'function',
            dispatchCharacterHealedEvent: typeof this.battleEventDispatcher.dispatchCharacterHealedEvent === 'function'
        });
    }
    
    // ... more components initialization
}
```

And provides facade methods that delegate to the dispatcher:

```javascript
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
```

### Battle Logic Components

Components like DamageCalculator, HealingProcessor, AbilityProcessor, and BattleFlowController use these facade methods:

```javascript
// In DamageCalculator.js
applyDamage(target, amount, source, ability, damageType) {
    // ... damage application logic
    
    // Dispatch damage event
    if (this.battleManager.dispatchDamageEvent) {
        // Use the new facade method
        this.battleManager.dispatchDamageEvent(target, actualDamage, source, ability);
    } else if (window.battleBridge && actualDamage > 0) {
        // Fallback to direct battleBridge call if facade not available
        try {
            window.battleBridge.dispatchEvent(/* ... */);
        } catch (error) {
            console.error('[DamageCalculator] Error dispatching CHARACTER_DAMAGED event:', error);
        }
    }
    
    // ... return result
}
```

## Event Types and Structure

The battle system uses a consistent set of event types, defined in the BattleEventDispatcher:

```javascript
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
```

### Core Event Structures

Each event type has a standardized structure:

#### CHARACTER_DAMAGED Event
```javascript
{
    character: target,          // The character taking damage
    target: target,             // Same as character (for backward compatibility)
    newHealth: target.currentHp, // Updated health value
    maxHealth: target.stats.hp, // Maximum health
    amount: actualDamage,       // Damage amount
    source: source,             // Character causing the damage
    ability: ability            // Ability used (if applicable)
}
```

#### CHARACTER_HEALED Event
```javascript
{
    character: target,          // The character being healed
    target: target,             // Same as character (for backward compatibility)
    newHealth: target.currentHp, // Updated health value
    maxHealth: target.stats.hp, // Maximum health
    amount: healAmount,         // Healing amount
    source: source,             // Character causing the healing
    ability: ability            // Ability used (if applicable)
}
```

#### CHARACTER_ACTION Event
```javascript
{
    character: character,       // The character performing the action
    action: action              // The action data (ability, target, etc.)
}
```

#### BATTLE_ENDED Event
```javascript
{
    winner: result,             // 'player', 'enemy', or 'draw'
    result: result,             // Same as winner (for backward compatibility)
    reason: reason              // Reason for battle end
}
```

## Implementation Details

### Specialized Event Methods

The BattleEventDispatcher provides specialized methods for common event types:

```javascript
// Dispatch a battle log message event
dispatchBattleLogEvent(message, type = 'default') {
    return this.dispatchEvent(this.eventTypes.BATTLE_LOG || 'battle_log', {
        message,
        type
    });
}

// Dispatch a character damaged event
dispatchCharacterDamagedEvent(target, amount, source = null, ability = null) {
    // Validate parameters
    if (!target) {
        console.error("[BattleEventDispatcher] Cannot dispatch CHARACTER_DAMAGED: target is missing");
        return false;
    }
    
    // ... validation and event construction
    
    return this.dispatchEvent(this.eventTypes.CHARACTER_DAMAGED || 'character_damaged', {
        character: target,
        target: target,
        newHealth: target.currentHp,
        maxHealth: target.stats?.hp || 100,
        amount,
        source,
        ability
    });
}
```

### Parameter Validation

The dispatcher performs comprehensive parameter validation:

```javascript
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
    
    // ... event dispatching
}
```

### Local Event Listeners

The dispatcher supports local event listeners for component-specific events:

```javascript
// Add an event handler for a specific event type
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

// Remove an event handler
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

// Notify all listeners for a specific event type
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

### Fallback Mechanisms

The system implements robust fallbacks at multiple levels:

1. **BattleEventDispatcher Fallbacks**:
   - Falls back to default event types if battleBridge.eventTypes is unavailable
   - Handles errors in local event listeners

2. **BattleManager Facade Fallbacks**:
   - Falls back to direct battleBridge calls if the dispatcher is unavailable
   - Provides clear error messages for troubleshooting

3. **Component-Level Fallbacks**:
   - Components check for both the facade method and direct battleBridge as options
   - Implement appropriate error handling in both paths

## Usage Examples

### Dispatching Damage Events

```javascript
// From DamageCalculator.js
if (this.battleManager.dispatchDamageEvent) {
    // Use the new facade method
    this.battleManager.dispatchDamageEvent(target, actualDamage, source, ability);
} else if (window.battleBridge && actualDamage > 0) {
    // Fallback to direct battleBridge call
    try {
        window.battleBridge.dispatchEvent(
            window.battleBridge.eventTypes.CHARACTER_DAMAGED, 
            {
                character: target,
                target: target,
                newHealth: target.currentHp,
                maxHealth: target.stats.hp,
                amount: actualDamage,
                source: source,
                ability: ability
            }
        );
    } catch (error) {
        console.error('[DamageCalculator] Error dispatching CHARACTER_DAMAGED event:', error);
    }
}
```

### Dispatching Healing Events

```javascript
// From HealingProcessor.js
if (this.battleManager.dispatchHealingEvent && actualHealing > 0) {
    this.battleManager.dispatchHealingEvent(target, actualHealing, source, ability);
} else if (window.battleBridge && actualHealing > 0) {
    try {
        window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.CHARACTER_HEALED, {
            character: target, 
            target: target,
            newHealth: target.currentHp, 
            maxHealth: target.stats.hp,
            amount: actualHealing, 
            source: source, 
            ability: ability
        });
    } catch (error) {
        console.error('[HealingProcessor] Error dispatching CHARACTER_HEALED event:', error);
    }
}
```

### Dispatching Battle Start/End Events

```javascript
// From BattleFlowController.js - Battle Start
if (this.battleManager.dispatchBattleEvent) {
    // Use the facade method
    this.battleManager.dispatchBattleEvent(
        window.battleBridge?.eventTypes.BATTLE_STARTED || 'battle_started', 
        { playerTeam, enemyTeam }
    );
} else if (window.battleBridge) {
    // Fallback to direct call
    try {
        window.battleBridge.dispatchEvent(
            window.battleBridge.eventTypes.BATTLE_STARTED, 
            { playerTeam, enemyTeam }
        );
    } catch (error) {
        console.error('[BattleFlowController] Error dispatching BATTLE_STARTED event:', error);
    }
}

// From BattleFlowController.js - Battle End
if (this.battleManager.dispatchBattleEndEvent) {
    this.battleManager.dispatchBattleEndEvent(result, 'standard');
} else if (window.battleBridge) {
    try {
        window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_ENDED, {
            result: result,
            winner: result,
            playerTeam: this.battleManager.playerTeam,
            enemyTeam: this.battleManager.enemyTeam
        });
    } catch (error) {
        console.error("[BattleFlowController] Error dispatching battle end event:", error);
    }
}
```

## Error Handling

The battle event system implements comprehensive error handling across all levels:

### 1. Component-Level Error Handling

```javascript
// In components like DamageCalculator
try {
    window.battleBridge.dispatchEvent(/* ... */);
} catch (error) {
    console.error('[DamageCalculator] Error dispatching CHARACTER_DAMAGED event:', error);
}
```

### 2. Dispatcher-Level Error Handling

```javascript
// In BattleEventDispatcher.js
dispatchEvent(eventType, eventData) {
    // ... validation and listener notification
    
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
```

### 3. Facade-Level Error Handling

```javascript
// In BattleManager.js
dispatchDamageEvent(target, amount, source = null, ability = null) {
    // ... dispatcher delegation
    
    // Try direct battleBridge as last resort
    if (window.battleBridge) {
        try {
            window.battleBridge.dispatchEvent(/* ... */);
            return true;
        } catch (error) {
            console.error(`[BattleManager] Error dispatching damage event:`, error);
        }
    }
    
    return false;
}
```

### 4. Local Listener Error Handling

```javascript
// In BattleEventDispatcher.js
notifyListeners(eventType, eventData) {
    // ... get listeners
    
    listeners.forEach(handler => {
        try {
            handler(eventData);
        } catch (error) {
            console.error(`[BattleEventDispatcher] Error in event handler for ${eventType}:`, error);
        }
    });
}
```

## Future Directions

As the battle event system continues to evolve, several enhancements are planned:

1. **Enhanced Event Validation**:
   - Add more specific validation for each event type
   - Implement schema validation for event structure
   - Add runtime type checking for critical properties

2. **Event Diagnostics**:
   - Add event tracking and diagnostic tools
   - Implement event logging for debugging
   - Create event visualization for development

3. **Performance Optimization**:
   - Profile event dispatch performance
   - Implement batched event dispatching for high-frequency events
   - Optimize memory usage with event pooling

4. **Developer Tools**:
   - Create event monitoring interface
   - Implement event replay for bug reproduction
   - Add event filtering for focused debugging

5. **Additional Specialized Event Types**:
   - Expand event types for more game mechanics
   - Add specialized dispatchers for new systems
   - Implement hierarchical event structure

---

## Conclusion

The Battle Event System is a critical communication infrastructure that allows the game's components to interact without tight coupling. With the introduction of the BattleEventDispatcher in Version 0.5.28.1, the system now provides standardized event dispatching with improved validation, error handling, and backward compatibility.

By following the patterns and practices outlined in this guide, developers can effectively use the battle event system to communicate between components while maintaining clean separation of concerns and robust error handling.
