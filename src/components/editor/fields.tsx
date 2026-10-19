import { useId, useRef, useState } from 'react'
import { AlertIcon, XIcon } from './icons'
import { appendBullet, isEndBeforeStart, isYearOnly, toYearMonth, toYearOnly } from './helpers'
import { AutoTextArea, Checkbox, Hint, IconButton } from './ui'
import { cx, focusRing, inputClass, labelClass } from './styles'

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/
const YEAR_RE = /^\d{4}$/

interface MonthFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

/**
 * Date input storing 'YYYY-MM' (native month picker) or 'YYYY' ("tylko rok" mode).
 * Keeps a local draft so browsers without a month picker (text fallback) still work.
 */
export function MonthField({ label, value, onChange, disabled, className }: MonthFieldProps) {
  const id = useId()
  const [preferYear, setPreferYear] = useState(isYearOnly(value))
  const yearMode = isYearOnly(value) || (!MONTH_RE.test(value) && preferYear)

  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    setDraft(value)
  }

  const valid = yearMode ? YEAR_RE : MONTH_RE
  const handle = (next: string) => {
    setDraft(next)
    if (next === '' || valid.test(next)) onChange(next)
  }

  const toggleMode = () => {
    const nextYear = !yearMode
    setPreferYear(nextYear)
    if (value) onChange(nextYear ? toYearOnly(value) : toYearMonth(value))
  }

  return (
    <div className={cx('min-w-0', className)}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={cx(labelClass, 'mb-0')}>
          {label}
        </label>
        <button
          type="button"
          onClick={toggleMode}
          disabled={disabled}
          aria-pressed={yearMode}
          className={cx(
            'rounded px-1 text-xs transition-colors disabled:opacity-40',
            yearMode ? 'font-medium text-indigo-700' : 'text-slate-500 hover:text-slate-800',
            focusRing,
          )}
        >
          tylko rok
        </button>
      </div>
      <div className="flex items-center gap-1">
        {yearMode ? (
          <input
            id={id}
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="RRRR"
            value={draft}
            disabled={disabled}
            onChange={(e) => handle(e.target.value.replace(/\D/g, ''))}
            onBlur={() => setDraft(value)}
            className={inputClass}
          />
        ) : (
          <input
            id={id}
            type="month"
            placeholder="RRRR-MM"
            value={draft}
            disabled={disabled}
            onChange={(e) => handle(e.target.value)}
            onBlur={() => setDraft(value)}
            className={inputClass}
          />
        )}
        {value && !disabled && (
          <IconButton label={`Wyczyść: ${label}`} onClick={() => onChange('')}>
            <XIcon size={14} />
          </IconButton>
        )}
      </div>
    </div>
  )
}

interface DateRangeProps {
  startDate: string
  endDate: string
  current: boolean
  onChange: (patch: Partial<{ startDate: string; endDate: string; current: boolean }>) => void
}

export function DateRangeFields({ startDate, endDate, current, onChange }: DateRangeProps) {
  const reversed = !current && isEndBeforeStart(startDate, endDate)
  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
        <MonthField label="Od" value={startDate} onChange={(v) => onChange({ startDate: v })} />
        <MonthField label="Do" value={current ? '' : endDate} disabled={current} onChange={(v) => onChange({ endDate: v })} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Checkbox label="Obecnie" checked={current} onChange={(c) => onChange({ current: c })} />
        {reversed && (
          <p role="status" className="flex items-center gap-1.5 text-xs text-amber-700">
            <AlertIcon size={14} />
            Data zakończenia jest wcześniejsza niż rozpoczęcia
          </p>
        )}
      </div>
    </div>
  )
}

interface DescriptionFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export function DescriptionField({ value, onChange, label = 'Opis', placeholder }: DescriptionFieldProps) {
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)

  const addBullet = () => {
    const next = appendBullet(value)
    onChange(next)
    requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      el.focus()
      el.setSelectionRange(next.length, next.length)
    })
  }

  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={cx(labelClass, 'mb-0')}>
          {label}
        </label>
        <button
          type="button"
          onClick={addBullet}
          className={cx('rounded px-1 text-xs font-medium text-indigo-700 hover:text-indigo-900', focusRing)}
        >
          • Dodaj punktor
        </button>
      </div>
      <AutoTextArea
        id={id}
        textareaRef={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-describedby={`${id}-hint`}
      />
      <Hint id={`${id}-hint`}>Każda linia zaczynająca się od „- ” to punktor.</Hint>
    </div>
  )
}
