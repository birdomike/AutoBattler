# CHANGELOG 0.4.4.7 - Passive Ability System Enhancements

## Overview
This update focuses on expanding the passive ability system with more advanced behaviors, visual feedback, and enhanced trigger points. It adds three new passive behavior types, improves battle feedback with visual indicators, and introduces a new character that showcases these enhanced systems.

## Primary Enhancements

### 1. New Advanced Passive Behaviors
Added three new passive behavior types to `PassiveBehaviors.js`:

1. **passive_OnKillEffect**: Triggers various effects when a character kills an enemy
   - Supports healing, buffs, or AoE damage effects
   - Configurable through `passiveData` with options for effect type, value, and duration
   - Example implementation on the new Riven character's "Bloodthirst" passive

2. **passive_CriticalHitBoost**: Increases critical hit chance after specific triggers
   - Configurable triggers (e.g., after dealing significant damage)
   - Customizable duration and bonus amount via `passiveData`
   - Includes validation for trigger conditions (damage threshold)

3. **passive_StatusOnHit**: Chance to apply status effects when hitting enemies
   - Configurable status type, chance, and duration
   - Provides appropriate feedback messages
   - Implements randomized chance mechanics

### 2. Passive Ability Visual Feedback
Added a new `showPassiveEffect` method to `BattleUI.js` that provides visual feedback when passive abilities trigger:

- Purple text notification appears above the character
- Glowing effect animation surrounds the character
- Custom animation styles for passive effects
- Improved user experience by making passive triggers more visible

Implementation details:
```javascript
showPassiveEffect(character, effectName) {
    // Display visual effect above character
    const passiveEffect = document.createElement('div');
    passiveEffect.className = 'passive-effect';
    passiveEffect.textContent = '✨ ' + effectName;
    
    // Add glow effect to character
    const glowEffect = document.createElement('div');
    glowEffect.className = 'passive-glow';
    glowEffect.style.boxShadow = '0 0 15px 5px rgba(128, 0, 255, 0.6)';
    glowEffect.style.animation = 'passive-glow 1s ease-out';
    
    // Custom animation keyframes
    // @keyframes passive-glow {...}
}
```

### 3. Enhanced Trigger Points in BattleManager
Modified the `BattleManager.js` to include additional data and visual feedback for passive triggers:

1. **Added percentage calculations**:
   - Damage percentage relative to target's max HP
   - Healing percentage relative to target's max HP
   - Provides context for threshold-based passive abilities

2. **Enhanced kill effect handling**:
   - Added result collection and processing
   - Extracts passive names from result messages
   - Triggers visual feedback for successful passive activations

3. **Added visual feedback for healing triggers**:
   - Shows feedback for both healer and target
   - Includes healing percentage data
   - Enhances visibility of passive healing effects

## New Character: Riven

Added a new character "Riven" to `characters.json` that showcases the enhanced passive system:

- **Role**: Berserker
- **Type**: Metal
- **Active Abilities**:
  - "Shatter Blade": High damage attack with armor break
  - "Battle Fury": Self-buff increasing attack, speed, and critical chance

- **Passive Abilities**:
  1. "Bloodthirst": Heals for 10% of max HP when defeating an enemy
     - Uses `passive_OnKillEffect` with heal configuration
  2. "Battle Mastery": Increases critical chance after dealing significant damage
     - Uses `passive_CriticalHitBoost` with 20% bonus and 2-turn duration

## Code Modifications

### 1. PassiveBehaviors.js
- Added three new passive behavior functions
- Updated behavior registration
- Updated exports list

### 2. BattleUI.js
- Added `showPassiveEffect` method
- Added passive glow animation styles
- Enhanced visual feedback system

### 3. BattleManager.js
- Enhanced damage trigger data with percentage calculations
- Added healing trigger visual feedback
- Improved kill effect processing with result handling

### 4. characters.json
- Added new character "Riven" with passive abilities

## Testing Points
1. Test kill effects with Riven defeating enemies
2. Verify visual feedback appears for passive triggers
3. Confirm critical hit boost activates after significant damage
4. Test damage percentage threshold mechanics

## Known Limitations
- Visual effects may overlap with other battle animations
- Specific character art for Riven is not yet implemented (uses positioning only)
- Multiple simultaneous passive triggers show only one visual effect
