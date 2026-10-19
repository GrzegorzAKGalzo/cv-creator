import type { AnyItem, CvLanguage, Resume, Section, SectionType } from '../../types/resume'
import { CV_LABELS } from '../../i18n/cvLabels'
import { formatDate, formatDateRange, parseYearMonth } from '../../lib/dates'
import type { ResumeState } from '../../store/resumeStore'

export type ItemSectionType = Exclude<SectionType, 'summary'>

/** Sections whose items are edited inline as compact rows instead of collapsible cards. */
export const COMPACT_SECTIONS: ItemSectionType[] = ['skills', 'languages', 'interests']

export const UNTITLED = '(bez tytułu)'

/** Short Polish descriptions shown in the "add section" picker. */
export const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  summary: 'Kilka zdań o Twoim profilu i celach',
  experience: 'Stanowiska, obowiązki i osiągnięcia',
  education: 'Szkoły, uczelnie i kierunki',
  skills: 'Kompetencje twarde i miękkie',
  languages: 'Języki obce i poziom znajomości',
  certifications: 'Certyfikaty, licencje, uprawnienia',
  courses: 'Ukończone kursy i szkolenia',
  projects: 'Projekty zawodowe i własne',
  awards: 'Nagrody, stypendia, wyróżnienia',
  volunteering: 'Działalność społeczna i wolontariat',
  publications: 'Artykuły, książki, prace naukowe',
  interests: 'Hobby i pasje',
  references: 'Osoby, które mogą Cię polecić',
  custom: 'Własna sekcja z dowolną treścią',
}

/** Label of the "+ Dodaj …" button per section type. */
export const ADD_ITEM_LABELS: Record<ItemSectionType, string> = {
  experience: 'Dodaj stanowisko',
  education: 'Dodaj szkołę',
  skills: 'Dodaj umiejętność',
  languages: 'Dodaj język',
  certifications: 'Dodaj certyfikat',
  courses: 'Dodaj kurs',
  projects: 'Dodaj projekt',
  awards: 'Dodaj nagrodę',
  volunteering: 'Dodaj wolontariat',
  publications: 'Dodaj publikację',
  interests: 'Dodaj zainteresowanie',
  references: 'Dodaj osobę',
  custom: 'Dodaj pozycję',
}

const join = (parts: (string | undefined)[], sep: string) =>
  parts.map((p) => (p ?? '').trim()).filter(Boolean).join(sep)

/** Header text of an item card, e.g. "Frontend Developer · Acme". Empty string if nothing is filled in. */
export function itemHeadline(type: ItemSectionType, item: AnyItem): string {
  const i = item as unknown as Record<string, unknown>
  const s = (k: string) => (typeof i[k] === 'string' ? (i[k] as string) : '')
  switch (type) {
    case 'experience':
      return join([s('jobTitle'), s('employer')], ' · ')
    case 'education':
      return join([join([s('degree'), s('fieldOfStudy')], ', '), s('school')], ' · ')
    case 'certifications':
    case 'awards':
      return join([s('name'), s('issuer')], ' · ')
    case 'courses':
      return join([s('name'), s('institution')], ' · ')
    case 'projects':
      return join([s('name'), s('role')], ' · ')
    case 'volunteering':
      return join([s('role'), s('organization')], ' · ')
    case 'publications':
      return join([s('title'), s('publisher')], ' · ')
    case 'references':
      return join([s('name'), s('company')], ' · ')
    case 'custom':
      return join([s('title'), s('subtitle')], ' · ')
    default:
      return s('name').trim()
  }
}

/** Short numeric date summary for an item card header, e.g. "01.2020 – obecnie". */
export function itemDates(item: AnyItem): string {
  if ('startDate' in item) return formatDateRange(item.startDate, item.endDate, item.current, 'pl', 'numeric')
  if ('date' in item) return formatDate(item.date, 'pl', 'numeric')
  return ''
}

/** True when both dates are valid and the end date is before the start date. */
export function isEndBeforeStart(start: string, end: string): boolean {
  const a = parseYearMonth(start)
  const b = parseYearMonth(end)
  if (!a || !b) return false
  if (b.year !== a.year) return b.year < a.year
  if (a.month === null || b.month === null) return false
  return b.month < a.month
}

/** Appends a new bullet line ("- ") to a description. */
export function appendBullet(text: string): string {
  if (!text) return '- '
  return text.endsWith('\n') ? `${text}- ` : `${text}\n- `
}

export function skillLevelName(level: number, language: CvLanguage): string {
  if (level < 1 || level > 5) return 'Nie pokazuj poziomu'
  return CV_LABELS[language].skillLevels[level as 1 | 2 | 3 | 4 | 5]
}

export const SUMMARY_MIN = 300
export const SUMMARY_MAX = 700

export type SummaryLengthStatus = 'empty' | 'short' | 'good' | 'long'

export function summaryLengthStatus(length: number): SummaryLengthStatus {
  if (length === 0) return 'empty'
  if (length < SUMMARY_MIN) return 'short'
  if (length <= SUMMARY_MAX) return 'good'
  return 'long'
}

/** Switches a date between 'YYYY-MM' and 'YYYY' representation. */
export function toYearOnly(value: string): string {
  const d = parseYearMonth(value)
  return d ? String(d.year) : ''
}

export function toYearMonth(value: string): string {
  const d = parseYearMonth(value)
  if (!d) return ''
  return `${d.year}-${String(d.month ?? 1).padStart(2, '0')}`
}

export const isYearOnly = (value: string) => /^\d{4}$/.test(value)

// ---- store selectors (narrow, so components re-render only when their data changes) ----

export const selectActive = (s: ResumeState): Resume | undefined => s.resumes.find((r) => r.id === s.activeId)

export const selectLanguage = (s: ResumeState) => selectActive(s)?.language ?? 'pl'

export const selectSection =
  (sectionId: string) =>
  (s: ResumeState): Section | undefined =>
    selectActive(s)?.sections.find((x) => x.id === sectionId)

export const selectItem =
  (sectionId: string, itemId: string) =>
  (s: ResumeState): AnyItem | undefined => {
    const sec = selectSection(sectionId)(s)
    return sec && 'items' in sec ? (sec.items as AnyItem[]).find((i) => i.id === itemId) : undefined
  }

