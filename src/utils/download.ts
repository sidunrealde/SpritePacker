import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { PackResultData } from '../exporters/types';
import { exporters } from '../exporters';
import type { Rect } from '../workers/types';

// Helper to convert store data to exporter format
const convertToPackResultData = (
    items: Rect[],
    width: number,
    height: number,
    imageNames: Record<string, string> // id -> filename mappings
): PackResultData => {
    return {
        frames: items.map(item => ({
            name: imageNames[item.id] || `sprite_${item.id}`,
            frame: {
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height
            },
            rotated: item.rotated || false,
            trimmed: false, // Trim logic not fully implemented yet
            spriteSourceSize: {
                x: 0,
                y: 0,
                width: item.width,
                height: item.height
            }, // Assuming no trim
            sourceSize: {
                w: item.rotated ? item.height : item.width,
                h: item.rotated ? item.width : item.height
            }
        })),
        meta: {
            app: "SpritePacker",
            version: "1.0",
            image: "atlas.png",
            format: "RGBA8888",
            size: { w: width, h: height },
            scale: 1
        }
    };
};

export const downloadZip = async (
    items: Rect[],
    settings: { width: number, height: number },
    imageNameMap: Record<string, string>,
    atlasBlob: Blob,
    exporterName: string
) => {
    const zip = new JSZip();

    // 1. Get Texture Blob
    if (!atlasBlob) throw new Error("Failed to create texture blob");

    zip.file("atlas.png", atlasBlob);

    // 2. Generate Data File
    const exporter = exporters.find(e => e.name === exporterName) || exporters[0];
    const data = convertToPackResultData(items, settings.width, settings.height, imageNameMap);
    const content = exporter.export(data, "atlas");

    zip.file(`atlas.${exporter.extension}`, content);

    // 3. Generate ZIP
    const contentZip = await zip.generateAsync({ type: "blob" });
    saveAs(contentZip, "spritesheet.zip");
};
