import { useRef, useState, type ReactElement } from 'react'
import { useRoutinesStore } from '../state/routinesStore'

export default function AppToolbar(): ReactElement {
  const canUndo = useRoutinesStore((s) => s.past.length > 0)
  const canRedo = useRoutinesStore((s) => s.future.length > 0)
  const undo = useRoutinesStore((s) => s.undo)
  const redo = useRoutinesStore((s) => s.redo)
  const saveNow = useRoutinesStore((s) => s.saveNow)

  const [savedVisible, setSavedVisible] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSave = async (): Promise<void> => {
    await saveNow()
    setSavedVisible(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSavedVisible(false), 1500)
  }

  return (
    <div className="app-toolbar">
      <button type="button" onClick={undo} disabled={!canUndo} title="Undo">
        ↶ Undo
      </button>
      <button type="button" onClick={redo} disabled={!canRedo} title="Redo">
        ↷ Redo
      </button>
      <button type="button" onClick={handleSave} title="Save now">
        Save
      </button>
      {savedVisible && <span className="app-toolbar-saved">Saved</span>}
    </div>
  )
}
