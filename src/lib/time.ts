import type { Minutes } from '@shared/domain'

export const DAY_MINUTES = 1440
export const SNAP_MINUTES = 30
export const MIN_SLOT_DURATION = 30
export const MIN_RANGE = 30
export const DEFAULT_SLOT_DURATION = 30
/** How much blocked, non-editable time to show before wake / after sleep on the main timeline. */
export const VIEW_PADDING_MINUTES = 60
/** Fixed reference points marked with a red line on every timeline: 12:00 PM and 6:00 PM. */
export const DAY_MARKER_MINUTES: Minutes[] = [12 * 60, 18 * 60]

export function minutesToPercent(
  minutes: Minutes,
  rangeStart: Minutes = 0,
  rangeEnd: Minutes = DAY_MINUTES
): number {
  const span = rangeEnd - rangeStart
  if (span <= 0) return 0
  return ((minutes - rangeStart) / span) * 100
}

export function pixelsToMinutes(
  px: number,
  containerWidthPx: number,
  rangeStart: Minutes = 0,
  rangeEnd: Minutes = DAY_MINUTES
): Minutes {
  if (containerWidthPx <= 0) return rangeStart
  return rangeStart + (px / containerWidthPx) * (rangeEnd - rangeStart)
}

export function snapMinutes(minutes: Minutes): Minutes {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** The main timeline's visible window: wake/sleep plus a blocked buffer, clamped to the day. */
export function computeViewRange(
  wakeMinutes: Minutes,
  sleepMinutes: Minutes,
  padding: Minutes = VIEW_PADDING_MINUTES
): { start: Minutes; end: Minutes } {
  return {
    start: clamp(wakeMinutes - padding, 0, DAY_MINUTES),
    end: clamp(sleepMinutes + padding, 0, DAY_MINUTES)
  }
}

export function formatMinutes(minutes: Minutes): string {
  const m = Math.round(clamp(minutes, 0, DAY_MINUTES))
  const h = Math.floor(m / 60) % 24
  const mm = m % 60
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(mm).padStart(2, '0')} ${period}`
}
