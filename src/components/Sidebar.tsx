import React, { useState } from 'react';
import { usePackerStore } from '../store/usePackerStore';
import { usePackerWorker } from '../hooks/useWorker';
import { exporters } from '../exporters';
import { downloadZip } from '../utils/download';

export const Sidebar: React.FC = () => {
    const {
        images,
        settings,
        updateSettings,
        addImage,
        removeImage,
        clearImages,
        toggleImageRotation,
        updateImage,
        reorderImages,
        status,
        atlasBlob,
        packedItems
    } = usePackerStore();

    const { pack } = usePackerWorker();
    const [selectedExporter, setSelectedExporter] = useState(exporters[0].name);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => addImage(file));
        }
    };

    const handleProcess = () => {
        pack();
    };

    const handleDownload = () => {
        if (!atlasBlob) return;

        // Map Image IDs to Filenames for JSON/XML exporters
        const nameMap: Record<string, string> = {};
        images.forEach(img => {
            // Remove extension
            nameMap[img.id] = img.file.name.replace(/\.[^/.]+$/, "");
        });

        downloadZip(packedItems, settings, nameMap, atlasBlob, selectedExporter);
    };

    const handleDragStart = (index: number) => {
        (window as any).draggedItemIndex = index;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (dropIndex: number) => {
        const dragIndex = (window as any).draggedItemIndex;
        if (dragIndex === undefined || dragIndex === dropIndex) return;

        const newImages = [...images];
        const [draggedItem] = newImages.splice(dragIndex, 1);
        newImages.splice(dropIndex, 0, draggedItem);

        reorderImages(newImages);
        (window as any).draggedItemIndex = undefined;
    };

    return (
        <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col text-gray-300 shadow-xl z-20">
            <style>{`
                .no-spinner::-webkit-inner-spin-button,
                .no-spinner::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .no-spinner {
                    -moz-appearance: textfield;
                }
            `}</style>

            <div className="p-4 border-b border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Canvas</h2>
                    <label className="flex items-center space-x-2 text-xs cursor-pointer">
                        <span className="text-gray-400">Auto Size</span>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.autoSize}
                                onChange={(e) => updateSettings({ autoSize: e.target.checked })}
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Width</label>
                        <input
                            type="number"
                            value={settings.width}
                            onChange={(e) => updateSettings({ width: Number(e.target.value) })}
                            disabled={settings.autoSize}
                            className={`w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-colors ${settings.autoSize ? 'opacity-50 cursor-not-allowed' : 'text-white'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Height</label>
                        <input
                            type="number"
                            value={settings.height}
                            onChange={(e) => updateSettings({ height: Number(e.target.value) })}
                            disabled={settings.autoSize}
                            className={`w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-colors ${settings.autoSize ? 'opacity-50 cursor-not-allowed' : 'text-white'}`}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Layout</label>
                        <select
                            value={settings.layout}
                            onChange={(e) => updateSettings({ layout: e.target.value as any })}
                            className="w-full bg-gray-800 border-gray-700 rounded text-sm text-white px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="maxrects">MaxRects (Efficient)</option>
                            <option value="grid">Grid (Row-Major)</option>
                            <option value="vertical">Vertical Strip</option>
                            <option value="horizontal">Horizontal Strip</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500">Spacing</label>
                            <input
                                type="number"
                                value={settings.padding}
                                onChange={(e) => updateSettings({ padding: Number(e.target.value) })}
                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-20 text-white mt-1"
                            />
                        </div>
                        <label className="flex items-center space-x-2 text-xs cursor-pointer mt-4">
                            <input
                                type="checkbox"
                                checked={settings.scaleToFit}
                                onChange={(e) => updateSettings({ scaleToFit: e.target.checked })}
                                className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-900"
                            />
                            <span>Scale to Fit</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                <div className="flex items-center justify-between px-2 pb-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase">Sprites ({images.length})</h3>
                    {images.length > 0 && (
                        <button onClick={clearImages} className="text-xs text-red-400 hover:text-red-300">
                            Clear All
                        </button>
                    )}
                </div>

                <label className="block w-full bg-gray-800 border border-dashed border-gray-600 rounded-lg p-3 text-center cursor-pointer hover:border-gray-500 hover:bg-gray-750 transition-colors mb-4 group">
                    <span className="text-xs text-gray-400 group-hover:text-gray-300">
                        + Add Images
                    </span>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </label>

                {images.map((img, index) => (
                    <div
                        key={img.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        className="group relative bg-gray-800 rounded-md p-2 flex flex-col gap-2 hover:bg-gray-750 border border-transparent hover:border-gray-600 transition-all cursor-move"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gray-900 rounded border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                <img
                                    src={img.url}
                                    alt="preview"
                                    className="max-w-full max-h-full object-contain"
                                    style={{
                                        transform: img.rotatable ? 'rotate(-90deg)' : 'none',
                                        transition: 'transform 0.2s'
                                    }}
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div className="truncate text-xs font-medium text-gray-300" title={img.file.name}>
                                        {img.file.name}
                                    </div>
                                    <button
                                        onClick={() => removeImage(img.id)}
                                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                    {img.width}x{img.height}
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex justify-between items-center mt-1">
                            <button
                                onClick={() => toggleImageRotation(img.id)}
                                className={`text-[10px] py-1 px-2 rounded border transition-colors ${img.rotatable
                                        ? 'bg-blue-900/30 border-blue-800 text-blue-300'
                                        : 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'
                                    }`}
                            >
                                Rotate {img.rotatable ? 'ON' : 'OFF'}
                            </button>
                        </div>

                        {/* 4-sided Padding Inputs */}
                        <div className="grid grid-cols-4 gap-1 mt-1">
                            {['top', 'bottom', 'left', 'right'].map((side) => (
                                <div key={side} className="flex flex-col items-center">
                                    <label className="text-[9px] text-gray-500 uppercase mb-0.5">{side.charAt(0)}</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-[10px] text-center text-gray-300 no-spinner focus:border-blue-500 outline-none"
                                        placeholder="0"
                                        value={img.padding?.[side as keyof typeof img.padding] || 0}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            const currentPad = img.padding || { top: 0, bottom: 0, left: 0, right: 0 };
                                            updateImage(img.id, {
                                                padding: { ...currentPad, [side]: val }
                                            });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900 z-10">
                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Export Format</label>
                    <select
                        value={selectedExporter}
                        onChange={(e) => setSelectedExporter(e.target.value)}
                        className="w-full bg-gray-800 border-gray-700 rounded text-sm text-white px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        {exporters.map(exp => (
                            <option key={exp.name} value={exp.name}>{exp.name} ({exp.extension})</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleProcess}
                        disabled={images.length === 0 || status === 'packing'}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {status === 'packing' ? 'Packing...' : 'Pack Sprites'}
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={!packedItems.length}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Download
                    </button>
                </div>
            </div>
        </aside>
    );
};
