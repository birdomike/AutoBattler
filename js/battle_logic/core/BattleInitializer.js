/**
 * BattleInitializer.js
 * Handles initialization and preparation of battle data and components
 */

class BattleInitializer {
    /**
     * Create a new Battle Initializer
     * @param {Object} battleManager - The main battle manager
     */
    constructor(battleManager) {
        this.battleManager = battleManager;
        
        // Store references to dependencies to avoid frequent property access
        this.passiveTriggerTracker = battleManager.passiveTriggerTracker;
    }

    /**
     * Initialize teams and characters for battle
     * @param {Array} rawPlayerTeam - Raw player team data
     * @param {Array} rawEnemyTeam - Raw enemy team data
     * @returns {Object} - Object with playerTeam and enemyTeam properties
     */
    initializeTeamsAndCharacters(rawPlayerTeam, rawEnemyTeam) {
        console.log(`[BattleInitializer] Initializing teams for battle`);
        
        // Reset passive tracking for the new battle if available
        if (this.passiveTriggerTracker) {
            this.passiveTriggerTracker.resetBattleTracking();
        } else {
            console.warn("[BattleInitializer] PassiveTriggerTracker not available for battle reset");
        }
        
        // Process teams with JSON.parse/stringify to ensure independence
        const processedPlayerTeam = JSON.parse(JSON.stringify(rawPlayerTeam || []));
        const processedEnemyTeam = JSON.parse(JSON.stringify(rawEnemyTeam || []));
        
        // Perform enhanced initialization of teams
        const initializedPlayerTeam = this.ensureCompleteCharacterInitialization(
            processedPlayerTeam, 
            'player'
        );
        
        const initializedEnemyTeam = this.ensureCompleteCharacterInitialization(
            processedEnemyTeam, 
            'enemy'
        );
        
        console.log(`[BattleInitializer] Teams initialized: ${initializedPlayerTeam.length} players, ${initializedEnemyTeam.length} enemies`);
        
        return {
            playerTeam: initializedPlayerTeam,
            enemyTeam: initializedEnemyTeam
        };
    }

    /**
     * Force initialization of character stats and properties
     * @param {Array} team - Team of characters to initialize
     * @param {string} teamType - 'player' or 'enemy'
     * @returns {Array} Initialized team
     */
    ensureCompleteCharacterInitialization(team, teamType) {
        if (!team || !Array.isArray(team)) {
            console.error(`[BattleInitializer] Cannot initialize ${teamType} team: Invalid or missing team data`);
            return [];
        }
        
        console.log(`[BattleInitializer] Starting initialization for ${teamType} team with ${team.length} characters`);
        
        // Create complete team with proper initialization
        return team.map((character, index) => {
            // Skip invalid characters
            if (!character) {
                console.warn(`[BattleInitializer] Skipping invalid character at index ${index} in ${teamType} team`);
                return null;
            }
            
            try {
                // Create a new character object with all required properties
                const completeChar = {
                    ...character,
                    name: character.name || `Unknown ${teamType} ${index}`,
                    team: teamType,
                    uniqueId: character.uniqueId || `${teamType}_${character.name || 'unknown'}_${character.id || index}`,
                    id: character.id || `char_${Math.random().toString(36).substr(2, 9)}`,
                    currentHp: character.currentHp !== undefined ? character.currentHp : (character.stats?.hp || 100),
                    isDead: character.isDead || false
                };
                
                // Ensure stats object exists and has required properties
                completeChar.stats = completeChar.stats || {};
                completeChar.stats.hp = completeChar.stats.hp || 100;
                completeChar.stats.attack = completeChar.stats.attack || 10;
                completeChar.stats.defense = completeChar.stats.defense || 5;
                completeChar.stats.speed = completeChar.stats.speed || 10;
                completeChar.stats.strength = completeChar.stats.strength || 10;
                completeChar.stats.intellect = completeChar.stats.intellect || 10;
                completeChar.stats.spirit = completeChar.stats.spirit || 10;
                
                // Ensure abilities array exists
                completeChar.abilities = Array.isArray(completeChar.abilities) ? completeChar.abilities : [];
                
                // Initialize ability cooldowns and identify passive abilities
                completeChar.passiveAbilities = [];
                
                // Filter out any undefined abilities and ensure all abilities have basic properties
                completeChar.abilities = completeChar.abilities.filter(ability => ability != null).map(ability => {
                    // Ensure ability has basic required properties
                    ability.name = ability.name || 'Unnamed Ability';
                    ability.id = ability.id || `ability_${Math.random().toString(36).substr(2, 9)}`;
                    ability.currentCooldown = ability.currentCooldown || 0;
                    return ability;
                });
                
                // Now identify passive abilities after filtering
                completeChar.abilities.forEach(ability => {
                    // Identify passive abilities and store them separately for quick reference
                    if (ability.abilityType === 'Passive') {
                        completeChar.passiveAbilities.push(ability);
                    }
                });
                
                // Do final validation check for critical properties
                if (!completeChar.name) {
                    console.error(`[BattleInitializer] Character initialization missing name property after processing, using default`);
                    completeChar.name = `Unknown ${teamType} ${index}`;
                }
                
                if (typeof completeChar.currentHp !== 'number') {
                    console.error(`[BattleInitializer] Character ${completeChar.name} has invalid currentHp after processing, using default`);
                    completeChar.currentHp = completeChar.stats.hp || 100;
                }
                
                console.log(`[BattleInitializer] Completed initialization for ${completeChar.name} (${teamType})`);
                return completeChar;
            } catch (error) {
                console.error(`[BattleInitializer] Error during character initialization at index ${index}:`, error);
                console.error(`[BattleInitializer] Character data that caused error:`, JSON.stringify(character));
                // Return null to filter out this character
                return null;
            }
        }).filter(char => char !== null); // Filter out any null entries
    }
    
    /**
     * Prepare a team for battle by setting initial values
     * @param {Array} team - Array of character objects
     * @param {string} teamType - 'player' or 'enemy'
     * @returns {Array} - Prepared team for battle
     */
    prepareTeamForBattle(team, teamType) {
        // Validate input parameters
        if (!team || !Array.isArray(team)) {
            console.error(`[BattleInitializer] Invalid team provided for ${teamType}, using empty array`);
            return [];
        }
        
        if (!teamType || (teamType !== 'player' && teamType !== 'enemy')) {
            console.error(`[BattleInitializer] Invalid teamType '${teamType}', must be 'player' or 'enemy'`);
            return [];
        }
        
        console.log(`[BattleInitializer] Preparing ${teamType} team with ${team.length} characters`);
        
        // Map characters to battle-ready format and filter out nulls
        const preparedTeam = team.map((character, index) => {
            // Character validation
            if (!character) {
                console.error(`[BattleInitializer] Null character at index ${index} in ${teamType} team`);
                return null;
            }
            
            // No need for deep copy since we already copied at the higher level
            const battleChar = character;
            
            // Set battle-specific properties
            if (battleChar.stats && typeof battleChar.stats.hp === 'number') {
                battleChar.currentHp = battleChar.stats.hp;
            } else {
                console.warn(`[BattleInitializer] Character at index ${index} has invalid stats.hp, using default value 100`);
                battleChar.currentHp = 100;
                battleChar.stats = battleChar.stats || {};
                battleChar.stats.hp = 100;
            }
            
            battleChar.isDead = false;
            
            // Ensure character has a unique ID
            if (!battleChar.id) {
                battleChar.id = this.generateCharacterId();
            }
            
            // Create a more robust uniqueId that includes team info and name
            battleChar.uniqueId = `${teamType}_${battleChar.name}_${battleChar.id}`;
            
            // Store team info on the character
            battleChar.team = teamType;
            
            // Initialize ability cooldowns and identify passive abilities
            if (battleChar.abilities) {
                battleChar.passiveAbilities = [];
                
                battleChar.abilities.forEach(ability => {
                    // Initialize cooldown for active abilities
                    ability.currentCooldown = 0;
                    
                    // Identify passive abilities and store them separately for quick reference
                    if (ability.abilityType === 'Passive') {
                        battleChar.passiveAbilities.push(ability);
                    }
                });
            }
            
            return battleChar;
        }).filter(char => char !== null); // Filter out any null entries
        
        console.log(`[BattleInitializer] Finished preparing ${teamType} team: ${preparedTeam.length} valid characters`);
        return preparedTeam;
    }

    /**
     * Generate a unique ID for a character
     * @returns {string} A unique ID
     */
    generateCharacterId() {
        return 'char_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Initialize the battle components
     */
    async initialize() {
        console.log("[BattleInitializer] initialize called");
        return this.battleManager.initialize();
    }

    /**
     * Import the behavior system
     */
    async initializeBehaviorSystem() {
        console.log("[BattleInitializer] initializeBehaviorSystem called");
        return this.battleManager.initializeBehaviorSystem();
    }
}

// Make BattleInitializer available globally for traditional scripts
if (typeof window !== 'undefined') {
  window.BattleInitializer = BattleInitializer;
  console.log("BattleInitializer class definition loaded and exported to window.BattleInitializer");
}

// Legacy global assignment for maximum compatibility
window.BattleInitializer = BattleInitializer;
