/**
 * DebugManager.js
 * Central manager for debug tools and configuration
 */

class DebugManager {
    /**
     * @param {Phaser.Scene} scene - The scene to attach to
     * @param {Object} config - Configuration options
     */
    constructor(scene, config = {}) {
        this.scene = scene;
        
        // Default configuration with sensible presets
        this.config = {
            enabled: config.enabled !== undefined ? config.enabled : true,
            persistSettings: config.persistSettings !== undefined ? config.persistSettings : true,
            storageKey: config.storageKey || 'autobattler_debug_settings',
            showPanel: config.showPanel !== undefined ? config.showPanel : true,
            position: config.position || { x: 10, y: 10 },
            tools: config.tools ||