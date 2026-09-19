import type { ReactElement } from 'react'
import { formatMinutes, minutesToPercent } from '../lib/time'

interface Props {
  rangeStart: number
  rangeEnd: number
}

/** Picks a tick spacing that keeps roughly 6-14 ticks across the visible range. */
function pickStepMinutes(rangeMinutes: number): number {
  if (rangeMinutes <= 6 * 60) return 30
  if (rangeMinutes <= 14 * 60) return 60
  return 120
}

export default function TimelineRuler({ rangeStart, rangeEnd }: Props): ReactElement {
  const step = pickStepMinutes(rangeEnd - rangeStart)
  const first = Math.ceil(rangeStart / step) * step
  const ticks: number[] = []
  for (let m = first; m <= rangeEnd; m += step) ticks.push(m)

  return (
    <div className="timeline-ruler">
      {ticks.map((m) => (
        <span key={m} className="tick" style={{ left: `${minutesToPercent(m, rangeStart, rangeEnd)}%` }}>
          {formatMinutes(m)}
        </span>
      ))}
    </div>
  )
}
