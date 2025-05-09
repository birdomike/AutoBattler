/**
 * TurnIndicator.js
 * A floor marker component that highlights the active character's position during battle
 * 
 * @version 0.6.2.4
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
     */
    showAt(x, y, color, duration) {
        if (this.fadeTween) {
            this.fadeTween.stop();
            this.fadeTween = null;
        }

        this.clear();
        this.setPosition(x, y);
        
        // Create a 3D-like circle with gradient and shadow
        const radius = 55;
        
        // Draw shadow slightly offset
        this.fillStyle(0x000000, 0.3);
        this.fillEllipse(2, 4, radius + 2, radius * 0.5 + 2);
        
        // Draw flattened ellipse for 3D effect
        const gradientColor = Phaser.Display.Color.IntegerToColor(color);
        
        // Handle color darkening with error protection
        let darkerColor;
        try {
            // First try with instance method approach (newer Phaser versions)
            if (typeof gradientColor.darken === 'function') {
                const darkened = gradientColor.clone().darken(40);
                darkerColor = darkened.color;
            }
            // Fall back to static method approach if available (some Phaser versions)
            else if (typeof Phaser.Display.Color.darken === 'function') {
                darkerColor = Phaser.Display.Color.darken(gradientColor, 40).color;
            }
            // Manual fallback calculation if neither method is available
            else {
                darkerColor = (
                    ((Math.max(0, gradientColor.r - 40) & 0xFF) << 16) |
                    ((Math.max(0, gradientColor.g - 40) & 0xFF) << 8) |
                    (Math.max(0, gradientColor.b - 40) & 0xFF)
                );
            }
        } catch (error) {
            console.warn('Error darkening color, using fallback:', error);
            // Simple fallback - just use a color 40% darker (manually calculated)
            darkerColor = (
                ((Math.max(0, gradientColor.r - 40) & 0xFF) << 16) |
                ((Math.max(0, gradientColor.g - 40) & 0xFF) << 8) |
                (Math.max(0, gradientColor.b - 40) & 0xFF)
            );
        }
        
        // Fill with gradient from center to edge
        this.fillGradientStyle(color, color, darkerColor, darkerColor, 1);
        this.fillEllipse(0, 0, radius, radius * 0.5);
        
        // Add a subtle rim light
        this.lineStyle(1, 0xffffff, 0.4);
        this.strokeEllipse(0, 0, radius, radius * 0.5);

        this.fadeTween = this.scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: duration,
            ease: 'Linear'
        });
    }

    /**
     * Hide the indicator with a fade out animation
     * @param {number} duration - Duration of fade-out animation in milliseconds
     */
    hide(duration) {
        if (this.fadeTween) {
            this.fadeTween.stop();
            this.fadeTween = null;
        }

        this.fadeTween = this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: duration,
            ease: 'Linear'
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
    console.log("TurnIndicator loaded and registered globally");
}
