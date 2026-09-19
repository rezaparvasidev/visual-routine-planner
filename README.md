# Visual Routine Planner

A Windows desktop app for visually building day routines — 24-hour timelines of colored, titled time slots, built entirely by drag-and-drop. There are no dates: a routine represents an abstract "a day" (e.g. "Weekday", "Weekend"), not a calendar entry, and you can create as many as you want.

## Features

- **No dates** — every routine is a plain 24-hour timeline, not tied to a calendar.
- **Wake / sleep bounds** — each routine's active range is set by dragging a left (wake-up) and right (sleep) handle on the 24-hour bar.
- **Time slots** — add colored, titled blocks between the wake and sleep bounds, either by clicking "+ Add Slot" or by clicking and dragging directly on empty timeline space.
- **Drag-to-resize with no overlap** — dragging a slot's edge into a neighboring slot pushes that neighbor's edge to make room; slots can never overlap.
- **Duplicate, delete, recolor, rename** — every slot can be duplicated, deleted, given a custom color, and retitled inline.
- **Unlimited routines** — add as many independent 24-hour timelines as you want, stacked vertically.
- **Autosaves locally** — routines persist to a JSON file on disk, no account or internet connection required.

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
