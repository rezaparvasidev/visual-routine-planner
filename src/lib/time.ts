import type { Minutes } from '@shared/domain'

export const DAY_MINUTES = 1440
export const SNAP_MINUTES = 5
export const MIN_SLOT_DURATION = 10
export const MIN_RANGE = 30
export const DEFAULT_SLOT_DURATION = 30

export function minutesToPixels(minutes: Minutes, containerWidthPx: number): number {
  return (minutes / DAY_MINUTES) * containerWidthPx
}

export function pixelsToMinutes(px: number, containerWidthPx: number): Minutes {
  if (containerWidthPx <= 0) return 0
  return (px / containerWidthPx) * DAY_MINUTES
}

export function snapMinutes(minutes: Minutes): Minutes {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function formatMinutes(minutes: Minutes): string {
  const m = Math.round(clamp(minutes, 0, DAY_MINUTES))
  const h = Math.floor(m / 60) % 24
  const mm = m % 60
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(mm).padStart(2, '0')} ${period}`
}
