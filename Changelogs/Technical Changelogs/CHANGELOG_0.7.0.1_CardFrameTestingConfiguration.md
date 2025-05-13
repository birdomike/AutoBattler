# CardFrame Integration Testing Configuration

## Overview
This small change enables the card frame representation by default for all characters in the game, allowing for testing of the Phase 1 implementation.

## Change Details
Modified the default value of `useCardFrame` in the CharacterSprite constructor from `false` to `true`:

```javascript
this.config = Object.assign({
    x: 0,
    y: 0,
    scale: 1,
    showName: true,
    showHealth: true,
    showStatusEffects: true,
    useCardFrame: true,         // Changed from false to true for testing
    cardConfig: {                
        width: 240,              
        height: 320,             
        portraitOffsetY: -20,    
        nameBannerHeight: 40,    
        healthBarOffsetY: 90,    
        interactive: false       
    }
}, config);
```

## Purpose
This change is intended for testing purposes to evaluate the Phase 1 CardFrame integration. It enables all characters to use the card representation by default, allowing for visual inspection and functional testing of the framework we've implemented.

## Testing Notes
During testing of the card frames, users should observe:
- The proper creation of card frames for all characters
- Type-themed styling based on each character's element
- Health bar updates working correctly
- Floating text appearing in the proper position
- Attack animations with the subtle rotation effect

This is still Phase 1 implementation, so some visual elements may need further refinement in Phase 2.

## Reverting
After testing is complete, this change may be reverted to return to the default circle representation for normal gameplay, or a UI toggle can be implemented to allow players to choose their preferred representation.