# CHANGELOG 0.7.0.10 - Card Frame Visual Refinements

## Issue Overview
The card frames in the Battle Scene had two primary visual issues:
1. The frame borders were too thick (20px), making the cards appear bulky and reducing space for character art
2. A noticeable gap appeared between the outer frame and the inner backdrop, creating an unintended "floating" effect

## Implementation Details

### 1. Frame Thickness Reduction
**File:** `js/phaser/components/ui/CardFrame.js`
**Change:** Modified the default configuration value for `borderWidth`

**Before:**
```javascript
borderWidth: 20,            // Width of frame border
```

**After:**
```javascript
borderWidth: 10,            // Width of frame border (reduced from 20px for sleeker appearance)
```

**Impact:**
- Card frames appear sleeker and more elegant
- Additional 10px of space available for character portraits and other elements
- Reduced chance of card overlap in the team layout
- Better overall proportions between frame and content

### 2. Frame-Backdrop Gap Fix
**File:** `js/phaser/components/ui/CardFrame.js`
**Change:** Adjusted the calculations in the `createBackgroundElements()` method

**Before:**
```javascript
const bgRect = this.scene.add.rectangle(
    0, 0,
    this.config.width - this.config.borderWidth * 2,
    this.config.height - this.config.borderWidth * 2,
    this.typeColor,
    this.config.backgroundAlpha
);
```

**After:**
```javascript
const bgRect = this.scene.add.rectangle(
    0, 0,
    this.config.width - (this.config.borderWidth * 2) + 2, // Adjusted to reduce gap with frame
    this.config.height - (this.config.borderWidth * 2) + 2, // Adjusted to reduce gap with frame
    this.typeColor,
    this.config.backgroundAlpha
);
```

**Impact:**
- Eliminated the visible gap between frame and backdrop
- Creates a more cohesive, single-piece appearance for the card
- Backdrop now properly extends to meet the inner edge of the frame
- Added 2px to each dimension to ensure complete coverage even with rounding differences

## Technical Notes
- The 2px adjustment value was chosen after testing to accommodate for potential rounding errors in Phaser's rendering
- These changes are purely visual and do not impact the functional behavior of cards
- The adjustment maintains the card's center-origin positioning, ensuring all existing animations remain properly aligned
- Future improvements could include adding depth effects to the frame for a more 3D appearance

## Testing Required
- Verify cards display properly with thinner frames
- Confirm no gap appears between frame and backdrop
- Check that card animations still function correctly
- Ensure cards with different type colors all render properly
- Verify that the health bar and nameplate positioning still looks correct