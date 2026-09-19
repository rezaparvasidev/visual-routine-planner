import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type RefObject
} from 'react'
import type { Slot } from '@shared/domain'
import { formatDuration, formatMinutes, minutesToPercent, pixelsToMinutes, snapMinutes } from '../lib/time'
import { useRoutinesStore } from '../state/routinesStore'
import ColorPopover from './ColorPopover'

const MOVE_THRESHOLD_PX = 3
const TITLE_FONT_SIZE = 13
const TITLE_FONT_SIZE_SHRUNK = 11

interface Props {
  routineId: string
  slot: Slot
  trackRef: RefObject<HTMLDivElement | null>
  viewStart: number
  viewEnd: number
}

export default function SlotBlock({ routineId, slot, trackRef, viewStart, viewEnd }: Props): ReactElement {
  const resizeSlotEdge = useRoutinesStore((s) => s.resizeSlotEdge)
  const moveSlot = useRoutinesStore((s) => s.moveSlot)
  const duplicateSlot = useRoutinesStore((s) => s.duplicateSlot)
  const deleteSlot = useRoutinesStore((s) => s.deleteSlot)
  const updateSlotTitle = useRoutinesStore((s) => s.updateSlotTitle)
  const updateSlotColor = useRoutinesStore((s) => s.updateSlotColor)
  const selectSlot = useRoutinesStore((s) => s.selectSlot)
  const isSelected = useRoutinesStore(
    (s) => s.selectedSlot?.routineId === routineId && s.selectedSlot?.slotId === slot.id
  )

  const [isMoving, setIsMoving] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const dragStartClientX = useRef<number | null>(null)
  const dragStartMinutes = useRef(0)
  const didMove = useRef(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLSpanElement>(null)
  const [titleFontSize, setTitleFontSize] = useState<number>(TITLE_FONT_SIZE)
  const [titleTruncated, setTitleTruncated] = useState(false)

  useEffect(() => {
    if (!isSelected) setColorPickerOpen(false)
  }, [isSelected])

  useEffect(() => {
    if (isRenaming) {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }
  }, [isRenaming])

  useLayoutEffect(() => {
    const el = titleRef.current
    const container = el?.parentElement
    if (!el || !container) return

    function measure(): void {
      if (!el || !container) return
      // The title span shrinks to fit its own text, so it never reports a
      // resize itself - measure against the container's available width.
      const available = container.clientWidth
      el.style.fontSize = `${TITLE_FONT_SIZE}px`
      if (el.scrollWidth <= available) {
        setTitleFontSize(TITLE_FONT_SIZE)
        setTitleTruncated(false)
        return
      }
      el.style.fontSize = `${TITLE_FONT_SIZE_SHRUNK}px`
      if (el.scrollWidth <= available) {
        setTitleFontSize(TITLE_FONT_SIZE_SHRUNK)
        setTitleTruncated(false)
        return
      }
      el.style.fontSize = `${TITLE_FONT_SIZE}px`
      setTitleFontSize(TITLE_FONT_SIZE)
      setTitleTruncated(true)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [slot.title, isRenaming])

  const leftPercent = minutesToPercent(slot.startMinutes, viewStart, viewEnd)
  const widthPercent = minutesToPercent(slot.endMinutes, viewStart, viewEnd) - leftPercent

  const handleBlockPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStartClientX.current = e.clientX
    dragStartMinutes.current = slot.startMinutes
    didMove.current = false
  }

  const handleBlockPointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    if (e.buttons === 0 || dragStartClientX.current === null) return
    const deltaPx = e.clientX - dragStartClientX.current
    if (!didMove.current) {
      if (Math.abs(deltaPx) < MOVE_THRESHOLD_PX) return
      didMove.current = true
      setIsMoving(true)
    }
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const deltaMinutes = pixelsToMinutes(deltaPx, rect.width, 0, viewEnd - viewStart)
    const rawStart = snapMinutes(dragStartMinutes.current + deltaMinutes)
    moveSlot(routineId, slot.id, rawStart)
  }

  const handleBlockPointerUp = (e: PointerEvent<HTMLDivElement>): void => {
    e.stopPropagation()
    e.currentTarget.releasePointerCapture(e.pointerId)
    dragStartClientX.current = null
    setIsMoving(false)
    selectSlot(routineId, slot.id)
  }

  const handleDoubleClick = (): void => {
    selectSlot(routineId, slot.id)
    setIsRenaming(true)
  }

  const handleTitleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    updateSlotTitle(routineId, slot.id, e.target.value)
  }

  const handleTitleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.currentTarget.blur()
    }
  }

  const handleEdgePointerDown = (
    e: PointerEvent<HTMLDivElement>,
    edge: 'start' | 'end'
  ): void => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.dataset.edge = edge
    selectSlot(routineId, slot.id)
  }

  const handleEdgePointerMove = (
    e: PointerEvent<HTMLDivElement>,
    edge: 'start' | 'end'
  ): void => {
    if (e.buttons === 0) return
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const raw = pixelsToMinutes(px, rect.width, viewStart, viewEnd)
    resizeSlotEdge(routineId, slot.id, edge, snapMinutes(raw))
  }

  const handleEdgePointerUp = (e: PointerEvent<HTMLDivElement>): void => {
    e.stopPropagation()
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div
      className={`slot-block${isSelected ? ' is-selected' : ''}${isMoving ? ' is-moving' : ''}`}
      style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, background: slot.color }}
      onPointerDown={handleBlockPointerDown}
      onPointerMove={handleBlockPointerMove}
      onPointerUp={handleBlockPointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {isSelected && (
        <>
          <div className="slot-time-label slot-time-label--start">
            {formatMinutes(slot.startMinutes)}
          </div>
          <div className="slot-time-label slot-time-label--end">
            {formatMinutes(slot.endMinutes)}
          </div>
        </>
      )}

      <div className="slot-content">
        {isRenaming ? (
          <input
            ref={titleInputRef}
            type="text"
            className="slot-title-input"
            value={slot.title}
            onChange={handleTitleInputChange}
            onKeyDown={handleTitleInputKeyDown}
            onBlur={() => setIsRenaming(false)}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            ref={titleRef}
            className="slot-title"
            style={{ fontSize: titleFontSize }}
            title={titleTruncated ? slot.title : undefined}
          >
            {slot.title}
          </span>
        )}
        {!isRenaming && (
          <span className="slot-duration">
            {formatDuration(slot.endMinutes - slot.startMinutes)}
          </span>
        )}
      </div>

      {isSelected && !isRenaming && (
        <div className="slot-tools" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="slot-tool-btn"
            title="Change color"
            onClick={(e) => {
              e.stopPropagation()
              setColorPickerOpen((v) => !v)
            }}
          >
            🎨
          </button>
          <button
            type="button"
            className="slot-tool-btn"
            title="Duplicate slot"
            onClick={(e) => {
              e.stopPropagation()
              duplicateSlot(routineId, slot.id)
            }}
          >
            ⧉
          </button>
          <button
            type="button"
            className="slot-tool-btn"
            title="Delete slot"
            onClick={(e) => {
              e.stopPropagation()
              deleteSlot(routineId, slot.id)
            }}
          >
            🗑
          </button>
        </div>
      )}

      <div
        className="slot-edge slot-edge--left"
        onPointerDown={(e) => handleEdgePointerDown(e, 'start')}
        onPointerMove={(e) => handleEdgePointerMove(e, 'start')}
        onPointerUp={handleEdgePointerUp}
      />
      <div
        className="slot-edge slot-edge--right"
        onPointerDown={(e) => handleEdgePointerDown(e, 'end')}
        onPointerMove={(e) => handleEdgePointerMove(e, 'end')}
        onPointerUp={handleEdgePointerUp}
      />

      {isSelected && colorPickerOpen && (
        <ColorPopover
          color={slot.color}
          onChange={(color) => updateSlotColor(routineId, slot.id, color)}
          onClose={() => setColorPickerOpen(false)}
        />
      )}
    </div>
  )
}
