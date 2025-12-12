const { extractPixels } = require('./step1_extraction');

// Moore Neighborhood Directions (Clockwise)
// 7 0 1
// 6 P 2
// 5 4 3
const DIRECTIONS = [
    { dx: 0, dy: -1 },  // 0: N
    { dx: 1, dy: -1 },  // 1: NE
    { dx: 1, dy: 0 },   // 2: E
    { dx: 1, dy: 1 },   // 3: SE
    { dx: 0, dy: 1 },   // 4: S
    { dx: -1, dy: 1 },  // 5: SW
    { dx: -1, dy: 0 },  // 6: W
    { dx: -1, dy: -1 }  // 7: NW
];

/**
 * Step 3: Contour Tracing
 * Finds all contours in a binary mask using Moore Neighbor Tracing.
 * 
 * @param {Array<Array<number>>} mask - 2D binary array
 * @returns {Array<{points: Array<{x,y}>, isHole: boolean}>}
 */
function traceContours(mask) {
    const height = mask.length;
    const width = mask[0].length;
    const visited = Array(height).fill().map(() => Array(width).fill(false));
    const contours = [];

    // Helper to check bounds and mask value
    const getPixel = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return 0;
        return mask[y][x];
    };

    // 1. Scan the grid
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (mask[y][x] === 1 && !visited[y][x]) {
                // Found a new shape start point
                // 1. Trace the boundary
                // We approached from the Left (West), so initial backtrack is 6 (West)
                const contourPoints = mooreNeighborTrace(mask, x, y, visited, 6);
                
                if (contourPoints.length > 0) {
                    contours.push({
                        points: contourPoints,
                        isHole: false // Hole detection is next sub-step
                    });
                }

                // 2. CRITICAL: Mark the ENTIRE connected shape as visited
                // using a Flood Fill (BFS) so we don't re-scan its internal pixels.
                floodFillVisited(mask, x, y, visited);
            }
        }
    }
    
    return contours;
}

/**
 * Marks all connected '1' pixels as visited starting from (x,y)
 */
function floodFillVisited(mask, startX, startY, visited) {
    const queue = [{x: startX, y: startY}];
    const width = mask[0].length;
    const height = mask.length;
    
    visited[startY][startX] = true;

    while (queue.length > 0) {
        const {x, y} = queue.shift();

        // Check 4-connected neighbors
        const neighbors = [
            {x: x+1, y: y}, {x: x-1, y: y},
            {x: x, y: y+1}, {x: x, y: y-1}
        ];

        for (const n of neighbors) {
            if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                if (mask[n.y][n.x] === 1 && !visited[n.y][n.x]) {
                    visited[n.y][n.x] = true;
                    queue.push(n);
                }
            }
        }
    }
}

function mooreNeighborTrace(mask, startX, startY, visited, initialBacktrackDir) {
    const contour = [];
    let cx = startX;
    let cy = startY;
    let backtrackDir = initialBacktrackDir; 
    
    contour.push({x: cx, y: cy});
    
    // Note: We do NOT mark 'visited' inside the trace loop anymore
    // because the Flood Fill handles the bulk, and we might revisit pixels
    // during the trace (e.g. thin lines). 
    // Actually, for the 'visited' array logic in traceContours to work, 
    // we rely on floodFill. So we can leave visited marking out of here 
    // OR keep it. Plan says "Mark visited". 
    // But strictly, the trace just reads. The Main Loop writes visited.
    // Wait, if we don't mark visited, the loop might get stuck?
    // No, the loop logic depends on mask values.
    
    const startPoint = {x: startX, y: startY};
    let loopCount = 0;
    const MAX_LOOP = 10000;

    while (true) {
        loopCount++;
        if (loopCount > MAX_LOOP) break;

        let foundNext = false;
        
        // Scan neighbors clockwise starting from backtrackDir
        for (let i = 0; i < 8; i++) {
            const checkDir = (backtrackDir + i) % 8;
            const offset = DIRECTIONS[checkDir];
            const nx = cx + offset.dx;
            const ny = cy + offset.dy;
            
            // Check bounds
            if (nx >= 0 && ny >= 0 && nx < mask[0].length && ny < mask.length) {
                if (mask[ny][nx] === 1) {
                    // Found next boundary point
                    cx = nx;
                    cy = ny;
                    // Update backtrack to be the direction BEFORE the one we found (CCW by 1)
                    // Logic: checkDir was the first 1. So (checkDir - 1) was a 0.
                    backtrackDir = (checkDir + 7) % 8;
                    foundNext = true;
                    break;
                }
            }
        }
        
        if (!foundNext) {
            break; // Isolated
        }
        
        // Check if closed
        if (cx === startPoint.x && cy === startPoint.y) {
            break;
        }
        
        contour.push({x: cx, y: cy});
    }

    return contour;
}

module.exports = { traceContours };
