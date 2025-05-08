# Version 0.6.3.3 - Action Dispatch Diagnostics

## Overview
Added enhanced diagnostic logs to investigate why the BattleBridge patched version of `applyActionEffect` is not being called during combat, causing CHARACTER_ACTION events not to be dispatched properly to the BattleEventManager.

## Changes

### BattleFlowController.js
- Added diagnostic logs in `executeNextAction()` before calling `this.applyActionEffect(action)`:
  - Log showing action's actor name and action type
  - Log examining the contents of `this.battleManager.applyActionEffect` function to verify if it contains the BattleBridge patched version

### BattleBridge.js
- Modified logging format in patched `applyActionEffect` method for consistency and readability
- Ensured exact log format for diagnosing execution path entry

## Technical Details
The diagnostics focus on the key hypothesis: BattleFlowController is calling its own internal implementation of `applyActionEffect` rather than the BattleManager version that BattleBridge patches. 

The new logs are designed to:
1. Trace the execution path when an action is being processed
2. Examine the actual function definition of `this.battleManager.applyActionEffect` to see if it contains the BattleBridge patching code
3. Confirm whether the BattleBridge patched version of the method is being executed

This will help identify why turn highlighting (floor markers) and action indicators are not appearing in battle, as these visual elements depend on the CHARACTER_ACTION events that should be dispatched by the BattleBridge-patched version of `applyActionEffect`.

## Findings
Initial analysis indicates BattleFlowController might have its own implementation of `applyActionEffect` that bypasses the BattleManager's implementation patched by BattleBridge, preventing the proper event dispatch required for visual indicators.

## Next Steps
After testing with these diagnostic logs:
1. If logs confirm BattleFlowController is using its own implementation instead of the patched BattleManager version, consider:
   - Adding the event dispatch directly to BattleFlowController's `applyActionEffect` method
   - Refactoring BattleFlowController to use BattleManager's patched version
   - Updating BattleBridge to patch both BattleManager and BattleFlowController implementations
