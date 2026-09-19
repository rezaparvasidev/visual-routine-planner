import { useEffect, type ReactElement } from 'react'
import { useRoutinesStore } from './state/routinesStore'
import RoutineList from './components/RoutineList'
import AppToolbar from './components/AppToolbar'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

export default function App(): ReactElement {
  const loaded = useRoutinesStore((s) => s.loaded)
  const init = useRoutinesStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (isEditableTarget(e.target)) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (useRoutinesStore.getState().selectedSlot) {
          e.preventDefault()
          useRoutinesStore.getState().deleteSelectedSlot()
        }
      } else if (e.key === 'Escape') {
        useRoutinesStore.getState().clearSelection()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="app">
      {loaded && <AppToolbar />}
      {loaded ? <RoutineList /> : <div className="app-loading">Loading routines…</div>}
    </div>
  )
}
