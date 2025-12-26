// src/hooks/useWorker.ts
import { useEffect, useRef } from 'react';
import { usePackerStore } from '../store/usePackerStore';
import PackerWorker from '../workers/PackerWorker?worker'; // Vite worker import
import type { PackRequest, PackResult } from '../workers/types';

export function usePackerWorker() {
    const workerRef = useRef<Worker | null>(null);
    const {
        images,
        settings,
        setPackingStatus,
        setPackedResults
    } = usePackerStore();

    useEffect(() => {
        // Instantiate worker
        const worker = new PackerWorker();
        workerRef.current = worker;

        worker.onmessage = (e: MessageEvent<PackResult>) => {
            const result = e.data;
            if (result.success) {
                setPackedResults(result.packed);
                setPackingStatus('success');
            } else {
                setPackingStatus('error', result.error);
            }
        };

        worker.onerror = (err) => {
            setPackingStatus('error', 'Worker error: ' + err.message);
        };

        return () => {
            worker.terminate();
        };
    }, []); // Only re-create if truly needed, but usually one worker per session is fine. 
    // If we want to restart worker on severe error, we can add dependency.

    const pack = () => {
        if (!workerRef.current) return;
        if (images.length === 0) return;

        setPackingStatus('packing');

        const req: PackRequest = {
            id: crypto.randomUUID(),
            images: images.map(img => ({
                id: img.id,
                width: img.width,
                height: img.height,
                file: img.file,
                rotatable: img.rotatable
            })),
            width: settings.width,
            height: settings.height,
            padding: settings.padding,
            allowRotation: settings.allowRotation,
            layout: settings.layout,
            scaleToFit: settings.scaleToFit,
        };

        workerRef.current.postMessage(req);
    };

    return { pack };
}
