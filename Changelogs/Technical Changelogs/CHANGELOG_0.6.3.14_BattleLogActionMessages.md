# CHANGELOG 0.6.3.14 - Battle Log Action Messages Fix

## Overview

This update addresses an issue with the Battle Log UI where action declarations (what a character is doing) weren't displaying properly in the UI. The problem was caused by two separate code blocks in `BattleFlowController.executeNextAction()` both sending messages of type 'action' to the `BattleLogManager`, causing one to override the other before they could be displayed.

## Problem Analysis

### Issue Description
The Battle Log UI was correctly displaying various messages (damage, healing, status effects, turn summaries) but was MISSING the explicit action declarations that state what action a character is performing. Messages like "Caste (ally) uses [Shatter Blade] on Sylvanna (enemy)!" should have been displayed but weren't appearing.

### Root Cause
In `BattleFlowController.executeNextAction()`, two separate blocks were sending messages of type 'action' to the battle log:

1. First block (around lines 327-343): Created a simpler format message and sent it with `this.battleManager.logMessage(message, 'action')`.
2. Second block (around lines 346-369): Created a more detailed `actionDeclaration` with proper team identifiers and correct formatting, then sent it with the same function and message type.

Since both were sent with the same message type ('action'), only one was being processed/displayed by the UI, and due to potential timing issues or overwriting, the detailed message that should have been displayed was lost.

### Diagnostic Process
The issue was identified by examining the message flow from `BattleFlowController` to `BattleLogManager`. Console logs were added to trace the messages and confirmed that both blocks were sending 'action' type messages separately.

## Solution Implementation

### Approach
The solution was to disable the first, simpler message block from sending to the Battle Log, while keeping the second, more detailed block active. This ensures only one correctly formatted action message is sent per game action.

### Changes Made

1. **Modified BattleFlowController.executeNextAction() first block**:
   - Changed from calling `this.battleManager.logMessage(message, 'action')` to only logging to console
   - Added a comment explaining this block is now deactivated for Battle Log
   - Added descriptive prefix to console log: `[BattleFlowController.executeNextAction - Simpler Log Block - DEACTIVATED FOR BATTLE LOG]`

2. **Updated BattleFlowController.executeNextAction() second block**:
   - Fixed console log prefixes to correctly reference `executeNextAction` instead of `applyActionEffect`
   - Made prefixes more descriptive with "- Detailed Log" for clarity
   - Kept the key line `this.battleManager.logMessage(actionDeclaration, 'action')` active
   - Added improved error handling and log messages for debugging

### Code Changes

#### Changed in BattleFlowController.js:

```diff
-        // Log the action
+        // Log the action (DISABLED FOR BATTLE LOG - sent to console only)
         let message;
         // Add team info to actor and target names for better clarity
         const actorName = `${action.actor.name}${action.team === 'player' ? ' (ally)' : ' (enemy)'}`;        
         const targetName = `${action.target.name}${action.team === 'player' ? ' (enemy)' : ' (ally)'}`;        
         
         if (action.useAbility) {
             // Handle different ability types in log message
             if (action.ability.isHealing || action.ability.damageType === 'healing') {
                 message = `${actorName} uses [${action.ability.name}] to heal ${targetName}!`;
             } else if (action.ability.damageType === 'utility') {
                 message = `${actorName} uses [${action.ability.name}]!`;
             } else {
                 message = `${actorName} uses [${action.ability.name}] on ${targetName}!`;
             }
         } else {
             message = `${actorName} attacks ${targetName} for ${action.damage} damage!`;
         }
-        this.battleManager.logMessage(message, 'action');
+        // DEACTIVATED: No longer send to Battle Log, only log to console
+        console.log(`[BattleFlowController.executeNextAction - Simpler Log Block - DEACTIVATED FOR BATTLE LOG]: ${message}`);
```

```diff
         // Generate and log proper action declaration for the battle log
         if (action && action.actor) {
-            console.log(`[BattleFlowController.applyActionEffect] Entered for Battle Log. Action received:`, JSON.parse(JSON.stringify(action)));
+            console.log(`[BattleFlowController.executeNextAction - Detailed Log] Action received:`, JSON.parse(JSON.stringify(action)));
             
             // Add team identifiers for clarity
             const actorName = `${action.actor.name}${action.team === 'player' ? ' (ally)' : ' (enemy)'}`;
```

```diff
             // Log the action declaration
-            console.log(`[BattleFlowController.applyActionEffect] Built actionDeclaration for Battle Log: "${actionDeclaration}"`); 
-            console.log(`[BattleFlowController.applyActionEffect] Action object for this declaration:`, JSON.parse(JSON.stringify(action)));
+            console.log(`[BattleFlowController.executeNextAction - Detailed Log] Built actionDeclaration for Battle Log: "${actionDeclaration}"`);
+            console.log(`[BattleFlowController.executeNextAction - Detailed Log] Action object for this declaration:`, JSON.parse(JSON.stringify(action)));
             if (this.battleManager && typeof this.battleManager.logMessage === 'function') {
-                console.log(`[BattleFlowController.applyActionEffect] Calling this.battleManager.logMessage for action declaration.`);
+                console.log(`[BattleFlowController.executeNextAction - Detailed Log] Calling this.battleManager.logMessage for action declaration.`);
                 this.battleManager.logMessage(actionDeclaration, 'action');
             } else {
-                console.error('[BattleFlowController.applyActionEffect] this.battleManager.logMessage is NOT available or not a function for action declaration!');
+                console.error('[BattleFlowController.executeNextAction - Detailed Log] this.battleManager.logMessage is NOT available or not a function for action declaration!');
             }
```

## Testing and Verification

The changes ensure that:

1. Only one message with type 'action' (the detailed one) is sent from BattleFlowController per game action.
2. The console logs show:
   - `[BattleFlowController.executeNextAction - Simpler Log Block - DEACTIVATED FOR BATTLE LOG]: ...`
   - `[BattleFlowController.executeNextAction - Detailed Log] Action received: ...`
   - `[BattleFlowController.executeNextAction - Detailed Log] Built actionDeclaration for Battle Log: "..."`
   - `[BattleFlowController.executeNextAction - Detailed Log] Calling this.battleManager.logMessage for action declaration.`
   - Followed by `[BattleLogManager.logMessage] Received to display: "THE_DETAILED_ACTION_DECLARATION", Type: "action"`
3. The Battle Log UI properly displays the correctly formatted, detailed action declarations.

### Test Cases

1. **Single-target abilities**: 
   - Verify messages like "ActorName (ally) uses [AbilityName] on TargetName (enemy)!" appear correctly
   - Check both player->enemy and enemy->player scenarios

2. **Auto-attacks**: 
   - Verify messages like "ActorName (ally) auto-attacks TargetName (enemy)!" appear correctly

3. **Multi-target abilities**:
   - Verify messages for area-of-effect abilities display the correct number of targets

## Impact Analysis

### Areas Affected
- Battle Log UI message display
- Console logging patterns for debugging
- BattleFlowController action flow

### Benefits
- Action declarations now appear correctly in the Battle Log UI
- Improved clarity in console logs for debugging
- Proper team identifiers in messages help distinguish between allies and enemies
- Better readability for players following the battle through the log

### Potential Risks
None identified - the change simply prevents duplicate messages of the same type from being sent.

## Conclusion

This fix resolves the issue with missing action declarations in the Battle Log UI by ensuring only one properly formatted 'action' type message is sent per game action, with no duplication that could cause override issues. The resulting log is more informative and clearly shows what each character is doing during their turn.