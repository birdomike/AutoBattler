/**
 * Battle UI Debug Helper
 * Provides debugging and troubleshooting for the BattleUI
 */

class BattleUIDebug {
    /**
     * Create a debug snapshot of the current state of the UI
     * @param {BattleUI} battleUI - The BattleUI instance to debug
     * @returns {Object} Debug information
     */
    static createSnapshot(battleUI) {
        const snapshot = {
            isSetup: battleUI.isSetup,
            playerTeamCount: battleUI.playerTeam.length,
            enemyTeamCount: battleUI.enemyTeam.length,
            domElements: {},
            tailwindStatus: {}
        };
        
        // Check if key elements exist in the DOM
        snapshot.domElements.battleUI = !!document.getElementById('battle-ui');
        snapshot.domElements.battleArena = !!document.getElementById('battle-arena');
        snapshot.domElements.turnDisplay = !!document.getElementById('turn-display');
        snapshot.domElements.logContent = !!document.getElementById('battle-log-content');
        
        // Check Tailwind CSS status
        snapshot.tailwindStatus.linkExists = !!document.getElementById('tailwind-css');
        snapshot.tailwindStatus.interFontExists = !!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]');
        
        // Check for any CSS classes that are definitely from Tailwind
        const testElement = document.createElement('div');
        testElement.className = 'text-blue-500';
        document.body.appendChild(testElement);
        const computedStyle = window.getComputedStyle(testElement);
        snapshot.tailwindStatus.tailwindWorking = computedStyle.color !== 'rgb(0, 0, 0)'; // If not black, Tailwind might be working
        document.body.removeChild(testElement);
        
        // Create a log of all used colors
        snapshot.cssColors = {};
        document.querySelectorAll('.character-circle').forEach(el => {
            const style = window.getComputedStyle(el);
            const type = el.classList[1]?.replace('bg-', '') || 'unknown';
            snapshot.cssColors[type] = style.backgroundColor;
        });
        
        console.log('BattleUI Debug Snapshot:', snapshot);
        return snapshot;
    }
    
    /**
     * Fix common UI issues
     * @param {BattleUI} battleUI - The BattleUI instance to fix
     */
    static fixCommonIssues(battleUI) {
        console.log('BattleUIDebug: Attempting to fix common issues...');
        
        // Ensure Tailwind CSS is loaded directly
        if (!document.getElementById('tailwind-css')) {
            console.log('BattleUIDebug: Adding Tailwind CSS...');
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
        
        // Force reinstall custom styles
        console.log('BattleUIDebug: Reinstalling custom styles...');
        const existingStyles = document.getElementById('battle-ui-styles');
        if (existingStyles) {
            document.head.removeChild(existingStyles);
        }
        battleUI.addCustomStyles();
        
        // Force update UI elements
        console.log('BattleUIDebug: Forcing UI update...');
        if (battleUI.isSetup && battleUI.playerTeam.length > 0) {
            battleUI.update();
            
            // Re-render characters
            battleUI.renderCharacters(battleUI.playerTeam, battleUI.enemyTeam);
            
            // Reset active character
            if (battleUI.playerTeam.length > 0) {
                battleUI.setActiveCharacter(battleUI.playerTeam[0]);
            }
        }
        
        console.log('BattleUIDebug: Fix attempts completed');
    }
    
    /**
     * Inject a simple fallback UI style if Tailwind CSS fails to load
     */
    static injectFallbackStyles() {
        console.log('BattleUIDebug: Injecting fallback styles...');
        
        const fallbackStyles = document.createElement('style');
        fallbackStyles.id = 'battle-ui-fallback-styles';
        fallbackStyles.textContent = `
            #battle-ui {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: #141e2e;
                color: white;
                font-family: Arial, sans-serif;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                padding: 20px;
            }
            
            header {
                background-color: #232a40;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            main {
                flex: 1;
                display: flex;
                gap: 20px;
                justify-content: center;
                align-items: flex-start;
                padding-top: 30px;
                background-color: #1a1a2e;
            }
            
            section {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                width: 30%;
            }
            
            h2 {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            footer {
                margin-top: 15px;
            }
            
            .character-circle {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
                border: 2px solid rgba(255, 255, 255, 0.3);
            }
            
            .bg-fire { background-color: #ff4757; }
            .bg-water { background-color: #1e90ff; }
            .bg-nature { background-color: #2ed573; }
            .bg-dark { background-color: #9900cc; }
            .bg-light { background-color: #ffd700; }
            .bg-air { background-color: #70a1ff; }
            
            .hp-bar-container {
                width: 80px;
                margin: 0 auto;
            }
            
            .hp-bar-background {
                background-color: #4a5568;
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .hp-bar-current {
                background-color: #48bb78;
                height: 100%;
                border-radius: 4px 0 0 4px;
            }
            
            .battle-log {
                height: 150px;
                overflow-y: auto;
                background-color: #232a40;
                padding: 10px;
                border-radius: 8px;
            }
            
            .active-character .character-circle {
                box-shadow: 0 0 15px 5px rgba(255, 215, 0, 0.6);
            }
            
            button {
                padding: 8px 15px;
                background-color: #3742fa;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin-right: 5px;
            }
            
            .control-button {
                background-color: #4a5568;
            }
            
            .control-button.active {
                background-color: #3742fa;
            }
            
            /* Simple floating text animation */
            .floating-text {
                position: absolute;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 16px;
                font-weight: bold;
                white-space: nowrap;
                z-index: 10;
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
            
            /* Animation for when a character takes damage */
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                50% { transform: translateX(5px); }
                75% { transform: translateX(-5px); }
            }
        `;
        
        document.head.appendChild(fallbackStyles);
        console.log('BattleUIDebug: Fallback styles injected');
    }
}

// Export for use in other modules
window.BattleUIDebug = BattleUIDebug;
