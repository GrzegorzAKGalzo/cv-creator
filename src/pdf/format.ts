import type { AnyItem, CvLanguage, DateFormat, PersonalInfo, Resume, Section } from '../types/resume'
import { getCvLabels } from '../i18n/cvLabels'

/** Pure, dependency-light helpers shared by the PDF document, the public API and tests. */

export const clean = (value: string | undefined | null): string => (value ?? '').replace(/\s+/g, ' ').trim()

/** Joins the non-empty parts with a separator – never leaves dangling separators. */
export const joinParts = (parts: (string | undefined | null)[], sep: string): string =>
  parts.map(clean).filter(Boolean).join(sep)

export const fullName = (p: Pick<PersonalInfo, 'firstName' | 'lastName'>): string => joinParts([p.firstName, p.lastName], ' ')

/** "https://www.github.com/jan/" -> "github.com/jan" */
export function displayUrl(url: string): string {
  return clean(url)
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '')
}

/** Adds https:// when the user typed a bare domain. Returns '' for empty input. */
export function hrefFor(url: string): string {
  const u = clean(url)
  if (!u) return ''
  if (/^(https?|mailto|tel):/i.test(u)) return u
  if (u.startsWith('//')) return `https:${u}`
  return `https://${u}`
}

const isBareHandle = (value: string) => /^@?[\w.-]+$/.test(value) && !value.includes('.')

/** LinkedIn / GitHub fields may hold a handle ("jan-kowalski") instead of a URL. */
export function profileUrl(value: string, base: string): string {
  const v = clean(value)
  if (!v) return ''
  if (isBareHandle(v)) return `${base}/${v.replace(/^@/, '')}`
  return v
}

/** '1990-03-12' -> '12 mar 1990' / '12.03.1990'. Any other string is returned as typed. */
export function formatBirthDate(value: string, language: CvLanguage, format: DateFormat): string {
  const v = clean(value)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (!m) return v
  const labels = getCvLabels(language)
  const [, y, mo, d] = m
  const month = Number(mo)
  if (month < 1 || month > 12) return v
  if (format === 'numeric') return [d, mo, y].join(labels.numericDateSeparator)
  return `${Number(d)} ${labels.months[month - 1]} ${y}`
}

const NON_CONTENT_KEYS = new Set(['id', 'level', 'current', 'startDate', 'endDate', 'date'])

/** True when an item has at least one meaningful text field (dates/levels alone don't count). */
export function itemHasContent(item: AnyItem): boolean {
  return Object.entries(item).some(([key, value]) => !NON_CONTENT_KEYS.has(key) && typeof value === 'string' && clean(value) !== '')
}

/** Section is rendered only when visible and non-empty. */
export function sectionHasContent(section: Section): boolean {
  if (section.visible === false) return false
  if (section.type === 'summary') return clean(section.content) !== ''
  if (section.type === 'references' && section.onRequest) return true
  return (section.items as AnyItem[]).some(itemHasContent)
}

export function visibleSections(resume: Resume): Section[] {
  return resume.sections.filter(sectionHasContent)
}

/** Skill names of visible skills sections, for PDF keywords metadata. */
export function skillKeywords(resume: Resume): string[] {
  const names = resume.sections
    .filter((s) => s.type === 'skills' && s.visible !== false)
    .flatMap((s) => (s.type === 'skills' ? s.items.map((i) => clean(i.name)) : []))
    .filter(Boolean)
  return [...new Set(names)]
}

/** ASCII-only: strips diacritics (incl. Polish ł/Ł which don't decompose). */
export function toAscii(value: string): string {
  return value
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .replace(/ß/g, 'ss')
    .replace(/[æÆøØđĐ]/g, (c) => ({ æ: 'ae', Æ: 'AE', ø: 'o', Ø: 'O', đ: 'd', Đ: 'D' })[c] ?? c)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** "CV_Jan_Kowalski_PL.pdf"; falls back to "CV.pdf" when there is no usable name. */
export function pdfFileName(resume: Pick<Resume, 'personal' | 'language'>): string {
  const name = toAscii(fullName(resume.personal))
    .replace(/[^A-Za-z0-9 _-]+/g, '')
    .trim()
    .replace(/[\s_]+/g, '_')
  if (!name) return 'CV.pdf'
  return `CV_${name}_${resume.language.toUpperCase()}.pdf`
}

export function documentTitle(resume: Resume): string {
  const name = fullName(resume.personal)
  if (name) return `${name} – CV`
  return resume.language === 'en' ? 'Resume' : 'CV'
}

export const pdfLanguageTag = (language: CvLanguage): string => (language === 'pl' ? 'pl-PL' : 'en-US')
