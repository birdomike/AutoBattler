/**
 * TeamBuilderImageLoader.js
 * Loads and injects character art into the Team Builder UI
 * Based on the existing DirectImageLoader.js functionality
 */

// Create a global cache for character images that persists beyond class instances
window.CHARACTER_IMAGE_CACHE = window.CHARACTER_IMAGE_CACHE || {};

class TeamBuilderImageLoader {
    constructor() {
        this.characterData = null;
        this.processedContainers = new WeakSet(); // Track processed containers to avoid reprocessing
        this.loadedCharacters = new Set(); // Track which characters already have art loaded
        this.cachedImages = new Map(); // NEW: Cache for character images to prevent flickering
        this.checkInterval = 2000; // Check every 2 seconds (reduced frequency)
        this.imageCheckTimer = null;
        this.debugMode = false; // Control logging verbosity
        this.lastProcessTime = Date.now();
        this.characterImages = {
            'Aqualia': 'assets/images/Character Art/Aqualia.png',
            'Drakarion': 'assets/images/Character Art/Drakarion.png',
            'Zephyr': 'assets/images/Character Art/Zephyr.png',
            'Lumina': 'assets/images/Character Art/Lumina.png',
            'Sylvanna': 'assets/images/Character Art/Sylvanna.png',
            'Vaelgor': 'assets/images/Character Art/Vaelgor.png',
            'Caste': 'assets/images/Character Art/Caste.png',
            'Nyria': 'assets/images/Character Art/Nyria.PNG'
        };
    }

    /**
    * Initialize the image loader
    */
/**
 * Initialize the image loader
 * @returns {Promise} A promise that resolves when initialization is complete
 */
async initialize() {
    console.log('TeamBuilderImageLoader: Initializing...');
    
    // Load character data
    try {
        const response = await fetch('data/characters.json');
        this.characterData = await response.json();
        console.log('TeamBuilderImageLoader: Character data loaded');
    } catch (err) {
        console.error('TeamBuilderImageLoader: Failed to load character data', err);
        this.characterData = { characters: [] }; // Empty fallback
    }
    
    // Start periodic checking for new character elements
    this.startImageCheck();
    
    // Do an initial check with debug enabled
    console.log('TeamBuilderImageLoader: Performing initial detailed check...');
    this.forceCheck(true);
    
    // Preload all character images immediately and return the promise
    // This allows callers to await the completion of image preloading
    return this.preloadCharacterImages();
}
    
    /**
     * Preload and cache all available character images
     * @returns {Promise} A promise that resolves when all images are loaded (or failed to load)
     */
    preloadCharacterImages() {
        console.log('TeamBuilderImageLoader: Preloading all character images...');
        
        // Get all characters that have images defined
        const charactersWithArt = Object.keys(this.characterImages);
        if (charactersWithArt.length === 0) {
            console.warn('TeamBuilderImageLoader: No character images defined');
            return Promise.resolve(); // Return a resolved promise immediately
        }
        
        // Create an array of promises, one for each image to load
        const loadPromises = charactersWithArt.map(characterName => {
            return new Promise((resolve) => {
                try {
                    const imagePath = this.characterImages[characterName];
                    if (!imagePath) {
                        console.warn(`TeamBuilderImageLoader: No image path defined for ${characterName}`);
                        return resolve(); // Resolve this promise immediately
                    }
                    
                    console.log(`TeamBuilderImageLoader: Preloading ${characterName}'s image...`);
                    
                    // Create a new image element
                    const img = new Image();
                    
                    // Set up onload and onerror handlers
                    img.onload = () => {
                        // Store in global cache
                        window.CHARACTER_IMAGE_CACHE[characterName] = img;
                        console.log(`TeamBuilderImageLoader: ${characterName}'s image preloaded and stored in global cache`);
                        
                        // Also store in instance cache
                        this.cachedImages.set(characterName, img);
                        this.loadedCharacters.add(characterName);
                        
                        // Resolve this image's promise
                        resolve();
                    };
                    
                    // Handle image load errors
                    img.onerror = (err) => {
                        console.error(`TeamBuilderImageLoader: Failed to load ${characterName}'s image:`, err);
                        // Still resolve the promise to avoid blocking other images
                        resolve();
                    };
                    
                    // Set the source to trigger loading
                    img.src = imagePath;
                } catch (err) {
                    console.error(`TeamBuilderImageLoader: Error preloading ${characterName}'s image`, err);
                    // Resolve even on error to keep the Promise.all moving
                    resolve();
                }
            });
        });
        
        // Return a promise that resolves when ALL images are loaded
        return Promise.all(loadPromises).then(() => {
            console.log('TeamBuilderImageLoader: All character images have been processed');
            
            // Set up mutation observer if not already set up
            if (typeof window.setupCharacterArtMutationObserver === 'function') {
                window.setupCharacterArtMutationObserver();
            }
        });
    }
    


    /**
     * Start periodically checking for character elements that need art
     */
    startImageCheck() {
        // Clear any existing timer
        if (this.imageCheckTimer) {
            clearInterval(this.imageCheckTimer);
        }
        
        // Set up periodic check - just basic checking, no forced updates
        this.imageCheckTimer = setInterval(() => {
            this.checkAndLoadImages();
        }, this.checkInterval);
        
        // Run an immediate check
        this.checkAndLoadImages();
    }

    /**
     * Check for character elements and load images if needed
     */
    checkAndLoadImages() {
        // Throttle checks to prevent excessive processing
        const now = Date.now();
        if (now - this.lastProcessTime < 500) { // minimum 500ms between full checks
            return;
        }
        this.lastProcessTime = now;
        
        // Find all character containers EXCEPT the detail container
        // We now handle detail container separately to avoid observer issues
        const containers = document.querySelectorAll('.hero-avatar-container:not(.detail-icon-container)');
        
        if (this.debugMode) {
            console.log(`TeamBuilderImageLoader: Checking ${containers.length} avatar containers`);
        }
        
        // First pass: immediately hide all circles where art is available
        containers.forEach(container => {
            const characterName = container.dataset.characterName;
            if (characterName && this.characterImages[characterName]) {
                // This character has art available, immediately hide the circle
                const avatarCircle = container.querySelector('.hero-avatar, .detail-icon');
                if (avatarCircle) {
                    avatarCircle.style.display = 'none';
                    avatarCircle.style.backgroundColor = 'transparent';
                    avatarCircle.textContent = ''; // Clear any letter placeholders
                }
                
                // Add the has-art class to the container for CSS targeting
                container.classList.add('has-art');
            }
        });
        
        // Now process containers that need art
        let artLoadedInThisPass = false;
        
        containers.forEach(container => {
            // Always process detail view containers, otherwise check if already processed
            const isDetailView = container.classList.contains('detail-icon-container');
            if (!isDetailView && this.processedContainers.has(container)) {
                return;
            }
            
            const characterId = container.dataset.characterId;
            const characterName = container.dataset.characterName;
            
            // Skip if no character ID
            if (!characterId) return;
            
            // Process and load art for this character if needed
            if (this.loadCharacterArt(container, characterId, characterName)) {
                artLoadedInThisPass = true;
            }
        });
        
        // Report if we actually loaded art in this pass (helps with debugging)
        if (artLoadedInThisPass && this.debugMode) {
            console.log('TeamBuilderImageLoader: New art was loaded in this check pass');
        }
    }

    /**
     * Load art for a specific character
     * @returns {boolean} Whether new art was loaded
     */
    loadCharacterArt(container, characterId, characterName) {
        // Special handling for character details view
        const isDetailView = container.classList.contains('detail-icon-container');
        
        // If this is the detail view, always process it (even if processed before)
        // This helps ensure the art is always shown in the character details panel
        if (!isDetailView) {
            // For non-detail views, mark container as processed to avoid multiple attempts
            this.processedContainers.add(container);
        }
        
        // Check if this character has art defined
        if (!this.characterImages[characterName]) {
            if (this.debugMode) {
                console.log(`TeamBuilderImageLoader: No art defined for ${characterName}`);
            }
            
            // Don't add placeholders anymore - just return false and let containers be invisible
            return false; // No art defined
        }
        
        // Critical: If character is already loaded, just make sure container is properly styled
        if (this.loadedCharacters.has(characterName)) {
            const artWrapper = container.querySelector('.hero-art-wrapper');
            
            if (artWrapper) {
                artWrapper.style.display = 'block';
                
                // If no inner content in wrapper, we need to add the image
                // (for newly created UI elements)
                if (artWrapper.innerHTML.trim() === '') {
                    this.createAndAddArt(container, characterId, characterName, false);
                    return true; // Consider as new art being added
                }
            }
            
            return false; // No new art loaded
        }
        
        // If we get here, character needs art and hasn't been loaded yet
        return this.createAndAddArt(container, characterId, characterName, true);
    }

    /**
    * Draw character art in a container - Primary art drawing function
    * @param {Object} character - Character object with art settings
    * @param {HTMLElement} container - DOM element to contain the art
    * @param {boolean} isDetailViewContext - Whether this is a detail view
    * @param {string} viewMode - The current view mode ('full' or 'compact')
    * @returns {boolean} Whether the art was successfully added
     */
    drawArt(character, container, isDetailViewContext, viewMode = 'full') {
    if (!character || !container) {
    console.error('TeamBuilderImageLoader: Missing character or container for drawArt');
      return false;
    }
    
    try {
    const characterName = character.name;
    
    // Skip if character has no defined image
    if (!this.characterImages[characterName]) {
    console.log(`TeamBuilderImageLoader: No image defined for ${characterName}`);
      return false;
    }
    
    // If image not in cache, attempt to load it immediately
    if (!window.CHARACTER_IMAGE_CACHE[characterName]) {
    console.log(`TeamBuilderImageLoader: ${characterName} not found in image cache, loading now...`);
    // Create and load the image immediately
    const img = new Image();
    img.onload = () => {
    window.CHARACTER_IMAGE_CACHE[characterName] = img;
    console.log(`TeamBuilderImageLoader: ${characterName}'s image loaded on-demand`);
    // Force redraw now that the image is loaded
      this.drawArt(character, container, isDetailViewContext, viewMode);
    };
    img.src = this.characterImages[characterName];
    
    // Show loading indicator in the meantime
    this.drawLoadingPlaceholder(container, isDetailViewContext);
      return true;
      }

    // Find or create art wrapper
    let artWrapper = container.querySelector('.hero-art-wrapper');
    if (!artWrapper) {
    artWrapper = document.createElement('div');
    artWrapper.className = 'hero-art-wrapper';
      container.appendChild(artWrapper);
    }
    
    // ALWAYS clear any existing art from the wrapper
    artWrapper.innerHTML = '';
    
    // Clone image from cache
    const img = window.CHARACTER_IMAGE_CACHE[characterName].cloneNode(true);
    
    // Determine the correct art settings based on context
    let artSettings;
    if (isDetailViewContext) {
    // Detail view - use special positioning (unchanged)
      artSettings = character.detailArt || character.teamBuilderArt || character.art || {};
    } else {
    // Regular view - determine if we should use enhanced sizing based on view mode
    artSettings = {...(character.teamBuilderArt || character.art || {})};
    
    // Apply 1.4x scaling only in full view mode
    if (viewMode === 'full') {
    // Scale up the art by about 40% for full view
    if (artSettings.width) {
      const originalWidth = parseInt(artSettings.width);
        if (!isNaN(originalWidth)) {
          artSettings.width = `${Math.round(originalWidth * 1.4)}px`;
        }
    }
    
    if (artSettings.height) {
      const originalHeight = parseInt(artSettings.height);
        if (!isNaN(originalHeight)) {
            artSettings.height = `${Math.round(originalHeight * 1.4)}px`;
          }
        }
      }
      // In compact view, we use the original size
    }
    
    // Set image properties
    img.className = 'character-art team-builder-art';
    img.alt = characterName;
    
    // Apply position settings with proper defaults
    img.style.position = 'absolute';
    img.style.left = artSettings.left || '0px';
    img.style.top = artSettings.top || '0px';
    
    // Apply width and height with context-sensitive defaults
    if (isDetailViewContext) {
      img.style.width = artSettings.width || '140px';
        img.style.height = artSettings.height || '140px';
      } else {
        img.style.width = artSettings.width || (viewMode === 'full' ? '80px' : '60px');
        img.style.height = artSettings.height || (viewMode === 'full' ? '120px' : '90px');
      }
            
            // Store original positions for animation handling
            img.dataset.originalLeft = artSettings.left || '0px';
            img.dataset.originalTop = artSettings.top || '0px';
            
            // Add the image to the wrapper
            artWrapper.appendChild(img);
            artWrapper.style.display = 'block';
            
            // Add appropriate classes to container and parent elements
            container.classList.add('has-art');
            
            // Add has-art to the parent card/content element if it exists
            const heroCard = container.closest('.hero-card');
            if (heroCard) heroCard.classList.add('has-art');
            
            const slotContent = container.closest('.slot-content');
            if (slotContent) slotContent.classList.add('has-art');
            
            const detailHero = container.closest('.detail-hero');
            if (detailHero) detailHero.classList.add('has-art');
            
            console.log(`TeamBuilderImageLoader: Drew art for ${characterName}${isDetailViewContext ? ' (detail view)' : ''}`);
            return true;
            
        } catch (err) {
            console.error(`TeamBuilderImageLoader: Error drawing art for ${character.name}`, err);
            return false;
        }
    }
    
    /**
     * Create and add character art to a container (Legacy method, now a wrapper for drawArt)
     * @param {HTMLElement} container - The container element
     * @param {string} characterId - Character ID
     * @param {string} characterName - Character name
     * @param {boolean} isFirstLoad - Whether this is the first time loading this character
     * @returns {boolean} Whether the art was successfully added
     */
    async createAndAddArt(container, characterId, characterName, isFirstLoad) {
        // Find character data
        const character = this.findCharacterData(characterId, characterName);
        if (!character) {
            console.log(`TeamBuilderImageLoader: Character data not found for ${characterName}`);
            return false;
        }
        
        // Determine if this is a detail view
        const isDetailView = container.classList.contains('detail-icon-container');
        
        // Use the new drawArt method
        return this.drawArt(character, container, isDetailView);
    }

    /**
     * Find character data by ID or name
     */
    findCharacterData(id, name) {
        if (!this.characterData || !this.characterData.characters) {
            return null;
        }
        
        // Try to find by ID first
        let character = this.characterData.characters.find(c => c.id == id);
        
        // Fall back to finding by name
        if (!character && name) {
            character = this.characterData.characters.find(c => 
                c.name.toLowerCase() === name.toLowerCase()
            );
        }
        
        return character;
    }

    /**
     * Manually trigger a check for new images (DEPRECATED - Use drawArt instead)
     * @param {boolean} debug - Enable debug output
     * @param {boolean} resetCache - Whether to reset the processed containers cache
     */
    forceCheck(debug = false, resetCache = false) {
        // This method is now deprecated - use drawArt instead
        console.warn("TeamBuilderImageLoader: forceCheck is deprecated. Use drawArt instead.");
        
        if (debug) {
            console.log("TeamBuilderImageLoader: forceCheck is now a no-op. Use drawArt to explicitly render character art.");
        }
        
        // No-op - art is now explicitly managed
        return;
    }

    /**
     * Check if an image exists
     */
    async checkImageExists(imagePath) {
        try {
            const response = await fetch(imagePath, { method: 'HEAD' });
            return response.ok;
        } catch (err) {
            return false;
        }
    }

    /**
     * Draw a loading placeholder while waiting for image to load
     * @param {HTMLElement} container - DOM element to contain the placeholder
     * @param {boolean} isDetailViewContext - Whether this is a detail view
     */
    drawLoadingPlaceholder(container, isDetailViewContext) {
        try {
            // Find or create art wrapper
            let artWrapper = container.querySelector('.hero-art-wrapper');
            if (!artWrapper) {
                artWrapper = document.createElement('div');
                artWrapper.className = 'hero-art-wrapper';
                container.appendChild(artWrapper);
            }
            
            // Clear the wrapper
            artWrapper.innerHTML = '';
            
            // Create loading placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'loading-placeholder';
            placeholder.style.position = 'absolute';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            
            // Set size based on context
            if (isDetailViewContext) {
                placeholder.style.width = '140px';
                placeholder.style.height = '140px';
            } else {
                placeholder.style.width = '80px';
                placeholder.style.height = '120px';
            }
            
            // Add loading text or spinner
            placeholder.textContent = 'Loading...';
            
            // Add to wrapper
            artWrapper.appendChild(placeholder);
            
            // Show the wrapper
            artWrapper.style.display = 'block';
        } catch (err) {
            console.error('TeamBuilderImageLoader: Error creating loading placeholder', err);
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.imageCheckTimer) {
            clearInterval(this.imageCheckTimer);
            this.imageCheckTimer = null;
        }
    }
}

// Export the class
// Disabled MutationObserver - No longer using observer-based approach
window.setupCharacterArtMutationObserver = function() {
    // First, completely disconnect any existing observer to ensure clean slate
    if (window.characterArtObserver) {
        window.characterArtObserver.disconnect();
        window.characterArtObserver = null;
        console.log('Disconnected existing character art observer');
    }
    
    console.log('MutationObserver for character art is permanently disabled');
    
    // Set the disabled flag to true permanently
    window.observerDisabled = true;
};

// Utility functions are now no-op (disabled permanently)
window.disableArtObserver = function() {
    // No-op function - observer is permanently disabled
};

// Utility to re-enable observer - also a no-op now
window.enableArtObserver = function() {
    // No-op function - observer is permanently disabled
};

window.TeamBuilderImageLoader = TeamBuilderImageLoader;
