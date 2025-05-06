# CHANGELOG 0.5.22_Cleanup: DamageCalculator Legacy Code Removal

## Summary
This version completes the extraction of the core damage calculation logic initiated in v0.5.22. It removes the original, now redundant, implementation of the `calculateDamage` method from `BattleManager.js`, replacing it entirely with a thin facade that delegates to the verified `DamageCalculator` component. This step significantly reduces the complexity and size of `BattleManager.js`.

## Changes Implemented

### 1. Legacy Code Removal
The entire original implementation block within the `calculateDamage(attacker, target, ability, effect = null)` method in `BattleManager.js` has been **removed**. This includes all logic related to:
- Base damage calculation
- Stat scaling (Strength, Intellect, Spirit)
- Defense application
- Status effect modifiers (`defense_up`, `attack_up`)
- Type multiplier application
- Random variance
- Miss chance
- Critical hit calculations

### 2. Facade Implementation
The `calculateDamage` method in `BattleManager.js` now acts purely as a **delegating facade**:

```javascript
calculateDamage(attacker, target, ability, effect = null) {
    if (this.damageCalculator) {
        // Delegate to the dedicated component
        const damage = this.damageCalculator.calculateDamage(attacker, target, ability, effect);
        
        // Temporary adapter wrapper for interface compatibility
        return {
            damage: damage,
            scalingText: '', 
            scalingStat: 0,
            scalingStatName: '',
            damageType: ability ? (ability.damageType || 'physical') : 'physical'
        };
    } else {
        // Fallback with error handling if component not available
        console.error("DamageCalculator component not found during delegation in BattleManager!");
        return { 
            damage: 0, 
            scalingText: '', 
            scalingStat: 0, 
            scalingStatName: '', 
            damageType: 'physical' 
        };
    }
}
```

### 3. Toggle Removal
The `if (this.useNewImplementation && ...)` toggle check within this specific method has been removed. The method now always delegates to `DamageCalculator` if available.

### 4. Documentation Update
The documentation comment block for the `BattleManager.calculateDamage` method has been updated to reflect its new role as a facade and includes a reference to the DamageCalculator component.

## Impact & Notes
- Successfully decouples the core damage calculation logic from `BattleManager`
- Reduces the line count and complexity of `BattleManager.js`
- Maintains backward compatibility with existing code calling `BattleManager.calculateDamage` due to the temporary adapter wrapper
- **TODO:** The adapter wrapper within the `BattleManager.calculateDamage` facade should be removed in a future step once `DamageCalculator.calculateDamage` is updated to return the full metadata object (`{ damage, scalingText, scalingStat, ... }`)

## Affected Files
- `js/managers/BattleManager.js` (Method body significantly reduced)

## Related Versions
- **Preceded by:** `0.5.22` (DamageCalculator Extraction & Verification)
- **Next Step:** `0.5.23` (Damage Application Logic Extraction)