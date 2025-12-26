// src/store/usePackerStore.ts
import { create } from 'zustand';
import { Rect } from '../workers/types';

export interface ImageItem {
    id: string;
    file: File;
    width: number;
    height: number;
    url: string; // Object URL for preview
}

interface PackingSettings {
    width: number;
    height: number;
    padding: number;
    allowRotation: boolean;
}

interface PackerState {
    images: ImageItem[];
    settings: PackingSettings;
    packedItems: Rect[];
    status: 'idle' | 'packing' | 'success' | 'error';
    errorMessage?: string;
    atlasUrl?: string; // Resulting packed texture URL

    addImage: (file: File) => Promise<void>;
    removeImage: (id: string) => void;
    updateSettings: (newSettings: Partial<PackingSettings>) => void;
    setPackingStatus: (status: PackerState['status'], error?: string) => void;
    setPackedResults: (items: Rect[], atlasUrl?: string) => void;
}

export const usePackerStore = create<PackerState>((set, get) => ({
    images: [],
    settings: {
        width: 2048,
        height: 2048,
        padding: 2,
        allowRotation: false,
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
        };

        set((state) => ({ images: [...state.images, item] }));
    },

    removeImage: (id: string) => {
        set((state) => ({
            images: state.images.filter((img) => img.id !== id),
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
}));
