import React, { useState } from 'react';
import { usePackerStore } from '../store/usePackerStore';
import { usePackerWorker } from '../hooks/useWorker';
import { exporters } from '../exporters';
import { downloadZip } from '../utils/download';

export const Sidebar: React.FC = () => {
    const {
        images, settings, updateSettings, addImage,
        removeImage, clearImages, toggleImageRotation,
        status, atlasBlob, packedItems
    } = usePackerStore();
    const { pack } = usePackerWorker();
    const [selectedExporter, setSelectedExporter] = useState(exporters[0].name);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => addImage(file));
        }
    };

    const handleDownloadZip = () => {
        if (!atlasBlob) return;

        // Map Image IDs to Filenames
        const nameMap: Record<string, string> = {};
        images.forEach(img => {
            nameMap[img.id] = img.file.name.replace(/\.[^/.]+$/, "");
        });

        downloadZip(packedItems, settings, nameMap, atlasBlob, selectedExporter);
    };

    const handleDownloadPng = () => {
        if (!atlasBlob) return;
        const url = URL.createObjectURL(atlasBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'atlas.png';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col text-gray-300 shadow-xl z-20">
            <div className="p-4 border-b border-gray-800 space-y-6">
                <div>
                    <h2 className="font-bold text-white mb-3 text-sm uppercase tracking-wider">Settings</h2>

                    {/* Size & Padding */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Dimensions</p>
                            <div className="flex gap-1 items-center">
                                <input
                                    type="number"
                                    value={settings.width}
                                    onChange={(e) => updateSettings({ width: Number(e.target.value) })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                                <span className="text-gray-600">×</span>
                                <input
                                    type="number"
                                    value={settings.height}
                                    onChange={(e) => updateSettings({ height: Number(e.target.value) })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Padding</p>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={settings.padding}
                                    onChange={(e) => updateSettings({ padding: Number(e.target.value) })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                                <span className="ml-1 text-xs text-gray-600">px</span>
                            </div>
                        </div>
                    </div>

                    {/* Layout */}
                    <div className="mb-3">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Layout Strategy</p>
                        <select
                            value={settings.layout}
                            onChange={(e) => updateSettings({ layout: e.target.value as any })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="maxrects">MaxRects (Efficient)</option>
                            <option value="vertical">Vertical Strip</option>
                            <option value="horizontal">Horizontal Strip</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-400">Global Rotation</span>
                        <div className="relative inline-block w-8 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="toggle" id="rot"
                                checked={settings.allowRotation}
                                onChange={(e) => updateSettings({ allowRotation: e.target.checked })}
                                className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-4" />
                            <label htmlFor="rot" className={`toggle-label block overflow-hidden h-4 rounded-full cursor-pointer ${settings.allowRotation ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                <span className="sr-only">Toggle Rotation</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <input
                            type="checkbox"
                            id="scaleFit"
                            checked={settings.scaleToFit}
                            onChange={(e) => updateSettings({ scaleToFit: e.target.checked })}
                            className="bg-gray-800 border-gray-700 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="scaleFit" className="text-xs text-gray-400">Scale Sprites to Fit Atlas</label>
                    </div>

                    {/* Export Settings */}
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Export Format</p>
                        <select
                            value={selectedExporter}
                            onChange={(e) => setSelectedExporter(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {exporters.map(exp => (
                                <option key={exp.name} value={exp.name}>{exp.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-auto">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-white text-sm uppercase tracking-wider">Images ({images.length})</h2>
                    {images.length > 0 && (
                        <button onClick={clearImages} className="text-[10px] text-red-500 hover:text-red-400 uppercase font-semibold">
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
                        accept="image/png,image/jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>

                <div className="space-y-1">
                    {images.map((img, index) => (
                        <div
                            key={img.id}
                            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-750 p-2 rounded border border-transparent hover:border-gray-700 group transition-all"
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', index.toString());
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const dragIndex = Number(e.dataTransfer.getData('text/plain'));
                                if (dragIndex === index) return;

                                const newImages = [...images];
                                const [draggedItem] = newImages.splice(dragIndex, 1);
                                newImages.splice(index, 0, draggedItem);

                                usePackerStore.getState().reorderImages(newImages);
                            }}
                        >
                            <div className="w-10 h-10 bg-gray-900 rounded overflow-hidden flex-shrink-0 border border-gray-700 cursor-move">
                                <img src={img.url} alt="preview" className="w-full h-full object-contain pointer-events-none" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="truncate text-xs text-gray-300 font-medium" title={img.file.name}>{img.file.name}</p>
                                <p className="text-[10px] text-gray-500">{img.width}x{img.height}</p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => toggleImageRotation(img.id)}
                                    className={`p-1.5 rounded hover:bg-gray-700 ${img.rotatable ? 'text-blue-400' : 'text-gray-500'}`}
                                    title="Toggle Rotation"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                </button>
                                <button
                                    onClick={() => removeImage(img.id)}
                                    className="p-1.5 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400"
                                    title="Remove"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900 space-y-2">
                <button
                    onClick={pack}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-2.5 rounded shadow-lg shadow-emerald-900/30 font-semibold hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    disabled={status === 'packing'}
                >
                    {status === 'packing' ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Packing...
                        </span>
                    ) : 'Pack Sprites'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleDownloadZip}
                        className="w-full bg-gray-800 border border-gray-700 text-gray-300 py-2 rounded font-medium hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 text-xs"
                        disabled={status !== 'success' || !atlasBlob}
                    >
                        JSON + Atlas
                    </button>
                    <button
                        onClick={handleDownloadPng}
                        className="w-full bg-gray-800 border border-gray-700 text-gray-300 py-2 rounded font-medium hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 text-xs"
                        disabled={status !== 'success' || !atlasBlob}
                    >
                        PNG Only
                    </button>
                </div>
            </div>
        </aside>
    );
};
