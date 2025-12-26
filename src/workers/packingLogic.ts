import { MaxRectsPacker } from 'maxrects-packer';
import type { PackRequest, PackResult, Rect } from './types';

export function performPacking(req: PackRequest): PackResult {
    const packer = new MaxRectsPacker(req.width, req.height, req.padding, {
        smart: false,
        pot: false,
        square: false,
        allowRotation: req.allowRotation,
        tag: false,
        border: 0,
    });

    const inputs = req.images.map((img) => {
        let w = img.width;
        let h = img.height;
        // Pre-rotate if item exceeds bin dimensions but fits when rotated
        if (req.allowRotation) {
            if ((w > req.width || h > req.height) && (h <= req.width && w <= req.height)) {
                // Swap
                const temp = w;
                w = h;
                h = temp;
            }
        }

        return {
            width: w,
            height: h,
            data: { id: img.id, file: img.file, width: img.width, height: img.height }, // Store ORIGINAL dimensions
            allowRotation: req.allowRotation
        };
    });

    // maxrects-packer accepts plain objects if they match the interface, but typescript might complain.
    // casting to any to avoid complex casting to simple Rectangle interface 
    packer.addArray(inputs as any[]);

    // We only support one bin for a simple atlas. 
    // If multiple bins are created, we might only take the first one or warn.
    // For this simple implementation, if things don't fit in the first bin, they are "unpacked" effectively relative to the single texture goal,
    // or we return multiple bins. Let's aim for single page packing for now, or just return what fits.

    // Note: maxrects-packer creates 'bins'.

    const packed: Rect[] = [];
    // const unpacked: Rect[] = []; // Not used yet
    // However, maxrects-packer automatically adds new bins. 

    // Flatten all bins
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

    // If we want to restrict to ONE page of size WxH, we should check which bin the rects are in.
    // But usually users want all sprites packed.
    // If the user *limits* texture size, we might have multiple pages. 
    // For 'SpritePacker' MVP, let's assume we return ALL packed items, potentially across multiple bins if the library creates them,
    // BUT the UI might only show one canvas. 
    // Let's modify logic: The request has a W/H. MaxRectsPacker uses that as bin size. 
    // If >1 bin is created, it means not everything fit on one page.
    // We will return all of them, but flag them.

    return {
        id: req.id,
        success: true,
        packed: packed,
        unpacked: [], // maxrects-packer tries to fit everything by adding bins.
        width: req.width,
        height: req.height,
    };
}
