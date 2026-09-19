import type { ReactElement } from 'react'

const HOURS = Array.from({ length: 13 }, (_, i) => i * 2) // every 2 hours: 0,2,...,24

function formatHour(h: number): string {
  const hour24 = h % 24
  const period = hour24 < 12 ? 'AM' : 'PM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return h === 24 ? '12 AM' : `${hour12} ${period}`
}

export default function TimelineRuler(): ReactElement {
  return (
    <div className="timeline-ruler">
      {HOURS.map((h) => (
        <span key={h} className="tick" style={{ left: `${(h / 24) * 100}%` }}>
          {formatHour(h)}
        </span>
      ))}
    </div>
  )
}
