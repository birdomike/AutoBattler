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
        };
        this.isSelectingEnemyTeam = false; // Flag to track if we're selecting enemy team
        this.imageLoader = null; // Will hold the TeamBuilderImageLoader
        this.heroDetailManager = null; // Will hold the HeroDetailPanelManager
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
     * Delegated to FilterManager when available
     */
    renderFilters() {
        if (this.filterManager) {
            this.filterManager.renderFilters();
            return;
        }
        
        // Original implementation follows for fallback
        const heroesSection = document.getElementById('available-heroes');
        
        // Check if filter section already exists
        let filterSection = document.getElementById('hero-filters');
        if (!filterSection) {
            filterSection = document.createElement('div');
            filterSection.id = 'hero-filters';
            
            // Insert filters before the heroes grid
            const heroesGrid = document.getElementById('heroes-grid');
            heroesSection.insertBefore(filterSection, heroesGrid);
        } else {
            filterSection.innerHTML = '';
        }

        // Create type filters
        const typeFilters = document.createElement('div');
        typeFilters.className = 'filter-group';
        
        const typeLabel = document.createElement('div');
        typeLabel.className = 'filter-label';
        typeLabel.textContent = 'Filter by Type:';
        typeFilters.appendChild(typeLabel);
        
        // Instead of extracting types from heroes, use all 22 types from the design
        const allTypes = [
            'fire', 'water', 'nature', 'electric', 'ice', 'rock', 'metal', 'air', 
            'light', 'dark', 'psychic', 'poison', 'physical', 'arcane', 'mechanical', 
            'void', 'crystal', 'storm', 'ethereal', 'blood', 'plague', 'gravity'
        ];
        
        const typeButtonsContainer = document.createElement('div');
        typeButtonsContainer.className = 'filter-buttons';
        
        allTypes.forEach(type => {
            const typeButton = document.createElement('button');
            typeButton.className = `filter-button ${this.activeFilters.types.includes(type) ? 'active' : ''}`;
            typeButton.dataset.type = type;
            
            // Special handling for Ethereal to use higher opacity and black text
            if (type === 'ethereal') {
                typeButton.style.backgroundColor = `${this.typeColors[type]}EE`; // 93% opacity for Ethereal
                typeButton.style.color = '#000000'; // Black text for Ethereal
                typeButton.style.fontWeight = 'bold'; // Make text bolder for better contrast
            } else {
                // Normal styling for other types
                typeButton.style.backgroundColor = `${this.typeColors[type]}88`; // Regular opacity
            }
            
            typeButton.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            
            // Add event listener
            typeButton.addEventListener('click', () => {
                const index = this.activeFilters.types.indexOf(type);
                if (index === -1) {
                    // Add filter
                    this.activeFilters.types.push(type);
                    typeButton.classList.add('active');
                } else {
                    // Remove filter
                    this.activeFilters.types.splice(index, 1);
                    typeButton.classList.remove('active');
                }
                
                // Re-render heroes grid and update filters UI
                this.renderHeroGrid();
                this.renderFilters(); // Re-render to show/hide clear button
                
                // Play sound
                if (window.soundManager) {
                    window.soundManager.play('click');
                }
            });
            
            // Add hover sound
            if (window.soundManager) {
                window.soundManager.addHoverSound(typeButton);
            }
            
            typeButtonsContainer.appendChild(typeButton);
        });
        
        typeFilters.appendChild(typeButtonsContainer);
        filterSection.appendChild(typeFilters);
        
        // Create role filters
        const roleFilters = document.createElement('div');
        roleFilters.className = 'filter-group';
        
        const roleLabel = document.createElement('div');
        roleLabel.className = 'filter-label';
        roleLabel.textContent = 'Filter by Role:';
        roleFilters.appendChild(roleLabel);
        
        // Instead of extracting roles from heroes, use all 22 roles from the design
        const allRoles = [
            'Warrior', 'Sentinel', 'Berserker', 'Ranger', 'Assassin', 'Bulwark',
            'Mage', 'Invoker', 'Sorcerer', 'Summoner', 'Occultist', 'Mystic',
            'Champion', 'Wildcaller', 'Striker', 'Emissary', 'Elementalist',
            'Warden', 'Skirmisher', 'Battlemage', 'Venomancer', 'Trickster'
        ];
        
        const roleButtonsContainer = document.createElement('div');
        roleButtonsContainer.className = 'filter-buttons';
        
        allRoles.forEach(role => {
            const roleButton = document.createElement('button');
            roleButton.className = `filter-button ${this.activeFilters.roles.includes(role) ? 'active' : ''}`;
            roleButton.dataset.role = role;
            roleButton.textContent = role;
            
            // Add event listener
            roleButton.addEventListener('click', () => {
                const index = this.activeFilters.roles.indexOf(role);
                if (index === -1) {
                    // Add filter
                    this.activeFilters.roles.push(role);
                    roleButton.classList.add('active');
                } else {
                    // Remove filter
                    this.activeFilters.roles.splice(index, 1);
                    roleButton.classList.remove('active');
                }
                
                // Re-render heroes grid and update filters UI
                this.renderHeroGrid();
                this.renderFilters(); // Re-render to show/hide clear button
                
                // Play sound
                if (window.soundManager) {
                    window.soundManager.play('click');
                }
            });
            
            // Add hover sound
            if (window.soundManager) {
                window.soundManager.addHoverSound(roleButton);
            }
            
            roleButtonsContainer.appendChild(roleButton);
        });
        
        roleFilters.appendChild(roleButtonsContainer);
        filterSection.appendChild(roleFilters);
        
        // Add clear filters button (only if filters are active)
        const hasActiveFilters = this.activeFilters.types.length > 0 || this.activeFilters.roles.length > 0;
        if (hasActiveFilters) {
            const clearButton = document.createElement('button');
            clearButton.className = 'clear-filters-btn';
            clearButton.id = 'clear-filters-btn';
            clearButton.textContent = 'Clear Filters';
            clearButton.addEventListener('click', () => {
                this.activeFilters.types = [];
                this.activeFilters.roles = [];
                this.renderFilters();
                this.renderHeroGrid();
                
                // Play sound
                if (window.soundManager) {
                    window.soundManager.play('click');
                }
            });
            
            // Add hover sound
            if (window.soundManager) {
                window.soundManager.addHoverSound(clearButton);
            }
            
            filterSection.appendChild(clearButton);
        }
    }

    /**
     * Render the available heroes grid
     */
    renderHeroGrid() {
        const heroesGrid = document.getElementById('heroes-grid');
        heroesGrid.innerHTML = '';

        // Filter heroes based on active filters
        let filteredHeroes = [...this.availableHeroes];
        
        // Apply type filters
        if (this.activeFilters.types.length > 0) {
            filteredHeroes = filteredHeroes.filter(hero => {
                // Split the hero's type if it contains multiple types
                const heroTypes = TeamBuilderUtils.splitTypes(hero.type);
                
                // Check if any of the hero's types match any of the active filters
                return heroTypes.some(type => this.activeFilters.types.includes(type));
            });
        }
        
        // Apply role filters
        if (this.activeFilters.roles.length > 0) {
            filteredHeroes = filteredHeroes.filter(hero => 
                this.activeFilters.roles.includes(hero.role)
            );
        }

        // Display message if no heroes match filters
        if (filteredHeroes.length === 0) {
            const noHeroes = document.createElement('div');
            noHeroes.className = 'no-heroes-message';
            noHeroes.textContent = 'No heroes match your filters';
            heroesGrid.appendChild(noHeroes);
            return;
        }

        filteredHeroes.forEach(hero => {
            const heroCard = document.createElement('div');
            heroCard.className = 'hero-card';
            // For multiple types, use the first type's color for the background
            const heroTypes = TeamBuilderUtils.splitTypes(hero.type);
            const primaryType = heroTypes[0] || hero.type; // Fallback to full type string if split fails
            heroCard.style.backgroundColor = `${this.typeColors[primaryType]}22`;
            heroCard.dataset.heroId = hero.id;

            if (this.selectedHeroDetails && this.selectedHeroDetails.id === hero.id) {
                heroCard.classList.add('selected');
            }

            const heroContent = document.createElement('div');
            heroContent.className = 'hero-card-content';

            // Create avatar container structure for character art - NO VISIBLE BACKGROUNDS
            const heroIconContainer = document.createElement('div');
            heroIconContainer.className = 'hero-avatar-container';
            heroIconContainer.dataset.characterId = hero.id;
            heroIconContainer.dataset.characterName = hero.name;
            heroIconContainer.dataset.artSynced = '0';
            // No background color set - will only be visible if character art exists
            
            // Create art wrapper for character images - this is all we need now
            const artWrapper = document.createElement('div');
            artWrapper.className = 'hero-art-wrapper';
            
            // Assemble the icon structure
            heroIconContainer.appendChild(artWrapper);

            const heroText = document.createElement('div');
            heroText.className = 'hero-card-text';

            const heroName = document.createElement('div');
            heroName.className = 'hero-name';
            heroName.textContent = hero.name;

            const heroType = document.createElement('div');
            heroType.className = 'hero-type';
            
            // Clear any existing content
            heroType.innerHTML = '';
            
            // Render multi-type spans
            TeamBuilderUtils.renderMultiTypeSpans(hero.type, heroType, this.typeColors);
            
            const heroRole = document.createElement('div');
            heroRole.className = 'hero-role';
            heroRole.textContent = hero.role;

            heroText.appendChild(heroName);
            heroText.appendChild(heroType);
            heroText.appendChild(heroRole);

            heroContent.appendChild(heroIconContainer);
            heroContent.appendChild(heroText);

            heroCard.appendChild(heroContent);
            heroesGrid.appendChild(heroCard);

            // Add event listener
            heroCard.addEventListener('click', () => this.selectHeroDetails(hero));
        });
        
        // Force image loader to check for new images
        if (this.imageLoader) {
            this.imageLoader.forceCheck();
        }
    }

    /**
     * Render the team slots
     */
    renderTeamSlots() {
        const teamSlots = document.getElementById('team-slots');
        teamSlots.innerHTML = '';
        
        // Add team heading that shows which team we're building
        const teamHeading = document.createElement('div');
        teamHeading.className = 'team-heading team-heading-change';
        teamHeading.id = 'team-heading';
        teamHeading.textContent = this.isSelectingEnemyTeam ? 'Enemy Team' : 'Your Team';
        teamHeading.style.color = this.isSelectingEnemyTeam ? '#ff4757' : '#1e90ff';
        teamSlots.appendChild(teamHeading);
        
        // Add class to container if selecting enemy team
        if (this.isSelectingEnemyTeam) {
            teamSlots.classList.add('is-selecting-enemy');
        } else {
            teamSlots.classList.remove('is-selecting-enemy');
        }
        
        // Get the right array based on what we're selecting
        const currentTeam = this.isSelectingEnemyTeam ? this.enemySelectedHeroes : this.selectedHeroes;

        // Create 3 team slots
        for (let i = 0; i < 3; i++) {
            const slotElement = document.createElement('div');
            slotElement.className = 'team-slot';

            const slotLabel = document.createElement('div');
            slotLabel.className = 'slot-label';
            slotLabel.textContent = `${i + 1}${TeamBuilderUtils.getOrdinalSuffix(i + 1)} Pick`;

            const slotContent = document.createElement('div');
            slotContent.className = 'slot-content';
            
            // Enemy team styling is handled by CSS via the is-selecting-enemy class

            if (currentTeam[i]) {
                // Slot is filled
                slotContent.classList.add('slot-filled');
                // For multiple types, use the first type's color for the background
                const heroTypes = TeamBuilderUtils.splitTypes(currentTeam[i].type);
                const primaryType = heroTypes[0] || currentTeam[i].type; // Fallback to full type
                slotContent.style.backgroundColor = `${this.typeColors[primaryType]}33`;

                const heroDetails = document.createElement('div');
                heroDetails.className = 'hero-details';
                
                // Create avatar container structure for character art - NO VISIBLE BACKGROUNDS
                const heroIconContainer = document.createElement('div');
                heroIconContainer.className = 'hero-avatar-container';
                heroIconContainer.dataset.characterId = currentTeam[i].id;
                heroIconContainer.dataset.characterName = currentTeam[i].name;
                heroIconContainer.dataset.artSynced = '0';
                // No background color set - will only be visible if character art exists
                
                // Create art wrapper for character images
                const artWrapper = document.createElement('div');
                artWrapper.className = 'hero-art-wrapper';
                
                // Assemble the icon structure
                heroIconContainer.appendChild(artWrapper);

                const heroInfo = document.createElement('div');
                heroInfo.className = 'hero-info';

                const heroName = document.createElement('div');
                heroName.className = 'hero-name';
                heroName.style.fontWeight = 'bold';
                heroName.textContent = currentTeam[i].name;

                const heroType = document.createElement('div');
                heroType.className = 'hero-type';
                heroType.style.fontSize = '12px';
                
                // Render multi-type spans
                TeamBuilderUtils.renderMultiTypeSpans(currentTeam[i].type, heroType, this.typeColors);
                
                const heroRole = document.createElement('div');
                heroRole.className = 'hero-role';
                heroRole.style.fontSize = '12px';
                heroRole.textContent = currentTeam[i].role;

                // Basic stats
                const heroStats = document.createElement('div');
                heroStats.className = 'hero-stats';
                heroStats.style.fontSize = '12px';
                heroStats.style.color = '#a4b0be';
                heroStats.textContent = `HP: ${currentTeam[i].stats.hp} | ATK: ${currentTeam[i].stats.attack} | DEF: ${currentTeam[i].stats.defense}`;
                
                // Add advanced stats in condensed format
                const heroAdvStats = document.createElement('div');
                heroAdvStats.className = 'hero-adv-stats';
                heroAdvStats.style.fontSize = '11px';
                heroAdvStats.style.color = '#a4b0be';
                
                // Check if expanded stats exist before displaying them
                if (currentTeam[i].stats.strength && currentTeam[i].stats.intellect && currentTeam[i].stats.spirit) {
                    heroAdvStats.textContent = `STR: ${currentTeam[i].stats.strength} | INT: ${currentTeam[i].stats.intellect} | SPI: ${currentTeam[i].stats.spirit}`;
                    heroInfo.appendChild(heroAdvStats);
                }

                heroInfo.appendChild(heroName);
                heroInfo.appendChild(heroType);
                heroInfo.appendChild(heroRole);
                heroInfo.appendChild(heroStats);

                heroDetails.appendChild(heroIconContainer);
                heroDetails.appendChild(heroInfo);

                const removeButton = document.createElement('button');
                removeButton.className = 'remove-hero';
                removeButton.textContent = '×';
                removeButton.dataset.slotIndex = i;
                removeButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeHeroFromTeam(i);
                });

                slotContent.appendChild(heroDetails);
                slotContent.appendChild(removeButton);
            } else {
                // Slot is empty
                slotContent.classList.add('slot-empty');

                const emptyText = document.createElement('span');
                if (this.selectedHeroDetails) {
                    emptyText.textContent = `Click to place ${this.selectedHeroDetails.name} here`;
                } else {
                    emptyText.textContent = 'Select a hero first';
                    emptyText.style.color = '#a4b0be';
                }

                slotContent.appendChild(emptyText);
                slotContent.dataset.slotIndex = i;
                slotContent.addEventListener('click', () => this.addHeroToTeam(i));
            }

            slotElement.appendChild(slotLabel);
            slotElement.appendChild(slotContent);
            teamSlots.appendChild(slotElement);
        }
        
        // If we're in enemy selection mode, add a Back button to return to player team
        if (this.isSelectingEnemyTeam) {
            const backButton = document.createElement('button');
            backButton.className = 'enemy-team-control-btn';
            backButton.textContent = 'Back to Your Team';
            backButton.addEventListener('click', () => {
                this.isSelectingEnemyTeam = false;
                this.renderTeamSlots();
                this.renderTeamSynergies();
                this.updateStartBattleButton();
            });
            teamSlots.appendChild(backButton);
        }

        // Update synergies - only show for player team
        if (!this.isSelectingEnemyTeam) {
            this.renderTeamSynergies();
        }
        
        // Update the start battle button
        this.updateStartBattleButton();
        
        // Force image loader to check for new images
        if (this.imageLoader) {
            this.imageLoader.forceCheck();
        }
    }

    /**
     * Render the team synergies
     */
    renderTeamSynergies() {
        const synergiesList = document.getElementById('synergies-list');
        synergiesList.innerHTML = '';

        const synergies = this.calculateSynergies();

        if (synergies.length > 0) {
            synergies.forEach(synergy => {
                const synergyItem = document.createElement('li');
                synergyItem.textContent = synergy;
                synergiesList.appendChild(synergyItem);
            });
        } else {
            const noSynergies = document.createElement('li');
            noSynergies.textContent = 'No active synergies yet';
            noSynergies.style.color = '#a4b0be';
            synergiesList.appendChild(noSynergies);
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

        modes.forEach(mode => {
            const modeElement = document.createElement('div');
            
            // Add special class for custom mode when selecting enemy team
            let selectedClass = mode.id === this.battleMode ? 'selected' : '';
            if (mode.id === 'custom' && this.battleMode === 'custom' && this.isSelectingEnemyTeam) {
                selectedClass = 'selected enemy-selection-active';
            }
            
            modeElement.className = `battle-mode ${selectedClass}`;
            modeElement.dataset.modeId = mode.id;

            const modeName = document.createElement('div');
            modeName.className = 'battle-mode-name';
            modeName.textContent = mode.name;
            
            // Add indicator for enemy team selection
            if (mode.id === 'custom' && this.battleMode === 'custom' && this.isSelectingEnemyTeam) {
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
                if (!this.isSelectingEnemyTeam || mode.id === this.battleMode) {
                    this.battleMode = mode.id;
                    this.renderBattleModes();
                    
                    // Reset enemy selection when changing modes
                    if (this.isSelectingEnemyTeam && mode.id !== 'custom') {
                        this.isSelectingEnemyTeam = false;
                        this.renderTeamSlots();
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
        const hasTeamMembers = this.selectedHeroes.some(hero => hero !== null);
        
        // For Custom Battle mode, we need to check if we're ready to select enemy team
        if (this.battleMode === 'custom' && !this.isSelectingEnemyTeam) {
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
            
            if (this.isSelectingEnemyTeam) {
                // When selecting enemy team, we need at least one enemy
                startButton.disabled = !this.enemySelectedHeroes.some(hero => hero !== null);
            } else {
                // For Random or Campaign, just check player team
                startButton.disabled = !hasTeamMembers;
            }
        }
    }

    // Method createStatBox() has been moved to TeamBuilderUtils

    /**
     * Calculate team synergies
     * @returns {string[]} An array of synergy descriptions
     */
    calculateSynergies() {
        const heroes = this.selectedHeroes.filter(hero => hero !== null);
        if (heroes.length < 2) return [];

        const types = heroes.map(hero => hero.type);
        const roles = heroes.map(hero => hero.role);
        
        const typeCounts = {};
        types.forEach(type => {
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        const roleCounts = {};
        roles.forEach(role => {
            roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
        
        const synergies = [];
        
        // Check for type synergies
        Object.entries(typeCounts).forEach(([type, count]) => {
            if (count >= 2) {
                synergies.push(`${type.charAt(0).toUpperCase() + type.slice(1)} Alliance (${count}): +${count * 10}% ${type} damage`);
            }
        });
        
        // Check for role synergies
        if (roleCounts['Warrior'] >= 2) synergies.push('Warrior (2): +20% defense');
        if (roleCounts['Mage'] >= 2) synergies.push('Mage (2): +20% ability power');
        if (roleCounts['Ranger'] >= 2) synergies.push('Ranger (2): +15% attack speed');
        if (roleCounts['Knight'] >= 2) synergies.push('Knight (2): +25% max health');
        if (roleCounts['Assassin'] >= 2) synergies.push('Assassin (2): +30% critical hit chance');
        if (roleCounts['Cleric'] >= 2) synergies.push('Cleric (2): +40% healing effectiveness');
        
        return synergies;
    }

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
            this.renderHeroGrid();
            
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
            
            this.renderTeamSlots();
            
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
     * @param {number} position - The slot position (0-2)
     */
    addHeroToTeam(position) {
        if (!this.selectedHeroDetails) return;
        
        // Determine which team we're modifying
        const targetTeam = this.isSelectingEnemyTeam ? this.enemySelectedHeroes : this.selectedHeroes;

        // Check if hero is already in team
        const existingIndex = targetTeam.findIndex(h => h && h.id === this.selectedHeroDetails.id);
        if (existingIndex !== -1) {
            targetTeam[existingIndex] = null;
        }

        // Update the correct team
        if (this.isSelectingEnemyTeam) {
            this.enemySelectedHeroes[position] = this.selectedHeroDetails;
        } else {
            this.selectedHeroes[position] = this.selectedHeroDetails;
        }
        
        this.renderTeamSlots();
        
        // Play add sound
        if (window.soundManager) {
            window.soundManager.play('add');
        }
    }

    /**
     * Remove a hero from a team slot
     * @param {number} position - The slot position (0-2)
     */
    removeHeroFromTeam(position) {
        // Remove from the appropriate team
        if (this.isSelectingEnemyTeam) {
            this.enemySelectedHeroes[position] = null;
        } else {
            this.selectedHeroes[position] = null;
        }
        
        this.renderTeamSlots();
        
        // Play remove sound
        if (window.soundManager) {
            window.soundManager.play('remove');
        }
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
     * Callback for filter changes
     * @param {Object} filters - The updated filters
     */
    onFiltersChanged(filters) {
        // Update local filters reference
        this.activeFilters = filters;
        
        // Update the hero grid based on new filters
        this.renderHeroGrid();
    }

    /**
     * Start a battle with the selected team
     */
    startBattle() {
        // For Custom Battle mode, we need to switch to enemy team selection if not done yet
        if (this.battleMode === 'custom' && !this.isSelectingEnemyTeam) {
            // Filter out empty slots
            const team = this.selectedHeroes.filter(hero => hero !== null);
            
            if (team.length === 0) {
                alert('Please select at least one hero for your team!');
                // Play error sound
                if (window.soundManager) {
                    window.soundManager.play('error');
                }
                return;
            }
            
            // Switch to enemy team selection mode
            this.isSelectingEnemyTeam = true;
            this.renderTeamSlots();
            this.updateStartBattleButton();
            
            // Play selection sound
            if (window.soundManager) {
                window.soundManager.play('click');
            }
            
            return; // Exit without starting battle
        }
        
        // Filter out empty slots
        const team = this.selectedHeroes.filter(hero => hero !== null);
        
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
            this.teamManager.setPlayerTeam(team);
            
            // For Custom battle, use the selected enemy team
            if (this.battleMode === 'custom' && this.isSelectingEnemyTeam) {
                const enemyTeam = this.enemySelectedHeroes.filter(hero => hero !== null);
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
