# Version 1.0 – First to Fall

---
## Game Loop: First to Fall

1. **Save Slot Selection**  
   When first launching the game, players choose one of three save slots (Slot 1, 2, 3).  
   Each slot holds an independent profile—including unlocked heroes, progression, inventory, and talent data.

2. **Team Builder Phase**  
   **Screen:** TeamBuilderUI (`#team-builder-container`) -No Phaser Integration- DOM based UI for Teambuilder

   - **Available Characters:** 8 initial heroes displayed with art, Type, Role, stats & abilities.  
   - **Filters:** Sort by Role or Type.  
   - **Selection:** Click a hero to animate them into one of 6 shaded team slots.  
   - **Modes:**  
     - **Quick Battle:** Instantly face a random AI team.  
     - **Custom Battle:** Player picks both ally and enemy teams.  
     - **Progression Mode (Campaign):** Series of battles, leveling, and hero unlocks on a **branching, non‑linear** map—players choose routes each act for meaningful agency.

3. **Team Setup**  
   - Selected heroes animate into mid‑screen slots (3 active slots).  
   - Slots display: Hero name, HP, Type/Role, basic stats & a remove button.  
   - Enemy team slots fill during Custom Battle or auto‑populate in Quick Battle.

4. **Battle Initiation**  
   **Screen:** Battle UI (`#game-container` + Phaser canvas)

   **Visuals & Animations:**  
   - Animated HP bars, status‑effect icons (burn, stun, regen), floating text for damage/healing/passive triggers.  
   - Auto‑attack “bonk & return” animations; full ability spells with particles (inspired by Hearthstone).  

   **Mechanics:**  
   - Turn‑based auto‑battler via **BattleManager**.  
   - Speed stat → turn order.  
   - Process status effects at turn start.  
   - **Type advantages** apply +/– damage multipliers (see Type Effectiveness Table).  
   - Each hero has 1 Passive (unlocked at lvl 12 in campaign) and 3 Actives (unlock at lvl 1, 5, 18 in campaign; all available in Quick/Custom).

   **UI Features**  
   - Phaser UI overlays integrated with the Phaser canvas: speed toggle, pause, next-turn & return implemented as Phaser Buttons, styled via Tailwind and positioned by scene layout.  
   - Scrolling battle log rendered in a Phaser UI container, displaying passive triggers, critical hits, misses, and type-effect annotations, with tooltip support.  
   - Themed arena backgrounds loaded as Phaser Sprites or Tilemaps (e.g. “Grassy Field”), with optional parallax or shader effects for added atmosphere.  

5. **Battle Outcome**  
   - Show Victory/Defeat overlay.  
   - Grant XP & Shards in Campaign Mode.  
   - Return to Team Builder or advance along the Campaign map.

6. **Progression Mode (Campaign)**  
   *(Structure draft)*  
   - Heroes begin at Level 1; max Level 20.  
   - **Ability Unlock Timeline:**  
     - Lvl 1 → first Active ability  
     - Lvl 5 → second Active ability  
     - Lvl 12 → Passive unlocked  
     - Lvl 18 → Ultimate ability unlocked  
   - Leveling raises stats per Role growth profile.  
   - **Branching Routes:** Players choose varied node paths each act, ensuring non‑linearity & replay variety.  
   - **Hero Shard System**:  
     - Defeating elites/bosses drops shards of that hero.  
     - Collect 10 shards → permanently unlock the hero.  
     - Duplicate shards convert to **Ascension XP**, raising the hero’s max Level cap for extra power.

   **Optional Systems:**  
   - **Inventory/Loot System**: Relics, gear & consumables drop from nodes; equip to boost stats or unlock effects.  
   - **Talent Tree System (per hero)**: Spend talent points at level‑up to specialize abilities, passives or stat nodes.

7. **Character Design System**  
   - **22 Roles** and **22 Types** deliver massive variety, team‑synergies & playstyles.  
   - Each hero is unique in look, lore & mechanics—fueling the “gotta unlock ’em all” drive.

   ### Role and Archetype Chart
   | #  | Role                                    | Archetype                         |
   |----|-----------------------------------------|-----------------------------------|
   | 1  | **Warrior**                             | Pure melee DPS‑tank               |
   | 2  | **Sentinel** *(formerly Knight)*        | Shielded striker                  |
   | 3  | **Berserker**                           | All‑in bruiser                    |
   | 4  | **Ranger**                              | Ranged glass cannon               |
   | 5  | **Assassin**                            | Burst finisher                    |
   | 6  | **Bulwark** *(formerly Guardian)*       | Pure tank                         |
   | 7  | **Mage**                                | Pure spell DPS                    |
   | 8  | **Invoker**                             | Supportive Caster / Spell Booster |
   | 9  | **Sorcerer**                            | High‑risk nuker                   |
   | 10 | **Summoner**                            | Pet‑centric caster                |
   | 11 | **Occultist** *(formerly Necromancer)*  | Minion + DoT controller           |
   | 12 | **Mystic** *(formerly Cleric)*          | Pure healer                       |
   | 13 | **Champion** *(formerly Paladin)*       | Hybrid tank‑healer                |
   | 14 | **Wildcaller** *(formerly Druid)*       | Nature hybrid                     |
   | 15 | **Striker** *(formerly Monk)*           | Agile skirmisher                  |
   | 16 | **Emissary** *(formerly Bard)*          | Buffer / debuffer                 |
   | 17 | **Elementalist** *(formerly Shaman)*    | Elemental support                 |
   | 18 | **Warden**                              | Counter‑Tank / Disruptor           |
   | 19 | **Skirmisher**                          | Hit‑and‑run ranged DPS            |
   | 20 | **Battlemage**                          | Hybrid melee‑caster brawler       |
   | 21 | **Venomancer**                          | Damage‑over‑time Specialist       |
   | 22 | **Trickster**                           | Chaos Controller / RNG Manipulator |

   ### Type Description Table
   | Type          | Description                                       |
   |:--------------|:--------------------------------------------------|
   | **Fire**      | Heat, flame, destructive energy.                  |
   | **Water**     | Fluidity, healing, relentless force.               |
   | **Nature**    | Plants, earth life, natural growth.               |
   | **Electric**  | Energy, speed, sudden shocks.                     |
   | **Ice**       | Cold, stillness, slowing effects.                 |
   | **Rock**      | Durability, raw earth toughness.                  |
   | **Air**       | Wind, agility, freedom.                           |
   | **Light**     | Purity, illumination, righteousness.              |
   | **Dark**      | Shadows, corruption, forbidden power.             |
   | **Metal**     | Armor, resilience, forged strength.               |
   | **Psychic**   | Mind, willpower, telekinetic forces.              |
   | **Poison**    | Toxicity, decay, subversion.                      |
   | **Physical**  | Brute force, martial prowess.                     |
   | **Arcane**    | Ancient magic, mystical forces.                   |
   | **Mechanical**| Constructs, machines, automation.                 |
   | **Void**      | Entropy, corruption of reality, nothingness.      |
   | **Crystal**   | Hardness, magical resonance, energy storage.      |
   | **Storm**     | Tempests, violent weather, unleashed energy.      |
   | **Ethereal**  | Ghosts, phasing, intangible existence.            |
   | **Blood**     | Sacrificial magic, vitality, life‑force mastery.  |
   | **Plague**    | Diseases, rot, uncontrollable spread of corruption.|
   | **Gravity**   | Force manipulation, crushing weight distortion.   |

8. **Replayability & Engagement**  
   - Build & refine teams with unlocked heroes  
   - Experiment with Roles/Types for synergies  
   - Chase Hero Shards & Ascension for power growth  
   - Optional Loot + Talent systems deepen customization  
   - Quick/Custom modes offer theorycraft playground  

---
*End of Version 1.0 Document*

