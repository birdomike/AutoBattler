# AutoBattler Game Changelog

## Version 0.4.1 - 2025-05-05

This release represents a major refactoring of the battle system to implement the enhanced ability structure, status effect system, and behavior delegation architecture as designed in the GeminiSuggestions.md document.

### Version 0.4.1.1 - Pass 1: Data Structure Definition

#### Added
- **Enhanced Ability Structure Schema**:
  - Formalized JSON schema for abilities with `id`, `name`, `effects` array, and behavior references
  - Added support for multiple effect types (damage, healing, status application, stat modification)
  - Defined scaling parameters for different damage types
  - Added `targetType`, `abilityType`, `passiveTrigger`, and other behavioral fields
  
- **Status Effect Structure Schema**:
  - Created comprehensive schema for status effects with `id`, `name`, `type`, and `behavior` object
  - Defined modular behavior properties for different effect types (DoT, HoT, stat modification, control)
  - Added support for stacking effects with `maxStacks` property
  - Implemented duration management with `defaultDuration` property

#### Technical
- **Documentation Improvements**:
  - Added detailed schema documentation in GeminiSuggestions.md
  - Established consistent naming conventions for all behavior functions
  - Created field-by-field explanation of schema requirements

### Version 0.4.1.2 - Pass 2: Status Effects JSON Implementation

#### Added
- **status_effects.json**:
  - Created external definition file for all status effects
  - Implemented 24 status effect definitions including:
    - Damage over time effects (burn, poison, bleed)
    - Healing over time effects (regeneration)
    - Control effects (stun, freeze, taunt)
    - Buff effects (attack up, defense up, speed up, etc.)
    - Debuff effects (attack down, defense down, speed down, etc.)
    - Special effects (shield, evade, reflect, vulnerable, immunity)
  
- **Enhanced Effect Behaviors**:
  - Defined specific damage calculations for DoT effects (flat, percentage of max HP, percentage of current HP)
  - Implemented scaling factors for effects based on character stats
  - Added immunity and vulnerability mechanics
  - Created reflect damage behavior for counter-attack effects

#### Technical
- **JSON Structure Optimizations**:
  - Organized effects by categories for easier maintenance
  - Added comprehensive commenting for developer reference
  - Ensured valid JSON structure with proper nesting and formatting
  - Created uniform structure for similar effect types

### Version 0.4.1.3 - Pass 3: Ability Data Conversion

#### Changed
- **Enhanced Character Abilities**:
  - Updated existing abilities in characters.json to use the new effects array structure
  - Converted damage/healing properties to appropriate effect types
  - Added proper scaling stats (STR/INT/SPI) to all abilities
  - Preserved backward compatibility with a layered approach
  
#### Added
- **New Ability Properties**:
  - Added `targetType` property to all abilities for better targeting control
  - Implemented `selectionWeight` for controlling ability usage frequency
  - Added `unlockLevel` property for abilities that unlock at higher levels
  - Enhanced ability descriptions with scaling information

#### Technical
- **Data Transition Strategy**:
  - Implemented dual-format support for smooth transition
  - Added validation checks to ensure all abilities conform to the new schema
  - Created fallback behavior for abilities without complete definitions

### Version 0.4.1.4 - Pass 4: Behavior Function Foundation

#### Added
- **Behavior Registry System**:
  - Implemented registration system for behavior functions
  - Created `BattleBehaviors.js` as the central access point
  - Added function categorization (targeting, action decision, passive)
  - Implemented "Check → Delegate → Default" pattern for behavior execution
  
- **Default Behavior Functions**:
  - Added standard targeting behaviors (`targetRandomEnemy`, `targetLowestHpAlly`, etc.)
  - Implemented default action decision logic
  - Created base passive trigger behaviors
  - Added utility functions for behavior management

#### Technical
- **Architecture Improvements**:
  - Designed system for extensibility with minimal coupling
  - Added proper error handling for failed behavior execution
  - Implemented fallback behaviors for graceful degradation
  - Added non-ES module fallback for improved compatibility

### Version 0.4.1.5 - Pass 5: BattleManager Core Refactoring

#### Changed
- **calculateDamage() Refactoring**:
  - Enhanced to support the full range of effect data parameters
  - Added stat-based scaling (STR/INT/SPI) with appropriate multipliers
  - Implemented damage type handling with better type advantages
  - Added support for defense penetration and other advanced modifiers
  
- **generateCharacterAction() Refactoring**:
  - Implemented the behavior delegation system for action decisions
  - Added context building for better decision making
  - Enhanced targeting logic with behavior delegation
  - Maintained backward compatibility with legacy ability format

#### Added
- **Debugging Enhancements**:
  - Added detailed logging for behavior execution
  - Improved error reporting for failed behaviors
  - Created debugging utilities for tracking decision making
  - Enhanced battle log with more detailed information

#### Technical
- **Structural Improvements**:
  - Refactored methods to use async/await for better flow control
  - Added safeguards to handle missing or corrupted behavior functions
  - Created context objects with consistent structure for behavior functions
  - Ensured functionality with or without the behavior system

### Version 0.4.1.6 - Pass 6: Effects and Status System Implementation

#### Added
- **Enhanced Status Effect Framework**:
  - Added `statusEffectDefinitions` to store loaded definitions from JSON
  - Created `loadStatusEffectDefinitions()` method to load definitions from external file
  - Updated `initialize()` and `startBattle()` to load status effect definitions
  - Implemented fallback definitions for when external file cannot be loaded

- **Data-Driven Status Effects**:
  - Completely refactored `addStatusEffect()` to support:
    - Status effect definitions with proper names and descriptions
    - Stack counting for stackable effects
    - Default durations from definitions
    - Effect values for configurable intensity
  - Updated `updateStatusIcons()` to use definitions for icons and tooltips
  - Added stack count display to icons
  - Implemented visual categorization by effect type (different colors)

#### Changed
- **Dynamic Status Effect Processing**:
  - Updated `processStatusEffects()` to dynamically process effects based on their definitions
  - Added support for both modern definition-based effects and legacy hardcoded effects
  - Implemented percentage-based and flat damage/healing based on effect definitions
  - Improved logging with stack counts and proper effect names

- **Ability Effects Processing**:
  - Enhanced `applyActionEffect()` to handle an array of effects
  - Added `processEffect()` to handle individual effects with different behaviors
  - Added support for status effect application with chance modifiers
  - Maintained backward compatibility with legacy ability format

#### Fixed
- **BattleManager Constructor Issue**:
  - Fixed a critical bug that prevented the BattleManager from being properly constructed
  - Implemented multiple fallback mechanisms to ensure proper object initialization
  - Added safety checks to prevent similar issues in the future
  - Enhanced error handling and reporting for initialization issues

#### Technical
- **Improved Architecture**:
  - Enhanced modularity with clearer separation of concerns
  - Added robust fallback systems for all critical components
  - Created comprehensive debug logging for troubleshooting
  - Implemented safety mechanisms to preserve gameplay during refactoring

### Version 0.4.1.7 - Pass 7: Passive System Implementation

#### Added
- **Passive Ability Framework**:
  - Added support for passive abilities via `abilityType: "Passive"` designation
  - Implemented `passiveTrigger` system to determine when abilities activate
  - Created `passiveBehavior` reference system to link to behavior functions
  - Added optional `passiveData` field for ability-specific configuration

- **Trigger Points**:
  - Added 10+ passive ability trigger points across the battle flow
  - Turn-based triggers: `onTurnStart`, `onTurnEnd`
  - Battle-flow triggers: `onBattleStart`, `onBattleEnd`
  - Damage/healing triggers: `onDamageTaken`, `onDamageDealt`, `onHealed`, `onHealingDone`
  - State change triggers: `onDefeat`, `onKill`, `onRevive`

- **Utility Methods**:
  - Added `applyDamage` utility for direct damage application from passives
  - Added `applyHealing` utility for direct healing from passives
  - Added `processPassiveAbilities` core method to handle passive execution
  - Added `getAllCharacters` helper method for team-wide passive effects

#### Changed
- **Enhanced Character Preparation**:
  - Modified `prepareTeamForBattle` to identify and store passive abilities
  - Added `passiveAbilities` array to characters for quick reference

- **Updated Status Effect Processing**:
  - Refactored to use new damage/healing utilities for consistency
  - Enhanced with passive triggers for more interactive effects

- **Improved Death Handling**:
  - Modified `checkAndResetDeathStatus` to return revival status
  - Added proper passive triggers for death and revival events

#### Examples
- Created a sample character (Seraphina) with passive abilities
- Implemented common passive behaviors in the fallback script:
  - `passive_ApplyRegenOnTurnStart`: Applies regeneration at turn start
  - `passive_DamageReflectOnHit`: Reflects damage back to attackers
  - `passive_ApplyStatusOnHit`: Applies status effects when hit
  - `passive_TeamBuffOnBattleStart`: Buffs entire team at battle start

#### Technical
- Maintained backward compatibility with existing characters
- Implemented robust error handling for passive ability execution
- Added detailed documentation of the passive system
- Enhanced fallback BattleBehaviors system with passive support

---

This changelog documents the implementation of Passes 1-7 of our refactoring plan, establishing the foundation for the new battle system architecture. Future passes will build on this foundation to add UI enhancements and comprehensive testing.
