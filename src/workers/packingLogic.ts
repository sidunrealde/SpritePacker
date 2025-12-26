import { MaxRectsPacker } from 'maxrects-packer';
import type { PackRequest, PackResult, Rect } from './types';

export function performPacking(req: PackRequest): PackResult {
    const { layout, width, height, padding, allowRotation, scaleToFit } = req;
    const packed: Rect[] = [];
    const unpacked: Rect[] = [];

    let scalingFactor = 1.0;
    const maxIterations = 10;

    // Iterative packing loop for Scale To Fit
    for (let i = 0; i < maxIterations; i++) {
        packed.length = 0;
        unpacked.length = 0;

        if (layout === 'maxrects') {
            const packer = new MaxRectsPacker(width, height, padding, {
                smart: false,
                pot: false,
                square: false,
                allowRotation: allowRotation,
                tag: false,
                border: 0,
            });

            const inputs = req.images.map(img => {
                const w = Math.ceil(img.width * scalingFactor);
                const h = Math.ceil(img.height * scalingFactor);
                const canRotate = allowRotation && (img.rotatable !== false);

                let finalW = w;
                let finalH = h;

                // Pre-rotate check
                if (canRotate) {
                    if ((w > width || h > height) && (h <= width && w <= height)) {
                        finalW = h;
                        finalH = w;
                    }
                }

                return {
                    width: finalW,
                    height: finalH,
                    data: { id: img.id, file: img.file, width: img.width, height: img.height },
                    allowRotation: canRotate
                };
            });

            packer.addArray(inputs as any[]);

            // Check if we need to scale down
            if (scaleToFit && packer.bins.length > 1) {
                scalingFactor *= 0.9;
                continue; // Retry with smaller scale
            }

            // Extract results
            packer.bins.forEach((bin, binIndex) => {
                bin.rects.forEach((r) => {
                    const isRotated = (r as any).rot === true;

                    if (binIndex === 0) {
                        packed.push({
                            id: (r.data as any).id,
                            x: r.x,
                            y: r.y,
                            width: r.width,
                            height: r.height,
                            rotated: isRotated,
                            file: (r.data as any).file,
                        });
                    } else {
                        // Return unpacked for secondary bins if we stopped scaling or disabled it
                        unpacked.push({
                            id: (r.data as any).id,
                            x: 0,
                            y: 0,
                            width: r.width,
                            height: r.height,
                            rotated: isRotated,
                            file: (r.data as any).file,
                        });
                    }
                });
            });
            break;

        } else {
            // Horizontal / Vertical Layouts
            let currentOffset = 0;
            let fits = true;
            const isVertical = layout === 'vertical';

            req.images.forEach(img => {
                const w = Math.ceil(img.width * scalingFactor);
                const h = Math.ceil(img.height * scalingFactor);

                if (isVertical) {
                    if (currentOffset + h > height || w > width) {
                        unpacked.push({ id: img.id, x: 0, y: 0, width: w, height: h, rotated: false, file: img.file });
                        fits = false;
                    } else {
                        packed.push({ id: img.id, x: 0, y: currentOffset, width: w, height: h, rotated: false, file: img.file });
                        currentOffset += h + padding;
                    }
                } else {
                    if (currentOffset + w > width || h > height) {
                        unpacked.push({ id: img.id, x: 0, y: 0, width: w, height: h, rotated: false, file: img.file });
                        fits = false;
                    } else {
                        packed.push({ id: img.id, x: currentOffset, y: 0, width: w, height: h, rotated: false, file: img.file });
                        currentOffset += w + padding;
                    }
                }
            });

            if (scaleToFit && !fits) {
                scalingFactor *= 0.9;
                continue;
            }
            break;
        }
    }

    return {
        id: req.id,
        success: true,
        packed: packed,
        unpacked: unpacked,
        width: req.width,
        height: req.height,
    };
}
