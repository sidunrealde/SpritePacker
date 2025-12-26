import { MaxRectsPacker } from 'maxrects-packer';
import type { PackRequest, PackResult, Rect } from './types';

export function performPacking(req: PackRequest): PackResult {
    const { layout, width, height, padding, allowRotation, scaleToFit, autoSize } = req;
    const packed: Rect[] = [];
    const unpacked: Rect[] = [];

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
        // We can simulate per-image padding by increasing width/height and then offsetting result.
        // However, MaxRectsPacker doesn't support per-item padding natively in the same way.
        // We will add (img.padding * 2) to width/height.
        // And when unpacking, we adjust x,y by +img.padding.


        const inputs = req.images.map(img => {
            const pad = img.padding || { top: 0, bottom: 0, left: 0, right: 0 };
            const pW = pad.left + pad.right;
            const pH = pad.top + pad.bottom;

            const w = Math.ceil(img.width * scalingFactor) + pW;
            const h = Math.ceil(img.height * scalingFactor) + pH;
            const canRotate = allowRotation && (img.rotatable !== false);

            let finalW = w;
            let finalH = h;

            // For MaxRects, we might rotate.
            if (canRotate && layout === 'maxrects') {
                if ((w > packWidth || h > packHeight) && (h <= packWidth && w <= packHeight)) {
                    finalW = h;
                    finalH = w;
                }
            }

            return {
                width: finalW,
                height: finalH,
                data: { id: img.id, file: img.file, width: img.width, height: img.height, padding: pad },
                allowRotation: canRotate && layout === 'maxrects'
            };
        });

        if (layout === 'maxrects') {
            const packer = new MaxRectsPacker(packWidth, packHeight, padding, {
                smart: false, // Smart disabled to try and respect order more, but MaxRects inherently bins by size/fit.
                pot: false,
                square: false,
                allowRotation: allowRotation,
                tag: false,
                border: 0,
            });

            packer.addArray(inputs as any[]);

            if (!autoSize && scaleToFit && packer.bins.length > 1) {
                scalingFactor *= 0.9;
                continue;
            }

            // Extract results
            packer.bins.forEach((bin, binIndex) => {
                bin.rects.forEach((r) => {
                    const isRotated = (r as any).rot === true;
                    // Adjust for padding
                    const pad = (r.data as any).padding || { top: 0, bottom: 0, left: 0, right: 0 };

                    // r.x, r.y is the top-left of the PADDED box.
                    // Image starts at x + pad.left, y + pad.top
                    let finalX = r.x + pad.left;
                    let finalY = r.y + pad.top;

                    // If rotated, the box is rotated. 
                    // The "visual" box in atlas is r.width x r.height.
                    // But r.width (packed) might be Height + paddingH?
                    // MaxRectsPacker rotates the DIMENSIONS. 
                    // If rotated: r.width = originalH + pH, r.height = originalW + pW.
                    // We need to be careful with coordinate mapping.
                    // Visual Rect on Atlas:
                    // x, y. 
                    // Content is drawn inside.

                    let finalW, finalH;
                    if (isRotated) {
                        // If rotated, the 'width' stored in r is the height of original.
                        // Img W = r.height - pW
                        // Img H = r.width - pH

                        // Actually:
                        // r.width (packed bounds width) corresponds to Image Height + Padding Top+Bottom ?
                        // Wait, if we provided w = W+L+R, h = H+T+B.
                        // And it rotated.
                        // Now "Width" = h. "Height" = w.
                        // So packed Width = H + T + B.
                        // packed Height = W + L + R.

                        // We offset by Left/Top relative to the *unrotated* frame? 
                        // No, relative to the packed frame.
                        // The internal content is rotated -90deg.
                        // This gets complicated. 
                        // Let's assume MaxRects rotation is handling the "Box".
                        // We draw into the box.

                        // IMPORTANT: For simplicity, we might want to disable rotation if per-side padding is uneven.
                        // But let's assume padding rotates with the image?
                        // If I have 50px left padding, and I rotate, does it become 50px bottom padding?
                        // Or 50px Top?
                        // Usually padding is attached to the image side.
                        // So if Left=50, and I rotate -90, Left side becomes Bottom side.
                        // So Bottom=50 in atlas space.

                        finalW = r.height - (pad.left + pad.right);
                        finalH = r.width - (pad.top + pad.bottom);

                        // Re-calculated positions would depend on rotation.
                        // But let's just use the rects and let renderer handle rotation 
                        // assuming renderer rotates AROUND CENTER or similar.
                        // Renderer logic: translate center, rotate, draw -W/2..

                        // If we pass the visual bounds of the *Image Content* to renderer?
                        // The renderer expects x, y, width, height of the DESTINATION ON SHEET.
                        // If rotated, w/h are swapped. 
                        // But x,y should be the top-left of the image content.

                        // If rotated:
                        // packed rect x,y.
                        // Padding rotates: Left padding becomes Bottom. Top becomes Left.
                        // (Rotate -90: T->L, R->T, B->R, L->B).
                        // So offset x += Top (new Left). y += Right (new Top)? No.
                        // Let's just pass the Padding info to the renderer? 
                        // No, store is Rect[].

                        // Let's Simplify:
                        // Just return the inner logic. 
                        // If rotated, p.top becomes p.left.
                        // x += pad.top. y += pad.right.
                        // This seems correct for -90deg rotation (Clockwise? No standard is usually CW or CCW).
                        // Canvas rotate in PreviewCanvas used -90... so CCW?
                        // ctx.rotate(-90 * Math.PI / 180);

                        // If we rotate -90 (CCW):
                        // Top -> Left. Right -> Top. Bottom -> Right. Left -> Bottom.

                        finalX = r.x + pad.top;
                        finalY = r.y + pad.right;
                    } else {
                        finalW = r.width - (pad.left + pad.right);
                        finalH = r.height - (pad.top + pad.bottom);
                    }

                    if (binIndex === 0) {
                        packed.push({
                            id: (r.data as any).id,
                            x: finalX,
                            y: finalY,
                            width: finalW,
                            height: finalH,
                            rotated: isRotated,
                            file: (r.data as any).file,
                        });
                    } else {
                        unpacked.push({
                            id: (r.data as any).id,
                            x: 0, y: 0, width: finalW, height: finalH, rotated: isRotated, file: (r.data as any).file
                        });
                    }
                });
            });
            break;

        } else if (layout === 'grid') {
            // New Grid Layout (Row-Major)
            let currentX = 0;
            let currentY = 0;
            let rowHeight = 0;
            let fits = true;

            const limitW = autoSize ? 999999 : width;
            const limitH = autoSize ? 999999 : height;

            for (const img of inputs) { // Preserve inputs order
                const w = img.width;
                const h = img.height;
                const data = (img.data as any);
                const pad = data.padding;

                if (currentX + w > limitW) {
                    // Next row
                    currentX = 0;
                    currentY += rowHeight + padding;
                    rowHeight = 0;
                }

                // Watch out for huge items
                if (w > limitW) {
                    // Should fit if autoSize, otherwise unpack
                    if (!autoSize) {
                        unpacked.push({ id: data.id, x: 0, y: 0, width: data.width, height: data.height, rotated: false, file: data.file });
                        fits = false;
                        continue;
                    }
                }

                if (currentY + h > limitH) {
                    if (!autoSize) {
                        unpacked.push({ id: data.id, x: 0, y: 0, width: data.width, height: data.height, rotated: false, file: data.file });
                        fits = false;
                        continue;
                    }
                }

                // Place it
                // Adjust for padding inside the "box" we just allocated?
                // Wait, w/h ALREADY includes padding (from inputs map).
                // So we place the box at currentX, currentY.
                // The image content is at currentX + pad.left, currentY + pad.top.

                packed.push({
                    id: data.id,
                    x: currentX + pad.left,
                    y: currentY + pad.top,
                    width: data.width, // Original Image W
                    height: data.height, // Original Image H
                    rotated: false,
                    file: data.file
                });

                rowHeight = Math.max(rowHeight, h);
                currentX += w + padding; // Global padding
            }

            if (!autoSize && scaleToFit && !fits) {
                scalingFactor *= 0.9;
                continue;
            }
            break;

        } else {
            // Horizontal / Vertical
            let currentOffset = 0;
            let fits = true;
            const isVertical = layout === 'vertical';

            // ... (Use updated inputs with padding logic)
            // Need to iterate inputs, not req.images, because inputs has calculated Size+Padding
            for (const img of inputs) {
                const w = img.width;
                const h = img.height;
                const data = (img.data as any);
                const pad = data.padding;

                // For V/H, we also respect autoSize (infinite bounds)
                const limitW = autoSize ? 999999 : width;
                const limitH = autoSize ? 999999 : height;

                if (isVertical) {
                    if (currentOffset + h > limitH || w > limitW) {
                        unpacked.push({ id: data.id, x: 0, y: 0, width: data.width, height: data.height, rotated: false, file: data.file });
                        fits = false;
                    } else {
                        packed.push({
                            id: data.id,
                            x: 0 + pad.left,
                            y: currentOffset + pad.top,
                            width: data.width,
                            height: data.height,
                            rotated: false, file: data.file
                        });
                        currentOffset += h + padding;
                    }
                } else { // Horizontal
                    if (currentOffset + w > limitW || h > limitH) {
                        unpacked.push({ id: data.id, x: 0, y: 0, width: data.width, height: data.height, rotated: false, file: data.file });
                        fits = false;
                    } else {
                        packed.push({
                            id: data.id,
                            x: currentOffset + pad.left,
                            y: 0 + pad.top,
                            width: data.width,
                            height: data.height,
                            rotated: false, file: data.file
                        });
                        currentOffset += w + padding;
                    }
                }
            }

            if (!autoSize && scaleToFit && !fits) {
                scalingFactor *= 0.9;
                continue;
            }
            break;
        }
    }

    // Auto-Size Calculation: Find bounding box of packed items
    let finalWidth = width;
    let finalHeight = height;

    if (autoSize && packed.length > 0) {
        const maxX = packed.reduce((max, r) => Math.max(max, r.x + (r.rotated ? r.height : r.width)), 0);
        const maxY = packed.reduce((max, r) => Math.max(max, r.y + (r.rotated ? r.width : r.height)), 0);

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
