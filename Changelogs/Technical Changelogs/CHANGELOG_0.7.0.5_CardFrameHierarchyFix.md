# CHANGELOG 0.7.0.5 - CardFrame Character Art Structural Fix

## Issue
Character art sprites were not appearing in the CardFrame component despite being correctly loaded and available. Previous z-ordering fix in 0.7.0.4 did not resolve the issue.

## Root Cause Analysis
The issue stemmed from how Phaser handles nested container hierarchies. When a sprite is nested inside a container (portraitContainer), the parent container's rendering properties can override child depth settings. Even though we tried setting z-order depths with `setDepth()` and `bringToTop()`, the parent-child relationship was preventing proper rendering.

## Changes Made
- Modified `CardFrame.js` to restructure the component hierarchy
- Changed character sprites to be direct children of the main CardFrame container rather than nested inside portraitContainer
- Positioned sprites relative to the portrait area while maintaining the same visual position
- Adjusted masking to work with the flattened hierarchy (positioning mask with the sprite)
- Added additional diagnostic logging to track rendering positioning
- Updated healing effect to work with the new structure (heal glow now added to CardFrame directly)
- Updated character fallback creation to follow the same pattern

## Technical Details
The key architectural change was flattening the hierarchy from:
```
CardFrame
  └── portraitContainer
       └── characterSprite (nested)
```
To:
```
CardFrame
  ├── portraitContainer  
  └── characterSprite (siblings at same level)
```

This structural change ensures depth values work as expected and prevents container nesting from interfering with sprite visibility. Additional key changes:

1. Character positioning was adjusted to account for the portrait container's offset, allowing the sprite to appear in the same position visually while being a direct child of CardFrame
2. Increased depth value from 10 to 100 to ensure clear z-ordering 
3. Added explicit visibility settings (`setAlpha(1)`, `setVisible(true)`) for diagnostic purposes
4. Modified mask positioning to match where the portrait would be
5. Updated logging to provide more comprehensive visibility diagnostics

## Implementation Notes
Phaser's container system works well for grouping objects, but when nested containers with masks and complex depth requirements are involved, flattening the hierarchy often provides better results. This is especially true when trying to manage multiple layers with different rendering priorities.

## Testing
The updated code should be tested to confirm that character art now displays properly in card frames with appropriate masking and positioning. Focus should be on:

1. Character art visibility
2. Health bar animations (especially healing glow)
3. Proper masking of characters (they should still be clipped to the portrait area)
4. Character fallback (first letter) visibility if a character texture is missing
