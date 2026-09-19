# Visual Routine Planner

A Windows desktop app for visually building day routines — 24-hour timelines of colored, titled time slots, built entirely by drag-and-drop. There are no dates: a routine represents an abstract "a day" (e.g. "Weekday", "Weekend"), not a calendar entry, and you can create as many as you want.

## Features

- **No dates** — every routine is a plain 24-hour timeline, not tied to a calendar.
- **Wake / sleep bounds** — each routine's active range is set on a thin full-day overview bar. The main timeline below it zooms to that range (plus a 1-hour blocked buffer on each side) so slots aren't squeezed into a tiny sliver of a full 24-hour bar.
- **Time slots** — add colored, titled blocks between the wake and sleep bounds, either by clicking "+ Add Slot" or by clicking and dragging directly on empty timeline space.
- **Move and resize with no overlap** — drag a slot's body to slide it, or its edges to resize it; dragging into a neighbor pushes that neighbor's edge to make room, so slots can never overlap.
- **Select, rename, recolor, duplicate, delete** — click a slot to select it, double-click its title to rename it in place, and use its toolbar to change color, duplicate, or delete it (or just press Delete/Backspace on a selected slot).
- **30-minute units** — snapping, minimum slot size, and the background grid are all in 30-minute increments.
- **Unlimited routines** — add as many independent timelines as you want, stacked vertically.
- **Autosaves locally** — routines persist to a JSON file on disk, no account or internet connection required.

## Using the app

1. **Create a routine** — click **+ Add Routine** to add a new 24-hour timeline.
2. **Set wake/sleep** — drag the two handles on the thin overview bar (the glassy handles with a red center line) to set when the routine's day starts and ends. The main timeline below zooms to fit that range automatically.
3. **Add a time slot** — either click **+ Add Slot** (fills the next open gap), or click-and-drag directly on empty space in the main timeline to draw a slot at an exact time.
4. **Select a slot** — click it once. A toolbar appears in the center of the slot:
   - 🎨 change its color
   - ⧉ duplicate it
   - 🗑 delete it
   - ✕ close the toolbar (deselect)

   You can also press **Delete** or **Backspace** to delete whichever slot is currently selected.
5. **Rename a slot** — double-click its title text and type a new name.
6. **Move or resize a slot** — drag the middle of a slot to slide it earlier/later, or drag its left/right edge to resize it. Dragging into a neighboring slot pushes that neighbor out of the way rather than overlapping it.
7. **Rename or remove a routine** — edit the routine's name field directly, or use **Delete Routine** in its header.

All changes save automatically to disk as you make them.

## Tech stack

Electron + React + TypeScript, built with [electron-vite](https://electron-vite.org/) and packaged with [electron-builder](https://www.electron.build/). State is managed with [zustand](https://github.com/pmndrs/zustand); the scheduling logic (overlap resolution, gap-finding, snapping) lives in framework-free, pure functions.

## Getting started

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm run dev
```

This launches the app with hot reload for the renderer.

## Building

```bash
npm run typecheck   # type-check main/preload and renderer
npm run build        # production build of all processes (out/)
npm run dist          # package a Windows installer (release/)
```

`npm run dist` produces `release/Visual Routine Planner Setup <version>.exe` via electron-builder's NSIS target.

## Data storage

Routines are saved as a single JSON file at `%APPDATA%\visual-routine-planner\routines.json`. There's no cloud sync — back up that file if you want to keep a copy elsewhere.

## Project structure

- `electron/` — Electron main process and preload script (IPC + file persistence)
- `src/` — the React renderer app
- `shared/` — TypeScript types shared between main and renderer

See [`CLAUDE.md`](./CLAUDE.md) for a deeper architecture walkthrough.
