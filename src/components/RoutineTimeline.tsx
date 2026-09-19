import { useRef, useState, type PointerEvent, type ReactElement } from 'react'
import { useRoutinesStore } from '../state/routinesStore'
import { findEnclosingGap, findGaps } from '../lib/slotOps'
import {
  DAY_MARKER_MINUTES,
  MIN_SLOT_DURATION,
  computeViewRange,
  formatMinutes,
  minutesToPercent,
  pixelsToMinutes,
  snapMinutes
} from '../lib/time'
import TimelineRuler from './TimelineRuler'
import RoutineOverview from './RoutineOverview'
import SlotBlock from './SlotBlock'

interface DraftRange {
  anchor: number
  current: number
  gapStart: number
  gapEnd: number
}

interface Props {
  routineId: string
}

export default function RoutineTimeline({ routineId }: Props): ReactElement | null {
  const routine = useRoutinesStore((s) => s.routines.find((r) => r.id === routineId))
  const setWake = useRoutinesStore((s) => s.setWake)
  const setSleep = useRoutinesStore((s) => s.setSleep)
  const createSlotAt = useRoutinesStore((s) => s.createSlotAt)
  const addSlot = useRoutinesStore((s) => s.addSlot)
  const duplicateRoutine = useRoutinesStore((s) => s.duplicateRoutine)
  const deleteRoutine = useRoutinesStore((s) => s.deleteRoutine)
  const renameRoutine = useRoutinesStore((s) => s.renameRoutine)
  const clearSelection = useRoutinesStore((s) => s.clearSelection)

  const trackRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<DraftRange | null>(null)

  if (!routine) return null

  const { start: viewStart, end: viewEnd } = computeViewRange(routine.wakeMinutes, routine.sleepMinutes)
  const canAddSlot = findGaps(routine).some((g) => g.end - g.start >= MIN_SLOT_DURATION)

  const handleTrackPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    if (e.target !== trackRef.current) return
    clearSelection()
    const rect = trackRef.current.getBoundingClientRect()
    const raw = pixelsToMinutes(e.clientX - rect.left, rect.width, viewStart, viewEnd)
    const minutes = snapMinutes(raw)
    if (minutes < routine.wakeMinutes || minutes > routine.sleepMinutes) return
    const gap = findEnclosingGap(routine, minutes)
    if (!gap) return
    trackRef.current.setPointerCapture(e.pointerId)
    setDraft({ anchor: minutes, current: minutes, gapStart: gap.start, gapEnd: gap.end })
  }

  const handleTrackPointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    if (!draft || e.buttons === 0) return
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const raw = pixelsToMinutes(e.clientX - rect.left, rect.width, viewStart, viewEnd)
    const clamped = Math.min(Math.max(snapMinutes(raw), draft.gapStart), draft.gapEnd)
    setDraft({ ...draft, current: clamped })
  }

  const handleTrackPointerUp = (e: PointerEvent<HTMLDivElement>): void => {
    if (!draft) return
    trackRef.current?.releasePointerCapture(e.pointerId)
    const start = Math.min(draft.anchor, draft.current)
    const end = Math.max(draft.anchor, draft.current)
    setDraft(null)
    if (end - start >= MIN_SLOT_DURATION) {
      createSlotAt(routineId, start, end)
    }
  }

  const draftLeft = draft
    ? minutesToPercent(Math.min(draft.anchor, draft.current), viewStart, viewEnd)
    : 0
  const draftWidth = draft
    ? minutesToPercent(Math.max(draft.anchor, draft.current), viewStart, viewEnd) - draftLeft
    : 0
  const wakePercent = minutesToPercent(routine.wakeMinutes, viewStart, viewEnd)
  const sleepPercent = minutesToPercent(routine.sleepMinutes, viewStart, viewEnd)

  const gridLines: { minutes: number; isHour: boolean }[] = []
  for (let m = viewStart; m <= viewEnd; m += 30) {
    gridLines.push({ minutes: m, isHour: m % 60 === 0 })
  }
  const markers = DAY_MARKER_MINUTES.filter((m) => m >= viewStart && m <= viewEnd)

  return (
    <div className="routine-timeline">
      <div className="routine-header">
        <input
          type="text"
          className="routine-name-input"
          value={routine.name}
          onChange={(e) => renameRoutine(routineId, e.target.value)}
        />
        <div className="routine-actions">
          <button onClick={() => addSlot(routineId)} disabled={!canAddSlot}>
            + Add Slot
          </button>
          <button onClick={() => duplicateRoutine(routineId)}>Duplicate Routine</button>
          <button
            className="danger"
            onClick={() => {
              if (window.confirm(`Delete routine "${routine.name}"?`)) {
                deleteRoutine(routineId)
              }
            }}
          >
            Delete Routine
          </button>
        </div>
      </div>
      <div className="bounds-row">
        <span
          className="bounds-label bounds-label--wake"
          style={{ left: `${minutesToPercent(routine.wakeMinutes)}%` }}
        >
          Wake {formatMinutes(routine.wakeMinutes)}
        </span>
        <span
          className="bounds-label bounds-label--sleep"
          style={{ left: `${minutesToPercent(routine.sleepMinutes)}%` }}
        >
          Sleep {formatMinutes(routine.sleepMinutes)}
        </span>
      </div>
      <RoutineOverview
        routine={routine}
        onDragWake={(m) => setWake(routineId, m)}
        onDragSleep={(m) => setSleep(routineId, m)}
      />
      <TimelineRuler rangeStart={viewStart} rangeEnd={viewEnd} />
      <div
        className="timeline-track"
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
      >
        {gridLines.map((g) => (
          <div
            key={g.minutes}
            className={`grid-line${g.isHour ? ' grid-line--hour' : ''}`}
            style={{ left: `${minutesToPercent(g.minutes, viewStart, viewEnd)}%` }}
          />
        ))}
        {markers.map((m) => (
          <div
            key={m}
            className="marker-line"
            style={{ left: `${minutesToPercent(m, viewStart, viewEnd)}%` }}
          />
        ))}
        <div className="inactive-region" style={{ left: 0, width: `${wakePercent}%` }} />
        <div
          className="inactive-region"
          style={{ left: `${sleepPercent}%`, width: `${100 - sleepPercent}%` }}
        />
        {draft && (
          <div className="draft-slot" style={{ left: `${draftLeft}%`, width: `${draftWidth}%` }} />
        )}
        {routine.slots.map((slot) => (
          <SlotBlock
            key={slot.id}
            routineId={routineId}
            slot={slot}
            trackRef={trackRef}
            viewStart={viewStart}
            viewEnd={viewEnd}
          />
        ))}
      </div>
    </div>
  )
}
