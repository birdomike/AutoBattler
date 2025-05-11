# CHANGELOG 0.6.6.12 - CoordinateDisplay Default Off

## Overview

This update changes the default state of the coordinate grid display from ON to OFF. Previously, the coordinate grid would appear automatically when starting a battle, requiring developers to toggle it off with Alt+G if not needed. With this change, the grid will be hidden by default until explicitly toggled on with Alt+G.

## Implementation Details

### Changed Default Enabled State

Modified the default value of the `enabled` configuration property in CoordinateDisplay.js:

**Before (0.6.6.11):**
```javascript
this.config = {
    // ...other config options...
    enabled: config.enabled !== undefined ? config.enabled : true
};
```

**After (0.6.6.12):**
```javascript
this.config = {
    // ...other config options...
    enabled: config.enabled !== undefined ? config.enabled : false
};
```

This change makes the coordinate grid start in the "off" position by default, while still allowing it to be turned on explicitly through configuration or via the Alt+G hotkey.

## Implementation Benefits

1. **Reduced Visual Clutter**: The default battle view is now cleaner without the coordinate grid overlay

2. **Improved Developer Experience**: Developers only see the grid when they explicitly enable it

3. **Consistent with Common Practice**: Most development tools start with optional debugging visualizations disabled by default

4. **No Change to Functionality**: All existing functionality remains unchanged - the grid can still be toggled with Alt+G

## Testing Verification

Testing has verified:

1. **Default Behavior**: The coordinate grid no longer appears by default when entering the battle scene
2. **Toggle Functionality**: The Alt+G hotkey still correctly toggles the grid on and off
3. **Full Functionality**: When toggled on, the grid displays with the same functionality as before

## Rationale

This change was implemented to reduce unnecessary visual elements during normal development and testing. By making the grid opt-in rather than opt-out, developers can focus on the core game visuals by default, while still having easy access to the grid when needed for precise positioning work.
