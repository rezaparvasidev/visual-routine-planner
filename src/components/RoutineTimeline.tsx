import { useEffect, useRef, useState, type PointerEvent, type ReactElement } from 'react'
import { useRoutinesStore } from '../state/routinesStore'
import { findEnclosingGap, findGaps } from '../lib/slotOps'
import { MIN_SLOT_DURATION, pixelsToMinutes, snapMinutes } from '../lib/time'
import TimelineRuler from './TimelineRuler'
import WakeSleepHandle from './WakeSleepHandle'
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
  const deleteRoutine = useRoutinesStore((s) => s.deleteRoutine)
  const renameRoutine = useRoutinesStore((s) => s.renameRoutine)
  const pendingEditSlotId = useRoutinesStore((s) => s.pendingEditSlotId)
  const clearPendingEdit = useRoutinesStore((s) => s.clearPendingEdit)

  const trackRef = useRef<HTMLDivElement>(null)
  const [openEditorSlotId, setOpenEditorSlotId] = useState<string | null>(null)
  const [autoFocusSlotId, setAutoFocusSlotId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftRange | null>(null)

  useEffect(() => {
    if (pendingEditSlotId && routine?.slots.some((s) => s.id === pendingEditSlotId)) {
      setOpenEditorSlotId(pendingEditSlotId)
      setAutoFocusSlotId(pendingEditSlotId)
      clearPendingEdit()
    }
  }, [pendingEditSlotId, routine, clearPendingEdit])

  if (!routine) return null

  const canAddSlot = findGaps(routine).some((g) => g.end - g.start >= MIN_SLOT_DURATION)

  const handleTrackPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    if (e.target !== trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const raw = pixelsToMinutes(e.clientX - rect.left, rect.width)
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
    const raw = pixelsToMinutes(e.clientX - rect.left, rect.width)
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

  const draftLeft = draft ? (Math.min(draft.anchor, draft.current) / 1440) * 100 : 0
  const draftWidth = draft ? (Math.abs(draft.current - draft.anchor) / 1440) * 100 : 0
  const wakePercent = (routine.wakeMinutes / 1440) * 100
  const sleepPercent = (routine.sleepMinutes / 1440) * 100

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
      <TimelineRuler />
      <div
        className="timeline-track"
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
      >
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
            isOpen={openEditorSlotId === slot.id}
            autoFocus={autoFocusSlotId === slot.id}
            onOpen={() => {
              setOpenEditorSlotId(slot.id)
              setAutoFocusSlotId(null)
            }}
            onClose={() => {
              setOpenEditorSlotId((cur) => (cur === slot.id ? null : cur))
              setAutoFocusSlotId((cur) => (cur === slot.id ? null : cur))
            }}
          />
        ))}
        <WakeSleepHandle
          trackRef={trackRef}
          minutes={routine.wakeMinutes}
          onDrag={(m) => setWake(routineId, m)}
          label="Wake"
        />
        <WakeSleepHandle
          trackRef={trackRef}
          minutes={routine.sleepMinutes}
          onDrag={(m) => setSleep(routineId, m)}
          label="Sleep"
        />
      </div>
    </div>
  )
}
