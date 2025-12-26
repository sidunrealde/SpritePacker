import type { IExporter, PackResultData } from "./types";

export class CssExporter implements IExporter {
    name = "CSS (Simple)";
    extension = "css";

    export(data: PackResultData, fileName: string): string {
        const { size, image } = data.meta;
        const fps = data.frames.map(f => {
            const { name, frame, rotated } = f;
            // Clean class name: replace dots/slashes with hyphens
            const className = `sprite-${name.replaceAll(/[^a-zA-Z0-9-_]/g, '-')}`;

            // Note: CSS Sprites with rotation are complex and usually not supported 
            // by standard background-position techniques without extra elements/transforms.
            // We optimize for standard usage here.

            return `/* ${fileName} */
.${className} {
    width: ${frame.width}px;
    height: ${frame.height}px;
    background-image: url('${image}');
    background-position: -${frame.x}px -${frame.y}px;
    background-size: ${size.w}px ${size.h}px;
    display: inline-block;
    ${rotated ? '/* Rotated in atlas! Requires transform to display correctly */' : ''}
}`;
        });

        return fps.join('\n\n');
    }
}
