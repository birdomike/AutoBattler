/**
 * Button Component
 * A reusable button component for Phaser UI
 */
class Button extends Phaser.GameObjects.Container {
    /**
     * Create a new button
     * @param {Phaser.Scene} scene - The scene this button belongs to
     * @param {number} x - The x position
     * @param {number} y - The y position
     * @param {string} text - The button text
     * @param {Object} style - The button style
     * @param {Function} callback - The callback function
     */
    constructor(scene, x, y, text, style = {}, callback = null) {
        super(scene, x, y);
        
        // Default style
        this.style = {
            width: style.width || 200,
            height: style.height || 50,
            color: style.color || 0x3742fa,
            hoverColor: style.hoverColor || 0x2536e0,
            disabledColor: style.disabledColor || 0x596275,
            textColor: style.textColor || '#ffffff',
            fontSize: style.fontSize || '18px',
            fontFamily: style.fontFamily || 'Arial',
            cornerRadius: style.cornerRadius || 8,
            ...style
        };
        
        // Create background
        this.background = scene.add.rectangle(0, 0, this.style.width, this.style.height, this.style.color)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        
        // Round corners if specified
        if (this.style.cornerRadius > 0) {
            this.background.setRoundedRectangle(
                this.style.width,
                this.style.height,
                this.style.cornerRadius
            );
        }
        
        // Create text
        this.text = scene.add.text(0, 0, text, {
            fontFamily: this.style.fontFamily,
            fontSize: this.style.fontSize,
            fill: this.style.textColor,
            align: 'center'
        }).setOrigin(0.5);
        
        // Add to container
        this.add([this.background, this.text]);
        
        // Add to scene
        scene.add.existing(this);
        
        // Set up events
        this.setupEvents(callback);
        
        // Set initial state
        this.setEnabled(true);
    }
    
    /**
     * Set up button events
     * @param {Function} callback - The callback function
     */
    setupEvents(callback) {
        // Hover effects
        this.background.on('pointerover', () => {
            if (this.enabled) {
                this.background.fillColor = this.style.hoverColor;
                
                // Scale effect
                this.scene.tweens.add({
                    targets: this,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100,
                    ease: 'Power1'
                });
            }
        });
        
        this.background.on('pointerout', () => {
            if (this.enabled) {
                this.background.fillColor = this.style.color;
                
                // Reset scale
                this.scene.tweens.add({
                    targets: this,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100,
                    ease: 'Power1'
                });
            }
        });
        
        // Click effect
        this.background.on('pointerdown', () => {
            if (this.enabled) {
                // Play sound if available
                if (window.soundManager) {
                    window.soundManager.play('click');
                }
                
                // Scale down effect
                this.scene.tweens.add({
                    targets: this,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 50,
                    ease: 'Power1',
                    yoyo: true,
                    onComplete: () => {
                        // Execute callback
                        if (callback) {
                            callback();
                        }
                    }
                });
            }
        });
    }
    
    /**
     * Set the button text
     * @param {string} text - The new button text
     */
    setText(text) {
        this.text.setText(text);
        return this;
    }
    
    /**
     * Enable or disable the button
     * @param {boolean} enabled - Whether the button should be enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (enabled) {
            this.background.fillColor = this.style.color;
            this.text.setAlpha(1);
            this.background.input.cursor = 'pointer';
        } else {
            this.background.fillColor = this.style.disabledColor;
            this.text.setAlpha(0.6);
            this.background.input.cursor = 'default';
        }
        
        return this;
    }
}
