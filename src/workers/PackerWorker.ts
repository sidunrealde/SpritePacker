// src/workers/PackerWorker.ts
import { performPacking } from './packingLogic';
import type { PackRequest, PackResult } from './types';

self.onmessage = (e: MessageEvent<PackRequest>) => {
    const req = e.data;
    try {
        const result: PackResult = performPacking(req);
        self.postMessage(result);
    } catch (err) {
        const errorResult: PackResult = {
            id: req.id,
            success: false,
            packed: [],
            unpacked: [],
            width: req.width,
            height: req.height,
            error: (err as Error).message,
        };
        self.postMessage(errorResult);
    }
};
