import type { CvLanguage, DateFormat } from '../types/resume'
import { CV_LABELS } from '../i18n/cvLabels'

/** Parses 'YYYY-MM' or 'YYYY'. Returns null for empty/invalid input. */
export function parseYearMonth(value: string): { year: number; month: number | null } | null {
  const m = /^(\d{4})(?:-(\d{1,2}))?$/.exec(value.trim())
  if (!m) return null
  const month = m[2] ? Number(m[2]) : null
  if (month !== null && (month < 1 || month > 12)) return null
  return { year: Number(m[1]), month }
}

/** 'May 2023' / 'maj 2023' (text) or '05/2023' / '05.2023' (numeric). '' if not set. */
export function formatDate(value: string, language: CvLanguage, format: DateFormat = 'text'): string {
  const d = parseYearMonth(value)
  if (!d) return ''
  if (d.month === null) return String(d.year)
  const labels = CV_LABELS[language]
  if (format === 'numeric') return `${String(d.month).padStart(2, '0')}${labels.numericDateSeparator}${d.year}`
  return `${labels.months[d.month - 1]} ${d.year}`
}

/**
 * 'May 2023 – Present', 'sty 2020 – maj 2023', '2019', or '' when nothing is set.
 * A lone end date is rendered on its own.
 */
export function formatDateRange(
  startDate: string,
  endDate: string,
  current: boolean,
  language: CvLanguage,
  format: DateFormat = 'text',
): string {
  const labels = CV_LABELS[language]
  const start = formatDate(startDate, language, format)
  const end = current ? labels.present : formatDate(endDate, language, format)
  if (start && end) return start === end ? start : `${start}${labels.dateRangeSeparator}${end}`
  return start || end
}
