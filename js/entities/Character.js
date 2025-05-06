/**
 * Character Class
 * Base class for all battling units in the AutoBattler game
 */

class Character {
    /**
     * Create a new Character
     * @param {string} name - Character name
     * @param {string} type - Element/type (fire, water, etc.)
     * @param {number} hp - Health points
     * @param {number} attack - Attack power
     * @param {number} defense - Defense value
     * @param {number} x - X position on screen
     * @param {number} y - Y position on screen
     * @param {number} color - Color representation (hexadecimal)
     */
    constructor(name, type, hp, attack, defense, x, y, color) {
        this.name = name;
        this.type = type;
        this.maxHp = hp;
        this.currentHp = hp;
        this.attack = attack;
        this.defense = defense;
        this.x = x;
        this.y = y;
        this.color = color;
        this.sprite = null;
        this.text = null;
        this.abilities = [];
        this.abilityCooldowns = {};
    }

    // Methods to be implemented
}
