import { MaxRectsPacker } from 'maxrects-packer';
import type { PackRequest, PackResult, Rect } from './types';

export function performPacking(req: PackRequest): PackResult {
    const { layout, width, height, padding, allowRotation } = req;
    const packed: Rect[] = [];
    const unpacked: Rect[] = [];

    if (layout === 'vertical') {
        let currentY = 0;
        let maxWidth = 0;

        req.images.forEach(img => {
            // Check if it fits in height (simple check)
            if (currentY + img.height > height) {
                unpacked.push({
                    id: img.id, x: 0, y: 0, width: img.width, height: img.height, rotated: false, file: img.file
                });
                return;
            }

            packed.push({
                id: img.id,
                x: 0,
                y: currentY,
                width: img.width,
                height: img.height,
                rotated: false,
                file: img.file
            });

            currentY += img.height + padding;
            maxWidth = Math.max(maxWidth, img.width);
        });

        // Auto-adjust container width? No, keep requested width/height for now or return actual usage?
        // The return type has width/height. We'll return requested.

    } else if (layout === 'horizontal') {
        let currentX = 0;
        let maxHeight = 0;

        req.images.forEach(img => {
            if (currentX + img.width > width) {
                unpacked.push({
                    id: img.id, x: 0, y: 0, width: img.width, height: img.height, rotated: false, file: img.file
                });
                return;
            }

            packed.push({
                id: img.id,
                x: currentX,
                y: 0,
                width: img.width,
                height: img.height,
                rotated: false,
                file: img.file
            });

            currentX += img.width + padding;
            maxHeight = Math.max(maxHeight, img.height);
        });

    } else {
        // MaxRects (Default)
        const packer = new MaxRectsPacker(width, height, padding, {
            smart: false,
            pot: false,
            square: false,
            allowRotation: allowRotation,
            tag: false,
            border: 0,
        });

        const inputs = req.images.map((img) => {
            let w = img.width;
            let h = img.height;
            const canRotate = allowRotation && (img.rotatable !== false);

            // Pre-rotate logic only if allowed
            if (canRotate) {
                if ((w > width || h > height) && (h <= width && w <= height)) {
                    const temp = w;
                    w = h;
                    h = temp;
                }
            }

            return {
                width: w,
                height: h,
                data: { id: img.id, file: img.file, width: img.width, height: img.height },
                allowRotation: canRotate
            };
        });

        packer.addArray(inputs as any[]);

        packer.bins.forEach((bin) => {
            bin.rects.forEach((r) => {
                const originalWidth = (r.data as any).width;
                const isRotated = !!r.rot || (r.width !== originalWidth);

                packed.push({
                    id: (r.data as any).id,
                    x: r.x,
                    y: r.y,
                    width: r.width,
                    height: r.height,
                    rotated: isRotated,
                    file: (r.data as any).file,
                });
            });
        });
        // MaxRects doesn't easily expose unpacked items from the initial add call unless we check logic, 
        // but it adds bins. We assume single bin for now or take all.
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
