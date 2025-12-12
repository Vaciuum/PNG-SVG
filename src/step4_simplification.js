/**
 * Step 4: Path Simplification
 * Reduces the number of points in a contour using the Douglas-Peucker algorithm.
 * 
 * @param {Array<{x,y}>} points - The original contour points
 * @param {number} tolerance - Distance tolerance in pixels (e.g., 1.0)
 * @returns {Array<{x,y}>} The simplified array of points
 */
function simplifyPath(points, tolerance = 1.0) {
    if (points.length < 3) return points;

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    
    let maxDistance = 0;
    let index = 0;

    // Find the point with the maximum distance from the line segment (first -> last)
    for (let i = 1; i < points.length - 1; i++) {
        const d = perpendicularDistance(points[i], firstPoint, lastPoint);
        if (d > maxDistance) {
            maxDistance = d;
            index = i;
        }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
        const leftPath = simplifyPath(points.slice(0, index + 1), tolerance);
        const rightPath = simplifyPath(points.slice(index), tolerance);

        // Merge results (prevent duplicating the middle point)
        return leftPath.slice(0, leftPath.length - 1).concat(rightPath);
    } else {
        // All points are within tolerance, just keep the endpoints
        return [firstPoint, lastPoint];
    }
}

/**
 * Calculates perpendicular distance from point P to line segment AB
 */
function perpendicularDistance(point, lineStart, lineEnd) {
    const x = point.x;
    const y = point.y;
    const x1 = lineStart.x;
    const y1 = lineStart.y;
    const x2 = lineEnd.x;
    const y2 = lineEnd.y;

    // Area of triangle * 2 / Base length
    // numerator = |(y2-y1)x - (x2-x1)y + x2y1 - y2x1|
    const numerator = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
    const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

    if (denominator === 0) return 0; // Start and end are same
    return numerator / denominator;
}

// --- Test Execution ---
if (require.main === module) {
    // Create a simple line with a bump
    // 0,0 -> 5,0 -> 5,5 -> 5,0 -> 10,0
    // Actually let's do a curve approximation
    const points = [
        {x: 0, y: 0},
        {x: 1, y: 0.1},
        {x: 2, y: -0.1},
        {x: 5, y: 2}, // Bump
        {x: 8, y: 0.1},
        {x: 10, y: 0}
    ];
    
    console.log("--- Step 4 Test ---");
    console.log(`Original points: ${points.length}`);
    const simplified = simplifyPath(points, 1.0);
    console.log(`Simplified points: ${simplified.length}`);
    console.log(JSON.stringify(simplified));
}

module.exports = { simplifyPath };
