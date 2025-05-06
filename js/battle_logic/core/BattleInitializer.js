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
    }

    /**
     * Initialize the battle components
     */
    async initialize() {
        console.log("[BattleInitializer] initialize called - SHELL IMPLEMENTATION");
        return this.battleManager.initialize();
    }

    /**
     * Prepare a team for battle by setting initial values
     * @param {Array} team - Array of character objects
     * @param {string} teamType - 'player' or 'enemy'
     * @returns {Array} - Prepared team for battle
     */
    prepareTeamForBattle(team, teamType) {
        console.log("[BattleInitializer] prepareTeamForBattle called - SHELL IMPLEMENTATION");
        return this.battleManager.prepareTeamForBattle(team);
    }

    /**
     * Generate a unique ID for a character
     * @returns {string} A unique ID
     */
    generateCharacterId() {
        console.log("[BattleInitializer] generateCharacterId called - SHELL IMPLEMENTATION");
        return this.battleManager.generateCharacterId();
    }

    /**
     * Import the behavior system
     */
    async initializeBehaviorSystem() {
        console.log("[BattleInitializer] initializeBehaviorSystem called - SHELL IMPLEMENTATION");
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
