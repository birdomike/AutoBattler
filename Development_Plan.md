# AutoBattler Game Development Plan (Revised)

## Overview
This document outlines the development roadmap for our AutoBattler game. The game features teams of characters with unique abilities that battle automatically based on their stats, abilities, and some randomness, with a focus on strategic team building and character progression (in Campaign mode). Many core system designs are detailed in the associated **`C:\Personal\AutoBattler\GeminiSuggestions.md`** document.

## Phase 1: Core Mechanics and UI Enhancement (Completed)
- [x] Basic folder structure and file setup
- [x] Team Builder UI implementation (including Random, Custom, Campaign mode selection)
- [x] Basic Character data structure
- [x] Enhance Team Builder UI
  - [x] Improve visual feedback for selections
  - [x] Add tooltips for abilities and stats
  - [x] Implement character filters by type/role
  - [x] Add sound effects for UI interactions

## Phase 2: Battle System Basics & UI (Current/Partially Completed)
- [x] Implement core turn-based combat system
- [x] **Implement Expanded Base Stats:** Add Strength, Intellect, Spirit to character base data structure and basic calculations. *(Dependency for Phase 4 Ability Scaling)*
- [x] Initial stat implementation & basic attack calculations
  - [x] Attack stat for auto-attacks
  - [x] Add variance to damage (±20%)
  - [x] Critical hit system (e.g., 10% chance, 1.5x damage)
  - [x] Miss chance system (e.g., 5% chance)
- [x] Initiative system based on speed stat
- [x] Basic type advantages/disadvantages implementation
- [x] Basic team synergy effects placeholder/concept
- [x] Ensure consistent 3v3 battles with fixed random opponent generation
- [x] Design Battle UI
  - [x] Health bars
  - [x] Character position indicators
  - [x] Basic ability cooldown displays (will be refined)
  - [x] Battle log with scrolling text & team identifiers
  - [x] Battle speed controls (1x, 2x, 4x)
  - [x] Pause/resume functionality
  - [x] Basic battle results screen (Victory/Defeat/Draw)

## Phase 3: Basic Animation and Visual Effects (Partially Completed)
- [x] Implement basic attack animations
  - [x] Movement-based animations (character moving toward target)
  - [x] Attack visual effects
  - [x] Impact visual effects
  - [x] Healing visual effects
- [x] Status effect indicators
  - [x] Poison/DoT effects (green particles)
  - [x] Stun effects (stars above head)
  - [ ] Frozen effect (ice block around character)
  - [x] Burning effect (fire particles)
  - [x] Buffed/Debuffed indicators (Basic implementation)
- [ ] Refine status effect visuals (Connect to new definitions in Phase 7)
- [ ] Create placeholders for unique ability visual effects

## Phase 4: Foundational Refactor & Data Overhaul
- [x] **Define Enhanced Ability Structure (JSON):** Formalize the detailed structure (`id`, `name`, `effects` array, behavior refs, etc.). *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 2- Part 1)*
- [x] **Define Status Effect Structure (JSON):** Formalize the structure (`id`, `name`, `behavior` object, etc.). *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 3)*
- [x] **Create `status_effects.json`:** Populate the external file with initial status effect definitions. *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 3)*
- [x] **Refactor `BattleManager` Core - Behavior Delegation:** Implement Strategy/Callback pattern foundation, registry, interfaces. *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 1)*
    - [x] Implement **Default** Behavior Functions (capturing current basic logic). *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 1)*
    - [x] Refactor key `BattleManager` methods (`generateCharacterAction`, etc.)
- [x] **Refactor Ability/Effect Logic Execution:**
    - [x] Update `calculateDamage` to use detailed effect data (scaling, types, mods) - **Implemented base stat scaling (STR/INT/SPI)**
    - [x] Update `applyActionEffect` to iterate through Ability `effects` array and apply outcomes. *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 2- Part 1)*
- [x] **Refactor Status Effect Handling:**
    - [x] Update `addStatusEffect` to create effect *instances* linked to definitions. *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 3)*
    * [x] Update `processStatusEffects` (and other checks) to read effect behavior dynamically from definitions. *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 3)*
- [x] **Update Core Data:** Convert existing `characters.json` data to use the new enhanced Ability structure and include initial Behavior Function references. *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 2- Part 1)*
    - [x] Added expanded base stats (STR/INT/SPI) to character data
    - [x] Added damageType to abilities
    - [x] Add effects array structure to abilities
    - [x] Add behavior function references

## Phase 5: Implementing Behaviors, Variance & Passives
- [x] **Implement Specific Behavior Functions:** Create functions for unique targeting, action decisions, passives. *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 1)*
- [x] **Implement Passive Ability System:** Add necessary hooks in `BattleManager`, ensure passive functions are called. *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 1 & Section 2- Part 1 for passiveTrigger)*
- [x] **Refine Ability Usage Control:** Assign specific `actionDecisionLogic`, `targetingLogic`, `selectionWeight` in data. *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 2- Part 2)*
- [ ] **Implement Mode-Specific Ability Access:** Add logic to check `ability.unlockLevel` conditionally based on game mode. *(Reference `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 2- Part 1 for unlockLevel)*

## Phase 6: Phaser Battle Scene Implementation (Current Focus)

- [ ] **Create Modular Component Architecture for Battle Scene**:
  - [ ] Implement component-based design as outlined in `C:\Personal\AutoBattler\Context\Battle_Implementation_Plan.md`
  - [ ] Create debug tools for battle scene development (coordinate display, object identification)
  - [ ] Develop battle-specific components in `/js/phaser/components/battle/`
  - [ ] Implement robust bridge between BattleManager and BattleScene

- [ ] **Character Visualization in Phaser**:
  - [ ] Create CharacterSprite component for visual representation
  - [ ] Implement HealthBar component with dynamic coloring
  - [ ] Develop StatusEffectDisplay for showing active effects
  - [ ] Add character positioning system with team-based layout
  - [ ] Build character art loading system leveraging existing knowledge

- [ ] **Battle Animation System**:
  - [ ] Implement attack animations with proper movement paths
  - [ ] Create ability effect animations with visual distinction
  - [ ] Develop FloatingText system for damage/healing numbers
  - [ ] Add status effect animations and transitions
  - [ ] Implement victory/defeat sequences

- [ ] **Phaser UI Components**:
  - [ ] Create BattleControls component (speed, pause, next turn)
  - [ ] Implement BattleLogDisplay with scrolling and formatting
  - [ ] Build tooltip system for abilities and status effects
  - [ ] Develop battle results screen with stats display

- [ ] **Arena System Implementation**:
  - [ ] Add background loading and rendering system
  - [ ] Implement arena selection with transition effects
  - [ ] Create visual environment effects for different arenas

- [ ] **Performance Optimization**:
  - [ ] Implement proper resource management and cleanup
  - [ ] Add performance monitoring for battle scenes
  - [ ] Optimize rendering for multiple simultaneous effects
  - [ ] Ensure smooth transitions between battle phases


## Phase 7: Character Progression System
- [ ] **Implement Persistent State:** Need system to store character level/XP between Campaign battles.
- [ ] **Implement XP Gain:** Award XP after Campaign battles (link to battle results screen).
- [ ] **Implement Leveling:** Logic for level calculation based on XP thresholds.
- [ ] **Implement Role-Based Stat Scaling:** Apply stat gains per level based on character role definitions. *(Depends on Phase 2 expanded stats)*
- [ ] **Implement UI for Progression:**
    - [ ] Display character level/XP on relevant screens (Team Builder, Roster).
    - [ ] Show locked/unlocked abilities with level requirements in Hero details/Team Builder. *(Uses unlockLevel from `C:\Personal\AutoBattler\GeminiSuggestions.md`, Section 2- Part 1)*
    - [ ] Level-up notifications/effects.

- [ ] **Implement Stat Handling for Modes:** Ensure Campaign uses leveled stats, while Random/Custom use appropriate stats (e.g., base stats or calculated max-level stats). *(Depends on Phase 2 expanded stats)*
## Phase 8: Art Integration and Phaser Visual Enhancement

- [ ] **Expand Phaser Sprite Sheets and Animations**:
  - [ ] Create frame-based animations for character actions (attack, cast, hurt)
  - [ ] Design specialized animations for unique character abilities
  - [ ] Implement character state animations (stun, freeze, burn)

- [ ] **Enhanced Particle Effect System**:
  - [ ] Create advanced particle effects for high-level abilities
  - [ ] Implement unique visual signatures for each character type
  - [ ] Design environmental particle effects for different arenas
- [ ] **Audio Integration with Phaser**:
  - [ ] Implement ability-specific sound effects
  - [ ] Create character-specific audio feedback
  - [ ] Add ambient sound effects for battle environments
  - [ ] Design dynamic audio system based on battle intensity
- [ ] Replace circle placeholders with character art (ongoing).
    - [ ] Design character sprites/portraits using AI generation.
    - [ ] Implement character animation sheets (idle, attack, hit, ability usage).
- [ ] Create unique ability visual effects (link to `animationKey` in Ability data & Phase 3 placeholders).
- [ ] Audio implementation
    - [ ] Background music.
    - [ ] Character-specific sound effects (link to data).
    - [ ] Ability sound effects (link to `soundEffectKey` in Ability data).
    - [ ] Refine UI sound effects.

- [ ] Overall polish
    - [ ] Transition effects between screens.
    - [ ] Loading screens.
    - [ ] Tutorial system.
    - [ ] Achievement system.
## Phase 9: Arena Development and Battle Environments with Phaser

- [ ] **Create Diverse Battle Arenas in Phaser**:
  - [ ] Design multiple arena backgrounds as Phaser image assets
  - [ ] Implement parallax scrolling for depth effect
  - [ ] Create arena-specific lighting and atmosphere

- [ ] **Arena Selection and Transition**:
  - [ ] Build arena selection interface with previews
  - [ ] Implement smooth scene transitions between arenas
  - [ ] Create loading and introduction sequences for each arena

- [ ] **Interactive Arena Elements**:
  - [ ] Implement arena hazards with visual and gameplay effects
  - [ ] Create arena-specific bonuses with particle feedback
  - [ ] Add environmental animations that respond to battle events

## Phase 10: Equipment and Inventory System
- [ ] Create item data structure (types, rarity, stats).
- [ ] Implement inventory management UI & logic.
- [ ] Implement character equipment slots & logic.
- [ ] Develop loot system (battle rewards).

## Phase 11: Content Expansion
- [ ] **Implement Campaign Mode Structure:**
    - [ ] Progressive difficulty battles map/system.
    - [ ] Boss encounters.
    - [ ] Narrative elements (basic story integration).
- [ ] Add Additional characters (10+).
- [ ] Add Challenge modes (Time trials, Survival, etc.).

## Phase 12: Testing and Balance (Ongoing throughout)
- [ ] Comprehensive game balance (Stats, Abilities, Scaling, Status Effects, Synergies, Progression, Items). *(Balance decisions informed by `C:\Personal\AutoBattler\GeminiSuggestions.md`, Sections 1, 2, 3)*
- [ ] Playtest sessions & Feedback incorporation.
- [ ] Bug Fixing.

## Future Considerations
- Multiplayer functionality
- Mobile adaptation
- Seasonal events and limited-time content
- PvP battles