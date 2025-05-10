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