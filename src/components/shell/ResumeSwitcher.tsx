import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { CvLanguage, Resume } from '../../types/resume'
import { useActiveResume, useResumeStore } from '../../store/resumeStore'
import { usePopover } from './usePopover'
import { confirmDialog } from './confirm'
import { toast } from './toast'
import { CheckIcon, ChevronDownIcon, CopyIcon, GlobeIcon, PencilIcon, PlusIcon, TrashIcon } from './icons'

const dateFmt = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })

function formatUpdated(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const today = new Date()
  if (d.toDateString() === today.toDateString()) {
    return `dziś, ${d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`
  }
  return dateFmt.format(d)
}

function LangBadge({
  language,
  active = false,
  className = '',
}: {
  language: CvLanguage
  active?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex h-[18px] shrink-0 items-center rounded px-1 text-[10.5px] font-semibold tracking-wide ${className} ${
        active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {language.toUpperCase()}
    </span>
  )
}

export default function ResumeSwitcher() {
  const active = useActiveResume()
  const resumes = useResumeStore((s) => s.resumes)
  const { setActive, createResume, duplicateResume, renameResume, deleteResume } = useResumeStore.getState()
  const { open, close, toggle, triggerRef, panelRef } = usePopover()
  const [renamingState, setRenamingId] = useState<string | null>(null)
  const renamingId = open ? renamingState : null

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('[aria-current="true"]')?.focus()
  }, [open, panelRef])

  if (!active) return null
  const otherLang: CvLanguage = active.language === 'pl' ? 'en' : 'pl'
  const sorted = [...resumes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const run = (fn: () => void, message?: string) => {
    fn()
    close()
    if (message) toast.success(message)
  }

  const remove = async (r: Resume) => {
    close()
    const ok = await confirmDialog({
      title: `Usunąć „${r.name}”?`,
      message: 'Tego CV nie da się przywrócić. Jeśli chcesz zachować kopię, najpierw zapisz je do pliku JSON.',
      confirmLabel: 'Usuń CV',
      danger: true,
    })
    if (!ok) return
    deleteResume(r.id)
    if (useResumeStore.getState().resumes.length === 0) createResume('pl')
    toast.success(`Usunięto „${r.name}”.`)
  }

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setRenamingId(null)
          toggle()
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-9 max-w-full min-w-0 items-center gap-2 rounded-lg px-2.5 text-left hover:bg-slate-100 aria-expanded:bg-slate-100"
      >
        <span className="sr-only">Wybierz CV: </span>
        <span className="truncate text-sm font-medium text-slate-900">{active.name || 'Bez nazwy'}</span>
        <LangBadge language={active.language} className="max-sm:hidden" />
        <ChevronDownIcon className="shrink-0 text-slate-500" />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Twoje CV"
          className="pop-in fixed inset-x-3 top-14 z-50 mt-1 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 sm:absolute sm:inset-x-auto sm:top-full sm:left-0 sm:w-[380px]"
        >
          <div className="flex items-baseline justify-between px-4 pt-3.5 pb-2">
            <h2 className="text-sm font-semibold text-slate-900">Twoje CV</h2>
            <span className="text-xs text-slate-500">{resumes.length}</span>
          </div>
          <ul className="max-h-[min(50vh,320px)] overflow-y-auto px-1.5 pb-1.5">
            {sorted.map((r) => (
              <ResumeRow
                key={r.id}
                resume={r}
                isActive={r.id === active.id}
                renaming={renamingId === r.id}
                onSelect={() => run(() => setActive(r.id))}
                onStartRename={() => setRenamingId(r.id)}
                onRename={(name) => {
                  renameResume(r.id, name)
                  setRenamingId(null)
                }}
                onCancelRename={() => setRenamingId(null)}
                onDelete={() => remove(r)}
              />
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-1 border-t border-slate-200 p-1.5">
            <ActionButton onClick={() => run(() => createResume('pl'), 'Utworzono nowe CV (PL).')}>
              <PlusIcon /> Nowe CV (PL)
            </ActionButton>
            <ActionButton onClick={() => run(() => createResume('en'), 'Utworzono nowe CV (EN).')}>
              <PlusIcon /> Nowe CV (EN)
            </ActionButton>
            <ActionButton onClick={() => run(() => duplicateResume(active.id), 'Utworzono kopię CV.')}>
              <CopyIcon /> Duplikuj
            </ActionButton>
            <ActionButton
              onClick={() =>
                run(
                  () => duplicateResume(active.id, otherLang),
                  otherLang === 'en'
                    ? 'Utworzono wersję angielską. Przetłumacz teraz treść pól.'
                    : 'Utworzono wersję polską. Przetłumacz teraz treść pól.',
                )
              }
            >
              <GlobeIcon /> {otherLang === 'en' ? 'Wersja angielska' : 'Wersja polska'}
            </ActionButton>
          </div>
          <p className="border-t border-slate-100 px-4 py-2.5 text-xs leading-relaxed text-slate-500">
            {otherLang === 'en' ? 'Wersja angielska' : 'Wersja polska'} to kopia bieżącego CV z językiem{' '}
            {otherLang === 'en' ? 'angielskim' : 'polskim'} – nagłówki zmienią się same, treść przetłumacz ręcznie.
          </p>
        </div>
      )}
    </div>
  )
}

function ActionButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 [&>svg]:shrink-0 [&>svg]:text-slate-500"
    >
      {children}
    </button>
  )
}

interface RowProps {
  resume: Resume
  isActive: boolean
  renaming: boolean
  onSelect: () => void
  onStartRename: () => void
  onRename: (name: string) => void
  onCancelRename: () => void
  onDelete: () => void
}

function RenameInput({
  name,
  onRename,
  onCancel,
}: {
  name: string
  onRename: (name: string) => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(name)

  useEffect(() => inputRef.current?.select(), [])

  const commit = () => {
    const next = draft.trim()
    if (next && next !== name) onRename(next)
    else onCancel()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onCancel()
    }
  }

  return (
    <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        aria-label="Nazwa CV"
        maxLength={80}
        className="h-8 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />
      <span className="text-[11px] text-slate-500">Enter – zapisz</span>
    </li>
  )
}

function ResumeRow({
  resume,
  isActive,
  renaming,
  onSelect,
  onStartRename,
  onRename,
  onCancelRename,
  onDelete,
}: RowProps) {
  if (renaming) return <RenameInput name={resume.name} onRename={onRename} onCancel={onCancelRename} />

  return (
    <li className="group flex items-center rounded-lg hover:bg-slate-50">
      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left"
      >
        <span
          className={`grid size-4 shrink-0 place-items-center ${isActive ? 'text-indigo-600' : 'text-transparent'}`}
        >
          <CheckIcon size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className={`truncate text-sm ${isActive ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>
              {resume.name || 'Bez nazwy'}
            </span>
            <LangBadge language={resume.language} active={isActive} />
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">Zmieniono {formatUpdated(resume.updatedAt)}</span>
        </span>
      </button>
      <div className="flex shrink-0 pr-1.5 opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onStartRename}
          aria-label={`Zmień nazwę: ${resume.name}`}
          title="Zmień nazwę"
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900"
        >
          <PencilIcon size={15} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Usuń: ${resume.name}`}
          title="Usuń"
          className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        >
          <TrashIcon size={15} />
        </button>
      </div>
    </li>
  )
}
