import { useShallow } from 'zustand/shallow'
import { useResumeStore } from '../../store/resumeStore'
import { selectActive } from './helpers'
import SectionCard from './SectionCard'
import { SortableList } from './sortable'

export default function SectionList({ newSectionId }: { newSectionId: string | null }) {
  const ids = useResumeStore(useShallow((s) => selectActive(s)?.sections.map((x) => x.id) ?? []))
  const reorderSections = useResumeStore((s) => s.reorderSections)

  if (ids.length === 0)
    return <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Dodaj pierwszą sekcję poniżej.</p>

  return (
    <SortableList ids={ids} onReorder={reorderSections}>
      <ul className="space-y-3">
        {ids.map((id, index) => (
          <SectionCard key={id} sectionId={id} index={index} count={ids.length} isNew={id === newSectionId} />
        ))}
      </ul>
    </SortableList>
  )
}
