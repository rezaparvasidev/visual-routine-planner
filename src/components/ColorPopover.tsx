import { useEffect, useRef, type ReactElement } from 'react'
import ColorPicker from './ColorPicker'

interface Props {
  color: string
  onChange: (color: string) => void
  onClose: () => void
}

/** Opened only by the slot's own "Color" toolbar button - never auto-shown. */
export default function ColorPopover({ color, onChange, onClose }: Props): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(e: globalThis.PointerEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [onClose])

  return (
    <div className="color-popover" ref={rootRef} onPointerDown={(e) => e.stopPropagation()}>
      <ColorPicker value={color} onChange={onChange} />
    </div>
  )
}
