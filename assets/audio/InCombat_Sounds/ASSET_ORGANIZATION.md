# Audio Asset Organization

This document explains the audio asset directory structure for the AutoBattler game.

## Directory Structure

### Genre-Specific Sounds
- `genre_specific/Sword Melee Genre/` - Shared sounds for sword fighter characters (Drakarion, Caste, Vaelgor)
- `genre_specific/Fire_Caster/` - Future fire-based caster sounds
- `genre_specific/Frost_Caster/` - Future frost-based caster sounds

### Character-Specific Sounds  
- `character_specific/Sylvanna/` - Unique bow attack sounds for Sylvanna

### Default Fallback Sounds
- `defaults/auto_attacks/melee_impact/` - Generic melee impact sounds
- `defaults/auto_attacks/melee_movement/` - Generic melee movement sounds  
- `defaults/auto_attacks/ranged_release/` - Generic ranged release sounds
- `defaults/auto_attacks/ranged_impact/` - Generic ranged impact sounds

### Ability-Specific Sounds (Future)
- `ability_specific/` - For completely unique ability sounds

## 4-Tier Resolution System
The sound system uses a 4-tier resolution hierarchy:
1. **Ability-specific** (highest priority)
2. **Character-specific** (e.g., Sylvanna's unique sounds)
3. **Genre-specific** (e.g., sword melee shared sounds)
4. **Defaults** (fallback for all characters)

## Notes
- The slap, woosh, and splash sound files in the root directory are source materials
- Copy these to the appropriate default folders as needed for fallback sounds
