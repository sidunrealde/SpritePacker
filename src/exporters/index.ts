import type { IExporter } from "./types";
import { UnityExporter } from "./UnityExporter";
import { UnrealExporter } from "./UnrealExporter";
import { GodotExporter } from "./GodotExporter";

export const exporters: IExporter[] = [
    new UnityExporter(),
    new UnrealExporter(),
    new GodotExporter()
];

export * from "./types";
