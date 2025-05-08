# AutoBattler Game: How It All Works Together

This document explains how the different components of the AutoBattler game interact with each other, written in understandable terms and with references to specific files where helpful.

This document explains how the different components of the AutoBattler game interact with each other, written in understandable terms and with references to specific files where helpful.

## Core Game Architecture

The AutoBattler game uses a **Model-View-Controller (MVC)** pattern:

- **Model**: Data files (JSON) and core entities (Character, Ability classes)
- **View**: UI components (TeamBuilder UI, Battle UI - both DOM and Phaser-based)
- **Controller**: Component-based architecture with specialized managers coordinated by BattleManager

The architecture has evolved into a component-based system with clear separation of responsibilities.

### Startup Flow

1. When the game loads in the browser, `index.html` includes all necessary JavaScript files
2. `game.js` initializes the game when the window loads
3. The TeamBuilder UI is displayed first, where players select characters
4. When a battle starts, either the DOM-based BattleUI or Phaser-based BattleScene is shown

## Data Management

### Data Sources

The game uses JSON files to store game data:

- `data/characters.json`: Contains all character definitions with stats and abilities
- `data/status_effects.json`: Defines status effects like stun, burn, etc.
- `data/type_effectiveness.json`: Defines type relationships (advantages, disadvantages, immunities, and special cases)

**Note**: While there is an `abilities.json` file in the data directory, it is defunct and not used by the game. All ability data is directly embedded within each character's definition in `characters.json`.

These files are loaded once at startup and provide the foundation for all game entities.

### Entity Classes

Two key entity classes transform the raw JSON data into usable game objects:

- `Character.js`: Creates character objects with methods for taking damage, healing, etc. Also parses and stores the character's embedded abilities.
- `Ability.js`: Handles ability usage, cooldowns, and effects using the ability data extracted from characters.json

Example of data flow:
```
JSON character data (including embedded abilities) → Character object → Added to team → Displayed in UI → Used in battle
```

## Manager Classes - The "Brains" of the Game

### TeamManager (`js/managers/TeamManager.js`)

**Purpose**: Handles everything related to character teams.

**Responsibilities**:
- Creating player and enemy teams
- Storing selected characters
- Generating random enemy teams
- Team validation and balancing

**Key Methods**:
- `createTeam()`: Creates a team from selected character IDs
- `generateEnemyTeam()`: Creates a balanced enemy team
- `getTeam()`: Returns the current player or enemy team

### BattleManager (`js/managers/BattleManager.js`)

**Purpose**: Orchestrates battle processes by delegating to specialized components.

**Responsibilities**:
- Coordinating specialized component managers
- Maintaining references to all components
- Managing core battle state (active/paused/speed)
- Providing facade methods for other systems to interact with battle logic

**Key Methods**:
- `startBattle()`: Delegates to BattleInitializer and BattleFlowController
- `initializeComponentManagers()`: Sets up all component managers
- `setSpeed()`: Adjusts battle animation speed
- `togglePause()`, `pauseBattle()`, `resumeBattle()`: Control battle flow
- Multiple facade methods that delegate to specialized components

## Specialized Component Managers

The game has been refactored to use specialized component managers for specific responsibilities:

### BattleFlowController (`js/battle_logic/core/BattleFlowController.js`)

**Purpose**: Controls the sequence and flow of battle.

**Responsibilities**:
- Managing turn progression
- Handling action execution
- Checking battle end conditions
- Coordinating other components during battle flow

**Key Methods**:
- `startBattle()`: Initializes battle state
- `startNextTurn()`: Processes turn start and prepares actions
- `executeNextAction()`: Processes the next queued action
- `finishTurn()`: Handles end-of-turn effects
- `checkBattleEnd()`: Determines if battle is over

### BattleInitializer (`js/battle_logic/core/BattleInitializer.js`)

**Purpose**: Handles team and character initialization for battle.

**Responsibilities**:
- Preparing team data for battle with comprehensive validation
- Generating unique character IDs for proper reference tracking
- Initializing character stats with default values when needed
- Ensuring all required character properties exist
- Identifying and separating passive abilities for quick reference
- Resetting passive tracking at battle start

**Key Methods**:
- `initializeTeamsAndCharacters()`: Sets up both teams at once
- `ensureCompleteCharacterInitialization()`: Performs comprehensive character validation and initialization
- `prepareTeamForBattle()`: Prepares a single team with battle-specific properties
- `generateCharacterId()`: Creates unique IDs for characters

**Implementation Features**:
- Deep cloning of team data to prevent reference issues (via JSON parse/stringify)
- Comprehensive validation of all character properties
- Default value generation for missing properties (HP, stats, names)
- Unique ID generation that incorporates team type, character name, and random values
- Separate tracking for passive abilities to improve performance
- Detailed logging of initialization process for debugging
- Filtering of invalid characters to prevent runtime errors

### StatusEffectManager (`js/battle_logic/status/StatusEffectManager.js`)

**Purpose**: Manages status effect application and processing.

**Responsibilities**:
- Applying status effects to characters
- Processing effects at turn start
- Managing effect stacking and expiration

**Key Methods**:
- `addStatusEffect()`: Applies a status effect
- `processStatusEffects()`: Processes effects at turn start
- `updateStatusIcons()`: Updates UI for status effects

### DamageCalculator (`js/battle_logic/damage/DamageCalculator.js`)

**Purpose**: Calculates and applies damage.

**Responsibilities**:
- Calculating damage amounts
- Applying type effectiveness
- Handling critical hits and variance

**Key Methods**:
- `calculateDamage()`: Determines damage amount
- `applyDamage()`: Applies damage to characters

### HealingProcessor (`js/battle_logic/damage/HealingProcessor.js`)

**Purpose**: Handles healing calculations and application.

**Responsibilities**:
- Calculating healing amounts
- Applying healing to characters
- Processing resurrection logic

**Key Methods**:
- `applyHealing()`: Applies healing to characters
- `checkAndResetDeathStatus()`: Handles resurrection

### AbilityProcessor (`js/battle_logic/abilities/AbilityProcessor.js`)

**Purpose**: Processes ability effects and manages ability state.

**Responsibilities**:
- Executing ability effects
- Managing ability cooldowns
- Applying effects to targets

**Key Methods**:
- `processEffect()`: Processes a single effect
- `applyActionEffect()`: Applies all effects from an action

### PassiveAbilityManager (`js/battle_logic/passives/PassiveAbilityManager.js`)

**Purpose**: Manages passive ability execution.

**Responsibilities**:
- Processing passive abilities when triggers occur
- Executing passive behaviors through behavior system
- Validating characters before passive processing
- Tracking passive trigger stacks and limits
- Coordinating with PassiveTriggerTracker for state management
- Creating properly formatted log messages for passive activations

**Key Methods**:
- `processPassiveAbilities()`: Main entry point that handles passive ability activation
- `validateCharacter()`: Comprehensive validation of character data before processing
- `canTriggerPassive()`: Determines if a passive ability can trigger based on conditions
- `executePassiveBehavior()`: Executes passive effects through behavior system
- `logPassiveActivation()`: Creates properly formatted log messages with team identifiers
- `getPassivesByTriggerType()`: Retrieves all passives matching a specific trigger type

**Implementation Features**:
- Comprehensive character validation with detailed error messages
- Defensive checks for all required component dependencies
- Max stacks tracking for limiting passive triggers
- Team-aware log messages with proper identifiers
- Detailed debug logging throughout the processing pipeline

### BattleEventDispatcher (`js/battle_logic/events/BattleEventDispatcher.js`)

**Purpose**: Centralizes event dispatching across the battle system.

**Responsibilities**:
- Standardizing event formatting and property naming
- Ensuring events reach proper listeners
- Providing specialized event dispatching methods for different event types
- Handling event validation and error recovery
- Supporting custom event listeners beyond BattleBridge

**Key Methods**:
- `dispatchEvent()`: Core method that sends events to listeners
- `dispatchCharacterDamagedEvent()`: Specialized method for damage events with standardized data
- `dispatchCharacterHealedEvent()`: Specialized method for healing events
- `dispatchPassiveTriggeredEvent()`: Specialized method for passive ability triggers
- `dispatchBattleEndedEvent()`: Handles battle conclusion events
- `dispatchStatusEffectAppliedEvent()`: Handles status effect application
- `addEventHandler()`: Registers custom event listeners
- `removeEventHandler()`: Unregisters custom event listeners
- `notifyListeners()`: Notifies all registered listeners for an event type

**Implementation Features**:
- Comprehensive parameter validation for all event types
- Fallback event types when BattleBridge is unavailable
- Try-catch blocks to prevent event dispatch failures
- Standardized property naming patterns with backward compatibility
- Custom event listener system operating alongside BattleBridge

### BattleLogManager (`js/battle_logic/events/BattleLogManager.js`)

**Purpose**: Formats and manages battle log messages.

**Responsibilities**:
- Creating formatted battle log messages
- Generating battle summaries

**Key Methods**:
- `logMessage()`: Formats and dispatches messages
- `displayTurnSummary()`: Creates turn summary

### Bridge Between Logic and Visuals

BattleManager doesn't directly update the UI. Instead, a sophisticated event-based communication system is used:

1. BattleManager delegates to specialized components (e.g., DamageCalculator processes damage)
2. Components use BattleEventDispatcher to dispatch standardized events (e.g., "CHARACTER_DAMAGED")
3. BattleEventDispatcher validates event data and ensures proper formatting
4. Events flow through BattleBridge to the active UI system
5. UI components listen for these events and update visuals accordingly

The event flow works like this:
```
Specialized Component → BattleEventDispatcher → BattleBridge → UI Components
```

This separation allows the same battle logic to work with either the DOM-based UI or the Phaser-based UI, while maintaining a clean boundary between game logic and visual presentation. The BattleEventDispatcher adds an extra layer of validation and standardization to ensure all events have consistent structures regardless of their source.

## UI Systems

The game has two UI systems: a traditional DOM-based UI and a newer Phaser-based UI.

### DOM-based UI

#### TeamBuilder UI (`js/ui/TeamBuilderUI.js`)

**Purpose**: Allows players to select their team before battle.

**Features**:
- Character grid with filterable heroes
- Team slots for selected characters
- Character detail panel with stats and abilities
- Battle mode selection (Quick, Custom, Campaign)

#### DOM Battle UI (`js/ui/BattleUI.js`)

**Purpose**: The original battle visualization system (being replaced by Phaser).

**Features**:
- Character circles with health bars
- Status effect icons
- Battle log with combat information
- Attack animations
- Battle controls (speed, pause)

### Phaser-based UI

#### Battle Scene (`js/phaser/scenes/BattleScene.js`)

**Purpose**: The new battle visualization system using the Phaser game engine.

**Features**:
- Enhanced graphics with proper game objects
- Optimized character sprites from Combat_Version folder
- Smoother animations and visual effects
- Modular component system for UI elements

#### Component Architecture

The Phaser implementation uses a component-based approach:

- `TeamContainer.js`: Manages a team of characters
- `CharacterSprite.js`: Handles individual character rendering with sophisticated visual effects
- `BattleControlPanel.js`: UI controls for the battle
- `DirectBattleLog.js`: Displays battle messages
- `ActionIndicator.js`: Shows action text above characters
- `StatusEffectContainer.js`: Displays status effect icons

##### CharacterSprite Visual System

The `CharacterSprite` component provides rich visual feedback during battle:

- **Health Visualization**: 
  - Animated health bars that smoothly transition between values
  - Color coding based on health percentage (green > orange > red)
  - Dynamic health text with damage shake and healing bounce animations
  - Glow effects for healing and flash effects for damage

- **Action Feedback**:
  - Character movement animations during attacks with directional awareness
  - Floating damage/healing numbers with size based on amount
  - Special visual effects for critical hits and status applications
  - Action indicators that show what ability is being used

- **Status Visualization**:
  - Status effect icons displayed near characters
  - Visual feedback when status effects are applied/removed
  - Tooltips showing effect details

- **Turn Highlighting**:
  - Active character highlighting with pulsing glow effects
  - Team-colored indicators to show whose turn it is
  - Shadow effects for depth perception

The component uses comprehensive error handling throughout all visual operations, with try-catch blocks to ensure visual effects don't crash the game even if issues occur.

## Battle Bridge: Connecting Core Logic to Phaser

The `BattleBridge` system (`js/phaser/bridge/BattleBridge.js`) acts as a communication layer between the core game logic and the Phaser visualization.

**How it works**:
1. BattleManager executes logic and dispatches events
2. BattleBridge listens for these events
3. BattleBridge forwards events to Phaser components
4. Phaser components update visuals in response

This bridge pattern allows the core battle logic to remain unchanged while supporting different visualization approaches.

## Game Flow: From Start to Finish

1. **Game Initialization**
   - Load data files
   - Initialize TeamBuilderUI
   - Set up event listeners

2. **Team Selection**
   - Player selects characters in TeamBuilderUI
   - TeamManager creates Character objects from selections
   - Player chooses battle mode

3. **Battle Initiation**
   - Player clicks "Start Battle"
   - TeamManager finalizes teams
   - BattleInitializer performs comprehensive character preparation:
     - Deep cloning team data to ensure independence
     - Generating unique IDs for all characters
     - Validating and supplying default values for missing properties
     - Setting initial health values to maximum
     - Initializing ability cooldowns
     - Identifying and separating passive abilities
     - Filtering out invalid characters
   - Either DOM BattleUI or Phaser BattleScene initializes
   - BattleManager prepares the battle state
   - PassiveTriggerTracker resets for the new battle
   - "onBattleStart" passive abilities are processed

4. **Battle Execution**
   - BattleFlowController determines turn order based on Speed stat
   - For each turn:
     - PassiveTriggerTracker resets for the new turn
     - StatusEffectManager processes status effects for all characters
     - ActionGenerator creates an action for the active character
     - TargetingSystem determines appropriate targets
     - AbilityProcessor executes the action's effects
     - DamageCalculator and HealingProcessor handle damage and healing
     - PassiveAbilityManager triggers relevant passive abilities
     - BattleEventDispatcher sends events to update the UI
   - BattleFlowController checks for battle end conditions

5. **Battle Conclusion**
   - BattleManager determines the outcome (victory/defeat)
   - Result screen is displayed
   - Player returns to TeamBuilder UI

## Combat Mechanics

### Turn Order System

**How it works**: 
- Characters are sorted by their Speed stat
- Higher Speed characters act first
- A complete round occurs when all characters have taken a turn
- The process repeats until the battle ends

### Damage Calculation

Damage is calculated by the DamageCalculator component using:
- Base ability damage (from the ability's "value" property)
- Attacker's relevant stat (Strength for physical, Intellect for spell)
  - Specified by the ability's "damageType" property ("physical", "spell", etc.)
  - With scaling factor of 0.5 (50% of the scaling stat)
- Target's defense (reduces damage based on defense value)
- Type effectiveness (calculated by TypeEffectivenessCalculator)
- Random variance (±20%)
- Critical hits (10% chance for +50% damage)

Formula:
```
Final Damage = (Base Damage + (Scaling Stat * 0.5)) * Type Multiplier * (1 - Defense Factor) * Variance * Critical Multiplier
```

The DamageCalculator provides detailed information about each factor to the battle log, such as "12 damage + 45 from Intellect"

### Health Management System

The game includes a comprehensive health management system:

**Backend Implementation**:
- Characters store current health in `currentHp` property
- Health changes are processed through DamageCalculator and HealingProcessor
- Health values are validated to prevent negative or NaN values
- Character death status (`isDead`) is automatically updated when health reaches 0
- Health-related events are dispatched through BattleEventDispatcher with detailed data

**Visual Representation**:
- Health bars visually display current health percentage
- Color coding provides immediate health status feedback:
  - Green (>60% health)
  - Orange (30-60% health)
  - Red (<30% health)
- Animated transitions for health changes:
  - Health bars smoothly animate between values
  - Healing shows a green glow effect on the character
  - Damage shows a red flash effect
  - Text shakes when taking damage
  - Text bounces when being healed
- Floating numbers show damage/healing amounts
  - Red numbers for damage
  - Green numbers for healing
  - Larger font for significant amounts

This dual system ensures consistent health tracking internally while providing rich visual feedback to the player.

### Type Effectiveness System

The game implements a data-driven type system with 22 different types managed by the TypeEffectivenessCalculator:

**Implementation**:
- Type relationships are loaded directly from `data/type_effectiveness.json`
- The file contains four key relationship categories:
  - `advantages`: Types that deal +50% damage to other types
  - `disadvantages`: Types that deal -50% damage to other types
  - `immunities`: Types that completely negate damage from certain types (0x damage)
  - `specialCases`: Custom multipliers for unique interactions (e.g., Light deals 3x damage to Ethereal)
- Enhanced battle log provides descriptive messages with color coding:
  - Advantages: "Fire is super effective against Nature!" (success color)
  - Disadvantages: "Fire is not very effective against Water." (info color)
  - Immunities: "Metal is immune to Poison!" (warning color)
  - Special cases: "Light deals massive damage to Ethereal!" (critical color)
- Fallback system provides basic type relationships if JSON fails to load
- Helper methods generate descriptive text for UI tooltips and ability descriptions

**Example Relationships**:
- Fire is strong against Nature, Ice, and Metal but weak against Water and Rock
- Water is strong against Fire, Rock, and Metal but weak against Nature and Electric
- Light and Dark are opposing forces (strong against each other)
- Ethereal is immune to physical auto-attacks but takes 3x damage from Light
- Metal is immune to Poison
- Void excels against Light and Psychic types

### Ability and Effect System

Each character has several abilities defined directly in their character data. Abilities are structured as follows:

**Ability Types**:
- **Active**: Skills that must be manually triggered and have cooldowns
- **Passive**: Automatic abilities that trigger under specific conditions

**Active Ability Properties**:
- `id`: Unique identifier (e.g., "drakarion_flame_strike")
- `name`: Display name
- `damage`: Base damage/healing amount
- `cooldown`: Turns between uses
- `damageType`: What stat it scales with ("physical", "spell", "healing", "utility")
- `targetType`: Who it can target ("SingleEnemy", "AllEnemies", "Self", etc.)
- `selectionWeight`: AI weighting for ability selection
- `effects`: Array of specific effects the ability applies

**Effect Types**:
- `Damage`: Direct damage to targets
- `Healing`: Direct healing to targets
- `ApplyStatus`: Applies status effects like burn, stun, etc.

**Passive Ability Properties**:
- `passiveTrigger`: When it activates ("onBattleStart", "onTurnStart", "onDamageTaken", etc.)
- `passiveBehavior`: Which function handles the effect (e.g., "passive_DamageReflectOnHit")
- `passiveData`: Configuration data for the passive

### Status Effects

Status effects apply temporary conditions to characters:
- Damage over time (burn, poison, bleed)
- Disables (stun, freeze)
- Stat modifications (attack up/down, defense up/down, speed up/down)
- Special conditions (taunt, evade, shield, immune)

Effects are processed at the start of each turn and expire after their set duration.

## Audio System

**[PLANNED BUT NOT FULLY IMPLEMENTED]**

While there are audio files in the `assets/audio/` directory and a `SoundManager.js`, the audio system is not fully implemented. The current structure includes:

- `js/ui/SoundManager.js`: Basic audio management
- `js/phaser/audio/PhaserSoundManager.js`: Phaser-specific sound implementation

The planned system will include:
- Battle sound effects (attacks, abilities, etc.)
- UI sounds (button clicks, character selection)
- Background music
- Volume controls

## Character Art System

The character art system manages the display of character images in the UI.

**Components**:
- `TeamBuilderImageLoader.js`: Loads character art for TeamBuilder
- `DirectImageLoader.js`: Loads character art for DOM Battle UI
- Combat_Version folder: Contains optimized 80x120px sprites for Phaser Battle Scene

**Key Features**:
- Global image caching to prevent repeated loading
- Position customization through character data
- Multi-resolution support (high-res for TeamBuilder, optimized for Battle)
- MutationObserver pattern for efficient DOM updates

## Debug and Development Tools

The game includes several debugging tools to aid in development:

- `CoordinateDisplay.js`: Grid overlay with coordinate tracking (toggle with Ctrl+G)
- `ObjectIdentifier.js`: Inspect game objects
- `DebugManager.js`: Central control for debug tools
- `BattleUIDebug.js`: Special debug features for Battle UI
- `ImageDebugger.js`: Tools for debugging image loading issues

## Planned Systems (Not Yet Implemented)

### 1. Character Progression System
- Characters will gain XP and level up
- New abilities unlock at specific levels
- Stats increase based on role-specific growth rates

### 2. Campaign Mode
- Series of battles with increasing difficulty
- Branching paths for player choice
- Character shard collection to unlock new heroes
- Persistent progression across multiple play sessions

### 3. Equipment System
- Items to boost character stats
- Different equipment types (weapons, armor, accessories)
- Rarity system affecting item power
- Equipment management UI

### 4. Expanded Arena System
- Multiple battle environments with unique visuals
- Weather effects affecting battles
- Arena-specific bonuses for certain character types
- Environmental hazards

## Technical Implementation Details

### Event System

The game uses a centralized event system based on the BattleEventDispatcher component:

1. Components call the BattleEventDispatcher to dispatch events
2. BattleEventDispatcher validates parameters and standardizes event data
3. Event data is distributed through two channels:
   - Custom event handlers registered directly with BattleEventDispatcher
   - BattleBridge for UI component communication
4. UI components update in response to events

**Key Features**:
- Standardized event formatting
- Comprehensive parameter validation for all events
- Specialized dispatching methods for different event types
- Custom event handlers with error isolation
- Proper source tracking via Source ID Linking pattern
- Defensive event validation and error handling
- Fallback systems when BattleBridge is unavailable

**Event Dispatcher Safety**:
- All events are wrapped in try-catch blocks to prevent cascade failures
- Missing parameters receive appropriate default values
- Invalid event types are logged but don't crash the system
- Event data is validated before dispatch
- Multiple property naming patterns for backward compatibility

Example events:
- "CHARACTER_DAMAGED": When a character takes damage
- "CHARACTER_HEALED": When a character is healed
- "CHARACTER_ACTION": When a character performs an action
- "STATUS_EFFECT_APPLIED": When a status effect is applied
- "STATUS_EFFECT_REMOVED": When a status effect expires
- "BATTLE_ENDED": When a battle concludes
- "PASSIVE_TRIGGERED": When a passive ability activates

### Save System

**[PLANNED BUT NOT IMPLEMENTED]**

The game plans to include a save system with:
- Three save slots
- Local storage for progress
- Character unlocks and progression
- Team configurations

### Character ID Management System

The game implements a unique ID system for tracking characters through references:

**Purpose**:
- Preventing circular references when storing character relationships
- Enabling proper attribution of effects in battle log
- Supporting status effect source tracking

**Implementation**:
- BattleInitializer assigns unique IDs to characters via `generateCharacterId()`
- Status effects store source character's `uniqueId` instead of direct references
- When effects trigger, BattleUtilities resolves IDs back to character objects
- This pattern is called "Source ID Linking" and is used throughout the codebase

**Benefits**:
- Avoids memory issues from circular references
- Allows effects to reference their source even after several turns
- Provides proper attribution in battle log for damage-over-time effects

### Performance Optimizations

Several optimizations improve game performance:

- Image caching to prevent repeated loading
- Targeted DOM observation with MutationObserver
- Request animation frame throttling
- Pre-optimized battle sprites
- Defensive loading patterns to prevent errors

## Data-Driven Systems

The game uses data-driven architecture to separate game mechanics from their implementation:

**JSON Configuration Files**:
- `characters.json`: Character definitions with stats, abilities, and visuals
- `status_effects.json`: Status effect definitions with durations and behaviors 
- `type_effectiveness.json`: Complete type interaction matrix for 22 types

**Benefits of Data-Driven Approach**:
- Content updates without code changes
- Clear separation between data and logic
- Easier balancing and testing
- Simplified modding potential

**Implementation Pattern**:
1. Components load JSON data at initialization
2. Data is transformed into internal structures
3. Robust fallback systems ensure functionality if data loading fails
4. Validation ensures data consistency and prevents errors

**Key Data-Driven Components**:
- TypeEffectivenessCalculator: Loads and processes type relationships
- StatusEffectDefinitionLoader: Manages status effect definitions
- BattleBehaviors: Uses data-defined behaviors for character actions
- Character loading: Transforms JSON definitions into game objects

This approach allows designers to adjust game balance and mechanics through data files while maintaining stability through validation and fallback systems.

## File Structure Organization

The codebase is organized into logical directories:

- `assets/`: Game assets (images, audio)
- `data/`: JSON data files (characters, status effects, type effectiveness)
- `js/`: All JavaScript code
  - `battle_logic/`: Core battle mechanics
    - `core/`: Core battle system components (BattleFlowController, BattleInitializer)
    - `status/`: Status effect components
    - `damage/`: Damage and healing components
    - `abilities/`: Ability processing components
    - `passives/`: Passive ability components
    - `events/`: Event management components
    - `utilities/`: Battle-specific utility functions
  - `entities/`: Character and ability classes
  - `managers/`: High-level manager classes (BattleManager, TeamManager)
  - `phaser/`: Phaser implementation
    - `bridge/`: Communication between game logic and Phaser
    - `components/`: Reusable UI components
    - `scenes/`: Phaser scene definitions
  - `ui/`: DOM-based UI components
  - `utilities/`: General helper functions

## Action Generation System

The ActionGenerator component creates actions for characters during battle through a sophisticated multi-stage process:

**Action Generation Pipeline**:
1. **Character Validation**: Comprehensive validation of character data (stats, abilities, health)
2. **Status Check**: Verification that character isn't stunned or otherwise prevented from acting
3. **Ability Selection**: Uses behavior system to choose which ability to use
4. **Target Selection**: Determines appropriate targets through TargetingSystem
5. **Damage Calculation**: Computes expected damage using DamageCalculator
6. **Action Creation**: Assembles a complete action object with all required data

**Ability Selection Process**:
- Characters can have custom decision logic via `actionDecisionLogic` property
- The behavior system evaluates available abilities based on context
- Factors considered include: ability cooldowns, target health, strategic value
- Fallback to weighted random selection if behavior system unavailable
- Selected abilities have cooldowns applied after use

**Special Features**:
- **Multi-Target Handling**: Special processing for abilities that affect multiple targets
- **Target Validation**: Ensures all targets are valid before creating the action
- **Defensive Programming**: Extensive error checking with graceful fallbacks
- **Detailed Logging**: Comprehensive debug information for troubleshooting

## BattleBehaviors System

The game uses a behavior system to determine character actions and abilities:

**Purpose**: Provides flexible, customizable decision-making for characters

**Key Components**:
- `BattleBehaviors.js`: Core behavior execution engine
- `BehaviorRegistry.js`: Centralized registration of available behaviors 
- `ActionDecisionBehaviors.js`: Behaviors for choosing actions/abilities
- `TargetingBehaviors.js`: Behaviors for selecting targets
- `PassiveBehaviors.js`: Behaviors for passive ability effects

**How It Works**:
1. Characters reference behavior IDs in their data
2. When needed, components request the behavior by ID
3. BehaviorRegistry returns the appropriate function
4. The function receives a context object with all needed data
5. The behavior executes and returns a result

**Benefits**:
- Characters can have unique decision-making logic
- New behaviors can be added without changing core systems
- Complex behaviors can be composed from simpler ones
- Easier to test and debug behavior in isolation

This behavior-based approach creates more interesting and varied gameplay while maintaining a clear separation between character data and implementation logic.

## Defensive Programming Patterns

The game implements several defensive programming patterns that ensure stability and error recovery:

1. **Parameter Validation**:
   - All public methods validate parameters before processing
   - Invalid parameters receive appropriate default values when possible
   - Missing dependencies trigger clear warning messages

2. **Error Isolation**:
   - Try-catch blocks surround critical operations
   - Errors in one component don't cascade to others
   - Visual elements have error recovery for rendering issues

3. **Graceful Degradation**:
   - Missing dependencies trigger fallback behaviors
   - Default values are supplied for missing data
   - Event dispatching continues even when some listeners fail

4. **Comprehensive Logging**:
   - Detailed context is provided in error messages
   - Component names are included in log prefixes (e.g., "[BattleInitializer]")
   - Warning/error levels are used appropriately

5. **Null Object Pattern**:
   - Empty arrays/objects are returned instead of null
   - Default visual representations appear when images fail to load
   - Event handlers safely handle missing data

These patterns combine to create a robust system that can recover from many types of errors without crashing or displaying incorrect information to the player.

## Conclusion

The AutoBattler game has evolved into a highly modular, component-based architecture with clear separation of responsibilities:

1. **Component-Based Design**: Each game function is handled by specialized components
2. **Orchestration Pattern**: BattleManager delegates to components rather than implementing logic directly
3. **Data-Driven Systems**: JSON-based configuration for types, status effects, and characters
4. **Defensive Programming**: Robust validation, error handling, and fallbacks throughout
5. **Event-Based Communication**: Centralized event system for loose coupling

This architectural approach provides several key benefits:
- **Maintainability**: Each component has a clear, focused responsibility
- **Testability**: Components can be tested in isolation
- **Extensibility**: New features can be added with minimal changes to existing code
- **UI Flexibility**: Same battle logic works with both DOM and Phaser UIs

As the game continues to develop, the planned systems (character progression, equipment, etc.) will integrate seamlessly with the existing architecture, leveraging the component-based design for a more robust and feature-rich experience.
