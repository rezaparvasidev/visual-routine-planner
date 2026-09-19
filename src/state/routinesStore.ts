import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Routine } from '@shared/domain'
import { createId } from '../lib/id'
import { DEFAULT_SLOT_DURATION } from '../lib/time'
import { PRESET_COLORS } from '../lib/colors'
import * as ops from '../lib/slotOps'

export const DEFAULT_WAKE_MINUTES = 7 * 60
export const DEFAULT_SLEEP_MINUTES = 23 * 60

export interface SelectedSlot {
  routineId: string
  slotId: string
}

function createDefaultRoutine(name: string): Routine {
  return {
    id: createId(),
    name,
    wakeMinutes: DEFAULT_WAKE_MINUTES,
    sleepMinutes: DEFAULT_SLEEP_MINUTES,
    slots: []
  }
}

/** Cycles through the preset palette so each new-from-scratch slot gets a different color. */
let nextColorIndex = 0
function nextSlotColor(): string {
  const color = PRESET_COLORS[nextColorIndex % PRESET_COLORS.length]
  nextColorIndex += 1
  return color
}

function duplicateRoutineData(routine: Routine): Routine {
  return {
    ...routine,
    id: createId(),
    name: `${routine.name} (copy)`,
    slots: routine.slots.map((s) => ({ ...s, id: createId() }))
  }
}

interface RoutinesState {
  routines: Routine[]
  loaded: boolean
  selectedSlot: SelectedSlot | null

  init(): Promise<void>
  addRoutine(): void
  duplicateRoutine(routineId: string): void
  deleteRoutine(routineId: string): void
  renameRoutine(routineId: string, name: string): void
  setWake(routineId: string, rawMinutes: number): void
  setSleep(routineId: string, rawMinutes: number): void
  resizeSlotEdge(routineId: string, slotId: string, edge: 'start' | 'end', rawMinutes: number): void
  moveSlot(routineId: string, slotId: string, rawStartMinutes: number): void
  createSlotAt(routineId: string, startMinutes: number, endMinutes: number): void
  addSlot(routineId: string): void
  duplicateSlot(routineId: string, slotId: string): void
  deleteSlot(routineId: string, slotId: string): void
  updateSlotTitle(routineId: string, slotId: string, title: string): void
  updateSlotColor(routineId: string, slotId: string, color: string): void
  selectSlot(routineId: string, slotId: string): void
  clearSelection(): void
  deleteSelectedSlot(): void
}

function updateRoutine(
  routines: Routine[],
  routineId: string,
  update: (r: Routine) => Routine
): Routine[] {
  return routines.map((r) => (r.id === routineId ? update(r) : r))
}

export const useRoutinesStore = create<RoutinesState>()(
  subscribeWithSelector((set, get) => ({
    routines: [],
    loaded: false,
    selectedSlot: null,

    async init() {
      const data = await window.routinesAPI.load()
      set({ routines: data.routines, loaded: true })
    },

    addRoutine() {
      const routine = createDefaultRoutine(`Routine ${get().routines.length + 1}`)
      set((state) => ({ routines: [...state.routines, routine] }))
    },

    duplicateRoutine(routineId) {
      set((state) => {
        const idx = state.routines.findIndex((r) => r.id === routineId)
        if (idx === -1) return state
        const copy = duplicateRoutineData(state.routines[idx])
        const routines = state.routines.slice()
        routines.splice(idx + 1, 0, copy)
        return { routines }
      })
    },

    deleteRoutine(routineId) {
      set((state) => ({
        routines: state.routines.filter((r) => r.id !== routineId),
        selectedSlot: state.selectedSlot?.routineId === routineId ? null : state.selectedSlot
      }))
    },

    renameRoutine(routineId, name) {
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) => ({ ...r, name }))
      }))
    },

    setWake(routineId, rawMinutes) {
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) => ops.setWakeMinutes(r, rawMinutes))
      }))
    },

    setSleep(routineId, rawMinutes) {
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) => ops.setSleepMinutes(r, rawMinutes))
      }))
    },

    resizeSlotEdge(routineId, slotId, edge, rawMinutes) {
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) =>
          ops.resizeSlotEdge(r, slotId, edge, rawMinutes)
        )
      }))
    },

    moveSlot(routineId, slotId, rawStartMinutes) {
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) =>
          ops.moveSlot(r, slotId, rawStartMinutes)
        )
      }))
    },

    createSlotAt(routineId, startMinutes, endMinutes) {
      let createdId: string | null = null
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) => {
          const { routine, slot } = ops.createSlotAt(
            r,
            startMinutes,
            endMinutes,
            nextSlotColor(),
            'New Slot'
          )
          createdId = slot.id
          return routine
        })
      }))
      if (createdId) set({ selectedSlot: { routineId, slotId: createdId } })
    },

    addSlot(routineId) {
      let createdId: string | null = null
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) => {
          const { routine, slot } = ops.addSlotToGap(
            r,
            DEFAULT_SLOT_DURATION,
            nextSlotColor(),
            'New Slot'
          )
          createdId = slot?.id ?? null
          return routine
        })
      }))
      if (createdId) set({ selectedSlot: { routineId, slotId: createdId } })
    },

    duplicateSlot(routineId, slotId) {
      let createdId: string | null = null
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) => {
          const { routine, slot } = ops.duplicateSlot(r, slotId)
          createdId = slot?.id ?? null
          return routine
        })
      }))
      if (createdId) set({ selectedSlot: { routineId, slotId: createdId } })
    },

    deleteSlot(routineId, slotId) {
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) => ops.deleteSlot(r, slotId)),
        selectedSlot:
          state.selectedSlot?.routineId === routineId && state.selectedSlot?.slotId === slotId
            ? null
            : state.selectedSlot
      }))
    },

    updateSlotTitle(routineId, slotId, title) {
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) =>
          ops.updateSlot(r, slotId, { title })
        )
      }))
    },

    updateSlotColor(routineId, slotId, color) {
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) =>
          ops.updateSlot(r, slotId, { color })
        )
      }))
    },

    selectSlot(routineId, slotId) {
      set({ selectedSlot: { routineId, slotId } })
    },

    clearSelection() {
      set({ selectedSlot: null })
    },

    deleteSelectedSlot() {
      const sel = get().selectedSlot
      if (!sel) return
      get().deleteSlot(sel.routineId, sel.slotId)
    }
  }))
)

let saveTimer: ReturnType<typeof setTimeout> | null = null
useRoutinesStore.subscribe(
  (state) => state.routines,
  (routines) => {
    if (!useRoutinesStore.getState().loaded) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      window.routinesAPI.save({ version: 1, routines })
    }, 400)
  }
)
