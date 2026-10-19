import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

/**
 * Open/close state for a hand-rolled popover: closes on Escape (returning focus
 * to the trigger) and on pointer-down outside both trigger and panel.
 */
export function usePopover<T extends HTMLElement = HTMLButtonElement>() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<T>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return { open, setOpen, close, toggle: () => setOpen((o) => !o), triggerRef, panelRef }
}

const ITEM_SELECTOR = '[role="menuitem"]:not([disabled]), [role="menuitemradio"]:not([disabled])'

/** Arrow / Home / End navigation between menu items inside a container. */
export function handleMenuKeys(e: KeyboardEvent<HTMLElement>): void {
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(ITEM_SELECTOR))
  if (!items.length) return
  const index = items.indexOf(document.activeElement as HTMLElement)
  let next = -1
  if (e.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % items.length
  else if (e.key === 'ArrowUp') next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = items.length - 1
  if (next < 0) return
  e.preventDefault()
  items[next].focus()
}

/** Focuses the first menu item of a container (call after opening). */
export function focusFirstItem(container: HTMLElement | null): void {
  container?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus()
}
