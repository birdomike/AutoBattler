## Version 0.5.16 - 2025-05-18
### Fixed
- **Critical Script Loading Path Issue**: Resolved "startNextTurn is not a function" error by fixing incorrect script path
  - Updated script tag in index.html to point to the correct BattleFlowController location
  - Changed path from incorrect "js/managers/BattleFlowController.js" to correct "js/battle_logic/core/BattleFlowController.js"
  - Fixed class instantiation issues caused by the script not loading from the proper directory
  - Ensured BattleFlowController is properly loaded before BattleManager attempts to use it

### Technical
- **Root Cause Analysis**:
  - Diagnostic logs from v0.5.15 revealed that immediately after creating BattleFlowController, its methods were undefined
  - BattleManager's `if (window.BattleFlowController)` check was passing, but the constructor wasn't creating a proper instance
  - Thorough examination of index.html revealed script was loading from incorrect location after refactoring
  - This explained why instantiation appeared to succeed but methods were missing from the prototype

### Lessons Learned
- When refactoring file locations, all references in HTML must be updated to match new directory structure
- JavaScript's behavior when instantiating undefined constructors can be misleading (doesn't always throw immediate errors)
- The sequence "BattleManager → calls `new window.BattleFlowController()` → controller instance has no methods" indicated a script loading issue
- Even when code appears correct, path references can cause subtle initialization problems
- Diagnostic logging at key initialization points is invaluable for tracking down such issues
