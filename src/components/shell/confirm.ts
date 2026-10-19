import { create } from 'zustand'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

export const useConfirmStore = create<{ request: ConfirmRequest | null }>()(() => ({ request: null }))

/** Opens the app's confirm dialog. Resolves true when confirmed. */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  useConfirmStore.getState().request?.resolve(false)
  return new Promise((resolve) => {
    useConfirmStore.setState({ request: { ...options, resolve } })
  })
}

export function settleConfirm(ok: boolean): void {
  const { request } = useConfirmStore.getState()
  if (!request) return
  useConfirmStore.setState({ request: null })
  request.resolve(ok)
}
