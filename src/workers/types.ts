// src/workers/types.ts

export interface Rect {
    id: string;
    width: number;
    height: number;
    x: number;
    y: number;
    rotated: boolean;
    file?: File; // Keep reference to original file if needed
    imageBitmap?: ImageBitmap; // For drawing
}

export interface PackRequest {
    id: string;
    images: { id: string; width: number; height: number; file: File }[];
    width: number;
    height: number;
    padding: number;
    allowRotation: boolean;
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
