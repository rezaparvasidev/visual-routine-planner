/** Minutes since midnight, 0-1440. There are no dates anywhere in this app. */
export type Minutes = number

export interface Slot {
  id: string
  startMinutes: Minutes
  endMinutes: Minutes
  color: string
  title: string
}

export interface Routine {
  id: string
  name: string
  wakeMinutes: Minutes
  sleepMinutes: Minutes
  /** Always kept sorted ascending by startMinutes. */
  slots: Slot[]
}

export interface PersistedData {
  version: 1
  routines: Routine[]
}

export const EMPTY_PERSISTED_DATA: PersistedData = { version: 1, routines: [] }
