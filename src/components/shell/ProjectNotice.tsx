import { useState } from 'react'
import { InfoIcon, XIcon } from './icons'

const STORAGE_KEY = 'cv-kreator:notice-dismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Dismissible bubble: hobby project disclaimer (AI-assisted, may contain bugs, no ATS guarantee). */
export default function ProjectNotice() {
  const [dismissed, setDismissed] = useState(readDismissed)
  if (dismissed) return null

  const close = () => {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Private mode / blocked storage: the notice simply reappears next visit.
    }
  }

  return (
    <aside
      aria-label="Informacja o projekcie"
      className="pop-in fixed inset-x-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+7rem)] z-30 flex gap-3 rounded-xl border border-slate-200 bg-white/95 p-3.5 pr-2.5 text-[13px] leading-relaxed text-slate-600 shadow-lg shadow-slate-900/10 backdrop-blur sm:right-auto sm:max-w-sm lg:bottom-4 lg:left-4"
    >
      <InfoIcon className="mt-0.5 shrink-0 text-indigo-600" />
      <p>
        <strong className="font-semibold text-slate-900">To prosty projekt wykonany z pomocą AI.</strong> Mogą w nim
        występować błędy – przed wysłaniem CV sprawdź poprawność danych i wygenerowanego PDF. Analiza ATS jest orientacyjna
        i nie gwarantuje, że Twoje CV przejdzie każdy system rekrutacyjny.
      </p>
      <button
        type="button"
        onClick={close}
        aria-label="Zamknij informację o projekcie"
        className="-mt-1 grid size-7 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
      >
        <XIcon />
      </button>
    </aside>
  )
}
