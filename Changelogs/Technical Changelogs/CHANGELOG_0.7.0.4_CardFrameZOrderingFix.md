# CardFrame Z-Ordering Fix (0.7.0.4)

This update addresses an issue where character art wasn't visible in the card frames despite being successfully loaded and added to the card. The problem was determined to be related to z-ordering (depth) in the Phaser rendering pipeline.

## Issue

Character sprites were being correctly loaded and added to the portrait container within the card frame, but they weren't visible because they were being rendered behind other card elements. This was confirmed by the debug logs showing:

1. Successful texture loading: `CardFrame: Texture "character_Caste" exists: true`
2. Correct sprite creation: `CardFrame: Creating sprite at position (-5, -35)`
3. Successful container addition: `CardFrame: Character sprite created and added successfully for "Caste"`

Yet the character images remained invisible in the actual game display, while UI elements like status effects and turn indicators remained visible.

## Fix Implemented

1. **Set Higher Depth for Portrait Container**: 
   - Added `this.portraitContainer.setDepth(5)` to ensure the portrait container renders above the base frame elements

2. **Set Explicit Depth for Character Sprite**:
   - Added `this.characterSprite.setDepth(10)` to ensure the character sprite renders above other elements within the container

3. **Bring Character Sprite to Top**:
   - Added `this.portraitContainer.bringToTop(this.characterSprite)` to explicitly bring the sprite to the front of its container's display list

4. **Added Debug Logging**:
   - Added logging to show the final depth values: `console.log("Character sprite depth set to ${this.characterSprite.depth}, portrait container depth: ${this.portraitContainer.depth}")`

These changes ensure proper z-ordering so that character sprites are visibly rendered in front of other card elements, while still being properly masked by the portrait window mask.

## Implementation Notes

This is a common issue in Phaser rendering when working with complex nested containers and masks. The Phaser rendering pipeline processes game objects based on:

1. Their container hierarchy (parent-child relationships)
2. The order in which they were added to their parent container
3. Their explicit depth values

The fix uses two complementary approaches to ensure the character images are properly rendered:
- Explicit depth values via `setDepth()` to enforce rendering order
- Call to `bringToTop()` to adjust the display list order within the container

This implementation maintains all existing functionality while ensuring the character images are properly visible.