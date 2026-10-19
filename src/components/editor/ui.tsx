import { useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react'
import { PlusIcon, TrashIcon } from './icons'
import { cx, focusRing, inputClass, labelClass } from './styles'

export function Hint({ children, id, tone = 'muted' }: { children: ReactNode; id?: string; tone?: 'muted' | 'warn' }) {
  return (
    <p id={id} className={cx('mt-1 text-xs leading-snug', tone === 'warn' ? 'text-amber-700' : 'text-slate-500')}>
      {children}
    </p>
  )
}

interface TextFieldProps extends Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange'> {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: ReactNode
  className?: string
  inputRef?: Ref<HTMLInputElement>
}

export function TextField({ label, value, onChange, hint, className, inputRef, id, ...rest }: TextFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hintId = hint ? `${fieldId}-hint` : undefined
  return (
    <div className={cx('min-w-0', className)}>
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={fieldId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hintId}
        className={inputClass}
        {...rest}
      />
      {hint && <Hint id={hintId}>{hint}</Hint>}
    </div>
  )
}

interface AutoTextAreaProps extends Omit<ComponentPropsWithoutRef<'textarea'>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  minRows?: number
  textareaRef?: Ref<HTMLTextAreaElement>
}

/** Textarea that grows with its content. */
export function AutoTextArea({ value, onChange, minRows = 3, className, textareaRef, ...rest }: AutoTextAreaProps) {
  const local = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(textareaRef, () => local.current as HTMLTextAreaElement)
  useLayoutEffect(() => {
    const el = local.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value])
  return (
    <textarea
      ref={local}
      rows={minRows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cx(inputClass, 'resize-none leading-relaxed', className)}
      {...rest}
    />
  )
}

export function Checkbox({
  label,
  checked,
  onChange,
  className,
}: {
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}) {
  const id = useId()
  return (
    <div className={cx('flex items-center gap-2', className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={cx('size-4 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600', focusRing)}
      />
      <label htmlFor={id} className="cursor-pointer select-none text-sm text-slate-700">
        {label}
      </label>
    </div>
  )
}

interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  label: string
  tone?: 'default' | 'danger' | 'accent'
}

export function IconButton({ label, tone = 'default', className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors',
        'disabled:pointer-events-none disabled:opacity-30',
        tone === 'danger' && 'hover:bg-rose-50 hover:text-rose-600',
        tone === 'accent' && 'hover:bg-indigo-50 hover:text-indigo-600',
        tone === 'default' && 'hover:bg-slate-100 hover:text-slate-800',
        focusRing,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Trash button that asks for an inline confirmation before calling onConfirm. */
export function ConfirmDeleteButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (confirming) cancelRef.current?.focus()
  }, [confirming])

  if (!confirming)
    return (
      <IconButton label={label} tone="danger" onClick={() => setConfirming(true)}>
        <TrashIcon />
      </IconButton>
    )

  return (
    <div
      role="group"
      aria-label={label}
      className="flex shrink-0 items-center gap-1"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          setConfirming(false)
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setConfirming(false)
      }}
    >
      <button
        type="button"
        onClick={onConfirm}
        className={cx('rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700', focusRing)}
      >
        Usuń
      </button>
      <button
        ref={cancelRef}
        type="button"
        onClick={() => setConfirming(false)}
        className={cx('rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100', focusRing)}
      >
        Anuluj
      </button>
    </div>
  )
}

export function AddButton({ children, className, ...rest }: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50',
        focusRing,
        className,
      )}
      {...rest}
    >
      <PlusIcon size={15} />
      {children}
    </button>
  )
}
