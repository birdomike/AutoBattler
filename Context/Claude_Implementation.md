# Claude's Implementation Guide for AutoBattler

> **PURPOSE OF THIS DOCUMENT:** This is the technical implementation reference for Claude to assist with specific development tasks in the AutoBattler game. It contains detailed guides, code examples, troubleshooting steps, and technical patterns. While "Claude_Core.md" explains what the system is, this document focuses on how to work with the system.

> When Claude needs to assist with adding new features, debugging issues, or understanding technical patterns, this is the document to reference. This focused approach reduces token usage while providing detailed implementation guidance without needing to load the entire system architecture documentation.

> For understanding the overall game architecture, core systems, and development status, refer to the companion document "Claude_Core.md".


# Implementation Guides

## Guide: Adding New Arena Backgrounds

This section provides instructions for adding new arena backgrounds to the battle system. When the user adds a new background image to `C:\Personal\AutoBattler\assets\images\Arena Art`, follow these steps to properly implement it:

### Step 1: Add CSS for the New Background

In `BattleUI.js`, find the Arena backgrounds CSS section (around line 445) and add a new entry for your background:

```css
.arena-newbackground {
    background-image: url('assets/images/Arena Art/New Background.png');
    background-size: cover;
    background-position: center;
}
```

Make sure to use the correct file name and extension, and note that we use relative paths starting with 'assets/' (not '/assets/').

### Step 2: Update the Background Options in BattleUI

Find the `showSettings` method in `BattleUI.js` and update the `bgOptions` array to include your new background. For example:

```javascript
// Only offer backgrounds that actually exist
const bgOptions = ['default', 'grassyfield', 'newbackground'];
```

### Step 3: Update the Background Verification

Find the `verifyBackgroundImages` call in the `initialize` method of BattleUI.js and add your new background to the array:

```javascript
this.verifyBackgroundImages(['default', 'grassyfield', 'newbackground']);
```

### Step 4: Update the setArenaBackground Method

Modify the conditional check at the beginning of the `setArenaBackground` method to include your new background:

```javascript
// Accept valid backgrounds
if (backgroundKey !== 'default' && backgroundKey !== 'grassyfield' && backgroundKey !== 'newbackground') {
    console.log(`Background '${backgroundKey}' not implemented yet, using 'grassyfield' instead`);
    backgroundKey = 'grassyfield';
}
```

Also update the class removal line to include your new background:

```javascript
arenaElement.classList.remove('arena-default', 'arena-grassyfield', 'arena-newbackground');
```

Finally, modify the background image URL selection logic to handle your new background:

```javascript
if (backgroundKey !== 'default') {
    let imageUrl;
    
    switch(backgroundKey) {
        case 'grassyfield':
            imageUrl = 'assets/images/Arena Art/Grassy Field.png';
            break;
        case 'newbackground':
            imageUrl = 'assets/images/Arena Art/New Background.png';
            break;
        default:
            imageUrl = 'assets/images/Arena Art/Grassy Field.png'; // fallback
    }
    
    // Apply the background image
    arenaElement.style.backgroundImage = `url("${imageUrl}")`;
    // ... rest of the code
}
```

### Step 5: Testing the New Background

Test the new background by starting a battle and using the Settings button (gear icon) to select your new background. Make sure it loads correctly and displays properly in the battle arena.

### Troubleshooting Common Issues

1. **Background Not Showing**: Make sure the image path is correct and the file exists in the specified location.
2. **Path Issues**: Ensure you're using relative paths starting with 'assets/' not '/assets/'.
3. **CSS Not Applied**: Check that the CSS class name exactly matches the background key used in the code.
4. **Image Format**: Make sure the image is in a web-friendly format (PNG, JPG, etc.)
5. **File Size**: Large images may cause performance issues - consider optimizing large background images.

## Guide: Integrating New Character Art

This section provides instructions for adding new character art to the game. When the user adds new PNG files to `C:\Personal\AutoBattler\assets\images\Character Art`, follow these steps to properly implement them in both UI contexts.

### Step 1: Update Character Image Paths

The first step is to add the new image paths to both loader systems:

#### In TeamBuilderImageLoader.js

1. Locate the `characterImages` object in the constructor (around line 18)
2. Add a new entry for each character following this format:
   ```javascript
   this.characterImages = {
       'Aqualia': 'assets/images/Character Art/Aqualia.png',
       'NewCharacterName': 'assets/images/Character Art/NewCharacterName.png'
   };
   ```

#### In DirectImageLoader.js

1. Locate the `characterImages` object (around line 21)
2. Add the same entry to maintain consistency:
   ```javascript
   characterImages: {
       'Aqualia': 'assets/images/Character Art/Aqualia.png',
       'NewCharacterName': 'assets/images/Character Art/NewCharacterName.png'
   },
   ```

### Step 2: Create Optimized Battle Version

1. Create a battle-optimized version of the character art at exactly 80x120 pixels
2. Save this optimized version in the `assets/images/Character Art/Combat_Version/` folder
3. Ensure the filename matches the original filename exactly

### Step 3: Add Positioning in characters.json

The character's data in `characters.json` should be updated to include positioning information:

```json
{
  "id": 7,
  "name": "NewCharacterName",
  "type": "fire",
  "role": "Warrior",
  "rarity": "Rare",
  "stats": {
    "hp": 95,
    "attack": 18,
    "defense": 10,
    "speed": 12,
    "strength": 95,
    "intellect": 25,
    "spirit": 24
  },
  "art": {                    // Base positioning for Battle UI
    "left": "-12px",
    "top": "-52px",
    "width": "80px",
    "height": "120px"
  },
  "teamBuilderArt": {        // Specific positioning for Team Builder UI
    "left": "-20px",
    "top": "-45px",
    "width": "90px",
    "height": "130px"
  },
  "detailArt": {             // Specific positioning for Detail View
    "left": "-30px",
    "top": "-45px",
    "width": "140px",
    "height": "140px"
  },
  "abilities": [
    {
      "name": "Sample Ability",
      "damage": 25,
      "cooldown": 3,
      "isHealing": false,
      "damageType": "physical",
      "description": "A strong physical attack"
    }
  ]
}
```

Each positioning context is optional. If a specific context isn't defined, the system will fall back to the next available one in this order:
1. Context-specific setting (detailArt or teamBuilderArt)
2. Generic art setting
3. Default positioning

### Step 4: Implementing in Team Builder UI

The Team Builder UI automatically loads character art through the TeamBuilderImageLoader. Key points:

1. Images are loaded when the Team Builder initializes
2. The image cache is global and persists throughout the session
3. Three UI contexts to consider:
   - Available Heroes grid: Character card thumbnails
   - Team Slots: Selected character thumbnails
   - Hero Details: Larger character portrait

The TeamBuilderImageLoader handles all three contexts based on the art positioning settings:
- For grid and team slots: Uses `teamBuilderArt` or falls back to `art`
- For detail view: Uses `detailArt` or falls back to `teamBuilderArt`, then `art`

### Step 5: Implementing in Battle System UI

The Battle UI loads character art through the DirectImageLoader (DOM version) or the CharacterSprite component (Phaser version). Key differences from Team Builder:

1. Only uses the base `art` positioning (not teamBuilderArt or detailArt)
2. DOM version: Injects art into circle elements with class `.character-circle`
3. Phaser version: Uses optimized battle sprites from the Combat_Version folder
4. Character name is identified through a sibling element with class `.text-sm.font-semibold`

### Step 6: Testing Character Art Integration

After adding new character art:

1. Verify appearance in Team Builder:
   - Check that art appears in the Available Heroes grid
   - Check that art appears when character is selected in team slots
   - Check that art appears properly in the Hero Details panel

2. Verify appearance in Battle UI:
   - Start a battle with the character on your team
   - Check that art appears correctly positioned over the circle
   - Verify that art moves correctly during attack animations

3. Troubleshooting common issues:
   - If art doesn't appear in Team Builder, check browser console for errors in TeamBuilderImageLoader
   - If art doesn't appear in Battle UI, check browser console for errors in DirectImageLoader
   - If art position is incorrect, adjust the positioning values in characters.json
   - If art flickers, ensure the global CHARACTER_IMAGE_CACHE is properly populated

### Example: Complete Implementation Process

1. User adds new character art to `C:\Personal\AutoBattler\assets\images\Character Art\Drakarion.png`
2. User creates optimized battle version at `C:\Personal\AutoBattler\assets\images\Character Art\Combat_Version\Drakarion.png`

3. Update TeamBuilderImageLoader.js:
   ```javascript
   this.characterImages = {
       'Aqualia': 'assets/images/Character Art/Aqualia.png',
       'Drakarion': 'assets/images/Character Art/Drakarion.png'
   };
   ```

4. Update DirectImageLoader.js:
   ```javascript
   characterImages: {
       'Aqualia': 'assets/images/Character Art/Aqualia.png',
       'Drakarion': 'assets/images/Character Art/Drakarion.png'
   },
   ```

5. Update positioning in characters.json for Drakarion:
   ```json
   "art": {
     "left": "-15px",
     "top": "-50px",
     "width": "85px",
     "height": "125px"
   },
   "teamBuilderArt": {
     "left": "-22px",
     "top": "-48px"
   },
   "detailArt": {
     "left": "-35px",
     "top": "-50px",
     "width": "150px",
     "height": "150px"
   }
   ```

6. Verify in browser that Drakarion's art appears correctly in all contexts

## Guide: Using the Expanded Base Stats System

This section provides detailed information on working with the expanded base stats system (Strength, Intellect, Spirit) that has been implemented in the game.

### Stat Overview

The AutoBattler game uses seven primary stats:

1. **HP**: Health Points - How much damage a character can take before being defeated
2. **Attack**: Attack Power - Determines basic attack damage
3. **Defense**: Defense - Reduces damage taken from attacks
4. **Speed**: Speed - Determines turn order in battle (higher goes first)
5. **Strength**: Enhances physical ability damage
6. **Intellect**: Enhances spell ability damage
7. **Spirit**: Enhances healing and utility ability effectiveness

### Ability Types and Stat Scaling

Every ability has a `damageType` property that determines which stat affects its effectiveness:

1. **physical**: Scales with Strength
   - Formula: `base_damage + (strength * 0.5)`
   - Example: A physical ability with 20 base damage used by a character with 100 Strength would deal 20 + (100 * 0.5) = 70 pre-defense damage

2. **spell**: Scales with Intellect
   - Formula: `base_damage + (intellect * 0.5)`
   - Example: A spell ability with 30 base damage used by a character with 140 Intellect would deal 30 + (140 * 0.5) = 100 pre-defense damage

3. **healing**: Scales with Spirit
   - Formula: `base_healing + (spirit * 0.5)`
   - Example: A healing ability with 25 base healing used by a character with 120 Spirit would restore 25 + (120 * 0.5) = 85 health

4. **utility**: Effect scales with Spirit but doesn't deal direct damage
   - These abilities provide effects like buffs, debuffs, or evasion
   - The effectiveness or duration may scale with Spirit (currently a 30% scaling factor)

### Creating Balanced Characters

When balancing characters or creating new ones:

1. **Maintain the 325 Point Total**: Each character should have exactly 325 points distributed across all seven stats to ensure balance
2. **Follow Role Patterns**: Use the Base Stat Template as a guide for appropriate stat distribution by role
3. **Primary Stat Focus**: Ensure characters have appropriate primary stats based on their role:
   - Physical attackers (Warriors, Rangers, etc.): High Strength
   - Spell casters (Mages, Sorcerers, etc.): High Intellect
   - Healers (Clerics, Paladins, etc.): High Spirit

### Adding New Abilities with Proper Scaling

When adding new abilities to the game:

1. Include the `damageType` property for every ability
2. Choose the appropriate type based on the ability's nature:
   ```json
   {
     "name": "Fireball",
     "damage": 30,
     "damageType": "spell",
     "cooldown": 3,
     "isHealing": false,
     "description": "Launches a fiery projectile that deals spell damage"
   }
   ```
3. For healing abilities, include both `isHealing: true` and `damageType: "healing"` for proper handling in both battle logic and UI
4. For utility abilities that don't deal damage, use `damageType: "utility"` to indicate they scale with Spirit

### Example Role-Based Stat Distributions

Here are examples of appropriate stat distributions for different roles (level 1):

1. **Warrior** (Physical Damage Dealer):
   - HP: 122, ATK: 29, DEF: 21, SPD: 9
   - STR: 95, INT: 25, SPI: 24
   - Primary Focus: High Strength for physical abilities

2. **Mage** (Spell Damage Dealer):
   - HP: 82, ATK: 19, DEF: 8, SPD: 13
   - STR: 13, INT: 146, SPI: 44
   - Primary Focus: High Intellect for spell abilities

3. **Cleric** (Healer):
   - HP: 100, ATK: 19, DEF: 19, SPD: 8
   - STR: 13, INT: 48, SPI: 118
   - Primary Focus: High Spirit for healing abilities

4. **Knight** (Defensive Tank):
   - HP: 139, ATK: 26, DEF: 34, SPD: 6
   - STR: 74, INT: 23, SPI: 23
   - Primary Focus: High HP and Defense with moderate Strength

### Testing and Troubleshooting

When testing the expanded stat system:

1. Verify each ability type correctly scales with its corresponding stat
2. Check edge cases with very high or low stat values
3. Ensure healing properly scales with Spirit
4. Test utility abilities to confirm they benefit from Spirit
5. Verify tooltips display correct scaling information
6. Check that battle log messages show correct stat contributions


## Guide: Working with Enhanced Turn Highlighting

This section explains how to modify the turn highlighting system that shows which character is currently active during battle.

### Core Files and Components

- **CharacterSprite.js** (`js/phaser/components/battle/CharacterSprite.js`): Contains the `highlight()` and `unhighlight()` methods that create the visual indicators
- **TeamContainer.js** (`js/phaser/components/battle/TeamContainer.js`): Contains `showTurnIndicator()` and `clearTurnIndicators()` methods
- **BattleScene.js** (`js/phaser/scenes/BattleScene.js`): Contains `handleTurnStarted()` method that triggers the highlighting

### Adjusting the Floor Indicator Appearance

#### Size and Shape

To modify the size and shape of the floor indicators, adjust these values in `CharacterSprite.js`:

```javascript
// Shadow ellipse (larger, appears behind the highlight)
this.shadowEffect = this.scene.add.ellipse(0, bottomOffset, 60, 15, 0x000000, 0.4);
                                           // ^ position   ^ width ^ height ^ color ^ opacity

// Highlight ellipse (team-colored, appears above shadow)
this.highlightEffect = this.scene.add.ellipse(0, bottomOffset - 2, 55, 13, teamColor, 0.4);
                                              // ^ position    ^ width ^ height ^ color ^ opacity
```

- **Width/Height Ratio**: A wider, flatter ellipse (e.g., 60x15) creates a better 3D floor appearance
- **Opacity**: Values between 0.3-0.6 work well (higher = more visible)

#### Vertical Position

To adjust how high/low the indicator appears beneath characters:

```javascript
// Vertical position calculation
bottomOffset = (this.characterImage.height / 2) - 17;
```

- **Larger negative value**: Moves indicator higher (closer to character)
- **Smaller negative value or positive value**: Moves indicator lower (further from character)

#### Team Colors

To change the team color scheme:

```javascript
// Team color definition
const teamColor = this.character?.team === 'player' ? 0x4488ff : 0xff4444;
                                              // ^ player color (blue)  ^ enemy color (red)
```

#### Animation Settings

To adjust the pulsing animation:

```javascript
this.glowTween = this.scene.tweens.add({
    targets: this.highlightEffect,
    alpha: { from: 0.3, to: 0.7 },  // Alpha range (transparency)
    duration: 1200,                 // Animation duration in ms
    ease: 'Sine.easeInOut',         // Easing function
    yoyo: true,                     // Reverse animation
    repeat: -1                      // Infinite looping
});
```

### Implementation Flow

1. `BattleManager` dispatches TURN_STARTED event when a character's turn begins
2. `BattleScene.handleTurnStarted()` receives this event
3. `TeamContainer.showTurnIndicator()` is called for the active character
4. `CharacterSprite.highlight()` creates the visual indicators
5. Animation runs until the turn ends or another character is highlighted
6. `CharacterSprite.unhighlight()` hides the indicators

### Troubleshooting

- **Indicators Not Appearing**: Verify team colors are defined correctly, check console for errors
- **Wrong Position**: Adjust bottomOffset calculation to move indicators up/down
- **Too Large/Small**: Modify ellipse width/height values for better proportions
- **Not Visible Enough**: Increase opacity values (0.4 → 0.6)
- **No Animation**: Check that scene.tweens is available and animation duration isn't set to 0

This system has been refined over multiple versions to create a subtle but effective visual cue for active characters during battle.

---

# Technical Reference

## MutationObserver Pattern for Character Art

The character art system uses an optimized MutationObserver pattern with these key features:

1. **Targeted Observation**: Only specific DOM containers that recycle elements are watched
   ```javascript
   const targets = document.querySelectorAll('#heroes-grid, #team-slots');
   targets.forEach(t => observer.observe(t, {...}));
   ```

2. **Idempotent Processing**: Uses data attributes to track state and prevent redundant work
   ```javascript
   // Early exit checks
   if (container.querySelector('.character-art')) return; // Already has art
   if (container.dataset.artSynced === '1') return;      // Already processed this frame
   container.dataset.artSynced = '1';                    // Mark as processed
   ```

3. **Animation Frame Throttling**: Uses requestAnimationFrame instead of setTimeout
   ```javascript
   if (throttleId) return; // Already scheduled
   throttleId = requestAnimationFrame(() => {
     // Processing logic here
     throttleId = null;
   });
   ```

4. **Cleanup Before Adding**: Removes duplicate elements before adding new ones
   ```javascript
   const extraArts = artWrapper.querySelectorAll('.character-art:not(:first-child)');
   extraArts.forEach(el => el.remove());
   ```

5. **Enable/Disable Control**: Global functions to disable during complex operations
   ```javascript
   window.disableArtObserver();  // Before complex DOM operations
   // ... DOM changes ...
   window.enableArtObserver();   // After changes complete
   ```

This pattern prevents performance issues, reduces console spam, and ensures stable rendering even with frequent DOM changes.

## Project Design Guidelines

- The game aims to be a fun, visually appealing autobattler with strategic depth and progression
- Focus on creating engaging battle animations and visual feedback
- Implement randomness in combat to keep battles interesting
- RPG-style progression with character leveling and ability unlocking
- The project is configured for a 1920x1080 resolution through project.config
- Refer to DEVELOPMENT_PLAN.md for the complete roadmap
