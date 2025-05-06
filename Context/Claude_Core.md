# Claude's Core System Reference for AutoBattler

> **PURPOSE OF THIS DOCUMENT:** This is the primary reference document for Claude to understand the AutoBattler game architecture and systems. It contains information about the core game systems, project structure, and development status. This document focuses on "what the system is" rather than implementation details. For guides on implementation, troubleshooting, and technical procedures, see the companion document "Claude_Implementation.md".

> When Claude needs to understand the game's core architecture, planned features, or current development status, this is the document to reference. This approach reduces token usage while providing focused context about the game's design and systems.
## Key Areas to Focus On
- BattleManager Refactoring (current focus: component-based architecture with specialized managers)
- Phaser Battle Scene Implementation (modular component architecture)
- Enhanced Passive Ability System (recently improved with component-based implementation)
- Battle Flow Control (extracted to dedicated BattleFlowController)
- Damage and Healing System (extracted to specialized components)
- Battle Events and Validation patterns
- Project roadmap implementation status (see DEVELOPMENT_PLAN.md)

## Game Concept
This is an autobattler game where players select teams of characters that fight automatically against opponent teams. The core appeal is in team building, strategic selection of characters, and watching the battles unfold with some randomness. Characters will gain XP, level up, and unlock new abilities as they progress.

## Project Structure
```
C:\Personal\AutoBattler\
│
├── assets/                   # All game assets
│   ├── images/               # Game images and sprites
│   │   ├── Arena Art/        # Battle arena backgrounds (12 unique arenas)
│   │   ├── Character Art/    # Character artwork
│   │   │   └── Combat_Version/ # Battle-optimized (80x120px) character sprites
│   │   └── icons/            # UI and status effect icons
│   │       └── status/       # Status effect icons
│   │           └── status-icons/  # 25 status effect icon images
│   ├── css/                  # CSS stylesheets with UI styling
│   └── audio/                # Sound effects and music
│       └── InCombat_Sounds/  # Battle sound effects (75+ sound files)
│
├── Changelogs/               # Version history documentation
│   ├── changelog.md          # High-level changelog (main file)
│   └── CHANGELOG_X.X.X.md    # Detailed technical changelogs for each version
│
├── Context/                  # Documentation for understanding project architecture
│   ├── Battle_Implementation_Plan.md     # Phaser implementation strategy
│   ├── Claude.md                         # This file - notes for Claude
│   ├── Lessons Learned.md                # Technical retrospectives
│   └── Version 1.0 Vision.md             # Target feature set and roadmap
│
├── data/                     # Game data
│   ├── characters.json       # Character definitions with stats and abilities
│   ├── abilities.json        # Ability definitions
│   ├── status_effects/       # Status effect definitions directory
│   └── status_effects.json   # Main status effect definitions
│
├── examples/                 # Example code and implementations
│   ├── passive_character.json           # Sample passive ability character
│   └── PASSIVE_SYSTEM_IMPLEMENTATION.md # Passive system implementation guide
│
├── js/                       # JavaScript files
│   ├── battle_logic/         # Core battle system logic
│   │   ├── core/                   # Core battle system components
│   │   │   ├── BattleFlowController.js   # Controls turn flow and actions
│   │   │   └── BattleInitializer.js      # Handles battle setup
│   │   ├── status/                 # Status effect components
│   │   │   ├── StatusEffectManager.js     # Status effect application/processing
│   │   │   └── StatusEffectDefinitionLoader.js  # Loads effect definitions
│   │   ├── damage/                 # Damage calculation components
│   │   │   ├── DamageCalculator.js        # Calculates damage with stat scaling
│   │   │   ├── HealingProcessor.js        # Handles healing calculations
│   │   │   └── TypeEffectivenessCalculator.js  # Calculates type advantages
│   │   ├── abilities/              # Ability system components
│   │   │   ├── AbilityProcessor.js        # Processes ability effects
│   │   │   ├── TargetingSystem.js         # Handles ability targeting
│   │   │   └── ActionGenerator.js         # Generates character actions
│   │   ├── passives/               # Passive ability components
│   │   │   ├── PassiveAbilityManager.js   # Processes passive abilities
│   │   │   └── PassiveTriggerTracker.js   # Tracks passive triggers per turn/battle
│   │   ├── events/                 # Battle event system (planned)
│   │   │   ├── BattleEventDispatcher.js   # Event dispatching (not implemented)
│   │   │   └── BattleLogManager.js        # Battle log messaging (not implemented)
│   │   ├── BattleBehaviors.js      # Behavior system for battle actions
│   │   ├── BehaviorRegistry.js     # Registry of all available behaviors
│   │   ├── ActionDecisionBehaviors.js # Logic for choosing actions
│   │   ├── TargetingBehaviors.js   # Logic for selecting targets
│   │   ├── PassiveBehaviors.js     # Passive ability implementation
│   │   └── fallback/               # Fallback behaviors directory
│   │
│   ├── entities/             # Character classes and entities
│   │   ├── Character.js      # Base character class
│   │   └── Ability.js        # Abilities system
│   │
│   ├── managers/             # Game managers
│   │   ├── BattleManager.js  # Manages battle state and flow
│   │   ├── BattleManager.js.hotfix  # Hotfix file for battle manager
│   │   ├── BattleManager.js.updates  # Updates for battle manager
│   │   └── TeamManager.js    # Manages team composition
│   │
│   ├── phaser/               # Phaser integration 
│   │   ├── assets.js         # Asset management
│   │   ├── bridge/           # Communication between game logic and Phaser
│   │   │   ├── BattleBridge.js     # Bridge class for battle events
│   │   │   ├── BattleBridgeInit.js # Bridge initialization
│   │   │   └── BattleLogTester.js  # Utilities for testing log messages
│   │   │
│   │   ├── audio/            # Phaser audio implementation
│   │   │   └── PhaserSoundManager.js  # Sound system for Phaser
│   │   │
│   │   ├── components/       # Reusable UI components
│   │   │   ├── battle/             # Battle-specific components
│   │   │   │   ├── BattleControlPanel.js  # Battle controls (speed, pause, etc.)
│   │   │   │   ├── BattleLogPanel.js      # Original panel-based battle log
│   │   │   │   ├── CharacterSprite.js     # Individual character sprites
│   │   │   │   ├── DirectBattleLog.js     # Simplified direct text battle log
│   │   │   │   └── TeamContainer.js       # Container for team organization
│   │   │   │
│   │   │   ├── Button.js             # Reusable button component
│   │   │   └── Panel.js              # Reusable panel component
│   │   │
│   │   ├── debug/            # Development and debugging tools
│   │   │   ├── CoordinateDisplay.js  # Grid and coordinate visualization
│   │   │   ├── DebugManager.js       # Debug toolset manager
│   │   │   └── ObjectIdentifier.js   # Object inspection utilities
│   │   │
│   │   ├── scenes/           # Phaser scene definitions
│   │   │   ├── BattleScene.js       # Main battle scene
│   │   │   ├── BootScene.js         # Initial loading scene
│   │   │   └── TeamBuilderScene.js  # Future Phaser team builder (not implemented)
│   │   │   
│   │   ├── config.js         # Bridge configuration
│   │   ├── PhaserConfig.js   # Phaser initialization config
│   │   └── uiManager.js      # UI mode management (DOM vs Phaser)
│   │
│   ├── ui/                   # UI components (DOM-based)
│   │   ├── BattleUI.js       # Original DOM-based battle interface
│   │   ├── BattleUIDebug.js  # Debug utilities for battle UI
│   │   ├── SoundManager.js   # Audio system management
│   │   ├── TeamBuilderUI.js  # Team selection interface
│   │   ├── TeamBuilderUIUpdates.js  # Updates for team builder
│   │   └── TooltipManager.js # UI tooltip system
│   │
│   ├── utilities/            # Utility functions and helpers
│   │   ├── DirectImageLoader.js       # Handles image loading for Battle UI
│   │   ├── ImageDebugger.js           # Debugging tools for images
│   │   └── TeamBuilderImageLoader.js  # Handles image loading for Team Builder UI
│   │
│   └── game.js               # Main game initialization
│
├── lib/                      # Third-party libraries
│   ├── phaser-download-instructions.md  # Instructions for updating Phaser
│   └── phaser.min.js         # Phaser.js library
│
├── _CombinedForAI/          # Utilities for AI assistance
│   ├── Changelogs.txt        # Combined changelog text
│   ├── CombineforAI_Tool.ps1 # Script to combine files for AI analysis
│   ├── ContextDocs.txt       # Combined context documentation
│   ├── Data_Examples.txt     # Sample data structures
│   ├── FolderStructure.txt   # Directory structure info
│   ├── Get_FileStructure_ofGame.ps1 # Script to generate folder structure
│   ├── JS_BattleLogic.txt    # Combined battle logic code
│   ├── JS_Core.txt           # Combined core game code
│   ├── JS_Managers.txt       # Combined manager code
│   ├── JS_Phaser.txt         # Combined Phaser implementation code
│   └── JS_UI.txt             # Combined UI code
│
├── Development_Plan.md       # Original development roadmap
├── Role Base Stat Template.md     # Template for character stat distribution
├── Role Based Stat Multipliers.md # Stat growth rates for different roles
├── Role Chart.md                  # Details on character roles and specializations
├── Type Chart.md                  # Information on elemental types
├── Type Effectiveness Table.md    # Type advantage and weakness relationships
├── GeminiSuggestions.md      # AI-generated suggestions for game systems
├── project.config            # Phaser project configuration
├── index.html                # Main game HTML file
├── test_battle_log.html      # Battle log testing page
├── patch_notes.md            # Simplified patch notes
└── README.md                 # General project readme
```

## Changelog Documentation System

The game uses a two-level changelog system to track version history:

1. **High-Level Changelog** (`C:\Personal\AutoBattler\Changelogs\changelog.md`):
   - Contains concise summaries of changes for each version
   - Organized by version number and date
   - Categories include: Added, Changed, Fixed, Improved, Technical
   - Intended for quick reference and overview of changes

2. **Detailed Technical Changelogs** (`C:\Personal\AutoBattler\Changelogs\Technical Changelogs\CHANGELOG_X.X.X_SummaryNameofChange.md`):
   - One file per version (e.g., `CHANGELOG_0.4.3.md`)
   - Contains in-depth technical details about implementation
   - Includes code snippets, before/after comparisons
   - Documents problem analysis and solution approach
   - Provides context for why changes were made
   - Useful for developers who need to understand specific implementations

### When Making Changes

When implementing changes to the game:

1. Update the high-level changelog with a concise summary
2. Create a detailed technical changelog file if it's a significant version update
3. Reference the detailed changelog in the high-level entry with: `*Note: For detailed information on specific implementation steps, see CHANGELOG_X.X.X.md*`

This dual approach ensures both quick reference for general changes and detailed documentation for complex implementations.


# System Overview

## Core Game Systems

### Characters System
- Characters have: name, type, role, rarity, level, XP, and abilities
- Characters start at level 1 and can progress to level 20
- **Types**: Fire, Water, Nature, Electric, Ice, Rock, Metal, Air, Light, Dark, Psychic, Poison, Physical, Arcane, Mechanical, Void, Crystal, Storm, Ethereal, Blood, Plague, Gravity (with advantages/disadvantages and immunities)
- **Roles**: Warrior, Sentinel (formerly Knight), Berserker, Ranger, Assassin, Bulwark (formerly Guardian), Mage, Invoker, Sorcerer, Summoner, Occultist (formerly Necromancer), Mystic (formerly Cleric), Champion (formerly Paladin), Wildcaller (formerly Druid), Striker (formerly Monk), Emissary (formerly Bard), Elementalist (formerly Shaman), Warden, Skirmisher, Battlemage, Venomancer, Trickster
- Team synergies based on having multiple characters of same type/role
- **Stats**:
  - HP: Health points
  - Attack: Power of auto-attacks
  - Defense: Damage reduction
  - Speed: Determines turn order
  - Strength: Enhances physical ability damage
  - Intellect: Enhances spell ability damage
  - Spirit: Enhances healing effectiveness

### Battle System
- Turn-based auto-battle with initiative/speed system (fastest characters act first)
- **Core Architecture**:
  - Refactored to a component-based system with specialized managers
  - Clear separation of concerns with dedicated components for:
    - Battle flow control (BattleFlowController)
    - Damage calculation (DamageCalculator)
    - Status effects (StatusEffectManager)
    - Healing (HealingProcessor)
    - Passive abilities (PassiveAbilityManager and PassiveTriggerTracker)
    - Targeting (TargetingSystem)
    - Action generation (ActionGenerator)
  - BattleManager acts as a façade and coordinator for these components
- **Battle Visualization Evolution**:
  - Original Battle UI: DOM-based implementation with Tailwind CSS
  - Current approach: Phaser-based Battle Scene with modular component architecture
  - Based on lessons from previous Phaser integration attempts (see `C:\Personal\AutoBattler\Context\Lessons Learned.md`)
- **Combat features**:
  - Type advantages/disadvantages system affecting damage
  - Abilities with cooldowns and effects
  - Status effects (burn, stun, regen, etc.)
  - Critical hit (10%) and miss chance (5%) systems
  - Damage variance (±20%)
  - Auto-attacks and special abilities
  - Ability damage scaling with Strength/Intellect/Spirit stats
- **Battle UI includes**:
  - Circle-based character representations with type-specific colors
  - Health bars with dynamic coloring based on remaining health
  - Status effect indicators with tooltips
  - Battle log with detailed information and team identifiers
  - Movement animations for attacks with directional awareness
  - Floating damage/healing numbers
  - Battle controls (speed, pause, next turn)
  - Battle results screen (victory/defeat/draw)

### Expanded Base Stats System
- Implemented a new stat system beyond the basic HP, Attack, Defense stats:
  - **Strength:** Increases physical ability damage (50% scaling)
  - **Intellect:** Increases spell ability damage (50% scaling)
  - **Spirit:** Increases healing effectiveness (50% scaling)
- Added `damageType` property to abilities which determines stat scaling:
  - `"physical"` - Scales with Strength
  - `"spell"` - Scales with Intellect
  - `"healing"` - Scales with Spirit
  - `"utility"` - Effects scale with Spirit, but doesn't deal direct damage
- **Role-specific stat distributions**:
  - Each character has 325 total stat points distributed according to their role
  - Mages have high Intellect, Warriors have high Strength, Clerics have high Spirit
- **Battle calculations**:
  - Physical damage: `base_damage + (strength * 0.5)`
  - Spell damage: `base_damage + (intellect * 0.5)`
  - Healing: `base_healing + (spirit * 0.5)`
- **UI Display**:
  - Added second row of stats in Hero Details panel
  - Enhanced ability tooltips with detailed scaling formulas
  - Battle log shows scaling contributions (e.g., "+73 from Intellect")

### Passive Ability System
- Characters can have special passive abilities that trigger automatically in response to battle events
- **System Architecture**:
  - **PassiveAbilityManager**: Handles execution and processing of passive abilities
  - **PassiveTriggerTracker**: Tracks which passives have triggered during a turn or battle
  - **PassiveBehaviors.js**: Contains behavior functions for different passive abilities
- **Trigger Types**:
  - `onBattleStart`: Triggered when battle begins (team buffs, preparation effects)
  - `onTurnStart`: Triggered at the start of each turn (regeneration, periodic effects)
  - `onDamageTaken`: Triggered when character takes damage (counter, reflect, defensive reactions)
  - `onDamageDealt`: Triggered when character deals damage (vampiric effects, bonus effects)
  - `onHealed`: Triggered when character is healed (bonus health, amplification)
  - `onHealingDone`: Triggered when character heals someone (bonus healing, secondary effects)
  - `onKill`: Triggered when character defeats an enemy (bonus stats, special effects)
  - `onDefeat`: Triggered when character is defeated (death effects, revenge)
- **Key Components**:
  - **PassiveBehaviors.js**: Contains behavior functions for different passive abilities
  - `passiveTrigger`: Property on abilities defining when they trigger (corresponds to trigger types)
  - `passiveBehavior`: Property on abilities referencing which behavior function to use
  - `passiveData`: Optional configuration object to customize passive behavior
- **Visual Feedback**: 
  - Purple text notification appears above character when passive triggers
  - Glowing effect surrounds character briefly
  - Displays the name or effect of the passive ability that triggered
- **Implementation**: 
  - Added in version 0.4.4.3 with basic functionality
  - Enhanced in version 0.4.4.6 with reflection depth tracking and battle-level tracking
  - Further enhanced in version 0.4.4.7 with advanced behaviors and visual feedback
- **Advanced Passive Behaviors**:
  - `passive_OnKillEffect`: Triggers effects (healing, buffs, AoE damage) when killing enemies
  - `passive_CriticalHitBoost`: Increases critical hit chance after specific battle events
  - `passive_StatusOnHit`: Chance to apply status effects to targets when dealing damage
  - `passive_DamageReflectOnHit`: Returns portion of damage back to attacker
  - `passive_TeamBuffOnBattleStart`: Provides buffs to allies at battle start
- **Example Implementation**:
  ```json
  {
    "id": "character_bloodthirst",
    "name": "Bloodthirst",
    "description": "Heals for 10% of max HP when defeating an enemy",
    "abilityType": "Passive",
    "passiveTrigger": "onKill",
    "passiveBehavior": "passive_OnKillEffect",
    "passiveData": {
      "effectType": "heal",
      "value": 0.1
    }
  }
  ```

### Character Art System
- **Image Loaders:** Two main systems handle character art:
  1. `TeamBuilderImageLoader.js` - For Team Builder UI with advanced caching
  2. `DirectImageLoader.js` - For Battle UI with animation support
- **Multi-Resolution System:**
  - High-resolution original art: Used in TeamBuilder UI
  - Optimized 80x120px battle sprites: Used in Battle Scene (under `Combat_Version/` folder)
  - Pre-sized sprites eliminate WebGL scaling artifacts and pixelation
- **Global Caching:** Uses `window.CHARACTER_IMAGE_CACHE` object to store loaded images
- **Positioning System:** Character art settings in `characters.json`:
  ```json
  "art": {                    // Default art positioning for Battle UI
    "left": "-12px",         // Horizontal positioning
    "top": "-52px",          // Vertical positioning
    "width": "80px",          // Optional width override
    "height": "120px"         // Optional height override
  },
  "teamBuilderArt": {...},   // Optional separate positioning for Team Builder UI
  "detailArt": {...}         // Optional separate positioning for Detail View
  ```
- **Animation System:** Character art follows characters during attack animations using a cloning system
  - Creates a clone of the character for movement
  - Hides original character during animation
  - Recent issue fixed: Characters would briefly display incorrect art during animations
  - Fix implemented in v0.3.4: Improved clone creation and added protection system to prevent DirectImageLoader interference
- **Key Files for Character Art:**
  - `BattleUI.js` - `showAttackAnimation()` method (contains animation logic)
  - `DirectImageLoader.js` - Battle UI image injection
  - `TeamBuilderImageLoader.js` - Team Builder image loading 
- **MutationObserver System for Art Loading**:
  - Only watches specific containers that recycle DOM (#heroes-grid, #team-slots)
  - Uses data attributes to track state and prevent redundant processing
  - Provides early-exit conditions for elements that already have art
  - Uses requestAnimationFrame throttling for performance

### Team Builder UI
- Implemented as vanilla JavaScript in `js/ui/TeamBuilderUI.js`
- Uses CSS for styling in `assets/css/style.css`
- Displays three panels: available heroes, team selection, and hero details
- Allows selecting heroes, viewing their details, and building a team
- Supports three battle modes: Random, Custom, and Campaign
- Custom Battle mode lets players select both their team and their opponent's team
- Enhanced to show expanded stat system (STR, INT, SPI) in detail view

## Planned Systems

### Character Progression System (To be implemented)
- Characters gain XP from battles
- Each level requires progressively more XP
- Characters unlock additional abilities as they level up:
  - Level 1: One default ability
  - Level 5: Second ability unlocked
  - Level 10: Third ability unlocked
  - Level 15: Fourth ability unlocked
- All characters have a default auto-attack regardless of level
- UI will display locked abilities with level requirements

### Role-Based Stat Growth (To be implemented)
- Each role has unique stat growth multipliers applied per level
- Stats are distributed across Attack, Health, Strength, Intellect, and Spirit
- Each role gets a total of 5.0 stat points per level spread across all stats
- Roles are specialized with distinct archetypes:
  - **Physical Damage Dealers**:
    - Warriors (Pure melee DPS-tank): High ATK/HP/STR (1.5/1.8/1.5)
    - Berserkers (All-in bruiser): Very high ATK/STR (1.8/1.7)
    - Rangers (Ranged glass cannon): Very high ATK/STR (1.7/1.9)
    - Assassins (Burst finisher): Highest ATK/STR (1.9/1.9)
  - **Tank Specialists**:
    - Sentinels (Shielded striker): Highest HP with good STR (2.0/1.8)
    - Bulwarks (Pure tank): Extreme HP with good STR (2.3/1.7)
    - Wardens (Counter-tank/Disruptor): Very high HP (2.0)
  - **Spell Casters**:
    - Mages (Pure spell DPS): Very high INT with some SPI (2.4/0.8)
    - Invokers (Supportive magic amplifier): Extreme INT (2.8) 
    - Sorcerers (High-risk nuker): Extreme INT (2.8)
  - **Healing/Support**:
    - Mystics (Pure healer): Extreme SPI (2.5) 
    - Champions (Tank-healer): Good HP with balanced stats (1.6 HP)
    - Emissaries (Buffer/debuffer): High SPI (1.4)
  - **Hybrid/Specialized**:
    - Battlemages (Melee-caster): Balanced ATK/HP/STR/INT (1.3/1.4/1.3/1.4)
    - Wildcallers (Nature hybrid): Balanced across all stats
    - Venomancers (DoT specialist): High INT/SPI (1.8/1.2)
    - Tricksters (Chaos/RNG): High SPI (1.5) with balanced other stats

### Type Effectiveness System
- Comprehensive type advantage/disadvantage system with 22 different types
- Each type has specific strengths (does +50% damage) and weaknesses (does -50% damage)
- Some types have immunities (e.g., Metal is immune to Poison, Physical cannot damage Ethereal)
- Special interactions exist (e.g., Ethereal takes 3x damage from Light)
- Example relationships:
  - Fire is strong against Nature, Ice, and Metal but weak against Water and Rock
  - Water is strong against Fire, Rock, and Metal but weak against Nature and Electric
  - Light and Dark are opposing forces (strong against each other)
  - Arcane is strong against itself and Nature
  - Ethereal is immune to physical auto-attacks but very vulnerable to Light
  - Mechanical types are strong against Arcane and Poison
  - Void excels against Light and Psychic types

### Arena System (Planned)
- Multiple battle environments with distinct visual styles
- Weather effects (rain, snow, fog) affecting battle conditions
- Time of day variations (day, night, dusk)
- Arena-specific bonuses for certain character types
- Environmental hazards and obstacles
- Arena selection interface before battles

### Equipment System (Planned)
- Characters can equip items that enhance their stats
- Different item types (weapons, armor, accessories)
- Item rarity system affecting bonus strength
- Loot drops from battles
- Inventory management interface

## Current Implementation Status
- **Refactoring Progress**: Major BattleManager refactoring underway (Stage 6 of 8 complete)
  - Completed components: StatusEffectManager, BattleFlowController, DamageCalculator, HealingProcessor, TypeEffectivenessCalculator, AbilityProcessor, TargetingSystem, ActionGenerator, PassiveTriggerTracker, PassiveAbilityManager
  - Remaining components: BattleEventDispatcher, BattleLogManager
  - Architecture has shifted from monolithic BattleManager to specialized component managers
- Team Builder UI is fully functional with hero selection, team building, and custom battles (DOM-based)
- Phaser Battle Scene development continuing with modular component architecture
- Previous DOM-based Battle UI is being replaced with a Phaser-based implementation
- Expanded base stats system (STR, INT, SPI) fully implemented
- Character progression system (leveling, ability unlocking) not yet implemented
- Character art implemented for all characters with optimized battle versions
- Core data structures and classes are defined and working
- Initiative/speed system implemented for turn-based combat
- Type advantages and status effects are functional
- Implementation plan documented in `C:\Personal\AutoBattler\Context\Battle_Implementation_Plan.md`
- Detailed refactoring plan in `C:\Personal\AutoBattler\Context\BattleManager_Refactoring_Plan_Big Picture.md`

---