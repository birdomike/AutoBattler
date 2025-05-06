# AutoBattler Game: How It All Works Together

This document explains how the different components of the AutoBattler game interact with each other, written in understandable terms and with references to specific files where helpful.

## Core Game Architecture

The AutoBattler game uses a **Model-View-Controller (MVC)** pattern:

- **Model**: Data files (JSON) and core entities (Character, Ability classes)
- **View**: UI components (TeamBuilder UI, Battle UI - both DOM and Phaser-based)
- **Controller**: Manager classes that handle game logic and state (BattleManager, TeamManager)

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

**Purpose**: Core battle logic controller - handles the entire battle process.

**Responsibilities**:
- Managing turn order based on speed
- Processing character actions
- Handling damage and healing
- Managing status effects
- Determining battle outcome

**Key Methods**:
- `startBattle()`: Initializes a new battle
- `processTurn()`: Executes a single character's turn
- `dealDamage()`: Applies damage to characters
- `applyStatusEffect()`: Applies status effects to characters
- `checkBattleEnd()`: Checks if the battle is over

### Bridge Between Logic and Visuals

BattleManager doesn't directly update the UI. Instead:

1. BattleManager executes logic (e.g., a character takes damage)
2. BattleManager dispatches events (e.g., "CHARACTER_DAMAGED")
3. UI components listen for these events and update visuals accordingly

This separation allows the same battle logic to work with either the DOM-based UI or the Phaser-based UI.

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
- `CharacterSprite.js`: Handles individual character rendering
- `BattleControlPanel.js`: UI controls for the battle
- `DirectBattleLog.js`: Displays battle messages

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
   - Either DOM BattleUI or Phaser BattleScene initializes
   - BattleManager prepares the battle state

4. **Battle Execution**
   - BattleManager determines turn order based on Speed stat
   - For each turn:
     - Active character selects an action (auto-attack or ability)
     - BattleManager executes the action
     - Effects like damage, healing, and status effects are applied
     - UI is updated through events
   - Turns continue until one team is defeated

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

Damage is calculated using:
- Base ability damage (from the ability's "value" property)
- Attacker's relevant stat (Strength for physical, Intellect for spell)
  - Specified by the ability's "scalingStat" property
  - With scaling factor defined in "scaleFactor" (typically 0.5)
- Target's defense
- Type effectiveness (bonus or penalty)
- Random variance (±20%)
- Critical hits (10% chance for +50% damage)

Formula:
```
Final Damage = (Base Damage + Stat Scaling) * Type Multiplier * (1 - Defense Factor) * Variance * Critical Multiplier
```

### Type Effectiveness System

Each character has a Type (Fire, Water, etc.) that influences damage:
- Strong against certain types: deals +50% damage
- Weak against certain types: deals -50% damage
- Some immunities exist (Metal is immune to Poison)
- Special interactions (Ethereal takes 3x damage from Light)

The system is defined in `Type Effectiveness Table.md`.

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

The game uses a custom event system for communication between components:

1. Components dispatch events with data
2. Other components listen for specific events
3. When an event occurs, listener callbacks are executed

Example events:
- "CHARACTER_DAMAGED": When a character takes damage
- "ABILITY_USED": When a character uses an ability
- "BATTLE_ENDED": When a battle concludes
- "STATUS_EFFECT_APPLIED": When a status effect is applied

### Save System

**[PLANNED BUT NOT IMPLEMENTED]**

The game plans to include a save system with:
- Three save slots
- Local storage for progress
- Character unlocks and progression
- Team configurations

### Performance Optimizations

Several optimizations improve game performance:

- Image caching to prevent repeated loading
- Targeted DOM observation with MutationObserver
- Request animation frame throttling
- Pre-optimized battle sprites
- Defensive loading patterns to prevent errors

## File Structure Organization

The codebase is organized into logical directories:

- `assets/`: Game assets (images, audio)
- `data/`: JSON data files
- `js/`: All JavaScript code
  - `battle_logic/`: Core battle mechanics
  - `entities/`: Character and ability classes
  - `managers/`: Manager classes
  - `phaser/`: Phaser implementation
  - `ui/`: DOM-based UI components
  - `utilities/`: Helper functions

## Conclusion

The AutoBattler game uses a modular architecture with clear separation between data, logic, and presentation. This design allows for flexibility in implementation (like the transition from DOM to Phaser UI) while maintaining core gameplay mechanics.

The event-based communication system enables loose coupling between components, making the code more maintainable and easier to extend with new features.

As the game continues to develop, the planned systems will integrate with the existing architecture to create a more robust and feature-rich experience.
