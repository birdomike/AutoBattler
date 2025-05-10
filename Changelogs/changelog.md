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
- Added call stack tracking in Char