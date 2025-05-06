/**
 * TypeEffectivenessCalculator.js
 * Calculates type advantage multipliers and effects
 * Part of BattleManager refactoring - Stage 4
 * Version 0.5.21 - 2025-05-04 // <-- Assuming you want to update version/date
 */

class TypeEffectivenessCalculator {
    /**
     * Create a new Type Effectiveness Calculator
     * @param {Object} battleManager - The main battle manager instance
     */
    constructor(battleManager) {
        // Store the reference to BattleManager passed from the constructor
        // This instance is used to call BattleManager's methods like logMessage
        this.battleManager = battleManager;
        // Basic check to ensure battleManager was passed
        if (!this.battleManager) {
            console.error("TypeEffectivenessCalculator: BattleManager instance was not provided!");
        }
    }

    /**
     * Calculate type advantage multiplier
     * @param {string} attackerType - Attacker's type
     * @param {string} defenderType - Defender's type
     * @returns {number} Damage multiplier
     */
    calculateTypeMultiplier(attackerType, defenderType) {
        // Type advantage chart (Current basic implementation)
        const advantages = {
            fire: 'nature',   // Fire is strong against Nature
            water: 'fire',     // Water is strong against Fire
            nature: 'water',   // Nature is strong against Water
            light: 'dark',     // Light is strong against Dark
            dark: 'light',     // Dark is strong against Light
            air: 'earth'       // Air is strong against Earth (not used yet)
        };

        // Check if the battleManager reference exists before using it
        const log = (message, type) => {
            if (this.battleManager && typeof this.battleManager.logMessage === 'function') {
                this.battleManager.logMessage(message, type);
            } else {
                // Fallback log if battleManager is unavailable
                console.warn(`TypeEffectivenessCalculator: BattleManager or logMessage unavailable. Log: [${type}] ${message}`);
            }
        };

        if (advantages[attackerType] === defenderType) {
            // Attacker has advantage
            log(`${attackerType.charAt(0).toUpperCase() + attackerType.slice(1)} is super effective against ${defenderType}!`, 'success');
            return 1.5;
        } else if (advantages[defenderType] === attackerType) {
            // Defender has advantage
            log(`${attackerType.charAt(0).toUpperCase() + attackerType.slice(1)} is not very effective against ${defenderType}.`, 'info');
            return 0.75;
        }

        return 1.0; // No advantage
    }

    // TODO: Add methods for expanded type chart (immunities, special cases) after refactoring is complete.
    // Example placeholder:
    // getFullTypeMultiplier(attackerType, defenderType, abilityType) { ... }
}

// Export for ES modules (Commented out)
// This line is commented out because BattleManager currently initializes components
// by looking for them directly on the global 'window' object (e.g., new window.TypeEffectivenessCalculator()).
// Using 'export default' can sometimes cause timing issues with when the class becomes available
// globally if the file is loaded as a standard <script defer> instead of type="module".
// By relying solely on the global assignment below, we ensure compatibility with the current loading strategy.
// export default TypeEffectivenessCalculator;

// Also make available as a global for compatibility with BattleManager initialization
if (typeof window !== 'undefined') {
    window.TypeEffectivenessCalculator = TypeEffectivenessCalculator;
    // Add a log to confirm *when* this global assignment happens during page load
    console.log("TypeEffectivenessCalculator class definition loaded and explicitly assigned to window.TypeEffectivenessCalculator.");
} else {
    console.error("TypeEffectivenessCalculator: 'window' object not found. Cannot assign class globally.");
}