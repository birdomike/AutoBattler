# TeamBuilder Component Refactoring

This directory contains the refactored components for the TeamBuilder UI, following a component-based architecture pattern.

## Refactoring Strategy: Extract-Verify-Remove

Each component follows a three-stage refactoring process:

1. **Extract**: Create the new component with all required methods
2. **Verify**: Test the component while keeping original implementations as fallbacks
3. **Remove**: Remove original implementations after successful verification

## Component Architecture

![TeamBuilder Component Architecture](https://i.imgur.com/WxkZPZr.png)

The refactored system transforms TeamBuilderUI from a monolithic class into an orchestrator that delegates to specialized manager components:

```
TeamBuilderUI (orchestrator)
├── TeamBuilderUtils (shared utility functions)
├── FilterManager (handles type/role filtering)
├── HeroGridManager (displays available heroes)
├── TeamSlotsManager (manages team composition)
├── HeroDetailPanelManager (displays hero details)
├── BattleModeManager (handles battle mode selection)
└── BattleInitiator (handles battle start logic)
```

## Component Dependencies

```
TeamBuilderUI → All components (initialization and coordination)
HeroGridManager → FilterManager (needs filter state for rendering)
HeroGridManager → TeamBuilderUtils (for type handling methods)
TeamSlotsManager → TeamBuilderUtils (for type handling methods)
HeroDetailPanelManager → TeamBuilderUtils (for type handling methods)
BattleInitiator → TeamSlotsManager (needs team data)
BattleInitiator → BattleModeManager (needs battle mode)
```

## Phase 1: TeamBuilderUtils and Infrastructure (Current)

Extracted shared utility functions from TeamBuilderUI:
- `splitTypes(typeString)`: Handles multi-type splitting 
- `renderMultiTypeSpans(typeString, container, typeColors)`: Renders type spans
- `getOrdinalSuffix(n)`: Gets ordinal suffix (1st, 2nd, 3rd)
- `createStatBox(label, value, tooltip)`: Creates stat boxes
- `getDetailedScalingText(ability, hero)`: Gets ability scaling descriptions

## Planned Phases

### Phase 2: HeroDetailPanelManager
Methods to extract:
- `renderHeroDetails()`
- `updateExistingHeroDetails(detailHero)`
- `addArtToDetailPanel(hero, detailIconContainer)`

### Phase 3: FilterManager
Methods to extract:
- `renderFilters()`
- Filter toggle handling

### Phase 4: HeroGridManager
Methods to extract:
- `renderHeroGrid()`
- `selectHeroDetails(hero)`

### Phase 5: TeamSlotsManager
Methods to extract:
- `renderTeamSlots()`
- `renderTeamSynergies()`
- `calculateSynergies()`
- `addHeroToTeam(position)`
- `removeHeroFromTeam(position)`

### Phase 6: Battle Mode and Initiation
Methods to extract:
- `renderBattleModes()`
- `updateStartBattleButton()`
- `startBattle()`
- `startBattleWithDelay()`
