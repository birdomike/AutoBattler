# Claude's Core System Reference for AutoBattler

> **PURPOSE OF THIS DOCUMENT:** This is the primary reference document for Claude to understand the AutoBattler game architecture and systems. It contains information about the core game systems, project structure, and development status. This document focuses on "what the system is" rather than implementation details. For guides on implementation, troubleshooting, and technical procedures, see the companion document "Claude_Implementation.md".

> When Claude needs to understand the game's core architecture, planned features, or current development status, this is the document to reference. This approach reduces token usage while providing focused context about the game's design and systems.
## Key Areas to Focus On
- Component-based architecture with specialized managers
- Phaser Battle Scene Implementation (modular component architecture)
- Enhanced Passive Ability System with dedicated components
- Battle event dispatching system
- Type effectiveness system (data-driven design)
- Defensive programming patterns throughout the codebase
- Project roadmap implementation status

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
│   └── Technical Changelogs/ # Detailed technical changelogs for each version
│
├── Context/                  # Documentation for understanding project architecture
│   ├── Battle_Implementation_Plan.md     # Phaser implementation strategy
│   ├── Claude_Core.md                     # This file - notes for Claude
│   ├── Lessons Learned.md                # Technical retrospectives
│   ├── Planning/                         # Architecture & refactoring plans
│   └── Version 1.0 Vision.md             # Target feature set and roadmap
│
├── data/                     # Game data
│   ├── characters.json       # Character definitions with stats and abilities
│   ├── status_effects.json   # Status effect definitions
│   └── type_effectiveness.json # Type relationship data (advantages/disadvantages/immunities)
│
├── examples/                 # Example code and implementations
│   ├── passive_character.json           # Sample passive ability character
│   └── PASSIVE_SYSTEM_IMPLEMENTATION.md # Passive system implementation guide
│
├── js/                       # JavaScript files
│   ├── battle_logic/         # Core battle system logic
│   │   ├── core/                   # Core battle system components
│   │   │   ├── BattleFlowController.js   # Controls turn flow and actions
│   │   │   └── BattleInitializer.js      # Handles battle setup and team initialization
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
│   │   ├── events/                 # Battle event system
│   │   │   ├── BattleEventDispatcher.js   # Centralizes event dispatching
│   │   │   └── BattleLogManager.js        # Battle log message formatting and display
│   │   ├── utilities/              # Utility components and functions
│   │   │   └── BattleUtilities.js         # Static utility methods
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
│   │   ├── BattleManager.js  # Orchestrates battle flow via component delegation
│   │   └── TeamManager.js    # Manages team composition
│   │
│   ├── phaser/               # Phaser integration 
│   │   ├── assets.js         # Asset management
│   │   ├── bridge/           # Communication between game logic and Phaser
│   │   │   ├── BattleBridge.js     # Bridge class for battle events
│   │   │   ├── BattleBridgeInit.js # Bridge initialization
│   │   │   └── BattleLogTester.js  # Utilities for testing log messages
│   │   │
│   │   ├── core/             # Core Phaser implementation components
│   │   │   ├── BattleAssetLoader.js   # Centralizes all asset loading for battle scene
│   │   │   └── BattleEventManager.js # Manages event listening and handling for BattleScene
│   │   │
│   │   ├── managers/         # Specialized Phaser managers
│   │   │   ├── BattleUIManager.js    # Manages UI components and HUD elements
│   │   │   ├── BattleFXManager.js    # Manages visual effects and animations
│   │   │   └── TeamDisplayManager.js # Manages team visualization and active indicators
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
│   │   │   │   ├── TeamContainer.js       # Container for team organization
│   │   │   │   └── TurnIndicator.js       # Visual indicator for active character turns
│   │   │   │
│   │   │   ├── Button.js             # Reusable button component
│   │   │   └── Panel.js              # Reusable panel component
│   │   │
│   │   ├── debug/            # Development and debugging tools
│   │   │   ├── CoordinateDisplay.js  # Grid and coordinate visualization
│   │   │   ├── DebugManager.js       # Debug toolset manager
│   │   │   ├── PhaserDebugManager.js # Centralized debug tool management
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
│   │   ├── TeamBuilderUI.js  # Team selection interface (orchestrator)
│   │   ├── TeamBuilderUIUpdates.js  # Updates for team builder
│   │   ├── TooltipManager.js # UI tooltip system
│   │   └── teambuilder/      # TeamBuilder component architecture 
│   │       ├── TeamBuilderUtils.js       # Shared utility functions
│   │       ├── HeroDetailPanelManager.js # Hero details panel component
│   │       ├── FilterManager.js          # Type/role filtering component
│   │       ├── HeroGridManager.js        # Hero grid display component
│   │       ├── TeamSlotsManager.js       # Team slot management component
│   │       ├── BattleModeManager.js      # Battle mode selection component
│   │       ├── BattleInitiator.js        # Battle initiation component
│   │       └── README.md                 # Component architecture documentation
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

1. Update the high-level changelog with a concise summary- Edit_File, do not Write file
2. Create a detailed technical changelog file if it's a significant version update
3. Reference the detailed changelog in the high-level entry with: `*Note: For detailed information on specific implementation steps, see CHANGELOG_X.X.X.md*`

This dual approach ensures both quick reference for general changes and detailed documentation for complex implementations.


# System Overview

## Core Game Systems

### Characters System
- Characters have: name, type, role, rarity, level, XP, and abilities
- Characters start at level 1 and can progress to level 20
- **Types**: Fire, Water, Nature, Electric, Ice, Rock, Metal, Air, Light, Dark, Psychic, Poison, Physical, Arcane, Mechanical, Void, Crystal, Storm, Ethereal, Blood, Plague, Gravity (with advantages/disadvantages and immunities)
- **Roles**: Warrior, Sentinel, Berserker, Ranger, Assassin, Bulwark, Mage, Invoker, Sorcerer, Summoner, Occultist, Mystic, Champion , Wildcaller , Striker, Emissary, Elementalist, Warden, Skirmisher, Battlemage, Venomancer, Trickster
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
- Characters are assigned unique IDs (`uniqueId`) upon creation via BattleInitializer
- **Source ID Linking Pattern**: Stores character IDs rather than direct object references
  - Prevents circular references in status effects and other systems
  - Enables proper attribution of damage/healing sources in the battle log
  - Critical for tracking effect sources across turns
- **ID Resolution**: BattleUtilities provides methods to resolve IDs back to character objects
  - `getCharacterByUniqueId(uniqueId, playerTeam, enemyTeam)`: Finds character by ID across both teams
  - Handles multiple source reference formats for backward compatibility
  - Includes defensive programming with proper error handling
- **Implementation**: 
  - Status effects store the source character's `uniqueId` when applied
  - When effects trigger (damage, healing), the source ID is resolved to the full character
  - Battle log uses the resolved character for proper message formatting
  - The pattern is used throughout damage, healing, and status effect systems
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

### Character ID Management System
- Characters are assigned unique IDs (`uniqueId`) upon creation via BattleInitializer
- **Source ID Linking Pattern**: Stores character IDs rather than direct object references
  - Prevents circular references in status effects and other systems
  - Enables proper attribution of damage/healing sources in the battle log
  - Critical for tracking effect sources across turns
- **ID Resolution**: BattleUtilities provides methods to resolve IDs back to character objects
  - `getCharacterByUniqueId(uniqueId, playerTeam, enemyTeam)`: Finds character by ID across both teams
  - Handles multiple source reference formats for backward compatibility
  - Includes defensive programming with proper error handling
- **Implementation**: 
  - Status effects store the source character's `uniqueId` when applied
  - When effects trigger (damage, healing), the source ID is resolved to the full character
  - Battle log uses the resolved character for proper message formatting
  - The pattern is used throughout damage, healing, and status effect systems

### Team Builder UI
- Implemented as vanilla JavaScript in `js/ui/TeamBuilderUI.js`
- Uses CSS for styling in `assets/css/style.css`
- Displays three panels: available heroes, team selection, and hero details
- Allows selecting heroes, viewing their details, and building a team
- Supports three battle modes: Random, Custom, and Campaign
- Custom Battle mode lets players select both their team and their opponent's team
- Enhanced to show expanded stat system (STR, INT, SPI) in detail view

## Current Implementation Status
- **Refactoring Progress**: 
  - **BattleManager Refactoring**: Completed with specialized component managers
    - All components implemented: StatusEffectManager, BattleFlowController, DamageCalculator, HealingProcessor, TypeEffectivenessCalculator, AbilityProcessor, TargetingSystem, ActionGenerator, PassiveTriggerTracker, PassiveAbilityManager, BattleEventDispatcher, BattleLogManager, BattleInitializer, BattleUtilities
    - Architecture has shifted from monolithic BattleManager to specialized component managers
    - BattleManager now serves as a thin orchestration layer that delegates to specialized components
 - **BattleScene Refactoring**: In progress (Phase 4 of 7 underway)
  - Phase 1 Complete: Extracted `BattleEventManager` for handling all event listening and handling
  - Phase 2 Complete: Extracted `BattleUIManager` for UI creation and management
  - Phase 3 Complete: Extracted `TeamDisplayManager` for team visual management
  - Phase 4 In Progress: Extracting `BattleAssetLoader` for asset loading management
    - Stage 1 Complete: Extracted UI asset loading (0.6.4.0, 0.6.4.1)
    - Stage 2 Complete: Extracted character asset loading (0.6.4.2)
    - Stage 3 Complete: Extracted status effect icon loading (0.6.4.3, 0.6.4.4)
    - Stage 4 Planned: Create unified asset loading interface
  - Remaining phases (Visual Effects, Debug Tools, Final Cleanup) pending

- Team Builder UI is fully functional with hero selection, team building, and custom battles (DOM-based)
- Phaser Battle Scene development continuing with modular component architecture
- Previous DOM-based Battle UI is being replaced with a Phaser-based implementation
- Expanded base stats system (STR, INT, SPI) fully implemented
- Character progression system (leveling, ability unlocking) not yet implemented
- Character art implemented for all characters with optimized battle versions
- Core data structures and classes are defined and working
- Initiative/speed system implemented for turn-based combat
- Type advantages and status effects are functional with data-driven implementation


### Defensive Programming Patterns
- The codebase uses consistent defensive programming patterns throughout components:
  - Component availability checks before calling methods
  - Parameter validation at the beginning of methods
  - Graceful fallbacks when dependencies are unavailable
  - Clear error messages with component context ([ComponentName])
  - Proper handling of circular references
  - Safe defaults for missing or invalid parameters
  - Early returns for invalid input states
