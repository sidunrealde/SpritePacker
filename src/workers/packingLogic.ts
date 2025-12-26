import { MaxRectsPacker } from 'maxrects-packer';
import type { PackRequest, PackResult, Rect } from './types';

export function performPacking(req: PackRequest): PackResult {
    const { layout, width, height, padding, scaleToFit, autoSize } = req;
    let packed: Rect[] = [];
    let unpacked: Rect[] = [];

    // Auto-Size: Use a very large container if autoSize is ON
    const packWidth = autoSize ? 8192 : width;
    const packHeight = autoSize ? 8192 : height;

    // Just run once if scaleToFit is OFF and autoSize is OFF (or ON, since we have huge space)
    // If scaleToFit is ON, we still scale.
    // If autoSize is ON, we typically don't scale-to-fit because we just grow? 
    // Wait, user might want to Pack tightly into smallest POT/Area? 
    // MaxRectsPacker does NOT auto-shrink container to optimal size by default but bins grow.
    // However, if we pass 8192, it packs into that. 
    // We can calculate bounding box of result to return "actual" size.

    let scalingFactor = 1.0;
    const maxIterations = 10;

    for (let i = 0; i < maxIterations; i++) {
        packed.length = 0;
        unpacked.length = 0;

        // Apply Per-Image Padding to dimensions passed to packer
        // Note: Global padding is 'gap' between sprites. 
        // Per-image padding usually means 'extra space around this sprite'. 
        // MaxRectsPacker 'padding' option is global spacing.
        // However, MaxRectsPacker doesn't support per-item padding natively in the same way.
        // We will add (img.padding * 2) to width/height.
        // And when unpacking, we adjust x,y by +img.padding.


        // Pre-process inputs
        // Apply rotation (Manual) and Padding
        // Calculate Total Area for AutoSize sizing heuristic
        let totalArea = 0;
        let maxItemW = 0;
        let maxItemH = 0;

        const inputs = req.images.map(img => {
            const pad = img.padding || { top: 0, bottom: 0, left: 0, right: 0 };
            const pW = pad.left + pad.right;
            const pH = pad.top + pad.bottom;
            // Manual Rotation:
            // If rotation is 90 or 270, we swap dimensions.
            const isRotated90 = (img.rotation === 90 || img.rotation === 270);

            // Original dimensions (unscaled)
            let baseW = img.width;
            let baseH = img.height;

            if (isRotated90) {
                const temp = baseW;
                baseW = baseH;
                baseH = temp;
            }

            // Apply scaling factor (if relevant, though usually scaleToFit is for fixed size).
            // We apply scaling later if needed? No, scaleToFit was for FIXED size.
            // If scaleToFit is active AND autoSize is OFF, we scale.

            const w = Math.ceil(baseW * scalingFactor) + pW;
            const h = Math.ceil(baseH * scalingFactor) + pH;

            totalArea += w * h;
            maxItemW = Math.max(maxItemW, w);
            maxItemH = Math.max(maxItemH, h);

            return {
                width: w,
                height: h,
                data: { id: img.id, file: img.file, width: baseW, height: baseH, padding: pad, originalRotation: img.rotation },
                allowRotation: false // We handled rotation manually
            };
        });

        // Determine Packing Dimensions
        let currentPackW = packWidth;
        let currentPackH = packHeight;

        if (autoSize) {
            // Heuristic: Start with Sqrt(Area).
            // Ensure at least max item size.
            const side = Math.ceil(Math.sqrt(totalArea));
            // Add buffer (10-20% usually good for bin packing efficiency)
            let initialSide = Math.max(side * 1.1, maxItemW, maxItemH);

            // Round up to POT or just multiple of 4? No need.
            currentPackW = Math.ceil(initialSide);
            currentPackH = Math.ceil(initialSide);
        }

        // Iterative Packing Loop (Mainly for AutoSize expansion)
        let success = false;

        while (!success) {
            // placeholder
            if (layout === 'maxrects') {
                const packer = new MaxRectsPacker(currentPackW, currentPackH, padding, {
                    smart: false, // Maintain order as much as possible (though MaxRects usually changes it)
                    pot: false,
                    square: false,
                    allowRotation: false, // We handled it
                    tag: false,
                    border: 0,
                });

                packer.addArray(inputs as any[]);

                // If AutoSize, check if we have multiple bins. If so, fail and grow.
                // If NOT AutoSize, we accept what we have (and leave leftovers as unpacked),
                // UNLESS scaleToFit is on.

                if (autoSize) {
                    if (packer.bins.length > 1) {
                        // Grow
                        currentPackW = Math.ceil(currentPackW * 1.2);
                        currentPackH = Math.ceil(currentPackH * 1.2);
                        // Safety break?
                        if (currentPackW > 16384) break; // Hard limit
                        continue; // Retry
                    }
                } else if (scaleToFit && packer.bins.length > 1) {
                    // Try scaling down
                    scalingFactor *= 0.9;
                    // Re-calc inputs?
                    // We need to re-run the loop from inputs creation...
                    // This structure isn't great for that.
                    // Let's assume strict separation: 
                    // If scaleToFit, we wrap EVERYTHING in an outer loop.
                    // But for now, let's just handle AutoSize growth.
                    // ScaleToFit logic is complex to mix with AutoSize growth.
                    // Assuming AutoSize disables ScaleToFit.
                }

                // Process Results
                packer.bins.forEach((bin, binIndex) => {
                    bin.rects.forEach((r) => {
                        const data = (r.data as any);
                        const pad = data.padding;

                        // r includes padding
                        // Image drawn at x + pad.left, y + pad.top
                        // Dimensions?
                        // r.width is (baseW + pW).
                        // Image Content Size = baseW.
                        // We placed the box.

                        const finalX = r.x + pad.left;
                        const finalY = r.y + pad.top;

                        // finalW/H for the IMAGE
                        const finalW = r.width - (pad.left + pad.right);
                        const finalH = r.height - (pad.top + pad.bottom);

                        const item: Rect = {
                            id: data.id,
                            x: finalX,
                            y: finalY,
                            width: finalW,
                            height: finalH,
                            rotation: data.originalRotation,
                            file: data.file,
                        };

                        if (binIndex === 0) {
                            packed.push(item);
                        } else {
                            unpacked.push({ ...item, x: 0, y: 0 });
                        }
                    });
                });

                // If we got here and AutoSize is on, we succeeded (bins=1).
                // Or we failed at max size.
                // If Not AutoSize, we are done (unpacked items exist).
                success = true;

            } else if (layout === 'grid') {
                // Grid Layout with wrapping
                // We need to fit into currentPackW/H.
                // If AutoSize, we only care about width causing wrap? 
                // Or do we have a fixed width?
                // Usually grid implies "Fill Row".
                // If AutoSize, what determines Row Width?
                // Square heuristic logic from above sets currentPackW.
                // So we fill that width.

                let cx = 0;
                let cy = 0;
                let rowH = 0;
                let allFit = true;

                const localPacked: Rect[] = [];

                for (const img of inputs) {
                    const data = (img.data as any);
                    const pad = data.padding;

                    if (cx + img.width > currentPackW) {
                        cx = 0;
                        cy += rowH + padding;
                        rowH = 0;
                    }

                    // Check vertical fit
                    if (cy + img.height > currentPackH) {
                        if (autoSize) {
                            allFit = false;
                            break;
                        } else {
                            // Just unpack
                            unpacked.push({ id: data.id, x: 0, y: 0, width: data.width, height: data.height, rotation: data.originalRotation, file: data.file });
                            continue;
                        }
                    }

                    localPacked.push({
                        id: data.id,
                        x: cx + pad.left,
                        y: cy + pad.top,
                        width: data.width,
                        height: data.height,
                        rotation: data.originalRotation,
                        file: data.file
                    });

                    cx += img.width + padding;
                    rowH = Math.max(rowH, img.height);
                }

                if (autoSize && !allFit) {
                    currentPackW = Math.ceil(currentPackW * 1.2);
                    currentPackH = Math.ceil(currentPackH * 1.2);
                    if (currentPackW > 16384) break;
                    continue;
                }

                packed = localPacked;
                success = true;

            } else {
                // V/H Strips
                // ... (Previous logic, updated for rotation/padding loop)
                // AutoSize for V/H means infinite usually?
                // Or we calculated square?
                // V/H ignores square heuristic usually, acts as infinite strip.
                // But we have currentPackW.
                // Let's just use infinite for AutoSize V/H.

                const isVertical = layout === 'vertical';
                let offset = 0;

                inputs.forEach(img => {
                    const data = (img.data as any);
                    const pad = data.padding;

                    // Simply stack
                    // X/Y
                    let px = 0;
                    let py = 0;

                    if (isVertical) {
                        py = offset;
                    } else {
                        px = offset;
                    }

                    packed.push({
                        id: data.id,
                        x: px + pad.left,
                        y: py + pad.top,
                        width: data.width,
                        height: data.height,
                        rotation: data.originalRotation,
                        file: data.file
                    });

                    if (isVertical) offset += img.height + padding;
                    else offset += img.width + padding;
                });

                success = true;
            }
        }

        // Final Sizing for AutoSize
        // Even if we used a heuristic, the ACTUAL content might be smaller.
        // We should crop to bounding box.
        if (autoSize) {
            let maxX = 0;
            let maxY = 0;
            packed.forEach(p => {
                // p.x, p.y is actual image pos.
                // We need the BOUNDS (including padding).
                // But wait, the packer already respected padding.
                // The item `p` width/height is the IMAGE size.
                // We need to add the right/bottom padding to get full extent?
                // The logical box was x - pad.left, w = imgW + L + R.
                // So Right Edge = x - pad.left + imgW + L + R = x + imgW + R.
                // Wait, this metadata is lost in `Rect[]`.
                // We need to re-find the padding?
                // Or just use the inputs map?
                // `packed` items have `id`.

                const original = inputs.find(i => (i as any).data.id === p.id);
                if (original) {
                    const pad = (original.data as any).padding;
                    const right = p.x + p.width + pad.right;
                    const bottom = p.y + p.height + pad.bottom;
                    maxX = Math.max(maxX, right);
                    maxY = Math.max(maxY, bottom);
                }
            });
            currentPackW = maxX;
            currentPackH = maxY;
        }
    }

    // Auto-Size Calculation: Find bounding box of packed items
    let finalWidth = width;
    let finalHeight = height;

    if (autoSize && packed.length > 0) {
        const maxX = packed.reduce((max, r) => Math.max(max, r.x + ((r.rotation === 90 || r.rotation === 270) ? r.height : r.width)), 0);
        const maxY = packed.reduce((max, r) => Math.max(max, r.y + ((r.rotation === 90 || r.rotation === 270) ? r.width : r.height)), 0);

        // Add a small buffer or user padding? Global padding?
        // Let's set dimensions to Next POT or just ceil?
        // User requested "auto dimension". Just tight fit + global padding?
        finalWidth = Math.max(1, Math.ceil(maxX));
        finalHeight = Math.max(1, Math.ceil(maxY));
    }

    return {
        id: req.id,
        success: true,
        packed: packed,
        unpacked: unpacked,
        width: finalWidth,
        height: finalHeight,
    };
}
