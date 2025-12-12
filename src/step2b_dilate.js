/**
 * Step 2b: Morphological Dilation
 * Expands white shapes by 1 pixel in all directions (8-way connectivity).
 * Fixes "Twisted Taffy" effect on thin lines and closes gaps.
 * 
 * UPDATED: Supports "Hybrid Dilation"
 * 1. Unconditional Pass: Solidifies internal micro-gaps.
 * 2. Smart Pass: Closes boundary gaps without bridging external negative space.
 */

/**
 * Hybrid dilation: combines unconditional and smart dilation
 * 
 * @param {number[][]} mask - Binary mask for this color layer
 * @param {number[][]} coverageMask - Mask of ALL valid pixels in image
 * @param {object} options - Dilation settings
 */
function dilateHybrid(mask, coverageMask, options = {}) {
    const {
        unconditionalPasses = 1,  // First: expand everywhere
        smartPasses = 1,          // Then: expand only within coverage
    } = options;
    
    let result = mask;
    
    // Pass 1: Unconditional dilation (fills internal micro-gaps)
    for (let i = 0; i < unconditionalPasses; i++) {
        result = dilateOnce(result, null);  // null = no boundary check
    }
    
    // Pass 2: Smart dilation (respects external boundaries)
    for (let i = 0; i < smartPasses; i++) {
        result = dilateOnce(result, coverageMask);
    }
    
    return result;
}

function dilateOnce(mask, coverageMask) {
    const height = mask.length;
    const width = mask[0].length;
    // Create new buffer
    const output = Array(height).fill(null).map(() => Array(width).fill(0));
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (mask[y][x] === 1) {
                // Set self and all 8 neighbors
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        // Bounds check
                        if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                            // SMART DILATION CHECK:
                            // Only dilate if:
                            // 1. No coverage mask is provided (standard dilation)
                            // 2. OR the target pixel is valid in the coverage mask
                            if (coverageMask === null || coverageMask[ny][nx] === 1) {
                                output[ny][nx] = 1;
                            }
                        }
                    }
                }
            }
        }
    }
    return output;
}

// Compatibility export if dilateMask is still called elsewhere, 
// but main.js should switch to dilateHybrid.
const dilateMask = (mask, iterations, coverageMask) => 
    dilateHybrid(mask, coverageMask, { unconditionalPasses: 0, smartPasses: iterations });

module.exports = { dilateHybrid, dilateOnce, dilateMask };
