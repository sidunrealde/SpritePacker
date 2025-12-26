// src/workers/packingLogic.test.ts
import { describe, it, expect } from 'vitest';
import { performPacking } from './packingLogic';
import type { PackRequest } from './types';

describe('packingLogic', () => {
    it('should pack simple rects into a bin', () => {
        const req: PackRequest = {
            id: 'test-1',
            width: 100,
            height: 100,
            padding: 0,
            allowRotation: false, // simpler to test
            layout: 'maxrects',
            images: [
                { id: '1', width: 50, height: 50, file: {} as File, rotation: 0 },
                { id: '2', width: 50, height: 50, file: {} as File, rotation: 0 },
            ],
        };

        const result = performPacking(req);
        expect(result.success).toBe(true);
        expect(result.packed.length).toBe(2);

        // Check for overlap (naive check)
        const r1 = result.packed.find(p => p.id === '1');
        const r2 = result.packed.find(p => p.id === '2');

        expect(r1).toBeDefined();
        expect(r2).toBeDefined();

        if (r1 && r2) {
            // They should not be at same position if they take up space
            expect(r1.x !== r2.x || r1.y !== r2.y).toBe(true);
            // Since 50x50 fits 4 times in 100x100, they should both fit
            expect(r1.x).toBeGreaterThanOrEqual(0);
            expect(r1.y).toBeGreaterThanOrEqual(0);
        }
    });

    it('should pack if dimensions match (sanity check)', () => {
        // 100x60 bin. Item is 90x60. Fits without rotation.
        const req: PackRequest = {
            id: 'test-nrot',
            width: 100,
            height: 60,
            padding: 0,
            allowRotation: true,
            layout: 'maxrects',
            images: [
                { id: '1', width: 90, height: 60, file: {} as File, rotation: 0 },
            ],
        };

        const result = performPacking(req);
        expect(result.packed.length).toBe(1);
        expect(result.packed[0].rotated).toBe(false);
    });

    it('should rotate to fit', () => {
        // 60x100 bin. Item is 90x60. Must rotate to 60x90 to fit (width 90 > 60).
        // Since we removed 'allowRotation' logic from Logic, and expect manual rotation:
        // If we pass 90deg, it should swap.

        const req: PackRequest = {
            id: 'test-rot-2',
            width: 60,
            height: 100,
            padding: 0,
            allowRotation: true, // Ignored now
            layout: 'maxrects',
            images: [
                { id: '1', width: 90, height: 60, file: {} as File, rotation: 90 }, // Manually rotated
            ],
        };

        const result = performPacking(req);
        // Expect success
        expect(result.packed.length).toBe(1);
        // Logic sets rotated=true if input angle is 90
        expect(result.packed[0].rotated).toBe(true);
    });
});
