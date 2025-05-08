Changelog: Turn Indicator System Fix (v0.6.2.4)
Technical Changes

Converted TurnIndicator component from ES Module to traditional script with global window registration
Updated TeamDisplayManager to properly use TurnIndicator class API
Modified BattleScene to use globally registered TurnIndicator rather than ES import
Updated index.html to load TurnIndicator as traditional script before BattleScene
Added improved error handling and fallbacks throughout the system

Key Files Modified

TurnIndicator.js

Removed ES Module syntax (export default)
Added global window registration at end of file
Updated version number to 0.6.2.4


TeamDisplayManager.js

Updated createTurnIndicator() to use TurnIndicator class
Added fallback creation for compatibility
Refactored updateTurnIndicator() to use proper showAt API
Added improved position detection with fallback
Removed manual triangle drawing and pulse effect code
Added battle speed handling for smoother animations


index.html

Replaced module script tag with traditional script tag
Ensured proper load order (TurnIndicator before BattleScene)
Added clearer comments about script dependencies


BattleScene.js

Removed ES Module import of TurnIndicator
Updated TurnIndicator creation to use global window.TurnIndicator
Enhanced error handling and fallbacks
Added comprehensive feature detection



Benefits

Fixed turn indicator not appearing during battles
Aligned with project's non-ES Module architecture
Added proper error handling with graceful fallbacks
Improved compatibility across the system
Reduced complexity by standardizing on one component architecture pattern