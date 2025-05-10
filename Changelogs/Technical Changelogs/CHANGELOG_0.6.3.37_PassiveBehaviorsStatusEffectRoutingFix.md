# CHANGELOG 0.6.3.37 - PassiveBehaviors Status Effect Routing Fix

## Issue Description

When passive abilities applied status effects, BattleBridge.js displayed console warnings: "BattleBridge: Creating minimal fallback for status effect [status_id]". This indicated that while the effects were being applied, their full definitions weren't being properly propagated to the UI, resulting in potential visual issues with tooltips and icons.

The issue primarily manifested with Lumina's team buff passive at the start of battle (passive_TeamBuffOnBattleStart) and affected all 11 passive behaviors that directly called battleManager.addStatusEffect().

## Root Cause Analysis

The root cause was identified as a disconnect between the v0.6.3.35 fix in StatusEffectManager.js and the way passive abilities applied status effects:

1. **Direct BattleManager Calls**: PassiveBehaviors.js was making direct calls to battleManager.addStatusEffect() instead of routing through StatusEffectManager:
   ```javascript
   // Example from passive_TeamBuffOnBattleStart
   battleManager.addStatusEffect(ally, statusId, actor, effectDuration, 1);
   ```

2. **Architectural Gap**: While the StatusEffectManager had been enhanced in v0.6.3.35 to include full definitions in events (via the dispatchStatusEffectApplied method), this improvement only worked when StatusEffectManager.addStatusEffect() was called directly. The BattleManager.addStatusEffect() method didn't have the same enhancement.

3. **Different Event Paths**: This created two separate event paths:
   - **Proper Path**: Game logic → StatusEffectManager.addStatusEffect → StatusEffectManager.dispatchStatusEffectApplied → BattleBridge (with full definition)
   - **Incomplete Path**: PassiveBehaviors → BattleManager.addStatusEffect → BattleBridge (without definition, requiring fallback)

## Technical Solution

The solution implemented follows the architectural principle that StatusEffectManager should be the consistent point of entry for applying status effects:

1. **Helper Function Creation**: Created a central helper function in PassiveBehaviors.js that routes all status effect applications through StatusEffectManager when available:

```javascript
/**
 * Helper function to apply status effects through StatusEffectManager
 * Falls back to BattleManager.addStatusEffect if StatusEffectManager isn't accessible
 */
function applyStatusEffect(battleManager, character, effectId, source, duration, stacks = 1) {
    // Parameter validation
    if (!battleManager || !character || !effectId) {
        console.warn('[PassiveBehaviors.applyStatusEffect] Missing required parameters', { 
            hasBattleManager: !!battleManager, 
            hasCharacter: !!character, 
            effectId 
        });
        return false;
    }
    
    // Ensure duration is a number
    if (typeof duration !== 'number') {
        console.warn(`[PassiveBehaviors.applyStatusEffect] Invalid duration (${typeof duration}) for ${effectId} - using default 3`);
        duration = 3;
    }
    
    // Try to use StatusEffectManager first
    if (battleManager.statusEffectManager) {
        console.log(`[PassiveBehaviors] Using StatusEffectManager.addStatusEffect for ${effectId}`);
        return battleManager.statusEffectManager.addStatusEffect(character, effectId, source, duration, stacks);
    } else if (typeof battleManager.getStatusEffectManager === 'function') {
        const statusEffectManager = battleManager.getStatusEffectManager();
        if (statusEffectManager) {
            console.log(`[PassiveBehaviors] Using getStatusEffectManager().addStatusEffect for ${effectId}`);
            return statusEffectManager.addStatusEffect(character, effectId, source, duration, stacks);
        }
    }
    
    // Fall back to BattleManager.addStatusEffect
    console.log(`[PassiveBehaviors] StatusEffectManager not accessible, falling back to BattleManager.addStatusEffect for ${effectId}`);
    return battleManager.addStatusEffect(character, effectId, source, duration, stacks);
}
```

2. **Modifying All Direct Calls**: Updated all 11 instances of direct battleManager.addStatusEffect calls in PassiveBehaviors.js to use the new helper function:

```javascript
// Before:
battleManager.addStatusEffect(actor, 'status_crit_up', actor, 2, 1);

// After:
applyStatusEffect(battleManager, actor, 'status_crit_up', actor, 2, 1);
```

3. **Multiple Access Methods**: Implemented fallback mechanisms to handle different ways BattleManager might expose its StatusEffectManager:
   - Direct property access: `battleManager.statusEffectManager`
   - Getter method: `battleManager.getStatusEffectManager()`
   - Fallback to original method if StatusEffectManager isn't accessible

4. **Parameter Validation**: Added comprehensive parameter validation to catch potential issues early and provide helpful error messages.

## Implementation Benefits

1. **Architectural Alignment**: Solution follows the principle that StatusEffectManager should be the single point of entry for status effect management, aligning with the component-based architecture.

2. **Elimination of Warnings**: The "Creating minimal fallback for status effect" warnings no longer appear since all status effects now flow through the proper channel that includes their definitions.

3. **Improved Tooltip Display**: Status effects applied by passive abilities now display proper tooltips with accurate information when hovered over.

4. **Robust Error Handling**: The helper function includes comprehensive parameter validation and fallbacks to prevent errors.

5. **Defensive Programming**: The implementation follows defensive programming patterns with proper validation and graceful degradation.

6. **Backward Compatibility**: The solution maintains backward compatibility through its fallback mechanisms.

## Testing Verification

Testing should verify:
1. No "Creating minimal fallback" warnings appear in the console during battles
2. Status effect tooltips display properly for effects applied by passive abilities
3. Passive abilities that apply status effects continue to function correctly
4. Existing battle mechanics and interactions remain unchanged

## Lessons Learned

1. **Centralized Control Points**: Components like StatusEffectManager should be the sole gateway for their respective domain operations to ensure consistent behavior.

2. **Facade Pattern Value**: The helper function demonstrates the value of facade patterns in ensuring consistent access to subsystems.

3. **Defensive Programming**: Comprehensive validation and fallbacks protect against architectural changes and ensure robust operation.

4. **Event Payload Enrichment**: Components should enrich event payloads with all necessary data before dispatching to avoid downstream workarounds.

5. **Breaking Change Awareness**: The v0.6.3.35 fix created an implicit requirement that StatusEffectManager be used directly, which this change addresses explicitly.

This fix ensures all status effects, regardless of their source, are properly processed and have complete definitions available throughout the system.
