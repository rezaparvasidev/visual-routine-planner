import type { ReactElement } from 'react'
import { useRoutinesStore } from '../state/routinesStore'
import RoutineTimeline from './RoutineTimeline'

export default function RoutineList(): ReactElement {
  const routines = useRoutinesStore((s) => s.routines)
  const addRoutine = useRoutinesStore((s) => s.addRoutine)

  return (
    <div className="routine-list">
      {routines.length === 0 && (
        <div className="empty-state">
          No routines yet. Click “+ Add Routine” to create your first day routine.
        </div>
      )}
      {routines.map((routine) => (
        <RoutineTimeline key={routine.id} routineId={routine.id} />
      ))}
      <div>
        <button className="primary" onClick={addRoutine}>
          + Add Routine
        </button>
      </div>
    </div>
  )
}
