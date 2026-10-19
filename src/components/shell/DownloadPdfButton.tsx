import { usePdfDownload } from './usePdfDownload'
import { DownloadIcon, Spinner } from './icons'

/** Primary action. `floating` renders the round mobile FAB variant. */
export default function DownloadPdfButton({ floating = false }: { floating?: boolean }) {
  const { download, busy } = usePdfDownload()
  const label = busy ? 'Generuję PDF…' : 'Pobierz PDF'

  if (floating) {
    return (
      <button
        type="button"
        onClick={download}
        disabled={busy}
        aria-busy={busy}
        className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex h-12 items-center gap-2 rounded-full bg-indigo-600 pr-5 pl-4 text-[15px] font-semibold text-white shadow-lg shadow-indigo-900/30 hover:bg-indigo-700 disabled:opacity-80 lg:hidden"
      >
        {busy ? <Spinner size={18} /> : <DownloadIcon size={18} />}
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      aria-busy={busy}
      className="flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm shadow-indigo-900/20 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-80"
    >
      {busy ? <Spinner /> : <DownloadIcon />}
      <span className="min-w-[6.5rem] text-left">{label}</span>
    </button>
  )
}
