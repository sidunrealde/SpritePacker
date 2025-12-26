
export interface SpriteFrame {
    name: string;
    frame: { x: number, y: number, width: number, height: number };
    rotated: boolean;
    trimmed: boolean;
    spriteSourceSize: { x: number, y: number, width: number, height: number };
    sourceSize: { w: number, h: number };
}

export interface PackResultData {
    frames: SpriteFrame[];
    meta: {
        app: string;
        version: string;
        image: string;
        format: string;
        size: { w: number, h: number };
        scale: number;
    };
}

export interface IExporter {
    name: string;
    extension: string;
    export(data: PackResultData, fileName: string): string;
}
