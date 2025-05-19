/**
 * AbilityAnimationConfig.js
 * 
 * Single source of truth for all animation/sound presentation data in the AutoBattler game.
 * This file contains configurations for auto-attacks, abilities, character sound profiles,
 * and an inference system for automatically generating configurations for unmapped abilities.
 * 
 * Architecture: Separates game mechanics (characters.json) from presentation layer (this file)
 */

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
    // Genre-specific mappings (shared sounds for similar character types)
    'drakarion': 'genre_specific/sword_melee_genre',   // Fire warrior with sword
    'caste': 'genre_specific/sword_melee_genre',       // Metal berserker with sword
    'vaelgor': 'genre_specific/sword_melee_genre',     // Dark sentinel with sword
    'zephyr': 'genre_specific/sword_melee_genre',      // Air assassin with melee attacks
    'aqualia': 'genre_specific/frost_caster',          // Water/Ice mage (ice sounds for water magic)
    'nyria': 'genre_specific/frost_caster',            // Storm elementalist (ice sounds for storm magic)
    'zara': 'genre_specific/fire_caster',              // Fire mage character (if exists)
    'ignis': 'genre_specific/fire_caster',             // Fire-based character (if exists)
    
    // Character-specific mappings (truly unique sounds)
    'sylvanna': 'character_specific/sylvanna',         // Nature ranger with unique bow sounds
    
    // Default fallbacks (will use default sounds)
    'lumina': null                                     // Light cleric - uses default sounds
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
      // Will be imported from AudioAssetMappings
      const characterKey = this.characterSoundProfiles[character.name?.toLowerCase()] || 
                          this.characterSoundProfiles[character.id] || null;
      
      // This will call AudioAssetMappings.helpers.getAutoAttackSound when integrated
      console.log(`AbilityAnimationConfig: Getting auto-attack sound for ${character.name}, type: ${autoAttackType}, event: ${event}, profile: ${characterKey}`);
      return null; // Placeholder - will be implemented when AudioAssetMappings is integrated
    },
    
    getAbilitySound(abilityId, event) {
      // This will call AudioAssetMappings.helpers.getAbilitySound when integrated
      console.log(`AbilityAnimationConfig: Getting ability sound for ${abilityId}, event: ${event}`);
      return null; // Placeholder - will be implemented when AudioAssetMappings is integrated
    }
  }
};

/**
 * Smart Inference System for Auto-Generating Ability Configurations
 * 
 * This class provides automatic configuration generation for abilities not explicitly
 * defined in the AbilityAnimationConfig.abilities object. It uses existing character
 * data to infer appropriate visual and animation types.
 */
export class AbilityConfigInference {
  /**
   * Get configuration for an ability, using explicit config or inferring from character data
   * @param {string} abilityId - The ability identifier
   * @param {Object} characterData - Character data object containing abilities
   * @returns {Object} Ability configuration object
   */
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
  
  /**
   * Infer visual type from ability damage type
   * @param {Object} ability - Ability object
   * @returns {string} Visual type
   */
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
  
  /**
   * Infer animation type from ability target type
   * @param {Object} ability - Ability object
   * @returns {string} Animation type
   */
  static inferAnimationType(ability) {
    if (ability.targetType) {
      return AbilityAnimationConfig.inferenceRules.targetTypeToAnimation[ability.targetType] || 'instant';
    }
    return 'instant';
  }
  
  /**
   * Generate a default configuration with inferred types
   * @param {string} visualType - Inferred visual type
   * @param {string} animationType - Inferred animation type
   * @param {string} abilityId - Ability identifier for logging
   * @returns {Object} Generated configuration
   */
  static generateDefaultConfig(visualType, animationType, abilityId) {
    const template = AbilityAnimationConfig.inferenceRules.defaults[animationType];
    const config = JSON.parse(JSON.stringify(template));
    config.visualType = visualType;
    config.animationType = animationType;
    
    console.log(`AbilityConfigInference: Generated config for ${abilityId} - visual: ${visualType}, animation: ${animationType}`);
    return config;
  }
  
  /**
   * Find an ability in character data by ID
   * @param {string} abilityId - Ability identifier
   * @param {Object} characterData - Character data object
   * @returns {Object|null} Ability object or null if not found
   */
  static findAbilityInCharacterData(abilityId, characterData) {
    for (const character of characterData.characters) {
      if (character.abilities) {
        const ability = character.abilities.find(a => a.id === abilityId);
        if (ability) return ability;
      }
    }
    return null;
  }
  
  /**
   * Get a basic default configuration for unknown abilities
   * @returns {Object} Default configuration
   */
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
