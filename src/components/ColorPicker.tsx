import type { ReactElement } from 'react'
import { PRESET_COLORS } from '../lib/colors'

interface Props {
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ value, onChange }: Props): ReactElement {
  return (
    <div className="color-picker">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`color-swatch${value.toLowerCase() === color.toLowerCase() ? ' is-selected' : ''}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
          aria-label={`Color ${color}`}
        />
      ))}
      <input
        type="color"
        className="color-swatch-custom"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Custom color"
      />
    </div>
  )
}
