/**
 * DamageCalculator.js
 * 
 * A specialized component for handling all damage calculations in the battle system.
 * This component is extracted from BattleManager as part of the Stage 4 refactoring plan
 * to improve modularity and separation of concerns.
 * 
 * Version 0.5.26.3_Hotfix2 - Added defensive checks for target.stats to prevent TypeError
 * 
 * Handles:
 * - Damage formula calculations
 * - Stat scaling (STR/INT)
 * - Type effectiveness multipliers
 * - Critical hit calculations
 * - Damage variance
 * - Defense reduction
 * - Damage application
 * - Character health state tracking
 */
class DamageCalculator {
    /**
     * @param {BattleManager} battleManager - Reference to the BattleManager for access to shared utilities
     */
    constructor(battleManager) {
        this.battleManager = battleManager;
        console.log('DamageCalculator: Initialized');
    }

    /**
     * Calculate damage based on attacker, target, and ability parameters
     * 
     * @param {Character} attacker - The character dealing damage
     * @param {Character} target - The character receiving damage
     * @param {Object|null} ability - The ability being used (null for auto-attacks)
     * @param {Object|null} effect - The specific effect causing damage (for multi-effect abilities)
     * @returns {Object} - Object containing damage amount and metadata like scalingText, scalingStat, etc.
     */
    calculateDamage(attacker, target, ability, effect = null) {
        // Define default return value for error cases
        const defaultReturn = { 
            damage: 0, 
            scalingText: '', 
            scalingStat: null, 
            scalingStatName: '',
            damageType: 'physical',
            isCritical: false,
            typeMultiplier: 1 
        };
    
        // Handle missing parameters with early returns and logging
        if (!attacker) {
            console.error("DamageCalculator: Missing attacker in calculateDamage");
            return defaultReturn;
        }
        if (!target) {
            console.error("DamageCalculator: Missing target in calculateDamage");
            return defaultReturn;
        }
        
        // HOTFIX2: Check for missing stats objects
        if (!attacker.stats) {
            console.error(`DamageCalculator: Attacker '${attacker.name || 'unknown'}' is missing stats object`);
            return defaultReturn;
        }
        if (!target.stats) {
            console.error(`DamageCalculator: Target '${target.name || 'unknown'}' is missing stats object`);
            return defaultReturn;
        }

        // Base damage setup
        let baseDamage = 0;
        let damageType = "physical"; // Default to physical damage
        let scalingStat = "attack";  // Default scaling stat
        let scaleFactor = 0;         // Default no scaling
        let attackerStat = 0;        // Will hold the stat value

        // Determine base damage and type based on ability or auto-attack
        if (ability) {
            // Ability-based damage calculation
            baseDamage = ability.damage || 0;
            
            // Check for specific effect damage if provided
            if (effect && effect.damage) {
                baseDamage = effect.damage;
            }
            
            // Get damage type and scaling information from ability
            damageType = ability.damageType || "physical";
            
            // Set scaling stat based on ability damage type
            if (damageType === "physical") {
                scalingStat = "strength";
                scaleFactor = 0.5; // 50% of strength adds to damage
            } else if (damageType === "spell") {
                scalingStat = "intellect";
                scaleFactor = 0.5; // 50% of intellect adds to damage
            }
            
            // Check effect for scale factor first (higher priority)
            if (effect && effect.scaleFactor !== undefined) {
                console.log(`[DamageCalculator] Using effect-specific scaleFactor: ${effect.scaleFactor} (from effect)`);
                scaleFactor = effect.scaleFactor;
                // TEMPORARY DEBUG: Verify scaleFactor was correctly set after assignment
                console.log(`[DEBUG-SCALING] After effect assignment, scaleFactor = ${scaleFactor}`);
            }
            // Use ability's specific scale factor if defined and no effect override
            else if (ability.scaleFactor !== undefined) {
                console.log(`[DamageCalculator] Using ability-level scaleFactor: ${ability.scaleFactor} (from ability)`);
                scaleFactor = ability.scaleFactor;
                // TEMPORARY DEBUG: Verify scaleFactor was correctly set after assignment
                console.log(`[DEBUG-SCALING] After ability assignment, scaleFactor = ${scaleFactor}`);
            } else {
                console.log(`[DamageCalculator] Using default scaleFactor: ${scaleFactor}`);
                // TEMPORARY DEBUG: Verify default scaleFactor value
                console.log(`[DEBUG-SCALING] Using default scaleFactor = ${scaleFactor}`);
            }
            
            // Check effect for scaling stat first (higher priority)
            if (effect && effect.scalingStat) {
                console.log(`[DamageCalculator] Using effect-specific scalingStat: ${effect.scalingStat} (from effect)`);
                scalingStat = effect.scalingStat;
            }
            // Override scaling stat if ability specifies one
            else if (ability.scalingStat) {
                console.log(`[DamageCalculator] Using ability-level scalingStat: ${ability.scalingStat} (from ability)`);
                scalingStat = ability.scalingStat;
            } else {
                console.log(`[DamageCalculator] Using default scalingStat: ${scalingStat}`);
            }
        } else {
            // Auto-attack calculation (no ability)
            baseDamage = attacker.stats.attack || 0;
            damageType = "physical";
            // Auto-attacks don't have stat scaling beyond the base attack value
        }

        // ADDED DEBUG: Examine attacker object to diagnose stat resolution issues
        console.log(`[DamageCalculator DEBUG] Attacker object received:`, JSON.parse(JSON.stringify(attacker)));
        console.log(`[DamageCalculator DEBUG] Attacker stats:`, attacker.stats);
        console.log(`[DamageCalculator DEBUG] Looking for ${scalingStat} (exact case), and lowercase: ${scalingStat.toLowerCase()}`);
        
        // Check if stat name case sensitivity is causing issues
        if (attacker.stats) {
            console.log(`[DamageCalculator DEBUG] Direct property check - attacker.stats.intellect: ${attacker.stats.intellect}`);
            console.log(`[DamageCalculator DEBUG] Direct property check - attacker.stats.strength: ${attacker.stats.strength}`);
            console.log(`[DamageCalculator DEBUG] Direct property check - attacker.stats.spirit: ${attacker.stats.spirit}`);
        }
        
        // Before trying case-insensitive match, try exact match first
        let foundExactMatch = false;
        if (attacker.stats && Object.prototype.hasOwnProperty.call(attacker.stats, scalingStat)) {
            console.log(`[DamageCalculator DEBUG] Found exact match for ${scalingStat} in attacker.stats`);
            attackerStat = attacker.stats[scalingStat];
            foundExactMatch = true;
        }
        
        // Get the appropriate attacker stat for scaling - HOTFIX2: Use safe access with defaults
        // Try case-insensitive approach if no exact match
        if (!foundExactMatch) {
            if (scalingStat.toLowerCase() === "strength") {
                attackerStat = attacker.stats?.strength || 0;
                console.log(`[DamageCalculator DEBUG] Using strength: ${attackerStat}`);
            } else if (scalingStat.toLowerCase() === "intellect") {
                attackerStat = attacker.stats?.intellect || 0;
                console.log(`[DamageCalculator DEBUG] Using intellect: ${attackerStat}`);
            } else if (scalingStat.toLowerCase() === "spirit") {
                attackerStat = attacker.stats?.spirit || 0;
                console.log(`[DamageCalculator DEBUG] Using spirit: ${attackerStat}`);
            } else {
                // Try lowercase version of the stat name
                attackerStat = attacker.stats ? (attacker.stats[scalingStat.toLowerCase()] || 0) : 0;
                console.log(`[DamageCalculator DEBUG] Using generic stat access: ${attackerStat}`);
            }
        }
        
        // Sanity check - if we couldn't find the stat, log a very clear warning
        if (attackerStat === 0 && attacker.name) {
            console.warn(`[DamageCalculator WARN] Could not find stat ${scalingStat} for ${attacker.name}! Using 0 as fallback.`);
        }

        // TEMPORARY DEBUG: Log values right before calculation to verify inputs
        console.log(`[DEBUG-SCALING] PRE-CALCULATION - attackerStat: ${attackerStat}, scaleFactor: ${scaleFactor}, ability: ${ability?.name}, character: ${attacker?.name}`);
        
        // Apply stat scaling to base damage
        const statScaling = attackerStat * scaleFactor;
        
        // TEMPORARY DEBUG: Log the actual calculation result
        console.log(`[DEBUG-SCALING] CALCULATION RESULT - statScaling: ${statScaling}, rounded: ${Math.round(statScaling)}`);
        
        let totalDamage = baseDamage + statScaling;

        // Apply type effectiveness multiplier if both types are available
        let typeMultiplier = 1;
        if (attacker.type && target.type) {
            // Use TypeEffectivenessCalculator if available, otherwise fallback to BattleManager
            if (this.battleManager.useNewImplementation && this.battleManager.typeEffectivenessCalculator) {
                typeMultiplier = this.battleManager.typeEffectivenessCalculator.calculateTypeMultiplier(attacker.type, target.type);
            } else {
                typeMultiplier = this.battleManager.calculateTypeMultiplier(attacker.type, target.type);
            }
        }
        
        totalDamage *= typeMultiplier;

        // Apply defense reduction (diminishing returns formula) - HOTFIX2: Use safe access
        // Higher defense gives diminishing damage reduction
        const defenseValue = target.stats.defense || 0; // Hotfix line - already has || 0 but stats obj is verified above
        const defenseReductionFactor = 1 - (defenseValue / (defenseValue + 100));
        totalDamage *= defenseReductionFactor;

        // Random variance (±20%)
        const variance = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 range
        totalDamage *= variance;

        // Critical hit calculation (10% chance for 50% more damage)
        let criticalMultiplier = 1;
        let isCritical = false;
        
        // Check if this is a critical hit
        if (Math.random() < 0.1) { // 10% chance
            criticalMultiplier = 1.5; // 50% more damage
            isCritical = true;
            
            // Add to battle log if it's a critical hit
            if (this.battleManager.battleLog) {
                this.battleManager.battleLog.push(`CRITICAL HIT!`);
            }
        }
        
        totalDamage *= criticalMultiplier;

        // Round to nearest integer
        totalDamage = Math.round(totalDamage);
        
        // Ensure minimum damage of 1 (unless complete immunity)
        if (totalDamage < 1 && typeMultiplier > 0) {
            totalDamage = 1;
        }
        
        // Format scaling information and stat name for output
        let scalingText = '';
        let scalingStatName = '';
        
        // Prepare scaling text if applicable (for ability tooltips and battle log)
        if (statScaling > 0) {
            const roundedScaling = Math.round(statScaling);
            
            if (scalingStat === "strength") {
                scalingStatName = "Strength";
            } else if (scalingStat === "intellect") {
                scalingStatName = "Intellect";
            } else if (scalingStat === "spirit") {
                scalingStatName = "Spirit";
            } else {
                scalingStatName = scalingStat.charAt(0).toUpperCase() + scalingStat.slice(1);
            }
            
            // TEMPORARY DEBUG: Verify the final scaling text values
            console.log(`[DEBUG-SCALING] SCALING TEXT - using roundedScaling: ${roundedScaling} for ${scalingStatName} with ability: ${ability?.name}`);
            
            scalingText = `(+${roundedScaling} from ${scalingStatName})`;
            
            if (isCritical) {
                scalingText += " [CRITICAL]";
            }
        }
        
        // Add final damage text to battle log
        if (this.battleManager.battleLog) {
            const logText = scalingText ? `${totalDamage} ${scalingText}` : totalDamage.toString();
            this.battleManager.battleLog.push(logText);
        }

        // Return a comprehensive object with all metadata
        return {
            damage: totalDamage,
            scalingText: scalingText,
            scalingStat: attackerStat,
            scalingStatName: scalingStatName,
            damageType: damageType,
            isCritical: isCritical,
            typeMultiplier: typeMultiplier
        };
    }

/**
 * Applies damage to a target character
 * @param {Object} target - The character receiving damage
 * @param {number} amount - The amount of damage to apply
 * @param {Object} source - The character or entity causing the damage
 * @param {Object} ability - The ability used to cause the damage (optional)
 * @param {string} damageType - The type of damage being dealt (physical, spell, etc.)
 * @returns {Object} Object containing actualDamage and killed status
 */
applyDamage(target, amount, source, ability, damageType) {
    // Validate input parameters
    if (!target || typeof amount !== 'number') {
        console.error('[DamageCalculator] Invalid parameters for applyDamage:', { target, amount });
        return { actualDamage: 0, killed: false };
    }
    
    // HOTFIX2: Check for missing stats object
    if (!target.stats) {
        console.error(`[DamageCalculator] Target '${target.name || 'unknown'}' is missing stats object in applyDamage`);
        return { actualDamage: 0, killed: false };
    }

    // Store old health for comparison
    const oldHealth = target.currentHp;
    
    // Apply damage to target (minimum health is 0)
    target.currentHp = Math.max(0, target.currentHp - Math.max(0, amount));
    
    // Calculate actual damage done (after applying to health)
    const actualDamage = oldHealth - target.currentHp;
    
    // Determine if character was killed by this damage and set isDefeated
    const killed = oldHealth > 0 && target.currentHp <= 0;
    
    // If killed, ensure isDefeated flag is set
    if (killed) {
        console.log(`[DamageCalculator] Character ${target.name} is defeated, setting isDefeated to true`);
        target.isDefeated = true;
    }
    
    // Dispatch damage event
    if (this.battleManager.dispatchDamageEvent) {
        // Use the new facade method
        this.battleManager.dispatchDamageEvent(target, actualDamage, source, ability);
    } else if (window.battleBridge && actualDamage > 0) {
        // Fallback to direct battleBridge call if facade not available
        try {
            window.battleBridge.dispatchEvent(
                window.battleBridge.eventTypes.CHARACTER_DAMAGED, 
                {
                    character: target,
                    target: target,
                    newHealth: target.currentHp,
                    maxHealth: target.stats.hp,
                    amount: actualDamage,
                    source: source,
                    ability: ability
                }
            );
        } catch (error) {
            console.error('[DamageCalculator] Error dispatching CHARACTER_DAMAGED event:', error);
        }
    }
    
    // Return both the actual damage dealt and whether it would kill the target
    return { actualDamage, killed };
}
}

// Make DamageCalculator available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.DamageCalculator = DamageCalculator;
    console.log("DamageCalculator class definition loaded and exported to window.DamageCalculator");
}

// Legacy global assignment for maximum compatibility
window.DamageCalculator = DamageCalculator;