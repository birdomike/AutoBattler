/**
 * BehaviorRegistryTest.js
 * 
 * A simple test utility to validate the behavior registry system.
 * This can be run directly in the browser console.
 */

import battleBehaviors from './BattleBehaviors.js';

/**
 * Test mock character
 */
class MockCharacter {
    constructor(name, team, hp = 100, attk = 10, def = 5, spd = 10) {
        this.name = name;
        this.team = team;
        this.stats = { hp, attack: attk, defense: def, speed: spd };
        this.currentHp = hp;
        this.defeated = false;
    }
}

/**
 * Test mock TeamManager
 */
class MockTeamManager {
    constructor() {
        this.characterTeams = new Map();
    }
    
    getCharacterTeam(character) {
        return character.team;
    }
    
    addCharacter(character, team) {
        character.team = team;
        this.characterTeams.set(character, team);
    }
}

/**
 * Test mock BattleManager
 */
class MockBattleManager {
    constructor() {
        this.characters = [];
        this.statusEffects = new Map();
    }
    
    getAllCharacters() {
        return this.characters;
    }
    
    addCharacter(character) {
        this.characters.push(character);
    }
    
    addStatusEffect(character, statusId, duration) {
        if (!this.statusEffects.has(character)) {
            this.statusEffects.set(character, []);
        }
        
        this.statusEffects.get(character).push({
            id: statusId,
            duration,
            appliedAt: Date.now()
        });
        
        console.log(`Added status ${statusId} to ${character.name} for ${duration} turns`);
    }
    
    applyDamage(target, amount, source, ability, type) {
        console.log(`${source.name} deals ${amount} ${type || ''} damage to ${target.name}`);
        target.currentHp -= amount;
        if (target.currentHp <= 0) {
            target.defeated = true;
            console.log(`${target.name} is defeated!`);
        }
    }
}

/**
 * Run tests for targeting behaviors
 */
function testTargetingBehaviors() {
    console.log("=== Testing Targeting Behaviors ===");
    
    // Setup test data
    const teamManager = new MockTeamManager();
    const actor = new MockCharacter("Hero", "ally", 100, 10, 5, 10);
    const enemy1 = new MockCharacter("Enemy1", "enemy", 100, 10, 5, 10);
    const enemy2 = new MockCharacter("Enemy2", "enemy", 50, 15, 3, 12);
    const ally1 = new MockCharacter("Ally1", "ally", 30, 8, 4, 9);
    
    const potentialTargets = [actor, enemy1, enemy2, ally1];
    
    // Test context
    const context = {
        actor,
        potentialTargets,
        teamManager,
        ability: { name: "Test Ability" }
    };
    
    // Test targeting behaviors
    console.log("targetRandomEnemy:", battleBehaviors.selectTarget('targetRandomEnemy', context)?.name);
    console.log("targetLowestHpEnemy:", battleBehaviors.selectTarget('targetLowestHpEnemy', context)?.name);
    console.log("targetHighestHpEnemy:", battleBehaviors.selectTarget('targetHighestHpEnemy', context)?.name);
    console.log("targetAllEnemies:", battleBehaviors.selectTarget('targetAllEnemies', context)?.map(t => t.name));
    console.log("targetLowestHpAlly:", battleBehaviors.selectTarget('targetLowestHpAlly', context)?.name);
    console.log("targetAllAllies:", battleBehaviors.selectTarget('targetAllAllies', context)?.map(t => t.name));
    console.log("targetSelf:", battleBehaviors.selectTarget('targetSelf', context)?.name);
    
    // Test targetType to behavior mapping
    console.log("Behavior for 'SingleEnemy':", battleBehaviors.getTargetingBehaviorFromType('SingleEnemy'));
    console.log("Behavior for 'AllEnemies':", battleBehaviors.getTargetingBehaviorFromType('AllEnemies'));
    console.log("Behavior for 'LowestHpAlly':", battleBehaviors.getTargetingBehaviorFromType('LowestHpAlly'));
    
    // Test default behavior
    console.log("Default targeting behavior:", battleBehaviors.getDefaultTargetingBehavior());
    console.log("Using default for unknown behavior:", battleBehaviors.selectTarget('nonexistent', context)?.name);
}

/**
 * Run tests for action decision behaviors
 */
function testActionDecisionBehaviors() {
    console.log("=== Testing Action Decision Behaviors ===");
    
    // Setup test data
    const actor = new MockCharacter("Hero", "ally", 100, 10, 5, 10);
    const battleManager = new MockBattleManager();
    const teamManager = new MockTeamManager();
    
    const availableAbilities = [
        {
            id: "ability1",
            name: "Fireball",
            damageType: "spell",
            isHealing: false,
            selectionWeight: 1.0
        },
        {
            id: "ability2",
            name: "Heal",
            damageType: "healing",
            isHealing: true,
            selectionWeight: 1.2
        },
        {
            id: "ability3",
            name: "Shield",
            damageType: "utility",
            isHealing: false,
            selectionWeight: 0.8
        }
    ];
    
    // Test context
    const context = {
        actor,
        availableAbilities,
        battleManager,
        teamManager
    };
    
    // Test multiple times to observe randomness
    console.log("=== decideAction_Random50Percent (multiple runs) ===");
    for (let i = 0; i < 5; i++) {
        const result = battleBehaviors.decideAction('decideAction_Random50Percent', context);
        console.log(`Run ${i + 1}:`, result ? result.name : "Basic Attack");
    }
    
    console.log("=== decideAction_WeightedRandomAbility (multiple runs) ===");
    for (let i = 0; i < 5; i++) {
        const result = battleBehaviors.decideAction('decideAction_WeightedRandomAbility', context);
        console.log(`Run ${i + 1}:`, result ? result.name : "Basic Attack");
    }
    
    console.log("=== decideAction_PrioritizeOffense ===");
    const offensiveResult = battleBehaviors.decideAction('decideAction_PrioritizeOffense', context);
    console.log("Result:", offensiveResult ? offensiveResult.name : "Basic Attack");
    
    console.log("=== decideAction_AlwaysUseAbilities ===");
    const alwaysAbilityResult = battleBehaviors.decideAction('decideAction_AlwaysUseAbilities', context);
    console.log("Result:", alwaysAbilityResult ? alwaysAbilityResult.name : "Basic Attack");
    
    // Test with healing priority when allies are injured
    console.log("=== decideAction_PrioritizeHeal (allies need healing) ===");
    
    // Create injured allies
    const ally1 = new MockCharacter("InjuredAlly", "ally", 100, 10, 5, 10);
    ally1.currentHp = 30; // 30% health
    
    battleManager.addCharacter(actor);
    battleManager.addCharacter(ally1);
    teamManager.addCharacter(actor, "ally");
    teamManager.addCharacter(ally1, "ally");
    
    const healingResult = battleBehaviors.decideAction('decideAction_PrioritizeHeal', context);
    console.log("Result:", healingResult ? healingResult.name : "Basic Attack");
}

/**
 * Run tests for passive behaviors
 */
function testPassiveBehaviors() {
    console.log("=== Testing Passive Behaviors ===");
    
    // Setup test data
    const actor = new MockCharacter("Hero", "ally", 100, 10, 5, 10);
    const enemy = new MockCharacter("Enemy", "enemy", 100, 10, 5, 10);
    const battleManager = new MockBattleManager();
    const teamManager = new MockTeamManager();
    
    // Add characters
    battleManager.addCharacter(actor);
    battleManager.addCharacter(enemy);
    teamManager.addCharacter(actor, "ally");
    teamManager.addCharacter(enemy, "enemy");
    
    // Test passive_ApplyRegenOnTurnStart
    console.log("=== passive_ApplyRegenOnTurnStart ===");
    
    const regenContext = {
        actor,
        ability: { name: "Regeneration", passiveType: "onTurnStart" },
        battleManager,
        teamManager,
        trigger: 'onTurnStart'
    };
    
    const regenResult = battleBehaviors.processPassive('passive_ApplyRegenOnTurnStart', regenContext);
    console.log("Result:", regenResult);
    
    // Test passive_DamageReflectOnHit
    console.log("=== passive_DamageReflectOnHit ===");
    
    const reflectContext = {
        actor,
        ability: { name: "Thorns", passiveType: "onDamageTaken" },
        battleManager,
        teamManager,
        trigger: 'onDamageTaken',
        additionalData: {
            source: enemy,
            damageAmount: 20
        }
    };
    
    const reflectResult = battleBehaviors.processPassive('passive_DamageReflectOnHit', reflectContext);
    console.log("Result:", reflectResult);
    
    // Test passive_TeamBuffOnBattleStart
    console.log("=== passive_TeamBuffOnBattleStart ===");
    
    const buffContext = {
        actor,
        ability: { 
            name: "Team Spirit", 
            passiveType: "onBattleStart",
            passiveData: {
                statusId: "status_atk_up",
                duration: 3
            }
        },
        battleManager,
        teamManager,
        trigger: 'onBattleStart'
    };
    
    const buffResult = battleBehaviors.processPassive('passive_TeamBuffOnBattleStart', buffContext);
    console.log("Result:", buffResult);
}

/**
 * Run all tests
 */
function runAllTests() {
    console.log("======= BEHAVIOR REGISTRY TEST =======");
    
    // List all registered behaviors
    console.log("=== REGISTERED BEHAVIORS ===");
    console.log(battleBehaviors.registry.listAllBehaviors());
    
    // Run individual tests
    testTargetingBehaviors();
    testActionDecisionBehaviors();
    testPassiveBehaviors();
    
    console.log("======= TEST COMPLETE =======");
}

// Export test functions
export {
    runAllTests,
    testTargetingBehaviors,
    testActionDecisionBehaviors,
    testPassiveBehaviors
};

// Automatically run tests when imported directly
if (typeof window !== 'undefined') {
    window.runBehaviorTests = runAllTests;
    console.log("Test utility loaded. Run tests with window.runBehaviorTests()");
}
