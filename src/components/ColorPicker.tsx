import type { ReactElement } from 'react'

const PRESET_COLORS = [
  '#4C8BF5',
  '#F5734C',
  '#4CD97B',
  '#F5C84C',
  '#B14CF5',
  '#F54C8B',
  '#4CDBF5',
  '#8B8B8B',
  '#F54C4C'
]

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
