# Changelog - Version 0.5.0.28 - 2025-05-03

## Feature: Action Indicators

### Added
- **Action Indicators in Battle:** Added visual indicators showing the current action a character is performing
  - Displays "Auto Attack", "Ability: [Name]", or "Status: [Name]" above characters during battle
  - Text appears with smooth fade-in/fade-out animation
  - Color-coded text based on action type (grey for auto attacks, green for abilities, gold for status effects)

### Technical Implementation
- Added new `ActionIndicator` component to display floating action text
  - Created proper animation system with fade-in, hold, and fade-out phases
  - Implemented positioning system relative to parent character sprite
  - Added shadow and stroke effects for better text readability
- Added event handling in `BattleScene` for action events:
  - Added listeners for `CHARACTER_ACTION` and `ABILITY_USED` events
  - Created handler methods to process events and display appropriate text
  - Implemented test function accessible via debug UI
- Updated `CharacterSprite` class with action text display functionality
  - Added `showActionText()` method for easy access from BattleScene
  - Integrated `ActionIndicator` via composition pattern
  - Added proper cleanup in `destroy()` method

### Improved
- **Visual Feedback:** Enhanced battle visualization by clearly showing what actions characters are taking
- **Readability:** Improved visual understanding of complex battle sequences
- **Testing:** Added debug button and console function for manually testing action indicators

### Implementation Details
- Implemented tweens for smooth animation and transitions
- Used container-based approach for positioning relative to moving characters
- Custom styling with type-based coloring for better differentiation
- Designed with proper cleanup to prevent memory leaks
