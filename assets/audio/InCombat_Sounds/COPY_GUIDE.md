# Manual Sound File Organization Guide

## STEP 3: Sound File Copying Instructions

Copy the selected sound files from `C:\Personal\Sounds\` to the organized structure below. These mappings correspond to the AudioAssetMappings.js configuration.

## Required Sound Files (Priority Order):

### 1. DEFAULT AUTO-ATTACKS (Essential)
- **Source**: `C:\Personal\Sounds\FilmCow SFX - Hits & Crunches\punch flesh 13.wav`
- **Destination**: `assets\audio\InCombat_Sounds\defaults\auto_attacks\melee_impact\punch_flesh_13.wav`
- **Usage**: Default melee impact for Warriors, Berserkers, Sentinels, Assassins

### 2. CHARACTER-SPECIFIC SOUNDS (High Priority)
Copy these for sword warrior characters (Drakarion, Caste, Vaelgor):
- **Source**: `C:\Personal\Sounds\Free Fantasy SFX Pack By TomMusic\WAV Files\SFX\Attacks\Sword Attacks Hits and Blocks\Sword Attack 1.wav`
- **Destination**: `assets\audio\InCombat_Sounds\character_specific\sword_warrior\auto_attack\sword_attack_1.wav`

- **Source**: `C:\Personal\Sounds\Free Fantasy SFX Pack By TomMusic\WAV Files\SFX\Attacks\Sword Attacks Hits and Blocks\Sword Attack 2.wav`  
- **Destination**: `assets\audio\InCombat_Sounds\character_specific\sword_warrior\auto_attack\sword_attack_2.wav`

### 3. ABILITY-SPECIFIC SOUNDS (Medium Priority)
For Drakarion's Flame Strike:
- **Source**: Look for fire/flame buildup sound in your collection
- **Destination**: `assets\audio\InCombat_Sounds\ability_specific\flame_strike\cast\fire_buildup_intense.wav`

### 4. ADDITIONAL DEFAULTS (Lower Priority)
- Find bow/arrow release sounds → `defaults\auto_attacks\ranged_release\`
- Find arrow impact sounds → `defaults\auto_attacks\ranged_impact\`
- Find generic magic sounds → `defaults\abilities\`

## Directory Structure Created:
```
assets/audio/InCombat_Sounds/
├── defaults/
│   ├── auto_attacks/
│   │   ├── melee_impact/
│   │   ├── melee_movement/
│   │   ├── ranged_release/
│   │   └── ranged_impact/
│   └── abilities/
├── character_specific/
├── ability_specific/
└── environmental/
```

## Character Sound Profile Mappings:
- **drakarion** → sword_warrior profile
- **caste** → sword_warrior profile  
- **vaelgor** → sword_warrior profile
- **sylvanna** → nature_ranger profile
- **aqualia** → fire_mage profile
- **nyria** → storm_mage profile
- **zephyr** → wind_assassin profile
- **lumina** → uses defaults

## Testing After Copy:
After copying files, you can test sound resolution in the browser console:
```javascript
import('./js/data/AudioAssetMappings.js').then(module => {
    module.testAudioMappings();
});
```

This will show which sounds resolve successfully and which need additional files.
