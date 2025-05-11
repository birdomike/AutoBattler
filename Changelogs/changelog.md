### [0.6.4.15] - 2025-05-11
#### Changed
- Refactored all `initializeXYZ()` manager methods to follow a consistent, concise pattern
- Simplified `initializeBattleBridge()` while maintaining fallback approaches
- Removed verbose diagnostics logging from `initializeEventManager()`
- Added consistent return values and error handling across all initialization methods
- Continued Phase 7 (Final Cleanup) refactoring with Stage 5 completion

### [0.6.4.14] - 2025-05-11
#### Changed
- Simplified BattleScene.create() method to focus on manager initialization
- Removed direct TurnIndicator creation and management from BattleScene
- Moved specialized logic to appropriate initialization methods
- Extracted canvas smoothing configuration into a dedicated method
- Continued Phase 7 (Final Cleanup) refactoring with Stage 4 completion

### [0.6.4.13] - 2025-05-11
#### Changed
- Removed legacy fallback code throughout BattleScene.js
- Removed fallback TurnIndicator creation, requiring proper TurnIndicator component
- Enhanced error messages for component failures to clearly indicate requirements
- Removed legacy event listener cleanup in favor of component-based cleanup
- Continued Phase 7 (Final Cleanup) refactoring with Stage 3 completion

### [0.6.4.12] - 2025-05-11
#### Changed
- Removed legacy implementations from `updateActiveCharacterVisuals()` method in BattleScene.js
- Removed legacy implementations from `getTeamData()` method in BattleScene.js
- Changed both methods to exclusively delegate to TeamDisplayManager
- Added proper error handling when TeamDisplayManager is unavailable
- Continued Phase 7 (Final Cleanup) refactoring with Stage 2 completion

### [0.6.4.11] - 2025-05-11
#### Changed
- Removed legacy createCharacterTeams() and cleanupCharacterTeams() methods from BattleScene.js
- Updated references to use TeamDisplayManager exclusively for team handling
- Improved error handling when TeamDisplayManager initialization fails
- Started Phase 7 (Final Cleanup) of the BattleScene refactoring plan

### [0.6.4.10] - 2025-05-11
#### Changed
- Changed the coordinate grid toggle hotkey from Ctrl+G to Alt+G to avoid browser conflicts
- Added event.preventDefault() to prevent browser's default behavior when using debug hotkeys
- Updated documentation and console logs to reflect the new hotkey

### [0.6.4.9] - 2025-05-11
#### Changed
- Completed PhaserDebugManager refactoring (Remove phase)
- Removed original debug code from BattleScene.js (approximately 150 lines removed)
- Simplified debug initialization and error handling
- Fully delegated all debugging functionality to the PhaserDebugManager component

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.9_PhaserDebugManager_Remove.md*

### [0.6.4.8] - 2025-05-11
#### Added
- Created new PhaserDebugManager component to centralize debug tools (Extract phase)
- Added proper lifecycle and resource management for debug tools
- Enhanced global testing functions with improved error handling

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.8_PhaserDebugManager_Extract.md*

### [0.6.4.7] - 2025-05-11
#### Changed
- Completed BattleFXManager implementation by removing legacy visual effects code from BattleScene.js
- Simplified visual effects methods to fully delegate to BattleFXManager
- Improved error handling when BattleFXManager is unavailable
- Added clear user feedback when visual effects manager cannot be initialized

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.7_BattleFXManager_RemovePhase.md*

### [0.6.4.6] - 2025-05-11
#### Changed
- Implemented BattleFXManager component to centralize visual effects management
- Extracted floating text and attack animation logic from BattleScene to BattleFXManager
- Added fallback mechanisms for backward compatibility
- Improved integration with TeamDisplayManager for visual effects
- Updated BattleEventManager to support BattleFXManager integration
- Fixed script loading for BattleFXManager in index.html

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.6_BattleFXManager_Implementation.md*

### [0.6.4.5] - 2025-05-11
#### Changed
- Implemented unified asset loading interface in BattleAssetLoader
- Completed Stage 4 of the BattleAssetLoader refactoring plan
- Added comprehensive error tracking and reporting for asset loading
- Enhanced user feedback with specific error messages based on failed components
- Finalized Phase 4 of the BattleScene refactoring project

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.5_BattleAssetLoader_UnifiedInterface.md*

### [0.6.4.4] - 2025-05-11
#### Changed
- Completed status effect icon refactoring by removing original methods from BattleScene
- Implemented the Remove phase of Extract-Verify-Remove pattern for Stage 3
- Enhanced error handling and fallback mechanisms for status effect icons
- Further reduced BattleScene.js complexity by ~80 lines

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.4_BattleAssetLoader_StatusEffectIcons_Remove.md*

### [0.6.4.3] - 2025-05-11
#### Changed
- Refactored status effect icon loading from BattleScene into BattleAssetLoader component
- Implemented Stage 3 of the BattleAssetLoader refactoring plan (Extract phase)
- Added loadStatusEffectIcons() and initStatusIconMapping() methods to the asset loader
- Enhanced error handling for status effect loading with appropriate fallbacks

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.3_BattleAssetLoader_StatusEffectIcons.md*

### [0.6.4.2] - 2025-05-11
#### Changed
- Refactored character asset loading from BattleScene into BattleAssetLoader component
- Implemented Stage 2 of the BattleAssetLoader refactoring plan (completed all parts)
- Added loadCharacterAssets() method to centralize character art loading
- Simplified fallback code in BattleScene to reduce code duplication

### [0.6.4.1] - 2025-05-11
#### Changed
- Completed BattleAssetLoader implementation Stage 1 by removing original UI asset loading code
- Improved error handling when BattleAssetLoader is unavailable
- Added visual feedback to notify the user when UI assets fail to load

### [0.6.4.0] - 2025-05-11
#### Changed
- Refactored asset loading from BattleScene into dedicated BattleAssetLoader component (Phase 1: UI assets)
- Improved separation of concerns in BattleScene
- Reduced BattleScene complexity by extracting asset loading logic

## [0.6.3.46] - 2025-05-10

### Fixed
- Improved visibility of Ethereal type filter button by increasing its opacity to 93%
- Added bold text styling to the Ethereal filter to enhance readability on the white background
- Fixed the greyish appearance of the Ethereal button with specialized styling

## [0.6.3.45] - 2025-05-10

### Changed
- Updated the Ethereal type's color to pure white (#FFFFFF) for better alignment with its theme
- Added special handling to display Ethereal filter text in black for improved contrast and readability

## [0.6.3.44] - 2025-05-10

### Improved
- Enhanced filters UI by hiding the "Clear Filters" button when no filters are applied
- Added dynamic button display that only shows the clear button when needed
- Updated filter handlers to properly refresh the filters UI when toggling filters

## [0.6.3.43] - 2025-05-10

### Improved
- Expanded filter options in Team Builder to show all 22 types and 22 roles from the design document
- Replaced dynamic role/type extraction with complete predefined lists
- Maintained filter functionality while showing all possible options

## [0.6.3.42] - 2025-05-10

### Improved
- Enhanced ability display in hero details to color each ability based on its elemental type
- Added subtle left border with higher opacity for better visual distinction between ability types
- Abilities without a specific type now default to the character's type for visual consistency

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.3.42_AbilityTypeVisualization.md*

## Version 0.6.3.41 (May 10, 2025)

### Added
- Expanded type colors system to include all 22 elemental types defined in the design document
- Added consistent color definitions for Electric, Ice, Rock, Metal, Psychic, Poison, Physical, Arcane, Mechanical, Void, Crystal, Storm, Ethereal, Blood, Plague, and Gravity types
- Implemented type colors across all UI systems (TeamBuilder, Battle UI, and Phaser components)
- Enhanced CSS classes for type-based backgrounds to support all types

### Technical
- Standardized type color values across TeamBuilderUI.js, BattleUI.js, and CharacterSprite.js
- Converted hex color values to Phaser-compatible format for CharacterSprite.js
- Updated BattleUI.addCustomStyles method to include CSS classes for all type backgrounds
- This update lays the foundation for upcoming characters with the new element types

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.41_TypeColorSystemExpansion.md*

## Version 0.6.3.40 (May 10, 2025)

### Fixed
- Resolved warning "[BattleInitializer] PassiveTriggerTracker not available for battle reset" by ensuring proper reference to PassiveTriggerTracker through BattleManager
- Fixed component initialization order issue affecting passive ability tracking system
- Eliminated unnecessary console warnings during battle initialization

### Technical
- Modified BattleInitializer to access PassiveTriggerTracker directly from BattleManager instead of using a stored reference
- Implemented a more robust dependency access pattern that's resilient to initialization order changes
- Maintained graceful degradation for fault tolerance while fixing the underlying issue

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.3.39_PassiveTriggerTrackerReferenceHotfix.md*

## Version 0.6.3.39 (May 10, 2025)

### Fixed
- Fixed battle not ending when all enemies are defeated, which caused battles to continue indefinitely
- Fixed inconsistency between character HP and defeat status tracking
- Eliminated "No valid targets found" errors during battles that should have already ended
- Improved battle lifecycle handling for more reliable battle completion

### Technical
- Added character state validation in checkBattleEnd() to ensure defeat status is consistent
- Modified DamageCalculator to properly mark characters as defeated when they reach 0 HP
- Added diagnostic logging to identify when defeat status corrections are made
- Implemented defensive programming patterns to prevent "zombie battles"

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.39_BattleEndDetectionFix.md*

## Version 0.6.3.38 (May 10, 2025)

### Fixed
- Fixed "Invalid type 'healing'" console warnings by adding 'healing' as a valid message type
- Enhanced BattleLogManager to properly handle healing-specific messages
- Eliminated unnecessary console noise during healing events
- Improved consistency between message creation and validation systems

### Technical
- Added diagnostic tracing to identify the source of 'healing' message type
- Used console.trace() to capture complete call stack for targeted debugging
- Maintained semantic meaning of healing messages while eliminating warnings
- Implemented a minimally invasive solution that preserves existing behavior

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.38_BattleLogManagerHealingTypeFix.md*

## Version 0.6.3.37 (May 10, 2025)

### Fixed
- Fixed status effect warning issue in PassiveBehaviors.js by routing all effects through StatusEffectManager
- Eliminated "Creating minimal fallback for status effect" console warnings from passive abilities
- Enhanced PassiveBehaviors.js with centralized status effect handling
- Improved status effect tooltips for passive-applied effects

### Technical
- Implemented new applyStatusEffect helper function in PassiveBehaviors.js
- Modified 11 passive behavior functions to use the helper function
- Added comprehensive error handling and fallbacks for status effect application
- Created robust routing to ensure status effect definitions are properly propagated
- Maintained architectural principle that StatusEffectManager should be the consistent point of entry for status effects

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.37_PassiveBehaviorsStatusEffectRoutingFix.md*

## Version 0.6.3.36 (May 10, 2025)

### Improved
- Removed unnecessary debugging logs that were cluttering the console
- Removed verbose [DETAILED DEBUG] messages from CharacterSprite and ActionIndicator
- Streamlined console output by removing outdated debugging artifacts
- Eliminated call stack tracing that was left from previous debugging sessions

### Technical
- Cleaned up remnants of debugging code from v0.6.3.24 that were no longer needed
- Maintained normal logging infrastructure while removing excessive debug statements
- Improved code clarity by removing obsolete debugging code

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.36_DebuggingCleanup.md*

## Version 0.6.3.35 (May 10, 2025)

### Fixed
- Fixed status effect definition propagation in event system
- Eliminated "Creating minimal fallback for status effect" console warnings
- Improved tooltip display for passive-applied status effects
- Enhanced StatusEffectManager to properly include full definitions in events
- Fixed variable scope issue causing ReferenceError with passive abilities

### Technical
- Implemented new dispatchStatusEffectApplied method in StatusEffectManager
- Added multiple dispatch fallback mechanisms for compatibility
- Maintained component-responsibility principles in the event system
- Created complete event payload with all necessary status effect data
- Properly handled different code paths for existing vs. new status effects

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.35_StatusDefinitionPropagationFix.md*

## Version 0.6.3.34 (May 10, 2025)

### Fixed
- Fixed "Cannot read properties of null (reading 'cut')" error in StatusEffectTooltip.js by adding robust null checks
- Improved tooltip stability during scene transitions and rapid mouse movements

### Technical
- Enhanced defensive programming practices in UI components
- Implemented proper scene validity checking in UI components
- Added explicit resource cleanup in tooltip destruction process

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.34_StatusEffectTooltipFix.md*

## Version 0.6.3.33 (May 10, 2025)

### Technical
- Added enhanced debugging to diagnose the stat resolution issue in AoE abilities
- Implemented diagnostic logging in DamageCalculator to examine attacker object structure
- Added case-insensitive stat name handling to improve stat resolution reliability
- Added detailed actor object inspection in AbilityProcessor for AoE targets
- This debugging will pinpoint why attackerStat resolves to 0 for AoE ability targets

*Note: For detailed information on implementation, see CHANGELOG_0.6.3.33_AoEStatResolutionDebugging.md*

## Version 0.6.3.32 (May 10, 2025)

### Fixed
- Fixed AoE ability scaling factor issue in ActionGenerator - abilities like Frost Chain now correctly use their effect-specific scaling factors
- Modified ActionGenerator to properly extract and pass damage effects to DamageCalculator
- Ensures correct stat scaling text appears in battle log (+58 from Intellect for Frost Chain instead of +73)
- Improves ability balance by using the intended scaling factors for all AoE abilities

*Note: For detailed information on implementation, see CHANGELOG_0.6.3.32_ActionGeneratorScalingFactorFix.md*

## Version 0.6.3.31 (May 10, 2025)

### Improved
- Enhanced TeamBuilder UI layout with 2x2 grid for abilities display
- Fixed UI scrollbar issue by optimizing screen layout
- Implemented better positioning for abilities and battle options with grid layout
- Adjusted UI proportions to eliminate overlap between hero details and battle options
- Added visual separation between UI sections

*Note: For detailed information on implementation, see CHANGELOG_0.6.3.31_TeamBuilderLayoutEnhancement.md*

## Version 0.6.3.30 (May 10, 2025)

### Technical
- Added temporary debug logging to trace AoE ability scaling factor issue
- Implemented detailed effect property tracking in AbilityProcessor.processEffect
- Added logging for actor, target, and effect properties before damage calculation
- This debug logging will help identify why abilities like Frost Chain show incorrect stat scaling

*Note: For detailed information on debugging implementation, see CHANGELOG_0.6.3.30_AbilityProcessorDebugLogging.md*

## Version 0.6.3.29 (May 10, 2025)

### Technical
- Added temporary debugging for stat scaling factor issue investigation
- Implemented detailed tracing of scale factor usage throughout damage calculation
- Added diagnostic logging before and after scaling calculations to verify correct values
- Added check points for stat scaling text generation
- All debugging logs use [DEBUG-SCALING] prefix for easy filtering

*Note: For detailed information on debugging implementation, see CHANGELOG_0.6.3.29_ScalingFactorDebugging.md*

## Version 0.6.3.28 (May 10, 2025)

### Fixed
- Fixed an issue where abilities with effect-specific scaling factors (like Frost Chain) were using default values instead of their defined values
- Implemented hierarchical checking for ability scaling factors: effect-level → ability-level → default
- Added diagnostic logging to verify correct scaling factors are being applied
- This addresses a balance issue where abilities like Frost Chain were doing more damage than intended due to incorrect scaling

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.3.28_AbilityScalingFactorFix.md*