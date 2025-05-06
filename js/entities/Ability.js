/**
 * Ability Class
 * Represents special abilities that characters can use in battle
 */

class Ability {
    /**
     * Create a new Ability
     * @param {string} name - The name of the ability
     * @param {number} damage - Base damage or healing amount
     * @param {number} cooldown - Number of turns before ability can be used again
     * @param {boolean} isHealing - Whether ability heals or damages
     * @param {object} effects - Additional effects (status effects, buffs, etc.)
     */
    constructor(name, damage, cooldown, isHealing = false, effects = {}) {
        this.name = name;
        this.damage = damage;
        this.cooldown = cooldown;
        this.currentCooldown = 0;
        this.isHealing = isHealing;
        this.effects = effects;
    }

    // Methods to be implemented
}
