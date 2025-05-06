/**
 * Battle UI
 * Manages the user interface during battle
 * Implements a Tailwind CSS-based design
 */

class BattleUI {
    /**
     * Verify that background images are available
     * @param {Array} backgroundKeys - Keys for backgrounds to check
     */
    verifyBackgroundImages(backgroundKeys) {
        console.log('Verifying background images availability...');
        
        backgroundKeys.forEach(key => {
            if (key === 'default') {
                console.log('Default grid pattern background is always available');
                return;
            }
            
            const imageUrl = key === 'grassyfield' ? 
                'assets/images/Arena Art/Grassy Field.png' : 
                `assets/images/Arena Art/${key}.jpg`;
            
            // Create a test image to check if it loads
            const img = new Image();
            img.onload = () => {
                console.log(`✅ Background image verified: ${imageUrl}`);
            };
            img.onerror = () => {
                console.error(`❌ Background image not found: ${imageUrl}`);
                // Try an alternative path without leading slash
                const altUrl = key === 'grassyfield' ? 
                    'assets/images/Arena Art/Grassy Field.png' : 
                    `assets/images/Arena Art/${key}.jpg`;
                
                console.log(`Trying alternative path: ${altUrl}`);
                
                const altImg = new Image();
                altImg.onload = () => {
                    console.log(`✅ Alternative path works: ${altUrl}`);
                    // Update the CSS with the working path
                    this.updateBackgroundImagePath(key, altUrl);
                };
                altImg.onerror = () => {
                    console.error(`❌ Alternative path also failed: ${altUrl}`);
                    console.log('Checking if directory exists...');
                };
                altImg.src = altUrl;
            };
            img.src = imageUrl;
        });
    }
    
    /**
     * Update background image path in CSS
     * @param {string} key - Background key
     * @param {string} url - Working URL
     */
    updateBackgroundImagePath(key, url) {
        // Find the style element
        const styleEl = document.getElementById('battle-ui-styles');
        if (!styleEl) return;
        
        // Get the current styles
        let css = styleEl.textContent;
        
        // Replace the URL in the CSS
        const regex = new RegExp(`\.arena-${key}\s*{[^}]*background-image:\s*url\(['"]?([^'"\)]+)['"]?\)`, 'g');
        const newCss = css.replace(regex, (match, oldUrl) => {
            return match.replace(oldUrl, url);
        });
        
        // Update the style element
        styleEl.textContent = newCss;
        
        console.log(`Updated CSS with working path for ${key}`);
    }
    /**
     * Create a new Battle UI
     * @param {Phaser.Scene} scene - The Phaser scene for the battle
     * @param {BattleManager} battleManager - Reference to the battle manager
     */
    constructor(scene, battleManager) {
        this.scene = scene;
        this.battleManager = battleManager;
        this.elements = {};
        this.isSetup = false;
        this.playerTeam = [];
        this.enemyTeam = [];
        this.currentTurn = 0;
        this.logMessages = [];
        this.activeCharacter = null;
        this.floatingTexts = [];
        this.typeColors = {
            fire: '#ff4757',
            water: '#1e90ff',
            nature: '#2ed573',
            dark: '#9900cc',
            light: '#ffd700',
            air: '#70a1ff'
        };
        this.arenaBackground = 'grassyfield'; // Use Grassy Field as default background
    }

    /**
     * Initialize the battle UI
     */
    initialize() {
        // Check if already initialized
        if (this.isSetup) {
            console.log('BattleUI: Already initialized, skipping');
            // Even if already initialized, make sure tooltips are cleaned up
            this.cleanupTooltips();
            return;
        }
        
        // Check if battle UI already exists in DOM and remove it if it does
        const existingUI = document.getElementById('battle-ui');
        if (existingUI) {
            console.log('BattleUI: Found existing UI, removing it');
            // Clean up tooltips before removing the UI
            this.cleanupTooltips();
            existingUI.remove();
        }
        
        console.log('BattleUI: Initializing...');
        
        // Clear anything in the game container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.innerHTML = '';
        } else {
            console.error('Game container not found! Make sure game-container element exists.');
        }
        
        // Add Tailwind CSS if not already present
        this.ensureTailwindCSSIsLoaded();
        
        // Add custom CSS
        this.addCustomStyles();
        
        // Initialize tooltip manager
        this.initializeTooltipManager();
        
        // Create the UI container
        const battleUI = document.createElement('div');
        battleUI.id = 'battle-ui';
        battleUI.className = 'min-h-screen flex flex-col p-4 font-inter';
        battleUI.style.backgroundColor = '#141e2e';
        battleUI.style.color = '#e0e0e0';
        battleUI.style.fontFamily = "'Inter', sans-serif";
        
        // Create header with controls
        const header = this.createHeader();
        battleUI.appendChild(header);
        
        // Create main battle area
        const main = document.createElement('main');
        main.className = 'flex-grow flex gap-4 md:gap-8 items-start justify-center pt-8 relative';
        main.id = 'battle-arena';
        
        // Add arena background
        this.setArenaBackground(main, this.arenaBackground);
        
        // Create player team section
        const playerSection = this.createTeamSection('Your Team', 'text-blue-300');
        
        // Create VS divider
        const vsDiv = document.createElement('div');
        vsDiv.className = 'flex items-center justify-center flex-grow-0 pt-24';
        const vsSpan = document.createElement('span');
        vsSpan.className = 'text-4xl font-bold text-gray-500';
        vsSpan.textContent = 'VS';
        vsDiv.appendChild(vsSpan);
        
        // Create enemy team section
        const enemySection = this.createTeamSection('Enemy Team', 'text-red-300');
        
        // Add team sections to main
        main.appendChild(playerSection);
        main.appendChild(vsDiv);
        main.appendChild(enemySection);
        
        battleUI.appendChild(main);
        
        // Create battle log and add it to the main battle area
        const battleLog = this.createBattleLog();
        main.appendChild(battleLog);
        
        // Add to DOM
        document.body.appendChild(battleUI);
        
        // Store references to key elements
        this.elements = {
            playerTeamContainer: playerSection,
            enemyTeamContainer: enemySection,
            turnDisplay: document.getElementById('turn-display'),
            logContent: document.getElementById('battle-log-content'),
            speedButtons: {
                '1x': document.getElementById('speed-1x'),
                '2x': document.getElementById('speed-2x'),
                '4x': document.getElementById('speed-4x')
            },
            pauseButton: document.getElementById('pause-button'),
            nextTurnButton: document.getElementById('next-turn-button'),
            battleArena: main
        };
        
        this.isSetup = true;
        console.log('BattleUI: Initialized');
        
        // Check available backgrounds
        this.verifyBackgroundImages(['default', 'grassyfield']);
        
        // Check if Tailwind is working correctly and apply fallback styles if needed
        setTimeout(() => {
            if (BattleUIDebug) {
                const snapshot = BattleUIDebug.createSnapshot(this);
                if (!snapshot.tailwindStatus.tailwindWorking) {
                    console.log('BattleUI: Tailwind not working, applying fallback styles');
                    BattleUIDebug.injectFallbackStyles();
                    BattleUIDebug.fixCommonIssues(this);
                }
            }
        }, 500);
    }
    
    /**
     * Ensure Tailwind CSS is loaded
     */
    ensureTailwindCSSIsLoaded() {
        if (!document.getElementById('tailwind-css')) {
            console.log('BattleUI: Adding Tailwind CSS script tag');
            const tailwindScript = document.createElement('script');
            tailwindScript.id = 'tailwind-css';
            tailwindScript.src = 'https://cdn.tailwindcss.com';
            document.head.appendChild(tailwindScript);
            
            // Also add Inter font
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
            document.head.appendChild(fontLink);
        }
    }
    
    /**
     * Add custom styles for the battle UI
     */
    addCustomStyles() {
        if (!document.getElementById('battle-ui-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'battle-ui-styles';
            styleEl.textContent = `
                .panel-bg {
                    background-color: #232a40; /* Darker panel color */
                }
                /* Type colors for backgrounds */
                .bg-fire { background-color: #ff4757; }
                .bg-water { background-color: #1e90ff; }
                .bg-nature { background-color: #2ed573; }
                .bg-dark { background-color: #9900cc; }
                .bg-light { background-color: #ffd700; }
                .bg-air { background-color: #70a1ff; }
                
                /* Character Art Styles */
                .character-art-container {
                    background-color: transparent !important;
                    border: none !important;
                    overflow: visible;
                    width: 64px !important;
                    height: 64px !important;
                }
                
                .character-art-wrapper {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 5;
                    pointer-events: none;
                }
                
                .character-art {
                    width: 80px;
                    height: 120px;
                    object-fit: contain;
                    position: absolute;
                    top: -52px;
                    left: -2px; /* Moved more to the right */
                    pointer-events: none;
                    z-index: 10;
                }
                
                /* Special styling for characters with art during active/animation states */
                .active-character .character-art-container {
                    box-shadow: 0 0 15px 5px rgba(255, 215, 0, 0.3) !important;
                }
                
                .art-loaded.character-moving img {
                    filter: drop-shadow(0 0 5px rgba(30, 144, 255, 0.8));
                }

                /* Character Circle */
                .character-circle {
                    width: 64px; /* Adjust size as needed */
                    height: 64px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem; /* Size for initial letter */
                    font-weight: bold;
                    margin-bottom: 8px; /* Space between circle and HP bar */
                    border: 2px solid rgba(255, 255, 255, 0.3); /* Subtle border */
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    position: relative; /* Needed for floating text positioning */
                    transition: transform 0.3s ease-in-out;
                }
                /* Character Movement Animations */
                .character-moving {
                    z-index: 100; /* Ensure moving character appears above others */
                }
                /* Text color for light backgrounds */
                .text-dark-on-light { color: #141e2e; }

                /* Simple HP bar style */
                .hp-bar-container {
                    width: 80px; /* Match width roughly to circle */
                    margin: 0 auto; /* Center the bar */
                }
                .hp-bar-background {
                    background-color: #4a5568; /* Gray background for the bar */
                    height: 8px;
                    border-radius: 4px;
                    overflow: hidden;
                    border: 1px solid #2d3748;
                }
                .hp-bar-current {
                    background-color: #48bb78; /* Green for current HP */
                    height: 100%;
                    transition: width 0.3s ease-in-out;
                    border-radius: 4px 0 0 4px; /* Keep left radius */
                }

                /* Highlight for active character */
                .active-character .character-circle { /* Apply glow to the circle */
                    box-shadow: 0 0 15px 5px rgba(255, 215, 0, 0.6); /* Gold glow */
                    border-color: rgba(255, 215, 0, 0.8);
                }
                .active-character { /* Add scaling to the container */
                     transform: scale(1.05);
                }

                /* Status icons */
                .status-icons-container {
                    margin-top: 4px;
                    display: flex;
                    justify-content: center; /* Center icons below HP bar */
                    gap: 4px; /* Space between icons */
                    min-height: 16px; /* Reserve space even if no icons */
                }
                .status-icon {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    text-align: center;
                    line-height: 16px;
                    font-weight: bold;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    cursor: help; /* Show help cursor on hover */
                    transition: transform 0.2s, box-shadow 0.2s;
                    background-color: rgba(0, 0, 0, 0.3); /* Default background color */
                    border: 1px solid rgba(255, 255, 255, 0.3); /* Light border */
                    position: relative;
                    overflow: hidden; /* Make sure icon doesn't overflow the circle */
                    background-size: cover; /* For icon images */
                    background-position: center;
                    background-repeat: no-repeat;
                }
                
                .status-icon:hover {
                    transform: scale(1.3); /* Scale up on hover */
                    box-shadow: 0 0 6px rgba(255, 255, 255, 0.8); /* Glow effect */
                    z-index: 10; /* Ensure it appears above other icons */
                }

                /* Basic button styling */
                .control-button {
                    background-color: #4a5568;
                    padding: 6px 12px;
                    border-radius: 6px;
                    margin-left: 8px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    font-size: 14px;
                }
                .control-button:hover {
                    background-color: #718096;
                }
                .control-button.active {
                    background-color: #a0aec0;
                    color: #141e2e;
                }

                /* Battle Log Styling */
                .battle-log {
                    height: 180px; /* Increased height */
                    overflow-y: auto;
                    transition: height 0.3s ease-in-out;
                    max-height: 250px;
                    background-color: rgba(28, 33, 48, 0.95) !important; /* More opaque, darker background */
                    /* Hide default scrollbar in different browsers */
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* IE and Edge */
                }
                
                /* Hide scrollbar for Chrome, Safari and Opera */
                .battle-log::-webkit-scrollbar {
                    display: none;
                }

                /* Simple floating text placeholder */
                .floating-text {
                    position: absolute;
                    top: -25px; /* Position above the circle */
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 16px;
                    font-weight: bold;
                    white-space: nowrap;
                    z-index: 10; /* Ensure it's above the circle */
                    animation: float-up-fade-out 1.2s forwards;
                }
                
                @keyframes float-up-fade-out {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, 0);
                    }
                    10% {
                        opacity: 1;
                    }
                    80% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -30px);
                    }
                }
                
                /* Arena backgrounds */
                .arena-default {
                    background-color: #1a1a2e;
                    background-image: linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px);
                    background-size: 20px 20px;
                }
                .arena-grassyfield {
                    background-image: url('assets/images/Arena Art/Grassy Field.png');
                    background-size: cover;
                    background-position: center;
                }
                
                /* Victory overlay */
                .victory-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: calc(100% - 200px); /* Leave space for battle log */
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background-color: rgba(0, 0, 0, 0.7);
                    z-index: 20;
                    opacity: 0;
                    transition: opacity 0.5s ease-in-out;
                }
                .victory-text {
                    font-size: 48px;
                    font-weight: bold;
                    margin-bottom: 24px;
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                }
                .victory-button {
                    padding: 12px 24px;
                    background-color: #3742fa;
                    color: white;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .victory-button:hover {
                    background-color: #2536e0;
                }
                
                /* Animation for when a character takes damage */
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    50% { transform: translateX(5px); }
                    75% { transform: translateX(-5px); }
                }
                
                /* Bonk attack animation */
                @keyframes bonk-animation {
                    0% { transform: translateX(-50%) scale(0); opacity: 0; }
                    50% { transform: translateX(-50%) scale(1.5); opacity: 1; }
                    100% { transform: translateX(-50%) scale(1); opacity: 0; }
                }
                
                .attack-bonk {
                    position: absolute;
                    top: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 24px;
                    z-index: 110;
                    pointer-events: none;
                }
                
                .animate-bonk {
                    animation: bonk-animation 500ms ease-out forwards;
                }
                
                /* Action Text Animation */
                @keyframes action-text-animation {
                    0% { 
                        opacity: 0;
                        transform: translate(-50%, 10px) scale(0.8);
                    }
                    15% { 
                        opacity: 1;
                        transform: translate(-50%, -5px) scale(1.1);
                    }
                    80% { 
                        opacity: 1;
                        transform: translate(-50%, -5px) scale(1);
                    }
                    100% { 
                        opacity: 0;
                        transform: translate(-50%, -15px) scale(0.9);
                    }
                }

                .action-text {
                    position: absolute;
                    top: 10px; /* Adjusted to appear above character container */
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.6);
                    color: white;
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: bold;
                    white-space: nowrap;
                    z-index: 50;
                    animation: action-text-animation 1.8s forwards;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
                    pointer-events: none;
                }

                /* Action text colors */
                .action-text-attack {
                    color: #f56565; /* Red for attacks */
                }

                .action-text-ability {
                    color: #4299e1; /* Blue for abilities */
                }

                .action-text-heal {
                    color: #48bb78; /* Green for healing */
                }
                
                /* Make sure battle UI properly fills the screen */
                #battle-ui {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 9999;
                    background-color: #141e2e;
                    color: white;
                    overflow: hidden;
                }
            `;
            document.head.appendChild(styleEl);
        }
    }
    
    /**
     * Create the header with turn indicator and controls
     * @returns {HTMLElement} Header element
     */
    createHeader() {
        const header = document.createElement('header');
        header.className = 'panel-bg rounded-lg p-3 mb-4 flex justify-between items-center shadow-md';
        
        // Turn display
        const turnDiv = document.createElement('div');
        const turnSpan = document.createElement('span');
        turnSpan.id = 'turn-display';
        turnSpan.className = 'text-lg font-semibold';
        turnSpan.textContent = 'Turn: 0';
        turnDiv.appendChild(turnSpan);
        
        // Controls
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'flex items-center';
        
        const speedLabel = document.createElement('span');
        speedLabel.className = 'mr-2 text-sm';
        speedLabel.textContent = 'Speed:';
        controlsDiv.appendChild(speedLabel);
        
        // Speed buttons
        const speedButtons = [
            { id: 'speed-1x', text: '1x', active: true, speed: 1 },
            { id: 'speed-2x', text: '2x', active: false, speed: 2 },
            { id: 'speed-4x', text: '4x', active: false, speed: 4 }
        ];
        
        speedButtons.forEach(btn => {
            const button = document.createElement('button');
            button.id = btn.id;
            button.className = `control-button ${btn.active ? 'active' : ''}`;
            button.textContent = btn.text;
            button.addEventListener('click', () => this.setSpeed(btn.speed));
            controlsDiv.appendChild(button);
        });
        
        // Pause button
        const pauseButton = document.createElement('button');
        pauseButton.id = 'pause-button';
        pauseButton.className = 'control-button ml-4';
        pauseButton.innerHTML = '&#10074;&#10074;'; // Pause symbol
        pauseButton.addEventListener('click', () => this.togglePause());
        controlsDiv.appendChild(pauseButton);
        
        // Next turn button
        const nextTurnButton = document.createElement('button');
        nextTurnButton.id = 'next-turn-button';
        nextTurnButton.className = 'control-button ml-4';
        nextTurnButton.innerHTML = '&#9654;&#9654;'; // Fast forward symbol
        nextTurnButton.addEventListener('click', () => this.nextTurn());
        controlsDiv.appendChild(nextTurnButton);
        
        // Settings button
        const settingsButton = document.createElement('button');
        settingsButton.id = 'settings-button';
        settingsButton.className = 'control-button ml-1';
        settingsButton.innerHTML = '&#9881;'; // Gear symbol
        settingsButton.addEventListener('click', () => this.showSettings());
        controlsDiv.appendChild(settingsButton);
        
        // Back button
        const backButton = document.createElement('button');
        backButton.id = 'back-button';
        backButton.className = 'control-button ml-4';
        backButton.textContent = 'Back';
        backButton.addEventListener('click', () => this.exitBattle());
        controlsDiv.appendChild(backButton);
        
        header.appendChild(turnDiv);
        header.appendChild(controlsDiv);
        
        return header;
    }
    
    /**
     * Create a team section (either player or enemy)
     * @param {string} title - Section title
     * @param {string} titleColor - Color class for the title
     * @returns {HTMLElement} Team section element
     */
    createTeamSection(title, titleColor) {
        const section = document.createElement('section');
        section.className = 'flex flex-col items-center gap-6 w-1/3 md:w-1/4';
        
        const heading = document.createElement('h2');
        heading.className = `text-xl font-semibold mb-2 ${titleColor}`;
        heading.textContent = title;
        
        section.appendChild(heading);
        
        return section;
    }
    
    /**
     * Create the battle log
     * @returns {HTMLElement} Battle log element
     */
    createBattleLog() {
        const logContainer = document.createElement('div');
        logContainer.className = 'absolute bottom-4 left-4';
        logContainer.style.width = '400px'; // Increased width from 300px to 400px
        logContainer.style.zIndex = '30'; // Higher than victory overlay (which is 20)
        
        const logDiv = document.createElement('div');
        logDiv.className = 'rounded-lg p-4 shadow-md battle-log';
        logDiv.style.backgroundColor = 'rgba(28, 33, 48, 0.95)'; // More opaque, darker background // Increased padding from p-3 to p-4
        
        const logHeading = document.createElement('div');
        logHeading.className = 'flex justify-between items-center text-sm font-semibold mb-2 border-b border-gray-600 pb-1';
        
        const logTitle = document.createElement('h3');
        logTitle.textContent = 'Battle Log';
        
        const copyButton = document.createElement('button');
        copyButton.className = 'text-xs py-0 px-2 bg-blue-600 rounded hover:bg-blue-500';
        copyButton.textContent = 'Copy';
        copyButton.addEventListener('click', () => this.copyBattleLog());
        
        logHeading.appendChild(logTitle);
        logHeading.appendChild(copyButton);
        
        const logContent = document.createElement('div');
        logContent.id = 'battle-log-content';
        logContent.className = 'text-xs space-y-2'; // Increased space between entries from space-y-1 to space-y-2
        
        logDiv.appendChild(logHeading);
        logDiv.appendChild(logContent);
        logContainer.appendChild(logDiv);
        
        return logContainer;
    }
    
    /**
     * Set the arena background
     * @param {HTMLElement} arenaElement - Arena element to apply background to
     * @param {string} backgroundKey - Key for the background to apply ('default', 'forest', etc)
     */
    setArenaBackground(arenaElement, backgroundKey) {
        // Only accept 'default' or 'grassyfield' for now
        if (backgroundKey !== 'default' && backgroundKey !== 'grassyfield') {
            console.log(`Background '${backgroundKey}' not implemented yet, using 'grassyfield' instead`);
            backgroundKey = 'grassyfield';
        }
        
        // Remove any existing arena classes
        arenaElement.classList.remove('arena-default', 'arena-grassyfield');
        
        // Add the requested arena class
        arenaElement.classList.add(`arena-${backgroundKey}`);
        
        // Check if the background is an image and verify it exists
        if (backgroundKey === 'grassyfield') {
            const imageUrl = 'assets/images/Arena Art/Grassy Field.png';
            
            // Apply a custom inline style to be absolutely sure it's applied
            arenaElement.style.backgroundImage = `url("${imageUrl}")`;
            arenaElement.style.backgroundSize = 'cover';
            arenaElement.style.backgroundPosition = 'center';
            
            // Attempt to preload the image to verify it exists
            const img = new Image();
            img.onerror = () => {
                console.error(`Failed to load background image: ${imageUrl}`);
                // Fallback to default background if image fails to load
                arenaElement.classList.remove(`arena-${backgroundKey}`);
                arenaElement.classList.add('arena-default');
                arenaElement.style.backgroundImage = '';
                this.arenaBackground = 'default';
            };
            img.src = imageUrl;
        } else {
            // Remove inline style if using default
            arenaElement.style.backgroundImage = '';
        }
        
        this.arenaBackground = backgroundKey;
    }
    
    /**
     * Render characters in the battle UI
     * @param {Array} playerTeam - Player team characters
     * @param {Array} enemyTeam - Enemy team characters
     */
    renderCharacters(playerTeam, enemyTeam) {
        this.playerTeam = playerTeam;
        this.enemyTeam = enemyTeam;
        
        console.log('BattleUI: Rendering characters', playerTeam, enemyTeam);
        
        // Clear existing characters
        const playerSection = this.elements.playerTeamContainer;
        const enemySection = this.elements.enemyTeamContainer;
        
        // Keep the heading, remove other children
        while (playerSection.childNodes.length > 1) {
            playerSection.removeChild(playerSection.lastChild);
        }
        
        while (enemySection.childNodes.length > 1) {
            enemySection.removeChild(enemySection.lastChild);
        }
        
        // Render player team
        playerTeam.forEach(character => {
            const characterElement = this.createCharacterElement(character, 'player');
            playerSection.appendChild(characterElement);
        });
        
        // Render enemy team
        enemyTeam.forEach(character => {
            const characterElement = this.createCharacterElement(character, 'enemy');
            enemySection.appendChild(characterElement);
        });
        
        // Set the first character as active
        if (playerTeam.length > 0) {
            this.setActiveCharacter(playerTeam[0]);
        }
    }
    
    /**
     * Create a character element
     * @param {Object} character - Character data
     * @param {string} team - 'player' or 'enemy'
     * @returns {HTMLElement} Character element
     */
    createCharacterElement(character, team) {
        const container = document.createElement('div');
        container.className = 'flex flex-col items-center text-center';
        
        // Create a unique ID for this character that includes team information
        // This ensures we correctly identify characters even if they have the same name
        character.uniqueId = `${team}_${character.id}`;
        
        container.id = `character-container-${character.uniqueId}`;
        container.dataset.team = team; // Store team info for attack animations
        
        // Character representation (circle or image)
        const circle = document.createElement('div');
        
        // Check if this is a character with art (Aqualia or any character with art property)
        if (character.name === "Aqualia" || (character.art && character.art.enabled !== false)) {
            // Add a class to identify this as a character with art
            circle.className = 'character-circle character-art-container';
            circle.id = `character-${character.uniqueId}`;
            circle.style.position = 'relative'; // Ensure relative positioning for the movement
            circle.dataset.hasArt = 'true'; // Mark this character as having art
            
            // Log that we're creating a character with art
            console.log(`Creating ${character.name} character with art`);
            
            // Use a direct path to the image based on the web server root
            const artPath = `assets/images/Character Art/${character.name}.png`;
            
            // Create a wrapper div to contain the image and properly position it
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'character-art-wrapper';
            imageWrapper.style.position = 'absolute';
            imageWrapper.style.top = '0';
            imageWrapper.style.left = '0';
            imageWrapper.style.width = '100%';
            imageWrapper.style.height = '100%';
            imageWrapper.style.zIndex = '5';
            
            // Create and add the image element
            const imgElement = new Image();
            imgElement.className = 'character-art';
            imgElement.alt = character.name;
            
            // Apply character-specific art settings if available
            if (character.art) {
                if (character.art.left) {
                    imgElement.style.left = character.art.left;
                    // Store original left value to maintain position during animations
                    imgElement.dataset.originalLeft = character.art.left;
                }
                if (character.art.top) {
                    imgElement.style.top = character.art.top;
                    // Store original top value to maintain position during animations
                    imgElement.dataset.originalTop = character.art.top;
                }
                if (character.art.width) imgElement.style.width = character.art.width;
                if (character.art.height) imgElement.style.height = character.art.height;
            }
            
            // Log to diagnose image loading issues
            imgElement.onload = function() {
                console.log(`SUCCESS: ${character.name} image loaded successfully`);
                // Remove the background completely once the image loads
                circle.style.backgroundColor = 'transparent';
                circle.style.borderColor = 'transparent';
            };
            
            imgElement.onerror = function(e) {
                console.error(`FAILED: Error loading ${character.name} image:`, e);
                console.log('Image path tried:', imgElement.src);
                // Keep the fallback color/letter if image fails to load
            };
            
            // Set a transparent background by default
            circle.style.backgroundColor = 'transparent';
            circle.style.border = 'none';
            
            // Set the src AFTER setting up event handlers
            imgElement.src = artPath;
            
            // Add the image to the wrapper, then wrapper to circle
            imageWrapper.appendChild(imgElement);
            circle.appendChild(imageWrapper);
        } else {
            // Standard circle for other characters
            circle.className = `character-circle bg-${character.type}`;
            if (character.type === 'light') {
                circle.classList.add('text-dark-on-light');
            }
            circle.id = `character-${character.uniqueId}`;
            circle.textContent = character.name.charAt(0).toUpperCase();
            circle.style.position = 'relative'; // Ensure relative positioning for the movement
        }
        
        // HP bar container
        const hpBarContainer = document.createElement('div');
        hpBarContainer.className = 'hp-bar-container';
        
        const hpBarBackground = document.createElement('div');
        hpBarBackground.className = 'hp-bar-background';
        
        const currentHp = character.currentHp !== undefined ? character.currentHp : character.stats.hp;
        const maxHp = character.stats.hp;
        const healthPercentage = (currentHp / maxHp) * 100;
        
        const hpBarCurrent = document.createElement('div');
        hpBarCurrent.className = 'hp-bar-current';
        hpBarCurrent.style.width = `${healthPercentage}%`;
        hpBarCurrent.id = `hp-bar-${character.uniqueId}`;
        
        hpBarBackground.appendChild(hpBarCurrent);
        hpBarContainer.appendChild(hpBarBackground);
        
        // Character name
        const nameDiv = document.createElement('div');
        nameDiv.className = 'text-sm font-semibold mt-1';
        nameDiv.textContent = character.name;
        
        // HP text
        const hpText = document.createElement('div');
        hpText.className = 'text-xs';
        hpText.textContent = `HP: ${currentHp} / ${maxHp}`;
        hpText.id = `hp-text-${character.uniqueId}`;
        
        // Status icons container
        const statusContainer = document.createElement('div');
        statusContainer.className = 'status-icons-container';
        statusContainer.id = `status-icons-${character.uniqueId}`;
        
        // Add elements to container
        container.appendChild(circle);
        container.appendChild(hpBarContainer);
        container.appendChild(nameDiv);
        container.appendChild(hpText);
        container.appendChild(statusContainer);
        
        return container;
    }
    
    /**
     * Set a character as the active character
     * @param {Object} character - Character data
     */
    setActiveCharacter(character) {
        // Remove active class from all character containers
        document.querySelectorAll('.active-character').forEach(el => {
            el.classList.remove('active-character');
            
            // Restore original position values for any character art if they exist
            const characterId = el.id.replace('character-container-', '');
            const artContainer = document.getElementById(`character-${characterId}`);
            if (artContainer && artContainer.dataset.hasArt === 'true') {
                const img = artContainer.querySelector('.character-art');
                if (img) {
                    // Restore original position values if available
                    if (img.dataset.originalLeft) {
                        img.style.left = img.dataset.originalLeft;
                    }
                    if (img.dataset.originalTop) {
                        img.style.top = img.dataset.originalTop;
                    }
                }
            }
        });
        
        this.activeCharacter = character;
        
        // Add active class to the character container
        // We need the uniqueId which includes team information
        const uniqueId = character.uniqueId || (character.team === 'player' ? `player_${character.id}` : `enemy_${character.id}`);
        const characterContainer = document.getElementById(`character-container-${uniqueId}`);
        if (characterContainer) {
            characterContainer.classList.add('active-character');
            
            // Make sure character art maintains its position when active
            const artContainer = document.getElementById(`character-${uniqueId}`);
            if (artContainer && artContainer.dataset.hasArt === 'true') {
                // If character has art, ensure position is maintained
                const img = artContainer.querySelector('.character-art');
                if (img && img.dataset.originalLeft && img.dataset.originalTop) {
                    // Re-apply the original position values
                    img.style.left = img.dataset.originalLeft;
                    img.style.top = img.dataset.originalTop;
                }
            }
        }
    }
    
    /**
     * Show an attack animation between characters
     * @param {Object} attacker - Attacking character
     * @param {Object} target - Target character
     * @param {Object} ability - Ability used
     */
    showAttackAnimation(attacker, target, ability) {
        // DEBUG MESSAGE FOR DEPRECATED DOM ANIMATIONS
        console.warn('⚠️ USING DEPRECATED DOM BATTLE ANIMATIONS: Please use Phaser-based battle scene for improved performance');

        // Disable DirectImageLoader during this animation to prevent art switching
        if (typeof window.disableDirectImageLoaderDuringAnimation === 'function') {
            window.disableDirectImageLoaderDuringAnimation();
        } else {
            // Fallback if function doesn't exist
            window.disableDirectImageLoader = true;
            setTimeout(() => { window.disableDirectImageLoader = false; }, 2000);
        }
        
        // Logging for debugging purposes
        console.log(`Animation: ${attacker.name} (${attacker.uniqueId}) attacking ${target.name} (${target.uniqueId})`);
        
        // Get the character elements using uniqueId
        const attackerContainer = document.getElementById(`character-container-${attacker.uniqueId}`);
        const targetContainer = document.getElementById(`character-container-${target.uniqueId}`);
        const attackerCircle = document.getElementById(`character-${attacker.uniqueId}`);
        const targetCircle = document.getElementById(`character-${target.uniqueId}`);
        
        // Add Action Text display above character head (to the container, not the circle)
        const actionType = ability ? (ability.isHealing ? 'heal' : 'ability') : 'attack';
        const actionText = ability ? ability.name : 'Auto-Attack';
        // Use the container instead of circle so text stays in place
        this.showActionText(attackerContainer, actionText, actionType);
        
        if (!attackerCircle || !targetCircle) {
            console.error('Could not find character elements for animation:', 
                        { attacker: attacker.name, target: target.name, 
                          attackerId: attacker.uniqueId, targetId: target.uniqueId });
            return;
        }
        
        // SIMPLIFIED ANIMATION: Just show the action text and update health
        // Store damage info
        const damage = ability ? ability.damage : attacker.stats.attack;
        const isHealing = ability && ability.isHealing;
        
        // Show simplified effect
        this.showBonkEffect(targetCircle, isHealing);
        
        // Show damage numbers
        this.showFloatingText(
            target.id,
            isHealing ? `+${damage}` : `-${damage}`,
            isHealing ? 'text-green-500' : 'text-red-500'
        );
        
        // Update target's health
        this.updateCharacterHealth(target, damage, isHealing);
        
        // Re-enable DirectImageLoader after animation is completely finished
        setTimeout(() => {
            window.disableDirectImageLoader = false;
            console.log('Animation complete, DirectImageLoader re-enabled');
        }, 500);
        
        /* ANIMATION CODE COMMENTED OUT: Moving to Phaser-based system
        // Check if this character has artwork
        const hasArt = attackerCircle.dataset.hasArt === 'true';
        
        // Store attacker info in data attribute for secure identification
        // This helps prevent character art mix-ups during animations
        const attackerUniqueId = attacker.uniqueId;
        const attackerName = attacker.name;
        
        // Create a fresh clone of the attacker circle for the animation
        const animatedClone = attackerCircle.cloneNode(false); // Shallow clone first
        animatedClone.id = `clone-${attackerUniqueId}`;
        animatedClone.setAttribute('data-character-id', attacker.id);
        animatedClone.setAttribute('data-character-name', attackerName);
        animatedClone.setAttribute('data-character-unique-id', attackerUniqueId);
        animatedClone.style.position = 'fixed'; // Use fixed positioning for accurate placement
        animatedClone.style.zIndex = '200';
        animatedClone.style.margin = '0'; // Remove any margin
        animatedClone.style.opacity = '1'; 
        animatedClone.style.transition = 'none'; // Disable transitions initially
        animatedClone.classList.add('character-moving');
        
        // Special handling for characters with art
        if (hasArt) {
            // Make sure the container has correct styling
            animatedClone.style.backgroundColor = 'transparent';
            animatedClone.style.border = 'none';
            
            // Create a fresh wrapper instead of cloning to avoid potential reference issues
            const artWrapper = document.createElement('div');
            artWrapper.className = 'character-art-wrapper';
            animatedClone.appendChild(artWrapper);
            
            // Create a fresh image element
            const img = new Image();
            img.className = 'character-art';
            img.alt = attackerName;
            
            // IMPORTANT: Set character-specific data attributes to prevent misidentification
            img.dataset.characterName = attackerName;
            img.dataset.characterId = attacker.id;
            img.dataset.characterUniqueId = attackerUniqueId;
            
            // Ensure the image is set to a working path based on attacker name
            const imagePath = `assets/images/Character Art/${attackerName}.png`;
            img.src = imagePath;
            
            // Use a secure global reference if available
            if (window.CHARACTER_IMAGE_CACHE && window.CHARACTER_IMAGE_CACHE[attackerName]) {
                console.log(`Using cached image for ${attackerName} during animation`);
                // Copy the src from the cache to ensure consistency
                const cachedSrc = window.CHARACTER_IMAGE_CACHE[attackerName].src;
                if (cachedSrc) img.src = cachedSrc;
            }
            
            // Copy over the custom positioning from original image
            const originalImg = attackerCircle.querySelector('.character-art');
            if (originalImg) {
                // Copy exact positioning from original image
                if (originalImg.dataset.originalLeft) {
                    img.style.left = originalImg.dataset.originalLeft;
                    img.dataset.originalLeft = originalImg.dataset.originalLeft;
                }
                if (originalImg.dataset.originalTop) {
                    img.style.top = originalImg.dataset.originalTop;
                    img.dataset.originalTop = originalImg.dataset.originalTop;
                }
                // Copy width/height from original if available
                if (originalImg.style.width) img.style.width = originalImg.style.width;
                if (originalImg.style.height) img.style.height = originalImg.style.height;
            }
            
            // Add the image to the wrapper
            artWrapper.appendChild(img);
            
            // Add a loaded class to the clone
            animatedClone.classList.add('art-loaded');
            
            // Log animation for debugging purposes
            console.log(`Created animation clone for ${attackerName} (${attackerUniqueId})`);
        }
        
        // Hide the original circle during animation
        attackerCircle.style.visibility = 'hidden';
        
        // Clean up any lingering clones before adding a new one
        // This helps prevent potential art mix-ups from earlier animations
        const existingClones = document.querySelectorAll('[id^="clone-"]');
        existingClones.forEach(clone => {
            if (clone.parentNode) {
                clone.parentNode.removeChild(clone);
                console.log('Removed lingering animation clone');
            }
        });
        
        // Add the clone to the battle area
        const battleArena = document.getElementById('battle-arena');
        battleArena.appendChild(animatedClone);
        
        // Calculate positions
        const attackerRect = attackerCircle.getBoundingClientRect();
        const targetRect = targetCircle.getBoundingClientRect();
        
        // Position the clone at the attacker's position
        animatedClone.style.left = `${attackerRect.left}px`;
        animatedClone.style.top = `${attackerRect.top}px`;
        animatedClone.style.width = `${attackerRect.width}px`;
        animatedClone.style.height = `${attackerRect.height}px`;
        
        // Calculate animation timing based on speed
        const speedMultiplier = this.battleManager ? this.battleManager.speedMultiplier || 1 : 1;
        const moveDuration = 400 / speedMultiplier;
        const returnDuration = 300 / speedMultiplier;
        
        // 1. Initial slight scale down
        requestAnimationFrame(() => {
            // Start with a small scale
            animatedClone.style.transform = 'scale(0.9)';
            
            // 2. Move to target with a slight delay
            setTimeout(() => {
                // Apply transition for movement
                animatedClone.style.transition = `left ${moveDuration}ms ease-out, top ${moveDuration}ms ease-out, transform 200ms ease-out`;
                
                // Calculate the target position (stop just short of the target)
                // For player team attacking enemy team, move to the left of the target
                // For enemy team attacking player team, move to the right of the target
                const attackerTeam = attackerContainer.dataset.team;
                const targetTeam = targetContainer.dataset.team;
                
                let moveToX, moveToY;
                if (attackerTeam === 'player' && targetTeam === 'enemy') {
                    // Player attacking enemy - move to the left side of the target
                    moveToX = targetRect.left - (attackerRect.width / 2);
                } else if (attackerTeam === 'enemy' && targetTeam === 'player') {
                    // Enemy attacking player - move to the right side of the target
                    moveToX = targetRect.right - (attackerRect.width / 2);
                } else {
                    // Same team (healing) - go to the center
                    moveToX = targetRect.left + (targetRect.width - attackerRect.width) / 2;
                }
                
                // Vertically align with the target
                moveToY = targetRect.top + (targetRect.height - attackerRect.height) / 2;
                
                // Move toward the target
                animatedClone.style.transform = 'scale(1.1)';
                animatedClone.style.left = `${moveToX}px`;
                animatedClone.style.top = `${moveToY}px`;
                
                // 3. When near target, show impact effect
                setTimeout(() => {
                    // Show bonk effect and shake target
                    this.showBonkEffect(targetCircle, isHealing);
                    targetCircle.style.animation = 'shake 0.5s';
                    
                    // Show damage numbers
                    this.showFloatingText(
                        target.id,
                        isHealing ? `+${damage}` : `-${damage}`,
                        isHealing ? 'text-green-500' : 'text-red-500'
                    );
                    
                    // Update target's health
                    this.updateCharacterHealth(target, damage, isHealing);
                    
                    // 4. Move back to original position
                    setTimeout(() => {
                        animatedClone.style.transition = `left ${returnDuration}ms ease-in, top ${returnDuration}ms ease-in, opacity 200ms ease-out`;
                        animatedClone.style.left = `${attackerRect.left}px`;
                        animatedClone.style.top = `${attackerRect.top}px`;
                        animatedClone.style.transform = 'scale(0.9)';
                        
                        // 5. Fade out clone and remove
                        setTimeout(() => {
                            // Begin fade out
                            animatedClone.style.opacity = '0';
                            
                            setTimeout(() => {
                                // Verify clone is the correct one for this character (safety check)
                                if (animatedClone.dataset.characterUniqueId !== attackerUniqueId) {
                                    console.warn(`Animation clone mismatch detected: ${animatedClone.dataset.characterUniqueId} vs expected ${attackerUniqueId}`);
                                }
                                
                                // Ensure the clone is properly removed
                                if (animatedClone.parentNode) {
                                    console.log(`Removing animation clone for ${attackerName}`);
                                    animatedClone.parentNode.removeChild(animatedClone);
                                }
                                
                                // Double check for any other clones that might be lingering
                                const otherClones = document.querySelectorAll(`[id="clone-${attackerUniqueId}"]`);
                                otherClones.forEach(clone => {
                                    if (clone.parentNode) {
                                        console.warn('Found additional clone to remove');
                                        clone.parentNode.removeChild(clone);
                                    }
                                });
                                
                                // Reset target animation
                                targetCircle.style.animation = '';
                                
                                // Show original attacker circle again
                                attackerCircle.style.visibility = 'visible';
                                
                                // Re-enable DirectImageLoader after animation is completely finished
                                // This ensures no injection happens during the animation
                                window.disableDirectImageLoader = false;
                                console.log('Animation complete, DirectImageLoader re-enabled');
                            }, 200);
                        }, returnDuration - 50);
                    }, 400 / speedMultiplier);
                }, moveDuration);
            }, 50);
        });
        */
    }
    
    /**
     * Show a bonk effect on the target
     * @param {HTMLElement} targetElement - The target element
     * @param {boolean} isHealing - Whether this is a healing effect
     */
    showBonkEffect(targetElement, isHealing = false) {
        // Create bonk element
        const bonk = document.createElement('div');
        bonk.className = 'attack-bonk';
        
        // Use different icon based on whether it's healing or attack
        if (isHealing) {
            bonk.textContent = '✨'; // Sparkle for healing
            bonk.style.color = '#48bb78'; // Green color
        } else {
            bonk.textContent = '💥'; // Impact for attack
            bonk.style.color = '#f56565'; // Red color
        }
        
        // Add to target
        targetElement.appendChild(bonk);
        
        // Add animation class
        bonk.classList.add('animate-bonk');
        
        // Remove after animation completes
        setTimeout(() => {
            if (bonk.parentNode === targetElement) {
                targetElement.removeChild(bonk);
            }
        }, 500);
    }
    
    /**
     * Show action text above a character
     * @param {HTMLElement} characterElement - The character element
     * @param {string} actionText - Text to display
     * @param {string} actionType - Type of action ('attack', 'ability', or 'heal')
     */
    showActionText(characterElement, actionText, actionType = 'attack') {
        // Create the action text element
        const actionTextElement = document.createElement('div');
        actionTextElement.className = `action-text action-text-${actionType}`;
        actionTextElement.textContent = actionText;
        
        // Add to character element
        characterElement.appendChild(actionTextElement);
        
        // Remove after animation completes
        const duration = 1800 / (this.battleManager ? this.battleManager.speedMultiplier || 1 : 1);
        setTimeout(() => {
            if (actionTextElement.parentNode === characterElement) {
                characterElement.removeChild(actionTextElement);
            }
        }, duration); // Match the animation duration with battle speed adjustment
    }
    
    /**
     * Show passive effect visual feedback
     * @param {Object} character - Character with the passive ability
     * @param {string} effectName - Name of the passive effect
     */
    showPassiveEffect(character, effectName) {
        // Get character's unique ID
        const uniqueId = character.uniqueId || (character.team === 'player' ? `player_${character.id}` : `enemy_${character.id}`);
        
        // Find the character element
        const characterElement = document.getElementById(`character-${uniqueId}`);
        
        if (!characterElement) {
            console.error(`Could not find character element for ${character.name} (${uniqueId})`);
            return;
        }
        
        // Create passive effect element
        const passiveEffect = document.createElement('div');
        passiveEffect.className = 'passive-effect';
        passiveEffect.textContent = '✨ ' + effectName;
        
        // Add some custom styling for passive effects
        passiveEffect.style.position = 'absolute';
        passiveEffect.style.top = '-30px';
        passiveEffect.style.left = '50%';
        passiveEffect.style.transform = 'translateX(-50%)';
        passiveEffect.style.backgroundColor = 'rgba(75, 0, 130, 0.8)'; // Purple for passives
        passiveEffect.style.color = 'white';
        passiveEffect.style.padding = '3px 8px';
        passiveEffect.style.borderRadius = '4px';
        passiveEffect.style.fontSize = '12px';
        passiveEffect.style.fontWeight = 'bold';
        passiveEffect.style.whiteSpace = 'nowrap';
        passiveEffect.style.zIndex = '100';
        passiveEffect.style.animation = 'float-up-fade-out 1.5s forwards';
        passiveEffect.style.border = '1px solid rgba(128, 0, 255, 0.5)';
        
        // Add to character element
        characterElement.appendChild(passiveEffect);
        
        // Remove after animation completes
        setTimeout(() => {
            if (passiveEffect.parentNode === characterElement) {
                characterElement.removeChild(passiveEffect);
            }
        }, 1500);
        
        // Also add a glowing effect to the character
        const glowEffect = document.createElement('div');
        glowEffect.className = 'passive-glow';
        glowEffect.style.position = 'absolute';
        glowEffect.style.top = '0';
        glowEffect.style.left = '0';
        glowEffect.style.width = '100%';
        glowEffect.style.height = '100%';
        glowEffect.style.borderRadius = '50%';
        glowEffect.style.boxShadow = '0 0 15px 5px rgba(128, 0, 255, 0.6)';
        glowEffect.style.animation = 'passive-glow 1s ease-out';
        glowEffect.style.zIndex = '5';
        glowEffect.style.pointerEvents = 'none';
        
        // Add glow animation style if it doesn't exist
        if (!document.getElementById('passive-effect-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'passive-effect-styles';
            styleEl.textContent = `
                @keyframes passive-glow {
                    0% { opacity: 0.8; transform: scale(0.9); }
                    50% { opacity: 1; transform: scale(1.1); }
                    100% { opacity: 0; transform: scale(1.2); }
                }
            `;
            document.head.appendChild(styleEl);
        }
        
        // Add the glow element behind other content
        characterElement.insertBefore(glowEffect, characterElement.firstChild);
        
        // Remove glow after animation
        setTimeout(() => {
            if (glowEffect.parentNode === characterElement) {
                characterElement.removeChild(glowEffect);
            }
        }, 1000);
    }
    
    /**
     * Show floating text above a character
     * @param {string} characterId - ID of the character
     * @param {string} text - Text to display
     * @param {string} textColor - Color class for the text
     */
    showFloatingText(characterId, text, textColor) {
        // In case we're passed a regular ID, let's try to find the uniqueId first
        let characterElement = null;
        
        // Try to find the element with uniqueId (player_id or enemy_id)
        const possibleIds = [`player_${characterId}`, `enemy_${characterId}`];
        for (const id of possibleIds) {
            const element = document.getElementById(`character-${id}`);
            if (element) {
                characterElement = element;
                break;
            }
        }
        
        // If not found with uniqueId, fall back to regular id
        if (!characterElement) {
            characterElement = document.getElementById(`character-${characterId}`);
        }
        
        if (!characterElement) {
            console.error(`Could not find character element for ID: ${characterId}`);
            return;
        }
        
        const floatingText = document.createElement('div');
        floatingText.className = `floating-text ${textColor}`;
        floatingText.textContent = text;
        
        characterElement.appendChild(floatingText);
        
        // Remove after animation completes
        setTimeout(() => {
            if (floatingText.parentNode === characterElement) {
                characterElement.removeChild(floatingText);
            }
        }, 1200);
    }
    
    /**
     * Update character health display
     * @param {Object} character - Character data
     * @param {number} amount - Amount to change (damage or healing)
     * @param {boolean} isHealing - Whether this is healing
     */
    updateCharacterHealth(character, amount, isHealing = false) {
        // Update character object
        const newHealth = isHealing 
            ? Math.min(character.currentHp + amount, character.stats.hp)
            : Math.max(0, character.currentHp - amount);
        
        character.currentHp = newHealth;
        
        // Use uniqueId if available
        const uniqueId = character.uniqueId || character.id;
        
        // Update HP bar
        const hpBar = document.getElementById(`hp-bar-${uniqueId}`);
        const hpText = document.getElementById(`hp-text-${uniqueId}`);
        
        if (hpBar && hpText) {
            // Calculate health percentage
            const healthPercentage = (character.currentHp / character.stats.hp) * 100;
            
            // Update HP bar width with animation
            hpBar.style.width = `${healthPercentage}%`;
            
            // Update HP text
            hpText.textContent = `HP: ${character.currentHp} / ${character.stats.hp}`;
            
            // Change color based on health percentage
            if (healthPercentage <= 25) {
                hpBar.style.backgroundColor = '#f56565'; // Red for low health
            } else if (healthPercentage <= 50) {
                hpBar.style.backgroundColor = '#ed8936'; // Orange for medium health
            } else {
                hpBar.style.backgroundColor = '#48bb78'; // Green for good health
            }
        }
    }
    
    /**
     * Update the UI with current state
     */
    update() {
        if (this.battleManager) {
            const turnDisplay = this.elements.turnDisplay;
            if (turnDisplay) {
                turnDisplay.textContent = `Turn: ${this.battleManager.currentTurn}`;
            }
        }
    }
    
    /**
     * Add message to battle log
     * @param {string} message - Message text
     * @param {string} type - Message type
     */
    addLogMessage(message, type = 'default') {
        // Add to our log array
        this.logMessages.push({ message, type });
        
        // No longer limiting to most recent messages so we can copy the entire battle log
        // Previously: if (this.logMessages.length > 30) { this.logMessages.shift(); }
        
        // Update log display
        const logContent = this.elements.logContent;
        if (logContent) {
            const messageElement = document.createElement('p');
            
            // Format the message with colored spans based on content
            let formattedMessage = message;
            
            // Override formatting based on message type
            switch (type) {
                case 'success':
                    messageElement.style.color = '#48bb78'; // Green
                    break;
                case 'error':
                    messageElement.style.color = '#f56565'; // Red
                    break;
                case 'info':
                    messageElement.style.color = '#4299e1'; // Blue
                    break;
                case 'action':
                    messageElement.style.color = '#ed8936'; // Orange
                    break;
            }
            
            messageElement.innerHTML = formattedMessage
                .replace(/\[(.*?)\]/g, '<span style="color: #a0aec0">[$1]</span>') // Abilities in brackets
                .replace(/\+(\d+) HP/g, '<span style="color: #48bb78">+$1 HP</span>') // Healing
                .replace(/Miss!/g, '<span style="color: #a0aec0">Miss!</span>'); // Misses
                
            logContent.appendChild(messageElement);
            
            // Scroll to bottom
            logContent.scrollTop = logContent.scrollHeight;
        }
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.battleManager) {
            const isPaused = this.battleManager.togglePause();
            const pauseButton = this.elements.pauseButton;
            if (pauseButton) {
                pauseButton.innerHTML = isPaused ? '&#9658;' : '&#10074;&#10074;'; // Play or pause symbol
            }
        }
    }
    
    /**
     * Set battle speed
     * @param {number} speed - Speed multiplier
     */
    setSpeed(speed) {
        if (this.battleManager) {
            this.battleManager.setSpeed(speed);
            
            // Update button styles
            Object.entries(this.elements.speedButtons).forEach(([btnSpeed, button]) => {
                if (button) {
                    if (btnSpeed === `${speed}x`) {
                        button.classList.add('active');
                    } else {
                        button.classList.remove('active');
                    }
                }
            });
        }
    }
    
    /**
     * Go to next turn
     */
    nextTurn() {
        if (this.battleManager) {
            this.battleManager.startNextTurn();
        }
    }
    
    /**
     * Show settings dialog
     */
    showSettings() {
        // Only offer backgrounds that actually exist
        const bgOptions = ['default', 'grassyfield'];
        const selectedBg = prompt(`Select arena background (${bgOptions.join(', ')}):`, this.arenaBackground);
        
        if (selectedBg && bgOptions.includes(selectedBg)) {
            this.setArenaBackground(this.elements.battleArena, selectedBg);
            
            // Special handling for grassyfield background
            if (selectedBg === 'grassyfield') {
                // Call our utility method that tries multiple paths
                setTimeout(() => {
                    this.setGrassyFieldDirect();
                }, 100);
            }
            
            // Add a visual notification to confirm the change
            const notification = document.createElement('div');
            notification.textContent = `Background changed to ${selectedBg}`;
            notification.style.position = 'fixed';
            notification.style.top = '60px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            notification.style.color = 'white';
            notification.style.padding = '8px 16px';
            notification.style.borderRadius = '4px';
            notification.style.zIndex = '1000';
            document.body.appendChild(notification);
            
            // Remove notification after 2 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 2000);
            
            console.log(`Background changed to ${selectedBg}`);
        }
    }
    
    /**
     * Set Grassy Field as background using direct URL
     * This is a utility method the user can call directly from console
     */
    setGrassyFieldDirect() {
        if (!this.elements || !this.elements.battleArena) {
            console.error('Battle arena element not found');
            return;
        }
        
        const arenaElement = this.elements.battleArena;
        
        // Remove any existing arena classes
        arenaElement.classList.remove('arena-default', 'arena-forest', 'arena-volcano', 'arena-glacier', 'arena-grassyfield');
        
        // Add the grassyfield class
        arenaElement.classList.add('arena-grassyfield');
        
        // Try multiple paths to ensure one works
        const paths = [
            'assets/images/Arena Art/Grassy Field.png',
            './assets/images/Arena Art/Grassy Field.png',
            '../assets/images/Arena Art/Grassy Field.png',
            '../../assets/images/Arena Art/Grassy Field.png',
            '/assets/images/Arena Art/Grassy Field.png',
            'C:/Personal/AutoBattler/assets/images/Arena Art/Grassy Field.png',
            // Try base64 encoded small green rectangle as absolute fallback
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFeQI7Z6j1AwAAAABJRU5ErkJggg=='
        ];
        
        // Try each path
        let currentPath = 0;
        const tryNextPath = () => {
            if (currentPath >= paths.length) {
                console.error('All paths failed, using default background');
                arenaElement.classList.remove('arena-grassyfield');
                arenaElement.classList.add('arena-default');
                arenaElement.style.backgroundImage = '';
                return;
            }
            
            const path = paths[currentPath];
            console.log(`Trying path ${currentPath + 1}/${paths.length}: ${path}`);
            
            // Set the background image
            arenaElement.style.backgroundImage = `url("${path}")`;
            arenaElement.style.backgroundSize = 'cover';
            arenaElement.style.backgroundPosition = 'center';
            
            // If it's the base64 fallback, we're done
            if (path.startsWith('data:')) {
                console.log('Using base64 fallback');
                return;
            }
            
            // Otherwise check if the image loaded
            const img = new Image();
            img.onload = () => {
                console.log(`Success! Path ${currentPath + 1} worked: ${path}`);
            };
            img.onerror = () => {
                console.error(`Path ${currentPath + 1} failed: ${path}`);
                currentPath++;
                tryNextPath();
            };
            img.src = path;
        };
        
        // Start trying paths
        tryNextPath();
        
        // Update background setting
        this.arenaBackground = 'grassyfield';
        
        // Add a notification
        const notification = document.createElement('div');
        notification.textContent = 'Setting Grassy Field background...';
        notification.style.position = 'fixed';
        notification.style.top = '60px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        notification.style.color = 'white';
        notification.style.padding = '8px 16px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '1000';
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
        return 'Attempting to set Grassy Field background...';
    }
    
    /**
     * Show victory/defeat screen
     * @param {string} result - 'victory', 'defeat', or 'draw'
     */
    showBattleResult(result) {
        // DEBUG MESSAGE FOR DEPRECATED DOM BATTLE UI
        console.warn('⚠️ USING DEPRECATED DOM BATTLE RESULT SCREEN: Please use Phaser-based battle scene for improved performance');

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'victory-overlay';
        
        const resultText = document.createElement('h2');
        resultText.className = 'victory-text';
        
        switch (result) {
            case 'victory':
                resultText.textContent = 'VICTORY!';
                resultText.style.color = '#48bb78'; // Green
                break;
            case 'defeat':
                resultText.textContent = 'DEFEAT!';
                resultText.style.color = '#f56565'; // Red
                break;
            case 'draw':
                resultText.textContent = 'DRAW!';
                resultText.style.color = '#a0aec0'; // Gray
                break;
        }
        
        const returnButton = document.createElement('button');
        returnButton.className = 'victory-button mb-4';
        returnButton.textContent = 'Return to Team Builder';
        returnButton.addEventListener('click', () => this.exitBattle());
        
        const logNote = document.createElement('div');
        logNote.className = 'text-sm text-gray-300 mt-2';
        logNote.textContent = 'Battle log is still accessible in the bottom-left corner';
        
        overlay.appendChild(resultText);
        overlay.appendChild(returnButton);
        overlay.appendChild(logNote);
        
        // Add to battle UI
        document.getElementById('battle-ui').appendChild(overlay);
        
        // Enhance battle log visibility
        const battleLog = document.querySelector('.battle-log');
        if (battleLog) {
            battleLog.style.backgroundColor = 'rgba(28, 33, 48, 0.98)'; // More opaque
            battleLog.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)'; // Add glow
        }
        
        // Show immediately instead of using animation delay
        overlay.style.opacity = '1';
        
        /* ANIMATION CODE COMMENTED OUT: Moving to Phaser-based system
        // Animate in with delay
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 100);
        */
    }
    
    /**
     * Handle round end events
     * @param {Object} data - Round end data
     */
    handleRoundEnd(data) {
        // DEBUG MESSAGE FOR DEPRECATED DOM ROUND INDICATOR
        console.warn('⚠️ USING DEPRECATED DOM ROUND INDICATOR: Please use Phaser-based battle scene for improved performance');

        // Create round end visual indicator
        const roundIndicator = document.createElement('div');
        roundIndicator.className = 'round-end-indicator';
        roundIndicator.textContent = `Round ${data.roundNumber} Complete`;
        
        // Style it directly to make it visible without custom CSS
        roundIndicator.style.position = 'absolute';
        roundIndicator.style.top = '50%';
        roundIndicator.style.left = '50%';
        roundIndicator.style.transform = 'translate(-50%, -50%)';
        roundIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        roundIndicator.style.color = 'white';
        roundIndicator.style.padding = '15px 30px';
        roundIndicator.style.borderRadius = '8px';
        roundIndicator.style.fontWeight = 'bold';
        roundIndicator.style.fontSize = '24px';
        roundIndicator.style.zIndex = '100';
        
        // Add to battle arena if available
        const battleArena = document.getElementById('battle-arena');
        if (battleArena) {
            battleArena.appendChild(roundIndicator);
        } else {
            document.body.appendChild(roundIndicator);
        }
        
        // Remove immediately to avoid delays
        setTimeout(() => {
            if (roundIndicator.parentNode) {
                roundIndicator.parentNode.removeChild(roundIndicator);
            }
        }, 100);
        
        /* ANIMATION CODE COMMENTED OUT: Moving to Phaser-based system
        // Show for 2 seconds then fade out
        setTimeout(() => {
            roundIndicator.classList.add('fade-out');
            setTimeout(() => {
                roundIndicator.remove();
            }, 1000); // Fade out duration
        }, 2000); // Display duration
        */
    }

    /**
     * Exit battle
     */
    exitBattle() {
        // Remove our UI
        const battleUI = document.getElementById('battle-ui');
        if (battleUI) {
            document.body.removeChild(battleUI);
        }
        
        // Reset our setup flag
        this.isSetup = false;
        
        // Switch back to team builder
        document.getElementById('game-container').classList.remove('active');
        document.getElementById('team-builder-container').classList.add('active');
    }

    /**
     * Initialize tooltip manager for battle UI
     */
    initializeTooltipManager() {
        // Clean up any existing tooltips first
        this.cleanupTooltips();
        
        // If TooltipManager hasn't been initialized yet
        if (!window.tooltipManager) {
            console.log('BattleUI: Creating new TooltipManager instance');
            // Create a new instance
            window.tooltipManager = new TooltipManager();
        }
        
        // Add battle-specific CSS for tooltips
        this.addBattleTooltipStyles();
    }
    
    /**
     * Clean up all existing tooltips and event listeners
     */
    cleanupTooltips() {
        // Remove all existing tooltip event listeners
        const tooltipElements = document.querySelectorAll('.status-icon');
        tooltipElements.forEach(el => {
            // Clone element to remove all event listeners
            const newEl = el.cloneNode(true);
            if (el.parentNode) {
                el.parentNode.replaceChild(newEl, el);
            }
        });
        
        // Clear any existing tooltip containers
        const tooltipContainers = document.querySelectorAll('.battle-tooltip');
        tooltipContainers.forEach(container => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });
        
        // Reset the battleTooltip property
        this.battleTooltip = null;
        
        console.log('BattleUI: Cleaned up existing tooltips');
    }

    /**
     * Add custom CSS for battle tooltips
     */
    addBattleTooltipStyles() {
        if (!document.getElementById('battle-tooltip-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'battle-tooltip-styles';
            styleEl.textContent = `
                /* Override the info icon for battle status icons */
                .status-icon.has-tooltip::after {
                    content: none; /* Remove the "i" icon */
                }
                
                /* Make status icons more interactive */
                .status-icon {
                    cursor: help;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    position: relative;
                }
                
                .status-icon:hover {
                    transform: scale(1.2);
                    box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
                    z-index: 50;
                }
                
                /* Custom styling for battle tooltips */
                .battle-tooltip {
                    position: fixed; /* Use fixed position */
                    background-color: rgba(20, 30, 46, 0.95); /* Darker blue */
                    color: #e2e8f0;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    max-width: 250px;
                    z-index: 9999; /* Very high z-index */
                    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5), 0 0 5px rgba(66, 153, 225, 0.5); /* Blue glow */
                    pointer-events: none;
                    border: 1px solid rgba(66, 153, 225, 0.3); /* Subtle blue border */
                    display: none; /* Hide initially */
                    transition: opacity 0.2s ease;
                    text-align: left;
                }
                
                .battle-tooltip.visible {
                    display: block;
                }
                
                .tooltip-title {
                    font-weight: bold;
                    margin-bottom: 4px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                    padding-bottom: 4px;
                    color: #90cdf4; /* Light blue for title */
                    font-size: 13px;
                }
                
                .tooltip-content {
                    font-size: 11px;
                    line-height: 1.4;
                }

                .tooltip-content div {
                    margin-bottom: 3px;
                }
            `;
            document.head.appendChild(styleEl);
        }
    }

    /**
     * Add a tooltip to a status icon
     * @param {HTMLElement} icon - The status icon element
     * @param {string} content - HTML content for the tooltip
     */
    addStatusTooltip(icon, content) {
        // Add custom class and cursor style
        icon.classList.add('battle-status-tooltip');
        icon.style.cursor = 'help';
        
        // Create the tooltip element if it doesn't exist
        if (!this.battleTooltip) {
            this.battleTooltip = document.createElement('div');
            this.battleTooltip.className = 'battle-tooltip';
            this.battleTooltip.style.position = 'fixed'; // Use fixed positioning
            this.battleTooltip.style.zIndex = '9999'; // Ensure high z-index
            document.body.appendChild(this.battleTooltip);
        }
        
        // Store content on the icon for easy access
        icon.dataset.tooltipContent = content;
        
        // Add event listeners for both hover and click
        icon.addEventListener('mouseenter', () => {
            this.showStatusTooltip(icon, content);
        });
        
        icon.addEventListener('mouseleave', () => {
            this.hideStatusTooltip();
        });
        
        // Also add click event as a fallback
        icon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent battle UI click events
            this.showStatusTooltip(icon, content);
            
            // Hide tooltip when clicking elsewhere
            const hideOnOutsideClick = (event) => {
                if (!icon.contains(event.target)) {
                    this.hideStatusTooltip();
                    document.removeEventListener('click', hideOnOutsideClick);
                }
            };
            
            // Add a slight delay to avoid immediate trigger
            setTimeout(() => {
                document.addEventListener('click', hideOnOutsideClick);
            }, 10);
        });
    }

    /**
     * Show a status tooltip for an icon
     * @param {HTMLElement} icon - The status icon element
     * @param {string} content - HTML content for the tooltip
     */
    showStatusTooltip(icon, content) {
        // Get tooltip content from data attribute if not provided
        const tooltipContent = content || icon.dataset.tooltipContent; 
        if (!tooltipContent || !this.battleTooltip) return;

        // Set content first
        this.battleTooltip.innerHTML = tooltipContent;
        
        // Position the tooltip before making it visible
        const rect = icon.getBoundingClientRect();
        
        // First set it to a default position
        this.battleTooltip.style.left = `${rect.left + rect.width / 2 - 125}px`; // Center tooltip
        this.battleTooltip.style.top = `${rect.top - 10}px`; // Temporary position
        
        // Force layout recalculation to ensure offsetHeight is accurate
        this.battleTooltip.style.opacity = '0';
        this.battleTooltip.style.display = 'block';
        
        // Now use the correct height to position properly
        const tooltipHeight = this.battleTooltip.offsetHeight;
        this.battleTooltip.style.top = `${rect.top - tooltipHeight - 10}px`; // Position above icon
        
        // Check if tooltip would go offscreen and adjust if needed
        const tooltipRect = this.battleTooltip.getBoundingClientRect();
        if (tooltipRect.left < 10) {
            this.battleTooltip.style.left = '10px';
        }
        if (tooltipRect.right > window.innerWidth - 10) {
            this.battleTooltip.style.left = `${window.innerWidth - 250 - 10}px`;
        }
        if (tooltipRect.top < 10) {
            // If tooltip would go above the screen, position it below the icon instead
            this.battleTooltip.style.top = `${rect.bottom + 10}px`;
        }
        
        // Make visible
        this.battleTooltip.style.opacity = '1';
        this.battleTooltip.classList.add('visible');
    }
    
    /**
     * Hide the status tooltip
     */
    hideStatusTooltip() {
        if (this.battleTooltip) {
            this.battleTooltip.classList.remove('visible');
            this.battleTooltip.style.display = 'none';
        }
    }
    
    /**
     * Copy battle log to clipboard
     */
    copyBattleLog() {
        // Extract plain text from log messages
        const logText = this.logMessages.map(msg => msg.message).join('\n');
        
        // Copy to clipboard
        navigator.clipboard.writeText(logText)
            .then(() => {
                // Show feedback
                const copyButton = document.querySelector('.battle-log button');
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                copyButton.style.backgroundColor = '#48bb78'; // Green
                
                // Reset after 2 seconds
                setTimeout(() => {
                    copyButton.textContent = originalText;
                    copyButton.style.backgroundColor = '';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy log:', err);
                alert('Failed to copy battle log to clipboard');
            });
    }
}

// Export for use in other modules
window.BattleUI = BattleUI;
// Also make available as a global variable
if (typeof BattleUI === 'undefined') {
    BattleUI = window.BattleUI;
}

console.log('BattleUI class loaded and available as window.BattleUI');