/**
 * StatusEffectTooltip.js
 * A singleton component to display tooltips for status effects
 * Enhanced version with improved visual design and interaction
 * 
 * Version 0.5.3.4 - 2025-05-18
 */

class StatusEffectTooltip {
    /**
     * Create a new StatusEffectTooltip
     * @param {Phaser.Scene} scene - The Phaser scene this tooltip belongs to
     */
    constructor(scene) {
        // Store singleton instance
        if (window.statusEffectTooltip) {
            console.debug('StatusEffectTooltip: Instance already exists, returning existing instance');
            return window.statusEffectTooltip;
        }
        
        this.scene = scene;
        
        // Configuration settings for enhanced tooltip
        this.config = {
            minWidth: 180,       // Minimum width of tooltip
            padding: {
                x: 16,           // Horizontal padding inside tooltip
                y: 12,           // Vertical padding inside tooltip
                inner: 8         // Inner padding between elements
            },
            cornerRadius: 6,     // Rounded corner radius
            backgroundColor: 0x111825,  // Dark navy blue background
            backgroundAlpha: 0.9,  // Slightly less transparent
            borderColor: 0x3498db,  // Bright blue border
            borderWidth: 1,       // Thinner, more elegant border
            textColor: {
                title: '#ffffff',    // White for title
                description: '#cccccc', // Light gray for description
                info: '#99ccff'     // Light blue for additional info
            },
            fontSize: {
                title: 14,        // Title font size
                description: 12,  // Description font size
                info: 10          // Additional info font size
            },
            animationSpeed: {
                show: 120,       // Show animation speed (faster)
                hide: 100        // Hide animation speed (faster)
            },
            offset: {
                icon: 15,        // Offset from icon
                mouse: 10        // Offset from mouse cursor
            }
        };
        
        // Current status details
        this.currentStatus = null;
        
        // Create container
        this.createTooltip();
        
        // Store as singleton
        window.statusEffectTooltip = this;
        
        console.log('StatusEffectTooltip: Created enhanced singleton instance');
    }
    
    /**
     * Show the tooltip at the specified position with status effect details
     * @param {string} statusId - The ID of the status effect
     * @param {Object} definition - The status effect definition
     * @param {Object} position - The position {x, y} to show the tooltip
     * @param {number} duration - Duration of the status effect in turns
     * @param {number} stacks - Number of stacks of the effect
     */
    showTooltip(statusId, definition, position, duration, stacks) {
        // Check if scene is still valid
        if (!this.scene || !this.scene.sys || !this.scene.sys.isActive()) {
            console.warn('[StatusEffectTooltip] Cannot show tooltip, scene is invalid or inactive.');
            return;
        }
        // Store current status details
        this.currentStatus = {
            statusId,
            definition,
            position,
            duration,
            stacks
        };
        
        // Clear any existing content
        this.clearContent();
        
        // Get title and description from definition or fallback
        const title = definition?.name || statusId.replace('status_', '').toUpperCase();
        const description = definition?.description || 'Status effect';
        
        // Create text elements
        this.createTooltipContent(title, description, duration, stacks, definition);
        
        // Position tooltip with improved positioning logic
        this.positionTooltip(position);
        
        // Show with animation
        this.container.setVisible(true);
        this.container.setAlpha(0);
        
        // Clear any existing tweens
        if (this.currentTween) {
            this.scene.tweens.remove(this.currentTween);
        }
        
        // Create fade-in animation
        this.currentTween = this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: this.config.animationSpeed.show,
            ease: 'Cubic.easeOut'
        });
    }
    
    /**
     * Create the tooltip container and base elements
     */
    createTooltip() {
        // Create container at depth 1000 to ensure it's above other elements
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(1000);
        
        // Create graphics for background and border
        this.graphics = this.scene.add.graphics();
        this.container.add(this.graphics);
        
        // Create text elements with centered alignment
        this.titleText = this.scene.add.text(
            0, 0, '',
            {
                fontFamily: 'Arial',
                fontSize: this.config.fontSize.title,
                color: this.config.textColor.title,
                fontStyle: 'bold',
                align: 'center'  // Center-align title text
            }
        ).setOrigin(0.5, 0.5);  // Set origin to center for centered positioning
        
        this.descText = this.scene.add.text(
            0, 0, '',
            {
                fontFamily: 'Arial',
                fontSize: this.config.fontSize.description,
                color: this.config.textColor.description,
                wordWrap: { width: 0 }, // Will be set dynamically
                align: 'center'  // Center-align description text
            }
        ).setOrigin(0.5, 0.5);  // Set origin to center for centered positioning
        
        this.infoText = this.scene.add.text(
            0, 0, '',
            {
                fontFamily: 'Arial',
                fontSize: this.config.fontSize.info,
                color: this.config.textColor.info,
                align: 'center'  // Center-align info text
            }
        ).setOrigin(0.5, 0.5);  // Set origin to center for centered positioning
        
        // Add text elements to container
        this.container.add([this.titleText, this.descText, this.infoText]);
        
        // Hide initially
        this.container.setVisible(false);
        
        // Add to scene
        this.scene.add.existing(this.container);
    }
    
    /**
     * Format a status effect ID or name to be more user-friendly
     * @param {string} statusName - Status effect name or ID to format
     * @returns {string} - Formatted user-friendly name
     */
    formatStatusName(statusName) {
        if (!statusName) return 'Unknown Effect';
        
        // If name is already provided in a user-friendly format from definition, use it
        // But ensure it's not all uppercase (like 'SHIELD')
        if (statusName && !statusName.includes('_') && !statusName.includes('status_')) {
            // Check if it's all uppercase (like 'SHIELD', 'IMMUNE', etc.)
            if (statusName === statusName.toUpperCase()) {
                // Convert all-caps to Title Case
                return statusName.charAt(0).toUpperCase() + statusName.slice(1).toLowerCase();
            }
            // Just capitalize first letter if it's already in a good format (mixed case)
            return statusName.charAt(0).toUpperCase() + statusName.slice(1);
        }
        
        // Remove 'status_' prefix if present
        let name = statusName.replace('status_', '');
        
        // Handle common abbreviations
        const abbreviations = {
            'atk_up': 'Attack Up',
            'atk_down': 'Attack Down',
            'def_up': 'Defense Up',
            'def_down': 'Defense Down', 
            'spd_up': 'Speed Up',
            'spd_down': 'Speed Down',
            'str_up': 'Strength Up',
            'str_down': 'Strength Down',
            'int_up': 'Intellect Up',
            'int_down': 'Intellect Down',
            'spi_up': 'Spirit Up',
            'spi_down': 'Spirit Down',
            'regen': 'Regeneration',
            'dot': 'Damage Over Time',
            'hot': 'Healing Over Time',
            'shield': 'Shield',
            'immune': 'Immunity',
            'taunt': 'Taunt',
            'burn': 'Burn',
            'stun': 'Stun',
            'freeze': 'Freeze',
            'bleed': 'Bleeding',
            'poison': 'Poison',
            'evade': 'Evasion',
            'reflect': 'Damage Reflect',
            'vulnerable': 'Vulnerability',
            'crit_up': 'Critical Chance Up'
        };
        
        // Check if this is a known abbreviation (case insensitive)
        if (abbreviations[name.toLowerCase()]) {
            return abbreviations[name.toLowerCase()];
        }
        
        // Handle if the name is all uppercase (like 'SHIELD', 'IMMUNE', etc.)
        if (name === name.toUpperCase()) {
            name = name.toLowerCase();
        }
        
        // Format by replacing underscores with spaces and capitalizing each word
        return name.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    
    /**
     * Create and layout the tooltip content based on status effect details
     * @param {string} title - Status effect name
     * @param {string} description - Status effect description
     * @param {number} duration - Status effect duration in turns
     * @param {number} stacks - Number of stacks of the effect
     * @param {Object} definition - Status effect definition
     */
    createTooltipContent(title, description, duration, stacks, definition) {
        // Format the title to be more user-friendly
        const formattedTitle = this.formatStatusName(title);
        
        // Set text content with center alignment
        if (this.titleText) {
            this.titleText.setText(formattedTitle);
        } else {
            console.warn(`[StatusEffectTooltip] Attempted to set text on a null titleText object for statusId: ${title}`);
        }
        
        if (this.descText) {
            this.descText.setText(description);
        } else {
            console.warn(`[StatusEffectTooltip] Attempted to set text on a null descText object for statusId: ${title}`);
        }
        
        // Create info text with proper formatting
        let infoLines = [];
        
        // Add duration
        if (duration > 0) {
            infoLines.push(`Duration: ${duration} turn${duration !== 1 ? 's' : ''}`);
        }
        
        // Add stacks
        if (stacks > 1) {
            infoLines.push(`Stacks: ${stacks}`);
        }
        
        // Add type
        if (definition?.type) {
            infoLines.push(`Type: ${definition.type.charAt(0).toUpperCase() + definition.type.slice(1)}`);
        }
        
        // Set info text
        if (this.infoText) {
            this.infoText.setText(infoLines.join('\n'));
        } else {
            console.warn(`[StatusEffectTooltip] Attempted to set text on a null infoText object for statusId: ${title}`);
        }
        
        // Calculate optimal width based on content
        let titleWidth = this.titleText ? this.titleText.width : 0;
        let descWidth = this.descText ? this.descText.width : 0;
        let infoWidth = this.infoText ? this.infoText.width : 0;
        
        const textWidth = Math.max(titleWidth, descWidth, infoWidth);
        
        // Calculate tooltip width with padding
        const tooltipWidth = Math.max(
            this.config.minWidth,
            textWidth + (this.config.padding.x * 2)
        );
        
        // Update word wrap width
        if (this.descText) {
            this.descText.setWordWrapWidth(tooltipWidth - (this.config.padding.x * 2));
        }
        
        // Position elements with proper spacing (centered horizontally)
        const startY = this.config.padding.y;
        const centerX = tooltipWidth / 2;
        
        // Position title at top (centered)
        let titleHeight = 0;
        if (this.titleText) {
            titleHeight = this.titleText.height;
            this.titleText.setPosition(centerX, startY + (titleHeight / 2));
        }
        
        // Position description below title with spacing (centered)
        let descHeight = 0;
        if (this.descText) {
            descHeight = this.descText.height;
            const descY = startY + titleHeight + this.config.padding.inner + (descHeight / 2);
            this.descText.setPosition(centerX, descY);
        }
        
        // Position info text below description with spacing (centered)
        if (this.infoText) {
            const descYPosition = startY + titleHeight + this.config.padding.inner;
            const infoY = descYPosition + (descHeight / 2) + this.config.padding.inner + (this.infoText.height / 2);
            this.infoText.setPosition(centerX, infoY);
        }
        
        // Calculate total height
        let infoHeight = this.infoText ? this.infoText.height : 0;
        let descYPosition = startY + titleHeight + this.config.padding.inner;
        let infoY = descYPosition + (descHeight / 2) + this.config.padding.inner;
        const tooltipHeight = infoY + (infoHeight / 2) + this.config.padding.y;
        
        // Draw background and border with rounded corners
        if (this.graphics) {
            this.graphics.clear();
            
            // Set border color based on status effect type
            const borderColor = this.getBorderColorByType(definition?.type);
            
            // Create gradient background
            const bgTopColor = this.config.backgroundColor;
            const bgBottomColor = Phaser.Display.Color.IntegerToRGB(bgTopColor);
            bgBottomColor.r = Math.max(0, bgBottomColor.r - 10);
            bgBottomColor.g = Math.max(0, bgBottomColor.g - 10);
            bgBottomColor.b = Math.max(0, bgBottomColor.b - 10);
            const bgBottomColorInt = Phaser.Display.Color.GetColor(
                bgBottomColor.r, 
                bgBottomColor.g, 
                bgBottomColor.b
            );
            
            // Draw background with subtle gradient
            this.graphics.fillGradientStyle(
                bgTopColor, bgTopColor,  // Top colors
                bgBottomColorInt, bgBottomColorInt,  // Bottom colors
                this.config.backgroundAlpha
            );
        
            // Draw rounded rectangle background
            this.graphics.fillRoundedRect(
                0, 0,
                tooltipWidth,
                tooltipHeight,
                this.config.cornerRadius
            );
            
            // Draw border with slight inset
            this.graphics.lineStyle(
                this.config.borderWidth,
                borderColor,
                1
            );
            this.graphics.strokeRoundedRect(
                this.config.borderWidth / 2,
                this.config.borderWidth / 2,
                tooltipWidth - this.config.borderWidth,
                tooltipHeight - this.config.borderWidth,
                this.config.cornerRadius
            );
        }
        
        // Store dimensions for positioning
        this.tooltipWidth = tooltipWidth;
        this.tooltipHeight = tooltipHeight;
    }
    
    /**
     * Get border color based on status effect type
     * @param {string} type - Type of status effect
     * @returns {number} - Phaser color value
     */
    getBorderColorByType(type) {
        switch (type?.toLowerCase()) {
            case 'buff': return 0x4488ff;     // Blue for buffs
            case 'debuff': return 0xff8844;   // Orange for debuffs
            case 'dot': return 0xff4444;      // Red for damage over time
            case 'hot': return 0x44ff44;      // Green for healing over time
            case 'control': return 0xaa44ff;  // Purple for control effects
            case 'shield': return 0xaaaaaa;   // Gray for shields
            default: return this.config.borderColor; // Default blue
        }
    }
    
    /**
     * Position the tooltip smartly based on available space
     * @param {Object} position - Target position {x, y}
     */
    positionTooltip(position) {
        // Start with default positioning above the target
        let tooltipX = position.x;
        let tooltipY = position.y - this.config.offset.icon;
        
        // Get screen bounds
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        
        // Check if tooltip would go off the right edge
        if (tooltipX + (this.tooltipWidth / 2) > screenWidth) {
            tooltipX = screenWidth - (this.tooltipWidth / 2) - 10;
        }
        
        // Check if tooltip would go off the left edge
        if (tooltipX - (this.tooltipWidth / 2) < 0) {
            tooltipX = (this.tooltipWidth / 2) + 10;
        }
        
        // Check if tooltip would go off the top edge
        let positionBelow = false;
        if (tooltipY - this.tooltipHeight < 0) {
            // Position below target instead
            tooltipY = position.y + this.config.offset.icon;
            positionBelow = true;
        }
        
        // Adjust for bottom edge if positioning below
        if (positionBelow && tooltipY + this.tooltipHeight > screenHeight) {
            // If we can't fit above or below, position to the side
            tooltipY = screenHeight - this.tooltipHeight - 10;
        }
        
        // Center the tooltip horizontally on the provided x position
        this.container.setPosition(tooltipX - (this.tooltipWidth / 2), tooltipY - (positionBelow ? 0 : this.tooltipHeight));
    }
    
    /**
     * Clear the tooltip content
     */
    clearContent() {
        if (this.titleText) {
            this.titleText.setText('');
        }
        if (this.descText) {
            this.descText.setText('');
        }
        if (this.infoText) {
            this.infoText.setText('');
        }
        if (this.graphics) {
            this.graphics.clear();
        }
    }
    
    /**
     * Hide the tooltip with a fade-out animation
     */
    hideTooltip() {
        if (!this.container || !this.container.visible) return;
        
        // Clear any existing tweens
        if (this.currentTween) {
            this.scene.tweens.remove(this.currentTween);
        }
        
        // Create fade-out animation
        this.currentTween = this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: this.config.animationSpeed.hide,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                this.container.setVisible(false);
                this.currentStatus = null;
            }
        });
    }
    
    /**
     * Update the tooltip position (useful for moving with cursor)
     * @param {Object} position - New position {x, y}
     */
    updatePosition(position) {
        if (!this.container.visible || !this.currentStatus) return;
        
        // Update stored position
        this.currentStatus.position = position;
        
        // Reposition tooltip
        this.positionTooltip(position);
    }
    
    /**
     * Destroy the tooltip instance
     */
    destroy() {
        if (this.currentTween) {
            this.scene.tweens.remove(this.currentTween);
            this.currentTween = null;
        }
        
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        
        // Explicitly null out references to child objects
        this.titleText = null;
        this.descText = null;
        this.infoText = null;
        this.graphics = null;
        
        // Remove singleton reference
        if (window.statusEffectTooltip === this) {
            window.statusEffectTooltip = null;
        }
    }
}

// Ensure the class is globally accessible
if (typeof window !== 'undefined') {
    window.StatusEffectTooltip = StatusEffectTooltip;
}