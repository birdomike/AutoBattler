# Status Effect Visualization Implementation - Part 1

This document explains the implementation details for adding status effect visualization to the Phaser battle scene.

## Overview

Part 1 of the implementation focuses on establishing the core infrastructure needed to display status effects:

1. Creating the `StatusEffectContainer` component for rendering status effects
2. Updating `CharacterSprite` to integrate with the container
3. Preloading status effect icons in the `BattleScene`
4. Setting up event listeners for status effect events

## Technical Implementation Details

### 1. StatusEffectContainer Component

Created a new component to manage status effect icons for characters:

```javascript
class StatusEffectContainer {
    constructor(scene, parent) {
        this.scene = scene;
        this.parent = parent;
        
        // Configuration settings
        this.config = {
            iconSize: 24,         // Size of each status icon
            spacing: 4,           // Spacing between icons
            maxIcons: 6,          // Maximum visible icons before +N
            backgroundAlpha: 0.5, // Alpha value for backgrounds
            yOffset: 20,          // Distance below character
            fadeSpeed: 200        // Animation speed
        };
        
        // Create container for all icons
        this.container = this.scene.add.container(0, this.config.yOffset);
        this.container.setDepth(this.parent.container.depth + 1);
        
        // Arrays to track status effects and UI elements
        this.statusEffects = [];   // Data
        this.iconContainers = [];  // Visual elements
        
        // Initialize
        this.initialize();
    }
    
    // ... other methods ...
}
```

Key features of the component:

- **Positioning**: Places icons below the character's health bar
- **Type-based colors**: Different status effect types use distinct colors:
  - Buffs: Blue (#4488ff)
  - Debuffs: Orange (#ff8844)
  - DoT: Red (#ff4444)
  - HoT: Green (#44ff44)
  - Control: Purple (#aa44ff)
  - Shield: Gray (#aaaaaa)
- **Visual counters**: Displays duration and stack count
- **Animation**: Fade-in/out effects when status effects are added/removed
- **+N indicator**: Shows when a character has more effects than can be displayed

The component doesn't connect to BattleBridge yet - that will be implemented in Part 2.

### 2. CharacterSprite Integration

Modified `CharacterSprite.js` to create and manage a `StatusEffectContainer`:

```javascript
// In constructor
this.config = Object.assign({
    x: 0,
    y: 0,
    scale: 1,
    showName: true,
    showHealth: true,
    showStatusEffects: true  // New configuration option
}, config);

// After creating action indicator
if (this.config.showStatusEffects) {
    try {
        console.log(`CharacterSprite (${character.name}): Creating status effect container...`);
        this.statusEffectContainer = new StatusEffectContainer(scene, this);
        console.log(`CharacterSprite (${character.name}): Status effect container created.`);
    } catch(error) {
        console.error(`CharacterSprite Constructor (${character.name}): Error creating status effect container:`, error);
    }
}

// In destroy method
if (this.statusEffectContainer) {
    try {
        this.statusEffectContainer.destroy();
        console.log(`CharacterSprite destroy: Status effect container destroyed for ${this.character?.name || 'Unknown'}`);
    } catch (error) {
        console.error(`CharacterSprite destroy: Error destroying status effect container for ${this.character?.name || 'Unknown'}:`, error);
    }
    this.statusEffectContainer = null;
}
```

### 3. Asset Preloading

Updated `BattleScene.preload()` to load all status effect icons:

```javascript
// Preload status effect icons
try {
    console.log('BattleScene: Preloading status effect icons...');
    
    // Set the base path for status icons
    this.load.path = 'assets/images/icons/status/status-icons/';
    
    // Status effect icons - map directly to statusId without the "status_" prefix
    const statusIconIds = [
        'burn', 'poison', 'regen', 'stun', 'freeze', 'shield',
        'atk_up', 'atk_down', 'def_up', 'def_down', 'spd_up', 'spd_down',
        'str_up', 'str_down', 'int_up', 'int_down', 'spi_up', 'spi_down',
        'taunt', 'evade', 'bleed', 'reflect', 'vulnerable', 'immune', 'crit_up'
    ];
    
    // Load each status icon
    statusIconIds.forEach(iconId => {
        const key = `status_${iconId}`;
        this.load.image(key, `${iconId}.png`);
        console.log(`BattleScene: Preloading status icon ${key}`);
    });
    
    // Reset the path after loading status icons
    this.load.path = '';
    
    console.log('BattleScene: Status effect icons preload complete');
} catch (error) {
    console.warn('BattleScene: Could not preload status effect icons:', error);
}
```

This preloads 25 different status effect icons that will be used to visualize various status effects.

### 4. Event Listener Setup

Added a method to `BattleScene` to set up event listeners for status effects:

```javascript
/**
 * Set up event listeners for status effects
 */
setupStatusEffectListeners() {
    if (!this.battleBridge) {
        console.error('BattleScene: Cannot set up status effect listeners - BattleBridge not connected');
        return;
    }
    
    // Listen for STATUS_EFFECT_APPLIED events
    this.battleBridge.addEventListener(
        this.battleBridge.eventTypes.STATUS_EFFECT_APPLIED, 
        this.handleStatusEffectApplied.bind(this)
    );
    
    // Listen for STATUS_EFFECT_REMOVED events
    this.battleBridge.addEventListener(
        this.battleBridge.eventTypes.STATUS_EFFECT_REMOVED, 
        this.handleStatusEffectRemoved.bind(this)
    );
    
    // Listen for STATUS_EFFECT_UPDATED events
    this.battleBridge.addEventListener(
        this.battleBridge.eventTypes.STATUS_EFFECT_UPDATED, 
        this.handleStatusEffectUpdated.bind(this)
    );
    
    console.log('BattleScene: Status effect listeners registered');
}
```

Added corresponding event handler methods:

- `handleStatusEffectApplied`: Shows visual feedback when a status effect is applied
- `handleStatusEffectRemoved`: Shows visual feedback when a status effect expires
- `handleStatusEffectUpdated`: Placeholder for future functionality

This completes the event-handling framework but doesn't yet connect the events to the `StatusEffectContainer` component.

## What's Next (Part 2)

The next phase of implementation will focus on:

1. Implementing the `StatusEffectTooltip` component for showing details about status effects
2. Adding event listener methods to `StatusEffectContainer` to handle status effect events
3. Creating direct connections between status effect events and visual updates
4. Enhancing BattleManager to provide detailed status effect information in events

## Testing Considerations

For Part 1, testing should focus on:

- Ensuring the StatusEffectContainer is created and attached to characters
- Verifying status effect icons are properly preloaded
- Confirming event listeners are registered correctly
- Checking for any errors in console during initialization

Full visual testing will be possible after Part 2 is implemented.