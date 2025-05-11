## This document provides long term goals that are to be added to our game
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
- **Fully implemented** data-driven type system with complete 22-type effectiveness relationships
- Data stored in `type_effectiveness.json` with advantages, disadvantages, immunities, and special cases
- Each type has specific strengths (does +50% damage) and weaknesses (does -50% damage)
- Some types have immunities (e.g., Metal is immune to Poison, Physical cannot damage Ethereal)
- Special interactions exist (e.g., Ethereal takes 3x damage from Light)
- Enhanced battle log with descriptive type effectiveness messages
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