# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — launch the app in development (electron-vite dev server + Electron, with HMR for the renderer)
- `npm run typecheck` — type-check both the main/preload process (`tsconfig.node.json`) and the renderer (`tsconfig.web.json`); run this after any change, there is no separate lint/test suite
- `npm run build` — typecheck then production-build all three processes via electron-vite (outputs to `out/`)
- `npm run dist` — build then package a Windows NSIS installer via electron-builder (outputs to `release/`)
- `npm run preview` — preview a production build without repackaging

There is no test runner or linter configured. `npm run typecheck` is the primary correctness gate.

## Architecture

Electron + React + TypeScript app for visually building day routines (24-hour timelines with drag-and-drop time slots — no calendar dates anywhere). Three separate TypeScript build targets, wired together by `electron.vite.config.ts` (electron-vite), each with its own tsconfig:

- **`electron/`** — Node-capable main process (`main.ts`) and `preload.ts`. Never imported by the renderer directly. `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — the renderer talks to main only through `window.routinesAPI` (defined in `preload.ts` via `contextBridge`), which maps to `ipcMain.handle` calls registered in `electron/ipc/routinesHandlers.ts`.
- **`src/`** — the renderer (React app), DOM-only, no Node APIs.
- **`shared/domain.ts`** — the `Routine`/`Slot`/`PersistedData` types, imported by both `electron/` and `src/` via the `@shared/*` path alias (also wired into both tsconfigs and the electron-vite config's per-target `resolve.alias`).

### Data flow / persistence

Single JSON file at `app.getPath('userData')/routines.json` (`electron/persistence/store.ts`), read/written only in the main process with atomic writes (write to `.tmp`, then rename). Renderer flow: `App` calls `store.init()` on mount → IPC `routines:load` → populates the zustand store (`src/state/routinesStore.ts`). Every store mutation is autosaved via a `subscribeWithSelector` subscription on `state.routines`, debounced 400ms, sending the *full* `PersistedData` object over IPC `routines:save` each time (not incremental diffs).

### Core domain logic lives outside React

All the actual scheduling rules — the reason this app is non-trivial — are pure functions in `src/lib/slotOps.ts` (push-resize on drag, gap-finding, duplicate placement, delete) and `src/lib/time.ts` (minute↔pixel conversion, 5-minute snapping, clamping). These are framework-free and take/return `Routine` objects immutably. The zustand store (`src/state/routinesStore.ts`) is a thin dispatcher: every mutating action calls one of these pure functions and replaces the matching routine in the `routines` array. **When changing scheduling behavior (overlap handling, min durations, gap search order), edit `slotOps.ts`, not the components.**

Key invariants enforced by `slotOps.ts`:
- `Routine.slots` is always kept sorted ascending by `startMinutes`.
- Slots never overlap: dragging a slot edge into a neighbor pushes the neighbor's facing edge to match, down to the neighbor's own `MIN_SLOT_DURATION` (10 min) floor — it does not cascade past the immediate neighbor.
- The wake/sleep handles (`routine.wakeMinutes`/`sleepMinutes`) can never be dragged past the outermost slot's edge, so a slot can never end up orphaned outside the active range.
- "Add Slot" and "Duplicate" both fall back to `addSlotToGap`'s first-fit/shrink-to-fit gap search rather than silently failing when there's no room.

### Component/drag responsibilities

Each draggable element owns its own pointer events and reads/writes time via pixel↔minute conversion computed from `trackRef.current.getBoundingClientRect()` at move time (no measured-width state is cached — see `RoutineTimeline.tsx`, `WakeSleepHandle.tsx`, `SlotBlock.tsx`). All drag `pointermove` handlers guard on `e.buttons === 0` to stop responding once the mouse button is released, independent of whether a `pointerup`/capture-release event is ever delivered — keep this guard when touching any drag handler. Legality/clamping is always delegated to `slotOps.ts`; components only do event plumbing and rendering.

`RoutineTimeline.tsx` also owns the click-drag-to-create-a-slot gesture on empty track space: children (`SlotBlock`, `WakeSleepHandle`) call `stopPropagation()` on their own `pointerdown` so the track's handler only fires on genuinely empty space.

Slot title/color editing is a popover (`SlotEditor.tsx` + `ColorPicker.tsx`) opened either by clicking a slot or automatically right after a slot is created — the "auto-open editor for a just-created slot" handoff goes through `pendingEditSlotId` in the zustand store, consumed by a `useEffect` in `RoutineTimeline.tsx`.
