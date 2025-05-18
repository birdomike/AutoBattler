/**
 * AudioAssetMappings.js
 * 
 * Hierarchical sound mapping system for the AutoBattler game.
 * Provides organized sound file management with character-specific profiles,
 * ability-specific sounds, and fallback defaults. Uses logical key resolution
 * to map sound requests to specific audio file paths.
 * 
 * Resolution Priority: Ability-specific → Character-specific → Defaults
 */

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
    /**
     * Resolve a sound request to a specific file path
     * @param {Object} context - Sound resolution context
     * @param {string} context.type - 'autoAttack' or 'ability'
     * @param {string} context.event - Sound event type (e.g., 'impact', 'cast')
     * @param {string} [context.abilityId] - Ability identifier for ability sounds
     * @param {string} [context.characterKey] - Character profile key for character-specific sounds
     * @param {string} [context.autoAttackType] - 'melee' or 'ranged' for auto-attacks
     * @returns {Object|null} Sound result object or null
     */
    resolveSound(context) {
      const { type, event, abilityId, characterKey, autoAttackType } = context;
      
      try {
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
      } catch (error) {
        console.error(`AudioAssetMappings: Error resolving sound:`, error, context);
        return null;
      }
    },
    
    /**
     * Build a sound result object from a mapping configuration
     * @param {Object} mapping - Sound mapping configuration
     * @returns {Object|null} Sound result object
     */
    buildSoundResult(mapping) {
      if (!mapping) return null;
      
      try {
        if (mapping.variations && mapping.files) {
          const selectedFile = mapping.randomSelect 
            ? mapping.files[Math.floor(Math.random() * mapping.files.length)]
            : mapping.files[0];
          return {
            fullPath: this.basePath + mapping.path + selectedFile,
            hasVariations: true,
            totalVariations: mapping.files.length,
            selectedFile: selectedFile
          };
        } else {
          return {
            fullPath: this.basePath + mapping.path,
            hasVariations: false,
            totalVariations: 1,
            selectedFile: null
          };
        }
      } catch (error) {
        console.error(`AudioAssetMappings: Error building sound result:`, error, mapping);
        return null;
      }
    },
    
    /**
     * Get auto-attack sound file path
     * @param {string} autoAttackType - 'melee' or 'ranged'
     * @param {string} event - Sound event ('impact', 'movement', 'release', etc.)
     * @param {string} [characterKey] - Character profile key for character-specific sounds
     * @returns {Object|null} Sound result object
     */
    getAutoAttackSound(autoAttackType, event, characterKey = null) {
      return this.resolveSound({
        type: 'autoAttack',
        event: event,
        autoAttackType: autoAttackType,
        characterKey: characterKey
      });
    },
    
    /**
     * Get ability sound file path
     * @param {string} abilityId - Ability identifier
     * @param {string} event - Sound event ('cast', 'impact', 'effect', etc.)
     * @returns {Object|null} Sound result object
     */
    getAbilitySound(abilityId, event) {
      return this.resolveSound({
        type: 'ability',
        event: event,
        abilityId: abilityId
      });
    },

    /**
     * Test sound resolution system with example scenarios
     * @returns {Object} Test results
     */
    testSoundResolution() {
      const testCases = [
        // Auto-attack tests
        { desc: "Drakarion melee auto-attack impact", test: () => this.getAutoAttackSound('melee', 'impact', 'sword_warrior') },
        { desc: "Generic melee auto-attack impact", test: () => this.getAutoAttackSound('melee', 'impact') },
        { desc: "Sylvanna ranged auto-attack release", test: () => this.getAutoAttackSound('ranged', 'release', 'nature_ranger') },
        { desc: "Generic ranged auto-attack release", test: () => this.getAutoAttackSound('ranged', 'release') },
        
        // Ability tests
        { desc: "Drakarion Flame Strike cast", test: () => this.getAbilitySound('drakarion_flame_strike', 'cast') },
        { desc: "Aqualia Tidal Wave impact", test: () => this.getAbilitySound('aqualia_tidal_wave', 'impact') },
        { desc: "Unknown ability cast (fallback)", test: () => this.getAbilitySound('unknown_ability', 'cast') },
        
        // Edge cases
        { desc: "Invalid auto-attack type", test: () => this.getAutoAttackSound('invalid', 'impact') },
        { desc: "Invalid event type", test: () => this.getAutoAttackSound('melee', 'invalid') }
      ];

      console.group("AudioAssetMappings Sound Resolution Tests");
      const results = testCases.map(testCase => {
        try {
          const result = testCase.test();
          console.log(`✓ ${testCase.desc}:`, result);
          return { success: true, description: testCase.desc, result };
        } catch (error) {
          console.error(`✗ ${testCase.desc}:`, error);
          return { success: false, description: testCase.desc, error };
        }
      });
      console.groupEnd();

      const successCount = results.filter(r => r.success).length;
      console.log(`Sound resolution tests completed: ${successCount}/${results.length} passed`);
      
      return {
        totalTests: results.length,
        passed: successCount,
        failed: results.length - successCount,
        results: results
      };
    }
  }
};

// Convenience export for testing
export const testAudioMappings = () => AudioAssetMappings.helpers.testSoundResolution();
