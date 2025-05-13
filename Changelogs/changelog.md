### [0.7.0.9] - 2025-05-13
#### Improved
- **UI:** Optimized top banner in Battle Scene for card-based interface
  - Repositioned to left side of screen to free up central space
  - Reduced font size for better space utilization
  - Removed unnecessary "Battle Scene Initialized!" text
  - Removed bouncing animation from title text
  - Adjusted vertical spacing to make banner more compact
  - Completely removed "Battle Scene" title text
  - Added maintenance note for potential future refactoring

### [0.7.0.8] - 2025-05-14
#### Fixed
- Fixed CardFrame character visibility issues by identifying masking as the root cause
- Kept masking disabled intentionally to ensure characters remain visible
- Changed scale from fixed value 2 to configurable artScale parameter
- Removed the red debug tint for normal character appearance
- Maintained proper rendering structure with high depth value

*Note: For detailed information on implementation approach and lessons learned, see CHANGELOG_0.7.0.8_CardFrameDebuggingRevision.md*

### [0.7.0.7] - 2025-05-14
#### Fixed
- Fixed circular reference error in CardFrame debugging code
- Eliminated "TypeError: Converting circular structure to JSON" error that was breaking the debugging process
- Replaced JSON.stringify calls with explicit property logging for Phaser objects
- Added proper null checking and fallback values for robust error handling

*Note: For detailed information, see CHANGELOG_0.7.0.7_CardFrameCircularReferenceFix.md*

### [0.7.0.6] - 2025-05-13
#### Changed
- Implemented focused debugging approach for CardFrame character sprite rendering
- Added comprehensive seven-stage diagnostic process to isolate sprite visibility issue
- Applied extreme visibility settings (large scale, bright red tint) for maximum visibility
- Removed masking to eliminate it as a potential cause of the problem
- Added detailed texture and container hierarchy inspection

*Note: For detailed information, see CHANGELOG_0.7.0.6_CardFrameFocusedDebugging.md*

### [0.7.0.5] - 2025-05-13
#### Fixed
- Fixed character art not appearing in card frames by implementing a structural hierarchy change
- Restructured CardFrame to use sibling containers instead of nested hierarchy
- Modified character sprites to be direct children of CardFrame instead of portraits
- Updated all dependent components to work with the flattened hierarchy
- Added comprehensive diagnostic logging to verify character sprite visibility

*Note: For detailed information, see CHANGELOG_0.7.0.5_CardFrameHierarchyFix.md*

### [0.7.0.4] - 2025-05-13
#### Fixed
- Fixed character art not appearing in card frames due to z-ordering issues
- Added proper depth settings to ensure character sprites render above other card elements
- Implemented explicit z-index ordering for portrait containers and character sprites

*Note: For detailed information, see CHANGELOG_0.7.0.4_CardFrameZOrderingFix.md*

### [0.7.0.3] - 2025-05-13
#### Changed
- Improved error message in CharacterSprite.js to more accurately reflect the game implementation
- Added enhanced debug logging to CardFrame to diagnose missing character art

*Note: For detailed information, see CHANGELOG_0.7.0.3_CardFrameCharacterArtDebugging.md*

### [0.7.0.2] - 2025-05-13
#### Fixed
- Fixed CardFrame not loading by adding the script to index.html
- Corrected script loading order to ensure CardFrame is available before CharacterSprite initialization
- Enabled proper card-based character representation in the battle scene

*Note: For detailed information, see CHANGELOG_0.7.0.2_CardFrameScriptLoadingFix.md*

### [0.7.0.1] - 2025-05-13
#### Added
- Implemented Phase 1 of CardFrame integration into CharacterSprite
- Added framework and configuration system for card-based character representation
- Created conditional creation logic to support both circle and card representations
- Added card configuration validation and fallback mechanisms
- Modified health updates, floating text, and attack animations to support both visual styles
- Implemented proper event handling for turn-based card highlighting

#### Fixed
- Fixed syntax error in CharacterSprite.js that prevented game from loading
- Correctly placed CardFrame-related methods inside the CharacterSprite class definition
- Improved class structure to maintain proper encapsulation

*Note: For detailed information on implementation approach, see CHANGELOG_0.7.0.1_CardFrameIntegrationPhase1.md and CHANGELOG_0.7.0.1_CardFrameIntegrationHotfix.md*

### [0.7.0.0] - 2025-05-13
#### Added
- Created new CardFrame component for professional character visualization
- Implemented 3:4 aspect ratio design with type-themed styling
- Added decorative nameplate with beveled edges/scrollwork
- Implemented portrait window with proper masking
- Added support for selection/hover animations and glow effects
- Included comprehensive health bar system with visual feedback
- Introduced detailed configuration options for easy visual customization

*Note: For detailed information on implementation approach, see CHANGELOG_0.7.0.0_CardFrameImplementation.md*

### [0.6.7.14] - 2025-05-12
#### Fixed
- Fixed Canvas2D warning by correctly applying willReadFrequently attribute to all canvas contexts
- Added global canvas context configuration in PhaserConfig.js using preBoot callback
- Enhanced BattleScene.configureCanvasSmoothing() to handle both Canvas and WebGL renderers
- Added informative logging to verify canvas configuration is properly applied

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.7.14_CanvasWillReadFrequently.md*

### [0.6.7.16] - 2025-05-12
#### Changed
- Enhanced the 4K rendering test with dedicated CSS to ensure canvas fills the entire viewport
- Created new 4k-test.css file with 100% width/height canvas styling
- Updated PhaserConfig.js canvasStyle to use 100% width/height
- Modified container styling to use fixed positioning and full viewport dimensions
- Set game container to be visible by default for immediate testing

*Note: These changes complement the earlier 4K test (0.6.7.15) to ensure the canvas properly expands to fill a 4K viewport. Both sets of changes should be reverted after testing.*

### [0.6.7.15] - 2025-05-12
#### Changed
- Implemented diagnostic 4K resolution test to troubleshoot fuzzy text rendering issue
- Set game resolution to 3840x2160 with Phaser.Scale.NONE to create 1:1 pixel mapping
- Added explicit resolution: 1 property to all text objects in CharacterSprite, ActionIndicator, and BattleUIManager
- Enabled roundPixels: true in the PhaserConfig for sharper text rendering
- Removed autoCenter to prevent automatic scaling during the test
- Claude cannot follow simple instructions

*Note: These changes are for diagnostic purposes only and will be reverted after testing. The user must manually set browser viewport to 3840x2160 during testing.*

### [0.6.7.14] - 2025-05-12
#### Fixed
- Fixed positioning issue with floating damage/healing numbers by using global coordinates
- Implemented proper coordinate conversion using getWorldTransformMatrix() in CharacterSprite.js
- Added depth setting to ensure floating text is always visible above other elements
- Improved error handling for floating text positioning

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.7.14_FloatingTextPositionFix.md*

### [0.6.7.13] - 2025-05-12
#### Fixed
- Fixed character art positioning in team slots by transforming the container position
- Applied translateY(-25px) to move character art higher in the team slots
- Improved visual alignment of characters within their team slot containers
- Used transform approach for more reliable positioning across browsers

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.7.13_TeamSlotArtPositionFix.md*

### [0.6.7.12] - 2025-05-12
#### Changed
- Fine-tuned character art positioning in team slots for improved visual alignment
- Adjusted artwork to be positioned 5px higher and 5px more to the right for better centering
- Increased the margin-right of slot avatars from 12px to 15px for better spacing

#### Fixed
- Removed all diagnostic logging added during the troubleshooting of character art visibility issues
- Cleaned up console output by removing debug messages from TeamSlotsManager and TeamBuilderImageLoader
- Removed temporary debug verification functions added in version 0.6.7.10
- Improved console performance by eliminating excessive DOM structure logging

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.7.12_ArtPositioningAndDebugCleanup.md*

### [0.6.6.13] - 2025-05-11
#### Fixed
- Fixed play/pause button showing both icons at once when the game is paused
- Updated battle controls to consistently show only the play icon when paused
- Ensured consistent icon display during entire battle lifecycle

### [0.6.6.12] - 2025-05-11
#### Changed
- Changed CoordinateDisplay default state to OFF instead of ON when initializing
- Grid will now be hidden by default until toggled with Alt+G
- Improved debugging experience by reducing initial visual clutter

### [0.6.7.11] - 2025-05-12
#### Fixed
- Fixed character art not appearing in 'Your Team' slots with targeted CSS fixes
- Added specific styles for team slot avatar containers and art wrappers
- Set explicit dimensions and z-index for character art in team slots
- Ensured proper visibility with explicit display and opacity properties
- Improved team slot hero details layout with consistent dimensions

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.7.11_TeamSlotArtVisibilityFix.md*

### [0.6.7.10] - 2025-05-12
#### Fixed
- Fixed persistent issue with character art not appearing in 'Your Team' slots
- Added comprehensive diagnostic logging throughout art rendering process
- Enhanced TeamSlotsManager with DOM structure verification after rendering
- Added detailed logging to TeamBuilderImageLoader.drawArt() for better troubleshooting
- Improved art rendering state tracking and verification
- Removed deprecated triggerImageLoader() call from HeroGridManager to eliminate console warnings

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.7.10_ArtRenderingDiagnostics.md*

### [0.6.7.9] - 2025-05-12
#### Fixed
- Fixed issue where character art was not appearing in team slots after view toggle implementation
- Updated TeamSlotsManager to properly get and pass the current view mode to drawArt method
- Modified TeamBuilderImageLoader helper methods to propagate the viewMode parameter
- Improved cross-component communication for consistent view mode application
- Enhanced logging for better visibility into art rendering process

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.7.9_FixCharacterArtInTeamSlots.md*

### [0.6.7.8] - 2025-05-12
#### Added
- Added view toggle feature to TeamBuilder UI allowing switching between "Full" and "Compact" views for heroes
- Implemented "Full" view (current 2-column layout with large art) and "Compact" view (3-column layout with smaller art)
- Added toggle button in the "Available Heroes" section header with icon and label
- Implemented view preference persistence using localStorage
- Created view-specific CSS classes for maintaining consistent layout in both modes
- Enhanced TeamBuilderImageLoader to support conditional art scaling based on view mode

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.7.8_ViewToggleForHeroCards.md*

### [0.6.7.7] - 2025-05-12
#### Fixed
- Fixed "TeamBuilderImageLoader: [CharacterName] not found in image cache" errors on startup
- Implemented Promise-based image preloading system to properly sequence loading
- Modified TeamBuilderImageLoader.preloadCharacterImages() to return a Promise that resolves when all images are loaded
- Updated TeamBuilderUI to await image preloading completion before initializing UI components
- Added on-demand loading and placeholder display for any images that might be missed
- Eliminated race condition between image preloading and UI rendering

### [0.6.7.6] - 2025-05-12
#### Changed
- Completely removed the MutationObserver-based character art system from TeamBuilderImageLoader
- Implemented centralized art drawing functionality (TeamBuilderImageLoader.drawArt)
- Modified all UI managers (HeroGridManager, TeamSlotsManager, HeroDetailPanelManager) to explicitly manage their own art rendering
- Eliminated sporadic art disappearance issues by ensuring robust art handling in each component
- Fixed styling glitches by properly clearing and recreating art elements with correct settings

### [0.6.7.5] - 2025-05-12
#### Changed
- Removed rarity system from game (was not being used in gameplay mechanics)
- Removed rarity tags from hero detail display UI
- Removed rarity properties from all character definitions in characters.json

### [0.6.7.4] - 2025-05-12
#### Changed
- Optimized Hero Details panel layout to eliminate unnecessary scrollbars
- Reduced spacing between elements in detail view to improve content density
- Fine-tuned padding and margins throughout detail panel for better visual flow
- Styled all scrollbars to match game theme with custom colors and width

### [0.6.7.3] - 2025-05-12
#### Changed
- Enhanced hero card display with 2-column grid (previously 3 columns) for larger cards
- Restructured hero cards with vertical layout: artwork on top, text below
- Significantly increased character art size (40% larger) for better visibility
- Enlarged hero cards with consistent minimum height to showcase character art
- Improved text placement and spacing for better readability
- Added custom-styled scrollbars that match the game's color scheme

### [0.6.7.2] - 2025-05-11
#### Added
- Implemented collapsible filter sections in TeamBuilder UI
- Added animated expand/collapse functionality for Type and Role filters
- Improved filter UI with active filter count badges
- Enhanced user interface to show more heroes on screen at once
- Added toggle indicators (▲/▼) for filter section state

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.7.2_CollapsibleFilterUI.md*

### [0.6.6.11] - 2025-05-11
#### Changed
- Completed final phase (Phase 6) of TeamBuilderUI refactoring with Remove stage
- Verified proper delegation of battle mode and battle initiation functionality
- Confirmed complete transition of TeamBuilderUI to component-based architecture
- Finalized documentation for the entire refactoring project
- Reduced TeamBuilderUI.js by approximately 180 lines of code

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.6.11_BattleModeManager_BattleInitiator_Remove.md*

### [0.6.6.10] - 2025-05-11
#### Changed
- Implemented Phase 6 of TeamBuilderUI refactoring with Extract stage for BattleModeManager and BattleInitiator components
- Created BattleModeManager component to handle battle mode selection and battle button state
- Created BattleInitiator component to handle battle initiation and transition
- Updated TeamBuilderUI.js to delegate battle mode selection and battle initiation
- Added initialization methods and callbacks for proper component integration

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.6.10_BattleModeManager_BattleInitiator_Extract.md*

### [0.6.7.1] - 2025-05-11
#### Changed
- Completed Remove stage of Phase 5 (TeamSlotsManager) refactoring
- Updated TeamBuilderUI.js to consistently use TeamSlotsManager for team-related operations
- Modified startBattle() method to properly use TeamSlotsManager state
- Updated renderBattleModes() to work with TeamSlotsManager
- Maintained backward compatibility with proper fallbacks throughout

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.7.1_TeamSlotsManager_Remove.md*

### [0.6.7.0] - 2025-05-11
#### Changed
- Implemented Phase 5 of TeamBuilderUI refactoring with Extract stage of TeamSlotsManager component
- Created new TeamSlotsManager.js component to handle team slot rendering and management
- Added initialization and delegation methods to TeamBuilderUI.js
- Enhanced team synergy calculation to better support heroes with multiple types
- Improved integration with existing components (HeroDetailPanelManager, HeroGridManager)

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.7.0_TeamSlotsManager_Extract.md*

### [0.6.6.7] - 2025-05-11
#### Changed
- Completed Phase 4 of TeamBuilderUI refactoring with Remove stage of HeroGridManager component
- Removed original hero grid rendering implementation from TeamBuilderUI.js
- Replaced with minimal delegation method and proper error handling
- Reduced TeamBuilderUI.js by approximately 100 lines of code

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.6.7_HeroGridManager_Remove.md*

### [0.6.6.6] - 2025-05-11
#### Changed
- Implemented Phase 4 of TeamBuilderUI refactoring with Extract stage of HeroGridManager component
- Created new HeroGridManager.js component to handle hero grid rendering and selection
- Added initialization and delegation methods to TeamBuilderUI.js
- Integrated with existing FilterManager for filter state management
- Updated TeamBuilderUI.js to delegate to HeroGridManager when available

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.6.6_HeroGridManager_Extract.md*

### [0.6.6.5] - 2025-05-11
#### Changed
- Completed Remove stage of FilterManager refactoring (Phase 3 complete)
- Removed original filter rendering implementation from TeamBuilderUI.js
- Updated filter state references to use FilterManager when available
- Added minimal fallback for error handling when FilterManager is unavailable
- Reduced TeamBuilderUI.js size by removing ~180 lines of code

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.6.5_FilterManager_Remove.md*

### [0.6.6.2] - 2025-05-11
#### Fixed
- Fixed "Uncaught TypeError: this.splitTypes is not a function" error in TeamBuilderUI.js
- Updated missed references to use TeamBuilderUtils methods in renderHeroDetails and updateExistingHeroDetails
- Completed Remove stage of TeamBuilderUI refactoring Phase 1

### [0.6.6.1] - 2025-05-11
#### Changed
- Completed Remove stage of TeamBuilderUI refactoring Phase 1
- Removed original utility method implementations from TeamBuilderUI.js
- Reduced TeamBuilderUI.js by approximately 104 lines of code
- Finished transition to using TeamBuilderUtils for all utility functions

*Note: For detailed implementation details, see CHANGELOG_0.6.6.1_TeamBuilderUtils_Remove.md*

### [0.6.6.0] - 2025-05-11
#### Changed
- Began TeamBuilderUI refactoring with Extract-Verify-Remove methodology (Phase 1)
- Created TeamBuilderUtils.js to centralize shared utility functions
- Extracted and moved common utility methods to TeamBuilderUtils
- Updated TeamBuilderUI.js to use TeamBuilderUtils while maintaining original implementations
- Created refactoring plan for future phases with component architecture documentation

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.6.0_TeamBuilderUtils.md*

### [0.6.6.0] - 2025-05-11
#### Changed
- Refactored TeamBuilderUI hero details functionality into dedicated HeroDetailPanelManager component
- Implemented Extract-Verify-Remove pattern for component refactoring
- Reduced TeamBuilderUI.js complexity by ~350 lines
- Improved maintainability with clean delegation methods and component architecture

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.6.0_HeroDetailPanelManager.md*

### [0.6.6.3a] - 2025-05-11
#### Fixed
- Fixed a JavaScript error in HeroDetailPanelManager that was preventing hero details from displaying properly
- Resolved variable redeclaration issue for heroes with multiple types
- Improved code consistency in the type relations section

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.6.3a_HeroDetailManagerHotfix.md*

### [0.6.6.4] - 2025-05-11
#### Changed
- Refactored filter management from TeamBuilderUI into dedicated FilterManager component
- Implemented Extract phase of the Extract-Verify-Remove pattern for filters
- Added delegation methods to TeamBuilderUI for filter handling
- Maintained backward compatibility with fallback implementation

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.6.4_FilterManagerExtract.md*

### [0.6.5.0] - 2025-05-11
#### Added
- Added support for characters with multiple types (e.g., "water/ice")
- Implemented multi-type display in the TeamBuilder UI with separated types
- Enhanced Type Relations section to show advantages/disadvantages for each type
- Added TypeEffectivenessCalculator support for multiple types in combat
- Modified filter system to include characters that match any of their types
- Updated Aqualia to have dual Water/Ice typing to match her abilities

#### Changed
- Improved character card layout by separating type and role onto different lines
- Enhanced readability of character information in hero cards and team slots
- Maintained consistent styling while improving information hierarchy
- Added CSS styling for the new hero-role class

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.5.0_TypeRoleSeparation.md*

### [0.6.4.21] - 2025-05-11
#### Added
- Added new character: Nyria (Storm Elementalist)
- Added character art assets for Nyria in both TeamBuilder and Battle UIs
- Integrated Nyria into all image loader systems (TeamBuilder, DOM Battle, and Phaser Battle)

### [0.6.4.20] - 2025-05-11
#### Changed
- Updated file-level documentation to reflect BattleScene's role as component orchestrator
- Improved JSDoc comments to focus on explaining 'why' rather than restating the obvious
- Standardized comments for all manager initialization methods with consistent style
- Fixed code formatting issues and inconsistencies throughout the file
- Completed Stage 9 of Phase 7 (Final Cleanup) for documentation and code formatting

### [0.6.4.19] - 2025-05-11
#### Changed
- Standardized all console logs in BattleScene.js to use consistent [BattleScene] prefix
- Updated warning, error, and info logs to maintain consistent formatting
- Improved log readability and traceability with uniform prefix style
- Ensured all console logs properly identify their originating component
- Completed Category 3 of Phase 7 (Final Cleanup) for console log standardization

### [0.6.4.18] - 2025-05-11
#### Changed
- Reviewed and preserved essential logs in BattleScene.js
- Ensured appropriate log levels (error, warn, info) are used consistently
- Verified important operational logs remain intact
- Confirmed all critical error and warning messages are preserved
- Implemented Category 2 of Phase 7 (Final Cleanup) for console log standardization

### [0.6.4.17] - 2025-05-11
#### Changed
- Removed unnecessary console logs throughout BattleScene.js
- Eliminated verbose initialization logs and debug statements
- Removed redundant log messages related to bridge implementation
- Reduced console clutter while maintaining important operational messages
- Implemented Category 1 of Phase 7 (Final Cleanup) for console log standardization

### [0.6.4.16] - 2025-05-11
#### Changed
- Standardized all user-facing error messages in BattleScene.js to use uiManager
- Added user-facing error message display to event manager initialization
- Added user-facing error message display to debug manager initialization
- Completed Stage 6 of Phase 7 (Final Cleanup) refactoring

### [0.6.4.15] - 2025-05-11
#### Changed
- Refactored all `initializeXYZ()` manager methods to follow a consistent, concise pattern
- Simplified `initializeBattleBridge()` while maintaining fallback approaches
- Removed verbose diagnostics logging from `initializeEventManager()`
- Added consistent return values and error handling across all initialization methods
- Continued Phase 7 (Final Cleanup) refactoring with Stage 5 completion

### [0.6.4.14] - 2025-05-11
#### Changed
- Simplified BattleScene.create() method to focus on manager initialization
- Removed direct TurnIndicator creation and management from BattleScene
- Moved specialized logic to appropriate initialization methods
- Extracted canvas smoothing configuration into a dedicated method
- Continued Phase 7 (Final Cleanup) refactoring with Stage 4 completion

### [0.6.4.13] - 2025-05-11
#### Changed
- Removed legacy fallback code throughout BattleScene.js
- Removed fallback TurnIndicator creation, requiring proper TurnIndicator component
- Enhanced error messages for component failures to clearly indicate requirements
- Removed legacy event listener cleanup in favor of component-based cleanup
- Continued Phase 7 (Final Cleanup) refactoring with Stage 3 completion

### [0.6.4.12] - 2025-05-11
#### Changed
- Removed legacy implementations from `updateActiveCharacterVisuals()` method in BattleScene.js
- Removed legacy implementations from `getTeamData()` method in BattleScene.js
- Changed both methods to exclusively delegate to TeamDisplayManager
- Added proper error handling when TeamDisplayManager is unavailable
- Continued Phase 7 (Final Cleanup) refactoring with Stage 2 completion

### [0.6.4.11] - 2025-05-11
#### Changed
- Removed legacy createCharacterTeams() and cleanupCharacterTeams() methods from BattleScene.js
- Updated references to use TeamDisplayManager exclusively for team handling
- Improved error handling when TeamDisplayManager initialization fails
- Started Phase 7 (Final Cleanup) of the BattleScene refactoring plan

### [0.6.4.10] - 2025-05-11
#### Changed
- Changed the coordinate grid toggle hotkey from Ctrl+G to Alt+G to avoid browser conflicts
- Added event.preventDefault() to prevent browser's default behavior when using debug hotkeys
- Updated documentation and console logs to reflect the new hotkey

### [0.6.4.9] - 2025-05-11
#### Changed
- Completed PhaserDebugManager refactoring (Remove phase)
- Removed original debug code from BattleScene.js (approximately 150 lines removed)
- Simplified debug initialization and error handling
- Fully delegated all debugging functionality to the PhaserDebugManager component

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.9_PhaserDebugManager_Remove.md*

### [0.6.4.8] - 2025-05-11
#### Added
- Created new PhaserDebugManager component to centralize debug tools (Extract phase)
- Added proper lifecycle and resource management for debug tools
- Enhanced global testing functions with improved error handling

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.8_PhaserDebugManager_Extract.md*

### [0.6.4.7] - 2025-05-11
#### Changed
- Completed BattleFXManager implementation by removing legacy visual effects code from BattleScene.js
- Simplified visual effects methods to fully delegate to BattleFXManager
- Improved error handling when BattleFXManager is unavailable
- Added clear user feedback when visual effects manager cannot be initialized

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.7_BattleFXManager_RemovePhase.md*

### [0.6.4.6] - 2025-05-11
#### Changed
- Implemented BattleFXManager component to centralize visual effects management
- Extracted floating text and attack animation logic from BattleScene to BattleFXManager
- Added fallback mechanisms for backward compatibility
- Improved integration with TeamDisplayManager for visual effects
- Updated BattleEventManager to support BattleFXManager integration
- Fixed script loading for BattleFXManager in index.html

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.6_BattleFXManager_Implementation.md*

### [0.6.4.5] - 2025-05-11
#### Changed
- Implemented unified asset loading interface in BattleAssetLoader
- Completed Stage 4 of the BattleAssetLoader refactoring plan
- Added comprehensive error tracking and reporting for asset loading
- Enhanced user feedback with specific error messages based on failed components
- Finalized Phase 4 of the BattleScene refactoring project

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.5_BattleAssetLoader_UnifiedInterface.md*

### [0.6.4.4] - 2025-05-11
#### Changed
- Completed status effect icon refactoring by removing original methods from BattleScene
- Implemented the Remove phase of Extract-Verify-Remove pattern for Stage 3
- Enhanced error handling and fallback mechanisms for status effect icons
- Further reduced BattleScene.js complexity by ~80 lines

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.4_BattleAssetLoader_StatusEffectIcons_Remove.md*

### [0.6.4.3] - 2025-05-11
#### Changed
- Refactored status effect icon loading from BattleScene into BattleAssetLoader component
- Implemented Stage 3 of the BattleAssetLoader refactoring plan (Extract phase)
- Added loadStatusEffectIcons() and initStatusIconMapping() methods to the asset loader
- Enhanced error handling for status effect loading with appropriate fallbacks

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.4.3_BattleAssetLoader_StatusEffectIcons.md*

### [0.6.4.2] - 2025-05-11
#### Changed
- Refactored character asset loading from BattleScene into BattleAssetLoader component
- Implemented Stage 2 of the BattleAssetLoader refactoring plan (completed all parts)
- Added loadCharacterAssets() method to centralize character art loading
- Simplified fallback code in BattleScene to reduce code duplication

### [0.6.4.1] - 2025-05-11
#### Changed
- Completed BattleAssetLoader implementation Stage 1 by removing original UI asset loading code
- Improved error handling when BattleAssetLoader is unavailable
- Added visual feedback to notify the user when UI assets fail to load

### [0.6.4.0] - 2025-05-11
#### Changed
- Refactored asset loading from BattleScene into dedicated BattleAssetLoader component (Phase 1: UI assets)
- Improved separation of concerns in BattleScene
- Reduced BattleScene complexity by extracting asset loading logic

## [0.6.3.46] - 2025-05-10

### Fixed
- Improved visibility of Ethereal type filter button by increasing its opacity to 93%
- Added bold text styling to the Ethereal filter to enhance readability on the white background
- Fixed the greyish appearance of the Ethereal button with specialized styling

## [0.6.3.45] - 2025-05-10

### Changed
- Updated the Ethereal type's color to pure white (#FFFFFF) for better alignment with its theme
- Added special handling to display Ethereal filter text in black for improved contrast and readability

## [0.6.3.44] - 2025-05-10

### Improved
- Enhanced filters UI by hiding the "Clear Filters" button when no filters are applied
- Added dynamic button display that only shows the clear button when needed
- Updated filter handlers to properly refresh the filters UI when toggling filters

## [0.6.3.43] - 2025-05-10

### Improved
- Expanded filter options in Team Builder to show all 22 types and 22 roles from the design document
- Replaced dynamic role/type extraction with complete predefined lists
- Maintained filter functionality while showing all possible options

## [0.6.3.42] - 2025-05-10

### Improved
- Enhanced ability display in hero details to color each ability based on its elemental type
- Added subtle left border with higher opacity for better visual distinction between ability types
- Abilities without a specific type now default to the character's type for visual consistency

*Note: For detailed information on implementation approach, see CHANGELOG_0.6.3.42_AbilityTypeVisualization.md*

## Version 0.6.3.41 (May 10, 2025)

### Added
- Expanded type colors system to include all 22 elemental types defined in the design document
- Added consistent color definitions for Electric, Ice, Rock, Metal, Psychic, Poison, Physical, Arcane, Mechanical, Void, Crystal, Storm, Ethereal, Blood, Plague, and Gravity types
- Implemented type colors across all UI systems (TeamBuilder, Battle UI, and Phaser components)
- Enhanced CSS classes for type-based backgrounds to support all types

### Technical
- Standardized type color values across TeamBuilderUI.js, BattleUI.js, and CharacterSprite.js
- Converted hex color values to Phaser-compatible format for CharacterSprite.js
- Updated BattleUI.addCustomStyles method to include CSS classes for all type backgrounds
- This update lays the foundation for upcoming characters with the new element types

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.41_TypeColorSystemExpansion.md*

## Version 0.6.3.40 (May 10, 2025)

### Fixed
- Resolved warning "[BattleInitializer] PassiveTriggerTracker not available for battle reset" by ensuring proper reference to PassiveTriggerTracker through BattleManager
- Fixed component initialization order issue affecting passive ability tracking system
- Eliminated unnecessary console warnings during battle initialization

### Technical
- Modified BattleInitializer to access PassiveTriggerTracker directly from BattleManager instead of using a stored reference
- Implemented a more robust dependency access pattern that's resilient to initialization order changes
- Maintained graceful degradation for fault tolerance while fixing the underlying issue

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.3.39_PassiveTriggerTrackerReferenceHotfix.md*

## Version 0.6.3.39 (May 10, 2025)

### Fixed
- Fixed battle not ending when all enemies are defeated, which caused battles to continue indefinitely
- Fixed inconsistency between character HP and defeat status tracking
- Eliminated "No valid targets found" errors during battles that should have already ended
- Improved battle lifecycle handling for more reliable battle completion

### Technical
- Added character state validation in checkBattleEnd() to ensure defeat status is consistent
- Modified DamageCalculator to properly mark characters as defeated when they reach 0 HP
- Added diagnostic logging to identify when defeat status corrections are made
- Implemented defensive programming patterns to prevent "zombie battles"

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.39_BattleEndDetectionFix.md*

## Version 0.6.3.38 (May 10, 2025)

### Fixed
- Fixed "Invalid type 'healing'" console warnings by adding 'healing' as a valid message type
- Enhanced BattleLogManager to properly handle healing-specific messages
- Eliminated unnecessary console noise during healing events
- Improved consistency between message creation and validation systems

### Technical
- Added diagnostic tracing to identify the source of 'healing' message type
- Used console.trace() to capture complete call stack for targeted debugging
- Maintained semantic meaning of healing messages while eliminating warnings
- Implemented a minimally invasive solution that preserves existing behavior

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.38_BattleLogManagerHealingTypeFix.md*

## Version 0.6.3.37 (May 10, 2025)

### Fixed
- Fixed status effect warning issue in PassiveBehaviors.js by routing all effects through StatusEffectManager
- Eliminated "Creating minimal fallback for status effect" console warnings from passive abilities
- Enhanced PassiveBehaviors.js with centralized status effect handling
- Improved status effect tooltips for passive-applied effects

### Technical
- Implemented new applyStatusEffect helper function in PassiveBehaviors.js
- Modified 11 passive behavior functions to use the helper function
- Added comprehensive error handling and fallbacks for status effect application
- Created robust routing to ensure status effect definitions are properly propagated
- Maintained architectural principle that StatusEffectManager should be the consistent point of entry for status effects

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.37_PassiveBehaviorsStatusEffectRoutingFix.md*

## Version 0.6.3.36 (May 10, 2025)

### Improved
- Removed unnecessary debugging logs that were cluttering the console
- Removed verbose [DETAILED DEBUG] messages from CharacterSprite and ActionIndicator
- Streamlined console output by removing outdated debugging artifacts
- Eliminated call stack tracing that was left from previous debugging sessions

### Technical
- Cleaned up remnants of debugging code from v0.6.3.24 that were no longer needed
- Maintained normal logging infrastructure while removing excessive debug statements
- Improved code clarity by removing obsolete debugging code

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.36_DebuggingCleanup.md*

## Version 0.6.3.35 (May 10, 2025)

### Fixed
- Fixed status effect definition propagation in event system
- Eliminated "Creating minimal fallback for status effect" console warnings
- Improved tooltip display for passive-applied status effects
- Enhanced StatusEffectManager to properly include full definitions in events
- Fixed variable scope issue causing ReferenceError with passive abilities

### Technical
- Implemented new dispatchStatusEffectApplied method in StatusEffectManager
- Added multiple dispatch fallback mechanisms for compatibility
- Maintained component-responsibility principles in the event system
- Created complete event payload with all necessary status effect data
- Properly handled different code paths for existing vs. new status effects

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.35_StatusDefinitionPropagationFix.md*

## Version 0.6.3.34 (May 10, 2025)

### Fixed
- Fixed "Cannot read properties of null (reading 'cut')" error in StatusEffectTooltip.js by adding robust null checks
- Improved tooltip stability during scene transitions and rapid mouse movements

### Technical
- Enhanced defensive programming practices in UI components
- Implemented proper scene validity checking in UI components
- Added explicit resource cleanup in tooltip destruction process

*Note: For detailed information on implementation steps, see CHANGELOG_0.6.3.34_StatusEffectTooltipFix.md*

## Version 0.6.3.33 (May 10, 2025)

### Technical
- Added enhanced debugging to diagnose the stat resolution issue in AoE abilities
- Implemented diagnostic logging in DamageCalculator to examine attacker object structure
- Added case-insensitive stat name handling to improve stat resolution reliability
- Added detailed actor object inspection in AbilityProcessor for AoE targets
- This debugging will pinpoint why attackerStat resolves to 0 for AoE ability targets

*Note: For detailed information on implementation, see CHANGELOG_0.6.3.33_AoEStatResolutionDebugging.md*

## Version 0.6.3.32 (May 10, 2025)

### Fixed
- Fixed AoE ability scaling factor issue in ActionGenerator - abilities like Frost Chain now correctly use their effect-specific scaling factors
- Modified ActionGenerator to properly extract and pass damage effects to DamageCalculator
- Ensures correct stat scaling text appears in battle log (+58 from Intellect for Frost Chain instead of +73)
- Improves ability balance by using the intended scaling factors for all AoE abilities

*Note: For detailed information on implementation, see CHANGELOG_0.6.3.32_ActionGeneratorScalingFactorFix.md*

## Version 0.6.3.31 (May 10, 2025)

### Improved
- Enhanced TeamBuilder UI layout with 2x2 grid for abilities display
- Fixed UI scrollbar issue by optimizing screen layout
- Implemented better positioning for abilities and battle options with grid layout
- Adjusted UI proportions to eliminate overlap between hero details and battle options
- Added visual separation between UI sections

*Note: For detailed information on implementation, see CHANGELOG_0.6.3.31_TeamBuilderLayoutEnhancement.md*

## Version 0.6.3.30 (May 10, 2025)

### Technical
- Added temporary debug logging to trace AoE ability scaling factor issue
- Implemented detailed effect property tracking in AbilityProcessor.processEffect
- Added logging for actor, target, and effect properties before damage calculation
- This debug logging will help identify why abilities like Frost Chain show incorrect stat scaling

*Note: For detailed information on debugging implementation, see CHANGELOG_0.6.3.30_AbilityProcessorDebugLogging.md*

## Version 0.6.3.29 (May 10, 2025)

### Technical
- Added temporary debugging for stat scaling factor issue investigation
- Implemented detailed tracing of scale factor usage throughout damage calculation
- Added diagnostic logging before and after scaling calculations to verify correct values
- Added check points for stat scaling text generation
- All debugging logs use [DEBUG-SCALING] prefix for easy filtering

*Note: For detailed information on debugging implementation, see CHANGELOG_0.6.3.29_ScalingFactorDebugging.md*

## Version 0.6.3.28 (May 10, 2025)

### Fixed
- Fixed an issue where abilities with effect-specific scaling factors (like Frost Chain) were using default values instead of their defined values
- Implemented hierarchical checking for ability scaling factors: effect-level → ability-level → default
- Added diagnostic logging to verify correct scaling factors are being applied
- This addresses a balance issue where abilities like Frost Chain were doing more damage than intended due to incorrect scaling

*Note: For detailed information on specific implementation steps, see CHANGELOG_0.6.3.28_AbilityScalingFactorFix.md*