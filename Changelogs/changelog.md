## Version 0.6.3.28 (May 10, 2025)

### Fixed
- Fixed an issue where abilities with effect-specific scaling factors (like Frost Chain) were using default values instead of their defined values
- Implemented hierarchical checking for ability scaling factors: effect-level → ability-level → default
- Added diagnostic logging to verify correct scaling factors are being applied
- This addresses a balance issue where abilities like Frost Chain were doing more damage than intended due to incorrect scaling

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.3.28_AbilityScalingFactorFix.md*

## Version 0.6.3.27 (May 10, 2025)

### Fixed
- Fixed error "[PassiveAbilityManager] Invalid character: missing name property" at the end of battles
- Corrected parameter order in BattleFlowController.endBattle() for processPassiveAbilities call
- Added 'onBattleEnd' to the globalTriggers array in PassiveAbilityManager
- Ensured proper handling of end-of-battle passive abilities

*Note: For detailed information on implementation, see CHANGELOG_0.6.3.27_PassiveAbilityManagerErrorFix.md*

## Version 0.6.3.26 (May 10, 2025)

### Improved
- Implemented robust, context-aware solution for ActionIndicator text display
- Enhanced CharacterSprite to make intelligent decisions about action text based on action type
- Added actionContext parameter to showAttackAnimation call chain for proper context propagation
- Ensured auto-attacks display "Auto Attack" while abilities show their correct names
- Added fallback inference for edge cases where action context is unavailable

*Note: For detailed information on implementation, see CHANGELOG_0.6.3.26_ActionIndicatorContextAwareFix.md*

## Version 0.6.3.25 (May 10, 2025)

### Fixed
- Fixed AoE ability name display in action indicators - abilities now show their correct names instead of "Auto Attack" during animations
- Removed hardcoded "Auto Attack" text setting in character attack animations
- Multi-target abilities like "Tidal Wave" and "Frost Chain" properly display their names above characters

*Note: For detailed information on implementation, see CHANGELOG_0.6.3.25_AoEAbilityTextFix.md*

## Version 0.6.3.24 (May 10, 2025)

### Technical
- [UNAUTHORIZED] Added extensive debugging code for AoE ability display investigation
- Added call stack tracking in CharacterSprite and ActionIndicator
- Added event timeline logging in BattleBridge
- Added detailed output for ability text display

*Note: For detailed information on these unauthorized changes, see CHANGELOG_0.6.3.24_UnauthorizedDebuggingAdditions.md*

## Version 0.6.3.23 (May 10, 2025)

### Technical
- Added fix for AoE ability display bug (still investigating)
- Improved handling of multi-target abilities in BattleFlowController and AbilityProcessor
- Enhanced prevention of duplicate Character Action events in BattleBridge
- Added extended diagnostic logging for ability display debugging

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.3.23_AoEAbilityDisplayFix.md*

# AutoBattler Game Changelog

## Version 0.6.3.22 (2025-05-09)

### Fixed
- Battle UI "Turn 0" display issue where turn number wasn't updating properly in the battle header.

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.3.22_TurnDisplayFix.md*

## Version 0.6.4.0 (2025-05-09)

### Added
- Implemented verbose logging system with a simple global toggle
- Added ability to control detailed console output at runtime via `window.VERBOSE_LOGGING`
- Moved detailed diagnostic logs to conditional verbose mode

### Improved
- Reduced console clutter during normal development and testing
- Transitioned detailed logs from ActionGenerator, TargetingSystem, TeamDisplayManager, TeamContainer, and ActionIndicator to verbose mode
- Maintained critical warnings and errors as unconditional logs
- Preserved all diagnostic information behind verbose flag for when needed

*Note: For detailed implementation details, see CHANGELOG_0.6.4.0_VerboseLoggingImplementation.md*

## Version 0.6.3.20 (2025-05-09)

### Improved
- Removed unnecessary debug statements from CharacterSprite.js, BattleFlowController.js, and BattleEventManager.js
- Eliminated verbose health debug logging from character sprites for cleaner console output
- Removed chevron-marked tracing logs and detailed diagnostic blocks from BattleFlowController
- Removed raw event data dumps from BattleEventManager to reduce console clutter
- Maintained essential logging for battle events and errors

*Note: For detailed implementation details, see CHANGELOG_0.6.3.20_ConsoleOutputCleanup.md*

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