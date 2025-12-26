import React, { useState } from 'react';
import { usePackerStore } from '../store/usePackerStore';
import { usePackerWorker } from '../hooks/useWorker';
import { exporters } from '../exporters';
import { downloadZip } from '../utils/download';

export const Sidebar: React.FC = () => {
    const { images, settings, updateSettings, addImage, status, atlasBlob, packedItems } = usePackerStore();
    const { pack } = usePackerWorker();
    const [selectedExporter, setSelectedExporter] = useState(exporters[0].name);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => addImage(file));
        }
    };

    const handleDownload = () => {
        if (!atlasBlob) return;

        // Map Image IDs to Filenames
        const nameMap: Record<string, string> = {};
        images.forEach(img => {
            // Remove extension for sprite name
            nameMap[img.id] = img.file.name.replace(/\.[^/.]+$/, "");
        });

        downloadZip(packedItems, settings, nameMap, atlasBlob, selectedExporter);
    };

    return (
        <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
                <h2 className="font-semibold mb-4">Settings</h2>
                <div className="space-y-4">
                    <div>
                        <p className="block text-xs text-gray-400 mb-1">Atlas Size</p>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={settings.width}
                                onChange={(e) => updateSettings({ width: Number(e.target.value) })}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm"
                            />
                            <span className="text-gray-500">x</span>
                            <input
                                type="number"
                                value={settings.height}
                                onChange={(e) => updateSettings({ height: Number(e.target.value) })}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="rot"
                            checked={settings.allowRotation}
                            onChange={(e) => updateSettings({ allowRotation: e.target.checked })}
                        />
                        <label htmlFor="rot" className="text-sm">Allow Rotation</label>
                    </div>

                    {/* Export Settings */}
                    <div>
                        <p className="block text-xs text-gray-400 mb-1">Export Format</p>
                        <select
                            value={selectedExporter}
                            onChange={(e) => setSelectedExporter(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                        >
                            {exporters.map(exp => (
                                <option key={exp.name} value={exp.name}>{exp.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-auto">
                <h2 className="font-semibold mb-2">Images ({images.length})</h2>
                <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 mb-4"
                />

                <div className="space-y-2">
                    {images.map(img => (
                        <div key={img.id} className="flex items-center gap-2 bg-gray-700 p-2 rounded text-xs">
                            <div className="w-8 h-8 bg-gray-600 rounded overflow-hidden">
                                <img src={img.url} alt="preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 truncate">{img.file.name}</div>
                            <div className="text-gray-400">{img.width}x{img.height}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t border-gray-700 space-y-2">
                <button
                    onClick={pack}
                    className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
                    disabled={status === 'packing'}
                >
                    {status === 'packing' ? 'Packing...' : 'Pack Sprites'}
                </button>

                <button
                    onClick={handleDownload}
                    className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
                    disabled={status !== 'success' || !atlasBlob}
                >
                    Download ZIP
                </button>
            </div>
        </aside>
    );
};
