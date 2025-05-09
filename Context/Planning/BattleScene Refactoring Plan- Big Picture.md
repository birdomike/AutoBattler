# BattleScene Refactoring Plan - Big Picture

This document outlines a phased approach to refactoring the BattleScene.js file, prioritizing the largest code removals first to maximize impact and maintainability.

## Phase 1: Extract Event Management (BattleEventManager) - Complete

**Goal**: Remove the bulk of event listening setup and handling logic from BattleScene.js.

**New Component**: `js/phaser/core/BattleEventManager.js`

**Code to Move from BattleScene.js**:
- `setupCoreEventListeners()`
- `setupStatusEffectListeners()`
- `setupHealthUpdateListeners()`
- `setupActionIndicatorListeners()`
- `handleTurnStarted()` (Note: Only the turn number update part)
- `onCharacterDamaged()` (Triggering health bar updates & floating text)
- `onCharacterHealed()` (Triggering health bar updates & floating text)
- `handleStatusEffectApplied()` (Triggering sprite floating text)
- `handleStatusEffectRemoved()` (Triggering sprite floating text)
- `handleStatusEffectUpdated()` (Currently empty, but belongs here conceptually)
- `onCharacterAction()` (Triggering active character visuals & action text)
- `onAbilityUsed()` (Triggering action text)

**BattleScene.js Changes**:
- `create()`: Instantiate BattleEventManager, passing references to this (the scene) and this.battleBridge.
- Remove all setup...Listeners calls from `create()` and `initializeBattleBridge()`.
- Remove all handle.../on... event handler methods listed above.
- `shutdown()`: Call a destroy() method on BattleEventManager to ensure all listeners are removed.

**Dependencies**:
- BattleEventManager needs references to:
  - BattleBridge (for addEventListener/removeEventListener)
  - BattleScene (initially, to call methods like showFloatingText, updateActiveCharacterVisuals)
  - Potentially TeamDisplayManager, BattleUIManager, BattleFXManager (in later phases)

**Estimated LOC Removed from BattleScene.js**: ~210-250+ lines

## Phase 2: Extract UI Creation & HUD Management (BattleUIManager)- Complete

**Goal**: Remove the methods responsible for creating and managing static UI elements, the HUD, and panels.

**New Component**: `js/phaser/managers/BattleUIManager.js`

**Code to Move from BattleScene.js**:
- `createBackground()`
- `createSceneTitle()`
- `createReturnButton()`
- `createWelcomeMessage()`
- `createBattleLogPanel()` (Will instantiate DirectBattleLog)
- `createBattleControls()` (Will instantiate BattleControlPanel)
- `showBattleOutcome()`
- `showErrorMessage()`
- `updateTurnNumberDisplay()` (Note: The part that updates the text object)
- `updateActionTextDisplay()` (Note: The part that updates the text object)
- `safeGetTextObject()` (Or move to a shared utility class)
- Maybe `createTestPattern()` (if kept for testing)

**BattleScene.js Changes**:
- `create()`: Instantiate BattleUIManager, passing this (the scene). Call an initializeUI() method.
- Remove all the create... and show... methods listed above.
- Remove updateTurnNumberDisplay and updateActionTextDisplay.
- `shutdown()`: Call battleUIManager.destroy()

**Dependencies**:
- BattleUIManager needs reference to Scene (for this.add, this.cameras, this.tweens)
- BattleEventManager (from Phase 1) will need a reference to BattleUIManager

**Estimated LOC Removed from BattleScene.js**: ~130-180 lines

## Phase 3: Extract Team Display & Active Indicator Management (TeamDisplayManager)- Complete

**Goal**: Remove the logic for creating/managing team visuals and handling the active character indicators.

**New Component**: `js/phaser/managers/TeamDisplayManager.js`

**Code to Move from BattleScene.js**:
- `createCharacterTeams()`
- `cleanupCharacterTeams()`
- `updateActiveCharacterVisuals()` (The logic for finding the sprite, calling its highlight, positioning the floor marker)
- Management of the this.turnIndicator instance
- `getTeamData()`

**BattleScene.js Changes**:
- `init()`: Still receives team data.
- `create()`: Instantiate TeamDisplayManager, passing this (the scene) and the initial team data.
- Remove createCharacterTeams, cleanupCharacterTeams, updateActiveCharacterVisuals, getTeamData.
- Remove this.turnIndicator property.
- `shutdown()`: Call teamDisplayManager.destroy()

**Dependencies**:
- TeamDisplayManager needs reference to Scene
- TeamDisplayManager needs TeamContainer, CharacterSprite, TurnIndicator classes
- BattleEventManager needs reference to TeamDisplayManager

**Estimated LOC Removed from BattleScene.js**: ~70-100 lines

## Phase 4: Extract Asset Loading (BattleAssetLoader)- Pausing until Bugs are fixed

**Goal**: Remove asset loading logic from preload.

**New Component**: `js/phaser/core/BattleAssetLoader.js`

**Code to Move from BattleScene.js**:
- All logic currently in `preload()`
- `preloadStatusEffectIcons()`
- `initStatusIconMapping()`

**BattleScene.js Changes**:
- `preload()`: Instantiate BattleAssetLoader, passing this (the scene's loader).
- Remove preloadStatusEffectIcons, initStatusIconMapping.

**Dependencies**: BattleAssetLoader needs reference to Scene (for this.load).

**Estimated LOC Removed from BattleScene.js**: ~40-60 lines

## Phase 5: Extract Visual Effects (BattleFXManager)

**Goal**: Centralize triggering of non-sprite-specific visual effects like floating text and attack animations.

**New Component**: `js/phaser/managers/BattleFXManager.js`

**Code to Move from BattleScene.js**:
- `showFloatingText()`
- `showAttackAnimation()` (Note: The method itself moves, but it calls CharacterSprite.showAttackAnimation)

**BattleScene.js Changes**:
- `create()`: Instantiate BattleFXManager, passing this (the scene).
- Remove showFloatingText, showAttackAnimation.
- `shutdown()`: Call battleFXManager.destroy().

**Dependencies**:
- BattleFXManager needs reference to Scene and TeamDisplayManager
- BattleEventManager needs reference to BattleFXManager

**Estimated LOC Removed from BattleScene.js**: ~30-50 lines

## Phase 6: Extract Debug Tools (PhaserDebugManager) (Optional)

**Goal**: Remove debug-specific UI and logic.

**New Component**: `js/phaser/debug/PhaserDebugManager.js`

**Code to Move from BattleScene.js**:
- `initializeDebugTools()`
- `cleanupDebugTools()`
- `createDebugPanel()` (Also the debug test buttons within createBattleControls)
- `testHealthUpdate()`
- `testActionIndicator()`

**BattleScene.js Changes**:
- `create()`: Instantiate PhaserDebugManager, passing this (the scene).
- Remove the methods listed above.
- `shutdown()`: Call phaserDebugManager.destroy().

**Dependencies**: Needs reference to Scene and potentially other managers.

**Estimated LOC Removed from BattleScene.js**: ~50-80 lines

## Phase 7: Final BattleScene.js Cleanup

**Goal**: Ensure BattleScene.js is a clean orchestrator.

**Actions**:
- Review remaining code
- Remove commented-out sections
- Ensure all logic is delegated
- Update file-level documentation/version
