/**
 * Team Builder UI
 * Manages the user interface for team selection
 * Based on the React mockup concept
 */

class TeamBuilderUI {
    /**
     * Create a new Team Builder UI
     * @param {TeamManager} teamManager - Reference to the team manager
     */
    constructor(teamManager) {
        this.teamManager = teamManager || null;
        this.availableHeroes = [];
        this.selectedHeroes = [null, null, null];
        this.enemySelectedHeroes = [null, null, null];
        this.selectedHeroDetails = null;
        this.battleMode = 'random';
        this.activeFilters = {
            types: [],
            roles: []
        }; // Maintained for backward compatibility
        this.filterManager = null; // Will hold the FilterManager
        this.isSelectingEnemyTeam = false; // Flag to track if we're selecting enemy team
        this.imageLoader = null; // Will hold the TeamBuilderImageLoader
        this.heroDetailManager = null; // Will hold the HeroDetailPanelManager
        this.heroGridManager = null; // Will hold the HeroGridManager
        this.teamSlotsManager = null; // Will hold the TeamSlotsManager
        this.typeColors = {
            fire: '#ff4757',
            water: '#1e90ff',
            nature: '#2ed573',
            electric: '#F7DF1E',
            ice: '#ADD8E6',
            rock: '#8B4513',
            metal: '#C0C0C0',
            air: '#70a1ff',
            light: '#ffd700',
            dark: '#9900cc',
            psychic: '#DA70D6',
            poison: '#8A2BE2',
            physical: '#CD5C5C',
            arcane: '#7B68EE',
            mechanical: '#778899',
            void: '#2F4F4F',
            crystal: '#AFEEEE',
            storm: '#4682B4',
            ethereal: '#FFFFFF',
            blood: '#8B0000',
            plague: '#556B2F',
            gravity: '#36454F'
        };
        this.rarityColors = {
            Common: '#aaaaaa',
            Uncommon: '#2ed573',
            Rare: '#1e90ff',
            Epic: '#9900cc',
            Legendary: '#ffd700'
        };
    }

    /**
     * Initialize the team builder UI
     */
    async initialize() {
        console.log('TeamBuilderUI: Initializing...');
        // Fetch available heroes from data file
        try {
            // Try both relative and absolute paths
            let response;
            try {
                response = await fetch('data/characters.json');
            } catch (err) {
                console.log('Trying with alternate path...');
                response = await fetch('./data/characters.json');
            }
            const data = await response.json();
            this.availableHeroes = data.characters;
            console.log('TeamBuilderUI: Loaded', this.availableHeroes.length, 'heroes');
            
            // Initialize the image loader
            await this.initializeImageLoader();
            
            // Initialize the hero detail manager
            await this.initializeHeroDetailManager();
            
            // Initialize the filter manager
            await this.initializeFilterManager();
            
            // Initialize the hero grid manager
            await this.initializeHeroGridManager();
            
            // Initialize the team slots manager
            await this.initializeTeamSlotsManager();
            
            this.renderFilters();
            this.renderHeroGrid();
            this.renderTeamSlots();
            this.renderBattleModes();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error loading characters data:', error);
            
            // Display error on the page for debugging
            const heroesGrid = document.getElementById('heroes-grid');
            if (heroesGrid) {
                heroesGrid.innerHTML = `<div style="color: red; padding: 20px;">Error loading heroes data: ${error.message}</div>`;
            }
        }
    }

    /**
     * Render filter options for types and roles
     * Delegated to FilterManager
     */
    renderFilters() {
        if (this.filterManager) {
            this.filterManager.renderFilters();
            return;
        }
        
        // Minimal fallback for error handling
        console.error('Cannot render filters - FilterManager not available');
        const heroesSection = document.getElementById('available-heroes');
        
        // Add a simple error message
        let filterSection = document.getElementById('hero-filters');
        if (!filterSection) {
            filterSection = document.createElement('div');
            filterSection.id = 'hero-filters';
            filterSection.innerHTML = '<div class="filter-error">Filter system unavailable</div>';
            
            // Insert filters before the heroes grid
            const heroesGrid = document.getElementById('heroes-grid');
            if (heroesGrid) {
                heroesSection.insertBefore(filterSection, heroesGrid);
            } else {
                heroesSection.appendChild(filterSection);
            }
        }
    }

    /**
     * Render the available heroes grid
     * Delegated to HeroGridManager
     */
    renderHeroGrid() {
        if (this.heroGridManager) {
            this.heroGridManager.renderHeroGrid();
            return;
        }
        
        // Minimal fallback for error handling
        console.error('Cannot render hero grid - HeroGridManager not available');
        const heroesGrid = document.getElementById('heroes-grid');
        if (heroesGrid) {
            heroesGrid.innerHTML = '<div class="grid-error">Hero grid system unavailable</div>';
        }
    }

    /**
     * Render the team slots
     * Delegated to TeamSlotsManager
     */
    renderTeamSlots() {
        if (this.teamSlotsManager) {
            this.teamSlotsManager.renderTeamSlots();
            return;
        }
        
        // Minimal fallback for error handling
        console.error('Cannot render team slots - TeamSlotsManager not available');
        const teamSlots = document.getElementById('team-slots');
        if (teamSlots) {
            teamSlots.innerHTML = '<div class="slots-error">Team slots system unavailable</div>';
        }
    }

    /**
     * Render the team synergies
     * Delegated to TeamSlotsManager
     */
    renderTeamSynergies() {
        if (this.teamSlotsManager) {
            this.teamSlotsManager.renderTeamSynergies();
            return;
        }
        
        // Minimal fallback for error handling
        console.error('Cannot render team synergies - TeamSlotsManager not available');
        const synergiesList = document.getElementById('synergies-list');
        if (synergiesList) {
            synergiesList.innerHTML = '<li class="synergy-error">Team synergies unavailable</li>';
        }
    }

    /**
     * Render the hero details panel
     * Delegates to HeroDetailPanelManager
     */
    renderHeroDetails() {
        if (!this.heroDetailManager) {
            console.error('Cannot render hero details - HeroDetailPanelManager not available');
            return;
        }
        
        if (this.selectedHeroDetails) {
            this.heroDetailManager.renderDetails(this.selectedHeroDetails);
        } else {
            this.heroDetailManager.clearDetails();
        }
    }
    
    // Method getDetailedScalingText() has been moved to TeamBuilderUtils
    
    /**
     * Add character art directly to a detail panel without using the observer
     * Delegates to HeroDetailPanelManager
     */
    addArtToDetailPanel(hero, detailIconContainer) {
        if (!this.heroDetailManager) {
            console.error('Cannot add art to detail panel - HeroDetailPanelManager not available');
            return;
        }
        
        this.heroDetailManager.addArtToPanel(hero, detailIconContainer);
    }
    
    /**
     * Update an existing hero details panel without rebuilding the entire DOM structure
     * Delegates to HeroDetailPanelManager
     * @param {HTMLElement} detailHero - The existing detail hero element
     */
    updateExistingHeroDetails(detailHero) {
        if (!this.heroDetailManager) {
            console.error('Cannot update existing hero details - HeroDetailPanelManager not available');
            return;
        }
        
        if (!this.selectedHeroDetails) {
            console.error('Cannot update hero details - no hero selected');
            return;
        }
        
        this.heroDetailManager.updateExistingDetails(this.selectedHeroDetails, detailHero);
    }

    /**
     * Render battle mode options
     */
    renderBattleModes() {
        const battleModes = document.getElementById('battle-modes');
        battleModes.innerHTML = '';

        const modes = [
            {
                id: 'random',
                name: 'Random Opponent',
                description: 'Battle against a randomly generated team'
            },
            {
                id: 'custom',
                name: 'Custom Battle',
                description: 'Choose your opponent\'s team composition'
            },
            {
                id: 'campaign',
                name: 'Campaign Mode',
                description: 'Fight through increasingly difficult encounters'
            }
        ];

        // Get state from TeamSlotsManager if available
        const isSelectingEnemyTeam = this.teamSlotsManager ? 
            this.teamSlotsManager.isSelectingEnemyTeam : this.isSelectingEnemyTeam;

        modes.forEach(mode => {
            const modeElement = document.createElement('div');
            
            // Add special class for custom mode when selecting enemy team
            let selectedClass = mode.id === this.battleMode ? 'selected' : '';
            if (mode.id === 'custom' && this.battleMode === 'custom' && isSelectingEnemyTeam) {
                selectedClass = 'selected enemy-selection-active';
            }
            
            modeElement.className = `battle-mode ${selectedClass}`;
            modeElement.dataset.modeId = mode.id;

            const modeName = document.createElement('div');
            modeName.className = 'battle-mode-name';
            modeName.textContent = mode.name;
            
            // Add indicator for enemy team selection
            if (mode.id === 'custom' && this.battleMode === 'custom' && isSelectingEnemyTeam) {
                modeName.innerHTML = `${mode.name} <span style="color: #ff4757; font-size: 12px;">(Selecting Enemy)</span>`;
            }

            const modeDesc = document.createElement('div');
            modeDesc.className = 'battle-mode-desc';
            modeDesc.textContent = mode.description;

            modeElement.appendChild(modeName);
            modeElement.appendChild(modeDesc);
            battleModes.appendChild(modeElement);

            // Add event listener
            modeElement.addEventListener('click', () => {
                // Only allow changing battle mode if not in enemy selection mode
                if (!isSelectingEnemyTeam || mode.id === this.battleMode) {
                    this.battleMode = mode.id;
                    this.renderBattleModes();
                    
                    // Reset enemy selection when changing modes
                    if (isSelectingEnemyTeam && mode.id !== 'custom') {
                        // Use TeamSlotsManager if available
                        if (this.teamSlotsManager) {
                            this.teamSlotsManager.toggleTeamSelection(false);
                        } else {
                            this.isSelectingEnemyTeam = false;
                            this.renderTeamSlots();
                        }
                    }
                } else {
                    // If in enemy selection, show a message that they should complete or cancel enemy selection first
                    if (window.soundManager) {
                        window.soundManager.play('error');
                    }
                    alert('Please complete enemy team selection or click "Back to Your Team" before changing battle mode');
                }
            });
        });
    }

    /**
     * Update the start battle button state
     */
    updateStartBattleButton() {
        const startButton = document.getElementById('start-battle');
        if (!startButton) {
            console.error('Start battle button not found');
            return;
        }
        
        let selectedHeroes = this.selectedHeroes;
        let enemySelectedHeroes = this.enemySelectedHeroes;
        let isSelectingEnemyTeam = this.isSelectingEnemyTeam;
        
        // Get state from TeamSlotsManager if available
        if (this.teamSlotsManager) {
            selectedHeroes = this.teamSlotsManager.getPlayerTeam();
            enemySelectedHeroes = this.teamSlotsManager.getEnemyTeam();
            isSelectingEnemyTeam = this.teamSlotsManager.isSelectingEnemyTeam;
        }
        
        const hasTeamMembers = selectedHeroes.some(hero => hero !== null);
        
        // For Custom Battle mode, we need to check if we're ready to select enemy team
        if (this.battleMode === 'custom' && !isSelectingEnemyTeam) {
            // If we have team members but haven't begun enemy team selection
            if (hasTeamMembers) {
                startButton.textContent = 'Choose Enemy Team';
                startButton.disabled = false;
            } else {
                startButton.textContent = 'Start Battle';
                startButton.disabled = true;
            }
        } else {
            // For Random and Campaign modes, or if we're already selecting enemy team
            startButton.textContent = 'Start Battle';
            
            if (isSelectingEnemyTeam) {
                // When selecting enemy team, we need at least one enemy
                startButton.disabled = !enemySelectedHeroes.some(hero => hero !== null);
            } else {
                // For Random or Campaign, just check player team
                startButton.disabled = !hasTeamMembers;
            }
        }
    }

    // Method createStatBox() has been moved to TeamBuilderUtils

    /**
     * Select a hero to view details
     * @param {Object} hero - The hero to select
     */
    selectHeroDetails(hero) {
        // Disable observer during hero selection to prevent excessive log messages
        if (window.disableArtObserver) {
            window.disableArtObserver();
        }
        
        try {
            this.selectedHeroDetails = hero;
            
            // Update HeroGridManager if available
            if (this.heroGridManager) {
                this.heroGridManager.updateSelectedHero(hero);
            } else {
                this.renderHeroGrid();
            }
            
            // Use HeroDetailPanelManager if available, otherwise fall back to original implementation
            if (this.heroDetailManager) {
                if (hero) {
                    this.heroDetailManager.renderDetails(hero);
                } else {
                    this.heroDetailManager.clearDetails();
                }
            } else {
                this.renderHeroDetails();
            }
            
            // Update TeamSlotsManager if available
            if (this.teamSlotsManager) {
                this.teamSlotsManager.setSelectedHero(hero);
            } else {
                this.renderTeamSlots();
            }
            
            // Play select sound
            if (window.soundManager) {
                window.soundManager.play('select');
            }
        } finally {
            // Re-enable observer when done
            // Note: this is redundant with the one in renderHeroDetails, but ensures
            // it happens even if renderHeroDetails fails
            if (window.enableArtObserver) {
                window.enableArtObserver();
            }
        }
    }

    /**
     * Add the selected hero to a team slot
     * Delegated to TeamSlotsManager
     * @param {number} position - The slot position (0-2)
     */
    addHeroToTeam(position) {
        if (this.teamSlotsManager) {
            this.teamSlotsManager.addHeroToTeam(position);
            return;
        }
        
        // Minimal fallback
        console.error('Cannot add hero to team - TeamSlotsManager not available');
    }

    /**
     * Remove a hero from a team slot
     * Delegated to TeamSlotsManager
     * @param {number} position - The slot position (0-2)
     */
    removeHeroFromTeam(position) {
        if (this.teamSlotsManager) {
            this.teamSlotsManager.removeHeroFromTeam(position);
            return;
        }
        
        // Minimal fallback
        console.error('Cannot remove hero from team - TeamSlotsManager not available');
    }

    /**
     * Initialize event listeners for the start battle button
     */
    setupEventListeners() {
        const startButton = document.getElementById('start-battle');
        startButton.addEventListener('click', () => {
            if (!startButton.disabled) {
                this.startBattle();
            }
        });
    }
    
    /**
     * Initialize the character art image loader
     */
    async initializeImageLoader() {
        try {
            // Check if window.TeamBuilderImageLoader is available (using window explicitly)
            if (typeof window.TeamBuilderImageLoader === 'undefined') {
                console.warn('TeamBuilderImageLoader not found, skipping image loading');
                return;
            }
            
            // Create the image loader
            this.imageLoader = new window.TeamBuilderImageLoader();
            
            // Initialize it
            await this.imageLoader.initialize();
            
            console.log('TeamBuilderUI: Image loader initialized');
        } catch (error) {
            console.error('Error initializing image loader:', error);
        }
    }
    
    /**
     * Initialize the hero detail panel manager
     */
    async initializeHeroDetailManager() {
        try {
            // Check if HeroDetailPanelManager is available
            if (typeof window.HeroDetailPanelManager === 'undefined') {
                console.warn('HeroDetailPanelManager not found, will use original implementation');
                return;
            }
            
            // Create the detail panel manager
            this.heroDetailManager = new window.HeroDetailPanelManager(this);
            
            // Verify required methods exist
            const methodCheck = {
                renderDetails: typeof this.heroDetailManager.renderDetails === 'function',
                clearDetails: typeof this.heroDetailManager.clearDetails === 'function',
                updateExistingDetails: typeof this.heroDetailManager.updateExistingDetails === 'function',
                addArtToPanel: typeof this.heroDetailManager.addArtToPanel === 'function'
            };
            
            console.log('TeamBuilderUI: HeroDetailPanelManager initialized with methods:', methodCheck);
            
            if (!methodCheck.renderDetails || !methodCheck.clearDetails) {
                console.error('HeroDetailPanelManager missing required methods!');
                this.heroDetailManager = null;
                return;
            }
            
            console.log('TeamBuilderUI: Hero detail manager initialized successfully');
        } catch (error) {
            console.error('Error initializing hero detail manager:', error);
            this.heroDetailManager = null;
        }
    }

    /**
     * Initialize the filter manager
     */
    async initializeFilterManager() {
        try {
            // Check if FilterManager is available
            if (typeof window.FilterManager === 'undefined') {
                console.warn('FilterManager not found, will use original implementation');
                return false;
            }
            
            // Create the filter manager
            this.filterManager = new window.FilterManager(this);
            
            // Verify required methods exist
            const methodCheck = {
                renderFilters: typeof this.filterManager.renderFilters === 'function',
                getActiveFilters: typeof this.filterManager.getActiveFilters === 'function',
                toggleFilter: typeof this.filterManager.toggleFilter === 'function',
                clearFilters: typeof this.filterManager.clearFilters === 'function'
            };
            
            console.log('TeamBuilderUI: FilterManager initialized with methods:', methodCheck);
            
            if (!methodCheck.renderFilters || !methodCheck.getActiveFilters) {
                console.error('FilterManager missing required methods!');
                this.filterManager = null;
                return false;
            }
            
            // Set initial filters from the TeamBuilderUI state
            this.filterManager.setActiveFilters(this.activeFilters);
            
            console.log('TeamBuilderUI: Filter manager initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing filter manager:', error);
            this.filterManager = null;
            return false;
        }
    }
    
    /**
     * Initialize the team slots manager
     */
    async initializeTeamSlotsManager() {
        try {
            // Check if TeamSlotsManager is available
            if (typeof window.TeamSlotsManager === 'undefined') {
                console.warn('TeamSlotsManager not found, will use original implementation');
                return false;
            }
            
            // Create the team slots manager
            this.teamSlotsManager = new window.TeamSlotsManager(this);
            
            // Verify required methods exist
            const methodCheck = {
                renderTeamSlots: typeof this.teamSlotsManager.renderTeamSlots === 'function',
                addHeroToTeam: typeof this.teamSlotsManager.addHeroToTeam === 'function',
                removeHeroFromTeam: typeof this.teamSlotsManager.removeHeroFromTeam === 'function',
                toggleTeamSelection: typeof this.teamSlotsManager.toggleTeamSelection === 'function'
            };
            
            console.log('TeamBuilderUI: TeamSlotsManager initialized with methods:', methodCheck);
            
            if (!methodCheck.renderTeamSlots || !methodCheck.addHeroToTeam) {
                console.error('TeamSlotsManager missing required methods!');
                this.teamSlotsManager = null;
                return false;
            }
            
            console.log('TeamBuilderUI: Team slots manager initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing team slots manager:', error);
            this.teamSlotsManager = null;
            return false;
        }
    }
    
    /**
     * Initialize the hero grid manager
     */
    async initializeHeroGridManager() {
        try {
            // Check if HeroGridManager is available
            if (typeof window.HeroGridManager === 'undefined') {
                console.warn('HeroGridManager not found, will use original implementation');
                return false;
            }
            
            // Create the hero grid manager
            this.heroGridManager = new window.HeroGridManager(this);
            
            // Verify required methods exist
            const methodCheck = {
                renderHeroGrid: typeof this.heroGridManager.renderHeroGrid === 'function',
                selectHero: typeof this.heroGridManager.selectHero === 'function',
                updateFilters: typeof this.heroGridManager.updateFilters === 'function',
                updateSelectedHero: typeof this.heroGridManager.updateSelectedHero === 'function'
            };
            
            console.log('TeamBuilderUI: HeroGridManager initialized with methods:', methodCheck);
            
            if (!methodCheck.renderHeroGrid || !methodCheck.selectHero) {
                console.error('HeroGridManager missing required methods!');
                this.heroGridManager = null;
                return false;
            }
            
            console.log('TeamBuilderUI: Hero grid manager initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing hero grid manager:', error);
            this.heroGridManager = null;
            return false;
        }
    }

    /**
     * Callback for filter changes
     * @param {Object} filters - The updated filters
     */
    onFiltersChanged(filters) {
        // Update local filters reference
        this.activeFilters = filters;
        
        // Update the hero grid based on new filters
        if (this.heroGridManager) {
            this.heroGridManager.updateFilters(filters);
        } else {
            this.renderHeroGrid();
        }
    }
    
    /**
     * Callback for hero selection
     * @param {Object} hero - The selected hero
     */
    onHeroSelected(hero) {
        this.selectHeroDetails(hero);
    }
    
    /**
     * Callback for team selection changes
     * @param {boolean} isSelectingEnemy - Whether enemy team is being selected
     */
    onTeamSelectionChanged(isSelectingEnemy) {
        this.isSelectingEnemyTeam = isSelectingEnemy;
        this.renderBattleModes();
        this.updateStartBattleButton();
    }

    /**
     * Start a battle with the selected team
     */
    startBattle() {
        // Get state from TeamSlotsManager if available
        let isSelectingEnemyTeam = this.isSelectingEnemyTeam;
        let team = [];
        
        if (this.teamSlotsManager) {
            isSelectingEnemyTeam = this.teamSlotsManager.isSelectingEnemyTeam;
            team = this.teamSlotsManager.getPlayerTeam().filter(hero => hero !== null);
        } else {
            team = this.selectedHeroes.filter(hero => hero !== null);
        }
        
        // For Custom Battle mode, we need to switch to enemy team selection if not done yet
        if (this.battleMode === 'custom' && !isSelectingEnemyTeam) {
            if (team.length === 0) {
                alert('Please select at least one hero for your team!');
                // Play error sound
                if (window.soundManager) {
                    window.soundManager.play('error');
                }
                return;
            }
            
            // Switch to enemy team selection mode using TeamSlotsManager if available
            if (this.teamSlotsManager) {
                this.teamSlotsManager.toggleTeamSelection(true);
            } else {
                this.isSelectingEnemyTeam = true;
                this.renderTeamSlots();
                this.updateStartBattleButton();
            }
            
            // Play selection sound
            if (window.soundManager) {
                window.soundManager.play('click');
            }
            
            return; // Exit without starting battle
        }
        
        if (team.length === 0) {
            alert('Please select at least one hero for your team!');
            // Play error sound
            if (window.soundManager) {
                window.soundManager.play('error');
            }
            return;
        }
        
        // Play battle start sound
        if (window.soundManager) {
            window.soundManager.play('battle_start');
        }

        console.log('Starting battle with team:', team);
        console.log('Battle mode:', this.battleMode);

        // Remove any existing battle UI elements
        const existingBattleUI = document.getElementById('battle-ui');
        if (existingBattleUI) {
            document.body.removeChild(existingBattleUI);
        }
        
        // Switch to battle scene
        document.getElementById('team-builder-container').classList.remove('active');
        
        // Clear the game container and make it active
        const gameContainer = document.getElementById('game-container');
        gameContainer.innerHTML = ''; // Clear any previous content
        gameContainer.classList.add('active');

        // Initialize the battle manager and start the battle
        if (this.teamManager) {
            // Get teams from TeamSlotsManager if available
            let playerTeam = team;
            let enemyTeam = [];
            let isSelectingEnemyTeam = this.isSelectingEnemyTeam;
            
            if (this.teamSlotsManager) {
                playerTeam = this.teamSlotsManager.getPlayerTeam().filter(hero => hero !== null);
                enemyTeam = this.teamSlotsManager.getEnemyTeam().filter(hero => hero !== null);
                isSelectingEnemyTeam = this.teamSlotsManager.isSelectingEnemyTeam;
            }
            
            this.teamManager.setPlayerTeam(playerTeam);
            
            // For Custom battle, use the selected enemy team
            if (this.battleMode === 'custom' && isSelectingEnemyTeam) {
                if (enemyTeam.length > 0) {
                    this.teamManager.setCustomEnemyTeam(enemyTeam);
                } else {
                    // Fallback if somehow no enemies were selected
                    this.teamManager.generateEnemyTeam('random');
                }
            } else {
                // For other modes, generate enemy team as usual
                this.teamManager.generateEnemyTeam(this.battleMode);
            }
            
            // Start the battle with our teams
            if (window.battleManager) {
                // We need to ensure BattleUI is available before starting the battle
                if (typeof window.BattleUI === 'undefined') {
                    console.error('BattleUI class not found, attempting to load it');
                    
                    // Dynamically load the BattleUI script
                    const loadBattleUI = new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'js/ui/BattleUI.js';
                        script.onload = () => {
                            console.log('BattleUI script loaded successfully');
                            resolve();
                        };
                        script.onerror = () => {
                            console.error('Failed to load BattleUI script');
                            reject(new Error('Failed to load BattleUI script'));
                        };
                        document.head.appendChild(script);
                    });
                    
                    // Try to load the script before continuing
                    loadBattleUI.then(() => {
                        this.startBattleWithDelay();
                    }).catch(error => {
                        console.error('Error loading BattleUI:', error);
                        alert('Failed to load battle system. Please refresh and try again.');
                    });
                    
                    return; // Exit and wait for script to load
                }
                
                // BattleUI is available, proceed with starting the battle
                this.startBattleWithDelay();
            }
        }
    }

    // Method splitTypes() has been moved to TeamBuilderUtils

    // Method renderMultiTypeSpans() has been moved to TeamBuilderUtils

    // Method getOrdinalSuffix() has been moved to TeamBuilderUtils
    
    /**
     * Start the battle with a delay to ensure scripts are loaded
     */
    startBattleWithDelay() {
        // Make sure the battleManager is initialized with BattleUI
        setTimeout(() => {
            try {
                // Initialize BattleUI first if needed
                if (!window.battleManager.battleUI) {
                    window.battleManager.initialize();
                }
                
                // Then start the battle
                window.battleManager.startBattle(
                    this.teamManager.playerTeam,
                    this.teamManager.enemyTeam
                );
            } catch (error) {
                console.error('Error starting battle:', error);
                alert('Error starting battle. See console for details.');
            }
        }, 500); // Increased delay to ensure script loading
    }
}
