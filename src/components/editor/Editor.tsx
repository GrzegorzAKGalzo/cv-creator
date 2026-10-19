import { useState } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import AddSection from './AddSection'
import PersonalForm from './PersonalForm'
import SectionList from './SectionList'

/** Left panel: all CV forms. Renders nothing until the shell creates a resume. */
export default function Editor() {
  const activeId = useResumeStore((s) => (s.resumes.some((r) => r.id === s.activeId) ? s.activeId : null))
  const [newSectionId, setNewSectionId] = useState<string | null>(null)

  if (!activeId) return null

  return (
    // key: reset local UI state (open panels, "new" markers) when switching resumes
    <div key={activeId} className="@container w-full bg-white">
      <div className="space-y-6 px-4 py-5 @md:px-6">
        <PersonalForm />
        <section aria-labelledby="sections-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
            <h2 id="sections-heading" className="text-[15px] font-semibold text-slate-900">
              Sekcje
            </h2>
            <p className="text-xs text-slate-500">Kolejność tutaj = kolejność w CV</p>
          </div>
          <SectionList newSectionId={newSectionId} />
          <div className="mt-3">
            <AddSection onAdded={setNewSectionId} />
          </div>
        </section>
      </div>
    </div>
  )
}
