import { useMemo, type ReactNode } from 'react'
import { useActiveResume } from '../../store/resumeStore'
import { analyzeResume } from '../../lib/ats'
import Logo from './Logo'
import ResumeSwitcher from './ResumeSwitcher'
import LanguageToggle from './LanguageToggle'
import MoreMenu from './MoreMenu'
import DownloadPdfButton from './DownloadPdfButton'
import { useUiStore } from './uiStore'
import { atsVerdict } from './atsTone'
import { GaugeIcon, PaletteIcon } from './icons'

function ToolButton({
  icon,
  label,
  onClick,
  expanded,
  children,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  expanded: boolean
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      title={label}
      className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 aria-expanded:bg-slate-100 md:px-2.5"
    >
      <span className="text-slate-500">{icon}</span>
      <span className="sr-only md:not-sr-only">{label}</span>
      {children}
    </button>
  )
}

export default function TopBar() {
  const resume = useActiveResume()
  const panel = useUiStore((s) => s.panel)
  const openPanel = useUiStore((s) => s.openPanel)
  const result = useMemo(() => (resume ? analyzeResume(resume) : { score: 0, checks: [] }), [resume])
  const score = result.score
  const tone = atsVerdict(result)

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:gap-3 sm:px-4">
      <Logo />
      <div className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <ResumeSwitcher />
      </div>

      <nav aria-label="Narzędzia CV" className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <div className="mr-1 sm:mr-2">
          <LanguageToggle />
        </div>
        <ToolButton
          icon={<PaletteIcon size={17} />}
          label="Wygląd"
          expanded={panel === 'design'}
          onClick={() => openPanel('design')}
        />
        <ToolButton
          icon={<GaugeIcon size={17} />}
          label="Analiza ATS"
          expanded={panel === 'ats'}
          onClick={() => openPanel('ats')}
        >
          <span
            className={`hidden h-5 min-w-7 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums sm:inline-flex ${tone.badge}`}
            aria-label={`wynik ${score} na 100 – ${tone.label}`}
          >
            {score}
          </span>
        </ToolButton>
        <MoreMenu />
        <div className="ml-1.5 hidden lg:block">
          <DownloadPdfButton />
        </div>
      </nav>
    </header>
  )
}
