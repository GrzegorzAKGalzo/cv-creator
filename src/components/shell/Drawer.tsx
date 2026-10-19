import { useId, useRef, type ReactNode } from 'react'
import { XIcon } from './icons'
import { trapTab, useModalDialog } from './modal'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}

/**
 * Right-hand side sheet on a native modal <dialog>: Esc and backdrop click close it,
 * Tab is trapped inside, focus moves in on open and back to the trigger on close.
 * The rest of the app is made inert by <App> while it is open.
 */
export default function Drawer({ open, onClose, title, description, children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  useModalDialog(ref, open)

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      aria-modal="true"
      onClose={onClose}
      onKeyDown={trapTab}
      onClick={(e) => e.target === ref.current && onClose()}
      className="drawer fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-110 border-0 bg-white p-0 text-slate-900 shadow-2xl shadow-slate-900/20"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-[17px] font-semibold tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-0.5 text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij panel"
            className="-mr-1.5 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <XIcon size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </dialog>
  )
}
