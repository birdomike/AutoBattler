/**
 * Tooltip Manager
 * Manages tooltip display for UI elements
 */

class TooltipManager {
    /**
     * Create a new Tooltip Manager
     */
    constructor() {
        this.tooltip = null;
        this.initialize();
    }

    /**
     * Initialize the tooltip element
     */
    initialize() {
        // Create tooltip element if it doesn't exist
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'tooltip';
            this.tooltip.style.display = 'none';
            document.body.appendChild(this.tooltip);

            // Add mousemove event to move tooltip with cursor
            document.addEventListener('mousemove', (e) => {
                if (this.tooltip.style.display === 'block') {
                    const offset = 15; // Distance from cursor
                    
                    // Position tooltip based on cursor position
                    this.tooltip.style.left = (e.pageX + offset) + 'px';

                    // Make sure tooltip doesn't go off-screen
                    const tooltipRect = this.tooltip.getBoundingClientRect();
                    if (e.pageY + offset + tooltipRect.height > window.innerHeight) {
                        this.tooltip.style.top = (e.pageY - tooltipRect.height - offset) + 'px';
                    } else {
                        this.tooltip.style.top = (e.pageY + offset) + 'px';
                    }
                }
            });
        }
    }

    /**
     * Show tooltip with content
     * @param {string} content - HTML content for the tooltip
     */
    show(content) {
        this.tooltip.innerHTML = content;
        this.tooltip.style.display = 'block';
    }

    /**
     * Hide tooltip
     */
    hide() {
        this.tooltip.style.display = 'none';
    }

    /**
     * Add tooltip to an element
     * @param {HTMLElement} element - Element to add tooltip to
     * @param {string|Function} content - Content for tooltip or function returning content
     */
    addTooltip(element, content) {
        element.addEventListener('mouseenter', () => {
            const tooltipContent = typeof content === 'function' ? content() : content;
            this.show(tooltipContent);
        });

        element.addEventListener('mouseleave', () => {
            this.hide();
        });
    }
}

// Create a singleton instance
const tooltipManager = new TooltipManager();

// Make it available globally
window.tooltipManager = tooltipManager;
