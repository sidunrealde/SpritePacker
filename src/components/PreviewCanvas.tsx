import React, { useRef, useEffect, useState } from 'react';
import { usePackerStore } from '../store/usePackerStore';

export const PreviewCanvas: React.FC = () => {
    const { addImage, packedItems, settings } = usePackerStore();
    const [isDragging, setIsDragging] = useState(false);

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            Array.from(e.dataTransfer.files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    addImage(file);
                }
            });
            e.dataTransfer.clearData();
        }
    };

    return (
        <div
            className={`w-full h-full flex items-center justify-center p-4 transition-colors ${isDragging ? 'bg-blue-900/20 border-blue-500' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {packedItems.length === 0 ? (
                <div className="text-gray-500 border-2 border-dashed border-gray-700 rounded-lg w-full h-full flex items-center justify-center pointer-events-none">
                    <p>Drag images here or use the Sidebar to add sprites.</p>
                </div>
            ) : (
                <div className="relative shadow-lg border border-gray-700 bg-gray-900 overflow-hidden"
                    style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: `${settings.width}/${settings.height}` }}
                >
                    <CanvasRenderer />
                </div>
            )}
        </div>
    );
};

const CanvasRenderer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { packedItems, settings, images } = usePackerStore();
    const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

    useEffect(() => {
        images.forEach(img => {
            if (!loadedImages[img.id]) {
                const imageObj = new Image();
                imageObj.src = img.url;
                imageObj.onload = () => {
                    setLoadedImages(prev => ({ ...prev, [img.id]: imageObj }));
                };
            }
        });
    }, [images]); // Optimization: we should prevent re-loading known images.

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = settings.width;
        canvas.height = settings.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // ctx.fillStyle = '#2a2a2a'; // Removed to ensure transparency
        // ctx.fillRect(0, 0, canvas.width, canvas.height);

        packedItems.forEach(item => {
            const img = loadedImages[item.id];

            ctx.save();
            ctx.translate(item.x + item.width / 2, item.y + item.height / 2);

            if (item.rotated) {
                ctx.rotate(-Math.PI / 2);
                if (img) {
                    // Since we rotated -90deg, the local coord system is rotated.
                    // The item's PACKED width is its visual height, and vice versa.
                    // We draw the original image (w x h) centered.
                    // Wait, if item.rotated is true:
                    // item.width = original height (plus padding maybe)
                    // item.height = original width

                    // If we draw:
                    // drawImage(img, -img.width/2, -img.height/2)

                    // But we want to fit it into the packed rect.
                    // item.width (packed) should match img.height (original).

                    ctx.drawImage(img, -item.height / 2, -item.width / 2, item.height, item.width);
                }
            } else {
                if (img) {
                    ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
                }
            }

            ctx.restore();

            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 1;
            ctx.strokeRect(item.x, item.y, item.width, item.height);
        });

        // Update Blob in store for download
        canvas.toBlob((blob) => {
            if (blob) usePackerStore.getState().setAtlasBlob(blob);
        });

    }, [packedItems, settings, loadedImages]);

    return (
        <canvas
            ref={canvasRef}
            className="block w-full h-full object-contain bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gM0AmIGBgSEfXR6XN5D14TUAp3kMNA2jBsA0AADsCBEaXlK/6AAAAABJRU5ErkJggg==')] bg-repeat"
        />
    );
};
