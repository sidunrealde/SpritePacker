// src/workers/types.ts

export interface Padding {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface Rect {
    id: string;
    width: number;
    height: number;
    x: number;
    y: number;
    rotated: boolean;
    padding?: Padding;
    file?: File; // Keep reference to original file if needed
    imageBitmap?: ImageBitmap; // For drawing
}

export interface PackRequest {
    id: string;
    images: { id: string; width: number; height: number; file: File; rotatable?: boolean; padding?: Padding }[];
    width: number;
    height: number;
    padding: number;
    allowRotation: boolean;
    layout: 'maxrects' | 'vertical' | 'horizontal' | 'grid';
    scaleToFit?: boolean;
    autoSize?: boolean;
}

export interface PackResult {
    id: string; // matches Request ID
    success: boolean;
    packed: Rect[]; // Packed rectangles with positions
    unpacked: Rect[]; // Rectangles that didn't fit
    width: number;
    height: number;
    error?: string;
}
