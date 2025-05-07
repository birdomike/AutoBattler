# Stage 7 Detailed Implementation Plan: Event and Logging System

## Overview

This plan details the implementation of Stage 7 of the BattleManager refactoring, focusing on the BattleEventDispatcher and BattleLogManager components. These components will centralize event dispatching and battle logging functionality, following the established architectural patterns from previous stages.

## Component 1: BattleEventDispatcher

### Version 0.5.28.1 - BattleEventDispatcher Implementation

**Purpose**: Centralize event dispatching and provide a standardized event system interface.

#### Implementation Steps:

1. **Fix Module Syntax**
   - Remove `export default` statement
   - Replace with proper global window registration pattern:
   ```javascript
   // Make BattleEventDispatcher available globally for traditional scripts
   if (typeof window !== 'undefined') {
     window.BattleEventDispatcher = BattleEventDispatcher;
     console.log("BattleEventDispatcher class definition loaded and exported to window.BattleEventDispatcher");
   }
   
   // Legacy global assignment for maximum compatibility
   window.BattleEventDispatcher = BattleEventDispatcher;
   ```

2. **Core Methods Implementation**
   - **Constructor**: Add proper defensive initialization
   ```javascript
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
   ```

   - **dispatchEvent**: Enhanced with validation and error handling
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
     
     // Console logging for debugging
     console.log(`[BattleEventDispatcher] Dispatching ${eventType}:`, 
        typeof eventData === 'object' ? { ...eventData } : eventData);
     
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
   ```

   - **Custom Event Handling Methods**
   ```javascript
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

   - **Helper Methods for Common Events**
   ```javascript
   dispatchBattleLogEvent(message, type = 'default') {
     return this.dispatchEvent(this.eventTypes.BATTLE_LOG || 'BATTLE_LOG', {
       message,
       type
     });
   }
   
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
   ```

3. **BattleManager Integration**
   - Add component initialization in BattleManager's `initializeComponentManagers()`
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

4. **Add Facade Methods with Toggle in BattleManager**
   ```javascript
   // Direct facade to eventDispatcher - will be minimally used
   // since most events are dispatched from other components
   dispatchBattleEvent(eventType, eventData) {
     // REFACTORING: Use new implementation if toggle is enabled
     if (this.useNewImplementation && this.battleEventDispatcher) {
       return this.battleEventDispatcher.dispatchEvent(eventType, eventData);
     }
     
     // Original implementation (minimal wrapper around battleBridge)
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

### Version 0.5.28.1_Cleanup - BattleEventDispatcher Cleanup

After verifying the BattleEventDispatcher works correctly:

1. **Remove Original Implementation from BattleManager**
   - Keep only the thin facade method
   ```javascript
   dispatchBattleEvent(eventType, eventData) {
     // REFACTORING: Use new implementation if toggle is enabled
     if (this.useNewImplementation && this.battleEventDispatcher) {
       return this.battleEventDispatcher.dispatchEvent(eventType, eventData);
     }
     
     // Original implementation has been removed (v0.5.28.1_Cleanup)
     console.warn("BattleManager using legacy dispatchBattleEvent - BattleEventDispatcher not available");
     return false;
   }
   ```

## Component 2: BattleLogManager

### Version 0.5.28.2 - BattleLogManager Implementation

**Purpose**: Centralize all battle log message formatting and dispatching.

#### Implementation Steps:

1. **Fix Module Syntax**
   - Remove `export default` statement
   - Replace with proper global window registration pattern using the same approach as BattleEventDispatcher

2. **Core Methods Implementation**
   - **Constructor**: Add proper defensive initialization
   ```javascript
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
   ```

   - **logMessage**: Enhanced with validation and formatting
   ```javascript
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
   ```

   - **Format Message**: Format messages with team identifiers
   ```javascript
   formatMessage(message, character, type = 'default') {
     // If no character provided, return original message
     if (!character) {
       return message;
     }
     
     // Add team identifier
     const teamIdentifier = character.team === 'player' ? ' (ally)' : ' (enemy)';
     return `${character.name}${teamIdentifier} ${message}`;
   }
   ```

   - **Display Turn Summary**: Enhanced from BattleManager implementation
   ```javascript
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
   ```

   - **Helper Methods for Health Color**
   ```javascript
   determineHealthColor(character) {
     if (!character) return 'default';
     
     if (character.isDead) return 'error';
     
     const healthPercent = character.currentHp / character.stats.hp;
     
     if (healthPercent < 0.3) return 'error';
     if (healthPercent < 0.7) return 'action';
     return 'success';
   }
   ```

3. **BattleManager Integration**
   - Add component initialization in BattleManager's `initializeComponentManagers()`
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

4. **Add Facade Method with Toggle in BattleManager**
   ```javascript
   logMessage(message, type = 'default') {
     // REFACTORING: Use new implementation if toggle is enabled
     if (this.useNewImplementation && this.battleLogManager) {
       return this.battleLogManager.logMessage(message, type);
     }
     
     // Original implementation
     // Log to console for debugging
     console.log(`[BattleLog ${type}]: ${message}`);
     
     // Dispatch event through BattleBridge if available
     if (window.battleBridge) {
       try {
         window.battleBridge.dispatchEvent(window.battleBridge.eventTypes.BATTLE_LOG, {
           message: message,
           type: type
         });
       } catch (error) {
         console.warn('Failed to dispatch battle log event:', error);
       }
     }
     
     // Add to DOM battle log if in DOM mode and battleUI is available
     if (this.uiMode === "dom" && this.battleUI) {
       try {
         this.battleUI.addLogMessage(message, type);
       } catch (error) {
         console.error('Error adding message to battle UI:', error);
       }
     }
     
     return true;
   }
   ```

### Version 0.5.28.2_Cleanup - BattleLogManager Cleanup

After verifying the BattleLogManager works correctly:

1. **Remove Original Implementation from BattleManager's logMessage method**
   - Keep only the thin facade method
   ```javascript
   logMessage(message, type = 'default') {
     // REFACTORING: Use new implementation if toggle is enabled
     if (this.useNewImplementation && this.battleLogManager) {
       return this.battleLogManager.logMessage(message, type);
     }
     
     // Original implementation has been removed (v0.5.28.2_Cleanup)
     // Implementation now in BattleLogManager.logMessage
     console.warn("BattleManager using legacy logMessage - BattleLogManager not available");
     
     // Minimal fallback implementation
     console.log(`[BattleLog ${type}]: ${message}`);
     
     return false;
   }
   ```

2. **Remove Original Implementation from BattleManager's displayTurnSummary method**
   - Keep only the thin facade method
   ```javascript
   displayTurnSummary() {
     // REFACTORING: Use new implementation if toggle is enabled
     if (this.useNewImplementation && this.battleLogManager) {
       return this.battleLogManager.displayTurnSummary();
     }
     
     // Original implementation has been removed (v0.5.28.2_Cleanup)
     // Implementation now in BattleLogManager.displayTurnSummary
     console.warn("BattleManager using legacy displayTurnSummary - BattleLogManager not available");
     
     return false;
   }
   ```

## Integration in index.html

Ensure proper script loading order by adding the new component scripts before BattleManager.js:

```html
<!-- Stage 7 Components - Must be loaded before BattleManager -->
<script src="js/battle_logic/events/BattleEventDispatcher.js" defer></script>
<script src="js/battle_logic/events/BattleLogManager.js" defer></script>

<!-- BattleManager -->
<script src="js/managers/BattleManager.js" defer></script>
```

## Testing Approach

1. **Initial Setup Testing**
   - Verify both components load without errors
   - Check console for component initialization messages
   - Verify method validation in console output

2. **BattleEventDispatcher Testing**
   - Test registration of event handlers
   - Verify events dispatch through both custom listeners and battleBridge
   - Test error handling with invalid event types

3. **BattleLogManager Testing**
   - Verify basic message logging
   - Test turn summary display
   - Check message formatting with team identifiers

4. **Toggle Testing**
   - Test with toggle enabled (new implementation)
   - Test with toggle disabled (original implementation)
   - Ensure both paths work correctly

5. **Full Flow Testing**
   - Run a complete battle cycle
   - Verify all battle log messages appear correctly
   - Check all event types are dispatched

## Implementation Dependencies

1. **BattleEventDispatcher Dependencies**:
   - BattleManager (for team access)
   - battleBridge (for event dispatching)

2. **BattleLogManager Dependencies**:
   - BattleEventDispatcher (for event dispatching)
   - BattleManager (for team access)

## Success Criteria

1. **Code Organization**:
   - Event dispatching logic centralized in BattleEventDispatcher
   - Logging logic centralized in BattleLogManager
   - Clear separation of concerns

2. **Compatibility**:
   - All existing UI components still receive events
   - No visual or functional changes to battle system
   - Both DOM and Phaser UI modes fully functional

3. **Code Quality**:
   - Follows established patterns (global window registration, defensive programming)
   - Implements proper error handling and validation
   - Provides detailed diagnostics and logging

4. **Code Reduction**:
   - BattleManager.js file size reduced
   - Event handling logic removed from BattleManager
   - Logging logic removed from BattleManager