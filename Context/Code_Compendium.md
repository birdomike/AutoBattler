# AutoBattler Code Compendium

## Purpose
A complete reference guide to every JavaScript file in the AutoBattler game, explaining what each one does and how it fits into the overall architecture. This document serves as a comprehensive catalog of all code components for both developer reference and AI context restoration.

## How to Use This Document
- **For Developers**: Quick reference to understand what each file does and where to find specific functionality
- **For AI Context**: Provides detailed context about the codebase when starting new conversations
- **For Architecture Understanding**: Shows how different components relate to each other

---

## Battle Logic Components

### Core Systems
- **BattleFlowController.js**: 
- **BattleInitializer.js**: 

### Status & Effects
- **StatusEffectManager.js**: 
- **StatusEffectDefinitionLoader.js**: 

### Damage & Healing
- **DamageCalculator.js**: 
- **HealingProcessor.js**: 
- **TypeEffectivenessCalculator.js**: 

### Abilities & Actions
- **AbilityProcessor.js**: 
- **TargetingSystem.js**: 
- **ActionGenerator.js**: 

### Passive Systems
- **PassiveAbilityManager.js**: 
- **PassiveTriggerTracker.js**: 

### Events & Communication
- **BattleEventDispatcher.js**: 
- **BattleLogManager.js**: 

### Utilities & Behaviors
- **BattleUtilities.js**: 
- **BattleBehaviors.js**: 
- **BehaviorRegistry.js**: 
- **ActionDecisionBehaviors.js**: 
- **TargetingBehaviors.js**: 
- **PassiveBehaviors.js**: 

---

## Managers (High-Level Orchestrators)
- **BattleManager.js**: The central orchestrator for all battle-related systems in the AutoBattler game. Rather than handling battle logic directly, BattleManager acts as a sophisticated "conductor" that coordinates over 10 specialized component managers (like BattleFlowController, DamageCalculator, StatusEffectManager, etc.). It serves as a unified interface where other parts of the game can request battle operations - such as starting a battle, applying damage, or processing abilities - and BattleManager delegates these requests to the appropriate specialist component. The manager follows a facade pattern, providing simple method calls that hide the complexity of the underlying component system. It also handles initialization of all battle components in proper dependency order, manages global battle state (like teams, turn counts, speed settings), and acts as the communication bridge to the UI through event dispatching. *(Accurate as of v0.7.5.14)*

Talks to: BattleInitializer.js (team setup), BattleFlowController.js (turn management), BattleEventDispatcher.js (event communication), DamageCalculator.js (damage logic), HealingProcessor.js (healing logic), StatusEffectManager.js (status effects), PassiveAbilityManager.js (passive abilities), AbilityProcessor.js (ability execution), ActionGenerator.js (action creation), TargetingSystem.js (target selection), TypeEffectivenessCalculator.js (type advantages), BattleLogManager.js (logging), game.js (initialization), Phaser BattleScene.js (UI events), TeamManager.js (team data), and window.battleBridge (event system).

- **TeamManager.js**: The central component responsible for team composition management and character selection coordination in the AutoBattler game. TeamManager maintains the authoritative state for both player and enemy teams throughout the game lifecycle, handling character pool loading from JSON data, player team selection storage, and enemy team generation across multiple battle modes. The component provides three distinct enemy generation strategies: random teams with 20% stat variance for unpredictable encounters, custom teams with 10% stat variance for player-designed opponents, and planned campaign teams for future story mode implementation. TeamManager performs deep copying of character data to prevent reference conflicts, applies statistical variance to create battle variety, and serves as the primary data provider for team-related operations. It acts as the essential state bridge between the Team Builder UI selection phase and the Battle Manager combat initialization, ensuring team data integrity and proper initialization throughout the battle workflow. The component includes comprehensive fallback mechanisms with hardcoded character data to maintain functionality even when JSON loading fails. *(Accurate as of v0.7.5.14)*

Talks to: TeamBuilderUI.js (receives team selections and battle mode choices), BattleInitiator.js (provides finalized teams for battle start), BattleManager.js (supplies teams for combat initialization), data/characters.json (loads character pool), BattleInitializer.js (provides teams for battle setup), game.js (instantiated at startup), and window global scope (exposed for debugging and cross-system access).



---

## Phaser Implementation

### Core Phaser Systems
- **BattleAssetLoader.js**: 
- **BattleEventManager.js**: 

### Specialized Phaser Managers
- **BattleUIManager.js**: 
- **BattleFXManager.js**: 
- **TeamDisplayManager.js**: 

### Bridge Systems
- **BattleBridge.js**: 
- **BattleBridgeInit.js**: 
- **BattleLogTester.js**: 

### Scenes
- **BattleScene.js**: 
- **BootScene.js**: 
- **TeamBuilderScene.js**: 

### Audio Systems
- **PhaserSoundManager.js**: 

### Debug Tools
- **CoordinateDisplay.js**: 
- **DebugManager.js**: 
- **PhaserDebugManager.js**: 
- **ObjectIdentifier.js**: 

---

## UI Components

### Battle-Specific Components
- **ActionIndicator.js**: 
- **BattleControlPanel.js**: 
- **BattleLogPanel.js**: 
- **CharacterSprite.js**: 
- **DirectBattleLog.js**: 
- **StatusEffectContainer.js**: 
- **StatusEffectTooltip.js**: 
- **TeamContainer.js**: 
- **TurnIndicator.js**: 

### Card Frame System
- **CardFrame.js**: 
- **CardFrameManager.js**: 
- **CardFrameVisualComponent.js**: 
- **CardFrameHealthComponent.js**: 
- **CardFrameContentComponent.js**: 
- **CardFrameInteractionComponent.js**: 

### General UI Components
- **Button.js**: 
- **Panel.js**: 

---

## DOM-Based UI Systems

### Team Builder
- **TeamBuilderUI.js**: The primary orchestrator for the character selection interface in the AutoBattler game, functioning as the central hub for team composition before battle. TeamBuilderUI has been refactored from a monolithic class into a sophisticated component-based architecture, where it serves as the coordinator for seven specialized manager components that handle distinct aspects of the team-building experience. The system manages character data loading from JSON, user interaction with available heroes, filter controls for types and roles, team slot management, hero detail display, battle mode selection, and battle initiation workflows. TeamBuilderUI maintains compatibility with legacy systems while delegating specific responsibilities to specialized components: FilterManager (type/role filtering), HeroGridManager (character display and selection), TeamSlotsManager (team composition), HeroDetailPanelManager (detailed character information), BattleModeManager (battle type selection), BattleInitiator (transition to battle), and TeamBuilderUtils (shared utility functions). The architecture follows an Extract-Verify-Remove refactoring pattern, allowing gradual migration from monolithic methods to specialized components while maintaining fallback functionality. TeamBuilderUI interfaces with the image loading system for character art display, manages global UI state including view modes, and provides comprehensive error handling for missing components. *(Accurate as of v0.7.5.14)*

Talks to: TeamManager.js (team state management), FilterManager.js (filter state updates), HeroGridManager.js (character selection events), TeamSlotsManager.js (team composition changes), HeroDetailPanelManager.js (character detail rendering), BattleModeManager.js (battle mode changes), BattleInitiator.js (battle start coordination), TeamBuilderImageLoader.js (character art loading), TeamBuilderUtils.js (shared utility functions), data/characters.json (character data loading), window.soundManager (audio feedback), window.tooltipManager (UI tooltips), and game.js (initialization and global state).

- **TeamBuilderUIUpdates.js**: 
- **TeamBuilderUIUpdates.js**: 
- **TeamBuilderUtils.js**: 
- **HeroDetailPanelManager.js**: 
- **FilterManager.js**: 
- **HeroGridManager.js**: 
- **TeamSlotsManager.js**: 
- **BattleModeManager.js**: 
- **BattleInitiator.js**: 

### Legacy Battle UI
- **BattleUI.js**: 
- **BattleUIDebug.js**: 

### General UI Systems
- **SoundManager.js**: 
- **TooltipManager.js**: 

---

## Utilities & Helpers
- **DirectImageLoader.js**: 
- **ImageDebugger.js**: 
- **TeamBuilderImageLoader.js**: 

---

## Configuration & Initialization
- **game.js**: The main entry point and orchestrator for the entire AutoBattler application. This file handles the complete initialization sequence when the game loads, including creating the TeamManager, TeamBuilderUI, BattleManager, and the Phaser game instance. It also manages the loading of configuration files and serves as the central coordinator that connects all major systems together. The file includes comprehensive error handling and fallback mechanisms to ensure the game can start even if some components fail to load. It exposes all major managers globally for debugging and cross-system communication. *(Accurate as of v0.7.5.14)*

Talks to: TeamManager.js, TeamBuilderUI.js, BattleManager.js, PhaserConfig.js, project.config file, and window/global scope for system-wide access.


- **assets.js**: A comprehensive asset management system that catalogs and organizes all game resources including character images, UI elements, arena backgrounds, and effects. The AssetsManager class provides a centralized way to locate and preload assets for the Phaser engine, with methods for cataloging different asset types and loading them into Phaser scenes. It integrates with existing image loaders and provides fallback mechanisms for missing assets. This system ensures consistent asset paths and enables efficient preloading strategies. *(Accurate as of v0.7.5.14)*

Talks to: TeamBuilderImageLoader.js (for character image paths), Phaser scenes (for asset preloading), and the assets folder structure directly.


- **config.js**: A duplicate/alternative Phaser configuration class that appears to provide similar functionality to PhaserConfig.js but with different default settings and container management. This version uses more basic configuration settings and seems designed for standard HD resolution rather than 4K. It creates Phaser containers dynamically and provides static methods for configuration creation. This may be an older version or alternative implementation that's maintained for compatibility. *(Accurate as of v0.7.5.14)*

Talks to: Similar to PhaserConfig.js - interfaces with the DOM for container creation and provides configuration to Phaser.Game constructor.


- **PhaserConfig.js**: A utility module that handles the technical configuration and container setup for the Phaser game engine. It creates and styles the DOM container where Phaser renders, configures rendering options for optimal performance (including 4K support), and provides helper functions for checking if Phaser is properly initialized. The configuration includes specific settings for anti-aliasing, pixel art handling, and canvas context optimization. This module encapsulates all the technical details needed to get Phaser running correctly. *(Accurate as of v0.7.5.14)*

Talks to: game.js (called during Phaser initialization), the DOM (creates and styles containers), and provides configuration objects to the Phaser.Game constructor.


- **uiManager.js**: A sophisticated system for managing transitions between different UI modes in the game - specifically between DOM-based interfaces (like the Team Builder) and Phaser-based scenes (like the Battle Scene). It handles showing/hiding appropriate containers, managing scene transitions within Phaser, and provides toggle buttons for users to switch between UI modes. The UIManager acts as a bridge between the traditional HTML/CSS interface and the Phaser-powered game scenes, enabling seamless transitions during gameplay. *(Accurate as of v0.7.5.14)*

Talks to: game.js (receives Phaser game instance), DOM elements (team-builder-container, game-container, phaser-container), Phaser scenes (BattleScene, TeamBuilderScene), and manages scene lifecycle within the Phaser framework.



---

## Notes on Component Categories

### What Makes a "Component"?
Components are reusable, focused pieces of functionality that can be combined to create larger systems. In this codebase, they typically:
- Have a single, clear responsibility
- Can be instantiated multiple times
- Provide clean interfaces for interaction
- Handle their own lifecycle (creation, updates, destruction)

### Manager vs. Component vs. Utility
- **Managers**: Orchestrate multiple systems (BattleManager coordinates all battle logic)
- **Components**: Focused, reusable pieces (CharacterSprite handles one character's visuals)
- **Utilities**: Helper functions and tools (BattleUtilities provides common calculations)

### Refactoring History
Many of these files were created by refactoring larger, monolithic files into smaller, focused components. This makes the code:
- Easier to understand and maintain
- More testable in isolation
- More reusable across different parts of the game
- Less likely to create conflicts when multiple developers work on it

---

*Last Updated: [Date] - This document should be updated whenever new files are added or the architecture significantly changes.*
