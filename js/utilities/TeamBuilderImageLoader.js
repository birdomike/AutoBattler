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
    setTimeout(() => {
    console.log('TeamBuilderImageLoader: Performing initial detailed check...');
    this.forceCheck(true);
    
    // Preload all character images immediately
    this.preloadCharacterImages();
    }, 1000);
}
    
    /**
     * Preload and cache all available character images
     */
    async preloadCharacterImages() {
        console.log('TeamBuilderImageLoader: Preloading all character images...');
        
        // Get all characters that have images defined
        const charactersWithArt = Object.keys(this.characterImages);
        if (charactersWithArt.length === 0) {
            console.warn('TeamBuilderImageLoader: No character images defined');
            return;
        }
        
        // Preload each character's image
        for (const characterName of charactersWithArt) {
            try {
                const imagePath = this.characterImages[characterName];
                if (!imagePath) continue;
                
                console.log(`TeamBuilderImageLoader: Preloading ${characterName}'s image...`);
                
                // Create a new image element
                const img = new Image();
                
                // Set up onload handler
                img.onload = () => {
                    // Store in global cache
                    window.CHARACTER_IMAGE_CACHE[characterName] = img;
                    console.log(`TeamBuilderImageLoader: ${characterName}'s image preloaded and stored in global cache`);
                    
                    // Set up mutation observer if not already set up
                    if (typeof window.setupCharacterArtMutationObserver === 'function') {
                        window.setupCharacterArtMutationObserver();
                    }
                    
                    // Also store in instance cache
                    this.cachedImages.set(characterName, img);
                    this.loadedCharacters.add(characterName);
                };
                
                // Set the source to trigger loading
                img.src = imagePath;
            } catch (err) {
                console.error(`TeamBuilderImageLoader: Error preloading ${characterName}'s image`, err);
            }
        }
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
     * Create and add character art to a container
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
        
        // Check if the wrapper exists
        const artWrapper = container.querySelector('.hero-art-wrapper');
        
        if (!artWrapper) {
            console.error('TeamBuilderImageLoader: No art wrapper found for', characterName);
            return false;
        }
        
        // Try to load the image
        try {
            const imagePath = this.characterImages[characterName];
            
            // Check if we already have a cached image for this character
            let img;
            if (this.cachedImages.has(characterName)) {
                // Use the cached image data to create a new image element
                img = this.cachedImages.get(characterName).cloneNode(true);
                console.log(`TeamBuilderImageLoader: Using cached image for ${characterName}`);
            } else {
                // Load the image for the first time
                const imageExists = await this.checkImageExists(imagePath);
                
                if (!imageExists) {
                    console.log(`TeamBuilderImageLoader: No image found for ${characterName}`);
                    return false;
                }
                
                // Create a new image element
                img = document.createElement('img');
                img.src = imagePath;
                img.onload = () => {
                    // Cache the loaded image for future use
                    this.cachedImages.set(characterName, img.cloneNode(true));
                    
                    // Also store in global cache for persistent access
                    window.CHARACTER_IMAGE_CACHE[characterName] = img.cloneNode(true);
                    console.log(`TeamBuilderImageLoader: Added ${characterName} to global image cache`);
                    
                    // Set up mutation observer if not already set up
                    if (typeof window.setupCharacterArtMutationObserver === 'function') {
                        window.setupCharacterArtMutationObserver();
                    }
                    
                    console.log(`TeamBuilderImageLoader: Cached image for ${characterName}`);
                };
            }
            
            // Determine if this is a detail view
            const isDetailView = container.classList.contains('detail-icon-container');
            
            // Use teamBuilderArt if available, otherwise fall back to regular art
            let artSettings;
            
            if (isDetailView) {
                // For detail view, use special positioning
                artSettings = character.detailArt || character.teamBuilderArt || character.art || {};
                
                // If no specific settings, use these defaults for detail view
                if (!artSettings.left) artSettings.left = '-30px';
                if (!artSettings.top) artSettings.top = '-45px';
                if (!artSettings.width) artSettings.width = '140px';
                if (!artSettings.height) artSettings.height = '140px';
            } else {
                // Regular view
                artSettings = character.teamBuilderArt || character.art || {};
            }
            
            // Set image properties
            img.className = 'character-art team-builder-art';
            img.alt = characterName;
            
            // Apply position settings
            img.style.position = 'absolute';
            img.style.left = artSettings.left || '0px';
            img.style.top = artSettings.top || '0px';
            
            if (artSettings.width) {
                img.style.width = artSettings.width;
            }
            
            if (artSettings.height) {
                img.style.height = artSettings.height;
            }
            
            // Store original positions for animation handling
            img.dataset.originalLeft = artSettings.left || '0px';
            img.dataset.originalTop = artSettings.top || '0px';
            
            // PRESERVE EXISTING ART: Check if art already exists before replacing
            const existingArt = artWrapper.querySelector('.character-art');
            if (!existingArt) {
                // Only clear and add if there's no existing art
                artWrapper.innerHTML = '';
                artWrapper.appendChild(img);
            }
            
            artWrapper.style.display = 'block';
            
            // Set all parent elements with appropriate classes
            container.classList.add('has-art'); // Mark container as having art
            
            // Add has-art to the parent card/content element if it exists
            const heroCard = container.closest('.hero-card');
            if (heroCard) heroCard.classList.add('has-art');
            
            const slotContent = container.closest('.slot-content');
            if (slotContent) slotContent.classList.add('has-art');
            
            const detailHero = container.closest('.detail-hero');
            if (detailHero) detailHero.classList.add('has-art');
            
            // Record that we've loaded this character's art
            // This is important to avoid reloading across different containers
            this.loadedCharacters.add(characterName);
            
            // Always log for detail view to help track issues
            if (isFirstLoad || isDetailView) {
                console.log(`TeamBuilderImageLoader: Loaded art for ${characterName}${isDetailView ? ' (detail view)' : ''}`);
            }
            
            return true;
        } catch (err) {
            console.error(`TeamBuilderImageLoader: Error loading art for ${characterName}`, err);
            return false;
        }
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
     * Manually trigger a check for new images and reset processing cache
     * @param {boolean} debug - Enable debug output
     * @param {boolean} resetCache - Whether to reset the processed containers cache
     */
    forceCheck(debug = false, resetCache = false) {
        // Temporarily enable debug mode if requested
        const prevDebugMode = this.debugMode;
        this.debugMode = debug;
        
        if (debug) {
            console.log("TeamBuilderImageLoader: Force checking images");
        }
        
        // Reset the processed containers cache if requested
        // This will force reprocessing of all containers
        if (resetCache) {
            if (debug) {
                console.log("TeamBuilderImageLoader: Resetting processed containers cache");
            }
            this.processedContainers = new WeakSet();
            this.loadedCharacters = new Set();
        }
        
        // Check for new images
        this.checkAndLoadImages();
        
        // Restore previous debug mode
        this.debugMode = prevDebugMode;
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
// Create DOM observer to ensure character art is never removed
window.setupCharacterArtMutationObserver = function() {
    // First, completely disconnect any existing observer to ensure clean slate
    if (window.characterArtObserver) {
        window.characterArtObserver.disconnect();
        window.characterArtObserver = null;
        console.log('Reset existing character art observer');
    }
    
    console.log('Setting up character art mutation observer');
    
    // Static flag to completely disable observer when needed
    window.observerDisabled = false;
    
    // Throttling variable
    let throttleId = null;
    // Boolean flag to prevent re-entrance
    let isRestoring = false;
    
    // Create a mutation observer to watch for DOM changes
    window.characterArtObserver = new MutationObserver(function(mutations) {
        // Skip if globally disabled or already processing or throttled
        if (window.observerDisabled || isRestoring || throttleId) return;
        
        // Check if any mutation is directly affecting a detail container
        // If so, skip processing entirely
        const shouldSkip = mutations.some(mutation => {
            return mutation.target.closest('.detail-icon-container') !== null;
        });
        
        if (shouldSkip) return;
        
        // Set up throttling with requestAnimationFrame instead of setTimeout
        if (throttleId) return; // already scheduled
        
        throttleId = requestAnimationFrame(() => {
            try {
                // Set isRestoring flag to prevent re-entrance
                isRestoring = true;
                
                // Temporarily disconnect the observer to prevent self-triggering
                window.characterArtObserver.disconnect();
                
                // Use a flag to track if we did any art restoration
                let didRestoreArt = false;
                
                // Process mutations
                mutations.forEach(function(mutation) {
                    // Only process if we have element changes and not in a detail container
                    if ((mutation.type === 'childList' || mutation.type === 'attributes') && 
                        !mutation.target.closest('.detail-icon-container')) {
                        
                        // Check for any character containers that are missing their art
                        // EXPLICITLY EXCLUDE the detail-icon-container to avoid any processing
                        document.querySelectorAll('.hero-avatar-container[data-character-name]:not(.detail-icon-container)').forEach(container => {
                            const characterName = container.dataset.characterName;
                            
                            // Only process if we have this character in our cache
                            if (window.CHARACTER_IMAGE_CACHE[characterName]) {
                                // EARLY EXIT: Skip if art already present
                                if (container.querySelector('.character-art')) return;
                                
                                // EARLY EXIT: Skip if already synced in this animation frame
                                if (container.dataset.artSynced === '1') return;
                                container.dataset.artSynced = '1';
                                
                                // Check if art wrapper exists
                                const artWrapper = container.querySelector('.hero-art-wrapper');
                                
                                // Clean any duplicate arts before proceeding
                                if (artWrapper) {
                                    const extraArts = artWrapper.querySelectorAll('.character-art:not(:first-child)');
                                    extraArts.forEach(el => el.remove());
                                }
                                
                                // If art wrapper is missing, create it
                                let wrapper = artWrapper;
                                if (!wrapper) {
                                    wrapper = document.createElement('div');
                                    wrapper.className = 'hero-art-wrapper';
                                    wrapper.style.display = 'block';
                                    container.appendChild(wrapper);
                                }
                                
                                // Clone from global cache and add
                                const newImg = window.CHARACTER_IMAGE_CACHE[characterName].cloneNode(true);
                                newImg.style.visibility = 'visible';
                                newImg.style.display = 'block';
                                wrapper.appendChild(newImg);
                                
                                // Force proper class hierarchy
                                container.classList.add('has-art');
                                
                                // Add has-art to parent elements
                                const heroCard = container.closest('.hero-card');
                                if (heroCard) heroCard.classList.add('has-art');
                                
                                const slotContent = container.closest('.slot-content');
                                if (slotContent) slotContent.classList.add('has-art');
                                
                                // Track successful restoration
                                const added = true; // Flag to track if we actually added art
                                if (added) console.log(`Restored art for ${characterName}`);
                                didRestoreArt = true;
                            }
                        });
                    }
                });
                
                // Only log if we actually did something
                if (didRestoreArt) {
                    console.log('Observer restored art for some characters');
                }
            } finally {
                // Reset throttle ID
                throttleId = null;
                // Reset isRestoring flag
                isRestoring = false;
                
                // Reconnect the observer after processing
                if (!window.observerDisabled) {
                    // Reconnect only to the targeted containers
                    const targets = document.querySelectorAll('#heroes-grid, #team-slots');
                    targets.forEach(t => window.characterArtObserver.observe(t, {
                        childList: true,
                        subtree: true,
                        attributes: true
                    }));
                }
            }
        }, 50); // Increase throttle to 50ms for more stability
    });

    // Observe only the grids that actually recycle DOM
    const targets = document.querySelectorAll('#heroes-grid, #team-slots');
    targets.forEach(t => window.characterArtObserver.observe(t, {
        childList: true, // Watch for added/removed nodes
        subtree: true,   // Watch the entire subtree
        attributes: true // Watch for attribute changes
    }));
};

// Utility to temporarily disable observer during complex DOM operations
window.disableArtObserver = function() {
    if (window.characterArtObserver) {
        window.observerDisabled = true;
        window.characterArtObserver.disconnect();
        console.log('Character art observer disabled');
    }
};

// Utility to re-enable observer
window.enableArtObserver = function() {
    if (window.characterArtObserver) {
        window.observerDisabled = false;
        // Observe only the necessary containers
        const targets = document.querySelectorAll('#heroes-grid, #team-slots');
        targets.forEach(t => window.characterArtObserver.observe(t, {
            childList: true,
            subtree: true,
            attributes: true
        }));
        console.log('Character art observer re-enabled');
    }
};

window.TeamBuilderImageLoader = TeamBuilderImageLoader;
