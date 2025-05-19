/**
 * AudioAssetMappings.js
 * 
 * 4-Tier Hierarchical sound mapping system for the AutoBattler game.
 * Provides organized sound file management with ability-specific overrides,
 * character-specific customizations, genre-specific shared sounds, and default fallbacks.
 * 
 * Resolution Priority: Ability-specific → Character-specific → Genre-specific → Defaults
 * 
 * v2.0 - Updated to match actual folder structure with genre_specific organization
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
        }
      },
      ranged: {
        release: {
          path: 'defaults/auto_attacks/ranged_release/Bow Attack 1.wav',
          variations: false
        },
        impact: {
          path: 'defaults/auto_attacks/ranged_impact/Bow Impact Hit 1.wav',
          variations: false
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

  // ============ GENRE-SPECIFIC SOUND MAPPINGS ============
  genre_specific: {
    'sword_melee_genre': {
      autoAttack: {
        melee: {
          impact: {
            path: 'genre_specific/Sword Melee Genre/',
            files: ['Sword Attack 1.wav', 'Sword Attack 2.wav', 'Sword Attack 3.wav'],
            variations: true,
            randomSelect: true
          }
        }
      }
    },
    'fire_caster': {
      autoAttack: {
        ranged: {
          release: {
            path: 'genre_specific/Fire_Caster/',
            files: ['Firespray 1.wav', 'Firespray 2.wav'],
            variations: true,
            randomSelect: true
          }
        }
      }
    },
    'frost_caster': {
      autoAttack: {
        ranged: {
          release: {
            path: 'genre_specific/Frost_Caster/',
            files: ['Ice Throw 1.wav', 'Ice Throw 2.wav'],
            variations: true,
            randomSelect: true
          }
        }
      }
    },
    'electric_caster': {
      autoAttack: {
        ranged: {
          release: {
            path: 'genre_specific/Electric_Caster/LightningStrike.mp3',
            variations: false
          }
        }
      }
    }
  },

  // ============ CHARACTER-SPECIFIC OVERRIDES ============
  character_specific: {
    'sylvanna': {
      autoAttack: {
        ranged: {
          release: {
            path: 'character_specific/Sylvanna/',
            files: ['Bow Attack 1.wav', 'Bow Attack 2.wav'],
            variations: true,
            randomSelect: true
          }
        }
      }
    }
  },

  // ============ ABILITY-SPECIFIC MAPPINGS ============
  abilities: {
    'zephyr_wind_slash': {
      cast: {
        path: 'ability_specific/Zephyr/Wind_Slash.mp3',
        variations: false
      }
    },
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
     * Resolve a sound request to a specific file path using 4-tier hierarchy
     * @param {Object} context - Sound resolution context
     * @param {string} context.type - 'autoAttack' or 'ability'
     * @param {string} context.event - Sound event type (e.g., 'impact', 'cast')
     * @param {string} [context.abilityId] - Ability identifier for ability sounds
     * @param {string} [context.characterKey] - Character profile key (can be 'character_specific/name' or 'genre_specific/genre')
     * @param {string} [context.autoAttackType] - 'melee' or 'ranged' for auto-attacks
     * @returns {Object|null} Sound result object or null
     */
    resolveSound(context) {
      const { type, event, abilityId, characterKey, autoAttackType } = context;
      
      try {
        console.log(`[AudioAssetMappings.resolveSound] === 4-TIER RESOLUTION DEBUG ===`);
        console.log(`  Input context:`, context);
        
        // 1. Ability-specific (highest priority)
        if (type === 'ability' && abilityId && AudioAssetMappings.abilities[abilityId]?.[event]) {
          console.log(`  ✅ TIER 1 HIT: Found ability-specific sound for '${abilityId}.${event}'`);
          const result = this.buildSoundResult(AudioAssetMappings.abilities[abilityId][event]);
          console.log(`  Built result from Tier 1:`, result);
          return result;
        }
        console.log(`  ❌ TIER 1 MISS: No ability-specific sound for '${abilityId}.${event}'`);
        
        // 2. Character-specific (high priority)
        if (type === 'autoAttack' && characterKey?.startsWith('character_specific/')) {
          const charName = characterKey.split('/')[1];
          if (AudioAssetMappings.character_specific[charName]?.autoAttack?.[autoAttackType]?.[event]) {
            console.log(`  ✅ TIER 2 HIT: Found character-specific sound`);
            return this.buildSoundResult(
              AudioAssetMappings.character_specific[charName].autoAttack[autoAttackType][event]
            );
          }
        }
        console.log(`  ❌ TIER 2 MISS: No character-specific sound`);
        
        // 3. Genre-specific (medium priority)
        if (type === 'autoAttack' && characterKey?.startsWith('genre_specific/')) {
          const genreName = characterKey.split('/')[1];
          if (AudioAssetMappings.genre_specific[genreName]?.autoAttack?.[autoAttackType]?.[event]) {
            console.log(`  ✅ TIER 3 HIT: Found genre-specific sound`);
            return this.buildSoundResult(
              AudioAssetMappings.genre_specific[genreName].autoAttack[autoAttackType][event]
            );
          }
        }
        console.log(`  ❌ TIER 3 MISS: No genre-specific sound`);
        
        // 4. Defaults (lowest priority)
        if (type === 'autoAttack' && AudioAssetMappings.defaults.autoAttack?.[autoAttackType]?.[event]) {
          console.log(`  ✅ TIER 4 HIT: Found default auto-attack sound`);
          return this.buildSoundResult(
            AudioAssetMappings.defaults.autoAttack[autoAttackType][event]
          );
        }
        
        // 5. Ultimate fallback for abilities
        if (type === 'ability' && AudioAssetMappings.defaults.abilities?.[event]) {
          console.log(`  ✅ TIER 4 HIT: Found default ability sound for '${event}'`);
          const result = this.buildSoundResult(AudioAssetMappings.defaults.abilities[event]);
          console.log(`  Built result from Tier 4:`, result);
          return result;
        }
        console.log(`  ❌ TIER 4 MISS: No default ability sound for '${event}'`);
        
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
            fullPath: AudioAssetMappings.basePath + mapping.path + selectedFile,
            hasVariations: true,
            totalVariations: mapping.files.length,
            selectedFile: selectedFile
          };
        } else {
          return {
            fullPath: AudioAssetMappings.basePath + mapping.path,
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
      console.log('[AudioAssetMappings.helpers.getAbilitySound] === RESOLUTION DEBUG START ===');
      console.log(`  abilityId received: '${abilityId}'`);
      console.log(`  event received: '${event}'`);
      
      // Check if abilityId exists in abilities mapping
      console.log(`  AudioAssetMappings.abilities['${abilityId}'] exists:`, !!AudioAssetMappings.abilities[abilityId]);
      if (AudioAssetMappings.abilities[abilityId]) {
        console.log(`  AudioAssetMappings.abilities['${abilityId}']['${event}'] exists:`, !!AudioAssetMappings.abilities[abilityId][event]);
        if (AudioAssetMappings.abilities[abilityId][event]) {
          console.log(`  Found Tier 1 ability mapping:`, AudioAssetMappings.abilities[abilityId][event]);
        }
      }
      
      // Call the main resolution logic
      const result = this.resolveSound({
        type: 'ability',
        event: event,
        abilityId: abilityId
      });
      
      console.log(`  Final resolution result:`, result);
      console.log('[AudioAssetMappings.helpers.getAbilitySound] === RESOLUTION DEBUG END ===');
      
      return result;
    },

    /**
     * Test sound resolution system with example scenarios for 4-tier hierarchy
     * @returns {Object} Test results
     */
    testSoundResolution() {
      const testCases = [
        // Genre-specific tests (sword melee genre)
        { desc: "Drakarion genre-specific melee impact", test: () => this.getAutoAttackSound('melee', 'impact', 'genre_specific/sword_melee_genre') },
        { desc: "Caste genre-specific melee impact", test: () => this.getAutoAttackSound('melee', 'impact', 'genre_specific/sword_melee_genre') },
        { desc: "Vaelgor genre-specific melee impact", test: () => this.getAutoAttackSound('melee', 'impact', 'genre_specific/sword_melee_genre') },
        
        // Character-specific tests (Sylvanna unique)
        { desc: "Sylvanna character-specific ranged release", test: () => this.getAutoAttackSound('ranged', 'release', 'character_specific/sylvanna') },
        
        // Default fallback tests
        { desc: "Generic melee auto-attack impact (default)", test: () => this.getAutoAttackSound('melee', 'impact') },
        { desc: "Generic ranged auto-attack release (default)", test: () => this.getAutoAttackSound('ranged', 'release') },
        
        // Ability tests
        { desc: "Drakarion Flame Strike cast (ability-specific)", test: () => this.getAbilitySound('drakarion_flame_strike', 'cast') },
        { desc: "Aqualia Tidal Wave impact (ability-specific)", test: () => this.getAbilitySound('aqualia_tidal_wave', 'impact') },
        { desc: "Unknown ability cast (fallback)", test: () => this.getAbilitySound('unknown_ability', 'cast') },
        
        // Edge cases
        { desc: "Invalid character key format", test: () => this.getAutoAttackSound('melee', 'impact', 'invalid_format') },
        { desc: "Non-existent genre", test: () => this.getAutoAttackSound('melee', 'impact', 'genre_specific/non_existent') },
        { desc: "Non-existent character", test: () => this.getAutoAttackSound('ranged', 'release', 'character_specific/non_existent') },
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
