import { useRef } from 'react'
import { settleConfirm, useConfirmStore } from './confirm'
import { AlertTriangleIcon } from './icons'
import { trapTab, useModalDialog } from './modal'

export default function ConfirmDialog() {
  const request = useConfirmStore((s) => s.request)
  const ref = useRef<HTMLDialogElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Destructive actions start focused on "Anuluj" for safety.
  useModalDialog(ref, request !== null, () => (request?.danger ? cancelRef.current : confirmRef.current))

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      aria-describedby={request?.message ? 'confirm-message' : undefined}
      aria-modal="true"
      onClose={() => settleConfirm(false)}
      onKeyDown={trapTab}
      onClick={(e) => e.target === ref.current && settleConfirm(false)}
      className="dialog-pop m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border-0 bg-white p-0 text-slate-900 shadow-2xl shadow-slate-900/25"
    >
      {request && (
        <div className="p-6">
          <div className="flex gap-4">
            {request.danger && (
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangleIcon size={20} />
              </div>
            )}
            <div className="min-w-0">
              <h2 id="confirm-title" className="text-base font-semibold text-balance">
                {request.title}
              </h2>
              {request.message && (
                <p id="confirm-message" className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {request.message}
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => settleConfirm(false)}
              className="h-9 rounded-lg px-3.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            >
              {request.cancelLabel ?? 'Anuluj'}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={() => settleConfirm(true)}
              className={`h-9 rounded-lg px-3.5 text-sm font-medium text-white ${
                request.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {request.confirmLabel ?? 'Potwierdź'}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
