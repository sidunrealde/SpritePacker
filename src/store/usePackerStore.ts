// src/store/usePackerStore.ts
import { create } from 'zustand';
import type { Rect } from '../workers/types';

export interface ImageItem {
    id: string;
    file: File;
    width: number;
    height: number;
    url: string; // Object URL for preview
    rotatable: boolean; // Individual override
}

interface PackingSettings {
    width: number;
    height: number;
    padding: number;
    allowRotation: boolean;
    layout: 'maxrects' | 'vertical' | 'horizontal';
    scaleToFit: boolean;
}

interface PackerState {
    images: ImageItem[];
    settings: PackingSettings;
    packedItems: Rect[];
    status: 'idle' | 'packing' | 'success' | 'error';
    errorMessage?: string;
    atlasUrl?: string; // Resulting packed texture URL (Preview)
    atlasBlob?: Blob; // Actual Blob for download

    addImage: (file: File) => Promise<void>;
    removeImage: (id: string) => void;
    clearImages: () => void;
    reorderImages: (newOrder: ImageItem[]) => void;
    toggleImageRotation: (id: string) => void;
    updateSettings: (newSettings: Partial<PackingSettings>) => void;
    setPackingStatus: (status: PackerState['status'], error?: string) => void;
    setPackedResults: (items: Rect[], atlasUrl?: string) => void;
    setAtlasBlob: (blob: Blob) => void;
}

export const usePackerStore = create<PackerState>((set) => ({
    images: [],
    settings: {
        width: 2048,
        height: 2048,
        padding: 2,
        allowRotation: false,
        layout: 'maxrects',
        scaleToFit: false,
    },
    packedItems: [],
    status: 'idle',

    addImage: async (file: File) => {
        // Determine dimensions
        const bitmap = await createImageBitmap(file);
        const id = crypto.randomUUID();
        const item: ImageItem = {
            id,
            file,
            width: bitmap.width,
            height: bitmap.height,
            url: URL.createObjectURL(file), // Only for preview in list
            rotatable: true, // Default to true, but global setting overrides if false? 
            // Logic: If global allowRotation is TRUE, this flag controls specific items. 
            // If global is FALSE, no rotation happens at all.
        };

        set((state) => ({ images: [...state.images, item] }));
    },

    removeImage: (id: string) => {
        set((state) => ({
            images: state.images.filter((img) => img.id !== id),
        }));
    },

    reorderImages: (newOrder) => {
        set({ images: newOrder });
    },

    clearImages: () => {
        set({ images: [], packedItems: [], atlasUrl: undefined, atlasBlob: undefined, status: 'idle' });
    },

    toggleImageRotation: (id: string) => {
        set((state) => ({
            images: state.images.map(img =>
                img.id === id ? { ...img, rotatable: !img.rotatable } : img
            )
        }));
    },

    updateSettings: (newSettings) => {
        set((state) => ({
            settings: { ...state.settings, ...newSettings },
        }));
    },

    setPackingStatus: (status, error) => {
        set({ status, errorMessage: error });
    },

    setPackedResults: (items, atlasUrl) => {
        set({ packedItems: items, atlasUrl, status: 'success' });
    },

    setAtlasBlob: (blob) => {
        set({ atlasBlob: blob });
    },
}));
