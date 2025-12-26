// src/components/PreviewCanvas.tsx
import React from 'react';

export const PreviewCanvas: React.FC = () => {
    return (
        <div className="border-2 border-dashed border-gray-700 rounded-lg w-full h-full flex items-center justify-center text-gray-500">
            <p>Drag images here or use the Sidebar to add sprites.</p>
            {/* Canvas will go here */}
            <canvas id="preview-canvas" className="hidden" />
        </div>
    );
};
