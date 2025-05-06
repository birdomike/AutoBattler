# Stage 6 Refactoring Plan: Passive Ability System

## Components to Implement

For Stage 6, we need to implement two key components:

1. **PassiveTriggerTracker** - Track and manage passive ability trigger state
2. **PassiveAbilityManager** - Process and execute passive abilities

## Detailed Implementation Plan

### Version 0.5.27.1 - PassiveTriggerTracker Implementation- Complete

**Purpose**: Extract passive ability trigger tracking into a dedicated component

**Key Responsibilities**:
- Track which passive abilities have triggered this turn
- Track which passive abilities have triggered this battle
- Provide methods to record and check trigger status
- Handle trigger stack counting

**Implementation Steps**:
1. Create `js/battle_logic/passives/PassiveTriggerTracker.js`
2. Implement core tracking methods:
   - `recordTrigger(character, passiveId, trigger)` - Record a passive trigger
   - `hasFiredThisTurn(character, passiveId, trigger)` - Check if fired this turn
   - `hasFiredThisBattle(character, passiveId, trigger)` - Check if fired this battle
   - `resetTurnTracking()` - Clear per-turn tracking
   - `getMaxStacksForPassive(passiveId)` - Get trigger stack counts
3. Extract tracking logic from `processPassiveAbilities` method
4. Add proper initialization in BattleManager
5. Implement toggle for testing and backward compatibility

**Extracted Code From BattleManager**:
- Tracking initialization: `character.passiveTriggeredThisTurn` and `this.passiveTriggersThisBattle`
- Logic for tracking duplicate triggers

### Version 0.5.27.1_Cleanup - PassiveTriggerTracker Cleanup- Complete

**Purpose**: Remove original tracking code and finalize the delegation

**Implementation Steps**:
1. Verify PassiveTriggerTracker functionality in battle testing
2. Remove original tracking initialization code from BattleManager
3. Update references to use new component
4. Ensure proper error handling for missing component
5. Document code reduction metrics

**Expected Code Reduction**:
- Approximately 25-30 lines of tracking initialization and duplicate trigger checking code
- Removes complex Map-based tracking from BattleManager
- Eliminates character-level tracking properties, centralizing state management

### Version 0.5.27.2 - PassiveAbilityManager Implementation

**Purpose**: Extract passive ability execution logic into a dedicated component

**Key Responsibilities**:
- Determine which passives should trigger for an event
- Execute passive behaviors through behavior system
- Handle passive ability effects and messaging
- Coordinate with PassiveTriggerTracker

**Implementation Steps**:
1. Create `js/battle_logic/passives/PassiveAbilityManager.js`
2. Implement core methods:
   - `processPassiveAbilities(trigger, character, additionalData)` - Main entry point
   - `executePassiveBehavior(behavior, context)` - Execute specific passive
   - `canTriggerPassive(character, ability, trigger)` - Check if passive can trigger
   - `getPassivesByTriggerType(character, trigger)` - Find passives of specific trigger type
3. Extract execution logic from BattleManager's `processPassiveAbilities`
4. Add proper initialization and dependencies
5. Implement toggle mechanism for testing

**Extracted Code From BattleManager**:
- Passive validation logic (checking if character is alive, has passives)
- Context creation for passive behaviors
- Behavior execution and error handling
- Logging passive activation messages

### Version 0.5.27.2_Cleanup - PassiveAbilityManager Cleanup

**Purpose**: Remove original passive execution code and finalize the delegation

**Implementation Steps**:
1. Verify PassiveAbilityManager functionality in battle testing
2. Remove original passive execution code from BattleManager
3. Create thin facade method that delegates to PassiveAbilityManager
4. Add proper error handling for missing component
5. Document code reduction metrics

**Expected Code Reduction**:
- Approximately 70-80 lines from the entire `processPassiveAbilities` method
- Removes complex passive execution logic from BattleManager
- Eliminates deep nesting of ability iteration and condition checking
- Reduces error-prone manual event dispatching

### Total Expected Code Reduction for Stage 6

- Approximately 95-110 lines of code removed from BattleManager
- Converts complex, deeply nested passive handling logic to clean delegation calls
- Centralizes passive ability system in dedicated components
- Improves maintainability by isolating passive ability concerns

## Implementation Approach

We'll follow the successful "Extract-Verify-Remove" approach from Stage 5, with these key considerations:

### Component Architecture

1. **PassiveTriggerTracker**:
   - Standalone component with minimal dependencies
   - Simple data structure for tracking state
   - Public API for recording and checking triggers
   - Reset methods for turn boundaries

2. **PassiveAbilityManager**:
   - Depends on PassiveTriggerTracker and BattleBehaviors
   - Public API matches BattleManager method signatures
   - Enhanced error handling for component dependencies
   - Full preservation of event dispatching

### Technical Considerations

1. **Global Window Registration**:
   ```javascript
   // Make PassiveTriggerTracker available globally for traditional scripts
   if (typeof window !== 'undefined') {
     window.PassiveTriggerTracker = PassiveTriggerTracker;
     console.log("PassiveTriggerTracker class definition loaded and exported to window.PassiveTriggerTracker");
   }
   
   // Legacy global assignment for maximum compatibility
   window.PassiveTriggerTracker = PassiveTriggerTracker;
   ```

2. **BattleManager Toggle Mechanism**:
   ```javascript
   processPassiveAbilities(trigger, character, additionalData = {}) {
       // REFACTORING: Use new implementation if toggle is enabled
       if (this.useNewImplementation && this.passiveAbilityManager) {
           return this.passiveAbilityManager.processPassiveAbilities(trigger, character, additionalData);
       }
       
       // Original implementation follows
       // ... original code remains for now ...
   }
   ```

3. **Component Initialization**:
   ```javascript
   async initializeComponentManagers() {
       // ... existing initialization code ...
       
       // Initialize passive system components
       if (window.PassiveTriggerTracker) {
           this.passiveTriggerTracker = new window.PassiveTriggerTracker();
           console.log('BattleManager: PassiveTriggerTracker initialized');
       }
       
       if (window.PassiveAbilityManager) {
           this.passiveAbilityManager = new window.PassiveAbilityManager(this, this.passiveTriggerTracker);
           console.log('BattleManager: PassiveAbilityManager initialized');
       }
   }
   ```

## Success Criteria

1. **Functionality Preservation**:
   - Passive abilities should trigger exactly as before
   - No changes to game behavior despite code reorganization
   - All battle log messages maintained

2. **Code Organization**:
   - Clear separation of responsibilities between components
   - PassiveTriggerTracker handles state tracking
   - PassiveAbilityManager handles execution logic

3. **Code Reduction**:
   - At least 95 lines removed from BattleManager
   - Thin facade methods remain for backward compatibility
   - Precise metrics documented in each cleanup changelog

## Implementation Timeline

1. **Day 1**: Implement PassiveTriggerTracker (v0.5.27.1)
2. **Day 1**: Cleanup and verify PassiveTriggerTracker (v0.5.27.1_Cleanup)
3. **Day 2**: Implement PassiveAbilityManager (v0.5.27.2)
4. **Day 2**: Cleanup and verify PassiveAbilityManager (v0.5.27.2_Cleanup)

This plan follows the proven methodical approach from the previous stages, ensuring we maintain functionality while improving code organization and maintainability. Each component is designed to handle a specific responsibility, making the system easier to understand, test, and extend. The code reduction metrics will help quantify the success of this refactoring effort.