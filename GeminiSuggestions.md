# Gemini Suggestions for AutoBattler Combat System Overhaul

*(Intended Filename: GeminiSuggestions.md)*

---

## Context and Goal (The "Why")

### Current Situation:
The existing `BattleManager` handles combat flow but contains significant **hardcoded logic** for crucial behaviors like how characters choose targets, when/how they decide to use abilities versus basic attacks, and the specific mechanics of status effects (like Burn damage percentage or Stun behavior). Ability and status effect data structures are currently too simplistic to support complex mechanics or scaling.

### Problem:
This approach has several limitations:
* **Scalability:** Adding new characters, abilities, or status effects with unique behaviors requires modifying core `BattleManager` code, leading to complex, tangled `if/else` structures.
* **Maintainability:** Debugging or balancing becomes difficult as logic is scattered and hardcoded.
* **Design Limitation:** It's hard to implement strategically diverse characters (e.g., a smart healer, a specific assassin) or interesting ability/status interactions when the core logic is generic.
* **Variance Control:** The current mix of randomness (50% ability usage chance) and basic cooldowns lacks fine-tuned control, potentially leading to either overly chaotic or overly predictable battles.

### Overall Goal:
**Refactor the combat system to be flexible, scalable, data-driven, and maintainable.** This will enable the creation of unique character identities through distinct abilities and passives, allow for more complex and strategic interactions, provide better control over battle variance, and make future development and balancing much easier.

---

## Section 1: Battle Manager Architecture Plans (Behavior Delegation)

### Problem:
The `BattleManager` is currently overburdened with specific implementation details for how different entities should behave.

### Plan:
Transition to a **Behavior Delegation** architecture, likely using a **Strategy Pattern / Callback Function** approach. The `BattleManager` will act as an orchestrator, managing the overall turn structure, action queue, and battle state, but will delegate specific decisions and effect triggers to external functions.

### Recommended Solution:
* **Define Behavior Interfaces:** Clearly specify the inputs (e.g., `actor`, `potentialTargets`, `battleManagerContext`) and expected outputs (e.g., `targetObject`, `chosenAbilityObject`) for different categories of delegated logic (e.g., `TargetingLogic`, `ActionDecisionLogic`, `PassiveTriggerLogic`).
* **Create Behavior Function Library:** Implement reusable logic snippets as standalone functions (e.g., `targetLowestHpEnemy`, `decideAction_Random50Percent`, `passive_ApplyRegenOnTurnStart`). Include functions representing the current default logic as explicit defaults. Store these in an accessible way (e.g., a dedicated file/module like `js/battle_logic/behavior_functions.js`).
* **Function Registry/Lookup:** Implement a mechanism within `BattleManager` (or globally) to retrieve the actual JavaScript function based on a string name provided in the character/ability data.
* **Refactor `BattleManager`:**
    * At key decision points (e.g., within `generateCharacterAction`), implement the **"Check -> Delegate -> Default"** pattern:
        * Check if the character or ability data specifies a Behavior Function name for this situation.
        * If yes, look up and call that specific function, passing the required context.
        * If no, look up and call the designated default Behavior Function.
    * Add **"Passive Hooks"** at relevant points in the battle flow (Start/End of Turn, Before/After Damage Calculation, On Action Execute, etc.) that check character data for passive function references and execute them.

---

## Section 2 - Part 1: Ability Data Structure and Execution

### Problem:
The current simple ability structure (`name`, `damage`, `cooldown`, `isHealing`) cannot represent complex actions, scaling based on different stats, status effect applications, multi-part effects, passive abilities, or unique targeting needs.

### Plan:
Implement a detailed, data-driven JSON structure for abilities that encapsulates all necessary information, including references to specific behavior logic where needed. The execution of ability effects will be centralized within `BattleManager.applyActionEffect`.

### Recommended Solution:
* **Adopt Enhanced Ability JSON Structure:** Define abilities (likely in `characters.json` or a dedicated `abilities.json`) with fields including:
    * `id`, `name`, `description`, `unlockLevel` (e.g., 1, 5, 10, 15 for Active, 0 for Passive).
    * `abilityType` ("Active" / "Passive").
    * `targetType` (String - a hint/default, e.g., "SingleEnemy", "Self", "LowestHpAlly").
    * `cooldown` (Number - turns).
    * **`effects` Array:** The core change. An array where each object defines a specific part of the ability's outcome (e.g., `{ type: "Damage", damageType: "Fire", value: 20, scalingStat: "Strength", scaleFactor: 1.2 }`, `{ type: "ApplyStatus", statusEffectId: "status_burn", chance: 0.3, duration: 2 }`, `{ type: "StatBuff", targetStat: "Defense", value: 0.25, isMultiplier: true, duration: 3 }`, `{ type: "ResourceCost", resource: "HPPercentCurrent", value: 0.10 }`).
    * `passiveTrigger` (String - for Passive abilities, e.g., "onHit", "onTurnStart").
    * `actionDecisionLogic` (String - Optional, Character-level override for choosing this ability - see Part 2).
    * `targetingLogic` (String - Optional, Ability-specific targeting function name).
    * `selectionWeight` (Number - Optional, used by some action decision logic - see Part 2).
* **Refactor Ability Execution (`BattleManager.applyActionEffect`):** This function becomes central to processing abilities. It should:
    * Receive the chosen `action` object (which includes the `ability` if one was used).
    * If an ability was used, iterate through its `effects` array.
    * For each `effect`, determine target(s), calculate magnitude (using a refactored `calculateDamage` helper), and apply the result (change HP, call `addStatusEffect`, modify stats, etc.).
* **Refactor `calculateDamage` Helper:** Modify this function to accept detailed effect information (effect definition, attacker/target context, scaling parameters) and return the calculated numerical value for damage or healing, incorporating variance, critical hits, type effectiveness, and defense calculations (including armor penetration).
* **Integrate Behavior Delegation:** Use the `targetingLogic` reference within the ability data to allow the `BattleManager` (via the delegation pattern) to call the correct function for aiming abilities. *(Action decision logic is covered in Part 2)*.

---

## Section 2 - Part 2: Controlling Ability Usage (Randomness & Cooldowns)

### Problem:
While cooldowns pace ability usage, relying only on them can lead to predictable rotations ("Ability A -> Basic -> Basic -> Ability B -> ..."). The goal is to maintain an element of chance and variance in *when* abilities are used, preventing battles from becoming too deterministic turn-by-turn.

### Current Hybrid System:
The existing `BattleManager` already attempts a mix: Abilities are only usable if their `currentCooldown` is 0, **and** there's a 50% (`Math.random() > 0.5`) chance check to even *attempt* using an ability versus a basic attack. If multiple abilities are available and the check passes, one is chosen **randomly**.

### Plan:
Refine the action decision process (how a character chooses between basic attack and available abilities) to provide more nuanced control over ability frequency and choice, effectively blending the cooldown system with controlled randomness via the **Behavior Delegation** architecture.

### Recommended Solution (Weighted Ability Selection within Delegated Logic):
* **Leverage `actionDecisionLogic`:** Instead of a single hardcoded 50% check in `BattleManager`, the primary control mechanism becomes the `actionDecisionLogic` Behavior Function assigned to the character (or a default function if none is assigned).
* **Implement Weighted Random Choice Function:** Create a specific `actionDecisionLogic` function (e.g., `decideAction_WeightedRandomAbility`) that incorporates the idea of an initial chance check *plus* weighted selection:
    * Filter available abilities (where `currentCooldown === 0` and character meets `unlockLevel` - checking `unlockLevel` might be conditional based on game mode).
    * Perform an initial check (e.g., `Math.random() < character.abilityAffinity` or similar logic) to decide whether to *consider* using an ability at all.
    * **If considering an ability:**
        * Calculate the `totalWeight` of all `availableAbilities` using their `selectionWeight` property (defaulting to 1.0 if undefined). Lower weights mean less chance of being picked randomly relative to others.
        * Generate `randomWeight = Math.random() * totalWeight`.
        * Iterate through `availableAbilities`, subtracting each `ability.selectionWeight` from `randomWeight`. The ability that causes `randomWeight` to drop below zero is the `selectedAbility`.
        * Return the `selectedAbility`.
    * **If not considering an ability** (failed initial check or no abilities available): Return `null` (indicating a basic attack).
* **Assign Logic:** Characters can be assigned different `actionDecisionLogic` functions in their data:
    * Some might use `'decideAction_WeightedRandomAbility'` for balanced randomness.
    * A simpler character might use `'decideAction_Random50Percent'` (closer to current default).
    * A "smart" healer might use `'decideAction_PrioritizeHeal'`.
    * An aggressive character might use `'decideAction_PrioritizeOffense'`.
* **Benefits:** This provides fine-grained control. Cooldowns still gate availability, but the *choice* to use an available ability and *which one* can be tuned with randomness, weights, or specific AI logic via the delegated functions, achieving the desired blend of predictability and variance.

---

## Section 3: Status Effect System Changes

### Problem:
Status effect logic is currently hardcoded within `BattleManager`, is not scalable, lacks detail (potency, specific mechanics), and is difficult to manage or balance.

### Plan:
Define status effects in an **external, data-driven** manner and refactor `BattleManager` to dynamically apply and process these effects based on their definitions.

### Recommended Solution:
* **Create `status_effects.json`:** Define all status effects in a dedicated JSON file. Each definition should include:
    * `id`, `name`, `description`, `icon`.
    * `type` (Buff, Debuff, DoT, HoT, Control, Shield, etc.).
    * `defaultDuration`, `maxStacks`.
    * **`behavior` Object:** Details the effect's mechanics (e.g., `{ modifier: "PreventAction", value: true }` for stun/freeze; `{ trigger: "onTurnStart", action: "Damage", damageType: "Poison", valueType: "Flat", value: 15 }` for poison; `{ modifier: "StatModification", stat: "Attack", value: -0.2, isMultiplier: true }` for attack down; `{ modifier: "AbsorbDamage" }` for shields).
* **Refactor `BattleManager.addStatusEffect`:**
    * This function now takes `character`, `statusEffectId`, optional `duration`, and optional `appliedValue` (e.g., shield HP calculated by the applying ability).
    * It looks up the `statusEffectDefinition` using the `id`.
    * It creates and stores an **instance** of the effect on the character (in `this.statusEffects`), storing the `id`, `remainingDuration`, `appliedValue`, stack count, and potentially a reference back to the full definition.
* **Refactor `BattleManager.processStatusEffects` (and other checks):**
    * Logic should now operate on the **applied instances** and their corresponding **definitions**.
    * Determine behavior (apply DoT/HoT, check `PreventAction`, apply stat mods, reduce shield value) based on the properties read from the `definition.behavior` object, **not hardcoded logic**.
    * Decrement instance duration and remove expired instances.

---

## Final Summary & Interrelation:

These three initiatives (**Battle Manager Delegation**, **Enhanced Ability Structure**, **Externalized Status Effects**) are deeply interconnected and essential for achieving the project's goals:

* The **Delegated Battle Manager Architecture** provides the flexible framework needed to handle the unique logic defined by the detailed **Ability Structures** and **Status Effect Definitions**. It decouples the "what to do" (defined in data/behavior functions) from the "when/how to orchestrate it" (`BattleManager`).
* The **Enhanced Ability Structure** serves as the data source for complex actions. Its **`effects` array** dictates what happens during `applyActionEffect`, including triggering the application of specific **Status Effects** (by ID) and referencing the `targetingLogic` and `actionDecisionLogic` functions used by the **Battle Manager**.
* The **Externalized Status Effect Definitions** make status effects modular and data-driven. Abilities apply them by ID, and the **Battle Manager** processes their effects dynamically based on these definitions, using the hooks and logic enabled by the delegation architecture.

Implementing these changes together will transform the combat system from a rigid, hardcoded model to a **dynamic, data-driven, and significantly more scalable foundation** for your auto-battler.

---