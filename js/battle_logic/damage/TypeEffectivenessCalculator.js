/**
 * TypeEffectivenessCalculator.js
 * Calculates type advantage multipliers and effects
 * Enhanced with full 22-type system based on Type Effectiveness Table.md
 * Version 0.6.0 - 2025-05-07
 */

class TypeEffectivenessCalculator {
    /**
     * Create a new Type Effectiveness Calculator
     * @param {Object} battleManager - The main battle manager instance
     */
    constructor(battleManager) {
        // Store the reference to BattleManager passed from the constructor
        this.battleManager = battleManager;
        // Basic check to ensure battleManager was passed
        if (!this.battleManager) {
            console.error("TypeEffectivenessCalculator: BattleManager instance was not provided!");
        }
        
        // Initialize type data
        this.typeData = null;
        this.initialized = false;
        
        // Load the type effectiveness data
        this.loadTypeData();
    }
    
    /**
     * Load type effectiveness data from JSON
     */
    async loadTypeData() {
        try {
            const response = await fetch('data/type_effectiveness.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch type data: ${response.status} ${response.statusText}`);
            }
            
            this.typeData = await response.json();
            this.initialized = true;
            console.log('TypeEffectivenessCalculator: Type data loaded successfully');
        } catch (error) {
            console.error('TypeEffectivenessCalculator: Failed to load type data.', error);
            // Initialize with default fallback data
            this.typeData = this.getDefaultTypeData();
            this.initialized = true;
        }
    }
    
    /**
     * Get default type data as fallback if JSON fails to load
     * @returns {Object} Default minimal type data
     */
    getDefaultTypeData() {
        console.warn('TypeEffectivenessCalculator: Using default minimal type data as fallback');
        return {
            advantages: {
                fire: ['nature'],
                water: ['fire'],
                nature: ['water'],
                light: ['dark'],
                dark: ['light']
            },
            disadvantages: {
                fire: ['water'],
                water: ['nature'],
                nature: ['fire'],
                light: ['metal'],
                dark: ['physical']
            },
            immunities: {
                metal: ['poison'],
                ethereal: ['physical']
            },
            specialCases: [
                {"attacker": "light", "defender": "ethereal", "multiplier": 3.0}
            ]
        };
    }

    /**
     * Calculate type advantage multiplier
     * @param {string} attackerType - Attacker's type
     * @param {string} defenderType - Defender's type
     * @returns {number} Damage multiplier
     */
    calculateTypeMultiplier(attackerType, defenderType) {
        // Normalize types to lowercase for case-insensitive comparison
        attackerType = attackerType?.toLowerCase();
        defenderType = defenderType?.toLowerCase();
        
        // Safety check for undefined or null types
        if (!attackerType || !defenderType) {
            return 1.0; // Neutral if types are missing
        }

        // Wait for initialization if needed
        if (!this.initialized || !this.typeData) {
            console.warn('TypeEffectivenessCalculator: Type data not yet loaded. Using neutral multiplier');
            return 1.0;
        }

        // Helper function for logging messages
        const logTypeMessage = (relationship, messageText) => {
            const messageType = relationship === 'advantage' ? 'success' : 
                              relationship === 'disadvantage' ? 'info' : 
                              relationship === 'immune' ? 'warning' : 
                              relationship === 'special' ? 'critical' : 'info';
            
            if (this.battleManager && typeof this.battleManager.logMessage === 'function') {
                this.battleManager.logMessage(messageText, messageType);
            } else {
                // Fallback log if battleManager is unavailable
                console.warn(`TypeEffectivenessCalculator: ${messageText}`);
            }
        };

        // Check for immunities first (no damage)
        if (this.typeData.immunities[defenderType]?.includes(attackerType)) {
            const message = `${this.capitalizeType(defenderType)} is immune to ${this.capitalizeType(attackerType)}!`;
            logTypeMessage('immune', message);
            return 0.0; // Immunity = no damage
        }

        // Check for special cases
        const specialCase = this.typeData.specialCases.find(sc => 
            sc.attacker.toLowerCase() === attackerType && 
            sc.defender.toLowerCase() === defenderType);
        
        if (specialCase) {
            const message = `${this.capitalizeType(attackerType)} deals massive damage to ${this.capitalizeType(defenderType)}!`;
            logTypeMessage('special', message);
            return specialCase.multiplier;
        }

        // Check for advantages (strong against)
        if (this.typeData.advantages[attackerType]?.includes(defenderType)) {
            const message = `${this.capitalizeType(attackerType)} is super effective against ${this.capitalizeType(defenderType)}!`;
            logTypeMessage('advantage', message);
            return 1.5; // +50% damage
        }

        // Check for disadvantages (weak against)
        if (this.typeData.disadvantages[attackerType]?.includes(defenderType)) {
            const message = `${this.capitalizeType(attackerType)} is not very effective against ${this.capitalizeType(defenderType)}.`;
            logTypeMessage('disadvantage', message);
            return 0.5; // -50% damage
        }

        // No special relationship, return neutral multiplier
        return 1.0;
    }

    /**
     * Helper to capitalize the first letter of a type name
     * @param {string} type - Type name to capitalize
     * @returns {string} Capitalized type name
     */
    capitalizeType(type) {
        if (!type) return '';
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    /**
     * Get descriptive text for a type relationship (for tooltips and UI)
     * @param {string} attackerType - Attacker's type
     * @param {string} defenderType - Defender's type
     * @returns {string} Descriptive text about the type relationship
     */
    getTypeAdvantageText(attackerType, defenderType) {
        // Normalize types to lowercase
        attackerType = attackerType?.toLowerCase();
        defenderType = defenderType?.toLowerCase();
        
        // Safety check for undefined or null types
        if (!attackerType || !defenderType || !this.initialized) {
            return '';
        }

        // Check for immunities
        if (this.typeData.immunities[defenderType]?.includes(attackerType)) {
            return `${this.capitalizeType(defenderType)} is immune to ${this.capitalizeType(attackerType)}`;
        }

        // Check for special cases
        const specialCase = this.typeData.specialCases.find(sc => 
            sc.attacker.toLowerCase() === attackerType && 
            sc.defender.toLowerCase() === defenderType);
        
        if (specialCase) {
            return `${this.capitalizeType(attackerType)} deals ${specialCase.multiplier}x damage to ${this.capitalizeType(defenderType)}`;
        }

        // Check for advantages
        if (this.typeData.advantages[attackerType]?.includes(defenderType)) {
            return `${this.capitalizeType(attackerType)} is strong against ${this.capitalizeType(defenderType)}`;
        }

        // Check for disadvantages
        if (this.typeData.disadvantages[attackerType]?.includes(defenderType)) {
            return `${this.capitalizeType(attackerType)} is weak against ${this.capitalizeType(defenderType)}`;
        }

        return ''; // No special relationship
    }
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