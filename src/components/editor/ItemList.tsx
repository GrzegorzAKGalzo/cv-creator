import { useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { useResumeStore } from '../../store/resumeStore'
import { ADD_ITEM_LABELS, COMPACT_SECTIONS, selectSection } from './helpers'
import type { ItemSectionType } from './helpers'
import { CompactRow, ItemCard } from './ItemRows'
import { SortableList } from './sortable'
import { AddButton } from './ui'
import { cx } from './styles'

const EMPTY_HINTS: Partial<Record<ItemSectionType, string>> = {
  experience: 'Zacznij od najnowszego stanowiska.',
  education: 'Zacznij od najwyższego ukończonego poziomu.',
  skills: 'Dodaj 5–10 umiejętności związanych z ofertą.',
  languages: 'Podaj język i poziom znajomości (np. B2).',
}

/** Sortable list of items in a section plus the "+ Dodaj …" button. */
export default function ItemList({ sectionId, type, dimmed }: { sectionId: string; type: ItemSectionType; dimmed?: boolean }) {
  const ids = useResumeStore(
    useShallow((s) => {
      const sec = selectSection(sectionId)(s)
      return sec && 'items' in sec ? sec.items.map((i) => i.id) : []
    }),
  )
  const addItem = useResumeStore((s) => s.addItem)
  const reorderItems = useResumeStore((s) => s.reorderItems)
  const [newId, setNewId] = useState<string | null>(null)
  const Row = COMPACT_SECTIONS.includes(type) ? CompactRow : ItemCard

  return (
    <div className={cx(dimmed && 'opacity-60')}>
      {ids.length === 0 ? (
        <p className="mb-2 text-sm text-slate-500">{EMPTY_HINTS[type] ?? 'Ta sekcja jest pusta.'}</p>
      ) : (
        <SortableList ids={ids} onReorder={(order) => reorderItems(sectionId, order)}>
          <ul className={cx('mb-2', COMPACT_SECTIONS.includes(type) ? 'space-y-1.5' : 'space-y-2')}>
            {ids.map((id, index) => (
              <Row
                key={id}
                sectionId={sectionId}
                itemId={id}
                type={type}
                index={index}
                count={ids.length}
                isNew={id === newId}
              />
            ))}
          </ul>
        </SortableList>
      )}
      <AddButton className="-ml-2.5" onClick={() => setNewId(addItem(sectionId))}>
        {ADD_ITEM_LABELS[type]}
      </AddButton>
    </div>
  )
}
