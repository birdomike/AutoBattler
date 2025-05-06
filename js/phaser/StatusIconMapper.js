/**
 * StatusIconMapper - Maps status effect IDs to icon paths
 * Centralizes the mapping between status effect IDs and their corresponding icon files
 */
class StatusIconMapper {
    /**
     * Get the complete mapping of status IDs to icon paths
     * @returns {Object} Mapping of status IDs to icon paths
     */
    static getMapping() {
        return {
            'atk_down': 'AI_Icons/32px/Attack Down_AI.png',
            'atk_up': 'AI_Icons/32px/AttackUp.png',
            'bleed': 'AI_Icons/32px/Bleeding_AI.png',
            'burn': 'AI_Icons/32px/Burn_AI.png',
            'crit_up': 'AI_Icons/32px/CritChanceUp_AI.png',
            'def_down': 'AI_Icons/32px/Defense Down_AI.png',
            'def_up': 'AI_Icons/32px/Defense Up_AI.png',
            'evade': 'AI_Icons/32px/Evasion_AI.png',
            'freeze': 'AI_Icons/32px/Freeze_AI.png',
            'immune': 'AI_Icons/32px/Immunity_AI.png',
            'int_down': 'AI_Icons/32px/IntellectDown_AI.png',
            'int_up': 'AI_Icons/32px/Intellect Up_AI.png',
            'poison': 'AI_Icons/32px/Poison_AI.png',
            'reflect': 'AI_Icons/32px/DamageReflect_AI.png',
            'regen': 'AI_Icons/32px/Regeneration_AI.png',
            'shield': 'AI_Icons/32px/Shield_AI.png',
            'spd_down': 'AI_Icons/32px/Speed Down_AI.png',
            'spd_up': 'AI_Icons/32px/Speed Up_AI.png',
            'spi_down': 'AI_Icons/32px/SpiritDown_AI.png',
            'spi_up': 'AI_Icons/32px/SpiritUp_AI.png',
            'str_down': 'AI_Icons/32px/StrengthDown_AI.png',
            'str_up': 'AI_Icons/32px/StrengthUp_AI.png',
            'stun': 'AI_Icons/32px/Stunned_AI.png',
            'taunt': 'AI_Icons/32px/Taunt_AI.png',
            'vulnerable': 'AI_Icons/32px/Vulnerable_AI.png'
        };
    }
    
    /**
     * Get the icon path for a specific status ID
     * @param {string} statusId - The status effect ID
     * @returns {string} The path to the icon file
     */
    static getPath(statusId) {
        const mapping = this.getMapping();
        return mapping[statusId] || `${statusId}.png`;
    }
}

// Make available globally for non-module code
window.StatusIconMapper = StatusIconMapper;
