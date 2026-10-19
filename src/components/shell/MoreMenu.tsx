import { useEffect, useRef, type ChangeEvent, type ReactNode } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import { createEmptyResume } from '../../lib/factory'
import { downloadResumeJson, parseResumeJson } from '../../lib/importExport'
import { createSampleResume } from '../../data/sample'
import { focusFirstItem, handleMenuKeys, usePopover } from './usePopover'
import { confirmDialog } from './confirm'
import { toast } from './toast'
import { EraserIcon, FileTextIcon, MoreIcon, SaveIcon, UploadIcon } from './icons'

const MAX_FILE_BYTES = 5 * 1024 * 1024

const getActive = () => {
  const { resumes, activeId } = useResumeStore.getState()
  return resumes.find((r) => r.id === activeId)
}

export default function MoreMenu() {
  const { open, setOpen, close, toggle, triggerRef, panelRef } = usePopover()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) focusFirstItem(panelRef.current)
  }, [open, panelRef])

  const exportJson = () => {
    close()
    const r = getActive()
    if (!r) return
    downloadResumeJson(r)
    toast.success('Zapisano kopię CV do pliku JSON.')
  }

  const pickFile = () => {
    close()
    fileRef.current?.click()
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      toast.error('Plik jest za duży (maks. 5 MB). Wybierz kopię CV zapisaną w CV Kreatorze.')
      return
    }
    try {
      const resume = parseResumeJson(await file.text())
      useResumeStore.getState().importResume(resume)
      toast.success(`Wczytano „${resume.name}” i ustawiono jako bieżące CV.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nie udało się wczytać pliku.')
    }
  }

  const loadSample = async () => {
    close()
    const r = getActive()
    if (!r) return
    const ok = await confirmDialog({
      title: 'Wczytać przykładowe dane?',
      message: `Treść CV „${r.name}” zostanie zastąpiona przykładem w języku ${
        r.language === 'pl' ? 'polskim' : 'angielskim'
      }. Nazwa CV się nie zmieni.`,
      confirmLabel: 'Wczytaj przykład',
    })
    if (!ok) return
    useResumeStore.getState().replaceActiveContent(createSampleResume(r.language))
    toast.success('Wczytano przykładowe dane.')
  }

  const clearAll = async () => {
    close()
    const r = getActive()
    if (!r) return
    const ok = await confirmDialog({
      title: 'Wyczyścić treść CV?',
      message: `Wszystkie dane i sekcje w „${r.name}” zostaną usunięte. Ustawienia wyglądu zostaną zachowane.`,
      confirmLabel: 'Wyczyść',
      danger: true,
    })
    if (!ok) return
    const empty = createEmptyResume(r.language)
    useResumeStore.getState().replaceActiveContent({ ...empty, settings: r.settings })
    toast.success('Wyczyszczono treść CV.')
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Więcej opcji"
        title="Więcej"
        className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 aria-expanded:bg-slate-100"
      >
        <MoreIcon size={18} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={onFile}
        tabIndex={-1}
        aria-hidden="true"
      />

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Więcej opcji"
          onKeyDown={(e) => (e.key === 'Tab' ? setOpen(false) : handleMenuKeys(e))}
          className="pop-in absolute top-full right-0 z-50 mt-1.5 w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
        >
          <MenuItem icon={<SaveIcon />} onClick={exportJson} hint="Kopia zapasowa do przeniesienia lub archiwum">
            Zapisz kopię (JSON)
          </MenuItem>
          <MenuItem icon={<UploadIcon />} onClick={pickFile} hint="Dodaje CV z pliku jako nowe">
            Wczytaj z pliku JSON…
          </MenuItem>
          <div role="separator" className="my-1.5 h-px bg-slate-100" />
          <MenuItem icon={<FileTextIcon />} onClick={loadSample} hint="Zobacz, jak może wyglądać gotowe CV">
            Wczytaj przykładowe dane
          </MenuItem>
          <MenuItem icon={<EraserIcon />} onClick={clearAll} danger>
            Wyczyść treść CV
          </MenuItem>
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  icon: ReactNode
  onClick: () => void
  children: ReactNode
  hint?: string
  danger?: boolean
}

function MenuItem({ icon, onClick, children, hint, danger = false }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left outline-none focus-visible:bg-slate-100 ${
        danger ? 'text-rose-700 hover:bg-rose-50 focus-visible:bg-rose-50' : 'text-slate-800 hover:bg-slate-100'
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${danger ? 'text-rose-600' : 'text-slate-500'}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{children}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
      </span>
    </button>
  )
}
