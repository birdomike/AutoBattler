/**
 * Panel Component
 * A reusable panel/container component for Phaser UI
 */
class Panel extends Phaser.GameObjects.Container {
    /**
     * Create a new panel
     * @param {Phaser.Scene} scene - The scene this panel belongs to
     * @param {number} x - The x position
     * @param {number} y - The y position
     * @param {number} width - The panel width
     * @param {number} height - The panel height
     * @param {Object} style - The panel style
     */
    constructor(scene, x, y, width, height, style = {}) {
        super(scene, x, y);
        
        this.width = width;
        this.height = height;
        
        // Default style
        this.style = {
            backgroundColor: style.backgroundColor || 0x232a40,
            borderColor: style.borderColor || 0x596275,
            borderWidth: style.borderWidth || 0,
            alpha: style.alpha !== undefined ? style.alpha : 1,
            cornerRadius: style.cornerRadius || 8,
            shadow: style.shadow !== undefined ? style.shadow : true,
            shadowColor: style.shadowColor || 0x000000,
            shadowAlpha: style.shadowAlpha || 0.5,
            shadowBlur: style.shadowBlur || 10,
            shadowOffsetX: style.shadowOffsetX || 0,
            shadowOffsetY: style.shadowOffsetY || 5,
            ...style
        };
        
        // Create the panel background
        this.createBackground();
        
        // Add to scene
        scene.add.existing(this);
    }
    
    /**
     * Create the panel background
     */
    createBackground() {
        // Add shadow first if enabled
        if (this.style.shadow) {
            this.shadow = this.scene.add.rectangle(
                this.style.shadowOffsetX,
                this.style.shadowOffsetY,
                this.width,
                this.height,
                this.style.shadowColor,
                this.style.shadowAlpha
            ).setOrigin(0.5);
            
            // Apply corner radius to shadow if needed
            if (this.style.cornerRadius > 0) {
                this.shadow.setRoundedRectangle(
                    this.width,
                    this.height,
                    this.style.cornerRadius
                );
            }
            
            // Add blur effect if supported
            if (this.shadow.postFX) {
                this.shadow.postFX.addBlur(0, 0, this.style.shadowBlur, this.style.shadowBlur, 0x000000, 1);
            }
            
            this.add(this.shadow);
        }
        
        // Create the main background
        this.background = this.scene.add.rectangle(
            0,
            0,
            this.width,
            this.height,
            this.style.backgroundColor,
            this.style.alpha
        ).setOrigin(0.5);
        
        // Apply corner radius if needed
        if (this.style.cornerRadius > 0) {
            this.background.setRoundedRectangle(
                this.width,
                this.height,
                this.style.cornerRadius
            );
        }
        
        this.add(this.background);
        
        // Add border if needed
        if (this.style.borderWidth > 0) {
            this.border = this.scene.add.rectangle(
                0,
                0,
                this.width,
                this.height,
                this.style.borderColor
            ).setOrigin(0.5)
            .setStrokeStyle(this.style.borderWidth, this.style.borderColor);
            
            // Apply corner radius to border
            if (this.style.cornerRadius > 0) {
                this.border.setRoundedRectangle(
                    this.width,
                    this.height,
                    this.style.cornerRadius
                );
            }
            
            this.add(this.border);
        }
    }
    
    /**
     * Add a title to the panel
     * @param {string} text - The title text
     * @param {Object} style - Text style options
     * @returns {Phaser.GameObjects.Text} The created text object
     */
    addTitle(text, style = {}) {
        // Default title style
        const titleStyle = {
            fontFamily: style.fontFamily || 'Arial',
            fontSize: style.fontSize || '24px',
            fill: style.fill || '#ffffff',
            align: style.align || 'center',
            ...style
        };
        
        // Create title text
        this.title = this.scene.add.text(
            0,
            -this.height / 2 + 20,
            text,
            titleStyle
        ).setOrigin(0.5, 0);
        
        this.add(this.title);
        return this.title;
    }
    
    /**
     * Set the background color
     * @param {number} color - The color value
     * @param {number} alpha - The alpha value
     */
    setBackgroundColor(color, alpha = 1) {
        this.background.fillColor = color;
        this.background.fillAlpha = alpha;
        return this;
    }
    
    /**
     * Make the panel interactive
     * @param {Function} callback - Callback function when clicked
     */
    setInteractive(callback = null) {
        this.background.setInteractive({ useHandCursor: true });
        
        if (callback) {
            this.background.on('pointerdown', callback);
        }
        
        return this;
    }
    
    /**
     * Add a fade-in animation to the panel
     * @param {number} duration - The animation duration in milliseconds
     */
    fadeIn(duration = 300) {
        this.alpha = 0;
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: duration,
            ease: 'Power2'
        });
        return this;
    }
    
    /**
     * Add a slide-in animation to the panel
     * @param {string} direction - The direction to slide from ('up', 'down', 'left', 'right')
     * @param {number} distance - The slide distance in pixels
     * @param {number} duration - The animation duration in milliseconds
     */
    slideIn(direction = 'down', distance = 100, duration = 300) {
        const initialPosition = { x: this.x, y: this.y };
        
        switch (direction) {
            case 'up':
                this.y = initialPosition.y + distance;
                break;
            case 'down':
                this.y = initialPosition.y - distance;
                break;
            case 'left':
                this.x = initialPosition.x + distance;
                break;
            case 'right':
                this.x = initialPosition.x - distance;
                break;
        }
        
        this.scene.tweens.add({
            targets: this,
            x: initialPosition.x,
            y: initialPosition.y,
            duration: duration,
            ease: 'Power2'
        });
        
        return this;
    }
}
