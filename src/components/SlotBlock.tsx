import { useRef, useState, type PointerEvent, type ReactElement, type RefObject } from 'react'
import type { Slot } from '@shared/domain'
import { pixelsToMinutes, snapMinutes } from '../lib/time'
import { useRoutinesStore } from '../state/routinesStore'
import SlotEditor from './SlotEditor'

const MOVE_THRESHOLD_PX = 3

interface Props {
  routineId: string
  slot: Slot
  trackRef: RefObject<HTMLDivElement | null>
  isOpen: boolean
  autoFocus: boolean
  onOpen: () => void
  onClose: () => void
}

export default function SlotBlock({
  routineId,
  slot,
  trackRef,
  isOpen,
  autoFocus,
  onOpen,
  onClose
}: Props): ReactElement {
  const resizeSlotEdge = useRoutinesStore((s) => s.resizeSlotEdge)
  const moveSlot = useRoutinesStore((s) => s.moveSlot)
  const duplicateSlot = useRoutinesStore((s) => s.duplicateSlot)
  const deleteSlot = useRoutinesStore((s) => s.deleteSlot)
  const updateSlotTitle = useRoutinesStore((s) => s.updateSlotTitle)
  const updateSlotColor = useRoutinesStore((s) => s.updateSlotColor)

  const [isMoving, setIsMoving] = useState(false)
  const dragStartClientX = useRef<number | null>(null)
  const dragStartMinutes = useRef(0)
  const didMove = useRef(false)

  const leftPercent = (slot.startMinutes / 1440) * 100
  const widthPercent = ((slot.endMinutes - slot.startMinutes) / 1440) * 100

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
    const deltaMinutes = pixelsToMinutes(deltaPx, rect.width)
    const rawStart = snapMinutes(dragStartMinutes.current + deltaMinutes)
    moveSlot(routineId, slot.id, rawStart)
  }

  const handleBlockPointerUp = (e: PointerEvent<HTMLDivElement>): void => {
    e.stopPropagation()
    e.currentTarget.releasePointerCapture(e.pointerId)
    dragStartClientX.current = null
    setIsMoving(false)
    if (!didMove.current) {
      onOpen()
    }
  }

  const handleEdgePointerDown = (
    e: PointerEvent<HTMLDivElement>,
    edge: 'start' | 'end'
  ): void => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.dataset.edge = edge
  }

  const handleEdgePointerMove = (
    e: PointerEvent<HTMLDivElement>,
    edge: 'start' | 'end'
  ): void => {
    if (e.buttons === 0) return
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = e.clientX - rect.left
    const raw = pixelsToMinutes(px, rect.width)
    resizeSlotEdge(routineId, slot.id, edge, snapMinutes(raw))
  }

  const handleEdgePointerUp = (e: PointerEvent<HTMLDivElement>): void => {
    e.stopPropagation()
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div
      className={`slot-block${isOpen ? ' is-open' : ''}${isMoving ? ' is-moving' : ''}`}
      style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, background: slot.color }}
      onPointerDown={handleBlockPointerDown}
      onPointerMove={handleBlockPointerMove}
      onPointerUp={handleBlockPointerUp}
    >
      <span className="slot-title">{slot.title}</span>
      <div className="slot-tools">
        <button
          type="button"
          className="slot-tool-btn"
          title="Duplicate slot"
          onPointerDown={(e) => e.stopPropagation()}
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
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            deleteSlot(routineId, slot.id)
          }}
        >
          ✕
        </button>
      </div>
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
      {isOpen && (
        <SlotEditor
          slot={slot}
          autoFocus={autoFocus}
          onTitleChange={(title) => updateSlotTitle(routineId, slot.id, title)}
          onColorChange={(color) => updateSlotColor(routineId, slot.id, color)}
          onClose={onClose}
        />
      )}
    </div>
  )
}
