# AutoBattler Game Changelog
# Note to Claude- Do not try to re-write this entire file- Just make targeted edits to add new version logs.

## Version 0.6.0.4 - Phase 3 Utility Integration Cleanup (2025-05-07)

### Fixed
- **PassiveBehaviors**: Updated three functions to use `BattleUtilities.getAllCharacters()` instead of the removed `battleManager.getAllCharacters()`:
  - `passive_TeamBuffOnBattleStart`: Fixed team buffing not working due to missing utility method
  - `passive_ProtectiveInstinct`: Fixed shield application to low-health allies
  - `passive_Intimidate`: Fixed enemy targeting for intimidation effects
- Each updated location includes appropriate fallback handling for backward compatibility

### Technical
- Completes Phase 3 refactoring by fixing all remaining utility method calls
- Maintains architectural consistency across components
- Includes defensive coding patterns with fallbacks for robustness
- Provides consistent logging for diagnostic purposes

## Version 0.6.0.3 - StatusEffectManager BattleUtilities Integration (2025-05-07)

### Fixed
- **StatusEffectManager**: Updated `_processDamageEffect` and `_processHealingEffect` methods to use `BattleUtilities.getCharacterByUniqueId()` instead of the removed `battleManager.getCharacterByUniqueId()`
  - Fixes runtime error: `TypeError: this.battleManager.getCharacterByUniqueId is not a function`
  - Continues alignment with Phase 3 refactoring where utility methods were moved to dedicated `BattleUtilities` class
  - Adds fallback for backward compatibility with clear error messaging
  - Improves parameter handling for `applyHealing` calls

### Technical
- Further reduces dependencies on `BattleManager` for utility functions
- Improves source character resolution robustness with better error handling
- Maintains the 'Source ID Linking' pattern established in v0.5.27.2 while modernizing implementation

## Version 0.6.0.2 - BattleUtilities Integration Fix (2025-05-07)

### Fixed
- **ActionDecisionBehaviors**: Updated `decideAction_PrioritizeHeal` function to use `BattleUtilities.getAllCharacters()` instead of the removed `battleManager.getAllCharacters()`
  - Fixes runtime error: `TypeError: battleManager.getAllCharacters is not a function`
  - Aligns with Phase 3 refactoring where utility methods were moved to dedicated `BattleUtilities` class
  - Added fallback for backward compatibility

### Technical
- Continues the architectural separation of utilities from BattleManager
- Updates calling code to access utilities through proper static methods
- Maintains backward compatibility with defensive fallback implementation

## Version 0.6.0.1 - Combat Balance Adjustments (2025-05-07)

### Changed
- **Zephyr's Wind Slash**: Removed bleeding effect and reduced base damage from 32 to 30
  - Better aligns with the ability's air theme (bleeding didn't fit thematically)
  - Reduces its overwhelming damage potential against Nature type characters
  
- **Aqualia's Tidal Wave**: Reduced base damage from 30 to 25
  - Makes the AoE ability more balanced compared to single-target abilities
  - Still benefits from type advantages against Fire and Metal, but with less extreme damage
  
- **Caste's Battle Fury**: Increased cooldown from 5 to 6 turns
  - Better balances the triple-buff ability's power by reducing its uptime
  - Maintains the same effect power but with longer time between uses

### Technical
- Updated character ability data in characters.json
- Balance changes based on combat testing and damage analysis
- Preserves character identity while addressing outlier power levels

## Version 0.6.0 - Type System Enhancement (2025-05-07)

### Added
- **Full Type System Implementation**: Implemented complete 22-type effectiveness system
  - Created data-driven approach with new `type_effectiveness.json` file
  - Added support for advantages (1.5x damage), disadvantages (0.5x damage), and immunities (0x damage)
  - Implemented special case for Light vs. Ethereal (3x damage)
  - Enhanced battle log with descriptive type effectiveness messages

### Improved
- **TypeEffectivenessCalculator**: Enhanced with data-driven approach and full type chart
  - Added asynchronous loading of type data from JSON
  - Implemented fallback to minimal hardcoded values if JSON fails to load
  - Created proper defensive checks for type parameters
  - Added support for case-insensitive type comparisons

### Technical
- **Data Architecture**: Created foundation for data-driven game systems
  - Established JSON-based type effectiveness data structure
  - Enhanced TypeEffectivenessCalculator with async loading capabilities
  - Added helper methods for UI tooltip integration
  - Implemented comprehensive error handling and fallbacks

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.0_TypeSystemEnhancement.md*

## Version 0.5.31.0 - BattleUtilities Component (2025-05-07)

### Technical
- Created dedicated `BattleUtilities` static utility class to handle common utility functions
- Extracted four utility methods from BattleManager to reduce code and improve separation of concerns
- Utility methods now have improved validation and error handling
- Reorganized file structure with new `utilities` subfolder in battle_logic directory

*Note: For detailed information on implementation steps, see CHANGELOG_0.5.31.0_BattleUtilities.md*

## Version 0.5.30.1 - Complete StatusEffectDefinitionLoader Separation (2025-05-07)
### Technical
- **Full Architectural Separation**: Completed separation of status effect definitions from BattleManager
  - Added `primeDefinitions()` method to StatusEffectDefinitionLoader to fully encapsulate definition loading
  - Removed `setupFallbackStatusEffects()` method from BattleManager (handled entirely by loader)
  - Removed `statusEffectDefinitions` property from BattleManager
  - Simplified BattleManager initialization code by delegating to a single loader method
  - Created true orchestration pattern with BattleManager having zero status definition knowledge

### Improved
- **Cleaner Error Handling**: Enhanced the robustness of status effect loading system
  - Added clear error messages for missing StatusEffectDefinitionLoader
  - Implemented multi-level fallback chain with logging
  - Created clear code paths for all possible failure scenarios
  - Improved initialization flow with better error containment

*Note: For detailed information on specific implementation steps, see Technical Changelogs/CHANGELOG_0.5.30.1_StatusEffectDefinitionLoader_Separation.md*