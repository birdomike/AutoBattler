# Comprehensive Event Inventory for BattleEventDispatcher

This document catalogs all event types used in the battle system, including their expected data structures and consumers. It serves as a blueprint for implementing the BattleEventDispatcher component.

## Core Event Types

| Event Type | Description | Dispatchers | Consumers | Data Structure |
|------------|-------------|------------|-----------|----------------|
| **BATTLE_INITIALIZED** | Fired when BattleBridge is initialized | BattleBridge.initialize | BattleScene | `{ battleManager, battleScene }` |
| **BATTLE_STARTED** | Fired when a battle begins | BattleFlowController | BattleControlPanel | `{ playerTeam, enemyTeam }` |
| **BATTLE_ENDED** | Fired when battle concludes | BattleFlowController | BattleScene, DirectBattleLog | `{ winner: 'player'/'enemy'/'draw', reason }` |
| **TURN_STARTED** | Fired at start of a new turn | BattleFlowController | BattleScene, DirectBattleLog | `{ turnNumber, currentCharacter, character }` |
| **TURN_ENDED** | Fired when a turn completes | BattleFlowController | BattleScene | `{ currentCharacter, turnNumber }` |
| **BATTLE_LOG** | General battle messages | BattleLogManager, BattleManager | DirectBattleLog | `{ message, type }` |

## Character Events

| Event Type | Description | Dispatchers | Consumers | Data Structure |
|------------|-------------|------------|-----------|----------------|
| **CHARACTER_ACTION** | Character performing an action | BattleFlowController, ApplyActionEffect | BattleScene, DirectBattleLog | `{ character, action: { type, name, abilityName, target } }` |
| **CHARACTER_DAMAGED** | Character taking damage | ApplyActionEffect, ApplyDamage | BattleScene, DirectBattleLog | `{ character, target, amount, source, ability, newHealth, maxHealth }` |
| **CHARACTER_HEALED** | Character being healed | ApplyActionEffect, ApplyHealing | BattleScene, DirectBattleLog | `{ character, target, amount, source, ability, newHealth, maxHealth }` |
| **CHARACTER_DEFEATED** | Character reduced to 0 HP | ApplyDamage | DirectBattleLog | `{ character, source }` |

## Ability & Passive Events

| Event Type | Description | Dispatchers | Consumers | Data Structure |
|------------|-------------|------------|-----------|----------------|
| **ABILITY_USED** | Ability activation | ProcessAbility | DirectBattleLog | `{ source, ability, targets, result }` |
| **PASSIVE_TRIGGERED** | Passive ability triggered | TriggerPassive | DirectBattleLog | `{ character, triggerType, passiveData, result }` |

## Status Effect Events

| Event Type | Description | Dispatchers | Consumers | Data Structure |
|------------|-------------|------------|-----------|----------------|
| **STATUS_EFFECT_APPLIED** | New status effect on character | AddStatusEffect | BattleScene, StatusEffectContainer, DirectBattleLog | `{ character, statusId, duration, stacks, statusDefinition }` |
| **STATUS_EFFECT_REMOVED** | Status effect removed | RemoveStatusEffect | BattleScene, StatusEffectContainer, DirectBattleLog | `{ character, statusId, statusDefinition }` |
| **STATUS_EFFECT_UPDATED** | Status effect duration/stacks changed | UpdateStatusEffect | StatusEffectContainer | `{ character, statusId, duration, stacks, statusDefinition }` |
| **STATUS_EFFECTS_CHANGED** | Bulk update to status effects | ProcessStatusEffects | StatusEffectContainer | `{ character, effects }` |

## UI Interaction Events

| Event Type | Description | Dispatchers | Consumers | Data Structure |
|------------|-------------|------------|-----------|----------------|
| **BATTLE_UI_INTERACTION** | General UI interactions | BattleBridge methods | BattleScene, DirectBattleLog | Various, common properties: `{ action }` |
| **SPEED_CHANGE** | Battle speed changed | RequestSpeedChange | DirectBattleLog | `{ action: 'speed_change', speed, previousSpeed, turnDelay, actionDelay }` |
| **PAUSE_RESUME** | Battle paused/resumed | RequestPause/Resume | N/A | `{ action: 'pause'/'resume' }` |

## Critical Property Consistency Requirements

For reliable event handling, these properties must be consistent across event dispatches:

### Character Identification
- `character` must be the complete character object
- `character.name` must be present for display
- `character.team` must be 'player' or 'enemy' for team-specific handling
- `character.uniqueId` needed for finding character sprites
- `character.stats.hp` needed for health percentage calculations

### Health Updates
- `newHealth` must be the current health value after change
- `amount` should be the raw amount of damage/healing
- `maxHealth` (or character.stats.hp) needed for health bar percentage

### Event Naming Consistency
- Some handlers use `target` while others expect `character` 
- Some handlers use `source` while others expect `character`
- New implementation should support both property names for backward compatibility

## Implementation Requirements

1. **Preserve Property Names**: Even if properties have redundant information, maintain all properties expected by consumers
2. **Defensive Value Creation**: Use default values when source doesn't provide all properties
3. **Handle Team Prefixing**: Support both prefixed and unprefixed character IDs
4. **Event Validation**: Validate minimal required structure before dispatch
5. **Transparent Fallback**: When using fallback to BattleBridge, preserve exact data structure

## Architectural Clarifications

### BATTLE_LOG Event Flow
The current inventory reflects a transitional state rather than the ideal final architecture. In the final architecture:

1. **Semantic Event Dispatch**: Components like `BattleManager` or `BattleFlowController` should only dispatch semantic events (CHARACTER_ACTION, etc.) that represent what happened in the battle
2. **Event Translation**: `BattleLogManager` should listen to these semantic events
3. **Message Formatting**: `BattleLogManager` should format appropriate human-readable messages
4. **Message Dispatch**: `BattleLogManager` then dispatches these as `BATTLE_LOG` events
5. **UI Consumption**: Only UI components like `DirectBattleLog` should consume `BATTLE_LOG` events

This separation of concerns is cleaner and more maintainable:
- Battle logic components focus on what happened
- `BattleLogManager` focuses on translating events to human-readable messages  
- UI components focus on displaying those messages

### Source/Target Naming Standardization

For the `BattleEventDispatcher` implementation, we will standardize on `source` and `target` terminology internally:

- **Internal Consistency**: Within the dispatcher, use consistent `source` (initiator) and `target` (recipient) naming
- **Semantic Clarity**: This provides clearer meaning about the relationship between entities
- **Backward Compatibility**: While using standardized naming internally, the dispatcher will include both naming patterns in outgoing events for compatibility with existing components

This approach provides a clean internal structure while preventing any disruption to existing systems.
