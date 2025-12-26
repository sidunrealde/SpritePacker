import React, { useRef, useEffect, useState } from 'react';
import { usePackerStore } from '../store/usePackerStore';

export const PreviewCanvas: React.FC = () => {
    const { addImage, packedItems } = usePackerStore();
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
                <CanvasRenderer />
            )}
        </div>
    );
};

const CanvasRenderer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { packedItems, images, settings } = usePackerStore();
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

        packedItems.forEach(item => {
            const img = loadedImages[item.id];

            ctx.save();
            ctx.translate(item.x + item.width / 2, item.y + item.height / 2);

            if (item.rotated) {
                ctx.rotate(-90 * Math.PI / 180);
                if (img) {
                    ctx.drawImage(img, -item.height / 2, -item.width / 2, item.height, item.width);
                }
            } else {
                if (img) {
                    ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
                }

                // Debug (Disabled)
                /*
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 1;
                ctx.strokeRect(-item.width/2, -item.height/2, item.width, item.height);
                */
            }

            ctx.restore();
        });

        // Update Blob
        canvas.toBlob(blob => {
            if (blob) {
                usePackerStore.getState().setAtlasBlob(blob);
            }
        }, 'image/png');

    }, [packedItems, loadedImages, settings.width, settings.height]);

    return (
        <canvas
            ref={canvasRef}
            className="block w-full h-full object-contain bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gM0AmIGBgSEfXR6XN5D14TUAp3kMNA2jBsA0AADsCBEaXlK/6AAAAABJRU5ErkJggg==')] bg-repeat"
        />
    );
};
