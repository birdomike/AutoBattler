# CardFrame Refactoring Plan - Big Picture

## Core Principles from Lessons Learned

1. **Extract. Verify. Remove.** - Complete each extraction fully before moving to the next
2. **Single-Path Implementation** - Create a clean delegation path immediately 
3. **Component Boundaries** - Clearly define responsibilities for each component
4. **Defensive Programming** - Add robust parameter validation and fallbacks
5. **Method Signature Consistency** - Match original signatures for seamless delegation
6. **Complete Implementation** - Ensure all dependencies and methods are completely implemented
7. **Line Reduction Metrics** - Track code reduction as a key success metric

## Phase Summary

### Phase 1: Planning and Component Structure
- ✅ Define component responsibilities and boundaries
- ✅ Create folder structure for components
- ☐ Review existing CardFrame.js to categorize methods by component

### Phase 2: CardFrameManager Implementation
- ☐ Create CardFrameManager.js base class
- ☐ Update index.html to include the new file
- ☐ Add stub methods for all public CardFrame methods
- ☐ Make CardFrameManager globally available

### Phase 3: Component Extraction
- ☐ Extract CardFrameVisualComponent
  - Create file, update index.html, implement delegation, verify, remove from original
- ☐ Extract CardFrameHealthComponent
  - Create file, update index.html, implement delegation, verify, remove from original
- ☐ Extract CardFrameContentComponent
  - Create file, update index.html, implement delegation, verify, remove from original
- ☐ Extract CardFrameInteractionComponent
  - Create file, update index.html, implement delegation, verify, remove from original

### Phase 4: Bridge Implementation
- ☐ Convert original CardFrame.js to thin wrapper
- ☐ Implement thorough destruction methods
- ☐ Add defensive checks for edge cases

### Phase 5: Component Communication
- ☐ Implement mediated communication through CardFrameManager
- ☐ Add event-based communication for complex interactions
- ☐ Establish state management patterns

## Phase 1: Planning and Component Structure

### Component Organization
```
js/phaser/components/ui/
├── CardFrameManager.js         (main component, thin delegating class)
├── cardframe/                  (subcomponents in dedicated folder)
   ├── CardFrameVisualComponent.js
   ├── CardFrameHealthComponent.js 
   ├── CardFrameContentComponent.js
   └── CardFrameInteractionComponent.js
```

### Component Responsibilities

1. **CardFrameManager**: 
   - Thin delegation layer that implements the original CardFrame API
   - Initializes and coordinates subcomponents
   - Exposes original methods (updateHealth, setSelected, etc.)
   - Contains no implementation logic, only delegation

2. **CardFrameVisualComponent**:
   - Handles frame, backdrop, and visual effects
   - Implements createBackdrop(), createBaseFrame(), addEdgeDepthEffects()
   - Manages type colors and visual styling

3. **CardFrameHealthComponent**:
   - Handles health bar creation and updates
   - Implements createHealthBar(), updateHealth(), getHealthBarColor()
   - Manages health animations and effects  

4. **CardFrameContentComponent**:
   - Manages character sprite and nameplate
   - Implements createPortraitWindow(), createCharacterSprite(), createNameBanner()
   - Handles content positioning and fallbacks

5. **CardFrameInteractionComponent**:
   - Handles hover, click, and selection interaction
   - Implements setupInteractivity()
   - Manages selection state and animation

## Phase 2: Implementation Approach

### Step 1: Create CardFrameManager (base framework)

1. Create a minimal CardFrameManager that:
   - Has the same constructor signature as original CardFrame
   - Contains stub methods for all public methods in CardFrame
   - Returns the original return values where needed
   - Includes proper validation for all parameters
   - Uses the existing Phaser.GameObjects.Container base class

2. Make it available globally:
   ```javascript
   // Make available globally
   window.CardFrameManager = CardFrameManager;
   ```

3. Document the manager with JSDoc comments for all methods

4. **Update index.html** (CRITICAL STEP):
   - Add the new JavaScript file to index.html
   - Ensure proper loading order (CardFrameManager before any dependencies)
   - Verify the file is being loaded (check console for errors)
   ```html
   <!-- CardFrame component system -->
   <script src="js/phaser/components/ui/CardFrameManager.js"></script>
   ```

### Step 2: Extract Each Component Individually

For each component (Visual, Health, Content, Interaction):

1. **Extract**:
   - Create the new sub-component file (e.g., `CardFrameVisualComponent.js`)
   - Copy the relevant logic from the *original* `CardFrame.js` into this new sub-component
   - Sub-components are NOT Containers themselves, but classes that create/manage Phaser GameObjects
   - Each component receives references to `scene` and parent container from CardFrameManager
   - Update CardFrameManager to initialize the component and add delegation methods

2. **Update index.html** (CRITICAL STEP):
   - Add each new component file to index.html as it's created
   - Ensure proper loading order (sub-components BEFORE CardFrameManager)
   ```html
   <!-- CardFrame component system -->
   <script src="js/phaser/components/ui/cardframe/CardFrameVisualComponent.js"></script>
   <!-- Additional components added here as they're created -->
   <script src="js/phaser/components/ui/CardFrameManager.js"></script>
   ```

3. **Implement in CardFrameManager**:
   - Instantiate the new sub-component in CardFrameManager
   - Add methods to delegate to the sub-component 
   - Ensure proper error handling for failed component initialization

4. **Modify CardFrame.js**:
   - In the *original* CardFrame.js, modify the relevant methods to delegate to `this.manager`
   - The original implementation code stays temporarily for fallback during testing

5. **Verify**:
   - Test the component's functionality through CardFrameManager
   - Verify same visual outcome and behavior as original implementation
   - Check for console errors and memory leaks
   - Confirm CardFrame -> CardFrameManager -> Component delegation chain works

6. **Remove**:
   - After verification, delete the extracted implementation code from CardFrame.js
   - Leave only the delegation methods pointing to CardFrameManager
   - Update changelogs with lines of code removed

7. **Document**:
   - Create a detailed technical changelog
   - Document all component methods and parameters
   - Include key decisions and approach

### Step 3: Bridge the Transition

1. Modify the original CardFrame class to become a thin wrapper:
   ```javascript
   class CardFrame extends Phaser.GameObjects.Container {
     constructor(scene, x, y, config = {}) {
       super(scene, x, y);
       
       // Validate inputs defensively
       if (!scene) {
         console.error("CardFrame: Scene is required");
         return;
       }
       
       // Delegate to CardFrameManager
       this.manager = new CardFrameManager(scene, x, y, config);
       
       // Add manager's container to this container
       this.add(this.manager);
       
       // Ensure scene.add.existing works properly
       scene.add.existing(this);
     }
     
     // Delegate all public methods
     updateHealth(currentHealth, maxHealth = null, animate = true) {
       if (!this.manager) return null;
       return this.manager.updateHealth(currentHealth, maxHealth, animate);
     }
     
     setSelected(selected, animate = true) {
       if (!this.manager) return null;
       return this.manager.setSelected(selected, animate);
     }
     
     // ... other methods ...
     
     destroy() {
       // Ensure thorough cleanup
       if (this.manager) {
         this.manager.destroy();
         this.manager = null;
       }
       
       // Destroy this container and all children
       super.destroy(true);
     }
   }
   
   // Keep global availability
   window.CardFrame = CardFrame;
   ```

2. Add defensive code to ensure backward compatibility:
   ```javascript
   // Ensure both CardFrame and CardFrameManager are available globally
   window.CardFrame = CardFrame;
   window.CardFrameManager = CardFrameManager;
   ```

3. **Thorough Phaser GameObject Destruction**:
   - Implement comprehensive destroy methods in each sub-component:
   ```javascript
   // Example for CardFrameVisualComponent
   destroy() {
     // Destroy all created Phaser GameObjects
     if (this.backdrop && this.backdrop.scene) {
       this.backdrop.destroy();
       this.backdrop = null;
     }
     
     if (this.frameBase && this.frameBase.scene) {
       this.frameBase.destroy();
       this.frameBase = null;
     }
     
     if (this.innerGlowGraphics && this.innerGlowGraphics.scene) {
       this.innerGlowGraphics.destroy();
       this.innerGlowGraphics = null;
     }
     
     // Stop any active tweens
     if (this.scene) {
       this.scene.tweens.killTweensOf(this.backdrop);
       this.scene.tweens.killTweensOf(this.frameBase);
       this.scene.tweens.killTweensOf(this.innerGlowGraphics);
     }
     
     // Remove any event listeners
     if (this.scene) {
       this.scene.events.off('resize', this.onResize, this);
       // Remove other listeners as needed
     }
   }
   ```
   
   - Ensure CardFrameManager properly calls destroy on all sub-components:
   ```javascript
   destroy() {
     // Destroy all subcomponents
     if (this.visualComponent) {
       this.visualComponent.destroy();
       this.visualComponent = null;
     }
     
     if (this.healthComponent) {
       this.healthComponent.destroy();
       this.healthComponent = null;
     }
     
     // ... destroy other components ...
     
     // Finally destroy the container itself
     super.destroy(true);
   }
   ```

## Phase 3: Component Extraction Process

1. **Component Extraction Order**:
   - First: CardFrameVisualComponent (frame, backdrop, effects)
   - Second: CardFrameHealthComponent (health bar and animations)
   - Third: CardFrameContentComponent (character sprite and nameplate)
   - Fourth: CardFrameInteractionComponent (interaction handling)

2. **Verification on Each Step**:
   - Test each component after extraction
   - Verify original functionality remains intact
   - Measure code reduction metrics
   - Document any issues or bugs encountered

3. **Careful Reference Management**:
   - Manage references properly between components
   - Maintain proper destruction sequences
   - Avoid circular references

## Phase 4: Component Communication

### Inter-Component Communication

1. **Mediated Communication**:
   - All inter-component communication should flow through CardFrameManager
   - Components should not directly reference each other to maintain loose coupling
   - Example:
   ```javascript
   // In CardFrameManager
   handleHoverStart() {
     // Visual component updates appearance
     if (this.visualComponent) {
       this.visualComponent.setHoverState(true);
     }
     
     // Interaction component tracks state
     if (this.interactionComponent) {
       this.interactionComponent.setHoverActive(true);
     }
   }
   ```

2. **Event-Based Communication**:
   - For more complex scenarios, use Phaser's event system
   - Components can listen to events emitted by CardFrameManager
   - This maintains separation of concerns
   ```javascript
   // In CardFrameManager
   setSelected(selected) {
     this.selected = selected;
     this.emit('selectionChanged', selected);
   }
   
   // In component initialization
   this.manager.on('selectionChanged', this.handleSelectionChange, this);
   ```

3. **State Management**:
   - CardFrameManager maintains the source of truth for shared state
   - Components receive state updates but don't modify shared state directly
   - This prevents state synchronization issues

## Key Success Metrics

1. **Code Size Reduction**:
   - Track lines of code in CardFrame before and after
   - Measure size of each extracted component

2. **Clean API Surface**:
   - CardFrameManager exposes exactly the same API as original CardFrame
   - No behavioral changes from user perspective

3. **Complete Implementation**:
   - All features from original CardFrame work in the refactored version
   - All edge cases and error handling preserved
