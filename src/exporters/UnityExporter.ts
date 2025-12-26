import type { IExporter, PackResultData } from "./types";

export class UnityExporter implements IExporter {
    name = "Unity (JSON)";
    extension = "json";

    export(data: PackResultData, fileName: string): string {
        const output: {
            frames: Record<string, any>;
            meta: any;
        } = {
            frames: {},
            meta: {
                app: "SpritePacker",
                version: "1.0",
                image: fileName + ".png",
                format: "RGBA8888",
                size: { w: data.meta.size.w, h: data.meta.size.h },
                scale: 1
            }
        };

        data.frames.forEach(frame => {
            // Unity (TexturePacker JSON) expects frame data
            // Coordinates in Unity are usually bottom-left? 
            // TexturePacker JSON usually uses top-left, same as web.
            // Importers handle the flip.

            output.frames[frame.name] = {
                frame: { x: frame.frame.x, y: frame.frame.y, w: frame.frame.width, h: frame.frame.height },
                rotated: frame.rotated,
                trimmed: frame.trimmed,
                spriteSourceSize: { x: frame.spriteSourceSize.x, y: frame.spriteSourceSize.y, w: frame.spriteSourceSize.width, h: frame.spriteSourceSize.height },
                sourceSize: { w: frame.sourceSize.w, h: frame.sourceSize.h }
            };
        });

        return JSON.stringify(output, null, 2);
    }
}
