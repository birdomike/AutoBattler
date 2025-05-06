# Version 0.5.23_Cleanup - 2025-05-04

## Overview
This cleanup phase removes the feature toggle (`useNewImplementation`) and the original legacy code path for damage application from `BattleFlowController.js`. The system now exclusively uses the `DamageCalculator.applyDamage` method introduced in v0.5.23.

## Changes Made

1.  **Removed Toggle and Legacy Code in `BattleFlowController.applyActionEffect`**:
    * The entire `if (this.battleManager.useNewImplementation && this.battleManager.damageCalculator) { ... } else { ... }` block within the damaging action section was removed.
    * It was replaced by a direct call to `this.battleManager.damageCalculator.applyDamage(...)`, preceded by a check to ensure `this.battleManager.damageCalculator` exists.

    ```javascript
    // In BattleFlowController.js -> applyActionEffect method -> damaging action section:

    // --- Code Before Cleanup ---
    /*
            // Declare variables for tracking damage and killed state
            let actualDamage = 0;
            let killed = false;

            if (this.battleManager.useNewImplementation && this.battleManager.damageCalculator) {
                // Use the new extracted method
                const result = this.battleManager.damageCalculator.applyDamage(...);
                actualDamage = result.actualDamage;
                killed = result.killed;
            } else {
                // Original implementation
                const previousHp = action.target.currentHp;
                action.target.currentHp = Math.max(0, action.target.currentHp - action.damage);
                actualDamage = previousHp - action.target.currentHp;
                killed = action.target.currentHp <= 0 && !action.target.isDefeated;
                // Dispatch CHARACTER_DAMAGED event via BattleBridge...
            }
            // ... subsequent logic using actualDamage and killed ...
    */

    // --- Code After Cleanup ---
            // Damaging action - Delegate to DamageCalculator component
            // DamageCalculator handles damage application and CHARACTER_DAMAGED event dispatch

            // Ensure DamageCalculator component is available
            if (!this.battleManager.damageCalculator) {
                 console.error('[BattleFlowController] DamageCalculator component not found! Cannot apply damage.');
                 return; // Or handle error appropriately
            }

            // Directly use DamageCalculator to apply damage and get results
            const result = this.battleManager.damageCalculator.applyDamage(
                action.target,
                action.damage,
                action.actor,
                action.ability,
                action.damageType || 'physical'
            );

            // Store the result values locally for subsequent processing
            const actualDamage = result.actualDamage;
            const killed = result.killed;

            // ... subsequent logic using actualDamage and killed remains unchanged ...
    ```

2.  **Standardized Defeat Check in `BattleFlowController.checkBattleEnd`**:
    * Updated the filter condition to use `char.isDefeated` instead of `char.isDead` for consistency.

    ```javascript
    // In BattleFlowController.js -> checkBattleEnd method:

    // UPDATED: Use isDefeated for consistency
    const playerDefeated = this.battleManager.playerTeam.filter(char => char.isDefeated || char.currentHp <= 0).length;
    const enemyDefeated = this.battleManager.enemyTeam.filter(char => char.isDefeated || char.currentHp <= 0).length;
    ```

## Verification
* Manual testing confirmed that damage application, event dispatch (`CHARACTER_DAMAGED`), defeat handling, and passive triggers (`onKill`, `onDefeat`) function correctly using the permanent `DamageCalculator` path.
* Removed redundant testing scenarios related to the `useNewImplementation = false` path.

## Conclusion
The cleanup for v0.5.23 is complete. `BattleFlowController` now fully delegates damage application to `DamageCalculator`, adhering to the planned separation of concerns. The system is ready to proceed to the next refactoring stage (Stage 5: Ability Processing).