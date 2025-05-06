/**
 * ImageDebugger.js
 * Utility for debugging image loading issues in the game
 * Debug button removed as character art implementation is now stable
 */


window.ImageDebugger = {
    /**
     * Test loading an image from various paths
     * @param {string} imageName - Base name of the image file (e.g., "Aqualia.png")
     * @returns {Promise<string>} - Promise resolving to the working path or error message
     */
    testImagePaths: async function(imageName) {
        // Set up possible paths to test
        const paths = [
            `./assets/images/Character Art/${imageName}`,
            `/assets/images/Character Art/${imageName}`,
            `assets/images/Character Art/${imageName}`,
            `../assets/images/Character Art/${imageName}`,
            `C:/Personal/AutoBattler/assets/images/Character Art/${imageName}`,
            `../../assets/images/Character Art/${imageName}`
        ];
        
        const results = {};
        
        // Create a div to display loading status in the UI
        const debugDiv = document.createElement('div');
        debugDiv.style.position = 'fixed';
        debugDiv.style.top = '10px';
        debugDiv.style.right = '10px';
        debugDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
        debugDiv.style.color = 'white';
        debugDiv.style.padding = '10px';
        debugDiv.style.zIndex = '9999';
        debugDiv.style.maxWidth = '400px';
        debugDiv.style.maxHeight = '400px';
        debugDiv.style.overflow = 'auto';
        debugDiv.style.fontFamily = 'monospace';
        debugDiv.style.fontSize = '12px';
        debugDiv.innerHTML = '<h3>Image Path Testing</h3>';
        document.body.appendChild(debugDiv);
        
        // Test each path
        for (const path of paths) {
            const result = await this.testSinglePath(path, debugDiv);
            results[path] = result;
        }
        
        // Add a close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.marginTop = '10px';
        closeButton.style.padding = '5px 10px';
        closeButton.addEventListener('click', () => document.body.removeChild(debugDiv));
        debugDiv.appendChild(closeButton);
        
        // Return the results summary
        return results;
    },
    
    /**
     * Test loading a single image path
     * @param {string} path - Path to test
     * @param {HTMLElement} debugDiv - Debug display element
     * @returns {Promise<string>} - Promise resolving to success or error message
     */
    testSinglePath: function(path, debugDiv) {
        return new Promise((resolve) => {
            const img = new Image();
            const statusElement = document.createElement('div');
            statusElement.innerHTML = `Testing: ${path} <span style="color:yellow">⏳</span>`;
            debugDiv.appendChild(statusElement);
            
            // Set a timeout for loading
            const timeout = setTimeout(() => {
                statusElement.innerHTML = `Testing: ${path} <span style="color:orange">⌛ Timed out after 5s</span>`;
                resolve('Timed out');
            }, 5000);
            
            img.onload = () => {
                clearTimeout(timeout);
                statusElement.innerHTML = `Testing: ${path} <span style="color:green">✓ Success (${img.width}x${img.height})</span>`;
                
                // Display the image as thumbnail
                const thumb = document.createElement('img');
                thumb.src = path;
                thumb.style.width = '50px';
                thumb.style.height = '50px';
                thumb.style.objectFit = 'contain';
                thumb.style.marginLeft = '10px';
                statusElement.appendChild(thumb);
                
                resolve('Success');
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                statusElement.innerHTML = `Testing: ${path} <span style="color:red">✗ Failed</span>`;
                resolve('Failed');
            };
            
            img.src = path;
        });
    },
    
    // Character-specific debug methods removed as they're no longer needed
};

// Global debug functions removed

console.log('ImageDebugger initialized - debugging UI elements removed.');
