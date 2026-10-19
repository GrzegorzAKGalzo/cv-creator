import { useId, useRef, type KeyboardEvent } from 'react'
import type { CvLanguage } from '../../types/resume'
import { useActiveResume, useResumeStore } from '../../store/resumeStore'
import { CV_LABELS } from '../../i18n/cvLabels'
import { formatDateRange } from '../../lib/dates'
import { toast } from './toast'

const OPTIONS: { value: CvLanguage; label: string; name: string }[] = [
  { value: 'en', label: 'EN', name: 'angielski' },
  { value: 'pl', label: 'PL', name: 'polski' },
]

const LANGUAGE_HINT =
  'Zmienia nagłówki, daty i etykiety w CV. Treść wpisujesz sam(a) — dla pełnego tłumaczenia utwórz wersję w drugim języku.'

let hintShown = false

/** One-time nudge explaining that only labels change, not the typed content. */
function showLanguageHintOnce(next: CvLanguage) {
  if (hintShown) return
  hintShown = true
  toast.info(
    next === 'en'
      ? 'Nagłówki i daty są teraz po angielsku. Treść wpisanych pól się nie zmienia.'
      : 'Nagłówki i daty są teraz po polsku. Treść wpisanych pól się nie zmienia.',
  )
}

/** The export-language switch: the app's signature control. */
export default function LanguageToggle() {
  const resume = useActiveResume()
  const setLanguage = useResumeStore((s) => s.setLanguage)
  const groupRef = useRef<HTMLDivElement>(null)
  const hintId = useId()
  if (!resume) return null
  const lang = resume.language
  const fmt = resume.settings.dateFormat

  const choose = (next: CvLanguage) => {
    if (next === lang) return
    setLanguage(next)
    showLanguageHintOnce(next)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const next = lang === 'en' ? 'pl' : 'en'
    choose(next)
    groupRef.current?.querySelector<HTMLElement>(`[data-lang="${next}"]`)?.focus()
  }

  return (
    <div className="group relative flex items-center gap-2.5">
      <span className="hidden text-[13px] font-medium text-slate-500 xl:inline" aria-hidden="true">
        Język CV
      </span>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Język eksportu CV"
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
        className="relative grid grid-cols-2 rounded-full bg-slate-100 p-[3px] ring-1 ring-slate-200 ring-inset"
      >
        <span
          aria-hidden="true"
          className={`absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-full bg-indigo-600 shadow-sm shadow-indigo-900/30 transition-transform duration-200 ease-out motion-reduce:transition-none ${
            lang === 'pl' ? 'translate-x-full' : ''
          }`}
        />
        {OPTIONS.map((o) => {
          const selected = o.value === lang
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${o.label} – ${o.name}`}
              data-lang={o.value}
              tabIndex={selected ? 0 : -1}
              onClick={() => choose(o.value)}
              className={`relative z-10 h-7 w-11 rounded-full text-[13px] font-semibold tracking-wide transition-colors duration-200 ${
                selected ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>

      <div
        id={hintId}
        role="tooltip"
        className="pointer-events-none invisible fixed inset-x-4 top-15 z-50 rounded-xl bg-slate-900 p-4 text-[13px] leading-relaxed text-slate-200 opacity-0 shadow-xl shadow-slate-900/25 transition-opacity delay-150 duration-150 group-hover:visible group-hover:opacity-100 group-has-focus-visible:visible group-has-focus-visible:opacity-100 sm:absolute sm:inset-x-auto sm:top-full sm:left-1/2 sm:mt-2.5 sm:w-80 sm:-translate-x-1/2"
      >
        <p>{LANGUAGE_HINT}</p>
        <dl className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
          {OPTIONS.map((o) => (
            <div key={o.value} className="flex gap-2.5">
              <dt
                className={`mt-px h-5 shrink-0 rounded px-1.5 text-[11px] leading-5 font-semibold ${
                  o.value === lang ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-300'
                }`}
              >
                {o.label}
              </dt>
              <dd className="min-w-0 text-slate-300">
                <span className="text-white">{CV_LABELS[o.value].sections.experience}</span>,{' '}
                {formatDateRange('2024-02', '', true, o.value, fmt)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
