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
     */
    renderFilters() {
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
                const heroTypes = this.splitTypes(hero.type);
                
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
            const heroTypes = this.splitTypes(hero.type);
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
            this.renderMultiTypeSpans(hero.type, heroType);
            
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
            slotLabel.textContent = `${i + 1}${this.getOrdinalSuffix(i + 1)} Pick`;

            const slotContent = document.createElement('div');
            slotContent.className = 'slot-content';
            
            // Enemy team styling is handled by CSS via the is-selecting-enemy class

            if (currentTeam[i]) {
                // Slot is filled
                slotContent.classList.add('slot-filled');
                // For multiple types, use the first type's color for the background
                const heroTypes = this.splitTypes(currentTeam[i].type);
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
                this.renderMultiTypeSpans(currentTeam[i].type, heroType);
                
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
     */
    renderHeroDetails() {
        const detailContent = document.getElementById('detail-content');
        
        // Keep track of previous hero name for intelligent comparison
        const previousHeroId = this.previousHeroId || null;
        this.previousHeroId = this.selectedHeroDetails ? this.selectedHeroDetails.id : null;
        
        // CRITICAL: Disable art observer during detail panel updates
        if (window.disableArtObserver) {
            window.disableArtObserver();
        }
        
        try {
            // OPTIMIZATION: Instead of clearing all content, preserve the wrapper structure
            const existingDetail = detailContent.querySelector('.detail-hero');
            const existingWrapper = detailContent.querySelector('.hero-avatar-container.detail-icon-container');
            
            // Only clear content if either:
            // 1. No hero is selected (show empty state) OR
            // 2. No existing detail content exists
            if (!this.selectedHeroDetails) {
                // Just emptying content for "no hero selected" state
                detailContent.innerHTML = '';
                
                // No hero selected - show empty state and exit
                const detailEmpty = document.createElement('div');
                detailEmpty.className = 'detail-empty';
                detailEmpty.textContent = 'Select a hero to view details';
                detailContent.appendChild(detailEmpty);
                return;
            }
            
            // If details already exist with a wrapper, update the existing details
            // This preserves the image container for ALL heroes, not just Aqualia
            if (existingDetail && existingWrapper) {
                console.log(`Preserving art wrapper while updating details for ${this.selectedHeroDetails.name}`);
                this.updateExistingHeroDetails(existingDetail);
                return;
            }
        
        // Regular rendering for other heroes or first-time rendering
        const hero = this.selectedHeroDetails;
        const detailHero = document.createElement('div');
        detailHero.className = 'detail-hero';
        detailHero.style.backgroundColor = `${this.typeColors[hero.type]}22`;

        // Header section
        const detailHeader = document.createElement('div');
        detailHeader.className = 'detail-header';

        // Create avatar container structure for character art - NO VISIBLE BACKGROUNDS
        const detailIconContainer = document.createElement('div');
        detailIconContainer.className = 'hero-avatar-container detail-icon-container';
        detailIconContainer.dataset.characterId = hero.id;
        detailIconContainer.dataset.characterName = hero.name;
        // No background color set - will only be visible if character art exists
        
        // Create art wrapper for character images
        const artWrapper = document.createElement('div');
        artWrapper.className = 'hero-art-wrapper';
        
        // Assemble the icon structure
        detailIconContainer.appendChild(artWrapper);

        const detailNameType = document.createElement('div');
        detailNameType.className = 'detail-name-type';

        const heroName = document.createElement('h3');
        heroName.textContent = hero.name;

        const detailTags = document.createElement('div');
        detailTags.className = 'detail-tags';

        // Handle multiple types in the detail tags
        const types = this.splitTypes(hero.type);
        
        // Create a type tag for each type
        types.forEach(type => {
            const typeTag = document.createElement('span');
            typeTag.className = 'detail-tag';
            typeTag.style.backgroundColor = this.typeColors[type];
            typeTag.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            detailTags.appendChild(typeTag);
        });
        
        // Skip the automatic append that happens below since we already appended the type tags

        const roleTag = document.createElement('span');
        roleTag.className = 'detail-tag';
        roleTag.style.backgroundColor = '#2f3542';
        roleTag.textContent = hero.role;

        const rarityTag = document.createElement('span');
        rarityTag.className = 'detail-tag';
        rarityTag.style.backgroundColor = this.rarityColors[hero.rarity];
        rarityTag.textContent = hero.rarity;

        // Type tags already appended in the loop above
        detailTags.appendChild(roleTag);
        detailTags.appendChild(rarityTag);

        detailNameType.appendChild(heroName);
        detailNameType.appendChild(detailTags);

        detailHeader.appendChild(detailIconContainer);
        detailHeader.appendChild(detailNameType);

        // Stats section
        const detailStats = document.createElement('div');
        detailStats.className = 'detail-stats';

        // Add CSS to detail-stats to use flex-column
        detailStats.style.display = 'flex';
        detailStats.style.flexDirection = 'column';
        detailStats.style.gap = '8px';

        // First row of stats (existing)
        const statsRow1 = document.createElement('div');
        statsRow1.className = 'stats-row';
        statsRow1.style.display = 'flex';
        statsRow1.style.justifyContent = 'space-between';
        statsRow1.style.gap = '8px';

        const hpStat = this.createStatBox('HP', hero.stats.hp, 'Health Points - How much damage a character can take before being defeated');
        const atkStat = this.createStatBox('ATK', hero.stats.attack, 'Attack Power - Determines basic attack damage');
        const defStat = this.createStatBox('DEF', hero.stats.defense, 'Defense - Reduces damage taken from attacks');
        const spdStat = this.createStatBox('SPD', hero.stats.speed, 'Speed - Determines turn order in battle (higher goes first)');

        statsRow1.appendChild(hpStat);
        statsRow1.appendChild(atkStat);
        statsRow1.appendChild(defStat);
        statsRow1.appendChild(spdStat);

        // Only add second row if expanded stats exist
        if (hero.stats.strength && hero.stats.intellect && hero.stats.spirit) {
            // Second row of stats (new)
            const statsRow2 = document.createElement('div');
            statsRow2.className = 'stats-row';
            statsRow2.style.display = 'flex';
            statsRow2.style.justifyContent = 'space-between';
            statsRow2.style.gap = '8px';

            const strStat = this.createStatBox('STR', hero.stats.strength, 'Strength - Increases physical ability damage');
            const intStat = this.createStatBox('INT', hero.stats.intellect, 'Intellect - Increases spell ability damage');
            const spiStat = this.createStatBox('SPI', hero.stats.spirit, 'Spirit - Increases healing effectiveness');

            statsRow2.appendChild(strStat);
            statsRow2.appendChild(intStat);
            statsRow2.appendChild(spiStat);

            // Add both rows
            detailStats.appendChild(statsRow1);
            detailStats.appendChild(statsRow2);
        } else {
            // Just add the first row if no expanded stats
            detailStats.appendChild(statsRow1);
        }

        // Abilities section
        const detailAbilities = document.createElement('div');
        detailAbilities.className = 'detail-abilities';

        const abilitiesTitle = document.createElement('h4');
        abilitiesTitle.textContent = 'Abilities';

        detailAbilities.appendChild(abilitiesTitle);

        hero.abilities.forEach(ability => {
            const abilityBox = document.createElement('div');
            abilityBox.className = 'ability-box';
            
            // Determine ability's elemental type from effects for styling
            let abilityType = hero.type; // Default to character's type
            
            // If this is an active ability with effects, try to find a damage type
            if (ability.effects && Array.isArray(ability.effects)) {
                // Look for the first damage effect with a damageType
                const damageEffect = ability.effects.find(effect => 
                    effect.type === 'Damage' && effect.damageType);
                
                if (damageEffect && damageEffect.damageType) {
                    abilityType = damageEffect.damageType;
                }
            }
            
            // Apply the type color with reduced opacity (22 = 13% opacity in hex)
            if (this.typeColors[abilityType]) {
                abilityBox.style.backgroundColor = `${this.typeColors[abilityType]}22`;
                // Add a subtle left border with higher opacity for visual distinction
                abilityBox.style.borderLeft = `3px solid ${this.typeColors[abilityType]}66`;
            }

            const abilityName = document.createElement('div');
            abilityName.className = 'ability-name';
            abilityName.textContent = ability.name;

            const abilityDesc = document.createElement('div');
            abilityDesc.className = 'ability-desc';
            abilityDesc.textContent = ability.description;

            abilityBox.appendChild(abilityName);
            abilityBox.appendChild(abilityDesc);
            detailAbilities.appendChild(abilityBox);
            
            // Add tooltip with more detailed info
            if (window.tooltipManager) {
                const cooldownText = ability.cooldown > 0 ? `Cooldown: ${ability.cooldown} turns` : 'No cooldown';
                
                // Get detailed scaling information with formula
                const detailedScaling = this.getDetailedScalingText(ability, hero);
                
                const tooltipContent = `
                    <div class="tooltip-title">${ability.name}</div>
                    <div>${ability.description}</div>
                    <div class="tooltip-content">
                        ${detailedScaling.damageText}
                        <div>${cooldownText}</div>
                        <div>Type: ${ability.damageType || (ability.isHealing ? 'Healing' : 'Damage')}</div>
                        <div>${detailedScaling.scalingText}</div>
                    </div>
                `;
                
                window.tooltipManager.addTooltip(abilityBox, tooltipContent);
                abilityBox.classList.add('has-tooltip');
            }
        });

        // Type Relations section
        const detailTypeRelations = document.createElement('div');
        detailTypeRelations.className = 'detail-type-relations';

        const typeRelationsTitle = document.createElement('h4');
        typeRelationsTitle.textContent = 'Type Relations';
        detailTypeRelations.appendChild(typeRelationsTitle);

        // Get all hero types
        const heroTypes = this.splitTypes(hero.type);
        
        // Create a container for type sections
        const typeSectionsContainer = document.createElement('div');
        typeSectionsContainer.className = 'type-sections-container';
        detailTypeRelations.appendChild(typeSectionsContainer);
        
        // For each hero type, create a separate section
        heroTypes.forEach(heroType => {
            // Create a section for this type
            const typeSection = document.createElement('div');
            typeSection.className = 'type-section';
            
            // Add type header if multiple types
            if (heroTypes.length > 1) {
                const typeHeader = document.createElement('div');
                typeHeader.className = 'type-section-header';
                typeHeader.style.color = this.typeColors[heroType];
                typeHeader.textContent = heroType.charAt(0).toUpperCase() + heroType.slice(1) + ' Type';
                typeHeader.style.fontWeight = 'bold';
                typeHeader.style.marginBottom = '5px';
                typeSection.appendChild(typeHeader);
            }
            
            // Create columns for this type
            const columnsContainer = document.createElement('div');
            columnsContainer.className = 'type-columns-container';
            columnsContainer.style.display = 'flex';
            columnsContainer.style.justifyContent = 'space-between';
            typeSection.appendChild(columnsContainer);
            
            // Advantages column
            const advantagesColumn = document.createElement('div');
            advantagesColumn.className = 'type-column';

            const advantagesHeading = document.createElement('h5');
            advantagesHeading.textContent = 'Advantages';
            advantagesColumn.appendChild(advantagesHeading);

            // Disadvantages column
            const disadvantagesColumn = document.createElement('div');
            disadvantagesColumn.className = 'type-column';

            const disadvantagesHeading = document.createElement('h5');
            disadvantagesHeading.textContent = 'Disadvantages';
            disadvantagesColumn.appendChild(disadvantagesHeading);
            
            // Get type relations based on current type
            let advantageType = null;
            let advantageColor = null;
            let disadvantageType = null;
            let disadvantageColor = null;
            let advantageIcon = '';
            let disadvantageIcon = '';

            // Set relationships based on type
            switch (heroType) {
                case 'fire':
                    advantageType = 'Nature';
                    advantageColor = this.typeColors.nature;
                    disadvantageType = 'Water';
                    disadvantageColor = this.typeColors.water;
                    advantageIcon = '🌿';
                    disadvantageIcon = '💧';
                    break;
                case 'water':
                    advantageType = 'Fire';
                    advantageColor = this.typeColors.fire;
                    disadvantageType = 'Nature';
                    disadvantageColor = this.typeColors.nature;
                    advantageIcon = '🔥';
                    disadvantageIcon = '🌿';
                    break;
                case 'nature':
                    advantageType = 'Water';
                    advantageColor = this.typeColors.water;
                    disadvantageType = 'Fire';
                    disadvantageColor = this.typeColors.fire;
                    advantageIcon = '💧';
                    disadvantageIcon = '🔥';
                    break;
                case 'light':
                    advantageType = 'Dark';
                    advantageColor = this.typeColors.dark;
                    disadvantageType = 'Dark';
                    disadvantageColor = this.typeColors.dark;
                    advantageIcon = '🌑';
                    disadvantageIcon = '🌑';
                    break;
                case 'dark':
                    advantageType = 'Light';
                    advantageColor = this.typeColors.light;
                    disadvantageType = 'Light';
                    disadvantageColor = this.typeColors.light;
                    advantageIcon = '✨';
                    disadvantageIcon = '✨';
                    break;
                case 'air':
                    advantageType = 'Earth';
                    advantageColor = this.typeColors.earth || '#8B4513';
                    disadvantageType = 'Electric';
                    disadvantageColor = '#F7DF1E'; // Yellow for electric
                    advantageIcon = '🌍';
                    disadvantageIcon = '⚡';
                    break;
                case 'ice':
                    advantageType = 'Nature';
                    advantageColor = this.typeColors.nature;
                    disadvantageType = 'Fire';
                    disadvantageColor = this.typeColors.fire;
                    advantageIcon = '🌿';
                    disadvantageIcon = '🔥';
                    break;
            }
            
            // Create advantage box if applicable
            if (advantageType) {
                const advantageBox = document.createElement('div');
                advantageBox.className = 'advantage-box';

                const typeName = document.createElement('span');
                typeName.className = 'type-relation-title';
                typeName.innerHTML = `${advantageIcon} ${advantageType} ${advantageIcon}`;
                typeName.style.color = advantageColor;

                advantageBox.appendChild(typeName);

                // Add tooltip for detailed info
                if (window.tooltipManager) {
                    const tooltipContent = `<div class="tooltip-title">Type Advantage</div>
                        <div class="tooltip-content">${heroType.charAt(0).toUpperCase() + heroType.slice(1)} does 50% more damage to ${advantageType} types.</div>`;
                    window.tooltipManager.addTooltip(advantageBox, tooltipContent);
                }

                advantagesColumn.appendChild(advantageBox);
            } else {
                // No advantages case
                const noAdvantages = document.createElement('div');
                noAdvantages.className = 'advantage-box';
                noAdvantages.textContent = 'None';
                noAdvantages.style.color = 'var(--text-muted)';
                noAdvantages.style.justifyContent = 'center';
                advantagesColumn.appendChild(noAdvantages);
            }

            // Create disadvantage box if applicable
            if (disadvantageType) {
                const disadvantageBox = document.createElement('div');
                disadvantageBox.className = 'disadvantage-box';

                const typeName = document.createElement('span');
                typeName.className = 'type-relation-title';
                typeName.innerHTML = `${disadvantageIcon} ${disadvantageType} ${disadvantageIcon}`;
                typeName.style.color = disadvantageColor;

                disadvantageBox.appendChild(typeName);

                // Add tooltip for detailed info
                if (window.tooltipManager) {
                    const tooltipContent = `<div class="tooltip-title">Type Disadvantage</div>
                        <div class="tooltip-content">${heroType.charAt(0).toUpperCase() + heroType.slice(1)} takes 50% more damage from ${disadvantageType} types.</div>`;
                    window.tooltipManager.addTooltip(disadvantageBox, tooltipContent);
                }

                disadvantagesColumn.appendChild(disadvantageBox);
            } else {
                // No disadvantages case
                const noDisadvantages = document.createElement('div');
                noDisadvantages.className = 'disadvantage-box';
                noDisadvantages.textContent = 'None';
                noDisadvantages.style.color = 'var(--text-muted)';
                noDisadvantages.style.justifyContent = 'center';
                disadvantagesColumn.appendChild(noDisadvantages);
            }
            
            // Add columns to the columns container
            columnsContainer.appendChild(advantagesColumn);
            columnsContainer.appendChild(disadvantagesColumn);
            
            // Add this type section to the sections container
            typeSectionsContainer.appendChild(typeSection);
            
            // Add separator if not the last type
            if (heroTypes.indexOf(heroType) < heroTypes.length - 1) {
                const separator = document.createElement('hr');
                separator.style.margin = '10px 0';
                separator.style.borderTop = '1px solid #555';
                typeSectionsContainer.appendChild(separator);
            }
        });

        // No need to add columns directly to detailTypeRelations anymore
        // as they're being added to typeSectionsContainer for each type

        // Add all sections to the detail content
        detailHero.appendChild(detailHeader);
        detailHero.appendChild(detailStats);
        detailHero.appendChild(detailAbilities);
        detailHero.appendChild(detailTypeRelations);

        detailContent.appendChild(detailHero);
        
        // If this character has art, add it directly without relying on the observer
        if (window.CHARACTER_IMAGE_CACHE && window.CHARACTER_IMAGE_CACHE[hero.name]) {
            this.addArtToDetailPanel(hero, detailIconContainer);
        }
        } finally {
            // Re-enable art observer after all detail panel updates are complete
            if (window.enableArtObserver) {
                window.enableArtObserver();
            }
        }
    }
    
    /**
     * Get detailed scaling text with formula for ability tooltips
     * @param {Object} ability - The ability object
     * @param {Object} hero - The hero object for stat reference
     * @returns {Object} Object with damageText and scalingText
     */
    getDetailedScalingText(ability, hero) {
        let scalingText = '';
        let damageText = '';
        let statValue = 0;
        
        if (ability.isHealing || ability.damageType === 'healing') {
            // Healing ability scaling with Spirit
            statValue = hero.stats.spirit || 0;
            const scalingAmount = Math.floor(statValue * 0.5);
            const totalHealing = ability.damage + scalingAmount;
            
            damageText = `<div>Healing: ${ability.damage} + (50% of Spirit) = ${totalHealing} HP</div>`;
            scalingText = `${ability.name} restores ${ability.damage} + (50% of Spirit) health`;
        } 
        else if (ability.damageType === 'physical') {
            // Physical ability scaling with Strength
            statValue = hero.stats.strength || 0;
            const scalingAmount = Math.floor(statValue * 0.5);
            const totalDamage = ability.damage + scalingAmount;
            
            damageText = `<div>Damage: ${ability.damage} + (50% of Strength) = ${totalDamage} pre-defense</div>`;
            scalingText = `${ability.name} deals ${ability.damage} + (50% of Strength) damage`;
        } 
        else if (ability.damageType === 'spell') {
            // Spell ability scaling with Intellect
            statValue = hero.stats.intellect || 0;
            const scalingAmount = Math.floor(statValue * 0.5);
            const totalDamage = ability.damage + scalingAmount;
            
            damageText = `<div>Damage: ${ability.damage} + (50% of Intellect) = ${totalDamage} pre-defense</div>`;
            scalingText = `${ability.name} deals ${ability.damage} + (50% of Intellect) damage`;
        }
        else if (ability.damageType === 'utility') {
            // Utility ability scaling with Spirit
            damageText = `<div>Effect scales with Spirit</div>`;
            scalingText = `${ability.name}'s effectiveness scales with Spirit`;
        }
        else {
            // Default case (no scaling)
            damageText = ability.isHealing ? 
                `<div>Healing: ${ability.damage} HP</div>` : 
                `<div>Damage: ${ability.damage} points</div>`;
            scalingText = "No scaling";
        }
        
        return { damageText, scalingText };
    }
    
    /**
     * Add character art directly to a detail panel without using the observer
     */
    addArtToDetailPanel(hero, detailIconContainer) {
        // Find art wrapper or create one
        let artWrapper = detailIconContainer.querySelector('.hero-art-wrapper');
        if (!artWrapper) {
            artWrapper = document.createElement('div');
            artWrapper.className = 'hero-art-wrapper';
            artWrapper.style.display = 'block';
            detailIconContainer.appendChild(artWrapper);
        }
        
        // Clear any existing art
        while (artWrapper.firstChild) {
            artWrapper.removeChild(artWrapper.firstChild);
        }
        
        // Clone image from cache
        const newImg = window.CHARACTER_IMAGE_CACHE[hero.name].cloneNode(true);
        
        // Set styling for detail view
        newImg.className = 'character-art team-builder-art';
        newImg.alt = hero.name;
        newImg.style.position = 'absolute';
        
        // Get character positioning data
        const character = this.availableHeroes.find(c => c.id == hero.id);
        const artSettings = character?.detailArt || character?.teamBuilderArt || character?.art || {};
        
        // Apply custom positioning for this character
        newImg.style.left = artSettings.left || '-30px';
        newImg.style.top = artSettings.top || '-45px';
        newImg.style.width = artSettings.width || '140px';
        newImg.style.height = artSettings.height || '140px';
        newImg.style.visibility = 'visible';
        newImg.style.display = 'block';
        newImg.style.zIndex = '100';
        
        // Add the image to the wrapper
        artWrapper.appendChild(newImg);
        
        // Add relevant classes
        detailIconContainer.classList.add('has-art');
        const detailHero = detailIconContainer.closest('.detail-hero');
        if (detailHero) detailHero.classList.add('has-art');
    }
    
    /**
     * Update an existing hero details panel without rebuilding the entire DOM structure
     * This applies to all heroes to preserve character art in the details panel
     */
    updateExistingHeroDetails(detailHero) {
        const hero = this.selectedHeroDetails;
        
        // Disable observer while updating
        if (window.disableArtObserver) {
            window.disableArtObserver();
        }
        
        try {
            // Important: Update the data attributes on the wrapper to match the new hero
            const detailIconContainer = detailHero.querySelector('.hero-avatar-container.detail-icon-container');
            if (detailIconContainer) {
                // Update the container to reflect the new character
                detailIconContainer.dataset.characterId = hero.id;
                detailIconContainer.dataset.characterName = hero.name;
                
                // Add art directly if available, bypassing observer
                if (window.CHARACTER_IMAGE_CACHE && window.CHARACTER_IMAGE_CACHE[hero.name]) {
                    this.addArtToDetailPanel(hero, detailIconContainer);
                }
            }
            
            // Update background color for the detail hero container
            if (detailHero) {
                // For multiple types, use the first type's color for the background
                const heroTypes = this.splitTypes(hero.type);
                const primaryType = heroTypes[0] || hero.type; // Fallback to full type
                detailHero.style.backgroundColor = `${this.typeColors[primaryType]}22`;
            }
        
            // Update the hero name and tags
            const heroNameEl = detailHero.querySelector('.detail-name-type h3');
            if (heroNameEl) heroNameEl.textContent = hero.name;
            
            // Update the type, role, and rarity tags
            const typeTag = detailHero.querySelector('.detail-tags .detail-tag:nth-child(1)');
            if (typeTag) {
                typeTag.style.backgroundColor = this.typeColors[hero.type];
                typeTag.textContent = hero.type.charAt(0).toUpperCase() + hero.type.slice(1);
            }
            
            const roleTag = detailHero.querySelector('.detail-tags .detail-tag:nth-child(2)');
            if (roleTag) roleTag.textContent = hero.role;
            
            const rarityTag = detailHero.querySelector('.detail-tags .detail-tag:nth-child(3)');
            if (rarityTag) {
                rarityTag.style.backgroundColor = this.rarityColors[hero.rarity];
                rarityTag.textContent = hero.rarity;
            }
            
            // Get or create stats container
            const detailStats = detailHero.querySelector('.detail-stats');
            if (detailStats) {
                // Clear existing stat rows
                detailStats.innerHTML = '';

                // First row of stats (existing)
                const statsRow1 = document.createElement('div');
                statsRow1.className = 'stats-row';
                statsRow1.style.display = 'flex';
                statsRow1.style.justifyContent = 'space-between';
                statsRow1.style.gap = '8px';

                const hpStat = this.createStatBox('HP', hero.stats.hp, 'Health Points - How much damage a character can take before being defeated');
                const atkStat = this.createStatBox('ATK', hero.stats.attack, 'Attack Power - Determines basic attack damage');
                const defStat = this.createStatBox('DEF', hero.stats.defense, 'Defense - Reduces damage taken from attacks');
                const spdStat = this.createStatBox('SPD', hero.stats.speed, 'Speed - Determines turn order in battle (higher goes first)');
                
                statsRow1.appendChild(hpStat);
                statsRow1.appendChild(atkStat);
                statsRow1.appendChild(defStat);
                statsRow1.appendChild(spdStat);
                
                // Only add second row if expanded stats exist
                if (hero.stats.strength && hero.stats.intellect && hero.stats.spirit) {
                    // Second row of stats (new)
                    const statsRow2 = document.createElement('div');
                    statsRow2.className = 'stats-row';
                    statsRow2.style.display = 'flex';
                    statsRow2.style.justifyContent = 'space-between';
                    statsRow2.style.gap = '8px';

                    const strStat = this.createStatBox('STR', hero.stats.strength, 'Strength - Increases physical ability damage');
                    const intStat = this.createStatBox('INT', hero.stats.intellect, 'Intellect - Increases spell ability damage');
                    const spiStat = this.createStatBox('SPI', hero.stats.spirit, 'Spirit - Increases healing effectiveness');

                    statsRow2.appendChild(strStat);
                    statsRow2.appendChild(intStat);
                    statsRow2.appendChild(spiStat);

                    // Add rows to stats container
                    detailStats.appendChild(statsRow1);
                    detailStats.appendChild(statsRow2);
                } else {
                    // Just add the first row if no expanded stats
                    detailStats.appendChild(statsRow1);
                }
            }
            
            // Update abilities (a bit more complex - might need to rebuild this section)
            const abilitiesContainer = detailHero.querySelector('.detail-abilities');
            if (abilitiesContainer) {
                // Keep the title but replace all ability boxes
                const abilitiesTitle = abilitiesContainer.querySelector('h4');
                abilitiesContainer.innerHTML = '';
                abilitiesContainer.appendChild(abilitiesTitle);
                
                // Re-add all abilities
                hero.abilities.forEach(ability => {
                const abilityBox = document.createElement('div');
                abilityBox.className = 'ability-box';
            
                // Determine ability's elemental type from effects for styling
                let abilityType = hero.type; // Default to character's type
                
            // If this is an active ability with effects, try to find a damage type
                if (ability.effects && Array.isArray(ability.effects)) {
                    // Look for the first damage effect with a damageType
                    const damageEffect = ability.effects.find(effect => 
                    effect.type === 'Damage' && effect.damageType);
                    
                    if (damageEffect && damageEffect.damageType) {
                        abilityType = damageEffect.damageType;
                }
            }
            
            // Apply the type color with reduced opacity (22 = 13% opacity in hex)
            if (this.typeColors[abilityType]) {
                abilityBox.style.backgroundColor = `${this.typeColors[abilityType]}22`;
                // Add a subtle left border with higher opacity for visual distinction
                abilityBox.style.borderLeft = `3px solid ${this.typeColors[abilityType]}66`;
            }

            const abilityName = document.createElement('div');
            abilityName.className = 'ability-name';
            abilityName.textContent = ability.name;

            const abilityDesc = document.createElement('div');
            abilityDesc.className = 'ability-desc';
            abilityDesc.textContent = ability.description;

            abilityBox.appendChild(abilityName);
            abilityBox.appendChild(abilityDesc);
            abilitiesContainer.appendChild(abilityBox);
                    
                    // Re-add tooltips
                    if (window.tooltipManager) {
                        const cooldownText = ability.cooldown > 0 ? `Cooldown: ${ability.cooldown} turns` : 'No cooldown';
                        
                        // Get detailed scaling information with formula
                        const detailedScaling = this.getDetailedScalingText(ability, hero);
                        
                        const tooltipContent = `
                            <div class="tooltip-title">${ability.name}</div>
                            <div>${ability.description}</div>
                            <div class="tooltip-content">
                                ${detailedScaling.damageText}
                                <div>${cooldownText}</div>
                                <div>Type: ${ability.damageType || (ability.isHealing ? 'Healing' : 'Damage')}</div>
                                <div>${detailedScaling.scalingText}</div>
                            </div>
                        `;
                        
                        window.tooltipManager.addTooltip(abilityBox, tooltipContent);
                        abilityBox.classList.add('has-tooltip');
                    }
                });
            }
            
            // For type relations, simply remove the old section and recreate it
            const oldTypeRelations = detailHero.querySelector('.detail-type-relations');
            if (oldTypeRelations) {
                oldTypeRelations.remove();
            }
            
            // Create new type relations section
            const detailTypeRelations = document.createElement('div');
            detailTypeRelations.className = 'detail-type-relations';

            const typeRelationsTitle = document.createElement('h4');
            typeRelationsTitle.textContent = 'Type Relations';
            detailTypeRelations.appendChild(typeRelationsTitle);

            // Advantages column
            const advantagesColumn = document.createElement('div');
            advantagesColumn.className = 'type-column';

            const advantagesHeading = document.createElement('h5');
            advantagesHeading.textContent = 'Advantages';
            advantagesColumn.appendChild(advantagesHeading);

            // Disadvantages column
            const disadvantagesColumn = document.createElement('div');
            disadvantagesColumn.className = 'type-column';

            const disadvantagesHeading = document.createElement('h5');
            disadvantagesHeading.textContent = 'Disadvantages';
            disadvantagesColumn.appendChild(disadvantagesHeading);

            // Get type relations based on hero type
            let advantageType = null;
            let advantageColor = null;
            let disadvantageType = null;
            let disadvantageColor = null;
            let advantageIcon = '';
            let disadvantageIcon = '';

            switch (hero.type) {
                case 'fire':
                    advantageType = 'Nature';
                    advantageColor = this.typeColors.nature;
                    disadvantageType = 'Water';
                    disadvantageColor = this.typeColors.water;
                    advantageIcon = '🌿';
                    disadvantageIcon = '💧';
                    break;
                case 'water':
                    advantageType = 'Fire';
                    advantageColor = this.typeColors.fire;
                    disadvantageType = 'Nature';
                    disadvantageColor = this.typeColors.nature;
                    advantageIcon = '🔥';
                    disadvantageIcon = '🌿';
                    break;
                case 'nature':
                    advantageType = 'Water';
                    advantageColor = this.typeColors.water;
                    disadvantageType = 'Fire';
                    disadvantageColor = this.typeColors.fire;
                    advantageIcon = '💧';
                    disadvantageIcon = '🔥';
                    break;
                case 'light':
                    advantageType = 'Dark';
                    advantageColor = this.typeColors.dark;
                    disadvantageType = 'Dark';
                    disadvantageColor = this.typeColors.dark;
                    advantageIcon = '🌑';
                    disadvantageIcon = '🌑';
                    break;
                case 'dark':
                    advantageType = 'Light';
                    advantageColor = this.typeColors.light;
                    disadvantageType = 'Light';
                    disadvantageColor = this.typeColors.light;
                    advantageIcon = '✨';
                    disadvantageIcon = '✨';
                    break;
                case 'air':
                    advantageType = 'Earth';
                    advantageColor = this.typeColors.earth || '#8B4513';
                    disadvantageType = 'Electric';
                    disadvantageColor = '#F7DF1E'; // Yellow for electric
                    advantageIcon = '🌍';
                    disadvantageIcon = '⚡';
                    break;
            }

            // Create advantage box if applicable
            if (advantageType) {
                const advantageBox = document.createElement('div');
                advantageBox.className = 'advantage-box';

                const typeName = document.createElement('span');
                typeName.className = 'type-relation-title';
                typeName.innerHTML = `${advantageIcon} ${advantageType} ${advantageIcon}`;
                typeName.style.color = advantageColor;

                advantageBox.appendChild(typeName);

                // Add tooltip for detailed info
                if (window.tooltipManager) {
                    const tooltipContent = `<div class="tooltip-title">Type Advantage</div>
                        <div class="tooltip-content">${hero.type.charAt(0).toUpperCase() + hero.type.slice(1)} does 50% more damage to ${advantageType} types.</div>`;
                    window.tooltipManager.addTooltip(advantageBox, tooltipContent);
                }

                advantagesColumn.appendChild(advantageBox);
            } else {
                // No advantages case
                const noAdvantages = document.createElement('div');
                noAdvantages.className = 'advantage-box';
                noAdvantages.textContent = 'None';
                noAdvantages.style.color = 'var(--text-muted)';
                noAdvantages.style.justifyContent = 'center';
                advantagesColumn.appendChild(noAdvantages);
            }

            // Create disadvantage box if applicable
            if (disadvantageType) {
                const disadvantageBox = document.createElement('div');
                disadvantageBox.className = 'disadvantage-box';

                const typeName = document.createElement('span');
                typeName.className = 'type-relation-title';
                typeName.innerHTML = `${disadvantageIcon} ${disadvantageType} ${disadvantageIcon}`;
                typeName.style.color = disadvantageColor;

                disadvantageBox.appendChild(typeName);

                // Add tooltip for detailed info
                if (window.tooltipManager) {
                    const tooltipContent = `<div class="tooltip-title">Type Disadvantage</div>
                        <div class="tooltip-content">${hero.type.charAt(0).toUpperCase() + hero.type.slice(1)} takes 50% more damage from ${disadvantageType} types.</div>`;
                    window.tooltipManager.addTooltip(disadvantageBox, tooltipContent);
                }

                disadvantagesColumn.appendChild(disadvantageBox);
            } else {
                // No disadvantages case
                const noDisadvantages = document.createElement('div');
                noDisadvantages.className = 'disadvantage-box';
                noDisadvantages.textContent = 'None';
                noDisadvantages.style.color = 'var(--text-muted)';
                noDisadvantages.style.justifyContent = 'center';
                disadvantagesColumn.appendChild(noDisadvantages);
            }

            // Add columns to the type relations container
            detailTypeRelations.appendChild(advantagesColumn);
            detailTypeRelations.appendChild(disadvantagesColumn);

            // Find a good position to add the type relations - after abilities if it exists
            const abilitiesSection = detailHero.querySelector('.detail-abilities');
            if (abilitiesSection) {
                abilitiesSection.after(detailTypeRelations);
            } else {
                detailHero.appendChild(detailTypeRelations);
            }
        
        } finally {
            // Re-enable the observer when done
            if (window.enableArtObserver) {
                window.enableArtObserver();
            }
        }
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

    /**
     * Helper function to create a stat box
     * @param {string} label - Stat label
     * @param {number} value - Stat value
     * @param {string} tooltip - Tooltip text
     * @returns {HTMLElement} The stat box element
     */
    createStatBox(label, value, tooltip) {
        const statBox = document.createElement('div');
        statBox.className = 'stat-box';
        statBox.style.flex = '1';
        statBox.style.padding = '5px';
        statBox.style.backgroundColor = '#1e272e';
        statBox.style.borderRadius = '5px';
        statBox.style.textAlign = 'center';

        const statLabel = document.createElement('div');
        statLabel.className = 'stat-label';
        statLabel.textContent = label;

        const statValue = document.createElement('div');
        statValue.className = 'stat-value';
        statValue.textContent = value;

        statBox.appendChild(statLabel);
        statBox.appendChild(statValue);

        // Add tooltip if provided
        if (tooltip && window.tooltipManager) {
            window.tooltipManager.addTooltip(statBox, tooltip);
            statBox.classList.add('has-tooltip');
        }

        return statBox;
    }

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
            this.renderHeroDetails();
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

    /**
     * Split a type string into an array of individual types
     * @param {string} typeString - Type string with potential "/" separator
     * @returns {string[]} Array of individual types
     */
    splitTypes(typeString) {
        if (!typeString) return [];
        return typeString.split('/').map(t => t.trim().toLowerCase());
    }

    /**
     * Create spans for a multi-type string
     * @param {string} typeString - Type string with potential "/" separator
     * @param {HTMLElement} container - Container to append spans to
     */
    renderMultiTypeSpans(typeString, container) {
        const types = this.splitTypes(typeString);
        
        types.forEach((type, index) => {
            // Create span for this type
            const typeSpan = document.createElement('span');
            typeSpan.style.color = this.typeColors[type];
            typeSpan.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            container.appendChild(typeSpan);
            
            // Add separator if not the last type
            if (index < types.length - 1) {
                const separator = document.createElement('span');
                separator.textContent = ' / ';
                separator.className = 'type-separator';
                container.appendChild(separator);
            }
        });
    }

    /**
     * Get ordinal suffix for a number
     * @param {number} n - The number
     * @returns {string} The ordinal suffix (st, nd, rd, th)
     */
    getOrdinalSuffix(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return (s[(v - 20) % 10] || s[v] || s[0]);
    }
    
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
