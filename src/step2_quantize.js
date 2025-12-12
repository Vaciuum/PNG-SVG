/**
 * Step 2: Color Quantization (Improved)
 * Reduces image to a fixed palette using K-Means Clustering.
 * 
 * Improvements:
 * 1. Only samples non-transparent pixels for initialization.
 * 2. Logs pixel counts per layer.
 * 3. Handles "empty" layers gracefully.
 */

function quantizeImage(pixelData, colorCount = 8) {
    const { width, height, pixels } = pixelData;
    const totalPixels = width * height;
    
    // 1. Identify Valid Pixels (Index of every non-transparent pixel)
    // This prevents us from initializing centers on invisible background pixels.
    const validPixelIndices = [];
    for (let i = 0; i < totalPixels; i++) {
        const a = pixels[i * 4 + 3];
        if (a > 20) { // Threshold for "visible"
            validPixelIndices.push(i);
        }
    }

    console.log(`   [Quantize] Found ${validPixelIndices.length} valid pixels out of ${totalPixels}.`);

    if (validPixelIndices.length === 0) {
        console.warn("   [Quantize] Warning: Image appears fully transparent!");
        return [];
    }

    // 2. Initialize Centers (Randomly pick from VALID pixels)
    // We pick more than we need and then prune close duplicates to get a good spread.
    let centers = [];
    const seenColors = new Set();
    let attempts = 0;
    
    // Try to find distinct starting colors
    while (centers.length < colorCount && attempts < 1000) {
        attempts++;
        const randIdx = validPixelIndices[Math.floor(Math.random() * validPixelIndices.length)];
        const r = pixels[randIdx * 4];
        const g = pixels[randIdx * 4 + 1];
        const b = pixels[randIdx * 4 + 2];
        
        // Simple key to avoid exact duplicates
        const key = `${r},${g},${b}`;
        if (!seenColors.has(key)) {
            centers.push({ r, g, b });
            seenColors.add(key);
        }
    }
    
    // If we still don't have enough, just duplicate the last one (it will merge later)
    // or pick random valid ones even if duplicates
    while (centers.length < colorCount) {
         const randIdx = validPixelIndices[Math.floor(Math.random() * validPixelIndices.length)];
         centers.push({
            r: pixels[randIdx * 4],
            g: pixels[randIdx * 4 + 1],
            b: pixels[randIdx * 4 + 2]
         });
    }

    console.log(`   [Quantize] Initialized ${centers.length} color centers.`);

    // 3. K-Means Loop (Running 3 iterations for speed/convergence balance)
    const iterations = 3;
    let clusters = [];

    for (let iter = 0; iter < iterations; iter++) {
        // Reset clusters
        clusters = Array(colorCount).fill(0).map(() => ({
            points: [],
            sumR: 0, sumG: 0, sumB: 0
        }));

        // Assign every valid pixel to closest center
        for (const pIdx of validPixelIndices) {
            const r = pixels[pIdx * 4];
            const g = pixels[pIdx * 4 + 1];
            const b = pixels[pIdx * 4 + 2];

            let minDist = Infinity;
            let bestCenter = 0;

            for (let c = 0; c < colorCount; c++) {
                const cent = centers[c];
                const dist = (r - cent.r) ** 2 + (g - cent.g) ** 2 + (b - cent.b) ** 2;
                if (dist < minDist) {
                    minDist = dist;
                    bestCenter = c;
                }
            }

            // Add to cluster
            const cluster = clusters[bestCenter];
            cluster.points.push({ 
                x: pIdx % width, 
                y: Math.floor(pIdx / width) 
            });
            cluster.sumR += r;
            cluster.sumG += g;
            cluster.sumB += b;
        }

        // Re-calculate centers
        for (let c = 0; c < colorCount; c++) {
            const cluster = clusters[c];
            const count = cluster.points.length;
            if (count > 0) {
                centers[c].r = Math.floor(cluster.sumR / count);
                centers[c].g = Math.floor(cluster.sumG / count);
                centers[c].b = Math.floor(cluster.sumB / count);
            }
        }
    }

    // 4. Format Output
    // Filter out empty clusters
    const results = clusters.map((cluster, index) => ({
        color: centers[index],
        points: cluster.points
    })).filter(c => c.points.length > 0);

    console.log(`   [Quantize] Final Result: ${results.length} distinct color layers.`);
    results.forEach((res, i) => {
        console.log(`      Layer ${i}: rgb(${res.color.r},${res.color.g},${res.color.b}) - ${res.points.length} pixels`);
    });

    return results;
}

function layerToMask(layerPoints, width, height) {
    const mask = Array(height).fill(0).map(() => Array(width).fill(0));
    for (const p of layerPoints) {
        mask[p.y][p.x] = 1;
    }
    return mask;
}

module.exports = { quantizeImage, layerToMask };