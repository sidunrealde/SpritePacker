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
    const { packedItems, images, settings, atlasWidth, atlasHeight } = usePackerStore();
    const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

    useEffect(() => {
        // ... (loading images) ...
        images.forEach(img => {
            if (!loadedImages[img.id]) {
                const imageObj = new Image();
                imageObj.src = img.url;
                imageObj.onload = () => {
                    setLoadedImages(prev => ({ ...prev, [img.id]: imageObj }));
                };
            }
        });
    }, [images, loadedImages]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Determine Canvas Size
        // If packed, use Calculated Size (atlasWidth/Height).
        // If not packed, use Settings Size.
        const targetW = packedItems.length > 0 ? atlasWidth : settings.width;
        const targetH = packedItems.length > 0 ? atlasHeight : settings.height;

        canvas.width = targetW;
        canvas.height = targetH;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        packedItems.forEach(item => {
            const img = loadedImages[item.id];

            ctx.save();
            ctx.translate(item.x + item.width / 2, item.y + item.height / 2);

            // Allow 4-way rotation (0, 90, 180, 270)
            const rad = item.rotation * (Math.PI / 180);
            ctx.rotate(rad);

            if (img) {
                // Determine original dimensions based on packed dimensions and rotation
                // If rotated 90 or 270, the packed W/H are swapped relative to the original image.
                // So original W = packed H, original H = packed W.
                const isSwapped = item.rotation === 90 || item.rotation === 270;
                const drawW = isSwapped ? item.height : item.width;
                const drawH = isSwapped ? item.width : item.height;

                ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
            }

            ctx.restore();
        });

        // Update Blob
        canvas.toBlob(blob => {
            if (blob) {
                usePackerStore.getState().setAtlasBlob(blob);
            }
        }, 'image/png');

    }, [packedItems, loadedImages, settings.width, settings.height, atlasWidth, atlasHeight]);

    // Use current active dimensions for Aspect Ratio style
    const viewW = packedItems.length > 0 ? atlasWidth : settings.width;
    const viewH = packedItems.length > 0 ? atlasHeight : settings.height;

    return (
        <div className="relative" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Checkerboard background */}
            <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2nk5+d/Yggx4HPmzFkGRkZGMJtgWExjYyO6QnQAw8PD/0+fPo1uJzsAAJ72CxsH17e5AAAAAElFTkSuQmCC")`,
                    backgroundRepeat: 'repeat',
                    opacity: 0.2
                }}
            />
            <canvas
                ref={canvasRef}
                // Width/Height set in Effect
                className="relative z-10 shadow-sm"
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    aspectRatio: `${viewW} / ${viewH}`
                }}
            />
        </div>
    );
};
