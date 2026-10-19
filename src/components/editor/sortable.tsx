import type { ReactNode } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Announcements, DragEndEvent, UniqueIdentifier } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { GripIcon } from './icons'
import type { HandleProps } from './useSortableRow'
import { cx, focusRing } from './styles'

interface SortableListProps {
  ids: string[]
  onReorder: (orderedIds: string[]) => void
  children: ReactNode
}

/** Vertical sortable list (pointer + keyboard) with Polish screen-reader announcements. */
export function SortableList({ ids, onReorder, children }: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const pos = (id: UniqueIdentifier | undefined) => ids.indexOf(String(id)) + 1
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Podniesiono element z pozycji ${pos(active.id)} z ${ids.length}.`,
    onDragOver: ({ over }) => (over ? `Element nad pozycją ${pos(over.id)} z ${ids.length}.` : 'Element poza listą.'),
    onDragEnd: ({ over }) => (over ? `Upuszczono element na pozycji ${pos(over.id)} z ${ids.length}.` : 'Upuszczono element.'),
    onDragCancel: () => 'Anulowano przenoszenie.',
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    onReorder(arrayMove(ids, from, to))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'Aby podnieść element, naciśnij spację lub Enter. Strzałkami zmieniasz pozycję, spacją upuszczasz, a Escape anuluje.',
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}

export function DragHandle({ handle, label, className }: { handle: HandleProps; label: string; className?: string }) {
  const { attributes, listeners, setActivatorNodeRef } = handle
  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={label}
      title="Przeciągnij, aby zmienić kolejność"
      className={cx(
        'inline-flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing',
        focusRing,
        className,
      )}
    >
      <GripIcon />
    </button>
  )
}
