import { useMemo, type ReactElement } from 'react'
import { PRESET_COLORS } from '../lib/colors'
import { useRoutinesStore } from '../state/routinesStore'

interface Props {
  value: string
  onChange: (color: string) => void
}

function isSameColor(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

export default function ColorPicker({ value, onChange }: Props): ReactElement {
  const routines = useRoutinesStore((s) => s.routines)
  const pushHistory = useRoutinesStore((s) => s.pushHistory)
  const customColors = useMemo(() => {
    const used: string[] = []
    for (const routine of routines) {
      for (const slot of routine.slots) {
        if (
          !PRESET_COLORS.some((p) => isSameColor(p, slot.color)) &&
          !used.some((c) => isSameColor(c, slot.color))
        ) {
          used.push(slot.color)
        }
      }
    }
    return used
  }, [routines])

  return (
    <div className="color-picker">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`color-swatch${isSameColor(value, color) ? ' is-selected' : ''}`}
          style={{ background: color }}
          onClick={() => {
            pushHistory()
            onChange(color)
          }}
          aria-label={`Color ${color}`}
        />
      ))}
      {customColors.length > 0 && <div className="color-picker-divider" />}
      {customColors.map((color) => (
        <button
          key={color}
          type="button"
          className={`color-swatch${isSameColor(value, color) ? ' is-selected' : ''}`}
          style={{ background: color }}
          onClick={() => {
            pushHistory()
            onChange(color)
          }}
          aria-label={`Custom color ${color}`}
          title={color}
        />
      ))}
      <input
        type="color"
        className="color-swatch-custom"
        value={value}
        onFocus={() => pushHistory()}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Custom color"
        title="Pick a new custom color"
      />
    </div>
  )
}
