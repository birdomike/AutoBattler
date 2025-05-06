## Version 0.5.17 - 2025-05-18
### Fixed
- **Action Queue Ordering**: Resolved null character issue in TURN_STARTED events
  - Reordered logic in BattleFlowController.startNextTurn() to populate action queue before determining current character
  - Moved the currentChar determination after generateTurnActions() call to ensure queue is populated
  - Ensured the TURN_STARTED event is dispatched with a valid character reference
  - Fixed turn highlighting by ensuring character data is available when event is dispatched

- **Character Status Check**: Fixed "TypeError: char.isDefeated is not a function" in checkBattleEnd
  - Changed filter conditions from method call (char.isDefeated()) to property check (char.isDead || char.currentHp <= 0)
  - Applied fix to both playerDefeated and enemyDefeated calculations
  - Maintained the same logical condition but using available properties
  - Ensured battle outcome is correctly determined based on character health state

### Technical
- **Root Cause Analysis**:
  - The TURN_STARTED event was being dispatched before the action queue was populated, causing null character references
  - The battle flow code was trying to call isDefeated() which doesn't exist on character objects, which use isDead boolean property instead
  
- **Reordering Logic**:
  ```javascript
  // BEFORE: Determine character first, dispatch event, then generate actions
  const currentChar = this.battleManager.actionQueue?.[0]?.actor || null;
  // Dispatch TURN_STARTED event...
  // ...later in the method...
  this.battleManager.generateTurnActions();
  
  // AFTER: Generate actions first, then determine character, then dispatch event
  this.battleManager.generateTurnActions();
  const currentChar = this.battleManager.actionQueue?.[0]?.actor || null;
  // Dispatch TURN_STARTED event...
  ```

- **Property Check Update**:
  ```javascript
  // BEFORE: Method call that doesn't exist
  const playerDefeated = this.battleManager.playerTeam.filter(char => char.isDefeated()).length;
  
  // AFTER: Property check using existing properties
  const playerDefeated = this.battleManager.playerTeam.filter(char => char.isDead || char.currentHp <= 0).length;
  ```

### Lessons Learned
- Events dispatched based on sequence-dependent data should be placed after the data is guaranteed to be populated
- When refactoring, method calls should be checked against actual object properties to ensure they exist
- Using consistent terminology between code and data models is important (isDead vs isDefeated)
- Direct property checks can be more reliable than method calls, especially during a refactoring process
