import type { IExporter, PackResultData } from "./types";

export class GodotExporter implements IExporter {
    name = "Godot (JSON)";
    extension = "json";

    export(data: PackResultData, fileName: string): string {
        // Godot can easily parse the generic array format.
        // We reuse the same logic as Unreal/Generic Array.

        const frames = data.frames.map(frame => ({
            filename: frame.name,
            frame: { x: frame.frame.x, y: frame.frame.y, w: frame.frame.width, h: frame.frame.height },
            rotated: frame.rotated,
            trimmed: frame.trimmed,
            spriteSourceSize: { x: frame.spriteSourceSize.x, y: frame.spriteSourceSize.y, w: frame.spriteSourceSize.width, h: frame.spriteSourceSize.height },
            sourceSize: { w: frame.sourceSize.w, h: frame.sourceSize.h }
        }));

        const output = {
            frames: frames,
            meta: {
                app: "SpritePacker",
                version: "1.0",
                image: fileName + ".png",
                format: "RGBA8888",
                size: { w: data.meta.size.w, h: data.meta.size.h },
                scale: 1
            }
        };

        return JSON.stringify(output, null, 2);
    }
}
