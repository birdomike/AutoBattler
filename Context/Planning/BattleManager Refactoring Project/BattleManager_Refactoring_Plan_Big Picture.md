# BattleManager Refactoring Plan: New Files and Structure

## Current Directory Structure
```
js/
├── battle_logic/
│   ├── core/
│   │   ├── BattleManager.js (refactored, ~300 lines)
│   │   ├── BattleFlowController.js (~300 lines)
│   │   └── BattleInitializer.js (~200 lines)
│   ├── status/
│   │   ├── StatusEffectManager.js (~350 lines)
│   │   └── StatusEffectDefinitionLoader.js (~150 lines)
│   ├── damage/
│   │   ├── DamageCalculator.js (~200 lines)
│   │   ├── HealingProcessor.js (~150 lines)
│   │   └── TypeEffectivenessCalculator.js (~100 lines)
│   ├── abilities/
│   │   ├── AbilityProcessor.js (~250 lines)
│   │   ├── TargetingSystem.js (~200 lines)
│   │   └── ActionGenerator.js (~250 lines)
│   ├── passives/
│   │   ├── PassiveAbilityManager.js (~200 lines)
│   │   └── PassiveTriggerTracker.js (~150 lines)
│   ├── events/
│   │   ├── BattleEventDispatcher.js (~150 lines)
│   │   └── BattleLogManager.js (~150 lines)
│   ├── ActionDecisionBehaviors.js
│   ├── BattleBehaviors.js
│   ├── BehaviorRegistry.js
│   ├── PassiveBehaviors.js
│   └── TargetingBehaviors.js
```

## Planned Directory Structure with Debug System
```
js/
├── battle_logic/
│   ├── [...existing structure...]
├── debug/ (NEW)
│   ├── DebugManager.js (~100 lines)
│   ├── BattleDebugger.js (~150 lines)
│   ├── TeamBuilderDebugger.js (~100 lines)
│   └── LoggingUtilities.js (~80 lines)
```

## Detailed Breakdown of Each File

### Core Battle Management

#### 1. BattleManager.js (refactored, ~300 lines)
**Purpose**: Main coordination class that delegates to specialized managers  
**Responsibilities**:
- Provide public API for other systems to interact with battle logic
- Maintain references to all component managers
- Hold basic battle state (active/paused/turn number)
- Store configuration settings and UI mode  

**Key Methods**:
- `initialize()` - Entry point that sets up all managers
- `startBattle()` - Facade method that delegates to BattleFlowController
- `togglePause()`, `pauseBattle()`, `resumeBattle()` - Battle flow control
- `setSpeed()` - Adjust battle speed multiplier  

**Relationships**:
- Owns instances of all other manager classes
- Primary interface for UI components via BattleBridge

#### 2. BattleFlowController.js (~300 lines)
**Purpose**: Manages the sequence and flow of battle from start to finish  
**Responsibilities**:
- Control turn sequence and action execution
- Utilize BehaviorRegistry for action decisions and targeting
- Manage battle state transitions  

**Key Methods**:
- `startBattle()` - Initialize teams and begin battle sequence
- `startNextTurn()` - Process turn start and prepare actions
- `generateTurnActions()` - Create actions using BehaviorRegistry
- `executeNextAction()` - Process the next queued action
- `finishTurn()` - Handle end-of-turn effects and cooldowns
- `checkBattleEnd()` - Check victory/defeat conditions  

**Relationships**:
- Called by BattleManager
- Uses BehaviorRegistry for decision-making
- Coordinates with StatusEffectManager for effect processing
- Utilizes AbilityProcessor for ability execution
- Uses PassiveAbilityManager for passive triggers

#### 3. BattleInitializer.js (~200 lines)
**Purpose**: Handle setup and initialization of battle components  
**Responsibilities**:
- Prepare team data for battle
- Load required data and systems
- Initialize state for a new battle  

**Key Methods**:
- `initialize()` - Main setup method
- `prepareTeamForBattle()` - Convert team data to battle-ready format
- `validateTeamData()` - Ensure team data is complete and correct
- `generateCharacterId()` - Create unique identifiers for characters
- `initializeBehaviorSystem()` - Set up behavior registry connection  

**Relationships**:
- Called by BattleManager during initialization
- Works with StatusEffectDefinitionLoader to load effect definitions

### Status Effect System

#### 4. StatusEffectManager.js (~350 lines)
**Purpose**: Manage application and processing of status effects  
**Responsibilities**:
- Apply and remove status effects on characters
- Process effects at turn start
- Handle effect stacking, duration, and expiration  

**Key Methods**:
- `processStatusEffects()` - Process all effects at turn start
- `addStatusEffect()` - Apply new effects or refresh existing ones
- `removeStatusEffect()` - Remove an effect from a character
- `getActiveEffects()` - Get all active effects on a character
- `updateStatusIcons()` - Trigger UI updates for status visualization  

**Relationships**:
- Used by BattleFlowController
- Uses StatusEffectDefinitionLoader for effect definitions
- Communicates with UI via BattleBridge

#### 5. StatusEffectDefinitionLoader.js (~150 lines)
**Purpose**: Load and validate status effect definitions  
**Responsibilities**:
- Load effect definitions from JSON
- Provide fallback definitions if loading fails
- Validate effect data integrity  

**Key Methods**:
- `loadDefinitions()` - Load from JSON file
- `validateDefinition()` - Ensure definition is valid
- `setupFallbackDefinitions()` - Create defaults if loading fails
- `getDefinition()` - Get a definition by ID  

**Relationships**:
- Used by StatusEffectManager
- Used by BattleInitializer during setup

### Damage System

#### 6. DamageCalculator.js (~200 lines)
**Purpose**: Handle all damage calculations  
**Responsibilities**:
- Calculate damage amounts based on stats and types
- Apply modifiers like critical hits and random variance
- Handle damage reduction from defense  

**Key Methods**:
- `calculateDamage()` - Core damage formula method
- `applyDefenseReduction()` - Apply defense stat effects
- `applyRandomVariance()` - Add random damage variance
- `calculateCritical()` - Handle critical hit calculations
- `calculateStatScaling()` - Apply STR/INT scaling  

**Relationships**:
- Used by AbilityProcessor
- Uses TypeEffectivenessCalculator for type advantages

#### 7. HealingProcessor.js (~150 lines)
**Purpose**: Handle healing calculations and health restoration  
**Responsibilities**:
- Calculate and apply healing amounts
- Handle resurrection logic
- Process healing-triggered effects  

**Key Methods**:
- `applyHealing()` - Core healing method
- `calculateHealingAmount()` - Determine healing with modifiers
- `applyStatScaling()` - Apply Spirit stat scaling
- `checkAndResetDeathStatus()` - Handle resurrection
- `processHealingEffects()` - Handle additional healing effects  

**Relationships**:
- Used by AbilityProcessor
- Called by StatusEffectManager for healing effects

#### 8. TypeEffectivenessCalculator.js (~100 lines)
**Purpose**: Calculate type advantage effects  
**Responsibilities**:
- Determine damage multipliers based on attacker/defender types
- Handle type immunities and special relationships
- Generate descriptive messages for type effects  

**Key Methods**:
- `calculateTypeMultiplier()` - Get damage multiplier
- `isImmune()` - Check for type immunity
- `getTypeAdvantageText()` - Get descriptive text
- `getTypeSpecialRelationship()` - Check for special type relationships  

**Relationships**:
- Used by DamageCalculator
- Used by AbilityProcessor

### Ability System

#### 9. AbilityProcessor.js (~250 lines)
**Purpose**: Execute ability effects and manage ability state  
**Responsibilities**:
- Process ability effects on targets
- Apply damage, healing, and status effects
- Manage ability cooldowns  

**Key Methods**:
- `processEffect()` - Process a single effect
- `applyEffectToTarget()` - Apply effect to a specific target
- `applyActionEffect()` - Apply all effects from an action
- `processAbilityByType()` - Handle different ability types
- `manageCooldowns()` - Update ability cooldowns  

**Relationships**:
- Used by BattleFlowController
- Uses DamageCalculator and HealingProcessor
- Uses StatusEffectManager for status effects

#### 10. TargetingSystem.js (~200 lines)
**Purpose**: Determine targets for abilities based on targeting rules
**Responsibilities**:
- Select appropriate targets for abilities
- Apply targeting logic based on ability type
- Handle area-of-effect targeting

**Key Methods**:
- `selectTarget()` - Find appropriate target based on targeting rules
- `getValidTargets()` - Get all valid targets for an ability
- `resolveTargeting()` - Resolve targeting for different ability types

**Relationships**:
- Used by AbilityProcessor
- Used by BattleBehaviors for action decision making

#### 11. ActionGenerator.js (~250 lines)
**Purpose**: Generate action objects for battle turns
**Responsibilities**:
- Create action objects for characters
- Determine which abilities to use
- Calculate base damage for actions

**Key Methods**:
- `generateAction()` - Create an action for a character
- `chooseAbility()` - Select an appropriate ability to use
- `createActionObject()` - Build the complete action object

**Relationships**:
- Used by BattleFlowController
- Uses BehaviorRegistry for decision making
- Uses TargetingSystem for target selection

### Passive System

#### 12. PassiveAbilityManager.js (~200 lines)
**Purpose**: Manage passive ability execution  
**Responsibilities**:
- Process passive abilities when triggers occur
- Execute passive behaviors
- Coordinate with PassiveTriggerTracker  

**Key Methods**:
- `processPassiveAbilities()` - Process passives for a trigger
- `executePassiveBehavior()` - Execute passive effects
- `canTriggerPassive()` - Check if passive can trigger
- `getPassivesByTriggerType()` - Find passives of specific trigger type  

**Relationships**:
- Used by BattleFlowController
- Uses PassiveTriggerTracker to track triggers
- Uses BattleLogManager for passive trigger messages

#### 13. PassiveTriggerTracker.js (~150 lines)
**Purpose**: Track passive ability triggers  
**Responsibilities**:
- Record passive triggers by turn and battle
- Provide trigger status information
- Reset tracking on turn/battle boundaries  

**Key Methods**:
- `recordTrigger()` - Record that a passive triggered
- `hasFiredThisTurn()` - Check if passive fired this turn
- `hasFiredThisBattle()` - Check if passive fired in battle
- `resetTurnTracking()` - Clear per-turn tracking
- `getMaxStacksForPassive()` - Get trigger stack counts  

**Relationships**:
- Used by PassiveAbilityManager
- Updated by BattleFlowController at turn boundaries

### Event & Logging System

#### 14. BattleEventDispatcher.js (~150 lines)
**Purpose**: Handle event dispatching for battle events
**Responsibilities**:
- Provide standardized event dispatching interface
- Ensure events reach proper listeners
- Handle event propagation and bubbling

**Key Methods**:
- `dispatchEvent()` - Send event to listeners
- `addEventHandler()` - Register listener for events
- `removeEventHandler()` - Unregister event listener

**Relationships**:
- Used by all battle components for communication
- Communicates with BattleBridge for UI updates

#### 15. BattleLogManager.js (~150 lines)
**Purpose**: Format and manage battle log messages  
**Responsibilities**:
- Create formatted battle log messages
- Generate battle summaries
- Format messages with team identifiers  

**Key Methods**:
- `logMessage()` - Format message and dispatch
- `formatMessage()` - Apply type-specific formatting
- `displayTurnSummary()` - Create turn summary
- `createTeamSummary()` - Generate team health report
- `colorizeByHealth()` - Add color based on health level  

**Relationships**:
- Used by all other components for logging
- Communicates with UI via BattleBridge

### Debug System (Planned)

#### 16. DebugManager.js (~100 lines)
**Purpose**: Central configuration and control for the debugging system  
**Responsibilities**:
- Provide global debug toggle and verbosity settings
- Maintain namespaced logging categories
- Configure log filtering and formatting

**Key Methods**:
- `initialize()` - Setup debug system with desired configuration
- `setEnabled(boolean)` - Master toggle for all debugging
- `setVerbosity(level)` - Control log detail level (error, warn, info, debug, trace)
- `namespace(name)` - Create or access a debug namespace

**Relationships**:
- Used by all components that need debugging
- Parent of domain-specific debuggers

#### 17. BattleDebugger.js (~150 lines)
**Purpose**: Battle system specific debugging utilities  
**Responsibilities**:
- Provide battle-domain specific logging methods
- Track battle state for debugging purposes
- Offer specialized battle visualization utilities

**Key Methods**:
- `logInitialization(component, status)` - Component initialization tracking
- `logTurnProgress(turn, character)` - Turn progression information
- `logAction(actor, target, ability)` - Action execution details
- `logDamage(source, target, amount, type)` - Damage application tracking

**Relationships**:
- Used by battle system components
- Configured by DebugManager

#### 18. TeamBuilderDebugger.js (~100 lines)
**Purpose**: Team Builder specific debugging utilities  
**Responsibilities**:
- Provide team builder domain specific logging
- Track team composition and validation

**Key Methods**:
- `logSelection(character)` - Track character selection events
- `logTeamValidation(team, issues)` - Report team validation issues
- `logUIState(component, state)` - Track UI component states

**Relationships**:
- Used by team builder components
- Configured by DebugManager

#### 19. LoggingUtilities.js (~80 lines)
**Purpose**: Shared logging utilities and formatters  
**Responsibilities**:
- Format log output consistently
- Provide timing utilities for performance tracking
- Handle log routing (console vs storage)

**Key Methods**:
- `formatMessage(namespace, level, message)` - Consistent formatting
- `startTimer(label)` / `endTimer(label)` - Performance measurement
- `stringifyObject(obj)` - Safe object serialization for logging

**Relationships**:
- Used by all debugger components
- Configured by DebugManager

## Implementation Approach

The implementation follows a "Clean As You Go" methodology, where each component is:
1. Extracted and implemented in its own file
2. Verified with toggle testing
3. Immediately integrated with legacy code removed
4. Thoroughly documented in the changelog

This approach eliminates the need for a final cleanup phase and ensures continuous functionality throughout the refactoring process.

### Critical Implementation Notes for ES Module Compatibility

Based on lessons learned in Version 0.5.1.3a, all component files must follow these guidelines:

1. **DO NOT USE ES MODULE SYNTAX**: The game uses traditional script loading, not ES modules
2. **Use Global Window Registration Pattern**:
   ```javascript
   // Make ClassName available globally for traditional scripts
   if (typeof window !== 'undefined') {
     window.ClassName = ClassName;
     console.log("ClassName class definition loaded and exported to window.ClassName");
   }
   
   // Legacy global assignment for maximum compatibility
   window.ClassName = ClassName;
   ```
3. **Script Loading Order**: Components must be loaded before BattleManager.js in index.html
4. **BattleManager Initialization**: Use global window objects instead of dynamic imports:
   ```javascript
   // Check for globally registered class
   if (window.BattleFlowController) {
     // Create instance from global
     this.battleFlowController = new window.BattleFlowController(this);
     console.log('BattleManager: BattleFlowController component initialized');
   } else {
     console.warn("BattleFlowController not found on global window object");
     // Fall back to original implementation
     this.useNewImplementation = false;
   }
   ```

### Implementation Stages

#### Stage 1: Setup and Infrastructure (✓ COMPLETED)
- Create the directory structure for all planned components
- Create shell files with proper global registration but minimal implementation
- Modify BattleManager to include toggle mechanism and component references
- CHECKPOINT #1: Test that the game still works with toggle disabled
- CLEANUP: Remove duplicate initialization code after verification

#### Stage 2: Status Effect System (✓ COMPLETED)
- Implement StatusEffectManager.js and StatusEffectDefinitionLoader.js with full functionality
- Update BattleManager.initialize() to use window objects instead of dynamic imports
- Add conditional code in BattleManager to toggle between implementations for status effect methods
- Add new component script tags to index.html with proper load order
- CHECKPOINT #2: Test status effect application with toggle on/off
- CLEANUP: Remove original status effect handling code after verification

#### Stage 3: Battle Flow Control (✓ COMPLETED)
- Implement BattleFlowController.js with turn and action management
- Update toggle mechanism for turn flow methods
- CHECKPOINT #3: Test complete battle sequence with toggle on/off
- CLEANUP: Remove original battle flow control code after verification

#### Stage 4: Damage and Healing System (✓ COMPLETED)
- Implement DamageCalculator.js, HealingProcessor.js, and TypeEffectivenessCalculator.js
- Connect to BattleFlowController and enable in toggle
- CHECKPOINT #4: Test damage calculations with toggle on/off
- CLEANUP: Remove original damage and healing code after verification

#### Stage 5: Ability Processing (✓ COMPLETED)
- Implement AbilityProcessor.js, TargetingSystem.js, and ActionGenerator.js
- Update BattleManager with toggle for ability processing
- CHECKPOINT #5: Test ability execution with toggle on/off
- CLEANUP: Remove original ability processing code after verification

#### Stage 6: Passive Ability System (✓ COMPLETED)
- Implement PassiveAbilityManager.js and PassiveTriggerTracker.js
- Connect to BattleFlowController and enable in toggle
- CHECKPOINT #6: Test passive ability triggers with toggle on/off
- CLEANUP: Remove original passive ability code after verification

#### Stage 7: Events and Logging- Complete
- Implement BattleEventDispatcher.js and BattleLogManager.js
- Complete integration of all components
- CHECKPOINT #7: Test complete system with toggle on/off
- CLEANUP: Remove original event and logging code after verification

#### Stage 8: Debug System Implementation- Decided against Refactoring this for now. 
- Create debug system directory structure and base files
- Implement DebugManager with global configuration
- Implement domain-specific debuggers (Battle, TeamBuilder)
- Update components to use debug system instead of direct console logging
- Integrate with existing code patterns
- CHECKPOINT #8: Verify debug toggling and verbosity controls

### Post-Refactoring Optimization- Complete!
After all stages are complete, the BattleManager will function as a thin coordination layer with each responsibility delegated to specialized components. Some final steps may include:
- Remove all toggle mechanisms (no longer needed)
- Update documentation to reflect the new architecture
- Performance profiling and optimization
- Comprehensive test run of all game scenarios with the new architecture

### Integration of Debug System with Existing Components

Components should replace direct console.log calls with debug namespace calls:

```javascript
// BEFORE:
console.log(`[BattleFlowController] Processing turn ${this.currentTurn}`);

// AFTER:
Debug.Battle.logTurnProgress(this.currentTurn, this.activeCharacter);
```

This approach maintains the context-specific nature of debugging while providing structure and control. It also aligns perfectly with the ongoing refactoring to improve modularity and separation of concerns.