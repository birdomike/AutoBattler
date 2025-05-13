# CardFrame Script Loading Fix

## Overview
This changelog documents a critical fix for the CardFrame integration. The CardFrame component was not being loaded properly in the game, which prevented the card-based representation from appearing.

## Issue
When testing the CardFrame integration, the following error was observed in the browser console:
```
CharacterSprite: CardFrame requested for [CharacterName] but not available, falling back to circle representation
```

This indicated that `window.CardFrame` was not being recognized as a function, causing the character sprites to fall back to the traditional representation.

## Root Cause
The CardFrame.js script file was not included in the index.html file, which meant:
1. The CardFrame class was never loaded into the browser
2. `window.CardFrame` was undefined
3. The `this.cardFrameAvailable = (typeof window.CardFrame === 'function')` check in CharacterSprite.js resulted in false

## Fix
Added the CardFrame.js script to index.html before CharacterSprite.js is loaded:
```html
<!-- TurnIndicator - Must load before BattleScene -->
<script src="js/phaser/components/battle/TurnIndicator.js"></script>
<!-- CardFrame Component - Must load before CharacterSprite -->
<script src="js/phaser/components/ui/CardFrame.js"></script>
<!-- BattleScene (Module) -->
<script type="module" src="js/phaser/scenes/BattleScene.js"></script>
```

This ensures that CardFrame is defined and registered globally before any CharacterSprite instances are created.

## Implementation
The implementation required adding the script tag in index.html in the correct order:
1. Place it after TurnIndicator.js which is a dependency
2. Place it before the BattleScene module which will create CharacterSprites
3. Include a clear comment explaining the loading order requirement

## Testing
After the fix, the `window.CardFrame` global should be properly defined, allowing CharacterSprite.js to detect and use the CardFrame functionality.

## Lessons Learned
When adding new component scripts to a web application:
1. Always ensure they are properly referenced in the HTML file
2. Pay attention to the loading order of scripts, especially when there are dependencies
3. Verify that global objects are properly registered before they are referenced

This issue highlights the importance of properly managing script dependencies in web applications, especially as the application grows in complexity.