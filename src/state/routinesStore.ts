import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Routine } from '@shared/domain'
import { createId } from '../lib/id'
import { DEFAULT_SLOT_DURATION } from '../lib/time'
import * as ops from '../lib/slotOps'

export const DEFAULT_SLOT_COLOR = '#4C8BF5'
export const DEFAULT_WAKE_MINUTES = 7 * 60
export const DEFAULT_SLEEP_MINUTES = 23 * 60

function createDefaultRoutine(name: string): Routine {
  return {
    id: createId(),
    name,
    wakeMinutes: DEFAULT_WAKE_MINUTES,
    sleepMinutes: DEFAULT_SLEEP_MINUTES,
    slots: []
  }
}

interface RoutinesState {
  routines: Routine[]
  loaded: boolean
  /** Slot that should have its editor auto-opened right after creation. */
  pendingEditSlotId: string | null

  init(): Promise<void>
  addRoutine(): void
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
  clearPendingEdit(): void
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
    pendingEditSlotId: null,

    async init() {
      const data = await window.routinesAPI.load()
      set({ routines: data.routines, loaded: true })
    },

    addRoutine() {
      const routine = createDefaultRoutine(`Routine ${get().routines.length + 1}`)
      set((state) => ({ routines: [...state.routines, routine] }))
    },

    deleteRoutine(routineId) {
      set((state) => ({ routines: state.routines.filter((r) => r.id !== routineId) }))
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
            DEFAULT_SLOT_COLOR,
            'New Slot'
          )
          createdId = slot.id
          return routine
        })
      }))
      if (createdId) set({ pendingEditSlotId: createdId })
    },

    addSlot(routineId) {
      let createdId: string | null = null
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) => {
          const { routine, slot } = ops.addSlotToGap(
            r,
            DEFAULT_SLOT_DURATION,
            DEFAULT_SLOT_COLOR,
            'New Slot'
          )
          createdId = slot?.id ?? null
          return routine
        })
      }))
      if (createdId) set({ pendingEditSlotId: createdId })
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
      if (createdId) set({ pendingEditSlotId: createdId })
    },

    deleteSlot(routineId, slotId) {
      set((state) => ({
        routines: updateRoutine(state.routines, routineId, (r) => ops.deleteSlot(r, slotId))
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

    clearPendingEdit() {
      set({ pendingEditSlotId: null })
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
