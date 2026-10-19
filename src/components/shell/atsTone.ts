import type { AtsCheck, AtsStatus } from '../../lib/ats'

export interface AtsVerdict {
  /** Worst state that drives colour: any error -> 'error', any warning -> 'warn', else 'ok'. */
  level: AtsStatus
  label: string
  ring: string
  text: string
  badge: string
}

const STYLE: Record<AtsStatus, Pick<AtsVerdict, 'ring' | 'text' | 'badge'>> = {
  ok: { ring: '#059669', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700' },
  warn: { ring: '#d97706', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-800' },
  error: { ring: '#e11d48', text: 'text-rose-700', badge: 'bg-rose-50 text-rose-700' },
}

export const READY_SCORE = 85
export const WEAK_SCORE = 60

/**
 * Headline + colour for the ATS result (shared by the panel and the top-bar badge).
 * Check statuses take precedence over the score: a single error never reads as "ready".
 */
export function atsVerdict(result: { score: number; checks: Pick<AtsCheck, 'status'>[] }): AtsVerdict {
  const errors = result.checks.filter((c) => c.status === 'error').length
  const warns = result.checks.filter((c) => c.status === 'warn').length

  if (errors > 0) {
    return {
      level: 'error',
      label: result.score < WEAK_SCORE ? 'CV wymaga uzupełnienia' : 'Do poprawy przed wysłaniem',
      ...STYLE.error,
    }
  }
  if (warns > 0 || result.score < READY_SCORE) {
    return { level: 'warn', label: 'Prawie gotowe', ...STYLE.warn }
  }
  return { level: 'ok', label: 'Gotowe do wysyłki', ...STYLE.ok }
}
