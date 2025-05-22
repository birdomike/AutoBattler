/**
 * Settings Manager
 * Manages all game settings with a persistent gear icon and expandable panel
 * Replaces the standalone volume button with a comprehensive settings system
 * 
 * @version 1.0.0 - Phase 1 Implementation
 */

class SettingsManager {
    /**
     * Create a new Settings Manager
     */
    constructor() {
        this.settings = {
            audio: {
                masterVolume: 0.5,
                muted: false,
                soundEffectsEnabled: true,
                musicEnabled: true
            }
        };
        
        this.isOpen = false;
        this.gearIcon = null;
        this.settingsPanel = null;
        this.container = null;
        
        // Load saved settings
        this.loadSettings();
        
        // Create the UI
        this.createSettingsUI();
        
        // Sync with existing sound systems
        this.syncSoundSystems();
        
        console.log('SettingsManager initialized');
    }
    
    /**
     * Create the main settings UI container
     */
    createSettingsUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'settings-controls';
        this.container.style.position = 'fixed';
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        this.container.style.zIndex = '1001'; // Above the old volume button
        
        // Create gear icon
        this.createGearIcon();
        
        // Create settings panel (initially hidden)
        this.createSettingsPanel();
        
        // Add to document
        document.body.appendChild(this.container);
        
        // Set up outside click handler
        this.setupOutsideClickHandler();
    }
    
    /**
     * Create the persistent gear icon
     */
    createGearIcon() {
        this.gearIcon = document.createElement('button');
        this.gearIcon.className = 'settings-gear-icon';
        this.gearIcon.innerHTML = '⚙️';
        this.gearIcon.title = 'Settings';
        
        // Styling
        Object.assign(this.gearIcon.style, {
            background: 'rgba(0, 0, 0, 0.7)',
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            fontSize: '24px',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
        });
        
        // Hover effects
        this.gearIcon.addEventListener('mouseenter', () => {
            this.gearIcon.style.background = 'rgba(0, 0, 0, 0.9)';
            this.gearIcon.style.transform = 'scale(1.1)';
        });
        
        this.gearIcon.addEventListener('mouseleave', () => {
            this.gearIcon.style.background = 'rgba(0, 0, 0, 0.7)';
            this.gearIcon.style.transform = 'scale(1)';
        });
        
        // Click handler
        this.gearIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSettingsPanel();
        });
        
        this.container.appendChild(this.gearIcon);
    }
    
    /**
     * Create the expandable settings panel
     */
    createSettingsPanel() {
        this.settingsPanel = document.createElement('div');
        this.settingsPanel.className = 'settings-panel';
        
        // Styling
        Object.assign(this.settingsPanel.style, {
            position: 'absolute',
            top: '60px',
            right: '0',
            width: '300px',
            background: 'rgba(0, 0, 0, 0.95)',
            border: '2px solid #444',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 5px 20px rgba(0, 0, 0, 0.5)',
            display: 'none',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
        });
        
        // Add header
        const header = document.createElement('h3');
        header.textContent = 'Settings';
        header.style.margin = '0 0 20px 0';
        header.style.color = '#fff';
        header.style.textAlign = 'center';
        header.style.borderBottom = '1px solid #666';
        header.style.paddingBottom = '10px';
        this.settingsPanel.appendChild(header);
        
        // Create audio section
        this.createAudioSection();
        
        this.container.appendChild(this.settingsPanel);
    }
    
    /**
     * Create the audio controls section
     */
    createAudioSection() {
        const audioSection = document.createElement('div');
        audioSection.className = 'settings-section audio-section';
        audioSection.style.marginBottom = '20px';
        
        // Section header
        const sectionHeader = document.createElement('h4');
        sectionHeader.innerHTML = '🔊 Audio Settings';
        sectionHeader.style.margin = '0 0 15px 0';
        sectionHeader.style.color = '#fff';
        sectionHeader.style.fontSize = '16px';
        audioSection.appendChild(sectionHeader);
        
        // Master volume control
        this.createVolumeControl(audioSection);
        
        // Mute toggle
        this.createMuteToggle(audioSection);
        
        // Sound effects toggle (for future use)
        this.createSoundEffectsToggle(audioSection);
        
        this.settingsPanel.appendChild(audioSection);
    }
    
    /**
     * Create master volume control
     */
    createVolumeControl(parent) {
        const volumeContainer = document.createElement('div');
        volumeContainer.style.marginBottom = '15px';
        
        const label = document.createElement('label');
        label.textContent = 'Master Volume';
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        label.style.color = '#ccc';
        label.style.fontSize = '14px';
        volumeContainer.appendChild(label);
        
        const sliderContainer = document.createElement('div');
        sliderContainer.style.display = 'flex';
        sliderContainer.style.alignItems = 'center';
        sliderContainer.style.gap = '10px';
        
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = this.settings.audio.masterVolume * 100;
        volumeSlider.style.flex = '1';
        volumeSlider.style.cursor = 'pointer';
        
        const volumeLabel = document.createElement('span');
        volumeLabel.textContent = Math.round(this.settings.audio.masterVolume * 100) + '%';
        volumeLabel.style.minWidth = '40px';
        volumeLabel.style.color = '#fff';
        volumeLabel.style.fontSize = '14px';
        
        // Event listener
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.settings.audio.masterVolume = volume;
            volumeLabel.textContent = Math.round(volume * 100) + '%';
            this.syncSoundSystems();
            this.saveSettings();
        });
        
        sliderContainer.appendChild(volumeSlider);
        sliderContainer.appendChild(volumeLabel);
        volumeContainer.appendChild(sliderContainer);
        parent.appendChild(volumeContainer);
        
        this.volumeSlider = volumeSlider;
        this.volumeLabel = volumeLabel;
    }
    
    /**
     * Create mute toggle
     */
    createMuteToggle(parent) {
        const muteContainer = document.createElement('div');
        muteContainer.style.marginBottom = '15px';
        muteContainer.style.display = 'flex';
        muteContainer.style.alignItems = 'center';
        muteContainer.style.gap = '10px';
        
        const muteButton = document.createElement('button');
        muteButton.innerHTML = this.settings.audio.muted ? '🔇' : '🔊';
        muteButton.style.background = 'rgba(255, 255, 255, 0.1)';
        muteButton.style.border = '1px solid #666';
        muteButton.style.borderRadius = '5px';
        muteButton.style.color = 'white';
        muteButton.style.fontSize = '20px';
        muteButton.style.width = '40px';
        muteButton.style.height = '40px';
        muteButton.style.cursor = 'pointer';
        muteButton.style.display = 'flex';
        muteButton.style.alignItems = 'center';
        muteButton.style.justifyContent = 'center';
        muteButton.title = this.settings.audio.muted ? 'Unmute' : 'Mute';
        
        const muteLabel = document.createElement('span');
        muteLabel.textContent = this.settings.audio.muted ? 'Unmute Audio' : 'Mute Audio';
        muteLabel.style.color = '#ccc';
        muteLabel.style.fontSize = '14px';
        
        // Event listener
        muteButton.addEventListener('click', () => {
            this.settings.audio.muted = !this.settings.audio.muted;
            muteButton.innerHTML = this.settings.audio.muted ? '🔇' : '🔊';
            muteButton.title = this.settings.audio.muted ? 'Unmute' : 'Mute';
            muteLabel.textContent = this.settings.audio.muted ? 'Unmute Audio' : 'Mute Audio';
            this.syncSoundSystems();
            this.saveSettings();
        });
        
        // Hover effects
        muteButton.addEventListener('mouseenter', () => {
            muteButton.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        muteButton.addEventListener('mouseleave', () => {
            muteButton.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        
        muteContainer.appendChild(muteButton);
        muteContainer.appendChild(muteLabel);
        parent.appendChild(muteContainer);
        
        this.muteButton = muteButton;
        this.muteLabel = muteLabel;
    }
    
    /**
     * Create sound effects toggle (placeholder for future expansion)
     */
    createSoundEffectsToggle(parent) {
        const sfxContainer = document.createElement('div');
        sfxContainer.style.marginBottom = '10px';
        sfxContainer.style.display = 'flex';
        sfxContainer.style.alignItems = 'center';
        sfxContainer.style.gap = '10px';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = this.settings.audio.soundEffectsEnabled;
        checkbox.style.cursor = 'pointer';
        
        const label = document.createElement('label');
        label.textContent = 'Sound Effects';
        label.style.color = '#ccc';
        label.style.fontSize = '14px';
        label.style.cursor = 'pointer';
        
        // Event listener
        checkbox.addEventListener('change', (e) => {
            this.settings.audio.soundEffectsEnabled = e.target.checked;
            this.saveSettings();
            // Future: sync with sound systems for granular control
        });
        
        label.addEventListener('click', () => {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });
        
        sfxContainer.appendChild(checkbox);
        sfxContainer.appendChild(label);
        parent.appendChild(sfxContainer);
    }
    
    /**
     * Toggle the settings panel visibility
     */
    toggleSettingsPanel() {
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.settingsPanel.style.display = 'block';
            // Add entrance animation
            this.settingsPanel.style.opacity = '0';
            this.settingsPanel.style.transform = 'translateY(-10px)';
            
            requestAnimationFrame(() => {
                this.settingsPanel.style.transition = 'all 0.3s ease';
                this.settingsPanel.style.opacity = '1';
                this.settingsPanel.style.transform = 'translateY(0)';
            });
        } else {
            this.settingsPanel.style.transition = 'all 0.3s ease';
            this.settingsPanel.style.opacity = '0';
            this.settingsPanel.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                this.settingsPanel.style.display = 'none';
            }, 300);
        }
    }
    
    /**
     * Set up outside click handler to close panel
     */
    setupOutsideClickHandler() {
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.container.contains(e.target)) {
                this.toggleSettingsPanel();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.toggleSettingsPanel();
            }
        });
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('autobattler_settings', JSON.stringify(this.settings));
            console.log('Settings saved to localStorage');
        } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('autobattler_settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                // Merge with defaults to ensure all properties exist
                this.settings = {
                    audio: {
                        ...this.settings.audio,
                        ...parsed.audio
                    }
                };
                console.log('Settings loaded from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
        }
    }
    
    /**
     * Sync with existing sound systems
     */
    syncSoundSystems() {
        // Sync with legacy SoundManager if available
        if (window.soundManager) {
            if (typeof window.soundManager.setMasterVolume === 'function') {
                window.soundManager.setMasterVolume(this.settings.audio.masterVolume);
            } else {
                // Fallback for legacy SoundManager
                window.soundManager.volume = this.settings.audio.masterVolume;
            }
            
            if (typeof window.soundManager.setMuted === 'function') {
                window.soundManager.setMuted(this.settings.audio.muted);
            } else {
                // Fallback for legacy SoundManager
                window.soundManager.muted = this.settings.audio.muted;
            }
        }
        
        // Sync with PhaserSoundManager if available
        // This will be expanded when we have better integration
        console.log('Sound systems synced with settings');
    }
    
    /**
     * Add a new settings section (framework for future expansion)
     */
    addSettingSection(sectionConfig) {
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.style.marginBottom = '20px';
        
        const header = document.createElement('h4');
        header.innerHTML = sectionConfig.icon + ' ' + sectionConfig.title;
        header.style.margin = '0 0 15px 0';
        header.style.color = '#fff';
        header.style.fontSize = '16px';
        section.appendChild(header);
        
        // Add section content based on config
        if (sectionConfig.content && typeof sectionConfig.content === 'function') {
            sectionConfig.content(section);
        }
        
        this.settingsPanel.appendChild(section);
        return section;
    }
    
    /**
     * Get current setting value
     */
    getSetting(category, key) {
        return this.settings[category] && this.settings[category][key];
    }
    
    /**
     * Set setting value
     */
    setSetting(category, key, value) {
        if (!this.settings[category]) {
            this.settings[category] = {};
        }
        this.settings[category][key] = value;
        this.saveSettings();
        this.syncSoundSystems();
    }
    
    /**
     * Get master volume
     */
    getMasterVolume() {
        return this.settings.audio.masterVolume;
    }
    
    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.settings.audio.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.volumeSlider) {
            this.volumeSlider.value = this.settings.audio.masterVolume * 100;
        }
        if (this.volumeLabel) {
            this.volumeLabel.textContent = Math.round(this.settings.audio.masterVolume * 100) + '%';
        }
        this.syncSoundSystems();
        this.saveSettings();
    }
    
    /**
     * Get mute state
     */
    isMuted() {
        return this.settings.audio.muted;
    }
    
    /**
     * Set mute state
     */
    setMuted(muted) {
        this.settings.audio.muted = muted;
        if (this.muteButton) {
            this.muteButton.innerHTML = muted ? '🔇' : '🔊';
            this.muteButton.title = muted ? 'Unmute' : 'Mute';
        }
        if (this.muteLabel) {
            this.muteLabel.textContent = muted ? 'Unmute Audio' : 'Mute Audio';
        }
        this.syncSoundSystems();
        this.saveSettings();
    }
    
    /**
     * Toggle mute state
     */
    toggleMute() {
        this.setMuted(!this.settings.audio.muted);
        return this.settings.audio.muted;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // Remove event listeners
        document.removeEventListener('click', this.outsideClickHandler);
        document.removeEventListener('keydown', this.escapeKeyHandler);
        
        console.log('SettingsManager destroyed');
    }
}

// Make it available globally
window.SettingsManager = SettingsManager;
