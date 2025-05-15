## 0.7.1.8 - CardFrameContentComponent Implementation (Phase 3.3) (2025-05-15)

### Added
- Implemented Phase 3.3 of CardFrame refactoring by extracting content functionality to dedicated component
- Created CardFrameContentComponent to handle portrait window, character sprite, and nameplate rendering
- Added proper delegation from CardFrameManager to the new component
- Fixed character art display in card frames by maintaining visibility settings
- Maintained consistent visual appearance with improved architecture

### Technical
- Applied Extract-Delegate-Verify-Remove methodology for component extraction
- Followed established component initialization and delegation patterns
- Implemented robust error handling throughout the component chain
- Updated script loading order in index.html to ensure proper component availability
- Continued the systematic refactoring of the CardFrame system into modular components

*Note: For detailed information on implementation approach, see CHANGELOG_0.7.1.8_CardFrameContentComponent.md*

## 0.7.1.7 - CardFrameHealthComponent Extraction (Phase 3.2) (2025-05-14)

### Added
- Implemented Phase 3.2 of CardFrame refactoring by extracting health functionality to dedicated component
- Created CardFrameHealthComponent to handle health bar rendering and updating
- Added proper delegation from CardFrameManager and CardFrame to the new component
- Maintained consistent visual appearance with improved architecture

### Technical
- Applied Extract-Delegate-Verify-Remove methodology for component extraction
- Followed established component initialization and delegation patterns
- Implemented robust error handling throughout the component chain
- Updated script loading order in index.html to ensure proper component availability
- Continued the systematic refactoring of the CardFrame system into modular components

*Note: For detailed information on implementation approach, see CHANGELOG_0.7.1.7_CardFrameHealthComponent.md*