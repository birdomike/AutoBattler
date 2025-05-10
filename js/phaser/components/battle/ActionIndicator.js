/**
 * ActionIndicator.js
 * A component for displaying floating action text above characters during battle.
 * Shows what action a character is currently performing (auto attack, abilities, etc.)
 */
class ActionIndicator {
    /**
     * Create a new ActionIndicator
     * @param {Phaser.Scene} scene - The scene this indicator belongs to
     * @param {CharacterSprite} parent - The character sprite this indicator is attached to
     */
    constructor(scene, parent) {
        // Log to verbose
        if (window.VERBOSE_LOGGING) {
            console.log(`ActionIndicator constructor called for character: ${parent?.character?.name || 'unknown'}`);
        }

        this.scene = scene;
        this.parent = parent;
        this.text = null;
        this.timeline = null;
        this.isAnimating = false;
        
        this.initialize();
    }
    
    /**
     * Initialize the text object with default styling
     */
    initialize() {
        // Create text with shadow for better readability
        this.text = this.scene.add.text(0, -60, '', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 2,
                stroke: true,
                fill: true
            }
        });
        
        // Set origin to center of text for better positioning
        this.text.setOrigin(0.5, 0.5);
        
        // Start invisible
        this.text.setAlpha(0);
        
        // Add to the parent's container if it exists, otherwise directly to scene
        if (this.parent.container) {
            if (window.VERBOSE_LOGGING) {
                console.log(`ActionIndicator.initialize: Adding text to parent container for ${this.parent?.character?.name}`);
            }
            this.parent.container.add(this.text);
            
            // Since we're adding to the container, position is relative to container origin (0,0)
            // Default position above the character's head
            this.text.setPosition(0, -60);
        } else {
            console.warn(`ActionIndicator.initialize: No parent container for ${this.parent?.character?.name}`);
            // Position relative to parent manually
            this.updatePosition();
        }
    }
    
    /**
     * Update the indicator position relative to parent
     */
    updatePosition() {
        if (!this.parent || !this.text) return;
        
        // Position above the character's head
        if (this.parent.container) {
            // Position is relative to container
            this.text.setPosition(0, -60);
        } else {
            // Position relative to scene coordinates
            const xPos = this.parent.x || 0;
            const yPos = (this.parent.y || 0) - 60;
            this.text.setPosition(xPos, yPos);
        }
        
        if (window.VERBOSE_LOGGING) {
            console.log(`ActionIndicator.updatePosition: Updated for ${this.parent?.character?.name}, text position: (${this.text.x}, ${this.text.y}), parent has container: ${this.parent?.container ? 'yes' : 'no'}`);
        }
    }
    
    /**
     * Show action text with animation
     * @param {string} actionText - The text to display
     * @param {object} options - Optional configuration for the animation
     */
    showAction(actionText, options = {}) {
        if (window.VERBOSE_LOGGING) {
            console.log(`ActionIndicator.showAction: Called with text: '${actionText}' for character: ${this.parent?.character?.name || 'unknown'}. Text position before update: (${this.text?.x}, ${this.text?.y}). Parent container exists: ${this.parent?.container ? 'yes' : 'no'}`);
        }
        
        // Default options
        const config = {
            color: '#ffffff', // default white
            duration: 1500,   // how long to display
            rise: 20,         // how far it rises during animation
            ...options        // override with any provided options
        };
        
        // Cancel any existing animation
        if (this.timeline) {
            this.timeline.stop();
            this.timeline.destroy();
        };
        
        // Update text and color
        this.text.setText(actionText);
        this.text.setColor(config.color);
        
        // Make sure position is correct before animation
        this.updatePosition();
        
        // Log the current position to verbose
        if (window.VERBOSE_LOGGING) {
            console.log(`ActionIndicator.showAction: Text position after update: (${this.text.x}, ${this.text.y}) for character: ${this.parent?.character?.name || 'unknown'}`);
        }
        
        // Store original y position
        const startY = this.text.y;
        
        // Create animation timeline
        this.timeline = this.scene.tweens.createTimeline();
        
        // Add fade in while rising
        this.timeline.add({
            targets: this.text,
            alpha: 1,
            y: startY - (config.rise / 2),
            duration: 300,
            ease: 'Power1'
        });
        
        // Add hold phase
        this.timeline.add({
            targets: this.text,
            alpha: 1,
            duration: config.duration - 600, // Subtract fade in/out time
            hold: config.duration - 600,
            onStart: () => {
                this.isAnimating = true;
            }
        });
        
        // Add fade out while continuing to rise
        this.timeline.add({
            targets: this.text,
            alpha: 0,
            y: startY - config.rise,
            duration: 300,
            ease: 'Power1',
            onComplete: () => {
                this.isAnimating = false;
            }
        });
        
        // Start the animation
        this.timeline.play();
    }
    
    /**
     * Show auto attack action
     */
    showAutoAttack() {
        this.showAction('Auto Attack', {
            color: '#f0f0f0' // Light grey color
        });
    }
    
    /**
     * Show ability action
     * @param {string} abilityName - The name of the ability
     */
    showAbility(abilityName) {
        this.showAction(abilityName, {
            color: '#42f5a7' // Light green color for abilities
        });
    }
    
    /**
     * Show status effect action (like applying a buff/debuff)
     * @param {string} statusName - The name of the status effect
     */
    showStatusEffect(statusName) {
        this.showAction(`Status: ${statusName}`, {
            color: '#f5d142' // Gold color for status effects
        });
    }
    
    /**
     * Hide the action indicator immediately
     */
    hide() {
        if (this.timeline) {
            this.timeline.stop();
            this.timeline.destroy();
            this.timeline = null;
        }
        this.text.setAlpha(0);
        this.isAnimating = false;
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.hide();
        if (this.text) {
            this.text.destroy();
            this.text = null;
        }
        this.parent = null;
        this.scene = null;
    }
}

// Make the class available globally
window.ActionIndicator = ActionIndicator;
