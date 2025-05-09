# AutoBattler Game Changelog

## Version 0.6.3.19 (2025-05-09)

### Improved
- Removed temporary debug logging from BattleBridge.js and CharacterSprite.js
- Cleaned up console output for improved readability and performance
- Improved code quality by removing diagnostic code that was cluttering the codebase

*Note: For detailed implementation details, see CHANGELOG_0.6.3.19_DiagnosticCodeCleanup.md*

## Version 0.6.3.18 (2023-08-13)

### Fixed
- Enhanced PassiveAbilityManager to properly handle global trigger events ('onTurnStart' and 'onTurnEnd')
- Added new processGlobalPassiveTrigger method to iterate through all non-defeated characters
- Fixed error: "[PassiveAbilityManager] Invalid character parameter (null or undefined)" when processing global triggers
- Battle Log now correctly shows ability declarations and auto attacks

*Note: For detailed implementation details, see CHANGELOG_0.6.3.18_GlobalPassiveTriggerFix.md*

## Version 0.6.3.17 (2023-08-12)

### Fixed
- Fixed parameter mismatch in BattleFlowController.finishTurn() when calling processPassiveAbilities
- Changed to correctly pass null as the character parameter and moved controller reference to additionalData
- Resolves "[PassiveAbilityManager] Invalid character parameter (null or undefined)" runtime error
- This fix should allow ability declarations and auto attacks to properly display in the Battle Log

*Note: For detailed implementation details, see CHANGELOG_0.6.3.17_PassiveAbilityParameterFix.md*

## Version 0.6.3.16 (2023-08-12)

### Fixed
- Fixed critical path error in index.html that was loading the wrong BattleFlowController.js file
- Updated script reference to use the correct path at js/battle_logic/core/BattleFlowController.js
- This resolves the action declaration display issue by ensuring the updated BattleFlowController with proper diagnostic logging and action type handling is used

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.16_BattleFlowControllerPathFix.md*

## Version 0.6.3.15 (2023-08-11)

### Fixed
- Added diagnostic logging in DirectBattleLog to trace action message flow
- Temporarily disabled CHARACTER_ACTION event listener to fix action message conflicts
- Enhanced logging for BATTLE_LOG event reception and message queue processing
- Fixed issue with detailed action declarations not displaying in battle log

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.15_DirectBattleLogDiagnostics.md*

## Version 0.6.3.14 (2023-08-10)

### Fixed
- Fixed Battle Log UI issue where action declarations weren't displaying properly
- Modified BattleFlowController to prevent duplicate 'action' type messages
- Updated console logging with clearer prefixes for better traceability
- Ensured proper detailed action messages with team identifiers appear in the UI

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.14_BattleLogActionMessages.md*

## Version 0.6.3.13 (2023-08-09)

### Changed
- Added diagnostic logging for Battle Log message flow to debug duplicate action declarations
- Added action object inspection in BattleFlowController.applyActionEffect
- Added message tracing in BattleLogManager.logMessage to track log entry flow

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.13_BattleLogDiagnostics.md*

## Version 0.6.3.12 (2023-08-08)

### Fixed
- Fixed action indicator text positioning issue - ability names now appear directly above characters instead of at screen's top-left
- Improved ability name handling to display cleaner text without prefixes
- Enhanced positioning logic in ActionIndicator with better container management
- Added more detailed logging for text positioning

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.12_ActionIndicatorPositioning.md*

## Version 0.6.3.11 (2023-08-08)

### Changed
- Added enhanced diagnostics to trace action object flow through the event system
- Added duplicate actionType property in BattleBridge event dispatching
- Added full action object logging in ActionGenerator

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.11_ActionEventDiagnostics.md*

## Version 0.6.3.10 (2023-08-08)

### Fixed
- Fixed issue where character abilities weren't showing correctly in the Action Indicator (text over character heads)
- Added proper ability declarations to the Battle Log
- Enhanced BattleBehaviors system logging to diagnose ability selection issues
- Prevented fallback ability selection from accidentally overriding BattleBehaviors decisions
- Standardized action event properties to ensure consistent UI updates

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.10_AbilityUIFixes.md*

## Version 0.6.3.9 (2023-08-07)

### Fixed
- Additional diagnostics for ability selection issues
- Updated BattleManager.prepareTeamForBattle logic for team type determination

## Version 0.6.3.8 (2023-08-07)

### Fixed
- Fixed critical issue with team assignment in BattleManager.prepareTeamForBattle
- Corrected targeting system to properly find enemy targets
- Characters now correctly use their abilities based on team assignment

## Version 0.6.3.7 (2023-08-06)

### Fixed
- Modified index.html to correct BattleBehaviors script loading order
- Added uppercase/lowercase window registration for BattleBehaviors

## Version 0.6.2.3 (2023-08-05)

### Changed
- Completed Phase 3 of BattleScene refactoring (TeamDisplayManager)
- Extracted team display and active indicator management from BattleScene
- Improved team visualization and turn indicator handling

## Version 0.6.2.2 (2023-08-04)

### Changed
- Completed Phase 2 of BattleScene refactoring (BattleUIManager)
- Extracted UI creation and HUD management from BattleScene
- Improved UI component organization and lifecycle management

## Version 0.6.2.1 (2023-08-03)

### Changed
- Completed Phase 1 of BattleScene refactoring (BattleEventManager)
- Extracted event management from BattleScene
- Improved event handling and UI updates

## Version 0.6.1.0 (2023-08-02)

### Added
- Started BattleScene refactoring project
- Created technical implementation plan for extracting components
- Added documentation for refactoring approach

## Version 0.5.28.2 (2023-07-28)

### Changed
- Enhanced BattleLogManager with improved message formatting
- Added color coding for health status messages

## Version 0.5.26.3_Hotfix3 (2023-07-20)

### Fixed
- Added comprehensive target validation in ActionGenerator
- Fixed issue with multi-target abilities and damage calculation

## Version 0.5.26.1 (2023-07-15)

### Added
- Implemented AbilityProcessor component
- Extracted ability processing logic from BattleManager
- Improved ability effect handling

## Version 0.5.1.4 (2023-06-25)

### Added
- Initial Phaser BattleScene implementation
- Added basic character visualization
- Implemented turn-based combat visualization

## Version 0.4.4.7 (2023-06-10)

### Added
- Enhanced passive ability system with advanced behaviors
- Added visual feedback for passive ability activation

## Version 0.4.4.6 (2023-06-05)

### Added
- Added reflection depth tracking for passive abilities
- Implemented battle-level passive trigger tracking

## Version 0.4.4.3 (2023-06-01)

### Added
- Initial implementation of passive ability system
- Added basic passive triggers (onBattleStart, onTurnStart, etc.)
- Implemented basic passive behaviors

## Version 0.3.4 (2023-05-15)

### Fixed
- Fixed issue with character art during attack animations
- Added protection system to prevent DirectImageLoader interference
