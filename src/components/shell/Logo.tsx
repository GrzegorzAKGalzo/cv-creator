/** Folded-sheet mark + wordmark. Same mark is used as the favicon in index.html. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9 3h11l8 8v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="#4f46e5" />
      <path d="M20 3v6a2 2 0 0 0 2 2h6Z" fill="#a5b4fc" />
      <path d="M11.5 16h9M11.5 20h9M11.5 24h5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <LogoMark />
      <span className="hidden text-[17px] font-semibold tracking-[-0.02em] text-slate-900 sm:inline">CV Kreator</span>
      <span className="sr-only sm:hidden">CV Kreator</span>
    </div>
  )
}
