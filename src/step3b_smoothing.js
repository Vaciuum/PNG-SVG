/**
 * Step 3b: Coordinate Smoothing (The "Melter")
 * Applies a Gaussian weighted average to coordinates.
 * Turns jagged pixel steps "|_|_" into smooth slopes "/".
 * 
 * Formula: P_new = (P_prev + 2*P_curr + P_next) / 4
 */

function smoothPoints(points, iterations = 2) {
    if (points.length < 3) return points;

    let currentPoints = [...points];

    for (let iter = 0; iter < iterations; iter++) {
        const newPoints = [];
        const len = currentPoints.length;
        
        // Loop through every point
        for (let i = 0; i < len; i++) {
            // Handle wrap-around for closed loops
            const prev = currentPoints[(i - 1 + len) % len];
            const curr = currentPoints[i];
            const next = currentPoints[(i + 1) % len];

            // Apply Weighted Average
            // We give double weight to the current point to maintain shape integrity
            newPoints.push({
                x: (prev.x + (curr.x * 2) + next.x) / 4,
                y: (prev.y + (curr.y * 2) + next.y) / 4
            });
        }
        currentPoints = newPoints;
    }
    return currentPoints;
}

// Helper to filter noise (kept for reference or external use)
function filterNoise(contours, minArea = 50) {
    return contours.filter(contour => {
        let area = 0;
        const len = contour.length;
        for (let i = 0; i < len; i++) {
            const j = (i + 1) % len;
            area += contour[i].x * contour[j].y;
            area -= contour[j].x * contour[i].y;
        }
        return (Math.abs(area) / 2) > minArea;
    });
}

module.exports = { smoothPoints, filterNoise };