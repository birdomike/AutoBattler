/**
 * TurnIndicator.js
 * A floor marker component that highlights the active character's position during battle
 * 
 * @version 0.6.2.6
 * @updated Removed shadow, simplified implementation
 */

class TurnIndicator extends Phaser.GameObjects.Graphics {
    /**
     * Constructor for TurnIndicator
     * @param {Phaser.Scene} scene - The scene this indicator belongs to
     */
    constructor(scene) {
        super(scene);
        scene.add.existing(this);
        this.setAlpha(0);
        this.scene = scene;
        this.fadeTween = null;
    }

    /**
     * Show the indicator at specified position with given color
     * @param {number} x - X position for the indicator
     * @param {number} y - Y position for the indicator
     * @param {number} color - Color of the indicator (hexadecimal)
     * @param {number} duration - Duration of fade-in animation in milliseconds
     * @param {number} offsetY - Optional vertical offset for fine-tuning position
     */
    showAt(x, y, color, duration = 300, offsetY = -8) {
        if (this.fadeTween) {
            this.fadeTween.stop();
            this.fadeTween = null;
        }

        this.clear();
        this.setPosition(x, y + offsetY);
        
        // Create a flattened ellipse for the floor marker
        // Simplified version without shadow
        // Reduced by 25% while maintaining same proportions
        const radius = 56; // 75 * 0.75 = 56.25 (rounded to 56)
        
        // Draw the highlight ellipse with solid color
        this.fillStyle(color, 0.9);
        this.fillEllipse(0, 0, radius, radius * 0.27); // Flattened ellipse
        
        // Animation with pulsing effect
        this.fadeTween = this.scene.tweens.add({
            targets: this,
            alpha: { from: 0.3, to: 0.7 }, // Pulsing range
            duration: 1200,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1 // Infinite repetition
        });
    }

    /**
     * Hide the indicator with a fade out animation
     * @param {number} duration - Duration of fade-out animation in milliseconds
     */
    hide(duration = 300) {
        if (this.fadeTween) {
            this.fadeTween.stop();
            this.fadeTween = null;
        }

        this.fadeTween = this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: duration,
            ease: 'Sine.easeOut'
        });
    }

    /**
     * Clean up the indicator resources
     * @param {boolean} fromScene - Whether this is being destroyed by a scene
     */
    destroy(fromScene) {
        if (this.fadeTween) {
            this.fadeTween.stop();
            this.fadeTween = null;
        }
        super.destroy(fromScene);
    }
}

// Make component available globally
if (typeof window !== 'undefined') {
    window.TurnIndicator = TurnIndicator;
    console.log("TurnIndicator loaded and registered globally - shadow removed per request");
}
