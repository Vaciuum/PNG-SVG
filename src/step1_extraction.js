const fs = require('fs');
const { loadImage, createCanvas } = require('canvas');

/**
 * Step 1: Pixel Extraction
 * Loads a PNG image and extracts raw pixel data, optionally upscaling it.
 * 
 * @param {string} filePath - Path to the PNG file
 * @param {number} scaleFactor - Multiplier for upscaling (default 1 = no scale)
 * @returns {Promise<{width: number, height: number, pixels: Uint8ClampedArray}>}
 */
async function extractPixels(filePath, scaleFactor = 1) {
    // 1. Load the image
    const image = await loadImage(filePath);

    // 2. Create a canvas (scaled if needed)
    const width = Math.floor(image.width * scaleFactor);
    const height = Math.floor(image.height * scaleFactor);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 3. Configure smoothing
    // CRITICAL: We want 'Bilinear' or 'Bicubic' interpolation, NOT 'Nearest Neighbor'.
    if (scaleFactor > 1) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high'; 
    } else {
        // If we are not scaling, we want raw pixels
        ctx.imageSmoothingEnabled = false;
    }

    // 4. Draw image onto canvas (stretched to new size)
    ctx.drawImage(image, 0, 0, width, height);

    // 5. Extract the data array
    // This returns an ImageData object: { width, height, data }
    const imageData = ctx.getImageData(0, 0, width, height);

    return {
        width: imageData.width,
        height: imageData.height,
        pixels: imageData.data // Uint8ClampedArray [R, G, B, A, ...]
    };
}

// --- Test Execution (if run directly) ---
if (require.main === module) {
    const testFile = 'test_square.png';
    
    if (!fs.existsSync(testFile)) {
        console.error(`Error: ${testFile} not found. Run 'node src/generate_test_images.js' first.`);
        process.exit(1);
    }

    // Test with 2x scaling
    extractPixels(testFile, 2).then(data => {
        console.log("Step 1 Success!");
        console.log(`Dimensions: ${data.width}x${data.height}`); // Should be 20x20
        console.log(`Total Pixels Data Size: ${data.pixels.length}`);
        
        // Log the first pixel (should be Red: 255, 0, 0, 255)
        console.log("First Pixel (RGBA):", 
            data.pixels[0], data.pixels[1], data.pixels[2], data.pixels[3]
        );
    }).catch(err => {
        console.error("Error extracting pixels:", err);
    });
}

module.exports = { extractPixels };
