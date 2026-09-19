import type { PointerEvent, ReactElement, RefObject } from 'react'
import { formatMinutes, pixelsToMinutes, snapMinutes } from '../lib/time'

interface Props {
  trackRef: RefObject<HTMLDivElement | null>
  minutes: number
  onDrag: (minutes: number) => void
  label: 'Wake' | 'Sleep'
}

export default function WakeSleepHandle({ trackRef, minutes, onDrag, label }: Props): ReactElement {
  const percent = (minutes / 1440) * 100

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    if (e.buttons === 0) return
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const raw = pixelsToMinutes(px, rect.width)
    onDrag(snapMinutes(raw))
  }

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>): void => {
    e.stopPropagation()
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div
      className={`wake-sleep-handle wake-sleep-handle--${label.toLowerCase()}`}
      style={{ left: `${percent}%` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      title={`${label}: ${formatMinutes(minutes)}`}
    >
      <span className="handle-label">
        {label} {formatMinutes(minutes)}
      </span>
    </div>
  )
}
