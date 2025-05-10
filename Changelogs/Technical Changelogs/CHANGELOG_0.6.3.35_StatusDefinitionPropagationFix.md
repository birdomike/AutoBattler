# CHANGELOG 0.6.3.35 - Status Effect Definition Propagation Fix

## Issue Description

When passive abilities apply status effects, BattleBridge.js displays console warnings: "BattleBridge: Creating minimal fallback for status effect [status_id]". This indicates that full status effect definitions aren't being propagated properly through the event chain.

## Root Cause Analysis

The issue was identified in how status effect data flows through the component chain:

1. **Data Loss at Source**:
   - Passive behaviors in `PassiveBehaviors.js` call `battleManager.addStatusEffect(ally, statusId, actor, duration, stacks)` with just a status ID but no definition.
   - `StatusEffectManager.addStatusEffect()` correctly retrieves the full definition using `this.definitionLoader.getDefinition(effectId)`.
   - However, it never includes this full definition when dispatching status effect events, causing the definition to be lost in the event flow.

2. **Event Communication Gap**:
   - Events pass through `BattleManager → StatusEffectManager → BattleEventDispatcher → BattleBridge`.
   - While the `BattleEventDispatcher.dispatchStatusEffectAppliedEvent()` method has a parameter for the status definition, it's rarely populated since StatusEffectManager doesn't pass it along.

3. **Fallback Creation in BattleBridge**:
   - When BattleBridge receives a STATUS_EFFECT_APPLIED event without a definition, it attempts multiple fallbacks.
   - When all fallbacks fail, it creates a minimal definition, resulting in the warning messages.

## Technical Solution

The solution directly addresses the root cause by modifying `StatusEffectManager.js` to properly propagate the full status definition it already retrieves:

1. **Added a New Method**: `dispatchStatusEffectApplied(character, statusId, duration, definition, stacks, source)`
   - Specifically designed to dispatch STATUS_EFFECT_APPLIED events with complete status definition data
   - Includes multiple dispatch strategies for maximum compatibility:
     - Direct BattleBridge dispatching
     - BattleManager.dispatchUIEvent fallback
     - BattleEventDispatcher fallback if available

2. **Modified StatusEffectManager.addStatusEffect()**:
   - After successfully creating or updating a status effect, it now calls the new dispatch method
   - Passes the full status definition that was already retrieved earlier in the method
   - Uses appropriate context data (character, stacks, duration, source) for complete event information

## Implementation Details

Added to StatusEffectManager.js:

```javascript
dispatchStatusEffectApplied(character, statusId, duration, definition, stacks = 1, source = null) {
    if (!character || !statusId || !definition) {
        console.warn('[StatusEffectManager] Cannot dispatch STATUS_EFFECT_APPLIED: missing required parameters');
        return;
    }
    
    try {
        // Get bridge instance using correct accessor pattern
        const battleBridge = window.getBattleBridge ? window.getBattleBridge() : window.battleBridge;
        
        if (battleBridge && typeof battleBridge.dispatchEvent === 'function') {
            // Use STATUS_EFFECT_APPLIED event type
            const eventType = battleBridge.eventTypes.STATUS_EFFECT_APPLIED || 'status_effect_applied';
            
            // Dispatch event with full definition included
            battleBridge.dispatchEvent(eventType, {
                character: character,
                statusId: statusId,
                duration: duration,
                stacks: stacks,
                source: source,
                statusDefinition: definition // Include the full definition
            });
            console.log(`[StatusEffectManager] Dispatched STATUS_EFFECT_APPLIED for ${statusId} with full definition`); 
        } else {
            // Fallbacks for other architectural patterns...
        }
    } catch (err) {
        console.error('[StatusEffectManager] Error dispatching STATUS_EFFECT_APPLIED event:', err);
    }
}
```

Modified the existing `addStatusEffect` method to call this at the appropriate point:

```javascript
// After successfully adding/updating the effect...
// MODIFIED v0.6.3.35_StatusDefinitionPropagationFix: Dispatch STATUS_EFFECT_APPLIED event with full definition
const effectToUse = existingEffect || newEffect;
this.dispatchStatusEffectApplied(character, effectId, effectToUse.duration, definition, effectToUse.stacks || 1, source);
```

## Implementation Benefits

1. **Follows Component Responsibility Principle**: The StatusEffectManager, which owns and understands status effects, now properly enriches its events with complete definition data.

2. **No Changes to Callers Required**: Passive behaviors and other code that calls addStatusEffect can continue with their existing parameter pattern - enrichment happens automatically.

3. **Maintains Architectural Integrity**: The fix aligns with the project's event-driven architecture pattern and separation of concerns.

4. **Provides Compatibility**: The implementation includes multiple fallback mechanisms to accommodate different architectural patterns.

5. **Improves UI Integrity**: UI components like tooltips now receive complete status effect data, improving visual feedback.

6. **Eliminates Console Warnings**: The fix removes the "Creating minimal fallback" console warnings by providing proper definitions.

## Testing Verification

Testing involved:

1. Starting a battle with characters that have passive abilities applying status effects
2. Verifying that no "Creating minimal fallback for status effect" warnings appear in the console
3. Checking that status effect tooltips display properly with complete information
4. Validating that this fix doesn't break existing status effect application logic

## Lessons Learned

1. **Component Data Enrichment**: Components should fully enrich data they own before dispatching events.

2. **Event Data Completeness**: Events should include all necessary context data to prevent downstream components from needing to re-acquire information.

3. **Architectural Clarity**: Component responsibilities should be clearly defined - StatusEffectManager should handle all aspects of status effect data, including event payload preparation.

4. **Defensive Coding**: Including thorough validation and multiple fallback mechanisms creates more resilient event-driven systems.

This fix demonstrates how respecting the architectural principle that "components should enrich data they own before propagating it" leads to more robust and maintainable code.
