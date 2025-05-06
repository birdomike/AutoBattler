# CHANGELOG 0.5.7.1: Stack Overflow Fix

## Overview

This hotfix version resolves a critical stack overflow issue that occurred when attempting to start a battle after implementing the BattleFlowController setup in version 0.5.7.0. The issue was caused by a circular reference between BattleManager.startBattle, BattleFlowController.startBattle, and the BattleBridge patch for startBattle.

## Root Cause Analysis

The stack overflow occurred due to three components calling each other in an infinite loop:

1. When `BattleManager.startBattle()` was called, it would incorrectly check `useNewImplementation` flag instead of `useNewFlowController` flag, and delegate to `BattleFlowController.startBattle()`

2. The `BattleFlowController.startBattle()` shell implementation would then call back to `BattleManager.startBattle()`

3. Meanwhile, the BattleBridge had patched `BattleManager.startBattle()` to dispatch BATTLE_STARTED events, creating yet another level of redirection

This created an infinite recursion that quickly exceeded the call stack limit:
```
BattleManager.startBattle
  -> BattleFlowController.startBattle 
    -> BattleManager.startBattle (patched by BattleBridge)
      -> BattleFlowController.startBattle
        ... and so on
```

## Implementation Details

### 1. Disabled BattleBridge Patching of startBattle

In `BattleBridge.js`, we completely commented out the code block that patches `BattleManager.startBattle`:

```javascript
// Patch startBattle
/*
if (originalStartBattle) {
    this.battleManager.startBattle = function() {
        const result = originalStartBattle.apply(this, arguments);
        self.dispatchEvent(self.eventTypes.BATTLE_STARTED, {
            playerTeam: this.playerTeam,
            enemyTeam: this.enemyTeam
        });
        return result;
    };
}
*/
console.log('[BattleBridge] Patching of startBattle SKIPPED.');
```

This prevents one source of the infinite recursion by ensuring the BattleBridge doesn't intercept and modify startBattle calls.

### 2. Ensured Flow Controller Is Off Initially

In `BattleManager.initializeComponentManagers()`, we explicitly set `useNewFlowController` to false after initializing the component:

```javascript
// Ensure flow controller is off initially (will be explicitly enabled when needed)
this.useNewFlowController = false;
```

This guarantees that even though the BattleFlowController is initialized, it won't be used until explicitly enabled via `toggleFlowController()`.

### 3. Fixed BattleManager.startBattle Logic

Updated the delegation check in `BattleManager.startBattle()` to correctly use `useNewFlowController` instead of `useNewImplementation`:

```javascript
// REFACTORING: Use BattleFlowController if toggle is enabled
if (this.useNewFlowController && this.battleFlowController) {
    console.log('[BattleManager] Delegating startBattle to BattleFlowController');
    return this.battleFlowController.startBattle(playerTeam, enemyTeam);
}
```

Added a clear log message to confirm when delegation occurs, making it easier to trace execution flow.

## Testing Instructions

After applying these changes:

1. Load the game with the toggle OFF (default) - Battles should work correctly using the original BattleManager logic

2. Manually toggle BattleFlowController ON with:
   ```javascript
   window.battleManager.toggleFlowController()
   ```

3. Start a battle - It should now delegate to BattleFlowController.startBattle() for the first step
   - You should see the "[BattleManager] Delegating startBattle to BattleFlowController" log message
   - You should see the "[BattleFlowController] startBattle called - SHELL IMPLEMENTATION" log message
   - You should NOT see a stack overflow error

## Next Steps

With the stack overflow issue resolved, development can proceed with the actual implementation of BattleFlowController.startBattle in Version 0.5.8, as outlined in the Stage 3 plan.