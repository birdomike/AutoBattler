# CHANGELOG 0.4.4.6 - Battle Logic & Passive Ability Improvements

## Overview
This update focuses on reinforcing the battle logic system, particularly addressing issues with passive abilities, damage reflection, and healing targeting. The changes ensure better stability during battles and prevent infinite loops or incorrect targeting.

## Primary Issues Addressed

### 1. Infinite Damage Reflection Loops
**Problem**: Characters with Damage Reflection passive abilities (like Vaelgor) could enter infinite reflection chains when facing other characters with the same passive, causing battles to stall.

**Root Cause**: 
- No limit on how many times damage could be reflected
- No minimum threshold for reflection (tiny amounts kept being reflected)
- No tracking of reflection depth in the damage chain

**Solution**:
- Implemented a reflection depth tracking system with a maximum of 2 reflections
- Added a minimum reflection threshold (damages ≤2 won't reflect if it's already a secondary reflection)
- Enhanced the reflection passive to check depth and avoid excessive chains
- Added detailed logging to help diagnose reflection issues

### 2. Incorrect Healing Ability Targeting
**Problem**: Healing abilities sometimes targeted enemies instead of allies due to defaulting to the same targeting logic as damage abilities.

**Root Cause**:
- No special targeting behavior for healing abilities
- Default targeting behavior favored enemies

**Solution**:
- Added special targeting logic detection for healing abilities
- Force ally targeting for abilities with `isHealing: true` or `damageType: 'healing'`
- Defaulted healing abilities to target lowest HP ally when no explicit targeting logic is specified
- Added debug logging for targeting decisions

### 3. Excessive Passive Ability Triggers
**Problem**: Some passive abilities could trigger multiple times at battle start or during other events, causing unintended effects.

**Root Cause**:
- Insufficient tracking of which passives had already triggered
- No battle-level passive trigger tracking (only turn-level)

**Solution**:
- Added battle-level passive trigger tracking using a Map structure
- Ensured proper initialization of tracking objects
- Added checks to prevent duplicate triggers for the same event

## Technical Implementation Details

### 1. Reflection Depth Control System
The reflection depth control system was implemented in PassiveBehaviors.js:

```javascript
function passive_DamageReflectOnHit(context) {
    // Extract reflection depth from context
    const { reflectionDepth = 0 } = additionalData;
    
    // Prevent excessive reflection chains
    if (reflectionDepth >= 2) {
        console.debug(`Max reflection depth (${reflectionDepth}) reached, stopping reflection chain`);
        return { executed: false };
    }
    
    // Calculate reflected damage
    const reflectAmount = Math.round(Math.max(1, damageAmount * 0.2));
    
    // Skip small reflections for secondary reflections to prevent endless chains
    if (reflectAmount <= 2 && reflectionDepth > 0) {
        console.debug(`Reflection amount (${reflectAmount}) too small for secondary reflection, stopping chain`);
        return { executed: false };
    }
    
    // Apply reflected damage with depth tracking
    battleManager.applyDamage(
        source,                  
        reflectAmount,          
        actor,                  
        null,                   
        'reflected',            
        { reflectionDepth: reflectionDepth + 1 }
    );
}
```

### 2. Enhanced Targeting for Healing
The targeted healing system ensures healing abilities always target allies:

```javascript
// Use appropriate targeting behavior based on ability type
const isHealing = selectedAbility.isHealing || selectedAbility.damageType === 'healing';

// Force ally targeting for healing abilities
let effectiveTargetingLogic = targetingLogic;
if (isHealing && !effectiveTargetingLogic) {
    // Healing abilities should target allies by default
    effectiveTargetingLogic = 'targetLowestHpAlly';
    console.debug(`Forcing ally targeting for healing ability: ${selectedAbility.name}`);
}
```

### 3. Battle-Level Passive Trigger Tracking
A new battle-level tracking system was implemented to ensure passive abilities trigger appropriately:

```javascript
// Initialize passive trigger tracking at battle level
this.passiveTriggersThisBattle = new Map();

// In processPassiveAbilities:
if (!this.passiveTriggersThisBattle) {
    this.passiveTriggersThisBattle = new Map();
}

// And later in the processing loop:
const passiveId = `${character.uniqueId}_${passiveAbility.name}_${trigger}`;
const passiveTriggerKey = trigger === 'onBattleStart' ? passiveId : null;

// For battle start events, check if already triggered
if (passiveTriggerKey && this.passiveTriggersThisBattle.has(passiveTriggerKey)) {
    console.debug(`Skipping duplicate battle-level passive trigger: ${passiveId}`);
    continue;
}

// Mark as triggered at battle level if needed
if (passiveTriggerKey) {
    this.passiveTriggersThisBattle.set(passiveTriggerKey, true);
}
```

## Testing Notes
The fixes were verified with specific test scenarios:

1. Battle with multiple reflection characters (Vaelgor vs Vaelgor)
2. Testing healing abilities to ensure they target allies
3. Checking battle start passives to ensure they only trigger once
4. Verifying reflection chains stop at maximum depth limit

## Known Limitations
- Battle-level tracking resets between battles
- The 2-reflection maximum is hard-coded but could be made configurable in the future
- The minimum reflection threshold (2) could be tuned further based on balance testing
