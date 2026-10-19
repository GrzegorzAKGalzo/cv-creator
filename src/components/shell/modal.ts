import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react'
import { useConfirmStore } from './confirm'
import { useUiStore } from './uiStore'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Visible, tabbable elements inside a container, in DOM order. */
export function focusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0 && !el.closest('[inert]'),
  )
}

/** Keeps Tab / Shift+Tab cycling inside the element the handler is attached to. */
export function trapTab(e: KeyboardEvent<HTMLElement>): void {
  if (e.key !== 'Tab') return
  const container = e.currentTarget
  const els = focusables(container)
  if (!els.length) {
    e.preventDefault()
    return
  }
  const first = els[0]
  const last = els[els.length - 1]
  const active = document.activeElement
  const outside = !container.contains(active)
  if (e.shiftKey && (active === first || outside)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && (active === last || outside)) {
    e.preventDefault()
    first.focus()
  }
}

/** True while any drawer or the confirm dialog is open (the app behind is made inert). */
export function useModalOpen(): boolean {
  const panel = useUiStore((s) => s.panel)
  const confirmOpen = useConfirmStore((s) => s.request !== null)
  return panel !== null || confirmOpen
}

/**
 * Opens/closes a native <dialog> modally, moves focus into it (`initialFocus`
 * or its first focusable element) and restores focus to the previously focused
 * element (the trigger) when it closes.
 */
export function useModalDialog(
  ref: RefObject<HTMLDialogElement | null>,
  open: boolean,
  initialFocus?: () => HTMLElement | null | undefined,
): void {
  const initialFocusRef = useRef(initialFocus)
  useEffect(() => {
    initialFocusRef.current = initialFocus
  })

  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !open) return
    const restoreTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!dialog.open) dialog.showModal()
    const target = initialFocusRef.current?.() ?? focusables(dialog)[0]
    target?.focus()
    return () => {
      if (dialog.open) dialog.close()
      // Runs after the commit that removed `inert` from the app, so the trigger is focusable again.
      if (restoreTo?.isConnected) restoreTo.focus()
    }
  }, [ref, open])
}
