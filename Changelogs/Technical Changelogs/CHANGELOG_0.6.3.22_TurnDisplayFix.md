# Turn Display Update Fix (0.6.3.22)

## Issue
After refactoring BattleScene into separate components (BattleEventManager, BattleUIManager, TeamDisplayManager), the turn number in the battle UI header was stuck displaying "TURN 0" despite battles properly progressing through turns.

## Root Cause Analysis
During refactoring, the method `updateTurnNumberDisplay()` was moved from BattleScene to BattleUIManager. However, BattleEventManager's `handleTurnStarted` method was still trying to call the method directly on the scene object (`this.scene.updateTurnNumberDisplay`) rather than through the new UIManager component.

This contrasted with `onCharacterAction` which was correctly looking for the method on `this.scene.uiManager`. This explained why the character name was updating correctly in the header while the turn number remained at 0.

## Solution
Updated BattleEventManager.js's `handleTurnStarted` method to:
1. Primarily use the UIManager to update the turn display: `this.scene.uiManager.updateTurnNumberDisplay(data.turnNumber)`
2. Maintain a fallback to the legacy direct scene method for backward compatibility
3. Synchronize the scene's battleState.currentTurn value to ensure consistency between event data and scene state

## Code Changes
```javascript
// Before
handleTurnStarted(data) {
    if (!data || !this.scene) return;

    try {
        // Update turn number display
        if (this.scene.updateTurnNumberDisplay) {
            this.scene.updateTurnNumberDisplay(data.turnNumber);
        }
    } catch (error) {
        console.error("[BattleEventManager] Error handling turn started:", error);
    }
}

// After
handleTurnStarted(data) {
    if (!data || !this.scene) return;

    try {
        // Update turn number display using UIManager
        if (this.scene.uiManager && typeof this.scene.uiManager.updateTurnNumberDisplay === 'function') {
            console.log(`[BattleEventManager] Updating turn number display to ${data.turnNumber}`);
            this.scene.uiManager.updateTurnNumberDisplay(data.turnNumber);
        } else {
            console.warn("[BattleEventManager] Cannot update turn display - scene.uiManager not available or missing updateTurnNumberDisplay method");
            // Fallback to legacy method if available
            if (this.scene.updateTurnNumberDisplay) {
                this.scene.updateTurnNumberDisplay(data.turnNumber);
            }
        }
        
        // Also update the scene's battleState for consistency
        if (this.scene.battleState) {
            this.scene.battleState.currentTurn = data.turnNumber;
            console.log(`[BattleEventManager] Updated scene.battleState.currentTurn to ${data.turnNumber}`);
        }
    } catch (error) {
        console.error("[BattleEventManager] Error handling turn started:", error);
    }
}
```

## Testing
- Verified turn number display updates correctly in battle header
- Confirmed both the visual element and the scene's internal state are synchronized
- Added diagnostic logging to confirm proper operation

## Lessons Learned
This bug highlights the importance of consistent patterns when refactoring components. The CharacterAction handling was properly updated to use the UIManager while the TurnStarted handling was overlooked. Using consistent patterns for similar operations helps prevent these types of inconsistencies.
