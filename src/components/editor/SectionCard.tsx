import { memo, useEffect, useId, useRef, useState } from 'react'
import { CV_LABELS, sectionTitle } from '../../i18n/cvLabels'
import { useResumeStore } from '../../store/resumeStore'
import { selectLanguage, selectSection } from './helpers'
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, EyeIcon, EyeOffIcon } from './icons'
import ItemList from './ItemList'
import { DragHandle } from './sortable'
import { useSortableRow } from './useSortableRow'
import SummaryEditor from './SummaryEditor'
import { Checkbox, ConfirmDeleteButton, IconButton } from './ui'
import { cx } from './styles'

interface SectionCardProps {
  sectionId: string
  index: number
  count: number
  isNew: boolean
}

function ReferencesOptions({ sectionId }: { sectionId: string }) {
  const onRequest = useResumeStore((s) => {
    const sec = selectSection(sectionId)(s)
    return sec?.type === 'references' && sec.onRequest
  })
  const language = useResumeStore(selectLanguage)
  const updateSection = useResumeStore((s) => s.updateSection)
  return (
    <div className="space-y-3">
      <div>
        <Checkbox
          label="Referencje na życzenie"
          checked={onRequest}
          onChange={(checked) => updateSection(sectionId, { onRequest: checked })}
        />
        {onRequest && (
          <p className="mt-1 pl-6 text-xs leading-snug text-slate-500">
            Zamiast listy osób CV pokaże zdanie: „{CV_LABELS[language].referencesOnRequest}”
          </p>
        )}
      </div>
      <ItemList sectionId={sectionId} type="references" dimmed={onRequest} />
    </div>
  )
}

export default memo(function SectionCard({ sectionId, index, count, isNew }: SectionCardProps) {
  const type = useResumeStore((s) => selectSection(sectionId)(s)?.type)
  const title = useResumeStore((s) => selectSection(sectionId)(s)?.title ?? '')
  const visible = useResumeStore((s) => selectSection(sectionId)(s)?.visible ?? true)
  const language = useResumeStore(selectLanguage)
  const updateSection = useResumeStore((s) => s.updateSection)
  const moveSection = useResumeStore((s) => s.moveSection)
  const removeSection = useResumeStore((s) => s.removeSection)

  const { setNodeRef, style, isDragging, handle } = useSortableRow(sectionId)
  const [open, setOpen] = useState(true)
  const bodyId = useId()
  const headingId = useId()
  const rootRef = useRef<HTMLLIElement | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Bring a freshly added section into view and focus its first control.
  useEffect(() => {
    if (!isNew) return
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    bodyRef.current?.querySelector<HTMLElement>('textarea, input, button')?.focus({ preventScroll: true })
  }, [isNew])

  if (!type) return null
  const defaultTitle = sectionTitle({ type, title: '' }, language)
  const name = title.trim() || defaultTitle

  return (
    <li
      ref={(el) => {
        setNodeRef(el)
        rootRef.current = el
      }}
      style={style}
      aria-labelledby={headingId}
      className={cx(
        'scroll-mt-4 rounded-xl border bg-white',
        isDragging ? 'border-indigo-300 shadow-xl' : visible ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50/70',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 p-2">
        <div className="flex min-w-[12rem] flex-1 items-center gap-1">
          <DragHandle handle={handle} label={`Przeciągnij, aby zmienić kolejność sekcji: ${name}`} />
          <span className="w-5 shrink-0 text-center text-xs font-medium text-slate-400 tabular-nums" aria-hidden="true">
            {index + 1}
          </span>
          <h3 id={headingId} className="sr-only">
            {name}
          </h3>
          <input
            type="text"
            aria-label={`Nagłówek sekcji (puste = „${defaultTitle}”)`}
            placeholder={defaultTitle}
            value={title}
            onChange={(e) => updateSection(sectionId, { title: e.target.value })}
            className={cx(
              'min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-[15px] font-semibold',
              'hover:border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-500/20',
              visible ? 'text-slate-900 placeholder:text-slate-800' : 'text-slate-500 placeholder:text-slate-500',
            )}
          />
          {!visible && (
            <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              Ukryta
            </span>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center">
          <IconButton
            label={visible ? `Ukryj sekcję w CV: ${name}` : `Pokaż sekcję w CV: ${name}`}
            aria-pressed={!visible}
            tone="accent"
            onClick={() => updateSection(sectionId, { visible: !visible })}
          >
            {visible ? <EyeIcon /> : <EyeOffIcon />}
          </IconButton>
          <IconButton label={`Przesuń sekcję w górę: ${name}`} disabled={index === 0} onClick={() => moveSection(sectionId, -1)}>
            <ArrowUpIcon />
          </IconButton>
          <IconButton
            label={`Przesuń sekcję w dół: ${name}`}
            disabled={index === count - 1}
            onClick={() => moveSection(sectionId, 1)}
          >
            <ArrowDownIcon />
          </IconButton>
          <ConfirmDeleteButton label={`Usuń sekcję: ${name}`} onConfirm={() => removeSection(sectionId)} />
          <IconButton
            label={open ? `Zwiń sekcję: ${name}` : `Rozwiń sekcję: ${name}`}
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen((o) => !o)}
          >
            <ChevronDownIcon className={cx('transition-transform', !open && '-rotate-90')} />
          </IconButton>
        </div>
      </div>
      {open && (
        <div id={bodyId} ref={bodyRef} className="border-t border-slate-100 px-3 pt-3 pb-3 @md:px-4">
          {type === 'summary' ? (
            <SummaryEditor sectionId={sectionId} />
          ) : type === 'references' ? (
            <ReferencesOptions sectionId={sectionId} />
          ) : (
            <ItemList sectionId={sectionId} type={type} />
          )}
        </div>
      )}
    </li>
  )
})
