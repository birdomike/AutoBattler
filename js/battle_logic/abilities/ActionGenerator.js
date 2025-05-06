/**
 * ActionGenerator.js
 * Generates character actions for combat
 * Version 0.5.26.3_Hotfix3 - Added comprehensive target validation
 */
class ActionGenerator {
    /**
     * Create a new Action Generator
     * @param {Object} battleManager - The main battle manager
     */
    constructor(battleManager) {
        this.battleManager = battleManager;
        
        // Store references to required components
        this.targetingSystem = battleManager.targetingSystem;
        this.damageCalculator = battleManager.damageCalculator;
        
        // Log initialization with version info
        console.log("[ActionGenerator] Version 0.5.26.3_Hotfix3 - Initializing ActionGenerator component");
    }

    /**
     * Generate an action for a character
     * @param {Object} character - The character
     * @param {string} team - 'player' or 'enemy'
     * @returns {Object|null} The action or null
     */
    generateCharacterAction(character, team) {
        // 1. Parameter validation
        if (!character) {
            console.error("[ActionGenerator] Cannot generate action: character is null or undefined");
            return null;
        }
        
        // HOTFIX3: Validate that character has required properties
        if (!this.validateCharacter(character)) {
            console.error(`[ActionGenerator] Character ${character.name || 'unknown'} failed validation, cannot generate action`);
            return null;
        }
        
        // 2. Character state validation
        if (character.isDead || character.currentHp <= 0) {
            return null;
        }
        
        // 3. Assign team to character if not already set
        character.team = team;
        
        // 4. Check for status effects preventing action
        const characterId = character.uniqueId || character.id;
        if (this.battleManager.statusEffects[characterId]?.stun) {
            this.battleManager.logMessage(`${character.name} is stunned and cannot act!`, 'info');
            return null;
        }
        
        // 5. Ability selection
        const selectedAbility = this.selectAbility(character);
        const useAbility = !!selectedAbility;
        
        // 6. Target selection using TargetingSystem
        let target = null;
        
        if (this.targetingSystem) {
            const allCharacters = [...this.battleManager.playerTeam, ...this.battleManager.enemyTeam]
                // HOTFIX3: Filter out invalid characters before passing to targeting system
                .filter(char => this.validateCharacter(char));
            
            target = this.targetingSystem.selectTarget(character, selectedAbility, allCharacters);
        } else {
            // Fallback targeting
            console.warn("[ActionGenerator] TargetingSystem not available, using fallback targeting");
            target = this.fallbackTargeting(character, team);
        }
        
        // 7. If no valid target, return null
        if (!target) {
            console.warn(`[ActionGenerator] No valid target found for ${character.name}`);
            return null;
        }
        
        // TEMPORARY DEBUG (v0.5.27.2): Log target state before validation
        // Purpose: Check target properties just before validation to find corruption
        if (target) {
            console.log(`[DEBUG 0.5.27.2] Target for Validation in ActionGenerator (Targeting: ${target.name || 'NO_NAME'}):`, JSON.stringify(target));
        }
        
        // HOTFIX3: Validate the target before calculating damage
        if (!this.validateCharacter(target)) {
            console.error(`[ActionGenerator] Target ${target.name || 'unknown'} failed validation, aborting action`);
            return null;
        }
        
        // 8. Calculate damage for selected action
        const damageResult = this.calculateDamageForAction(character, target, selectedAbility);
        
        // 9. Create and return the action object
        return {
            actor: character,
            target: target,
            team: team,
            useAbility: useAbility,
            ability: selectedAbility,
            damage: damageResult.damage,
            scalingText: damageResult.scalingText,
            scalingStat: damageResult.scalingStat,
            damageType: damageResult.damageType
        };
    }
    
    /**
     * HOTFIX3: Validate that a character has all required properties
     * @param {Object} character - The character to validate
     * @returns {boolean} True if character has all required properties
     */
    validateCharacter(character) {
        // Basic validation check
        if (!character) return false;
        
        // Must have name property
        if (!character.name) {
            console.error("[ActionGenerator] Character validation failed: missing name property");
            return false;
        }
        
        // Must have stats object
        if (!character.stats) {
            console.error(`[ActionGenerator] Character '${character.name}' validation failed: missing stats object`);
            return false;
        }
        
        // Stats must have required properties
        const requiredStats = ['hp', 'attack', 'defense', 'speed'];
        for (const stat of requiredStats) {
            if (typeof character.stats[stat] !== 'number') {
                console.error(`[ActionGenerator] Character '${character.name}' validation failed: missing or invalid ${stat} stat`);
                return false;
            }
        }
        
        // Must have currentHp property
        if (typeof character.currentHp !== 'number') {
            console.error(`[ActionGenerator] Character '${character.name}' validation failed: missing or invalid currentHp property`);
            return false;
        }
        
        // Must have abilities array
        if (!Array.isArray(character.abilities)) {
            console.error(`[ActionGenerator] Character '${character.name}' validation failed: abilities is not an array`);
            return false;
        }
        
        // Passed all checks
        return true;
    }
    
    /**
     * Select an ability for a character to use
     * @param {Object} character - The character
     * @returns {Object|null} Selected ability or null for basic attack
     */
    selectAbility(character) {
        // 1. Get available abilities (not on cooldown and NOT passive)
        const availableAbilities = character.abilities?.filter(ability => {
            // Skip if ability is undefined or null
            if (!ability) return false;
            
            // Skip passive abilities explicitly marked as such
            if (ability.abilityType === 'Passive' || ability.abilityType === 'passive') return false;
            
            // Also skip abilities with passive-specific properties
            if (ability.passiveTrigger || ability.passiveBehavior) return false;
            
            // Only include abilities not on cooldown
            return ability.currentCooldown === 0;
        }) || [];
        
        // 2. If no abilities available, use basic attack
        if (availableAbilities.length === 0) {
            return null;
        }
        
        // 3. Debug logging
        console.debug(`[ActionGenerator] ${character.name} has ${availableAbilities.length} available active abilities`);
        
        // 4. Try to use BattleBehaviors system for ability selection
        let selectedAbility = null;
        
        if (this.battleManager.battleBehaviors) {
            // Create context for action decision
            const decisionContext = {
                actor: character,
                availableAbilities: availableAbilities,
                battleManager: this.battleManager,
                teamManager: { getCharacterTeam: (char) => char.team }
            };
            
            try {
                // Check if character has specific actionDecisionLogic
                const decisionLogic = character.actionDecisionLogic;
                
                // Use that behavior if available, otherwise use default
                if (decisionLogic && this.battleManager.battleBehaviors.hasBehavior(decisionLogic)) {
                    selectedAbility = this.battleManager.battleBehaviors.decideAction(decisionLogic, decisionContext);
                } else {
                    selectedAbility = this.battleManager.battleBehaviors.decideAction(
                        this.battleManager.battleBehaviors.getDefaultActionDecisionBehavior(),
                        decisionContext
                    );
                }
                
                // If an ability was selected, set its cooldown
                if (selectedAbility) {
                    selectedAbility.currentCooldown = selectedAbility.cooldown || 3;
                }
            } catch (error) {
                console.error('[ActionGenerator] Error in action decision behavior:', error);
                selectedAbility = null;
            }
        } else {
            // 5. Fallback ability selection when behavior system not available
            // 50% chance to use an ability if available
            if (Math.random() > 0.5) {
                selectedAbility = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
                // Set cooldown
                selectedAbility.currentCooldown = selectedAbility.cooldown || 3;
            }
        }
        
        return selectedAbility;
    }
    
    /**
     * Fallback targeting when TargetingSystem is not available
     * @param {Object} character - The character taking action
     * @param {string} team - The character's team ('player' or 'enemy')
     * @returns {Object|null} Selected target or null
     */
    fallbackTargeting(character, team) {
        // HOTFIX3: Ensure proper team-based targeting with validation
        const oppositeTeam = team === 'player' ? 'enemy' : 'player';
        const teamToTarget = oppositeTeam === 'player' ? this.battleManager.playerTeam : this.battleManager.enemyTeam;
        
        if (!teamToTarget || teamToTarget.length === 0) {
            console.warn(`[ActionGenerator] No ${oppositeTeam} team available for targeting`);
            return null;
        }
        
        // Filter for living, valid targets
        const validTargets = teamToTarget.filter(target => {
            return target && 
                  target.currentHp > 0 && 
                  !target.isDead &&
                  this.validateCharacter(target); // HOTFIX3: Add validation check
        });
        
        if (validTargets.length === 0) {
            console.warn(`[ActionGenerator] No valid targets found in ${oppositeTeam} team`);
            return null;
        }
        
        // Select a random target
        return validTargets[Math.floor(Math.random() * validTargets.length)];
    }
    
    /**
     * Calculate damage for an action
     * @param {Object} attacker - The character taking action
     * @param {Object} target - The target of the action
     * @param {Object|null} ability - The ability being used (null for auto-attack)
     * @returns {Object} Damage calculation result
     */
    calculateDamageForAction(attacker, target, ability) {
        // HOTFIX3: Validate characters before calculating damage
        if (!this.validateCharacter(attacker)) {
            console.error(`[ActionGenerator] Cannot calculate damage: attacker '${attacker?.name || 'unknown'}' failed validation`);
            return {
                damage: 0,
                scalingText: '',
                scalingStat: 0,
                damageType: ability ? (ability.damageType || 'physical') : 'physical'
            };
        }
        
        if (!this.validateCharacter(target)) {
            console.error(`[ActionGenerator] Cannot calculate damage: target '${target?.name || 'unknown'}' failed validation`);
            return {
                damage: 0,
                scalingText: '',
                scalingStat: 0,
                damageType: ability ? (ability.damageType || 'physical') : 'physical'
            };
        }
        
        // Use DamageCalculator if available
        if (this.damageCalculator) {
            return this.damageCalculator.calculateDamage(attacker, target, ability);
        }
        
        // Fallback to BattleManager's method if DamageCalculator not available
        if (this.battleManager.calculateDamage) {
            return this.battleManager.calculateDamage(attacker, target, ability);
        }
        
        // Extreme fallback - return minimal safe values
        console.error("[ActionGenerator] No damage calculation method available!");
        return {
            damage: attacker.stats.attack || 10,
            scalingText: '',
            scalingStat: 0,
            damageType: ability ? (ability.damageType || 'physical') : 'physical'
        };
    }
}

// Make ActionGenerator available globally for traditional scripts
if (typeof window !== 'undefined') {
    window.ActionGenerator = ActionGenerator;
    console.log("ActionGenerator class definition loaded and exported to window.ActionGenerator");
}

// Legacy global assignment for maximum compatibility
window.ActionGenerator = ActionGenerator;