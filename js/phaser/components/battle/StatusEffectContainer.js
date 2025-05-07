/**
 * StatusEffectContainer.js
 * A component to display status effect icons for a character in the battle scene
 * 
 * Version 0.5.3.0 - 2025-05-15
 */

class StatusEffectContainer {
    /**
     * Handle bulk status effects changed event
     * @param {Object} data - Event data containing character and effects array
     */
    handleStatusEffectsChanged(data) {
        // Only process for our parent character
        if (!this.parent || !this.parent.character) return;
        if (!data || !data.character) return;
        
        // Compare character identifiers
        const sameCharacter = 
            // First check unique ID
            (data.character.uniqueId && this.parent.character.uniqueId && 
             data.character.uniqueId === this.parent.character.uniqueId) ||
            // Then check regular ID
            (data.character.id && this.parent.character.id && 
             data.character.id === this.parent.character.id) ||
            // Finally check name as fallback
            (data.character.name === this.parent.character.name && 
             data.character.team === this.parent.character.team);
        
        if (!sameCharacter) return;
        
        console.log(`StatusEffectContainer: Bulk status effects update for ${this.parent.character.name}`);
        
        // Get the array of effects
        const effects = data.effects;
        if (!Array.isArray(effects)) return;
        
        // Clear existing status effects and icons
        this.statusEffects = [];
        this.iconContainers.forEach(container => container.destroy());
        this.iconContainers = [];
        
        // Add each effect
        effects.forEach(effect => {
            // Add to our tracking array
            this.statusEffects.push({
                statusId: effect.id,
                definition: {
                    name: effect.name,
                    description: effect.description,
                    type: effect.effectType
                },
                duration: effect.duration,
                stacks: effect.stacks || 1
            });
            
            // Create and add icon
            this.addIconForEffect(this.statusEffects.length - 1);
        });
        
        // Arrange icons
        this.arrangeIcons();
    }
    
    /**
     * Create a new StatusEffectContainer
     * @param {Phaser.Scene} scene - The Phaser scene this container belongs to
     * @param {CharacterSprite} parent - The parent CharacterSprite this container is attached to
     */
    constructor(scene, parent) {
        this.scene = scene;
        this.parent = parent;
        
        // Configuration settings - adjusted for 32px source images
        this.config = {
            iconSize: 24,         // Display size of each status icon in pixels
            spacing: 4,           // Spacing between icons in pixels
            maxIcons: 6,          // Maximum number of icons to display before showing +N
            backgroundAlpha: 0.5, // Alpha value for icon backgrounds
            yOffset: 20,          // Distance below character to position icons
            fadeSpeed: 200,       // Icon fade in/out speed in ms
            originalIconSize: 32  // Original size of AI icons in pixels
        };
        
        // Create a container for all status effect icons
        this.container = this.scene.add.container(0, this.config.yOffset);
        
        // Set depth to ensure it's above character but below potential tooltips
        this.container.setDepth(this.parent.container.depth + 1);
        
        // Arrays to track status effects and their UI elements
        this.statusEffects = [];   // Status effect data
        this.iconContainers = [];  // Icon visual containers
        
        // Create tooltip (shared across all status effects)
        this.tooltip = new StatusEffectTooltip(scene);
        
        // Initialize the container
        this.initialize();
    }
    
    /**
     * Initialize the StatusEffectContainer
     */
    initialize() {
        // Add container to the parent character
        this.parent.container.add(this.container);
        
        // Position the container at the bottom of the character
        this.updatePosition();
        
        // Set up event listeners for status effects
        this.setupEventListeners();
        
        console.log('StatusEffectContainer: Initialized for character:', this.parent.character.name);
    }
    
    /**
     * Set up event listeners for status effect events
     */
    setupEventListeners() {
        // Get the battle bridge instance
        const bridge = window.battleBridge || (window.getBattleBridge ? window.getBattleBridge() : null);
        
        if (!bridge) {
            console.error('StatusEffectContainer: BattleBridge not available');
            return;
        }
        
        // Listen for status effect applied event
        bridge.addEventListener(
            bridge.eventTypes.STATUS_EFFECT_APPLIED, 
            this.handleStatusEffectApplied.bind(this)
        );
        
        // Listen for status effect removed event
        bridge.addEventListener(
            bridge.eventTypes.STATUS_EFFECT_REMOVED, 
            this.handleStatusEffectRemoved.bind(this)
        );
        
        // Listen for status effect updated event
        bridge.addEventListener(
            bridge.eventTypes.STATUS_EFFECT_UPDATED, 
            this.handleStatusEffectUpdated.bind(this)
        );
        
        // Listen for bulk status effects changed event
        bridge.addEventListener(
            bridge.eventTypes.STATUS_EFFECTS_CHANGED,
            this.handleStatusEffectsChanged.bind(this)
        );
        
        console.log('StatusEffectContainer: Event listeners set up for', this.parent.character.name);
    }
    
    /**
     * Handle status effect applied event
     * @param {Object} data - Event data
     */
    handleStatusEffectApplied(data) {
        // Only process for our parent character
        if (!this.parent || !this.parent.character) return;
        if (!data || !data.character) return;
        
        // Compare character identifiers
        const sameCharacter = 
            // First check unique ID
            (data.character.uniqueId && this.parent.character.uniqueId && 
             data.character.uniqueId === this.parent.character.uniqueId) ||
            // Then check regular ID
            (data.character.id && this.parent.character.id && 
             data.character.id === this.parent.character.id) ||
            // Finally check name as fallback
            (data.character.name === this.parent.character.name && 
             data.character.team === this.parent.character.team);
        
        if (!sameCharacter) return;
        
        console.log(`StatusEffectContainer: Status effect applied to ${this.parent.character.name} - ${data.statusId}`);
        
        // Check if effect already exists
        const existingIndex = this.statusEffects.findIndex(e => e.statusId === data.statusId);
        
        if (existingIndex >= 0) {
            // Update existing effect
            this.statusEffects[existingIndex].duration = data.duration;
            this.statusEffects[existingIndex].stacks = data.stacks || 1;
            this.statusEffects[existingIndex].definition = data.statusDefinition;
            this.updateIconDisplay(existingIndex);
        } else {
            // Add new effect
            this.statusEffects.push({
                statusId: data.statusId,
                definition: data.statusDefinition,
                duration: data.duration,
                stacks: data.stacks || 1
            });
            
            // Create and add the icon
            this.addIconForEffect(this.statusEffects.length - 1);
        }
        
        // Update overall display
        this.arrangeIcons();
    }
    
    /**
     * Handle status effect removed event
     * @param {Object} data - Event data
     */
    handleStatusEffectRemoved(data) {
        // Only process for our parent character
        if (!this.parent || !this.parent.character) return;
        if (!data || !data.character) return;
        
        // Compare character identifiers
        const sameCharacter = 
            // First check unique ID
            (data.character.uniqueId && this.parent.character.uniqueId && 
             data.character.uniqueId === this.parent.character.uniqueId) ||
            // Then check regular ID
            (data.character.id && this.parent.character.id && 
             data.character.id === this.parent.character.id) ||
            // Finally check name as fallback
            (data.character.name === this.parent.character.name && 
             data.character.team === this.parent.character.team);
        
        if (!sameCharacter) return;
        
        console.log(`StatusEffectContainer: Status effect removed from ${this.parent.character.name} - ${data.statusId}`);
        
        // Find effect
        const effectIndex = this.statusEffects.findIndex(e => e.statusId === data.statusId);
        if (effectIndex >= 0) {
            // Remove from our list
            this.statusEffects.splice(effectIndex, 1);
            
            // Remove visual icon
            if (this.iconContainers[effectIndex]) {
                // Create fade-out animation
                this.scene.tweens.add({
                    targets: this.iconContainers[effectIndex],
                    alpha: 0,
                    duration: this.config.fadeSpeed,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        if (this.iconContainers[effectIndex]) {
                            this.iconContainers[effectIndex].destroy();
                            this.iconContainers.splice(effectIndex, 1);
                            // Re-arrange remaining icons
                            this.arrangeIcons();
                        }
                    }
                });
            }
        }
    }
    
    /**
     * Handle status effect updated event
     * @param {Object} data - Event data
     */
    handleStatusEffectUpdated(data) {
        // Only process for our parent character
        if (!this.parent || !this.parent.character) return;
        if (!data || !data.character) return;
        
        // Compare character identifiers
        const sameCharacter = 
            // First check unique ID
            (data.character.uniqueId && this.parent.character.uniqueId && 
             data.character.uniqueId === this.parent.character.uniqueId) ||
            // Then check regular ID
            (data.character.id && this.parent.character.id && 
             data.character.id === this.parent.character.id) ||
            // Finally check name as fallback
            (data.character.name === this.parent.character.name && 
             data.character.team === this.parent.character.team);
        
        if (!sameCharacter) return;
        
        console.log(`StatusEffectContainer: Status effect updated for ${this.parent.character.name} - ${data.statusId}`);
        
        // Find effect
        const effectIndex = this.statusEffects.findIndex(e => e.statusId === data.statusId);
        if (effectIndex >= 0) {
            // Update data
            if (data.duration !== undefined) {
                this.statusEffects[effectIndex].duration = data.duration;
            }
            if (data.stacks !== undefined) {
                this.statusEffects[effectIndex].stacks = data.stacks;
            }
            if (data.statusDefinition) {
                this.statusEffects[effectIndex].definition = data.statusDefinition;
            }
            
            // Update visual display
            this.updateIconDisplay(effectIndex);
        }
    }
    
    /**
     * Update the container's position relative to the parent character
     */
    updatePosition() {
        // Position below the character's health bar
        const parentHeight = this.parent.characterImage ? this.parent.characterImage.height : 120;
        this.container.y = (parentHeight / 2) + this.config.yOffset;
    }
    
    /**
     * Get appropriate color for status effect type
     * @param {string} type - The type of status effect (Buff, Debuff, DoT, HoT, Control, Shield)
     * @returns {number} - Phaser color value
     */
    getTypeColor(type) {
        switch (type?.toLowerCase()) {
            case 'buff': return 0x4488ff;     // Blue for buffs
            case 'debuff': return 0xff8844;   // Orange for debuffs
            case 'dot': return 0xff4444;      // Red for damage over time
            case 'hot': return 0x44ff44;      // Green for healing over time
            case 'control': return 0xaa44ff;  // Purple for control effects
            case 'shield': return 0xaaaaaa;   // Gray for shields
            default: return 0xffffff;         // White for unknown types
        }
    }
    
    /**
     * Add an icon for a status effect
     * @param {number} effectIndex - Index of the effect in the statusEffects array
     */
    addIconForEffect(effectIndex) {
        if (effectIndex < 0 || effectIndex >= this.statusEffects.length) return;
        
        const effect = this.statusEffects[effectIndex];
        const icon = this.createStatusIcon(effect.statusId, effect.definition);
        
        // Update counter displays
        this.updateDurationCounter(icon, effect.duration);
        this.updateStackCounter(icon, effect.stacks);
        
        // Make interactive for tooltip
        this.makeIconInteractive(icon, effectIndex);
        
        // Add to our tracking array
        this.iconContainers.push(icon);
        
        // Add to scene container
        this.container.add(icon);
        
        // Create fade-in animation
        icon.setAlpha(0);
        this.scene.tweens.add({
            targets: icon,
            alpha: 1,
            duration: this.config.fadeSpeed,
            ease: 'Sine.easeIn'
        });
    }
    
    /**
     * Update the visual display of an icon
     * @param {number} effectIndex - Index of the effect in the statusEffects array
     */
    updateIconDisplay(effectIndex) {
        if (effectIndex < 0 || effectIndex >= this.statusEffects.length) return;
        if (effectIndex >= this.iconContainers.length) return;
        
        const effect = this.statusEffects[effectIndex];
        const icon = this.iconContainers[effectIndex];
        
        // Update counters
        this.updateDurationCounter(icon, effect.duration);
        this.updateStackCounter(icon, effect.stacks);
    }
    
    /**
     * Create a visual icon for a status effect
     * @param {string} statusId - The ID of the status effect
     * @param {Object} definition - The status effect definition
     * @returns {Phaser.GameObjects.Container} - Container with the status icon
     */
    createStatusIcon(statusId, definition) {
        // Remove "status_" prefix for icon key if present
        const iconKey = statusId.replace('status_', '');
        
        // Create icon container
        const container = this.scene.add.container(0, 0);
        
        // Create background circle with type-based color
        const typeColor = this.getTypeColor(definition?.type || 'buff');
        const bg = this.scene.add.circle(0, 0, this.config.iconSize/2, typeColor, this.config.backgroundAlpha);
        
        // Try to create the icon sprite
        let sprite;
        try {
            // Use the key format expected by preloaded assets
            sprite = this.scene.add.sprite(0, 0, `status_${iconKey}`);
            
            // Scale from 32px original size to our display size
            const isAIIcon = iconKey.includes('AI_');
            if (isAIIcon || iconKey in (window.StatusIconMapper?.getMapping() || {})) {
                // Scale from originalIconSize (32px) to our display size
                const scaleFactor = this.config.iconSize / this.config.originalIconSize;
                sprite.setScale(scaleFactor);
            } else {
                // Handle non-AI icons with direct size setting
                sprite.setDisplaySize(this.config.iconSize - 4, this.config.iconSize - 4);
            }
        } catch (error) {
            console.warn(`StatusEffectContainer: Failed to load icon for ${iconKey}`, error);
            // Create fallback text
            sprite = this.scene.add.text(0, 0, iconKey.charAt(0).toUpperCase(), { 
                fontSize: '16px',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            });
            sprite.setOrigin(0.5);
        }
        
        // Add elements to the container
        container.add([bg, sprite]);
        
        // Store status data
        container.statusId = statusId;
        container.definition = definition;
        container.duration = definition?.duration || 0;
        container.stacks = 1;
        
        return container;
    }
    
    /**
     * Make an icon interactive for tooltip display
     * @param {Phaser.GameObjects.Container} iconContainer - The icon container
     * @param {number} effectIndex - Index of the effect in the statusEffects array
     */
    makeIconInteractive(iconContainer, effectIndex) {
        // Find the background circle (first child of the container)
        const bg = iconContainer.list[0];
        if (!bg) return;
        
        // Make interactive
        bg.setInteractive({ cursor: 'pointer' });
        
        // Track if icon is clicked (for tooltip persistence)
        iconContainer.isClicked = false;
        
        // Add hover effect
        bg.on('pointerover', () => {
            // Scale up slightly
            this.scene.tweens.add({
                targets: iconContainer,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                ease: 'Sine.easeOut'
            });
            
            // Show tooltip
            const effect = this.statusEffects[effectIndex];
            if (effect && !iconContainer.isClicked) {
                const worldPos = iconContainer.getWorldTransformMatrix();
                this.tooltip.showTooltip(
                    effect.statusId,
                    effect.definition,
                    { x: worldPos.tx, y: worldPos.ty },
                    effect.duration,
                    effect.stacks
                );
            }
        });
        
        // Remove hover effect
        bg.on('pointerout', () => {
            // Scale back to normal
            this.scene.tweens.add({
                targets: iconContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Sine.easeIn'
            });
            
            // Hide tooltip only if not clicked
            if (!iconContainer.isClicked) {
                this.tooltip.hideTooltip();
            }
        });
        
        // Add click handler for tooltip persistence
        bg.on('pointerdown', () => {
            // Toggle clicked state
            iconContainer.isClicked = !iconContainer.isClicked;
            
            if (iconContainer.isClicked) {
                // Show tooltip persistently
                const effect = this.statusEffects[effectIndex];
                if (effect) {
                    const worldPos = iconContainer.getWorldTransformMatrix();
                    this.tooltip.showTooltip(
                        effect.statusId,
                        effect.definition,
                        { x: worldPos.tx, y: worldPos.ty },
                        effect.duration,
                        effect.stacks
                    );
                    
                    // Apply pulsing glow to indicate locked state
                    this.scene.tweens.add({
                        targets: bg,
                        alpha: 0.8,
                        yoyo: true,
                        repeat: -1,
                        duration: 600,
                        ease: 'Sine.easeInOut'
                    });
                }
            } else {
                // Hide tooltip
                this.tooltip.hideTooltip();
                
                // Remove pulsing glow
                this.scene.tweens.remove(bg.tween);
                bg.alpha = 1;
            }
        });
    }
    
    /**
     * Add a duration counter to an icon
     * @param {Phaser.GameObjects.Container} iconContainer - The icon container to update
     * @param {number} duration - The duration value to display
     */
    updateDurationCounter(iconContainer, duration) {
        // Remove existing duration text if any
        const existingText = iconContainer.getAll().find(obj => obj.type === 'Text' && obj.durationText);
        if (existingText) {
            existingText.destroy();
        }
        
        // Only add text if duration is > 0
        if (duration > 0) {
            // Create text with duration value
            const text = this.scene.add.text(0, this.config.iconSize/2 - 2, duration.toString(), {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 2
            });
            text.setOrigin(0.5, 0.5);
            text.durationText = true;
            
            // Add to icon container
            iconContainer.add(text);
        }
    }
    
    /**
     * Add a stack counter to an icon
     * @param {Phaser.GameObjects.Container} iconContainer - The icon container to update
     * @param {number} stacks - The stack count to display
     */
    updateStackCounter(iconContainer, stacks) {
        // Remove existing stack text if any
        const existingText = iconContainer.getAll().find(obj => obj.type === 'Text' && obj.stackText);
        if (existingText) {
            existingText.destroy();
        }
        
        // Only add text if stacks is > 1
        if (stacks > 1) {
            // Create small text with stack count
            const text = this.scene.add.text(this.config.iconSize/2 - 2, -this.config.iconSize/2 + 2, stacks.toString(), {
                fontSize: '10px',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 2
            });
            text.setOrigin(0.5, 0.5);
            text.stackText = true;
            
            // Add to icon container
            iconContainer.add(text);
        }
    }
    
    /**
     * Arrange all status effect icons in a row
     */
    arrangeIcons() {
        // Position icons in a row
        const { iconSize, spacing } = this.config;
        const totalWidth = Math.min(this.iconContainers.length, this.config.maxIcons) * (iconSize + spacing) - spacing;
        
        // Center the row
        let startX = -totalWidth / 2;
        
        // Position each icon
        this.iconContainers.forEach((icon, index) => {
            // If we have more than max icons, show only the first (max-1) plus a +N indicator
            if (index >= this.config.maxIcons - 1 && this.iconContainers.length > this.config.maxIcons) {
                if (index === this.config.maxIcons - 1) {
                    // Show +N indicator for last visible slot
                    this.showExtraEffectsIndicator(startX + (iconSize + spacing) * index);
                }
                icon.setVisible(false);
            } else {
                icon.setPosition(startX + (iconSize + spacing) * index, 0);
                icon.setVisible(true);
            }
        });
    }
    
    /**
     * Show a +N indicator when there are more effects than can be displayed
     * @param {number} x - X position for the indicator
     */
    showExtraEffectsIndicator(x) {
        // Count extra effects
        const extraCount = this.iconContainers.length - (this.config.maxIcons - 1);
        
        // Remove existing indicator if it exists
        if (this.extraIndicator) {
            this.extraIndicator.destroy();
            this.extraIndicator = null;
        }
        
        // Create indicator container
        this.extraIndicator = this.scene.add.container(x, 0);
        
        // Create background with gradient fill for better appearance
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x222222, 0.8);
        bg.fillCircle(0, 0, this.config.iconSize/2);
        
        // Add subtle border
        bg.lineStyle(1, 0x444444, 0.9);
        bg.strokeCircle(0, 0, this.config.iconSize/2);
        
        // Create text
        const text = this.scene.add.text(0, 0, `+${extraCount}`, {
            fontSize: '12px',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        });
        text.setOrigin(0.5);
        
        // Add to container
        this.extraIndicator.add([bg, text]);
        
        // Add to main container
        this.container.add(this.extraIndicator);
        
        // Add hitarea for better interaction
        const hitArea = new Phaser.Geom.Circle(0, 0, this.config.iconSize/2);
        bg.setInteractive(hitArea, Phaser.Geom.Circle.Contains, { cursor: 'pointer' });
        
        // Track clicked state
        this.extraIndicator.isClicked = false;
        
        // Add hover effect
        bg.on('pointerover', () => {
            // Scale up slightly
            if (!this.extraIndicator.isClicked) {
                this.scene.tweens.add({
                    targets: this.extraIndicator,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 100,
                    ease: 'Sine.easeOut'
                });
            }
            
            // Show tooltip with summary of additional effects
            if (!this.extraIndicator.isClicked) {
                // Create tooltip content for multiple effects
                this.showMultiEffectTooltip();
            }
        });
        
        // Remove hover effect
        bg.on('pointerout', () => {
            // Scale back to normal if not clicked
            if (!this.extraIndicator.isClicked) {
                this.scene.tweens.add({
                    targets: this.extraIndicator,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100,
                    ease: 'Sine.easeIn'
                });
                
                // Hide tooltip
                this.tooltip.hideTooltip();
            }
        });
        
        // Add click handler for tooltip persistence
        bg.on('pointerdown', () => {
            // Toggle clicked state
            this.extraIndicator.isClicked = !this.extraIndicator.isClicked;
            
            if (this.extraIndicator.isClicked) {
                // Scale up and stay
                this.scene.tweens.add({
                    targets: this.extraIndicator,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 100,
                    ease: 'Sine.easeOut'
                });
                
                // Show detailed tooltip with all extra effects
                this.showMultiEffectTooltip();
                
                // Add pulsing effect to indicate locked state
                this.extraIndicator.pulseTween = this.scene.tweens.add({
                    targets: text,
                    alpha: 0.7,
                    yoyo: true,
                    repeat: -1,
                    duration: 500,
                    ease: 'Sine.easeInOut'
                });
            } else {
                // Scale back to normal
                this.scene.tweens.add({
                    targets: this.extraIndicator,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100,
                    ease: 'Sine.easeIn'
                });
                
                // Hide tooltip
                this.tooltip.hideTooltip();
                
                // Remove pulsing effect
                if (this.extraIndicator.pulseTween) {
                    this.scene.tweens.remove(this.extraIndicator.pulseTween);
                    text.alpha = 1;
                }
            }
        });
    }
    
    /**
     * Show tooltip with information about multiple effects
     */
    showMultiEffectTooltip() {
        if (!this.extraIndicator) return;
        
        // Get the hidden effects (those beyond max visible)
        const hiddenEffects = this.statusEffects.slice(this.config.maxIcons - 1);
        if (hiddenEffects.length === 0) return;
        
        // Create a title for the tooltip
        const title = `Additional Effects (${hiddenEffects.length})`;
        
        // Create a summary description of hidden effects with formatted names
        const effectNames = hiddenEffects.map(effect => {
            // Get proper formatted name using the tooltip's formatting function
            let name = effect.statusId;
            if (this.tooltip && typeof this.tooltip.formatStatusName === 'function') {
                name = this.tooltip.formatStatusName(effect.statusId);
            } else {
                // Fallback formatting if tooltip formatter is unavailable
                name = effect.definition?.name || 
                       effect.statusId.replace('status_', '')
                       .split('_')
                       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                       .join(' ');
            }
            
            return `${name} (${effect.duration} turns${effect.stacks > 1 ? `, ${effect.stacks} stacks` : ''})`;
        }).join('\n');
        
        // Get world position for tooltip
        const worldPos = this.extraIndicator.getWorldTransformMatrix();
        
        // Show the tooltip
        this.tooltip.showTooltip(
            'multi_effect', // Using a special ID
            { 
                name: title,
                description: effectNames,
                type: 'info' // Using info type for multi-effect tooltip
            },
            { x: worldPos.tx, y: worldPos.ty },
            0, // No duration
            0  // No stacks
        );
    }
    
    /**
     * Destroy this component and clean up resources
     */
    destroy() {
        // Hide tooltip
        if (this.tooltip) {
            this.tooltip.hideTooltip();
        }
        
        // Clean up all icon containers
        this.iconContainers.forEach(container => container.destroy());
        this.iconContainers = [];
        
        // Clean up extra indicator if exists
        if (this.extraIndicator) {
            this.extraIndicator.destroy();
            this.extraIndicator = null;
        }
        
        // Destroy main container
        this.container.destroy();
        
        console.log('StatusEffectContainer: Destroyed for character:', this.parent.character.name);
    }
}

// Ensure the class is globally accessible
if (typeof window !== 'undefined') {
    window.StatusEffectContainer = StatusEffectContainer;
}