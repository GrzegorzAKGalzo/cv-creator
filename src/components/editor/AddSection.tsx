import { useId, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { CV_LABELS } from '../../i18n/cvLabels'
import { REPEATABLE_SECTIONS, SECTION_TYPES } from '../../lib/factory'
import { useResumeStore } from '../../store/resumeStore'
import { SECTION_DESCRIPTIONS, selectActive } from './helpers'
import { PlusIcon } from './icons'
import { cx, focusRing } from './styles'

export default function AddSection({ onAdded }: { onAdded: (sectionId: string) => void }) {
  const present = useResumeStore(useShallow((s) => selectActive(s)?.sections.map((x) => x.type) ?? []))
  const addSection = useResumeStore((s) => s.addSection)
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const available = SECTION_TYPES.filter((t) => REPEATABLE_SECTIONS.includes(t) || !present.includes(t))

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50/60',
          focusRing,
        )}
      >
        <PlusIcon className={cx('transition-transform', open && 'rotate-45')} />
        {open ? 'Zamknij' : 'Dodaj sekcję'}
      </button>
      {open && (
        <ul id={panelId} className="grid grid-cols-1 gap-1 border-t border-slate-100 p-2 @md:grid-cols-2">
          {available.map((type) => (
            <li key={type}>
              <button
                type="button"
                onClick={() => {
                  onAdded(addSection(type))
                  setOpen(false)
                }}
                className={cx('w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50', focusRing)}
              >
                <span className="block text-sm font-medium text-slate-900">{CV_LABELS.pl.sections[type]}</span>
                <span className="block text-xs leading-snug text-slate-500">{SECTION_DESCRIPTIONS[type]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
