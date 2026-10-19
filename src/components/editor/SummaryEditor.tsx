import { useId } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import { SUMMARY_MAX, SUMMARY_MIN, selectSection, summaryLengthStatus } from './helpers'
import { AutoTextArea } from './ui'
import { cx } from './styles'

const STATUS_TEXT = {
  empty: `Zalecana długość: ${SUMMARY_MIN}–${SUMMARY_MAX} znaków.`,
  short: `Zalecane ${SUMMARY_MIN}–${SUMMARY_MAX} znaków — możesz dodać kilka konkretów.`,
  good: 'Dobra długość.',
  long: `Ponad ${SUMMARY_MAX} znaków — rekruterzy czytają podsumowanie w kilka sekund, warto je skrócić.`,
} as const

export default function SummaryEditor({ sectionId }: { sectionId: string }) {
  const content = useResumeStore((s) => {
    const sec = selectSection(sectionId)(s)
    return sec?.type === 'summary' ? sec.content : ''
  })
  const updateSection = useResumeStore((s) => s.updateSection)
  const id = useId()
  const status = summaryLengthStatus(content.length)

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        Treść podsumowania
      </label>
      <AutoTextArea
        id={id}
        minRows={5}
        value={content}
        onChange={(v) => updateSection(sectionId, { content: v })}
        placeholder="Np. Frontend Developer z 4-letnim doświadczeniem w React i TypeScript. Tworzę dostępne, szybkie aplikacje…"
        aria-describedby={`${id}-status`}
      />
      <div className="mt-1 flex items-start justify-between gap-3 text-xs">
        <p
          id={`${id}-status`}
          aria-live="polite"
          className={cx(
            'leading-snug',
            status === 'long' ? 'text-amber-700' : status === 'good' ? 'text-emerald-700' : 'text-slate-500',
          )}
        >
          {STATUS_TEXT[status]}
        </p>
        <span className="shrink-0 text-slate-500 tabular-nums" aria-hidden="true">
          {content.length} zn.
        </span>
      </div>
    </div>
  )
}
