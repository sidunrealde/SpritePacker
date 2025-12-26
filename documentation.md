# SpritePacker Documentation

## Architecture
- **Framework**: React 19 + TypeScript + Vite.
- **State Management**: Zustand.
- **Packing Engine**: `maxrects-packer` running in a Web Worker (off-main-thread).
- **Styling**: Tailwind CSS.
- **Exporting**: JSZip for bundling; Custom exporter functions for game engines.

## Decisions Log
- **Client-Side Only**: Chosen to minimize hosting costs and simplify architecture. Hosted on Cloudflare Pages.
- **Web Worker**: Critical for performance when packing hundreds of sprites.
- **OffscreenCanvas**: Used within the worker to manipulate image data without blocking UI.

## Testing
- Vitest for logic and component testing.
