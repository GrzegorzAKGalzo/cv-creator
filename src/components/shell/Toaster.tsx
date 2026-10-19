import { useToastStore, type ToastKind } from './toast'
import { AlertCircleIcon, CheckCircleIcon, InfoIcon, XIcon } from './icons'

const ICON: Record<ToastKind, typeof InfoIcon> = {
  success: CheckCircleIcon,
  error: AlertCircleIcon,
  info: InfoIcon,
}

const TONE: Record<ToastKind, string> = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  info: 'text-indigo-300',
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
    >
      {toasts.map((t) => {
        const Icon = ICON[t.kind]
        return (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className="toast-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl bg-slate-900 py-3 pr-2 pl-4 text-sm text-white shadow-lg shadow-slate-900/20"
          >
            <Icon size={18} className={`mt-px shrink-0 ${TONE[t.kind]}`} />
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Zamknij powiadomienie"
              className="-my-1 rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <XIcon size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
