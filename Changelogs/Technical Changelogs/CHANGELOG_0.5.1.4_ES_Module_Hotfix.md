# Changelog: Version 0.5.1.4 ES Module Export Hotfix

## Overview
This hotfix resolves a critical issue where the BattleScene class wasn't properly being recognized when the user attempted to start a battle. The fix addresses the conflict between ES module imports and the global class availability required by other parts of the codebase.

## Issues Fixed

### BattleScene Class Availability
- Fixed: "BattleScene class not available when trying to start battle!" error in TeamBuilderUIUpdates.js
- Fixed: Class availability conflict between ES module export and global scope

## Implementation Details

### BattleScene.js Modifications
- Properly exported the BattleScene class using ES module export syntax
- Added `export default` to the class declaration while maintaining the global variable assignment
- Ensured proper dual-mode availability (both as an ES module and as a global class)

## Technical Implementation Notes
- The issue occurred because modern ES modules do not automatically expose their classes to the global scope
- By explicitly using `export default class BattleScene` while maintaining the `window.BattleScene = BattleScene` assignment, we enable both module import and global reference
- This "dual export" pattern allows both ES module-based code and traditional script-based code to access the class

## Root Cause Analysis
When we added the ES module import for TurnIndicator, the BattleScene.js file was implicitly treated as an ES module, which changed how variable scoping worked. In ES modules, classes and variables are scoped to the module by default and not exposed to the global scope.

This meant that while `window.BattleScene = this;` was assigning an instance of the class to the global scope in the constructor, the class definition itself was not available globally, causing the error in TeamBuilderUIUpdates.js when it tried to reference the class.

By explicitly using `export default` while maintaining the global assignment, we ensure both module-based and global script-based access work correctly.
