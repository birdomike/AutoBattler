## Guide: Integrating New Character Art

This section provides instructions for adding new character art to the game. When adding new PNG files to `C:\Personal\AutoBattler\assets\images\Character Art`, follow these steps to properly implement them in all UI contexts.

### Step 1: Update Character Image Paths

The first step is to add the new image paths to the appropriate loader systems:

#### In TeamBuilderImageLoader.js

1. Locate the `characterImages` object in the constructor (around line 18)
2. Add a new entry for each character following this format:
   ```javascript
   this.characterImages = {
       'Aqualia': 'assets/images/Character Art/Aqualia.png',
       'NewCharacterName': 'assets/images/Character Art/NewCharacterName.png'
   };
   ```

#### In DirectImageLoader.js (DOM-based Battle UI)

1. Locate the `characterImages` object (around line 21)
2. Add the same entry to maintain consistency:
   ```javascript
   characterImages: {
       'Aqualia': 'assets/images/Character Art/Aqualia.png',
       'NewCharacterName': 'assets/images/Character Art/NewCharacterName.png'
   },
   ```

#### In BattleAssetLoader.js (Phaser-based Battle UI)

1. Locate the `characterArt` array in the `loadCharacterAssets()` method
2. Add the new character name to the array:
   ```javascript
   const characterArt = [
       'Aqualia', 'Drakarion', 'Zephyr', 'Lumina', 
       'Sylvanna', 'Vaelgor', 'Seraphina', 'NewCharacterName'
   ];
   ```
3. If the character name contains special characters (like parentheses or spaces), add a special case:
   ```javascript
   // Special case for characters with special characters in filename
   const specialCharKey = 'character_SpecialCharName';
   const specialCharPath = 'assets/images/Character Art/Combat_Version/SpecialCharName.png';
   this.scene.load.image(specialCharKey, specialCharPath);
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

The Battle UI has two implementation paths depending on which version is being used:

#### DOM Version (Legacy)
- Loads character art through the DirectImageLoader
- Only uses the base `art` positioning (not teamBuilderArt or detailArt)
- Injects art into circle elements with class `.character-circle`
- Character name is identified through a sibling element with class `.text-sm.font-semibold`

#### Phaser Version (Current)
- Character assets are loaded through BattleAssetLoader's unified `loadAssets()` method
- Uses optimized battle sprites from the Combat_Version folder
- The assets are loaded with keys in the format `character_CharacterName`
- CharacterSprite component uses these preloaded textures to display characters
- Animations and battle effects are applied via the Phaser engine

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
   - If art doesn't appear in DOM Battle UI, check browser console for errors in DirectImageLoader
   - If art doesn't appear in Phaser Battle UI, check browser console for errors in BattleAssetLoader
   - If BattleAssetLoader logs show successful loading but the character doesn't appear, check that the character name in the array exactly matches the name in characters.json
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

5. Update BattleAssetLoader.js:
   ```javascript
   const characterArt = [
       'Aqualia', 'Drakarion', 'Zephyr', 'Lumina', 
       'Sylvanna', 'Vaelgor', 'Seraphina'
   ];
   ```

6. Update positioning in characters.json for Drakarion:
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

7. Verify in browser that Drakarion's art appears correctly in all contexts:
   - Team Builder (Available Heroes grid, team slots, and detail view)
   - DOM Battle UI (if still using it)
   - Phaser Battle UI (the current implementation)
