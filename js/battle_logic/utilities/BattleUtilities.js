/**
 * BattleUtilities
 * Static utility functions for battle operations
 */

class BattleUtilities {
    /**
     * Get all characters from both teams
     * @param {Array} playerTeam - The player's team array.
     * @param {Array} enemyTeam - The enemy's team array.
     * @returns {Array} - Combined array of all characters, or an empty array if inputs are invalid.
     */
    static getAllCharacters(playerTeam, enemyTeam) {
        if (!Array.isArray(playerTeam) || !Array.isArray(enemyTeam)) {
            console.warn("[BattleUtilities] Invalid team data provided to getAllCharacters.");
            return [];
        }
        return [...playerTeam, ...enemyTeam];
    }
    
    /**
     * Get a character by its uniqueId from any team
     * @param {string} uniqueId - The uniqueId of the character to find.
     * @param {Array} playerTeam - The player's team array.
     * @param {Array} enemyTeam - The enemy's team array.
     * @returns {Object|null} - The character object or null if not found.
     */
    static getCharacterByUniqueId(uniqueId, playerTeam, enemyTeam) {
        if (!uniqueId) return null;
        
        // Check if arguments are valid arrays
        if (!Array.isArray(playerTeam) || !Array.isArray(enemyTeam)) {
            console.warn("[BattleUtilities] Invalid team data provided to getCharacterByUniqueId.");
            return null;
        }
        
        // Check player team
        let foundChar = playerTeam.find(char => char && char.uniqueId === uniqueId);
        if (foundChar) return foundChar;
        
        // Check enemy team
        foundChar = enemyTeam.find(char => char && char.uniqueId === uniqueId);
        
        // Add a log if a character is not found for a given ID, can be helpful for debugging
        if (!foundChar) {
            console.warn(`[BattleUtilities.getCharacterByUniqueId] Character with uniqueId '${uniqueId}' not found.`);
        }
        
        return foundChar || null;
    }
    
    /**
     * Shuffle an array randomly
     * @param {Array} array - The array to shuffle
     * @returns {Array} The shuffled array
     */
    static shuffleArray(array) {
        if (!Array.isArray(array)) {
            console.warn("[BattleUtilities] Invalid array provided to shuffleArray.");
            return [];
        }
        
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    /**
     * Safely stringify an object, handling circular references
     * @param {Object} obj - The object to stringify
     * @param {number} [space] - Number of spaces for indentation (optional)
     * @returns {string} The stringified object with circular references replaced
     */
    static safeBattleStringify(obj, space = null) {
        if (obj === undefined || obj === null) {
            return JSON.stringify(obj);
        }
        
        try {
            const seen = new WeakSet();
            return JSON.stringify(obj, (key, value) => {
                // Handle circular references
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                        return '[Circular Reference]';
                    }
                    seen.add(value);
                }
                return value;
            }, space);
        } catch (error) {
            console.error("[BattleUtilities] Error in safeBattleStringify:", error);
            return `{"error":"Failed to stringify object: ${error.message}"}`;
        }
    }
}

// Make BattleUtilities available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.BattleUtilities = BattleUtilities;
    console.log("BattleUtilities class definition loaded and exported to window.BattleUtilities");
}

// Legacy global assignment for maximum compatibility
window.BattleUtilities = BattleUtilities;
