# CHANGELOG 0.5.24b: Turn Indicator Debugging

## Issue Description
The turn indicator (floor marker) works correctly for the first character whose turn begins but remains visually stuck under that character for all subsequent turns, despite event logging confirming that TURN_STARTED events continue to fire for later turns and the handleTurnStarted method is being called.

## Problem Analysis
The issue could be occurring in several places within the turn indicator flow:

1. **Event data inconsistency**: The TURN_STARTED event might contain incorrect character data after the first turn.
2. **Character lookup failure**: The system might fail to find the corresponding CharacterSprite for characters after the first turn.
3. **Failed highlight/unhighlight**: Previous turn indicators might not be clearing properly, or new ones might not be appearing.
4. **Potential race condition**: The timing between clearTurnIndicators and showTurnIndicator calls might be causing issues.

## Implementation Approach
Added non-intrusive diagnostic logging throughout the turn indicator chain to identify exactly where the breakdown is occurring. All code is clearly marked as temporary debug code that will be removed once the issue is resolved.

## Changes

### 1. BattleScene.js - TURN_STARTED Event Listener
```javascript
// Enhanced event listener with detailed logging
this.battleBridge.addEventListener(this.battleBridge.eventTypes.TURN_STARTED, (data) => {
    // TEMPORARY DEBUG CODE: Enhanced logging for turn indicator debugging
    // Shows character name and team from event data to verify correct character is being passed
    console.log(`[BattleScene] >>> TURN_STARTED Event Received. Turn: ${data.turnNumber}, Character in Event: ${data.character?.name} (Team: ${data.character?.team}), Raw Data:`, data);
    this.handleTurnStarted(data); // Call the handler
});
```
This allows us to verify that event data contains the correct character for each turn.

### 2. BattleScene.js - handleTurnStarted Method
```javascript
// TEMPORARY DEBUG CODE: Verify character data received from event
console.log(`[BattleScene] handleTurnStarted: Processing Turn ${this.battleManager?.currentTurn}. Identified character object from event:`, newActiveCharacter);

// TEMPORARY DEBUG CODE: Log team container selection
console.log(`[BattleScene] handleTurnStarted: Attempting to find sprite for: ${newActiveCharacter.name} in container for team ${newActiveCharacter.team}`);

// TEMPORARY DEBUG CODE: Log successful sprite identification
console.log(`[BattleScene] handleTurnStarted: Successfully found sprite for ${newActiveCharacter.name}:`, activeSprite);

// TEMPORARY DEBUG CODE: Log turn indicator call
console.log(`[BattleScene] handleTurnStarted: Called showTurnIndicator for ${newActiveCharacter.name}`);

// TEMPORARY DEBUG CODE: Log failed sprite lookup
console.warn(`[BattleScene] handleTurnStarted: FAILED to find sprite for ${newActiveCharacter.name}`);
```
These logs trace the flow of character identification and team container lookups within the handler.

### 3. TeamContainer.js - clearTurnIndicators Method
```javascript
// TEMPORARY DEBUG CODE: Log when clearTurnIndicators is called
console.log(`[TeamContainer] >>> clearTurnIndicators called for team ${this.isPlayerTeam ? 'Player' : 'Enemy'}, with ${Array.isArray(this.characterSprites) ? this.characterSprites.length : 0} sprites`);

// TEMPORARY DEBUG CODE: Log each sprite unhighlight call
console.log(`[TeamContainer] clearTurnIndicators: Unhighlighting sprite ${index} (${sprite.character?.name || 'unknown'})`);
```
These logs verify that turn indicators are being cleared properly before setting new ones.

### 4. TeamContainer.js - showTurnIndicator Method
```javascript
// TEMPORARY DEBUG CODE: Log showTurnIndicator call
console.log(`[TeamContainer] >>> showTurnIndicator called for ${identifier} in team ${this.isPlayerTeam ? 'Player' : 'Enemy'}`);

// TEMPORARY DEBUG CODE: Log sprite lookup by name
console.log(`[TeamContainer] showTurnIndicator: Looking up by name "${identifier}", found: ${!!sprite}`);
```
These logs confirm whether the correct character is being highlighted.

### 5. TeamContainer.js - getCharacterSpriteByName Method
```javascript
// TEMPORARY DEBUG CODE: Log character lookup
console.log(`[TeamContainer] >>> getCharacterSpriteByName called for name="${name}" in team ${this.isPlayerTeam ? 'Player' : 'Enemy'}`);

// TEMPORARY DEBUG CODE: Log available character names
console.log(`[TeamContainer] getCharacterSpriteByName: Available characters in ${this.isPlayerTeam ? 'Player' : 'Enemy'} team:`);
this.characterSprites.forEach((sprite, i) => {
    if (sprite && sprite.character) {
        console.log(`  [${i}] name="${sprite.character.name}", id=${sprite.character.id || 'none'}`);
    } else {
        console.log(`  [${i}] Invalid sprite or missing character data`);
    }
});

// TEMPORARY DEBUG CODE: Log result
console.log(`[TeamContainer] getCharacterSpriteByName: ${foundSprite ? 'FOUND' : 'NOT FOUND'} sprite for "${name}" in team ${this.isPlayerTeam ? 'Player' : 'Enemy'}`);
```
These logs provide detailed information about the character lookup process, showing all available characters and the search result.

### 6. CharacterSprite.js - highlight and unhighlight Methods
```javascript
// TEMPORARY DEBUG CODE: Log highlight call
console.log(`[CharacterSprite] >>> highlight called for ${this.character?.name} (team: ${this.character?.team})`);

// TEMPORARY DEBUG CODE: Log missing dependencies
console.warn(`[CharacterSprite] highlight: Cannot highlight ${this.character?.name}, missing scene or container`);

// TEMPORARY DEBUG CODE: Log unhighlight call
console.log(`[CharacterSprite] >>> unhighlight called for ${this.character?.name} (team: ${this.character?.team})`);
```
These logs verify that highlight and unhighlight methods are being called correctly for the appropriate characters.

## Expected Debug Flow

1. When a turn starts, we should see a TURN_STARTED event log with the new active character
2. We should then see a successful lookup for that character's sprite
3. We should see logs for clearTurnIndicators, followed by a showTurnIndicator call
4. We should see every sprite being unhighlighted, then the new active sprite being highlighted

## Potential Resolutions

Based on the diagnostic logs, the issue will likely be one of the following:

1. **Wrong Character Data**: If logs show the event consistently contains the first character's data for all turns, it indicates an issue in the BattleBridge or BattleManager.
2. **Failed Lookup**: If the correct character name is being searched for but not found, it could be a name mismatch or character creation issue.
3. **Highlight/Unhighlight Failure**: If the correct sprite is found but highlight/unhighlight calls are failing, it may be a rendering or visibility issue.
4. **Incorrect Team Container**: If the system is looking in the wrong team container for a character, it would explain why the lookup fails.

## Post-Fix Cleanup Plan
Once the issue is identified and fixed, all temporary debug code will be removed. The appropriate solution will be documented in a separate changelog entry describing the permanent fix.