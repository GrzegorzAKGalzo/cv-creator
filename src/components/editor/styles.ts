/** Shared Tailwind class strings for editor controls. */
export const inputClass =
  'block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs ' +
  'placeholder:text-slate-400 transition-colors hover:border-slate-400 ' +
  'focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/20 ' +
  'disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400'

export const labelClass = 'mb-1 block text-[13px] font-medium text-slate-700'

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1'

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}
