// src/store/usePackerStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePackerStore } from './usePackerStore';

describe('usePackerStore', () => {
    beforeEach(() => {
        usePackerStore.setState({
            images: [],
            settings: { width: 1024, height: 1024, padding: 0, allowRotation: false },
            status: 'idle',
            packedItems: [],
        });

        // Mock browser APIs
        globalThis.URL.createObjectURL = vi.fn(() => 'blob:test');
        globalThis.createImageBitmap = vi.fn(() => Promise.resolve({ width: 100, height: 100 } as ImageBitmap));
        globalThis.crypto.randomUUID = vi.fn(() => 'test-id' as any);
    });

    it('should add an image', async () => {
        const file = new File([''], 'test.png', { type: 'image/png' });
        await usePackerStore.getState().addImage(file);

        const images = usePackerStore.getState().images;
        expect(images.length).toBe(1);
        expect(images[0].id).toBe('test-id');
        expect(images[0].width).toBe(100);
    });

    it('should update settings', () => {
        usePackerStore.getState().updateSettings({ width: 512, allowRotation: true });
        const settings = usePackerStore.getState().settings;
        expect(settings.width).toBe(512);
        expect(settings.height).toBe(1024); // Kept original
        expect(settings.allowRotation).toBe(true);
    });
});
