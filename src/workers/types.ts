// src/workers/types.ts

export interface Padding {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface Rect {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number; // 0, 90, 180, 270
    file: File;
}

export interface PackRequest {
    id: string;
    images: { id: string; width: number; height: number; file: File; rotation: number; padding?: Padding }[];
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
