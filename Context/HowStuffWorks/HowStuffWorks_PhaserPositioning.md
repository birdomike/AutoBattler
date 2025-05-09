# How Positioning Works in Phaser: A Technical Guide for AutoBattler

## 1. Introduction

### Why Understanding Positioning is Critical

Positioning elements correctly is one of the most fundamental yet challenging aspects of game UI development. In our AutoBattler game, proper positioning affects:

- Character placement on the battlefield
- Visual elements like action indicators, health bars, and floating damage text
- Animations between game objects
- The overall player experience

This document exists because of lessons learned from fixing positioning issues such as the Action Indicator bug (v0.6.3.12), where ability names would appear at the top left of the screen instead of above the character. Understanding these concepts will help prevent similar issues in future development.

## 2. Phaser's Display Object Hierarchy

### The Scene Graph Concept

Phaser, like most game engines, uses a "scene graph" to organize game objects in a hierarchical tree structure. This hierarchy fundamentally affects how positioning works.

```
Scene
│
├── Container A
│   ├── Sprite 1
│   ├── Text 1
│   └── Container B
│       ├── Sprite 2
│       └── Text 2
│
└── Container C
    └── Sprite 3
```

### Key Properties of the Scene Graph

- **Transformations cascade downward**: If you move Container A, all its children (Sprite 1, Text 1, and Container B with its children) move as well.
- **Local coordinates are relative**: Each object's position is defined relative to its parent, not to the scene.
- **Origin affects positioning**: The origin (pivot point) of an object affects how position and rotation are applied.

### In AutoBattler Terms

Our battle scene has a structure like:

```
BattleScene
│
├── TeamContainer (Player)
│   ├── CharacterSprite 1
│   │   ├── Background Circle
│   │   ├── Character Image
│   │   ├── Name Text
│   │   ├── Health Bar Container
│   │   │   ├── Health Bar Background
│   │   │   ├── Health Bar
│   │   │   └── HP Text
│   │   ├── Action Indicator
│   │   └── Status Effect Container
│   │
│   ├── CharacterSprite 2
│   └── ...
│
├── TeamContainer (Enemy)
│   └── ...
│
└── UI Container
    ├── Battle Log
    ├── Control Panel
    └── ...
```

This hierarchy is crucial to understand when positioning UI elements.

## 3. Coordinate Systems Explained

### Local vs. Global Coordinates

Understanding the difference between local and global coordinates is essential for proper positioning:

- **Local coordinates**: Relative to the parent object's origin (0,0)
- **Global/world coordinates**: Absolute position within the scene

![Local vs Global Coordinates](https://placeholder-for-diagram-of-coordinates.png)

*Note: The diagram would show a parent container with (x=100, y=100) and a child at local coordinates (x=50, y=50), resulting in global coordinates of (x=150, y=150).*

### Converting Between Coordinate Systems

Phaser provides methods to convert between coordinate systems:

```javascript
// Get global position of a local point
let globalPoint = new Phaser.Math.Vector2();
gameObject.getWorldTransformMatrix().transformPoint(localX, localY, globalPoint);

// Convert global to local
let localPoint = new Phaser.Math.Vector2();
gameObject.getWorldTransformMatrix().invert().transformPoint(globalX, globalY, localPoint);
```

### The Container Paradigm

Containers are a powerful organizing tool in Phaser. When you add an object to a container:

```javascript
container.add(gameObject);
```

The gameObject's position becomes relative to the container. If gameObject was at (100, 100) in scene coordinates, and then is added to a container at (50, 50), its new local position will be (50, 50) to maintain the same visual position.

### The Origin Point

Every game object has an origin (or pivot point) that affects positioning. By default:

- The origin is (0.5, 0.5) - the center of the object
- Position coordinates refer to where this origin point will be placed

```javascript
// Center the origin (default)
gameObject.setOrigin(0.5, 0.5);

// Set origin to top-left corner
gameObject.setOrigin(0, 0);
```

This origin also affects how rotation is applied.

## 4. AutoBattler's UI Architecture

### Team Containers

Our battle UI uses two main team containers positioned on opposite sides of the screen:

```javascript
// In TeamContainer.js
this.container = scene.add.container(config.x, config.y);
```

The player team is typically positioned on the left side (around x=400), and the enemy team on the right (around x=800).

### Character Sprites

Each CharacterSprite is a complex nested structure:

```javascript
// In CharacterSprite.js
this.container = scene.add.container(this.config.x, this.config.y);
// Various elements are added to this container
this.container.add(this.circle);
this.container.add(this.characterImage);
this.container.add(this.nameText);
this.container.add(this.healthBarContainer);
```

The container hierarchy means that positioning the character's visual elements is done relative to the character container's origin (0,0).

### UI Layers

The battle UI has several layers with different coordinate contexts:

1. **Game World Layer**: Contains team containers and characters
2. **UI Overlay Layer**: Contains battle controls, logs, etc.
3. **Combat Effect Layer**: Contains animations, floating text, etc.

Elements in different layers need different positioning approaches.

## 5. Common Positioning Scenarios

### Character Placement in Formation

Characters are positioned within their team containers using a formation pattern:

```javascript
// In TeamContainer.js
const positions = getFormationPositions(this.characterCount);
for (let i = 0; i < this.characters.length; i++) {
    const sprite = new CharacterSprite(scene, character, {
        x: positions[i].x,
        y: positions[i].y
    });
    this.container.add(sprite.container);
}
```

The positions are determined by predefined formations based on the number of characters.

### Floating Elements (Action Text, Damage Numbers)

Floating elements typically need to:
1. Be positioned relative to their character
2. Move independently of the character

For the Action Indicator text, we position it above the character:

```javascript
// In ActionIndicator.js
if (this.parent.container) {
    this.parent.container.add(this.text);
    // Position above the character's head
    this.text.setPosition(0, -60);
}
```

The key insight from our recent bug fix is that once an object is added to a container, its position is relative to that container's origin.

### Animations Between Objects

Animations that involve multiple objects (like attack animations) require careful coordinate handling:

```javascript
// In CharacterSprite.js - showAttackAnimation method
// Get GLOBAL position of attacker
let attackerGlobalPos = new Phaser.Math.Vector2();
this.container.getWorldTransformMatrix().transformPoint(0, 0, attackerGlobalPos);

// Get GLOBAL position of target
let targetGlobalPos = new Phaser.Math.Vector2();
targetSprite.container.getWorldTransformMatrix().transformPoint(0, 0, targetGlobalPos);

// Calculate movement vector in global space
const moveToX = originalX + (targetX_global - originalX) * 0.7;
const moveToY = originalY + (targetY_global - originalY) * 0.7;

// Convert back to local space for the tween
let moveToLocal = { x: 0, y: 0 };
// convert global coordinates to local space...
```

This complex transformation ensures characters move correctly toward their targets.

## 6. Lessons from the Action Indicator Issue

### The Problem

In the Action Indicator bug, ability names would appear at the top-left of the screen (around x=0, y=100) instead of above the character's head. 

### Root Causes

1. **Initialization Issue**: The text was created at (0,0) with no initial offset
   ```javascript
   // Before fix
   this.text = this.scene.add.text(0, 0, '', { /* styles */ });
   ```

2. **Container Misunderstanding**: The text was added to the character's container, but its position wasn't correctly set relative to the container origin
   ```javascript
   // Before fix
   this.parent.container.add(this.text);
   // Missing: this.text.setPosition(0, -60);  
   ```

3. **Inconsistent Positioning Logic**: The `updatePosition` method wasn't properly handling container-based positioning

### The Solution

1. **Set Initial Position**: Position the text above the character from creation
   ```javascript
   // After fix
   this.text = this.scene.add.text(0, -60, '', { /* styles */ });
   ```

2. **Consistent Container Positioning**: Explicitly position relative to container after adding
   ```javascript
   // After fix
   if (this.parent.container) {
       this.parent.container.add(this.text);
       this.text.setPosition(0, -60);
   }
   ```

3. **Clearer Positioning Logic**: Better handle container vs. direct scene positioning
   ```javascript
   // After fix
   if (this.parent.container) {
       // Position is relative to container
       this.text.setPosition(0, -60);
   } else {
       // Position relative to scene coordinates
       const xPos = this.parent.x || 0;
       const yPos = (this.parent.y || 0) - 60;
       this.text.setPosition(xPos, yPos);
   }
   ```

### Key Insight

The key insight from this bug was: **When an object is added to a container, its position is in the container's local coordinate space.** 

An offset of (0, -60) means "60 pixels above the container's origin" regardless of where the container is in the world.

## 7. Best Practices for New UI Elements

### Positioning Decision Tree

When adding a new UI element, decide:

1. **What is the parent context?**
   - If it should move with a character: Add to character container
   - If it's static UI: Add directly to the scene or UI container
   
2. **What coordinate system to use?**
   - If added to container: Use positions relative to container origin
   - If added to scene: Use global scene coordinates
   
3. **Does it need to interact with objects in different containers?**
   - If yes: Use coordinate transformations (getWorldTransformMatrix)

### Debugging Techniques

For positioning issues:

1. **Visual Debugging**: Add temporary colored dots/rectangles to visualize positions
   ```javascript
   // Add a red dot at target position for debugging
   const debugDot = scene.add.circle(targetX, targetY, 5, 0xff0000);
   // Remove after 3 seconds
   scene.time.delayedCall(3000, () => debugDot.destroy());
   ```

2. **Log Coordinate Values**: Log both local and global positions
   ```javascript
   console.log(`Local: (${gameObject.x}, ${gameObject.y})`);
   
   let globalPos = new Phaser.Math.Vector2();
   gameObject.getWorldTransformMatrix().transformPoint(0, 0, globalPos);
   console.log(`Global: (${globalPos.x}, ${globalPos.y})`);
   ```

3. **Check Parent-Child Relationships**: Verify the object is in the expected container
   ```javascript
   console.log(`Parent: ${gameObject.parentContainer ? gameObject.parentContainer.name : 'scene'}`);
   ```

### Testing Positions Across Different Configurations

- Test with different team sizes (1 vs. 3 vs. 6 characters)
- Test with different window sizes and resolutions
- Test animations when characters are in different positions

## 8. Code Examples

### Properly Positioning New UI Elements

When creating a new floating element above a character:

```javascript
class NewFloatingElement {
    constructor(scene, parentSprite) {
        this.scene = scene;
        this.parent = parentSprite;
        
        // Create the visual element
        this.visual = scene.add.sprite(0, -70, 'iconTexture');
        
        // Important: Add to parent's container
        if (this.parent.container) {
            this.parent.container.add(this.visual);
            // Position is already set relative to container (0, -70)
        } else {
            // Fallback if no container
            this.updatePosition();
        }
    }
    
    updatePosition() {
        if (!this.parent || !this.visual) return;
        
        if (this.parent.container) {
            // Relative to container
            this.visual.setPosition(0, -70);
        } else {
            // Global coordinates
            const parentGlobal = new Phaser.Math.Vector2();
            this.parent.getWorldTransformMatrix().transformPoint(0, 0, parentGlobal);
            this.visual.setPosition(parentGlobal.x, parentGlobal.y - 70);
        }
    }
}
```

### Animating Between Different Containers

When animating between elements in different containers:

```javascript
function animateBetweenContainers(source, target, animatedSprite) {
    // Get global positions
    let sourceGlobal = new Phaser.Math.Vector2();
    source.container.getWorldTransformMatrix().transformPoint(0, 0, sourceGlobal);
    
    let targetGlobal = new Phaser.Math.Vector2();
    target.container.getWorldTransformMatrix().transformPoint(0, 0, targetGlobal);
    
    // Create the sprite in the scene (not in any container)
    const sprite = scene.add.sprite(sourceGlobal.x, sourceGlobal.y, animatedSprite.texture);
    
    // Animate in global coordinates
    scene.tweens.add({
        targets: sprite,
        x: targetGlobal.x,
        y: targetGlobal.y,
        duration: 500,
        onComplete: () => {
            sprite.destroy();
        }
    });
}
```

### Creating UI at Specific Scene Depths

Use depth property to control rendering order:

```javascript
// UI elements should be above game objects
const uiPanel = scene.add.container(400, 300);
uiPanel.setDepth(100);  // Higher depth = renders on top

// Combat effects should be above characters but below UI
const effectSprite = scene.add.sprite(400, 300, 'effectTexture');
effectSprite.setDepth(50);

// Character sprites at standard depth
characterSprite.container.setDepth(10);
```

## 9. Common Pitfalls to Avoid

### 1. Missing Parent-Child Relationships

**Don't:**
```javascript
// Create text positioned relative to a container
const actionText = scene.add.text(container.x, container.y - 60, "Attack");
// Problem: Text won't move when container moves
```

**Do:**
```javascript
// Create text as child of container
const actionText = scene.add.text(0, -60, "Attack");
container.add(actionText);
// Now text moves with container
```

### 2. Mixing Coordinate Systems

**Don't:**
```javascript
// Getting global position
let globalPos = { x: container.x, y: container.y };
// Problem: container.x/y are local to its parent, not global!
```

**Do:**
```javascript
// Getting global position
let globalPos = new Phaser.Math.Vector2();
container.getWorldTransformMatrix().transformPoint(0, 0, globalPos);
```

### 3. Ignoring Origin Points

**Don't:**
```javascript
// Create element without considering origin
const healthBar = scene.add.rectangle(charX, charY + 50, 80, 10, 0xff0000);
// Problem: Rectangle will be centered at that position by default!
```

**Do:**
```javascript
// Create element with explicit origin
const healthBar = scene.add.rectangle(charX, charY + 50, 80, 10, 0xff0000);
healthBar.setOrigin(0, 0.5); // Left-center origin for horizontal bar
```

### 4. Not Cleaning Up When Destroying Objects

**Don't:**
```javascript
// Simply remove the main object
characterSprite.container.destroy();
// Problem: Child objects or references might still exist!
```

**Do:**
```javascript
// Properly clean up all related objects and references
characterSprite.destroy(); // Handles all cleanup internally
```

## 10. Conclusion

Understanding Phaser's positioning system is crucial for creating visually correct and interactive game elements. By remembering these key principles:

1. **Understand the container hierarchy** and how it affects positioning
2. **Be consistent with coordinate systems** (local vs. global)
3. **Set positions explicitly** when adding to containers
4. **Use proper debugging techniques** to identify positioning issues

By following these guidelines, you can avoid positioning bugs like the Action Indicator issue and create more robust UI components that work correctly in all scenarios.

Remember: In Phaser, positioning is always relative to the parent, and transformations cascade down the display hierarchy. When in doubt, log both local and global positions to understand what's happening.
