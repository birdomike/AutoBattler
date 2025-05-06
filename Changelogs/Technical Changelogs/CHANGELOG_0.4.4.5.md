# CHANGELOG 0.4.5 - Passive Ability System Fixes

## Overview
This update focuses on fixing critical issues in the passive ability system that were causing battle disruptions, including infinite loops, NaN health values, and confusion between characters with the same name on different teams.

## Primary Issues Addressed

### 1. Infinite Damage Reflection Loop
**Problem**: When two characters both had the Damage Reflection passive ability, they would enter an infinite loop of reflecting damage back and forth, causing the battle to stall.

**Root Cause**: 
- No limit on how many times a passive ability could trigger per turn
- No validation to prevent reflections from triggering other reflections
- No team validation to avoid triggering reflection on allies

**Solution**:
- Implemented tracking system to record which passive abilities have triggered in a turn
- Added strict validation in the `passive_DamageReflectOnHit` function to prevent friendly fire
- Added proper damage amount validation to prevent reflections below a minimum threshold

### 2. Passive Abilities Used as Active Abilities
**Problem**: Passive abilities like "Natural Healing" were incorrectly being selected as active abilities during combat.

**Root Cause**:
- Insufficient filtering in `generateCharacterAction` to exclude passive abilities
- Simple check for `abilityType !== 'Passive'` was not handling all cases

**Solution**:
- Enhanced the filtering in `generateCharacterAction` to properly exclude all passive abilities
- Added multiple checks to catch passive abilities, including:
  - Check for explicit `abilityType === 'Passive'` flag
  - Check for passive-specific properties like `passiveTrigger` and `passiveBehavior`
  - Added debugging logs to show available active abilities

### 3. NaN Health Values
**Problem**: Characters' health would sometimes become NaN, corrupting all future calculations.

**Root Cause**:
- Unvalidated inputs in damage calculations
- Reflection amount calculations not accounting for edge cases

**Solution**:
- Implemented a comprehensive `applyDamage` method with thorough input validation
- Added health value recovery mechanism for invalid health values
- Added strict type checking for damage amounts
- Enhanced error handling with detailed logging

### 4. Team Identification and Confusion
**Problem**: Characters with the same name on different teams caused targeting confusion and incorrect healing application.

**Root Cause**:
- Insufficient uniqueness in character identification
- Team information not properly preserved in all contexts

**Solution**:
- Enhanced `prepareTeamForBattle` to create more robust uniqueIds
- Included team type in the uniqueId to prevent confusion between characters with the same name
- Fixed team assignment logic to be more reliable
- Added clearer team identifiers in battle log messages

## Technical Implementation Details

### New Classes and Methods
- Added `applyDamage` method to BattleManager.js with comprehensive validation
- Added tracking system for passive abilities triggered in a turn

### Updated Files
1. **BattleManager.js**:
   - Enhanced `generateCharacterAction` to better filter passive abilities
   - Added tracking for passive abilities triggered within a turn
   - Improved `prepareTeamForBattle` for better character uniqueness
   - Added robust `applyDamage` method with input validation

2. **PassiveBehaviors.js**:
   - Enhanced `passive_DamageReflectOnHit` with better validation
   - Added team checking to prevent friendly fire
   - Added stricter damage amount validation

### Validation Improvements
- Added strict type checking for all damage and healing operations
- Enhanced health value validation and recovery
- Added team relationship validation to prevent incorrect targeting
- Implemented passive trigger tracking to prevent multiple triggers

## Testing Notes
The fixes were verified by running battles with characters having reflection passives (like Vaelgor) on both teams. The key validation points were:

1. No infinite reflection loops occur between characters
2. All characters maintain valid health values throughout combat
3. Passive abilities are never used as active abilities
4. Characters with the same name on different teams are treated as separate entities
5. All battle log messages clearly indicate team affiliations

## Known Limitations
- The passive trigger tracking resets each turn, so the same passive can trigger again in subsequent turns
- Team identification still relies on 'player' and 'enemy' designations rather than numerical team IDs
