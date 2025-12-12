/**
 * Step 7: SVG Building
 * Constructs the final SVG string.
 * 
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Array<{curves: Array, fillColor: string, width: number, height: number}>} shapes
 * @returns {string} SVG XML string
 */
function buildSVG(width, height, shapes) {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
`;

    shapes.forEach(shape => {
        let pathData = "";
        
        if (shape.curves.length > 0) {
            // Move to start of first curve
            const start = shape.curves[0].p0;
            pathData += `M ${toFixed(start.x)} ${toFixed(start.y)}`;

            shape.curves.forEach(curve => {
                pathData += ` C ${toFixed(curve.p1.x)} ${toFixed(curve.p1.y)} ${toFixed(curve.p2.x)} ${toFixed(curve.p2.y)} ${toFixed(curve.p3.x)} ${toFixed(curve.p3.y)}`;
            });
            
            pathData += " Z"; // Close path
        }

        // Use fillColor directly (e.g., "rgb(r,g,b)") or convert if it's an object
        let fillAttr = shape.fillColor;
        if (!fillAttr && shape.color) {
             fillAttr = rgbToHex(shape.color.r, shape.color.g, shape.color.b);
        }
        
        // Ensure we have a fallback
        if (!fillAttr) fillAttr = "black";

        svg += `  <path d="${pathData}" fill="${fillAttr}" stroke="none"/>
`;
    });

    svg += `</svg>`;
    return svg;
}

function toFixed(num) {
    return Math.round(num * 100) / 100; // 2 decimal places
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// --- Test Execution ---
if (require.main === module) {
    const shape = {
        fillColor: "rgb(255,128,0)",
        curves: [
            {
                p0: {x: 10, y: 10},
                p1: {x: 15, y: 5},
                p2: {x: 25, y: 5},
                p3: {x: 30, y: 10}
            }
        ]
    };
    
    console.log("--- Step 7 Test ---");
    console.log(buildSVG(100, 100, [shape]));
}

module.exports = { buildSVG };