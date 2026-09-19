import type { Routine, Slot } from '@shared/domain'
import { createId } from './id'
import { DAY_MINUTES, MIN_RANGE, MIN_SLOT_DURATION, clamp } from './time'

export interface Gap {
  start: number
  end: number
}

/** Free (unscheduled) time ranges within [routine.wakeMinutes, routine.sleepMinutes]. */
export function findGaps(routine: Routine): Gap[] {
  const gaps: Gap[] = []
  let cursor = routine.wakeMinutes
  for (const slot of routine.slots) {
    if (slot.startMinutes > cursor) gaps.push({ start: cursor, end: slot.startMinutes })
    cursor = Math.max(cursor, slot.endMinutes)
  }
  if (cursor < routine.sleepMinutes) gaps.push({ start: cursor, end: routine.sleepMinutes })
  return gaps
}

export function findEnclosingGap(routine: Routine, minutes: number): Gap | null {
  return findGaps(routine).find((g) => minutes >= g.start && minutes <= g.end) ?? null
}

/**
 * Moves the wake (left) handle. Clamped to [0, 1440], to a minimum MIN_RANGE
 * separation from sleepMinutes, and to never move past the start of the
 * first slot (so no slot is ever orphaned outside the active range).
 */
export function setWakeMinutes(routine: Routine, rawMinutes: number): Routine {
  const outerLimit = routine.slots.length
    ? routine.slots[0].startMinutes
    : routine.sleepMinutes - MIN_RANGE
  const upperBound = Math.min(outerLimit, routine.sleepMinutes - MIN_RANGE)
  const wakeMinutes = clamp(rawMinutes, 0, upperBound)
  return { ...routine, wakeMinutes }
}

/**
 * Moves the sleep (right) handle. Symmetric to setWakeMinutes: clamped to
 * never move past the end of the last slot.
 */
export function setSleepMinutes(routine: Routine, rawMinutes: number): Routine {
  const outerLimit = routine.slots.length
    ? routine.slots[routine.slots.length - 1].endMinutes
    : routine.wakeMinutes + MIN_RANGE
  const lowerBound = Math.max(outerLimit, routine.wakeMinutes + MIN_RANGE)
  const sleepMinutes = clamp(rawMinutes, lowerBound, DAY_MINUTES)
  return { ...routine, sleepMinutes }
}

/**
 * Drags one edge of a slot. If the drag would overlap the neighboring slot,
 * the neighbor's facing edge is pushed to match, down to the neighbor's own
 * MIN_SLOT_DURATION floor, at which point the drag stops advancing. Does not
 * cascade past the immediate neighbor.
 */
export function resizeSlotEdge(
  routine: Routine,
  slotId: string,
  edge: 'start' | 'end',
  rawMinutes: number
): Routine {
  const slots = routine.slots
  const i = slots.findIndex((s) => s.id === slotId)
  if (i === -1) return routine
  const slot = slots[i]
  const next = slots.slice()

  if (edge === 'start') {
    const floor = i === 0 ? routine.wakeMinutes : slots[i - 1].startMinutes + MIN_SLOT_DURATION
    let desiredStart = clamp(rawMinutes, floor, slot.endMinutes - MIN_SLOT_DURATION)

    if (i > 0) {
      const prev = slots[i - 1]
      if (desiredStart < prev.endMinutes) {
        const newPrevEnd = Math.max(desiredStart, prev.startMinutes + MIN_SLOT_DURATION)
        next[i - 1] = { ...prev, endMinutes: newPrevEnd }
        desiredStart = Math.max(desiredStart, newPrevEnd)
      }
    }
    next[i] = { ...slot, startMinutes: desiredStart }
  } else {
    const ceiling =
      i === slots.length - 1 ? routine.sleepMinutes : slots[i + 1].endMinutes - MIN_SLOT_DURATION
    let desiredEnd = clamp(rawMinutes, slot.startMinutes + MIN_SLOT_DURATION, ceiling)

    if (i < slots.length - 1) {
      const following = slots[i + 1]
      if (desiredEnd > following.startMinutes) {
        const newFollowingStart = Math.min(desiredEnd, following.endMinutes - MIN_SLOT_DURATION)
        next[i + 1] = { ...following, startMinutes: newFollowingStart }
        desiredEnd = Math.min(desiredEnd, newFollowingStart)
      }
    }
    next[i] = { ...slot, endMinutes: desiredEnd }
  }

  return { ...routine, slots: next }
}

/**
 * Slides a whole slot earlier/later by the same amount on both edges,
 * preserving its duration. Clamped to the gap bounded by its neighbors (or
 * the wake/sleep bounds) so it never overlaps or pushes anything else.
 */
export function moveSlot(routine: Routine, slotId: string, rawStartMinutes: number): Routine {
  const slots = routine.slots
  const i = slots.findIndex((s) => s.id === slotId)
  if (i === -1) return routine
  const slot = slots[i]
  const duration = slot.endMinutes - slot.startMinutes

  const lowerBound = i === 0 ? routine.wakeMinutes : slots[i - 1].endMinutes
  const upperBound = i === slots.length - 1 ? routine.sleepMinutes : slots[i + 1].startMinutes
  const startMinutes = clamp(rawStartMinutes, lowerBound, upperBound - duration)

  const next = slots.slice()
  next[i] = { ...slot, startMinutes, endMinutes: startMinutes + duration }
  return { ...routine, slots: next }
}

/** Inserts a slot at an exact (already-validated) time range, e.g. from a click-drag gesture. */
export function createSlotAt(
  routine: Routine,
  startMinutes: number,
  endMinutes: number,
  color: string,
  title: string
): { routine: Routine; slot: Slot } {
  const start = Math.min(startMinutes, endMinutes)
  const end = Math.max(startMinutes, endMinutes)
  const slot: Slot = { id: createId(), startMinutes: start, endMinutes: end, color, title }
  const slots = [...routine.slots, slot].sort((a, b) => a.startMinutes - b.startMinutes)
  return { routine: { ...routine, slots }, slot }
}

/**
 * Finds the first (chronologically earliest) gap >= duration and places a
 * slot at its start. If none is large enough, shrinks to fit the largest
 * gap >= MIN_SLOT_DURATION. Returns slot: null if there is no room at all.
 */
export function addSlotToGap(
  routine: Routine,
  duration: number,
  color: string,
  title: string
): { routine: Routine; slot: Slot | null } {
  const gaps = findGaps(routine)
  const exact = gaps.find((g) => g.end - g.start >= duration)

  let start: number
  let end: number
  if (exact) {
    start = exact.start
    end = exact.start + duration
  } else {
    const largest = gaps.reduce<Gap | null>(
      (best, g) => (!best || g.end - g.start > best.end - best.start ? g : best),
      null
    )
    if (!largest || largest.end - largest.start < MIN_SLOT_DURATION) {
      return { routine, slot: null }
    }
    start = largest.start
    end = largest.end
  }

  return createSlotAt(routine, start, end, color, title)
}

/**
 * Places a copy immediately after the original, shrinking to fit if needed,
 * or falling back to the best available gap anywhere in the routine.
 */
export function duplicateSlot(
  routine: Routine,
  slotId: string
): { routine: Routine; slot: Slot | null } {
  const slots = routine.slots
  const idx = slots.findIndex((s) => s.id === slotId)
  if (idx === -1) return { routine, slot: null }

  const original = slots[idx]
  const duration = original.endMinutes - original.startMinutes
  const title = `${original.title} (copy)`
  const followingLimit = idx < slots.length - 1 ? slots[idx + 1].startMinutes : routine.sleepMinutes
  const availableAfter = followingLimit - original.endMinutes

  if (availableAfter >= MIN_SLOT_DURATION) {
    const end = Math.min(original.endMinutes + duration, followingLimit)
    return createSlotAt(routine, original.endMinutes, end, original.color, title)
  }

  return addSlotToGap(routine, duration, original.color, title)
}

export function deleteSlot(routine: Routine, slotId: string): Routine {
  return { ...routine, slots: routine.slots.filter((s) => s.id !== slotId) }
}

export function updateSlot(
  routine: Routine,
  slotId: string,
  patch: Partial<Pick<Slot, 'title' | 'color'>>
): Routine {
  return {
    ...routine,
    slots: routine.slots.map((s) => (s.id === slotId ? { ...s, ...patch } : s))
  }
}
