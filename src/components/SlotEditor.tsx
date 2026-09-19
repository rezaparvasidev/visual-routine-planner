import { useEffect, useRef, type ReactElement } from 'react'
import type { Slot } from '@shared/domain'
import { formatMinutes } from '../lib/time'
import ColorPicker from './ColorPicker'

interface Props {
  slot: Slot
  autoFocus: boolean
  onTitleChange: (title: string) => void
  onColorChange: (color: string) => void
  onClose: () => void
}

export default function SlotEditor({
  slot,
  autoFocus,
  onTitleChange,
  onColorChange,
  onClose
}: Props): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [autoFocus])

  useEffect(() => {
    function handlePointerDown(e: globalThis.PointerEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="slot-editor"
      ref={rootRef}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="slot-editor-time">
        {formatMinutes(slot.startMinutes)} – {formatMinutes(slot.endMinutes)}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={slot.title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Slot title"
      />
      <ColorPicker value={slot.color} onChange={onColorChange} />
    </div>
  )
}
