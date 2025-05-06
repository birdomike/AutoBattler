/**
 * Team Manager
 * Manages team composition and character selection
 */

class TeamManager {
    /**
     * Create a new Team Manager
     */
    constructor() {
        this.availableCharacters = [];
        this.playerTeam = [];
        this.enemyTeam = [];
        this.maxTeamSize = 3;
    }

    /**
     * Set the player's team
     * @param {Array} team - Array of hero objects
     */
    setPlayerTeam(team) {
        this.playerTeam = team;
        console.log('Player team set:', this.playerTeam);
    }

    /**
     * Set a custom enemy team chosen by the player
     * @param {Array} team - Array of enemy characters
     */
    setCustomEnemyTeam(team) {
        // Make deep copies of the characters to avoid modifying original data
        this.enemyTeam = team.map(character => {
            // Create a deep copy
            const characterCopy = JSON.parse(JSON.stringify(character));
            
            // Add a small amount of variance to make battles less predictable
            // This is similar to what we do in generateRandomTeam
            const statVariance = 0.1; // 10% variance - lower than random opponents
            characterCopy.stats.hp = Math.floor(characterCopy.stats.hp * (1 + (Math.random() * statVariance * 2 - statVariance)));
            characterCopy.stats.attack = Math.floor(characterCopy.stats.attack * (1 + (Math.random() * statVariance * 2 - statVariance)));
            characterCopy.stats.defense = Math.floor(characterCopy.stats.defense * (1 + (Math.random() * statVariance * 2 - statVariance)));
            
            return characterCopy;
        });
        
        console.log('Custom enemy team set:', this.enemyTeam);
    }

    /**
     * Generate an enemy team based on battle mode
     * @param {string} mode - Battle mode ('random', 'custom', 'campaign')
     * @returns {Promise} - Promise that resolves when enemy team generation is complete
     */
    async generateEnemyTeam(mode) {
        this.enemyTeam = [];

        let generationPromise;

        switch (mode) {
            case 'random':
                generationPromise = this.generateRandomTeam();
                break;
            case 'custom':
                // Custom teams are now set directly via setCustomEnemyTeam
                // If we reach here, fall back to random (shouldn't happen with UI changes)
                generationPromise = this.generateRandomTeam();
                break;
            case 'campaign':
                // TODO: Implement campaign enemy teams
                generationPromise = this.generateRandomTeam(); // Use random for now
                break;
            default:
                generationPromise = this.generateRandomTeam();
        }

        // Wait for team generation to complete
        await generationPromise;
        
        console.log('Enemy team generation complete:', this.enemyTeam);
        return this.enemyTeam;
    }

    /**
     * Generate a random enemy team
     */
    async generateRandomTeam() {
        try {
            // Always refresh the characters to ensure we have the full pool
            try {
                const response = await fetch('data/characters.json');
                const data = await response.json();
                this.availableCharacters = data.characters;
            } catch (err) {
                console.error('Failed to fetch characters.json:', err);
                // Use hardcoded characters as fallback
                this.availableCharacters = [
                    {
                        id: 4,
                        name: "Vaelgar",
                        type: "dark",
                        role: "Knight",
                        rarity: "Epic",
                        stats: {
                            hp: 120,
                            attack: 18,
                            defense: 12
                        },
                        abilities: [
                            {
                                name: "Shadow Strike",
                                damage: 28,
                                cooldown: 3,
                                isHealing: false,
                                description: "Attacks from the shadows for heavy damage"
                            },
                            {
                                name: "Void Barrier",
                                damage: 20,
                                cooldown: 4,
                                isHealing: true,
                                description: "Creates a barrier of dark energy that absorbs damage"
                            }
                        ]
                    },
                    {
                        id: 3,
                        name: "Sylvanna",
                        type: "nature",
                        role: "Ranger",
                        rarity: "Uncommon",
                        stats: {
                            hp: 90,
                            attack: 15,
                            defense: 15
                        },
                        abilities: [
                            {
                                name: "Vine Whip",
                                damage: 20,
                                cooldown: 2,
                                isHealing: false,
                                description: "Strikes with vines that can ensnare the target"
                            },
                            {
                                name: "Nature's Blessing",
                                damage: 25,
                                cooldown: 4,
                                isHealing: true,
                                description: "Channels the power of nature to heal wounds"
                            }
                        ]
                    }
                ];
            }

            // Clear enemy team
            this.enemyTeam = [];
            
            // Safety check
            if (!this.availableCharacters || this.availableCharacters.length === 0) {
                console.error('No characters available to generate a team');
                return;
            }

            console.log(`Generating random team from ${this.availableCharacters.length} available characters`);

            // Always use max team size (3) for consistent 3v3 battles
            const teamSize = this.maxTeamSize;

            // Select random heroes, with duplicate prevention if possible
            const availableHeroes = [...this.availableCharacters];
            // If we have fewer heroes than needed for a full team, allow duplicates
            const allowDuplicates = availableHeroes.length < teamSize;
            
            for (let i = 0; i < teamSize; i++) {
                // If we run out of unique heroes but still need more, reset the pool
                if (availableHeroes.length === 0) {
                    if (allowDuplicates) {
                        // Reset the available heroes pool to allow duplicates
                        availableHeroes.push(...this.availableCharacters);
                    } else {
                        break;
                    }
                }

                const randomIndex = Math.floor(Math.random() * availableHeroes.length);
                const selectedHero = availableHeroes.splice(randomIndex, 1)[0];
                
                // Create a copy of the hero to avoid modifying the original
                const heroCopy = JSON.parse(JSON.stringify(selectedHero));
                
                // Add some randomness to stats
                const statVariance = 0.2; // 20% variance
                heroCopy.stats.hp = Math.floor(heroCopy.stats.hp * (1 + (Math.random() * statVariance * 2 - statVariance)));
                heroCopy.stats.attack = Math.floor(heroCopy.stats.attack * (1 + (Math.random() * statVariance * 2 - statVariance)));
                heroCopy.stats.defense = Math.floor(heroCopy.stats.defense * (1 + (Math.random() * statVariance * 2 - statVariance)));
                
                this.enemyTeam.push(heroCopy);
            }
            
            // Fallback if no team was generated
            if (this.enemyTeam.length === 0) {
                console.warn('No enemies were generated, using fallback');
                // Add at least one hero as fallback
                const fallbackHero = JSON.parse(JSON.stringify(this.availableCharacters[0]));
                this.enemyTeam.push(fallbackHero);
            }
        } catch (error) {
            console.error('Error generating random team:', error);
            // Use a fallback enemy
            this.enemyTeam = [
                {
                    id: 4,
                    name: "Vaelgar",
                    type: "dark",
                    role: "Knight",
                    stats: {
                        hp: 120,
                        attack: 18,
                        defense: 12
                    },
                    abilities: [
                        {
                            name: "Shadow Strike",
                            damage: 28,
                            cooldown: 3,
                            isHealing: false,
                            description: "Attacks from the shadows for heavy damage"
                        }
                    ]
                }
            ];
        }
        
        console.log('Generated enemy team:', this.enemyTeam);
    }
}
