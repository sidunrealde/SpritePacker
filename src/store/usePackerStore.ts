import { create } from 'zustand';
import type { Rect } from '../workers/types';

export interface Padding {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface ImageItem {
    id: string;
    file: File;
    url: string;
    width: number;
    height: number;
    rotatable: boolean;
    padding?: Padding;
}

export interface PackingSettings {
    width: number;
    height: number;
    padding: number;
    allowRotation: boolean;
    layout: 'maxrects' | 'vertical' | 'horizontal' | 'grid';
    scaleToFit: boolean;
    autoSize: boolean;
}

interface PackerState {
    images: ImageItem[];
    settings: PackingSettings;
    status: 'idle' | 'packing' | 'success' | 'error';
    packedItems: Rect[];
    unpackedItems: Rect[];
    atlasBlob: Blob | null;
    atlasWidth: number;
    atlasHeight: number;

    addImage: (file: File) => void;
    removeImage: (id: string) => void;
    updateSettings: (newSettings: Partial<PackingSettings>) => void;
    setPackedByWorker: (packed: Rect[], unpacked: Rect[], width: number, height: number) => void;
    setStatus: (status: 'idle' | 'packing' | 'success' | 'error') => void;
    setAtlasBlob: (blob: Blob | null) => void;
    clearImages: () => void;
    toggleImageRotation: (id: string) => void;
    updateImage: (id: string, updates: Partial<ImageItem>) => void;
    reorderImages: (newImages: ImageItem[]) => void;
}

const initialSettings: PackingSettings = {
    width: 2048,
    height: 2048,
    padding: 2,
    allowRotation: false,
    layout: 'maxrects',
    scaleToFit: false,
    autoSize: false,
};

export const usePackerStore = create<PackerState>((set) => ({
    images: [],
    settings: initialSettings,
    status: 'idle',
    packedItems: [],
    unpackedItems: [],
    atlasBlob: null,
    atlasWidth: 2048,
    atlasHeight: 2048,

    addImage: (file) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            set((state) => ({
                images: [...state.images, {
                    id: crypto.randomUUID(),
                    file,
                    url,
                    width: img.width,
                    height: img.height,
                    rotatable: state.settings.allowRotation,
                    padding: { top: 0, bottom: 0, left: 0, right: 0 }
                }],
            }));
        };
        img.src = url;
    },

    removeImage: (id) => set((state) => {
        const img = state.images.find(i => i.id === id);
        if (img) URL.revokeObjectURL(img.url);
        return { images: state.images.filter((i) => i.id !== id) };
    }),

    updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
    })),

    setPackedByWorker: (packed, unpacked, width, height) => set({
        packedItems: packed,
        unpackedItems: unpacked,
        status: 'success',
        atlasWidth: width,
        atlasHeight: height
    }),

    setStatus: (status) => set({ status }),

    setAtlasBlob: (blob) => set({ atlasBlob: blob }),

    clearImages: () => set((state) => {
        state.images.forEach(img => URL.revokeObjectURL(img.url));
        return { images: [], packedItems: [], unpackedItems: [], atlasBlob: null, status: 'idle' };
    }),

    toggleImageRotation: (id) => set((state) => ({
        images: state.images.map(img =>
            img.id === id ? { ...img, rotatable: !img.rotatable } : img
        )
    })),

    updateImage: (id, updates) => set((state) => ({
        images: state.images.map(img => img.id === id ? { ...img, ...updates } : img)
    })),

    reorderImages: (newImages) => set({ images: newImages }),
}));
