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