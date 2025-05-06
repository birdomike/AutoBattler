/**
 * DirectImageLoader.js
 * A special utility to load character images directly from the file system
 * This ensures the image gets loaded even when relative paths aren't working
 */

window.DirectImageLoader = {
    // Base paths to try in order
    basePaths: [
        '',
        '/',
        './',
        '../',
        '../../'
    ],
    
    // Character image lookup table
    characterImages: {
        'Aqualia': 'assets/images/Character Art/Aqualia.png',
        'Drakarion': 'assets/images/Character Art/Drakarion.png',
        'Zephyr': 'assets/images/Character Art/Zephyr.png',
        'Lumina': 'assets/images/Character Art/Lumina.png',
        'Sylvanna': 'assets/images/Character Art/Sylvanna.png',
        'Vaelgor': 'assets/images/Character Art/Vaelgor.png',
        'Caste': 'assets/images/Character Art/Caste.png'
    },
    
    // Store characters data globally
    charactersData: null,
    
    /**
     * Load characters data from JSON
     */
    loadCharactersData: async function() {
        try {
            const response = await fetch('data/characters.json');
            const data = await response.json();
            this.charactersData = data.characters;
            console.log('DirectImageLoader: Loaded characters data', this.charactersData);
        } catch (err) {
            console.error('DirectImageLoader: Failed to load characters.json', err);
        }
    },
    
    /**
     * Get an image element for a character
     * @param {string} characterName - The name of the character
     * @returns {HTMLImageElement} - Image element with the character art
     */
    getCharacterImage: function(characterName) {
        if (!this.characterImages[characterName]) {
            console.error(`No image path defined for character: ${characterName}`);
            return null;
        }
        
        const img = new Image();
        const imagePath = this.characterImages[characterName];
        
        // For debugging, track when the image loads or fails
        img.onload = () => console.log(`SUCCESS: Loaded character image for ${characterName} from ${img.src}`);
        img.onerror = () => console.error(`FAILED: Could not load character image for ${characterName} from ${img.src}`);
        
        // Set the source directly
        img.src = imagePath;
        
        return img;
    },
    
    /**
     * Insert character images directly into the DOM, replacing placeholders
     * This is called automatically when the page loads
     */
    injectCharacterImages: function() {
        // Check if we're in a battle screen
        const battleUI = document.getElementById('battle-ui');
        if (!battleUI) return;
        
        // SKIP if there's any active animation in progress
        const activeAnimations = document.querySelectorAll('.character-moving, [id^="clone-"]');
        if (activeAnimations.length > 0) {
            console.log('DirectImageLoader: Skipping image injection during active animation');
            return;
        }
        
        console.log('DirectImageLoader: Checking for character circles to replace with images');
        
        // Look for characters that should have images
        Object.keys(this.characterImages).forEach(characterName => {
            // Look for character elements with this name
            document.querySelectorAll('.character-circle').forEach(circle => {
                // SKIP if this circle is already part of an animation clone
                if (circle.closest('[id^="clone-"]')) return;
                
                // SKIP if circle already has art to avoid redundant processing
                if (circle.querySelector('.character-art')) return;
                
                // SKIP if circle has the artLoaded attribute
                if (circle.dataset.artLoaded === 'true') return;
                
                // Check if this is a container for the character we're looking for
                const container = circle.closest('.flex.flex-col');
                if (!container) return;
                
                const nameElement = container.querySelector('.text-sm.font-semibold');
                if (!nameElement || nameElement.textContent !== characterName) return;
                
                // Get character ID from the circle ID if available
                const circleId = circle.id;
                let characterId = null;
                let teamInfo = null;
                
                if (circleId) {
                    const idMatch = circleId.match(/character-(player|enemy)_(\d+)/);
                    if (idMatch) {
                        teamInfo = idMatch[1]; // 'player' or 'enemy'
                        characterId = idMatch[2]; // numeric ID
                    }
                }
                
                console.log(`Found ${characterName} element (${teamInfo}_${characterId}), injecting image`);
                
                // Set up the container for images
                circle.classList.add('character-art-container');
                circle.style.backgroundColor = 'transparent'; // Changed to transparent
                circle.style.boxShadow = 'none'; // Removed shadow
                
                // Mark this circle as having art loaded
                circle.dataset.artLoaded = 'true';
                circle.dataset.characterName = characterName;
                if (characterId) circle.dataset.characterId = characterId;
                if (teamInfo) circle.dataset.team = teamInfo;
                
                // Check for cached image in the global cache
                let img;
                if (window.CHARACTER_IMAGE_CACHE && window.CHARACTER_IMAGE_CACHE[characterName]) {
                    console.log(`Using cached image for ${characterName}`);
                    img = window.CHARACTER_IMAGE_CACHE[characterName].cloneNode(true);
                } else {
                    // Create a new image if no cache available
                    img = new Image();
                    img.src = this.characterImages[characterName];
                    
                    // Add to global cache for future use
                    if (!window.CHARACTER_IMAGE_CACHE) window.CHARACTER_IMAGE_CACHE = {};
                    window.CHARACTER_IMAGE_CACHE[characterName] = img.cloneNode(true);
                }
                
                img.className = 'character-art';
                img.alt = characterName;
                img.dataset.characterName = characterName;
                if (characterId) img.dataset.characterId = characterId;
                if (teamInfo) img.dataset.team = teamInfo;
                
                img.style.width = '80px';
                img.style.height = '120px';
                img.style.objectFit = 'contain';
                img.style.position = 'absolute';
                
                // Look for custom art positioning in the characters data
                let customPositioning = false;
                if (this.charactersData) {
                    // Try to find the character data
                    const characterData = this.charactersData.find(c => c.name === characterName);
                    if (characterData && characterData.art) {
                        console.log(`Found custom art settings for ${characterName}`, characterData.art);
                        // Apply custom positioning
                        if (characterData.art.top) {
                            img.style.top = characterData.art.top;
                            img.dataset.originalTop = characterData.art.top; // Store original for animations
                            customPositioning = true;
                        }
                        if (characterData.art.left) {
                            img.style.left = characterData.art.left;
                            img.dataset.originalLeft = characterData.art.left; // Store original for animations
                            customPositioning = true;
                        }
                        if (characterData.art.width) img.style.width = characterData.art.width;
                        if (characterData.art.height) img.style.height = characterData.art.height;
                    }
                }
                
                // Use default positioning only if no custom positioning found
                if (!customPositioning) {
                    img.style.top = '-52px';
                    img.dataset.originalTop = '-52px';
                    img.style.left = '-2px';
                    img.dataset.originalLeft = '-2px';
                }
                
                img.style.zIndex = '10';
                img.style.pointerEvents = 'none';
                
                // Empty the text and add the image
                circle.textContent = '';
                circle.appendChild(img);
            });
        });
    }
};

// Global flag to disable DirectImageLoader during animations
window.disableDirectImageLoader = false;

// Run image injector when DOM is ready
window.addEventListener('load', async function() {
    // Load character data first
    await window.DirectImageLoader.loadCharactersData();
    
    // Wait a bit for battle UI to initialize
    setTimeout(() => {
        window.DirectImageLoader.injectCharacterImages();
    }, 1000);
    
    // Also check periodically for new characters that might appear
    // Use a longer interval (reduced from 3000ms to 5000ms) and check the disable flag
    let intervalId = setInterval(() => {
        if (window.disableDirectImageLoader) {
            console.log('DirectImageLoader: Skipping periodic check (disabled)');
            return;
        }
        window.DirectImageLoader.injectCharacterImages();
    }, 5000);
    
    // Store the interval ID in the DirectImageLoader object
    window.DirectImageLoader.intervalId = intervalId;
});

// Add utility function to temporarily disable the DirectImageLoader during animations
window.disableDirectImageLoaderDuringAnimation = function() {
    window.disableDirectImageLoader = true;
    console.log('DirectImageLoader: Disabled during animation');
    
    // Re-enable after a short delay
    setTimeout(() => {
        window.disableDirectImageLoader = false;
        console.log('DirectImageLoader: Re-enabled after animation');
    }, 2000); // 2 seconds should cover most animations
};

console.log('DirectImageLoader initialized for character art');
