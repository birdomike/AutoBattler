# AutoBattler Game Changelog

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
