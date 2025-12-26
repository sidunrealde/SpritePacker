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
            const p = img.padding || 0;
            const w = Math.ceil(img.width * scalingFactor) + (p * 2);
            const h = Math.ceil(img.height * scalingFactor) + (p * 2);
            const canRotate = allowRotation && (img.rotatable !== false);

            let finalW = w;
            let finalH = h;

            if (canRotate) {
                if ((w > packWidth || h > packHeight) && (h <= packWidth && w <= packHeight)) {
                    finalW = h;
                    finalH = w;
                }
            }

            return {
                width: finalW,
                height: finalH,
                data: { id: img.id, file: img.file, width: img.width, height: img.height, padding: p },
                allowRotation: canRotate
            };
        });

        if (layout === 'maxrects') {
            const packer = new MaxRectsPacker(packWidth, packHeight, padding, {
                smart: true, // Enable smart for better packing? User reported order issues. 
                // Smart usually tries to compact. 
                // If user wants order, we should disable smart? Default was false.
                // Let's keep false as per previous file state, or try to respect order better.
                pot: false,
                square: false,
                allowRotation: allowRotation,
                tag: false,
                border: 0,
            });

            packer.addArray(inputs as any[]);

            // Check if we need to scale down (Only if NOT autoSize)
            if (!autoSize && scaleToFit && packer.bins.length > 1) {
                scalingFactor *= 0.9;
                continue;
            }

            // Extract results
            packer.bins.forEach((bin, binIndex) => {
                bin.rects.forEach((r) => {
                    const isRotated = (r as any).rot === true;
                    // Adjust for padding
                    const p = (r.data as any).padding || 0;

                    // The 'r' rect includes padding.
                    // Image should be drawn at r.x + p, r.y + p with size r.width - 2p etc?
                    // if rotated: r.width is height+2p. 
                    // We need to be careful.
                    // Visual X, Y on atlas = r.x + p.
                    // Visual Width = originalScaledWidth.

                    let finalX = r.x + p;
                    let finalY = r.y + p;

                    // Note: returned width/height should be the IMAGE size (scaled), not including padding?
                    // Or the occupied area? The preview draws the rect.
                    // Usually pack result returns the "Frame" valid for the sprite.
                    // If we added padding, the "sprite" is effectively larger? 
                    // User asked for padding. Usually that means transparency around sprite.
                    // We will return the inner rect for the image logic.
                    // But wait, collision?
                    // If we return x+p, y+p, width=w, height=h.
                    // The render loop draws image at x,y w,h. 
                    // That leaves space around it. Correct.

                    // Recover scaled dimensions
                    // We don't have exact scaled W/H easily unless we calc again or store it.
                    // r.width includes padding.
                    // rotated?
                    let finalW, finalH;
                    if (isRotated) {
                        // r.width = H + 2p
                        // r.height = W + 2p
                        finalW = r.height - (p * 2);
                        finalH = r.width - (p * 2);
                    } else {
                        finalW = r.width - (p * 2);
                        finalH = r.height - (p * 2);
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

        } else {
            // Horizontal / Vertical
            let currentOffset = 0;
            let fits = true;
            const isVertical = layout === 'vertical';

            req.images.forEach(img => {
                const p = img.padding || 0;
                const w = Math.ceil(img.width * scalingFactor) + (p * 2);
                const h = Math.ceil(img.height * scalingFactor) + (p * 2);

                // For V/H, we also respect autoSize (infinite bounds)
                const limitW = autoSize ? 999999 : width;
                const limitH = autoSize ? 999999 : height;

                if (isVertical) {
                    if (currentOffset + h > limitH || w > limitW) {
                        unpacked.push({
                            id: img.id, x: 0, y: 0,
                            width: w - p * 2, height: h - p * 2,
                            rotated: false, file: img.file
                        });
                        fits = false;
                    } else {
                        packed.push({
                            id: img.id,
                            x: 0 + p,
                            y: currentOffset + p,
                            width: w - p * 2,
                            height: h - p * 2,
                            rotated: false, file: img.file
                        });
                        currentOffset += h + padding; // Global padding between items
                    }
                } else {
                    if (currentOffset + w > limitW || h > limitH) {
                        unpacked.push({
                            id: img.id, x: 0, y: 0,
                            width: w - p * 2, height: h - p * 2,
                            rotated: false, file: img.file
                        });
                        fits = false;
                    } else {
                        packed.push({
                            id: img.id,
                            x: currentOffset + p,
                            y: 0 + p,
                            width: w - p * 2,
                            height: h - p * 2,
                            rotated: false, file: img.file
                        });
                        currentOffset += w + padding;
                    }
                }
            });

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
