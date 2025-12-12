/**
 * Step 5: Curve Fitting (Robust Version)
 * Converts simplified points into Cubic Bezier curves.
 * Includes DUPLICATE REMOVAL and MATH SAFETY to prevent "spikes".
 */

function fitCurves(points) {
    // 1. SANITIZATION: Remove points that are too close to each other
    const cleanPoints = filterDuplicates(points, 1.0); // 1.0 pixel threshold

    const curves = [];
    if (cleanPoints.length < 2) return curves;

    const isClosed = (cleanPoints[0].x === cleanPoints[cleanPoints.length-1].x && 
                      cleanPoints[0].y === cleanPoints[cleanPoints.length-1].y);

    for (let i = 0; i < cleanPoints.length - 1; i++) {
        const p0 = cleanPoints[i];
        const p3 = cleanPoints[i + 1];
        
        // Safety: If p0 and p3 are somehow still the same, skip.
        if (distance(p0, p3) < 0.1) continue;

        const prev = (i === 0) 
            ? (isClosed ? cleanPoints[cleanPoints.length - 2] : p0) 
            : cleanPoints[i - 1];
            
        const next = (i + 1 === cleanPoints.length - 1)
            ? (isClosed ? cleanPoints[1] : p3)
            : cleanPoints[i + 2];

        // --- CORNER LOGIC ---
        const p0IsCorner = isCorner(prev, p0, p3);
        const p3IsCorner = isCorner(p0, p3, next);

        let tangent1, tangent2;

        // Calculate Tangent 1 (Start)
        if (p0IsCorner) {
            tangent1 = safeNormalize({x: p3.x - p0.x, y: p3.y - p0.y});
        } else {
            tangent1 = safeNormalize({x: p3.x - prev.x, y: p3.y - prev.y}); // Catmull-Rom
        }

        // Calculate Tangent 2 (End)
        if (p3IsCorner) {
            tangent2 = safeNormalize({x: p0.x - p3.x, y: p0.y - p3.y});
        } else {
            tangent2 = safeNormalize({x: p0.x - next.x, y: p0.y - next.y}); // Catmull-Rom
        }

        const dist = distance(p0, p3);
        
        // CLAMP HANDLES: Ensure handles are never longer than 40% of the segment
        // This prevents loops and "spikes"
        const maxLen = dist * 0.4;
        
        const len1 = p0IsCorner ? Math.min(dist * 0.1, maxLen) : Math.min(dist * 0.33, maxLen);
        const len2 = p3IsCorner ? Math.min(dist * 0.1, maxLen) : Math.min(dist * 0.33, maxLen);

        const p1 = {
            x: p0.x + tangent1.x * len1,
            y: p0.y + tangent1.y * len1
        };

        const p2 = {
            x: p3.x + tangent2.x * len2, // We use + because vector was calculated pointing backwards
            y: p3.y + tangent2.y * len2
        };

        curves.push({ p0, p1, p2, p3 });
    }

    return curves;
}

/**
 * Removes sequential duplicate points.
 * Spikes happen when P[i] and P[i+1] are identical.
 */
function filterDuplicates(points, threshold = 0.5) {
    if (points.length < 2) return points;
    const result = [points[0]];
    
    for (let i = 1; i < points.length; i++) {
        const last = result[result.length - 1];
        const curr = points[i];
        if (distance(last, curr) > threshold) {
            result.push(curr);
        }
    }
    // If closed, ensure start/end match exactly
    if (points.length > 2) {
        const first = points[0];
        const last = points[points.length-1];
        if (first.x === last.x && first.y === last.y) {
             // Make sure the cleaned list is also closed
             if (distance(result[0], result[result.length-1]) > threshold) {
                 result.push(result[0]);
             }
        }
    }
    return result;
}

function isCorner(prev, curr, next) {
    if (!prev || !next) return true;
    
    // Safety check for duplicates in corner logic
    if (distance(prev, curr) < 0.1 || distance(curr, next) < 0.1) return false;

    const v1 = safeNormalize({x: curr.x - prev.x, y: curr.y - prev.y});
    const v2 = safeNormalize({x: next.x - curr.x, y: next.y - curr.y});

    const dot = (v1.x * v2.x) + (v1.y * v2.y);
    return dot < 0.2; // Stricter threshold for corners (approx 78 degrees)
}

// SAFE NORMALIZE: Never crashes on zero-length vectors
function safeNormalize(v) {
    const len = Math.sqrt(v.x*v.x + v.y*v.y);
    if (len < 1e-9) return {x: 0, y: 0}; // Return zero vector if length is zero
    return {x: v.x / len, y: v.y / len};
}

function distance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// --- Test Block ---
if (require.main === module) {
    const points = [
        {x: 0, y: 0},
        {x: 0.01, y: 0.01}, // Duplicate!
        {x: 10, y: 10},
        {x: 20, y: 0}
    ];
    console.log("Testing Duplicate Filter & Robust Curve Fit...");
    const curves = fitCurves(points);
    console.log(`Generated ${curves.length} curves from ${points.length} input points.`);
}

module.exports = { fitCurves };