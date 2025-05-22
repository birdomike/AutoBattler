# Settings Manager Development Plan

**Project**: AutoBattler Game  
**Component**: Settings Menu with Gear Icon  
**Status**: Planning Phase  
**Created**: 2025-05-21  

## **Overview**

This document outlines the development plan for creating an expandable Settings menu system that persists across both the TeamBuilder UI and Phaser Battle UI. The system will replace the current standalone volume button with a comprehensive settings panel accessible via a gear icon.

## **Current State Analysis**

### **Existing Volume Button Implementation**
- **Location**: `js/ui/SoundManager.js` 
- **Method**: `createSoundControls()` in constructor
- **Persistence**: Appended directly to `document.body`
- **Position**: Fixed bottom-right (`bottom: 20px; right: 20px`)
- **Z-Index**: 1000
- **Components**: Toggle button (🔊/🔇) + Volume slider (0-100)

### **Current Sound System Architecture**
- **Legacy DOM-based**: `SoundManager.js` (creates persistent volume button)
- **New Phaser-based**: `BattleSoundManager.js` (battle-specific audio, no UI controls)
- **Issue**: No synchronization between the two sound systems' volume levels

## **Recommended Architecture**

### **New File Creation**
**File**: `js/ui/SettingsManager.js`

### **Why Separate File?**
- **Single Responsibility**: Each manager handles one concern
- **Expandability**: Easy to add new setting categories without bloating existing files  
- **Maintainability**: Clear separation makes debugging and updates easier
- **Reusability**: Could potentially be used in other projects
- **Team Development**: Multiple developers can work on settings without conflicts

## **Technical Implementation Plan**

### **Settings Menu Structure**
```
Settings Gear Icon (Persistent)
└── Settings Panel (Expandable)
    ├── 🔊 Audio Settings
    │   ├── Master Volume Slider
    │   ├── Sound Effects Toggle  
    │   └── Music Toggle (future)
    ├── 🎮 Gameplay Settings (future)
    │   ├── Battle Speed
    │   ├── Auto-Battle Toggle
    │   └── Skip Animations
    ├── 🎨 Graphics Settings (future)
    │   ├── Quality Level
    │   ├── Particle Effects
    │   └── Screen Resolution
    └── 💾 Data Settings (future)
        ├── Reset Progress
        ├── Export Save
        └── Import Save
```

### **Persistence Strategy**
**Follow existing volume button pattern:**
- Append to `document.body` (not tied to any specific UI container)
- Use fixed positioning with high z-index (1001+ to appear above volume button)
- Independent of both TeamBuilder UI and Phaser Battle UI

### **UI Architecture**
```
Document Body
├── TeamBuilder UI Container (#team-builder-container)
├── Phaser Game Container (#game-container)
└── Settings Container (.settings-controls) ← New Persistent Settings
    ├── Gear Icon (Always Visible)
    └── Settings Panel (Expandable)
        ├── Audio Section
        ├── Gameplay Section (future)
        ├── Graphics Section (future)
        └── Data Section (future)
```

## **File Structure Design**

### **Proposed SettingsManager.js Structure**
```javascript
class SettingsManager {
    constructor()              // Initialize settings system
    createSettingsUI()         // Create main UI container
    createGearIcon()          // Create persistent gear icon
    createSettingsPanel()     // Create expandable settings panel
    createAudioSection()      // Create audio controls section
    toggleSettingsPanel()     // Show/hide settings panel
    saveSettings()           // Persist settings to localStorage
    loadSettings()           // Load settings from localStorage
    syncSoundSystems()       // Sync volume between sound managers
    addSettingSection()      // Framework for adding new sections
    destroy()                // Cleanup resources
}
```

## **Integration Strategy**

### **With Existing Sound Systems**

#### **SoundManager.js Modifications**
- **Remove**: `createSoundControls()` method
- **Add**: Public methods for SettingsManager integration:
  ```javascript
  setMasterVolume(volume)  // Set volume level
  getMasterVolume()        // Get current volume
  toggleMute()            // Toggle mute state
  isMuted()               // Check mute state
  ```

#### **BattleSoundManager.js Integration**
- Add bridge methods to sync volume between both sound systems
- Ensure both systems respect the same volume settings
- Create unified volume control interface

### **Communication Pattern**
```
SettingsManager ←→ SoundManager (volume controls)
SettingsManager ←→ BattleSoundManager (battle audio sync)  
SettingsManager ←→ localStorage (persistence)
SettingsManager ←→ Future systems (graphics, gameplay, etc.)
```

### **Initialization Order**
```javascript
// In game.js or index.html
1. SoundManager (modified to not create volume controls)
2. SettingsManager (creates UI and manages all settings)  
3. Other systems...
```

## **Implementation Phases**

### **Phase 1: Core Infrastructure**
**Objectives:**
- Create `SettingsManager.js` with basic gear icon and panel structure
- Migrate volume controls from `SoundManager.js` to `SettingsManager.js`
- Add localStorage persistence for settings
- Update `SoundManager.js` to work with the new system

**Deliverables:**
- Working gear icon with slide-out panel
- Audio section with volume controls
- Settings persistence
- No regression in existing audio functionality

### **Phase 2: Enhanced Audio Controls**
**Objectives:**
- Add separate volume controls for different audio categories
- Sync with both SoundManager and BattleSoundManager
- Add mute toggles for different audio types

**Deliverables:**
- Master Volume control
- Sound Effects volume control
- Music volume control (preparation)
- Unified audio system behavior

### **Phase 3: Future Expansion Framework**
**Objectives:**
- Create expandable section system
- Add settings validation and error handling  
- Create settings import/export functionality
- Framework for adding new setting categories

**Deliverables:**
- Generic section addition system
- Settings validation framework
- Import/export capabilities
- Documentation for adding new settings

## **Design Specifications**

### **UI Behavior**
- **Gear Icon**: Always visible, fixed position (top-right corner suggested)
- **Panel**: Slides out/fades in when gear is clicked
- **Outside Click**: Panel closes when clicking outside
- **Responsive**: Adapts to different screen sizes
- **Keyboard**: ESC key closes panel

### **Visual Design**
- **Theme Consistency**: Use existing CSS variables (`--highlight`, `--dark-bg`, etc.)
- **Animations**: Smooth transitions matching existing UI
- **Icons**: Use Font Awesome or similar for consistent iconography
- **Layout**: Clean, organized sections with clear hierarchy

### **Data Management**
- **localStorage**: Persist all settings locally
- **Default Values**: Fallback to sensible defaults
- **Validation**: Ensure settings values are within valid ranges
- **Sync**: Real-time updates to game systems when settings change
- **Error Handling**: Graceful degradation if localStorage unavailable

## **File Loading Integration**

### **HTML Loading Order**
```html
<!-- Existing -->
<script src="js/ui/SoundManager.js" defer></script>

<!-- New Addition -->
<script src="js/ui/SettingsManager.js" defer></script>

<!-- Existing continues... -->
<script src="js/ui/TeamBuilderUI.js" defer></script>
```

### **Global Initialization**
```javascript
// In game.js window.onload
const settingsManager = new SettingsManager();
window.settingsManager = settingsManager;
```

## **Benefits of This Approach**

### **Immediate Benefits**
- **Consolidated UI**: All settings in one accessible location
- **Better UX**: Familiar gear icon convention
- **Persistent**: Works across both UI systems
- **Organized**: Clean separation from game logic

### **Long-term Benefits**
- **Expandable**: Easy to add new setting categories
- **Maintainable**: Clear separation of concerns
- **Consistent**: Follows existing architectural patterns
- **Future-Proof**: Framework ready for any new settings
- **Scalable**: Can grow with game complexity

## **Potential Challenges & Solutions**

### **Challenge**: Volume Control Migration
**Solution**: Maintain backward compatibility during transition, test thoroughly

### **Challenge**: Z-Index Conflicts
**Solution**: Establish clear z-index hierarchy, document layer system

### **Challenge**: Settings Synchronization
**Solution**: Create unified settings state management, use observer pattern

### **Challenge**: Mobile Responsiveness
**Solution**: Design mobile-first, test on various screen sizes

## **Testing Strategy**

### **Unit Testing**
- Settings persistence (save/load)
- Volume synchronization between systems
- Default value handling
- Error conditions

### **Integration Testing**  
- Settings panel behavior across UI transitions
- Volume controls affecting both sound systems
- Settings persistence across browser sessions

### **User Testing**
- Gear icon discoverability
- Settings panel usability
- Audio control responsiveness

## **Success Criteria**

### **Phase 1 Success**
- [ ] Gear icon is visible and accessible from both UIs
- [ ] Settings panel opens/closes smoothly
- [ ] Volume controls work identically to current system
- [ ] Settings persist across browser sessions
- [ ] No audio functionality regression

### **Overall Success**
- [ ] All current functionality maintained
- [ ] Improved user experience over current volume button
- [ ] Framework ready for future setting additions
- [ ] Clean, maintainable code architecture
- [ ] Comprehensive documentation

## **Future Considerations**

### **Potential New Settings Categories**
- **Accessibility**: Color blind support, high contrast mode
- **Performance**: Reduce animations, lower quality mode
- **User Interface**: Theme selection, layout preferences
- **Gameplay**: Difficulty settings, tutorial toggles

### **Advanced Features**
- **Settings Profiles**: Save/load different configuration sets
- **Cloud Sync**: Synchronize settings across devices
- **Settings Import/Export**: Share configurations between users
- **Administrative**: Developer/debug options

## **Next Steps**

1. **Review and Approve Plan**: Get stakeholder approval for approach
2. **Create SettingsManager.js**: Implement Phase 1 functionality
3. **Modify SoundManager.js**: Remove volume UI, add integration methods
4. **Test Integration**: Ensure no regression in existing functionality
5. **Iterate and Expand**: Add additional settings categories as needed

---

**Document Status**: Planning Complete  
**Ready for Implementation**: Pending Approval  
**Estimated Development Time**: Phase 1 (1-2 days), Phase 2 (1 day), Phase 3 (2-3 days)
