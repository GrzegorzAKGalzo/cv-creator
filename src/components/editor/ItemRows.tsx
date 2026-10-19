import { memo, useEffect, useId, useRef, useState } from 'react'
import { CV_LABELS } from '../../i18n/cvLabels'
import { useResumeStore } from '../../store/resumeStore'
import type { AnyItem, LanguageItem, LanguageLevel, SkillItem } from '../../types/resume'
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon } from './icons'
import { ItemForm } from './itemForms'
import { UNTITLED, itemDates, itemHeadline, selectItem, selectLanguage } from './helpers'
import type { ItemSectionType } from './helpers'
import SkillLevelPicker from './SkillLevelPicker'
import { DragHandle } from './sortable'
import { useSortableRow } from './useSortableRow'
import { ConfirmDeleteButton, IconButton } from './ui'
import { cx, focusRing, inputClass } from './styles'

export interface ItemRowProps {
  sectionId: string
  itemId: string
  type: ItemSectionType
  index: number
  count: number
  isNew: boolean
}

const LANGUAGE_LEVELS: Exclude<LanguageLevel, ''>[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']

function useItem(sectionId: string, itemId: string) {
  const item = useResumeStore(selectItem(sectionId, itemId))
  const updateItem = useResumeStore((s) => s.updateItem)
  const update = (patch: Partial<AnyItem>) => updateItem(sectionId, itemId, patch)
  return { item, update }
}

function MoveDelete({ sectionId, itemId, index, count, name }: Omit<ItemRowProps, 'type' | 'isNew'> & { name: string }) {
  const moveItem = useResumeStore((s) => s.moveItem)
  const removeItem = useResumeStore((s) => s.removeItem)
  return (
    <div className="flex shrink-0 items-center">
      <IconButton label={`Przesuń w górę: ${name}`} disabled={index === 0} onClick={() => moveItem(sectionId, itemId, -1)}>
        <ArrowUpIcon />
      </IconButton>
      <IconButton label={`Przesuń w dół: ${name}`} disabled={index === count - 1} onClick={() => moveItem(sectionId, itemId, 1)}>
        <ArrowDownIcon />
      </IconButton>
      <ConfirmDeleteButton label={`Usuń: ${name}`} onConfirm={() => removeItem(sectionId, itemId)} />
    </div>
  )
}

/** Collapsible card for items with many fields (experience, education, …). */
export const ItemCard = memo(function ItemCard({ sectionId, itemId, type, index, count, isNew }: ItemRowProps) {
  const { item, update } = useItem(sectionId, itemId)
  const { setNodeRef, style, isDragging, handle } = useSortableRow(itemId)
  const headline = item ? itemHeadline(type, item) : ''
  const [open, setOpen] = useState(() => isNew || !headline)
  const bodyId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isNew) return
    bodyRef.current?.querySelector<HTMLElement>('input, textarea, select')?.focus()
  }, [isNew])

  if (!item) return null
  const name = headline || UNTITLED
  const dates = itemDates(item)

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cx('rounded-lg border bg-white', isDragging ? 'border-indigo-300 shadow-lg' : 'border-slate-200')}
    >
      <div className="flex items-center gap-1 p-1">
        <DragHandle handle={handle} label={`Przeciągnij, aby zmienić kolejność: ${name}`} />
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
          className={cx('flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-slate-50', focusRing)}
        >
          <ChevronDownIcon size={16} className={cx('shrink-0 text-slate-400 transition-transform', !open && '-rotate-90')} />
          <span className="min-w-0 flex-1">
            <span className={cx('block truncate text-sm font-medium', headline ? 'text-slate-900' : 'text-slate-400 italic')}>
              {name}
            </span>
            {dates && <span className="block truncate text-xs text-slate-500 tabular-nums">{dates}</span>}
          </span>
        </button>
        <MoveDelete sectionId={sectionId} itemId={itemId} index={index} count={count} name={name} />
      </div>
      {open && (
        <div id={bodyId} ref={bodyRef} className="border-t border-slate-100 px-3 pt-3 pb-4">
          <ItemForm type={type} item={item} update={update} />
        </div>
      )}
    </li>
  )
})

/** Single-line row for skills, languages and interests. */
export const CompactRow = memo(function CompactRow({ sectionId, itemId, type, index, count, isNew }: ItemRowProps) {
  const { item, update } = useItem(sectionId, itemId)
  const language = useResumeStore(selectLanguage)
  const { setNodeRef, style, isDragging, handle } = useSortableRow(itemId)
  const inputRef = useRef<HTMLInputElement>(null)
  const levelId = useId()

  useEffect(() => {
    if (isNew) inputRef.current?.focus()
  }, [isNew])

  if (!item || !('name' in item)) return null
  const name = item.name.trim() || UNTITLED
  const placeholder = type === 'skills' ? 'np. TypeScript' : type === 'languages' ? 'np. angielski' : 'np. wspinaczka'
  const nameLabel = type === 'skills' ? 'Umiejętność' : type === 'languages' ? 'Język' : 'Zainteresowanie'

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cx(
        'rounded-lg border bg-white p-1',
        isDragging ? 'border-indigo-300 shadow-lg' : 'border-slate-200',
      )}
    >
      <div className="flex items-center gap-1">
        <DragHandle handle={handle} label={`Przeciągnij, aby zmienić kolejność: ${name}`} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <input
            ref={inputRef}
            type="text"
            aria-label={nameLabel}
            placeholder={placeholder}
            value={item.name}
            onChange={(e) => update({ name: e.target.value })}
            className={cx(inputClass, 'min-w-[9rem] flex-1 basis-40 py-1.5')}
          />
          {type === 'skills' && (
            <SkillLevelPicker
              value={(item as SkillItem).level}
              onChange={(level) => update({ level })}
              language={language}
              skillName={item.name}
            />
          )}
          {type === 'languages' && (
            <>
              <label htmlFor={levelId} className="sr-only">
                Poziom znajomości{item.name ? `: ${item.name}` : ''}
              </label>
              <select
                id={levelId}
                value={(item as LanguageItem).level}
                onChange={(e) => update({ level: e.target.value as LanguageLevel })}
                className={cx(inputClass, 'w-auto max-w-full py-1.5 pr-8')}
              >
                <option value="">Bez poziomu</option>
                {LANGUAGE_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {CV_LABELS.pl.languageLevels[l]}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <MoveDelete sectionId={sectionId} itemId={itemId} index={index} count={count} name={name} />
      </div>
    </li>
  )
})
