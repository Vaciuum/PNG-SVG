const fs = require('fs');
const { extractPixels } = require('./step1_extraction');
const { quantizeImage, layerToMask } = require('./step2_quantize'); 
const { dilateHybrid } = require('./step2b_dilate');
const { traceContours } = require('./step3_tracing');
const { smoothPoints } = require('./step3b_smoothing');
const { simplifyPath } = require('./step4_simplification');
const { fitCurves } = require('./step5_curve_fitting');
const { buildSVG } = require('./step7_svg');

const CONFIG = {
    scale: 2.0,            // Lower scale for color images to keep speed up
    colorCount: 16,        // How many bands of color? (8-16 is good for logos)
    minArea: 10,           
    smoothingIters: 1,
    simplifyEpsilon: 1.0,
    // Hybrid dilation settings
    dilation: {
        unconditionalPasses: 1,  // Solidify internals
        smartPasses: 1,          // Close color gaps without bridging
    }
};

async function main() {
    const inputFile = process.argv[2] || 'bird.png';
    const outputFile = process.argv[3] || 'output.svg';

    console.log(`Processing ${inputFile}...`);
    const pixelData = await extractPixels(inputFile, CONFIG.scale);
    
    // 1. QUANTIZE: Split image into separate color layers
    console.log(`Splitting into ${CONFIG.colorCount} colors...`);
    const layers = quantizeImage(pixelData, CONFIG.colorCount);

    // SMART DILATION SETUP: Create Coverage Mask
    // Identify all pixels that belong to the image (alpha > 20)
    // We will only dilate INTO these pixels, preventing expansion into empty space.
    const { width, height, pixels } = pixelData;
    const coverageMask = Array(height).fill(null).map(() => Array(width).fill(0));
    let validPixelCount = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            if (pixels[idx + 3] > 20) {
                coverageMask[y][x] = 1;
                validPixelCount++;
            }
        }
    }
    console.log(`Coverage Mask Created. Valid pixels: ${validPixelCount}`);

    // DIAGNOSTIC: Check Pixel Coverage
    const totalAssigned = layers.reduce((sum, l) => sum + l.points.length, 0);
    console.log(`Total pixels assigned to layers: ${totalAssigned}`);
    console.log(`Coverage: ${(totalAssigned / validPixelCount * 100).toFixed(1)}%`);

    let allShapes = [];

    // 2. PROCESS EACH LAYER SEPARATELY
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const rgbColor = `rgb(${layer.color.r},${layer.color.g},${layer.color.b})`;
        
        console.log(`\n=== Layer ${i+1}/${layers.length} (${rgbColor}) ===`);
        // console.log(`Pixel count: ${layer.points.length}`);

        // Convert points to binary mask
        let mask = layerToMask(layer.points, pixelData.width, pixelData.height);
        
        // HYBRID DILATION: Pass 1 Unconditional, Pass 2 Smart
        const dilated = dilateHybrid(mask, coverageMask, CONFIG.dilation);
        
        // Diagnostic: compare before/after
        const beforeSum = mask.flat().reduce((a, b) => a + b, 0);
        const afterSum = dilated.flat().reduce((a, b) => a + b, 0);
        console.log(`Dilation: ${beforeSum} → ${afterSum} pixels (+${afterSum - beforeSum})`);

        // Trace
        const contours = traceContours(dilated);
        console.log(`Raw contours found: ${contours.length}`);

        const layerShapes = contours.map(contour => {
            // FIX: Trace returns objects {points, isHole}, not arrays!
            const points = contour.points; 
            const area = getPolygonArea(points);
            
            if (area < CONFIG.minArea) return null;
            
            const smoothed = smoothPoints(points, CONFIG.smoothingIters);
            const simplified = simplifyPath(smoothed, CONFIG.simplifyEpsilon);
            const curves = fitCurves(simplified);
            
            // Store area for sorting later
            return { curves, fillColor: rgbColor, area, isHole: contour.isHole };
        }).filter(c => c !== null);

        allShapes = allShapes.concat(layerShapes);
    }

    // 3. Build Final SVG
    console.log(`\nTotal shapes: ${allShapes.length}`);
    
    // FIX: Sort by area (Largest first) to ensure background layers are drawn first
    allShapes.sort((a, b) => b.area - a.area);
    console.log('Sorted shapes by area (Largest on bottom).');

    const svgString = buildSVG(pixelData.width, pixelData.height, allShapes);
    
    fs.writeFileSync(outputFile, svgString);
    console.log(`Saved to ${outputFile}`);
}

function getPolygonArea(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
}

if (require.main === module) {
    main();
}