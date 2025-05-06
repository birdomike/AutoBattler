# CHANGELOG 0.5.26.3_Hotfix5 - Character Stats Missing

## Issue
After the BattleManager refactoring, the game was experiencing issues with missing character stats, especially when returning to combat a second time. The specific symptoms were:

- Error message in console: `DamageCalculator: Target 'unknown' is missing stats object`
- Characters showing up as 'unknown' in error messages
- Missing stats objects despite previous Hotfix3 which added validation in ActionGenerator
- Issues particularly prevalent when returning from TeamBuilder to BattleScene for a second battle

## Root Cause Analysis

The root cause was determined to be a combination of:

1. **Insufficient Character Initialization**: The `startBattle` method in BattleManager was simply passing raw team data to BattleFlowController without proper validation, initialization, and defaults for missing properties.

2. **Incomplete Deep Copying**: The deep copy mechanism in BattleScene.js was performing a simple JSON.stringify/parse without validating the structure of copied objects.

3. **State Persistence Issues**: When returning from TeamBuilder to BattleScene, there was no proper cleanup of battle state, leading to stale data or listeners affecting new battles.

4. **Reference Issues**: Character objects were being passed around without proper initialization of critical properties, causing errors when they were later accessed.

## Implementation Details

### 1. Enhanced Character Initialization in BattleManager.js

Added a robust character initialization method to ensure all required properties are present and properly initialized:

```javascript
ensureCompleteCharacterInitialization(team, teamType) {
    if (!team || !Array.isArray(team)) {
        console.error(`[BattleManager] Cannot initialize ${teamType} team: Invalid or missing team data`);
        return [];
    }
    
    // Create complete team with proper initialization
    return team.map((character, index) => {
        // Skip invalid characters
        if (!character) {
            console.warn(`[BattleManager] Skipping invalid character at index ${index} in ${teamType} team`);
            return null;
        }
        
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
        completeChar.abilities = completeChar.abilities || [];
        
        // Initialize ability cooldowns and identify passive abilities
        completeChar.passiveAbilities = [];
        completeChar.abilities.forEach(ability => {
            if (ability) {
                // Initialize cooldown for active abilities
                ability.currentCooldown = ability.currentCooldown || 0;
                
                // Identify passive abilities and store them separately for quick reference
                if (ability.abilityType === 'Passive') {
                    completeChar.passiveAbilities.push(ability);
                }
            }
        });
        
        console.log(`[BattleManager] Completed initialization for ${completeChar.name} (${teamType})`);
        return completeChar;
    }).filter(char => char !== null); // Filter out any null entries
}
```

This method:
- Creates complete characters with all required properties
- Ensures stats object exists with all required stats
- Provides sensible defaults for missing properties
- Handles ability initialization including cooldowns
- Properly sets up passive abilities for quick access
- Filters out invalid character entries

### 2. Updated startBattle Method in BattleManager.js

Modified the startBattle method to use the new initialization function:

```javascript
async startBattle(rawPlayerTeam, rawEnemyTeam) {
    // Perform deep copy and enhanced initialization of teams
    this.playerTeam = this.ensureCompleteCharacterInitialization(
        JSON.parse(JSON.stringify(rawPlayerTeam || [])), 
        'player'
    );
    
    this.enemyTeam = this.ensureCompleteCharacterInitialization(
        JSON.parse(JSON.stringify(rawEnemyTeam || [])), 
        'enemy'
    );
    
    console.log(`[BattleManager] Starting battle with ${this.playerTeam.length} player characters and ${this.enemyTeam.length} enemy characters`);
    
    // Continue with normal battle flow via BattleFlowController
    return this.battleFlowController.startBattle(this.playerTeam, this.enemyTeam);
}
```

This ensures:
- Deep copy of original team data to prevent reference issues
- Comprehensive initialization and validation of all character data
- Proper handling of null or empty team arrays
- Detailed logging for debugging

### 3. Enhanced Team Data Handling in BattleScene.js

Improved the team data handling in BattleScene.js:

```javascript
// Store references to teams (with enhanced deep copying to prevent reference issues)
try {
    if (this.battleConfig.playerTeam) {
        // Use deep copy with proper serialization/deserialization
        const serialized = JSON.stringify(this.battleConfig.playerTeam);
        this.playerTeam = JSON.parse(serialized);
        
        console.log(`BattleScene: Stored player team with ${this.playerTeam.length} heroes (deep copy)`);
        
        // Validate team data structure
        this.playerTeam.forEach((char, idx) => {
            if (!char.stats) {
                console.warn(`[BattleScene] Player character at index ${idx} (${char.name || 'unnamed'}) missing stats object`);
                char.stats = { hp: 100, attack: 10, defense: 5, speed: 10 };
            }
        });
    } else {
        this.playerTeam = [];
        console.warn('BattleScene: No player team provided');
    }

    if (this.battleConfig.enemyTeam) {
        // Use deep copy with proper serialization/deserialization
        const serialized = JSON.stringify(this.battleConfig.enemyTeam);
        this.enemyTeam = JSON.parse(serialized);
        
        console.log(`BattleScene: Stored enemy team with ${this.enemyTeam.length} heroes (deep copy)`);
        
        // Validate team data structure
        this.enemyTeam.forEach((char, idx) => {
            if (!char.stats) {
                console.warn(`[BattleScene] Enemy character at index ${idx} (${char.name || 'unnamed'}) missing stats object`);
                char.stats = { hp: 100, attack: 10, defense: 5, speed: 10 };
            }
        });
    } else {
        this.enemyTeam = [];
        console.warn('BattleScene: No enemy team provided');
    }
} catch (error) {
    console.error('[BattleScene] Error processing team data:', error);
    // Create fallback empty teams
    this.playerTeam = [];
    this.enemyTeam = [];
}
```

This implementation:
- Adds explicit validation for each character's stats object
- Provides fallback default stats when missing
- Uses safer serialization method with proper error handling
- Provides fallbacks in case of errors during copying

### 4. Added Battle State Cleanup in BattleBridge.js

Added a state cleanup method to BattleBridge.js to properly clean up between battles:

```javascript
/**
 * Clean up battle state when returning to TeamBuilder
 */
cleanupBattleState() {
    console.log('BattleBridge: Cleaning up battle state before returning to TeamBuilder');
    
    // Reset battle state properties
    this.battlesStarted = 0;
    
    // Clear event listeners to prevent duplicates in subsequent battles
    Object.values(this.eventTypes).forEach(type => {
        this.eventListeners[type] = [];
    });
    
    console.log('BattleBridge: Battle state cleaned up');
}
```

And added the call to BattleScene's returnToTeamBuilder method:

```javascript
returnToTeamBuilder() {
    try {
        console.log('Returning to Team Builder...');
        
        // Clean up battle state
        if (window.battleBridge) {
            window.battleBridge.cleanupBattleState();
        }

        // ... remainder of method unchanged ...
    } catch (error) {
        // ... error handling unchanged ...
    }
}
```

This ensures:
- All battle state is cleaned up when returning to TeamBuilder
- Event listeners are properly reset to prevent duplicate event handling
- Clean state for the next battle, preventing stale references

## Testing
The following testing scenarios were performed to verify the fixes:

1. Starting a battle with valid teams
2. Starting a battle with incomplete character data (missing stats)
3. Starting a battle with null or empty teams
4. Returning to TeamBuilder and starting a second battle
5. Testing with multiple different team compositions
6. Verifying damage calculation works properly with newly initialized characters

## Results
- No more "Target 'unknown' is missing stats object" errors occur
- Characters always have proper initialization with stats objects
- Multiple battles can be started after returning to TeamBuilder without errors
- Damage calculation works properly with all character types and abilities
- No more undefined property accesses during battles

## Future Considerations
This fix establishes proper character initialization and validation throughout the battle system. For further improvement:

1. Creating a more centralized character validation system that could be used across all components
2. Adding additional debugging tools for character state monitoring
3. Implementing schema validation for character objects to catch issues earlier
4. Enhancing the battle state tracking and cleanup to handle more complex state recovery scenarios
