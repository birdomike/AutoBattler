## Version 0.5.14 - 2025-05-17
### Fixed
- **Critical Circular Reference Issue**: Resolved issue preventing battles from starting due to circular references between BattleManager and BattleFlowController
  - Fixed BattleFlowController.startBattle implementation to properly initialize battle without delegating back to BattleManager
  - Implemented direct call to this.startNextTurn() at end of startBattle method to maintain correct flow
  - Added comprehensive error handling with detailed logging for easier debugging
  - Preserved all initialization logic from original battle start implementation

### Technical
- **Component Architecture Improvement**: Enhanced separation of concerns between BattleManager and BattleFlowController
  - BattleManager now acts as a pure facade with minimal logic
  - BattleFlowController now fully owns the battle flow and initialization process
  - Resolved dependency cycle that was causing TypeError during battle start
  - Improved initialization sequence with better logging and error handling