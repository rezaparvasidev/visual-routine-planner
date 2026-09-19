import { useEffect, type ReactElement } from 'react'
import { useRoutinesStore } from './state/routinesStore'
import RoutineList from './components/RoutineList'

export default function App(): ReactElement {
  const loaded = useRoutinesStore((s) => s.loaded)
  const init = useRoutinesStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <div className="app">
      <div className="app-header">
        <h1>Visual Routine Planner</h1>
      </div>
      {loaded ? <RoutineList /> : <div className="app-loading">Loading routines…</div>}
    </div>
  )
}
