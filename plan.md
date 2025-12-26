# SpritePacker Comprehensive Plan

## Phase 1: Scaffolding (Current)
- [ ] **Project Initialization**
  - Initialize Vite + React + TypeScript in the root directory.
  - Setup `.gitignore` to exclude node_modules, dist, etc.
  - Create `documentation.md` for architectural decisions.
  - Update `README.md` with project overview.
- [ ] **Dependencies & Configuration**
  - Install core libraries: `zustand`, `maxrects-packer`, `jszip`.
  - Install dev tools: `vitest`, `tailwindcss`.
  - Configure Tailwind CSS (dark mode preference).
  - Define folder structure (`src/components`, `src/store`, `src/workers`, `src/exporters`).

## Phase 2: Core Logic Implementation
- [ ] **State Management**
  - Implement `usePackerStore` (Zustand) to hold file list, settings, and status.
- [ ] **Web Worker packing**
  - Create `PackerWorker.ts`.
  - Implement `maxrects-packer` logic inside the worker.
  - Handle message passing between Main Thread and Worker.
- [ ] **Image Processing**
  - Implement OffscreenCanvas (or UI-blocking canvas fallback if Offscreen not fully supported by all targets, but user requested Worker) for image trimming and atlas drawing.

## Phase 3: UI & Export
- [ ] **User Interface**
  - **Sidebar**: Settings for padding, packaging method, etc.
  - **Drag & Drop**: Component to accept image files.
  - **Results View**: Canvas to display the packed texture atlas.
  - **Affiliate/Ads**: Placeholder component.
- [ ] **Export System**
  - `UnityExporter`: Generate YAML/.meta.
  - `UnrealExporter`: Generate Paper2D JSON.
  - `GodotExporter`: Generate .tres.
  - **Download**: Zip all assets (atlas image + data files).

## Phase 4: Verification & Polish
- [ ] **Testing**
  - Unit tests for Exporters.
  - Integration tests for Worker packing.
- [ ] **Deployment**
  - CI/CD Setup for Cloudflare Pages (`npm run build`).

## Test Strategy
- **After Scaffolding**: Check build runs (`npm run build`).
- **After Search Phase**: Test State updates.
- **After Logic**: Test packing algorithm with sample rects.
- **After Export**: Validate output file formats.
