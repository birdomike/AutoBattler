/**
 * TeamBuilderUtils - Shared utility functions for TeamBuilder components
 * 
 * This utility class provides common functionality needed across multiple
 * TeamBuilder components, extracted from the original TeamBuilderUI class
 * to support the component-based architecture refactoring.
 */
class TeamBuilderUtils {
  /**
   * Split a type string into an array of individual types
   * @param {string} typeString - Type string with potential "/" separator (e.g., "water/ice")
   * @returns {string[]} Array of individual types
   */
  static splitTypes(typeString) {
    if (!typeString) return [];
    return typeString.split('/').map(t => t.trim().toLowerCase());
  }

  /**
   * Create spans for a multi-type string and append to container
   * @param {string} typeString - Type string with potential "/" separator
   * @param {HTMLElement} container - Container to append spans to
   * @param {Object} typeColors - Map of type names to color values
   */
  static renderMultiTypeSpans(typeString, container, typeColors) {
    const types = this.splitTypes(typeString);
    
    types.forEach((type, index) => {
      // Create span for this type
      const typeSpan = document.createElement('span');
      typeSpan.style.color = typeColors[type];
      typeSpan.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      container.appendChild(typeSpan);
      
      // Add separator if not the last type
      if (index < types.length - 1) {
        const separator = document.createElement('span');
        separator.textContent = ' / ';
        separator.className = 'type-separator';
        container.appendChild(separator);
      }
    });
  }

  /**
   * Get ordinal suffix for a number
   * @param {number} n - The number
   * @returns {string} The ordinal suffix (st, nd, rd, th)
   */
  static getOrdinalSuffix(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return (s[(v - 20) % 10] || s[v] || s[0]);
  }

  /**
   * Helper function to create a stat box
   * @param {string} label - Stat label
   * @param {number} value - Stat value
   * @param {string} tooltip - Tooltip text
   * @returns {HTMLElement} The stat box element
   */
  static createStatBox(label, value, tooltip) {
    const statBox = document.createElement('div');
    statBox.className = 'stat-box';
    statBox.style.flex = '1';
    statBox.style.padding = '5px';
    statBox.style.backgroundColor = '#1e272e';
    statBox.style.borderRadius = '5px';
    statBox.style.textAlign = 'center';

    const statLabel = document.createElement('div');
    statLabel.className = 'stat-label';
    statLabel.textContent = label;

    const statValue = document.createElement('div');
    statValue.className = 'stat-value';
    statValue.textContent = value;

    statBox.appendChild(statLabel);
    statBox.appendChild(statValue);

    // Add tooltip if provided
    if (tooltip && window.tooltipManager) {
      window.tooltipManager.addTooltip(statBox, tooltip);
      statBox.classList.add('has-tooltip');
    }

    return statBox;
  }

  /**
   * Get detailed scaling text with formula for ability tooltips
   * @param {Object} ability - The ability object
   * @param {Object} hero - The hero object for stat reference
   * @returns {Object} Object with damageText and scalingText
   */
  static getDetailedScalingText(ability, hero) {
    let scalingText = '';
    let damageText = '';
    let statValue = 0;
    
    if (ability.isHealing || ability.damageType === 'healing') {
      // Healing ability scaling with Spirit
      statValue = hero.stats.spirit || 0;
      const scalingAmount = Math.floor(statValue * 0.5);
      const totalHealing = ability.damage + scalingAmount;
      
      damageText = `<div>Healing: ${ability.damage} + (50% of Spirit) = ${totalHealing} HP</div>`;
      scalingText = `${ability.name} restores ${ability.damage} + (50% of Spirit) health`;
    } 
    else if (ability.damageType === 'physical') {
      // Physical ability scaling with Strength
      statValue = hero.stats.strength || 0;
      const scalingAmount = Math.floor(statValue * 0.5);
      const totalDamage = ability.damage + scalingAmount;
      
      damageText = `<div>Damage: ${ability.damage} + (50% of Strength) = ${totalDamage} pre-defense</div>`;
      scalingText = `${ability.name} deals ${ability.damage} + (50% of Strength) damage`;
    } 
    else if (ability.damageType === 'spell') {
      // Spell ability scaling with Intellect
      statValue = hero.stats.intellect || 0;
      const scalingAmount = Math.floor(statValue * 0.5);
      const totalDamage = ability.damage + scalingAmount;
      
      damageText = `<div>Damage: ${ability.damage} + (50% of Intellect) = ${totalDamage} pre-defense</div>`;
      scalingText = `${ability.name} deals ${ability.damage} + (50% of Intellect) damage`;
    }
    else if (ability.damageType === 'utility') {
      // Utility ability scaling with Spirit
      damageText = `<div>Effect scales with Spirit</div>`;
      scalingText = `${ability.name}'s effectiveness scales with Spirit`;
    }
    else {
      // Default case (no scaling)
      damageText = ability.isHealing ? 
          `<div>Healing: ${ability.damage} HP</div>` : 
          `<div>Damage: ${ability.damage} points</div>`;
      scalingText = "No scaling";
    }
    
    return { damageText, scalingText };
  }
}

// Make utilities available globally for traditional scripts
if (typeof window !== 'undefined') {
  window.TeamBuilderUtils = TeamBuilderUtils;
  console.log("TeamBuilderUtils loaded and exported to window.TeamBuilderUtils");
}
