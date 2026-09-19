import { useRef, type ReactElement } from 'react'
import type { Routine } from '@shared/domain'
import { minutesToPercent } from '../lib/time'
import WakeSleepHandle from './WakeSleepHandle'

interface Props {
  routine: Routine
  onDragWake: (minutes: number) => void
  onDragSleep: (minutes: number) => void
}

/** Full-day (0-24h) minimap: the only place wake/sleep are adjusted. */
export default function RoutineOverview({ routine, onDragWake, onDragSleep }: Props): ReactElement {
  const trackRef = useRef<HTMLDivElement>(null)
  const wakePercent = minutesToPercent(routine.wakeMinutes)
  const sleepPercent = minutesToPercent(routine.sleepMinutes)

  return (
    <div className="routine-overview" ref={trackRef}>
      <div className="overview-inactive" style={{ left: 0, width: `${wakePercent}%` }} />
      <div
        className="overview-inactive"
        style={{ left: `${sleepPercent}%`, width: `${100 - sleepPercent}%` }}
      />
      <div
        className="overview-active"
        style={{ left: `${wakePercent}%`, width: `${sleepPercent - wakePercent}%` }}
      />
      <WakeSleepHandle trackRef={trackRef} minutes={routine.wakeMinutes} onDrag={onDragWake} label="Wake" />
      <WakeSleepHandle
        trackRef={trackRef}
        minutes={routine.sleepMinutes}
        onDrag={onDragSleep}
        label="Sleep"
      />
    </div>
  )
}
