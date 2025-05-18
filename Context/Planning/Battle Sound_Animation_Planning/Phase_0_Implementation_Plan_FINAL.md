# **Phase 0 Implementation Plan: Data & Asset Foundation (FINAL)**
*Complete consolidated plan integrating selective sound management with visual/animation systems*

## **1. Confirmation of Understanding**

✅ **Key Architectural Principle Confirmed**: 
- **`characters.json`** will receive **ONLY** the `autoAttackType` property addition
- **All visual/audio presentation details** (animations, sounds, visual effects, timing sequences) will be managed in `AbilityAnimationConfig.js`
- The system will use **smart inference logic** to automatically determine `animationType` and `visualType` for abilities based on existing character data (`ability.effects[].damageType`, `ability.targetType`) without modifying the characters themselves
- **Selective sound control** with hierarchical lookup: ability-specific → character-specific → defaults
- This maintains clean separation between **game mechanics** and **presentation layer**

---

## **2. Detailed Steps for Each Sub-Category Goal**

### **2.1 Minimal Data Structure Modifications**

#### **2.1.1 Process for Adding `autoAttackType` to `characters.json`**

**Role-to-AutoAttackType Mapping Logic:**
```javascript
const ROLE_TO_AUTO_ATTACK_TYPE = {
  // Melee auto-attack characters (move to target)
  'Warrior': 'melee',
  'Berserker': 'melee', 
  'Sentinel': 'melee',
  'Assassin': 'melee',
  'Bulwark': 'melee',
  'Champion': 'melee',
  'Striker': 'melee',
  'Warden': 'melee',
  'Battlemage': 'melee',
  
  // Ranged auto-attack characters (projectile/magic)
  'Ranger': 'ranged',
  'Mage': 'ranged',
  'Invoker': 'ranged',
  'Sorcerer': 'ranged',
  'Summoner': 'ranged',
  'Occultist': 'ranged',
  'Mystic': 'ranged',
  'Wildcaller': 'ranged',
  'Emissary': 'ranged',
  'Elementalist': 'ranged',
  'Skirmisher': 'ranged',
  'Venomancer': 'ranged',
  'Trickster': 'ranged'
};
```

**Implementation Steps:**
1. **Read** current `characters.json` using `read_file`
2. **Parse** JSON and iterate through each character
3. **Map** each character's `role` to appropriate `autoAttackType`
4. **Add** the `autoAttackType` property to each character object
5. **Validate** that all characters have been updated
6. **Write** the updated JSON back using `edit_file`

**MCP Tools Usage:** 
- `read_file` → `edit_file` for `data/characters.json`

---

### **2.2 Comprehensive Presentation Configuration (`AbilityAnimationConfig.js`)**

#### **2.2.1 Complete Structure with Sound Integration**

```javascript
export const AbilityAnimationConfig = {
  // ============ AUTO-ATTACKS CONFIGURATION ============
  autoAttacks: {
    melee: {
      animation: {
        approach: { 
          duration: 400, 
          easing: 'Power2.easeOut',
          moveToTarget: true,
          rotationOnImpact: 5
        },
        strike: { 
          duration: 200,
          scaleImpact: 1.1,
          shakeIntensity: 3
        },
        return: { 
          duration: 400, 
          easing: 'Power2.easeIn',
          returnToOrigin: true
        }
      },
      sounds: {
        movement: {
          logicalKey: 'autoAttack.melee.movement',
          timing: 'approach_start'
        },
        impact: {
          logicalKey: 'autoAttack.melee.impact',
          timing: 'strike'
        }
      },
      effects: {
        impact: { name: 'sparks', duration: 300, particles: 10 },
        movement: { name: 'dust_trail', duration: 'approach_duration' }
      },
      timing: {
        totalSequence: 1000,
        phases: {
          approach: { start: 0, end: 400 },
          strike: { start: 400, end: 600 },
          return: { start: 600, end: 1000 }
        }
      }
    },
    
    ranged: {
      animation: {
        prepare: { duration: 300, scaling: 1.05, pullbackDistance: 15 },
        release: { duration: 150, releaseSnap: true, projectileSpawn: true }
      },
      projectile: {
        sprite: 'basic_arrow',
        speed: 1000,
        rotation: 'towards_target',
        trail: { enabled: true, length: 50, fadeRate: 0.5 }
      },
      sounds: {
        prepare: {
          logicalKey: 'autoAttack.ranged.prepare',
          timing: 'prepare_start'
        },
        release: {
          logicalKey: 'autoAttack.ranged.release',
          timing: 'release'
        },
        impact: {
          logicalKey: 'autoAttack.ranged.impact',
          timing: 'projectile_impact'
        }
      },
      timing: {
        totalSequence: 800,
        phases: {
          prepare: { start: 0, end: 300 },
          release: { start: 300, end: 450 },
          projectile_travel: { start: 450, end: 'impact' }
        }
      }
    }
  },

  // ============ ABILITIES CONFIGURATION ============
  abilities: {
    // Fire single-target projectile ability
    "drakarion_flame_strike": {
      visualType: "fire",
      animationType: "projectile",
      
      states: {
        preparation: {
          duration: 500,
          animation: 'caster_channel_fire',
          effects: ['red_aura_caster', 'fire_particles_gather']
        },
        casting: {
          duration: 300,
          animation: 'fire_projectile_launch',
          projectileSpawn: true
        },
        impact: {
          triggeredBy: 'CHARACTER_DAMAGED',
          duration: 400,
          effects: ['fire_explosion', 'burn_aura_target'],
          screenShake: { intensity: 2, duration: 200 }
        }
      },
      
      sounds: {
        cast: {
          logicalKey: 'ability.cast',
          abilitySpecific: true
        },
        projectile: {
          logicalKey: 'ability.projectile',
          abilitySpecific: true
        },
        impact: {
          logicalKey: 'ability.impact',
          abilitySpecific: true
        }
      },
      
      projectile: {
        type: 'dynamic',
        core: { sprite: 'fireball_core', scale: 1.2, rotation: 'towards_target' },
        particles: {
          texture: 'fire_particle',
          count: 25,
          trail: { length: 100, fade: true },
          emission: 'continuous'
        },
        physics: { speed: 800, gravity: -50, bounces: 0 }
      },
      
      timing: {
        totalSequence: 1200,
        phases: {
          preparation: { start: 0, end: 500 },
          casting: { start: 500, end: 800 },
          projectile_travel: { start: 800, end: 'impact' },
          aftermath: { start: 'impact', duration: 400 }
        }
      }
    },

    // Water AoE ability
    "aqualia_tidal_wave": {
      visualType: "water",
      animationType: "aoe",
      
      states: {
        preparation: {
          duration: 600,
          animation: 'caster_channel_water',
          effects: ['blue_aura_caster', 'water_particles_rise']
        },
        manifestation: {
          duration: 800,
          animation: 'tidal_wave_sweep',
          effects: ['wave_effect_all_enemies', 'water_splash_ground'],
          simultaneous: true
        },
        aftermath: {
          duration: 500,
          triggeredBy: ['CHARACTER_DAMAGED'],
          effects: ['water_puddles', 'mist_dissipate']
        }
      },
      
      sounds: {
        cast: {
          logicalKey: 'ability.cast',
          abilitySpecific: true
        },
        impact: {
          logicalKey: 'ability.impact',
          abilitySpecific: true
        }
      },
      
      environmental: {
        groundEffect: { name: 'water_puddles', duration: 3000, area: 'enemy_side' },
        lightingChange: { color: 'blue', intensity: 0.15, duration: 1000 }
      },
      
      timing: {
        totalSequence: 1900,
        phases: {
          preparation: { start: 0, end: 600 },
          manifestation: { start: 600, end: 1400 },
          aftermath: { start: 1400, end: 1900 }
        }
      }
    },

    // Light healing ability
    "lumina_divine_protection": {
      visualType: "light",
      animationType: "instant",
      
      states: {
        invocation: {
          duration: 600,
          animation: 'caster_pray',
          effects: ['golden_aura_expand', 'light_orbs_gather']
        },
        manifestation: {
          duration: 400,
          animation: 'divine_light_descend',
          effects: ['healing_light_beam', 'target_glow_gold'],
          instantEffect: true
        },
        completion: {
          duration: 500,
          triggeredBy: 'CHARACTER_HEALED',
          effects: ['divine_sparkles_fade', 'protective_aura']
        }
      },
      
      sounds: {
        cast: {
          logicalKey: 'ability.cast',
          abilitySpecific: true
        },
        effect: {
          logicalKey: 'ability.effect',
          abilitySpecific: true
        }
      },
      
      visualEffects: {
        healingBeam: {
          from: 'caster_position', to: 'target_position',
          color: 0xFFD700, width: 8, duration: 400,
          fadeIn: 100, fadeOut: 100
        },
        targetGlow: {
          color: 0xFFFFFF, intensity: 1.5,
          duration: 1000, pulsing: true
        }
      },
      
      timing: {
        totalSequence: 1500,
        phases: {
          invocation: { start: 0, end: 600 },
          manifestation: { start: 600, end: 1000 },
          completion: { start: 1000, end: 1500 }
        }
      }
    }
  },

  // ============ CHARACTER-SPECIFIC SOUND PROFILES ============
  characterSoundProfiles: {
    // Map character IDs/names to sound profile keys
    'drakarion': 'sword_warrior',     // Uses sword attack sounds
    'caste': 'sword_warrior',         // Also uses sword sounds
    'sylvanna': 'nature_ranger',      // Uses nature bow sounds
    'aqualia': 'fire_mage',           // Uses magical staff sounds
    'vaelgor': 'sword_warrior',       // Dark warrior with sword
    'lumina': null,                   // Uses defaults - staff/magic sounds
    'zephyr': 'wind_assassin',        // Wind-themed melee
    'nyria': 'storm_mage'             // Storm-themed ranged magic
  },

  // ============ INFERENCE SYSTEM RULES ============
  inferenceRules: {
    damageTypeToVisual: {
      "fire": "fire", "water": "water", "ice": "ice", "nature": "nature",
      "air": "air", "dark": "dark", "light": "light", "storm": "storm",
      "metal": "metal", "physical": "physical", "healing": "light",
      "spell": "magic", "utility": "magic"
    },
    
    targetTypeToAnimation: {
      "SingleEnemy": "projectile", "AllEnemies": "aoe", "AdjacentEnemies": "sweep",
      "Self": "instant", "SingleAlly": "instant", "LowestHpAlly": "instant",
      "AllCharacters": "aoe", "AllAllies": "aoe"
    },
    
    defaults: {
      projectile: {
        states: {
          preparation: { duration: 400 },
          casting: { duration: 300 },
          impact: { duration: 300 }
        },
        sounds: {
          cast: { logicalKey: 'ability.cast', abilitySpecific: false },
          impact: { logicalKey: 'ability.impact', abilitySpecific: false }
        },
        timing: { totalSequence: 1000 }
      },
      aoe: {
        states: {
          preparation: { duration: 500 },
          manifestation: { duration: 600 },
          aftermath: { duration: 400 }
        },
        sounds: {
          cast: { logicalKey: 'ability.cast', abilitySpecific: false },
          impact: { logicalKey: 'ability.impact', abilitySpecific: false }
        },
        timing: { totalSequence: 1500 }
      },
      instant: {
        states: {
          invocation: { duration: 400 },
          manifestation: { duration: 300 },
          completion: { duration: 300 }
        },
        sounds: {
          cast: { logicalKey: 'ability.cast', abilitySpecific: false },
          effect: { logicalKey: 'ability.effect', abilitySpecific: false }
        },
        timing: { totalSequence: 1000 }
      }
    }
  },

  // ============ HELPER METHODS ============
  helpers: {
    getCharacterAutoAttackSound(character, autoAttackType, event) {
      const characterKey = this.characterSoundProfiles[character.name?.toLowerCase()] || 
                          this.characterSoundProfiles[character.id] || null;
      return AudioAssetMappings.helpers.getAutoAttackSound(autoAttackType, event, characterKey);
    },
    
    getAbilitySound(abilityId, event) {
      return AudioAssetMappings.helpers.getAbilitySound(abilityId, event);
    }
  }
};
```

#### **2.2.2 Smart Inference System Implementation**

```javascript
export class AbilityConfigInference {
  static getConfigForAbility(abilityId, characterData) {
    // 1. Check for explicit configuration
    if (AbilityAnimationConfig.abilities[abilityId]) {
      console.log(`AbilityConfigInference: Found explicit config for ${abilityId}`);
      return AbilityAnimationConfig.abilities[abilityId];
    }
    
    // 2. Find ability in character data and infer
    const ability = this.findAbilityInCharacterData(abilityId, characterData);
    if (!ability) {
      console.warn(`AbilityConfigInference: Ability ${abilityId} not found`);
      return this.getDefaultConfig();
    }
    
    // 3. Infer visual and animation types
    const visualType = this.inferVisualType(ability);
    const animationType = this.inferAnimationType(ability);
    
    // 4. Generate configuration with inferred types
    return this.generateDefaultConfig(visualType, animationType, abilityId);
  }
  
  static inferVisualType(ability) {
    // Check effect damage type first
    if (ability.effects?.length > 0 && ability.effects[0].damageType) {
      return AbilityAnimationConfig.inferenceRules.damageTypeToVisual[ability.effects[0].damageType] || 'magic';
    }
    // Fallback to ability damage type
    if (ability.damageType) {
      return AbilityAnimationConfig.inferenceRules.damageTypeToVisual[ability.damageType] || 'magic';
    }
    return 'magic';
  }
  
  static inferAnimationType(ability) {
    if (ability.targetType) {
      return AbilityAnimationConfig.inferenceRules.targetTypeToAnimation[ability.targetType] || 'instant';
    }
    return 'instant';
  }
  
  static generateDefaultConfig(visualType, animationType, abilityId) {
    const template = AbilityAnimationConfig.inferenceRules.defaults[animationType];
    const config = JSON.parse(JSON.stringify(template));
    config.visualType = visualType;
    config.animationType = animationType;
    
    console.log(`AbilityConfigInference: Generated config for ${abilityId} - visual: ${visualType}, animation: ${animationType}`);
    return config;
  }
  
  // Helper methods
  static findAbilityInCharacterData(abilityId, characterData) {
    for (const character of characterData.characters) {
      if (character.abilities) {
        const ability = character.abilities.find(a => a.id === abilityId);
        if (ability) return ability;
      }
    }
    return null;
  }
  
  static getDefaultConfig() {
    return {
      visualType: 'magic',
      animationType: 'instant',
      states: { manifestation: { duration: 500 } },
      sounds: { cast: { logicalKey: 'ability.cast', abilitySpecific: false } },
      timing: { totalSequence: 500 }
    };
  }
}
```

---

### **2.3 Asset Organization**

#### **2.3.1 Audio Asset Directory Structure**
```
assets/audio/InCombat_Sounds/
├── defaults/
│   ├── auto_attacks/
│   │   ├── melee_impact/punch_flesh_13.wav          # Default melee impact
│   │   ├── melee_movement/footstep_heavy.wav        # Default melee movement  
│   │   ├── ranged_release/
│   │   │   ├── bow_release_1.wav                    # Default ranged release
│   │   │   ├── bow_release_2.wav                    # Variation 1
│   │   │   └── bow_release_3.wav                    # Variation 2
│   │   └── ranged_impact/
│   │       ├── arrow_impact_1.wav                   # Default ranged impact
│   │       └── arrow_impact_2.wav                   # Variation
│   └── abilities/
│       ├── generic_cast/magic_buildup.wav           # Generic ability cast
│       └── generic_impact/magic_impact.wav          # Generic ability impact
├── character_specific/
│   ├── sword_warrior/
│   │   ├── auto_attack/
│   │   │   ├── sword_attack_1.wav                   # Sword impact
│   │   │   └── sword_attack_2.wav                   # Sword variation
│   │   └── movement/armor_clank.wav                 # Armored movement
│   ├── nature_ranger/
│   │   └── auto_attack/
│   │       ├── nature_bow_1.wav                     # Nature bow sound
│   │       └── nature_bow_2.wav                     # Nature variation
│   ├── fire_mage/
│   │   └── auto_attack/fire_staff_whoosh.wav        # Fire staff ranged
│   ├── storm_mage/
│   │   └── auto_attack/lightning_crackle.wav        # Storm magic ranged
│   └── wind_assassin/
│       └── auto_attack/wind_slice.wav               # Wind melee attack
├── ability_specific/
│   ├── flame_strike/
│   │   ├── cast/fire_buildup_intense.wav            # Flame Strike cast
│   │   ├── projectile/fireball_travel.wav           # Fireball travel
│   │   └── impact/
│   │       ├── fire_explosion_1.wav                 # Impact variation 1
│   │       └── fire_explosion_2.wav                 # Impact variation 2
│   ├── tidal_wave/
│   │   ├── cast/ocean_gathering.wav                 # Tidal Wave preparation
│   │   └── impact/massive_splash.wav                # Tidal Wave impact
│   └── divine_protection/
│       ├── cast/holy_invocation.wav                 # Divine cast
│       └── effect/healing_chime.wav                 # Healing effect
└── environmental/
    ├── ambient/battle_atmosphere.wav                # Background ambience
    └── reactions/
        ├── damage_grunt_generic.wav                 # Generic damage reaction
        ├── healing_sigh.wav                         # Generic healing reaction
        └── death_fall.wav                           # Character defeat
```

#### **2.3.2 Projectile Image Asset Organization**
```
assets/images/projectiles/
├── basic/
│   ├── basic_arrow.png                              # Default arrow (32x8px)
│   ├── magic_bolt.png                               # Generic magic projectile (24x8px)
│   └── particle.png                                 # Basic particle texture (4x4px)
├── elemental/
│   ├── fire/
│   │   ├── fireball_core.png                        # Fireball center (24x24px)
│   │   └── fire_particle.png                        # Fire particle (8x8px)
│   ├── water/
│   │   ├── water_bolt.png                           # Water projectile (16x16px)
│   │   └── water_particle.png                       # Water droplet (6x6px)
│   ├── ice/
│   │   └── ice_shard.png                            # Ice projectile (20x12px)
│   ├── lightning/
│   │   └── lightning_bolt.png                       # Lightning streak (40x8px)
│   └── nature/
│       └── thorn_projectile.png                     # Nature projectile (16x12px)
└── effects/
    ├── trails/
    │   ├── fire_trail.png                           # Fire trail texture (16x16px)
    │   └── magic_trail.png                          # Generic magic trail (12x12px)
    └── impacts/
        ├── spark_burst.png                          # Impact sparks (32x32px)
        └── magic_burst.png                          # Magic impact (24x24px)
```

---

### **2.4 AudioAssetMappings.js Structure**

```javascript
export const AudioAssetMappings = {
  basePath: 'assets/audio/InCombat_Sounds/',
  
  // ============ DEFAULT SOUND MAPPINGS ============
  defaults: {
    autoAttack: {
      melee: {
        impact: {
          path: 'defaults/auto_attacks/melee_impact/punch_flesh_13.wav',
          variations: false
        },
        movement: {
          path: 'defaults/auto_attacks/melee_movement/footstep_heavy.wav',
          variations: false
        }
      },
      ranged: {
        release: {
          path: 'defaults/auto_attacks/ranged_release/',
          files: ['bow_release_1.wav', 'bow_release_2.wav', 'bow_release_3.wav'],
          variations: true,
          randomSelect: true
        },
        impact: {
          path: 'defaults/auto_attacks/ranged_impact/',
          files: ['arrow_impact_1.wav', 'arrow_impact_2.wav'],
          variations: true,
          randomSelect: true
        }
      }
    },
    abilities: {
      cast: {
        path: 'defaults/abilities/generic_cast/magic_buildup.wav',
        variations: false
      },
      impact: {
        path: 'defaults/abilities/generic_impact/magic_impact.wav',
        variations: false
      }
    }
  },

  // ============ CHARACTER-SPECIFIC OVERRIDES ============
  characters: {
    'sword_warrior': {
      autoAttack: {
        melee: {
          impact: {
            path: 'character_specific/sword_warrior/auto_attack/',
            files: ['sword_attack_1.wav', 'sword_attack_2.wav'],
            variations: true,
            randomSelect: true
          },
          movement: {
            path: 'character_specific/sword_warrior/movement/armor_clank.wav',
            variations: false
          }
        }
      }
    },
    'nature_ranger': {
      autoAttack: {
        ranged: {
          release: {
            path: 'character_specific/nature_ranger/auto_attack/',
            files: ['nature_bow_1.wav', 'nature_bow_2.wav'],
            variations: true,
            randomSelect: true
          }
        }
      }
    },
    'fire_mage': {
      autoAttack: {
        ranged: {
          release: {
            path: 'character_specific/fire_mage/auto_attack/fire_staff_whoosh.wav',
            variations: false
          }
        }
      }
    },
    'storm_mage': {
      autoAttack: {
        ranged: {
          release: {
            path: 'character_specific/storm_mage/auto_attack/lightning_crackle.wav',
            variations: false
          }
        }
      }
    },
    'wind_assassin': {
      autoAttack: {
        melee: {
          impact: {
            path: 'character_specific/wind_assassin/auto_attack/wind_slice.wav',
            variations: false
          }
        }
      }
    }
  },

  // ============ ABILITY-SPECIFIC MAPPINGS ============
  abilities: {
    'drakarion_flame_strike': {
      cast: {
        path: 'ability_specific/flame_strike/cast/fire_buildup_intense.wav',
        variations: false
      },
      projectile: {
        path: 'ability_specific/flame_strike/projectile/fireball_travel.wav',
        variations: false
      },
      impact: {
        path: 'ability_specific/flame_strike/impact/',
        files: ['fire_explosion_1.wav', 'fire_explosion_2.wav'],
        variations: true,
        randomSelect: true
      }
    },
    'aqualia_tidal_wave': {
      cast: {
        path: 'ability_specific/tidal_wave/cast/ocean_gathering.wav',
        variations: false
      },
      impact: {
        path: 'ability_specific/tidal_wave/impact/massive_splash.wav',
        variations: false
      }
    },
    'lumina_divine_protection': {
      cast: {
        path: 'ability_specific/divine_protection/cast/holy_invocation.wav',
        variations: false
      },
      effect: {
        path: 'ability_specific/divine_protection/effect/healing_chime.wav',
        variations: false
      }
    }
  },

  // ============ HELPER METHODS ============
  helpers: {
    resolveSound(context) {
      const { type, event, abilityId, characterKey, autoAttackType } = context;
      
      // 1. Check ability-specific first
      if (type === 'ability' && abilityId && this.abilities[abilityId]?.[event]) {
        return this.buildSoundResult(this.abilities[abilityId][event]);
      }
      
      // 2. Check character-specific override
      if (type === 'autoAttack' && characterKey && 
          this.characters[characterKey]?.autoAttack?.[autoAttackType]?.[event]) {
        return this.buildSoundResult(
          this.characters[characterKey].autoAttack[autoAttackType][event]
        );
      }
      
      // 3. Fall back to default
      if (type === 'autoAttack' && this.defaults.autoAttack?.[autoAttackType]?.[event]) {
        return this.buildSoundResult(
          this.defaults.autoAttack[autoAttackType][event]
        );
      }
      
      // 4. Ultimate fallback for abilities
      if (type === 'ability' && this.defaults.abilities?.[event]) {
        return this.buildSoundResult(this.defaults.abilities[event]);
      }
      
      console.warn(`AudioAssetMappings: Could not resolve sound for`, context);
      return null;
    },
    
    buildSoundResult(mapping) {
      if (!mapping) return null;
      
      if (mapping.variations && mapping.files) {
        const selectedFile = mapping.randomSelect 
          ? mapping.files[Math.floor(Math.random() * mapping.files.length)]
          : mapping.files[0];
        return {
          fullPath: this.basePath + mapping.path + selectedFile,
          hasVariations: true,
          totalVariations: mapping.files.length
        };
      } else {
        return {
          fullPath: this.basePath + mapping.path,
          hasVariations: false,
          totalVariations: 1
        };
      }
    },
    
    getAutoAttackSound(autoAttackType, event, characterKey = null) {
      return this.resolveSound({
        type: 'autoAttack',
        event: event,
        autoAttackType: autoAttackType,
        characterKey: characterKey
      });
    },
    
    getAbilitySound(abilityId, event) {
      return this.resolveSound({
        type: 'ability',
        event: event,
        abilityId: abilityId
      });
    }
  }
};
```

---

## **3. New Files to Create (Boilerplate Structure)**

### **3.1 `js/data/AbilityAnimationConfig.js`**
- Complete structure with auto-attack configurations
- Example ability configurations (Flame Strike, Tidal Wave, Divine Protection)
- Sound integration with logical keys and character profiles
- Inference system with helper class
- Visual animation definitions and timing sequences

### **3.2 `js/data/AudioAssetMappings.js`**
- Hierarchical sound mapping structure
- Default, character-specific, and ability-specific sound definitions
- Helper methods for sound resolution and variation selection
- Integration with selective sound file management

---

## **4. Physical File Movement (Manual Process)**

You will manually copy selected sound files from `C:\Personal\Sounds\` to the organized project structure:

**Examples:**
- `C:\Personal\Sounds\FilmCow SFX - Hits & Crunches\punch flesh 13.wav`
  → `assets/audio/InCombat_Sounds/defaults/auto_attacks/melee_impact/punch_flesh_13.wav`

- `C:\Personal\Sounds\Free Fantasy SFX Pack By TomMusic\WAV Files\SFX\Attacks\Sword Attacks Hits and Blocks\Sword Attack 1.wav`
  → `assets/audio/InCombat_Sounds/character_specific/sword_warrior/auto_attack/sword_attack_1.wav`

---

## **5. Potential Challenges and Questions**

1. **Sound File Organization**: Managing the selective copying and organization of 20-30 chosen sound files
2. **Character Profile Consistency**: Ensuring character names/IDs map correctly to sound profiles
3. **Inference Edge Cases**: Some abilities might not map cleanly to visual/animation types
4. **Asset Path Validation**: Confirming all file paths in mappings are correct after manual file copying
5. **Backward Compatibility**: Ensuring existing systems continue working during Phase 0 implementation
6. **Integration Testing**: Verifying that AbilityAnimationConfig.js and AudioAssetMappings.js work together correctly

---

## **6. MCP Tool Usage Plan**

### **File Operations:**
- `read_file` - For reading current `data/characters.json`
- `edit_file` - For adding `autoAttackType` to `characters.json`
- `write_file` - For creating `AbilityAnimationConfig.js` and `AudioAssetMappings.js`
- `create_directory` - For establishing new asset folder structure
- `list_directory` - For verifying existing audio asset inventory

### **Validation Operations:**
- `read_file` - For validating updated `characters.json` structure
- `get_file_info` - For checking file existence after manual sound file copying

---

## **7. Success Criteria for Phase 0**

- [ ] All characters in `characters.json` have **only** the `autoAttackType` property added
- [ ] `AbilityAnimationConfig.js` loads without errors and provides complete presentation configuration
- [ ] `AudioAssetMappings.js` correctly maps all sound logical keys to specific file paths
- [ ] Inference system successfully generates configurations for unmapped abilities
- [ ] Character sound profiles correctly resolve to appropriate sound files
- [ ] Asset directory structure is established and organized
- [ ] All placeholder projectile images are created with appropriate dimensions
- [ ] **No existing game functionality is broken** by these foundational changes

---

This is the complete, final Phase 0 implementation plan that integrates selective sound management with the visual/animation system foundation. The plan maintains strict separation of concerns while providing comprehensive presentation layer configuration and smart inference capabilities.
