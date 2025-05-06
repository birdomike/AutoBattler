# Improved Character Team Positioning

This document explains the technical implementation details for enhancing the vertical spacing between characters in teams to prevent status effect icons from overlapping.

## Overview

Status effect icons are displayed below each character in the battle scene. With the implementation of the new status effect visualization system in version 0.5.3.0, and the enhanced status effect icons in version 0.5.3.1, we identified an issue where status effect icons from one character could overlap with the character sprite positioned below it, especially in 3-character teams.

The solution was to modify the character positioning algorithm in the `TeamContainer` class to increase the vertical spacing between characters, particularly for the first and last characters in a 3-character team.

## Implementation Details

### Problem Analysis

The issue was identified in the `calculatePositions` method of the `TeamContainer` class. The method was originally calculating positions with equal spacing for all characters, which worked well for the character sprites themselves but didn't account for the additional space needed for status effect icons.

Original implementation:
```javascript
calculatePositions(teamSize) {
    const positions = [];
    const spacing = this.config.spacing;

    // Vertical positioning with team centered
    const startY = -(spacing * (teamSize - 1)) / 2;

    for (let i = 0; i < teamSize; i++) {
        positions.push({
            x: 0,
            y: startY + (i * spacing)
        });
    }

    return positions;
}
```

This resulted in characters being positioned with a vertical spacing of 180 pixels (the default `this.config.spacing` value), which was insufficient when multiple status effects were active.

### Solution Approach

We modified the `calculatePositions` method to implement a special positioning strategy for 3-character teams (the most common team size in the game):

1. The first character (index 0) is positioned higher than in the default algorithm
2. The middle character (index 1) remains in the center position
3. The last character (index 2) is positioned lower than in the default algorithm

For teams of other sizes, we maintain the original algorithm for backward compatibility.

### Implementation Code

```javascript
calculatePositions(teamSize) {
    if (typeof teamSize !== 'number' || teamSize < 0) {
        console.warn(`TeamContainer calculatePositions: Invalid teamSize (${teamSize}). Defaulting to 0.`);
        teamSize = 0;
    }
    const positions = [];
    const spacing = this.config.spacing;

    // For 3 character teams, use a special positioning
    if (teamSize === 3) {
        // Position first character higher
        positions.push({
            x: 0,
            y: -spacing - 40 // Move first character 40px higher
        });
        
        // Keep middle character in center
        positions.push({
            x: 0,
            y: 0
        });
        
        // Position last character lower
        positions.push({
            x: 0,
            y: spacing + 40 // Move last character 40px lower
        });
        
        return positions;
    }
    
    // Default positioning for other team sizes
    // Vertical positioning with team centered
    const startY = -(spacing * (teamSize - 1)) / 2;

    for (let i = 0; i < teamSize; i++) {
        positions.push({
            x: 0,
            y: startY + (i * spacing)
        });
    }

    return positions;
}
```

The key changes are:
- Added a special case for teamSize === 3
- Positioned first character at y = -spacing - 40 (220px up from center)
- Positioned middle character at y = 0 (center)
- Positioned last character at y = spacing + 40 (220px down from center)
- Maintained original algorithm for teams of other sizes

This creates a total of 440 pixels of vertical separation between the top and bottom characters, compared to 360 pixels in the original implementation, providing an additional 80 pixels of space to accommodate status effect icons.

## Testing Considerations

1. **Visual Verification**: Checked that status effect icons no longer overlap with adjacent characters in the team
2. **Different Team Compositions**: Verified that positioning works correctly for both ally and enemy teams
3. **Multiple Status Effects**: Tested with multiple status effects active on the same character to ensure no overflow occurs
4. **Animation Compatibility**: Confirmed that attack animations and other visual effects still work correctly with the new positioning

## Future Improvements

While this solution works well for the standard 3-character teams, future enhancements could include:

1. **Dynamic Spacing**: Calculate spacing based on the number of active status effects on each character
2. **Compact Status Effect Display**: Implement a more compact status effect display system for characters with many effects
3. **Responsive Positioning**: Adjust character positioning based on screen size to maintain optimal spacing on different devices

For now, the fixed adjustment provides a good balance between visual clarity and implementation simplicity, addressing the immediate issue of status effect icon overlap.
