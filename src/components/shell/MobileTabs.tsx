import type { KeyboardEvent } from 'react'
import { useUiStore, type MobileTab } from './uiStore'
import { EditIcon, EyeIcon } from './icons'

const TABS: { id: MobileTab; label: string; icon: typeof EditIcon; panel: string }[] = [
  { id: 'edit', label: 'Edycja', icon: EditIcon, panel: 'pane-editor' },
  { id: 'preview', label: 'Podgląd', icon: EyeIcon, panel: 'pane-preview' },
]

/** Edit / preview switch shown below the lg breakpoint. */
export default function MobileTabs() {
  const tab = useUiStore((s) => s.tab)
  const setTab = useUiStore((s) => s.setTab)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const next = tab === 'edit' ? 'preview' : 'edit'
    setTab(next)
    document.getElementById(`tab-${next}`)?.focus()
  }

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
      <div
        role="tablist"
        aria-label="Widok"
        onKeyDown={onKeyDown}
        className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1"
      >
        {TABS.map((t) => {
          const selected = tab === t.id
          const Icon = t.icon
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={t.panel}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`flex h-8 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${
                selected
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
