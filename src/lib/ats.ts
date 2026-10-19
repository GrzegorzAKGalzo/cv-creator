import type { AnyItem, ItemByType, Resume, Section, SectionType } from '../types/resume'
import { CV_LABELS } from '../i18n/cvLabels'
import { parseYearMonth } from './dates'
import { parseDescription } from './description'

export type AtsStatus = 'ok' | 'warn' | 'error'

export interface AtsCheck {
  id: string
  status: AtsStatus
  /** Polish, user-facing. */
  message: string
  tip?: string
}

export interface AtsKeywords {
  matched: string[]
  missing: string[]
}

export interface AtsResult {
  /** 0–100 */
  score: number
  checks: AtsCheck[]
  keywords?: AtsKeywords
}

/** Relative importance of each check in the score. */
export const ATS_WEIGHTS: Record<string, number> = {
  name: 10,
  email: 10,
  phone: 6,
  location: 4,
  jobTitle: 6,
  summary: 8,
  experience: 14,
  bullets: 6,
  quantified: 6,
  skills: 8,
  education: 6,
  languages: 4,
  photo: 3,
  dates: 6,
  longLines: 3,
  sectionTitles: 3,
  gdpr: 4,
  urls: 4,
}

const STATUS_FACTOR: Record<AtsStatus, number> = { ok: 1, warn: 0.5, error: 0 }

export const SUMMARY_MIN = 300
export const SUMMARY_MAX = 1000
export const LONG_LINE = 300
export const MIN_SKILLS = 5

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Accepts "https://x.com/a" and bare "linkedin.com/in/a"; rejects spaces / missing TLD. */
export function isValidUrl(value: string): boolean {
  const v = value.trim()
  if (!v || /\s/.test(v)) return false
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`
  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    return /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(url.hostname)
  } catch {
    return false
  }
}

export const isValidEmail = (value: string): boolean => EMAIL_RE.test(value.trim())

const visibleSections = (r: Resume) => r.sections.filter((s) => s.visible)

function itemsOf<T extends Exclude<SectionType, 'summary'>>(r: Resume, type: T): ItemByType[T][] {
  return visibleSections(r)
    .filter((s: Section) => s.type === type)
    .flatMap((s) => (s as unknown as { items: ItemByType[T][] }).items)
}

const descriptionOf = (item: AnyItem): string => ('description' in item ? item.description : '')

/** Every non-empty description line of visible items, with the item kind. */
function descriptionLines(r: Resume): string[] {
  const lines: string[] = []
  for (const s of visibleSections(r)) {
    if (!('items' in s)) continue
    for (const item of s.items as AnyItem[]) {
      for (const block of parseDescription(descriptionOf(item))) {
        if (block.type === 'bullets') lines.push(...block.items)
        else lines.push(block.text)
      }
    }
  }
  return lines
}

/** Month index for comparisons; year-only dates map to Jan (start) / Dec (end). */
function monthIndex(value: string, edge: 'start' | 'end'): number | null {
  const d = parseYearMonth(value)
  if (!d) return null
  return d.year * 12 + (d.month ?? (edge === 'start' ? 1 : 12)) - 1
}

const clip = (s: string, n = 40) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

function datedLabel(item: AnyItem): string {
  const i = item as unknown as Record<string, string>
  return clip(i.jobTitle || i.degree || i.name || i.role || i.title || i.school || i.employer || 'pozycja')
}

export function runChecks(r: Resume): AtsCheck[] {
  const p = r.personal
  const checks: AtsCheck[] = []
  const add = (c: AtsCheck) => checks.push(c)

  // ---- personal data ----
  const hasFirst = !!p.firstName.trim()
  const hasLast = !!p.lastName.trim()
  add(
    hasFirst && hasLast
      ? { id: 'name', status: 'ok', message: 'Imię i nazwisko są uzupełnione.' }
      : {
          id: 'name',
          status: 'error',
          message: !hasFirst && !hasLast ? 'Brak imienia i nazwiska.' : hasFirst ? 'Brak nazwiska.' : 'Brak imienia.',
          tip: 'Systemy ATS identyfikują kandydata po imieniu i nazwisku – wpisz je w danych osobowych.',
        },
  )

  const email = p.email.trim()
  add(
    !email
      ? {
          id: 'email',
          status: 'error',
          message: 'Brak adresu e-mail.',
          tip: 'Rekruter musi mieć jak się z Tobą skontaktować.',
        }
      : !isValidEmail(email)
        ? {
            id: 'email',
            status: 'error',
            message: `Adres e-mail „${clip(email)}” wygląda na nieprawidłowy.`,
            tip: 'Sprawdź format, np. jan.kowalski@gmail.com.',
          }
        : { id: 'email', status: 'ok', message: 'Adres e-mail jest poprawny.' },
  )

  const phoneDigits = p.phone.replace(/\D/g, '')
  add(
    !p.phone.trim()
      ? {
          id: 'phone',
          status: 'error',
          message: 'Brak numeru telefonu.',
          tip: 'Dodaj numer z kierunkowym, np. +48 600 123 456.',
        }
      : phoneDigits.length < 7
        ? {
            id: 'phone',
            status: 'warn',
            message: 'Numer telefonu wygląda na niepełny.',
            tip: 'Podaj pełny numer z kierunkowym kraju.',
          }
        : { id: 'phone', status: 'ok', message: 'Numer telefonu jest podany.' },
  )

  add(
    p.city.trim() || p.country.trim()
      ? { id: 'location', status: 'ok', message: 'Lokalizacja jest podana.' }
      : {
          id: 'location',
          status: 'warn',
          message: 'Brak lokalizacji.',
          tip: 'Wpisz przynajmniej miasto – rekruterzy często filtrują kandydatów po lokalizacji.',
        },
  )

  add(
    p.jobTitle.trim()
      ? { id: 'jobTitle', status: 'ok', message: 'Stanowisko docelowe jest podane.' }
      : {
          id: 'jobTitle',
          status: 'warn',
          message: 'Brak stanowiska pod imieniem i nazwiskiem.',
          tip: 'Wpisz nazwę stanowiska z ogłoszenia, np. „Księgowa” lub „Frontend Developer”.',
        },
  )

  // ---- summary ----
  const summary = visibleSections(r)
    .filter((s) => s.type === 'summary')
    .map((s) => (s.type === 'summary' ? s.content.trim() : ''))
    .join('\n')
    .trim()
  const len = summary.length
  add(
    !len
      ? {
          id: 'summary',
          status: 'warn',
          message: 'Brak podsumowania zawodowego.',
          tip: `Napisz 3–5 zdań (${SUMMARY_MIN}–${SUMMARY_MAX} znaków) o doświadczeniu i najważniejszych osiągnięciach.`,
        }
      : len < SUMMARY_MIN
        ? {
            id: 'summary',
            status: 'warn',
            message: `Podsumowanie jest krótkie (${len} znaków).`,
            tip: `Celuj w ${SUMMARY_MIN}–${SUMMARY_MAX} znaków i użyj słów kluczowych z ogłoszenia.`,
          }
        : len > SUMMARY_MAX
          ? {
              id: 'summary',
              status: 'warn',
              message: `Podsumowanie jest długie (${len} znaków).`,
              tip: `Skróć je do maks. ${SUMMARY_MAX} znaków – rekruter poświęca mu kilka sekund.`,
            }
          : { id: 'summary', status: 'ok', message: `Podsumowanie ma dobrą długość (${len} znaków).` },
  )

  // ---- experience ----
  const jobs = itemsOf(r, 'experience').filter((j) => j.jobTitle.trim() || j.employer.trim() || j.description.trim())
  const incomplete = jobs.filter((j) => !j.employer.trim() || !j.jobTitle.trim() || !j.startDate.trim())
  add(
    !jobs.length
      ? {
          id: 'experience',
          status: 'error',
          message: 'Brak doświadczenia zawodowego.',
          tip: 'Dodaj co najmniej jedno stanowisko. Bez pracy? Wpisz staże, praktyki lub projekty.',
        }
      : incomplete.length
        ? {
            id: 'experience',
            status: 'warn',
            message: `${incomplete.length} z ${jobs.length} pozycji doświadczenia nie ma stanowiska, pracodawcy lub daty rozpoczęcia.`,
            tip: 'ATS odczytuje staż pracy z dat – uzupełnij je przy każdym stanowisku.',
          }
        : {
            id: 'experience',
            status: 'ok',
            message: `Doświadczenie zawodowe: ${jobs.length} poz. z datami i pracodawcą.`,
          },
  )

  if (jobs.length) {
    const withDesc = jobs.filter((j) => j.description.trim())
    const noBullets = withDesc.filter((j) => !parseDescription(j.description).some((b) => b.type === 'bullets'))
    add(
      !withDesc.length
        ? {
            id: 'bullets',
            status: 'warn',
            message: 'Stanowiska nie mają opisów obowiązków i osiągnięć.',
            tip: 'Dodaj 3–5 punktów do każdego stanowiska, zaczynając wiersze od „- ”.',
          }
        : noBullets.length
          ? {
              id: 'bullets',
              status: 'warn',
              message: `${noBullets.length} z ${withDesc.length} opisów stanowisk nie używa wypunktowań.`,
              tip: 'Zacznij każdy wiersz od „- ” – listy punktowane są czytelniejsze dla ATS i rekrutera.',
            }
          : { id: 'bullets', status: 'ok', message: 'Opisy stanowisk są wypunktowane.' },
    )
  }

  const achievementLines = [...jobs, ...itemsOf(r, 'projects')].flatMap((i) =>
    parseDescription(i.description).flatMap((b) => (b.type === 'bullets' ? b.items : [b.text])),
  )
  const quantified = achievementLines.filter((l) => /\d/.test(l)).length
  add(
    quantified >= 2
      ? { id: 'quantified', status: 'ok', message: `Osiągnięcia poparte liczbami: ${quantified}.` }
      : {
          id: 'quantified',
          status: 'warn',
          message: quantified ? 'Tylko jedno osiągnięcie jest poparte liczbą.' : 'Brak mierzalnych osiągnięć.',
          tip: 'Dodaj konkrety: „zwiększyłem sprzedaż o 20%”, „obsługiwałam 40 klientów dziennie”.',
        },
  )

  // ---- skills, education, languages ----
  const skillCount = itemsOf(r, 'skills').filter((s) => s.name.trim()).length
  add(
    skillCount >= MIN_SKILLS
      ? { id: 'skills', status: 'ok', message: `Umiejętności: ${skillCount}.` }
      : {
          id: 'skills',
          status: skillCount ? 'warn' : 'error',
          message: skillCount
            ? `Tylko ${skillCount} umiejętności (zalecane min. ${MIN_SKILLS}).`
            : 'Brak umiejętności.',
          tip: 'Wypisz konkretne narzędzia i kompetencje, najlepiej tymi samymi słowami co w ogłoszeniu.',
        },
  )

  const eduCount = itemsOf(r, 'education').filter((e) => e.school.trim() || e.degree.trim()).length
  add(
    eduCount
      ? { id: 'education', status: 'ok', message: 'Wykształcenie jest uzupełnione.' }
      : {
          id: 'education',
          status: 'warn',
          message: 'Brak wykształcenia.',
          tip: 'Dodaj szkołę lub uczelnię – wiele filtrów ATS sprawdza poziom wykształcenia.',
        },
  )

  const langCount = itemsOf(r, 'languages').filter((l) => l.name.trim()).length
  add(
    langCount
      ? { id: 'languages', status: 'ok', message: `Języki obce: ${langCount}.` }
      : {
          id: 'languages',
          status: 'warn',
          message: 'Brak znajomości języków.',
          tip: 'Podaj języki z poziomem w skali CEFR (np. angielski – B2).',
        },
  )

  // ---- photo ----
  add(
    r.settings.showPhoto && p.photo
      ? {
          id: 'photo',
          status: 'warn',
          message: 'CV zawiera zdjęcie.',
          tip: 'Zdjęcie bywa źle odczytywane przez ATS, a w USA, Wielkiej Brytanii czy Irlandii zwykle się go nie dodaje.',
        }
      : { id: 'photo', status: 'ok', message: 'CV bez zdjęcia – bezpieczne dla ATS i rynków zagranicznych.' },
  )

  // ---- dates ----
  const reversed: string[] = []
  for (const s of visibleSections(r)) {
    if (!('items' in s)) continue
    for (const item of s.items as AnyItem[]) {
      if (!('startDate' in item) || item.current) continue
      const start = monthIndex(item.startDate, 'start')
      const end = monthIndex(item.endDate, 'end')
      if (start !== null && end !== null && end < start) reversed.push(datedLabel(item))
    }
  }
  add(
    reversed.length
      ? {
          id: 'dates',
          status: 'error',
          message: `Data zakończenia jest wcześniejsza niż rozpoczęcia: ${reversed.join(', ')}.`,
          tip: 'Popraw kolejność dat – ATS może źle policzyć Twój staż pracy.',
        }
      : { id: 'dates', status: 'ok', message: 'Daty są spójne.' },
  )

  // ---- long lines ----
  const longLines = descriptionLines(r).filter((l) => l.length > LONG_LINE)
  add(
    longLines.length
      ? {
          id: 'longLines',
          status: 'warn',
          message: `${longLines.length} ${longLines.length === 1 ? 'punkt opisu ma' : 'punkty opisu mają'} ponad ${LONG_LINE} znaków.`,
          tip: 'Podziel długie akapity na krótkie punkty – jeden punkt, jedno osiągnięcie.',
        }
      : { id: 'longLines', status: 'ok', message: 'Punkty opisów mają rozsądną długość.' },
  )

  // ---- non-standard headings ----
  const renamed = visibleSections(r).filter((s) => {
    if (s.type === 'custom') return false
    const title = s.title.trim().toLowerCase()
    if (!title) return false
    return (
      title !== CV_LABELS.pl.sections[s.type].toLowerCase() && title !== CV_LABELS.en.sections[s.type].toLowerCase()
    )
  })
  add(
    renamed.length
      ? {
          id: 'sectionTitles',
          status: 'warn',
          message: `Niestandardowe nagłówki sekcji: ${renamed.map((s) => `„${clip(s.title.trim(), 30)}”`).join(', ')}.`,
          tip: 'ATS szuka typowych nagłówków („Doświadczenie zawodowe”, „Work Experience”). Wyczyść tytuł, by użyć domyślnego.',
        }
      : { id: 'sectionTitles', status: 'ok', message: 'Nagłówki sekcji są standardowe.' },
  )

  // ---- GDPR (Polish CVs only) ----
  if (r.language === 'pl') {
    add(
      r.settings.showGdpr
        ? { id: 'gdpr', status: 'ok', message: 'Klauzula RODO jest dodana.' }
        : {
            id: 'gdpr',
            status: 'warn',
            message: 'Brak klauzuli RODO.',
            tip: 'Polscy pracodawcy często wymagają zgody na przetwarzanie danych. Włącz ją w panelu „Wygląd”.',
          },
    )
  }

  // ---- URLs ----
  const urls: { label: string; url: string }[] = [
    { label: 'LinkedIn', url: p.linkedin },
    { label: 'strona WWW', url: p.website },
    { label: 'GitHub', url: p.github },
    ...p.links.map((l) => ({ label: l.label || 'link', url: l.url })),
    ...itemsOf(r, 'certifications').map((c) => ({ label: c.name || 'certyfikat', url: c.url })),
    ...itemsOf(r, 'projects').map((c) => ({ label: c.name || 'projekt', url: c.url })),
    ...itemsOf(r, 'publications').map((c) => ({ label: c.title || 'publikacja', url: c.url })),
  ]
  const badUrls = urls.filter((u) => u.url.trim() && !isValidUrl(u.url))
  add(
    badUrls.length
      ? {
          id: 'urls',
          status: 'error',
          message: `Nieprawidłowe linki: ${badUrls.map((u) => clip(u.label, 30)).join(', ')}.`,
          tip: 'Wklej pełny adres, np. https://www.linkedin.com/in/jan-kowalski.',
        }
      : { id: 'urls', status: 'ok', message: 'Linki są poprawne.' },
  )

  return checks
}

export function scoreChecks(checks: AtsCheck[]): number {
  let total = 0
  let earned = 0
  for (const c of checks) {
    const w = ATS_WEIGHTS[c.id] ?? 1
    total += w
    earned += w * STATUS_FACTOR[c.status]
  }
  return total ? Math.round((earned / total) * 100) : 0
}

// ---------------------------------------------------------------------------
// Keyword matching
// ---------------------------------------------------------------------------

/** Lowercase, no diacritics (ł -> l): the form used for matching. */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const STOPWORDS_RAW = `
a about above after again against all also am an and any are as at be because been before being below between both
but by can could did do does doing down during each etc few for from further had has have having he her here hers
him his how i if in into is it its itself just me more most my no nor not now of off on once only or other our ours
out over own per same she should so some such than that the their them then there these they this those through to
too under until up very via was we well were what when where which while who whom why will with within without would
you your yours us e.g ie i.e eg plus nice must
role position job jobs candidate candidates company team teams work working years year experience experienced
knowledge skills skill ability strong good great excellent looking join offer offers we're you'll requirements
required responsibilities responsible including include new day days opportunity environment based level using use
benefits salary
i oraz lub albo ani ale lecz a w we z ze na do od o u za przez przy po pod nad przed między dla bez jak jako
że ze się sie to ten ta te tego tej tym tych który która które którzy których którym jest są być był była było
będzie będą mamy masz ma nasz nasza nasze naszych naszym naszej twoje twoja twój twoich swoje swoich jego jej ich
nie tak też także oraz czy już jeszcze bardzo więcej mniej co kto gdzie kiedy np itp itd min max m.in r
oferujemy oferta wymagania wymagamy mile widziane widziana widziany obowiązki zakres zadań zadania stanowisko
stanowiska kandydat kandydata kandydatów osoba osoby osobę firma firmy firmie zespół zespole zespołu praca pracy
pracę pracować doświadczenie doświadczenia znajomość znajomości umiejętność umiejętności dobra dobrą dobry dobre
lat lata rok roku dzień szukamy poszukujemy dołącz dołączenia możliwość możliwości rozwoju rozwój codzienna
codzienne pracownik pracownika projektach projektów nowych nowe wiedza wiedzy minimum
`
const STOPWORDS = new Set(STOPWORDS_RAW.split(/\s+/).filter(Boolean).map(normalizeText))

/** Splits a raw token such as "react/vue" but keeps short combos like "ci/cd" or "ui/ux". */
function splitToken(token: string): string[] {
  const t = token.replace(/[._/-]+$/, '')
  if (!t.includes('/')) return [t]
  const parts = t.split('/').filter(Boolean)
  return parts.every((x) => x.length <= 3) ? [t] : parts.map((x) => x.replace(/[._-]+$/, ''))
}

const TOKEN_RE = /\.?[\p{L}\p{N}][\p{L}\p{N}+#._/-]*/gu

export interface KeywordToken {
  /** Normalized form (matching key). */
  key: string
  /** Lowercased surface form as written (for display). */
  display: string
}

/** Tokenizes PL/EN text, keeping tech tokens like "c++", "node.js", "ci/cd", ".net". */
export function tokenize(text: string): KeywordToken[] {
  const out: KeywordToken[] = []
  for (const m of text.toLowerCase().matchAll(TOKEN_RE)) {
    for (const display of splitToken(m[0])) {
      if (!display) continue
      out.push({ key: normalizeText(display), display })
    }
  }
  return out
}

const isTechToken = (key: string) => /[+#./]/.test(key) || (/\d/.test(key) && /[a-z]/.test(key))

const isMeaningful = (key: string) =>
  !STOPWORDS.has(key) && !/^[\d.,%+-]+$/.test(key) && (key.length >= 2 || /[+#]/.test(key))

/** Most frequent meaningful terms in the job ad (tech tokens get a small boost). */
export function extractKeywords(jobAd: string, limit = 20): KeywordToken[] {
  const stats = new Map<string, { token: KeywordToken; count: number; first: number }>()
  tokenize(jobAd).forEach((token, index) => {
    if (!isMeaningful(token.key)) return
    const s = stats.get(token.key)
    if (s) s.count++
    else stats.set(token.key, { token, count: 1, first: index })
  })
  return [...stats.values()]
    .map((s) => ({ ...s, rank: s.count + (isTechToken(s.token.key) ? 0.5 : 0) }))
    .sort((a, b) => b.rank - a.rank || a.first - b.first)
    .slice(0, limit)
    .map((s) => s.token)
}

/** All user-entered text of a resume (visible sections only). */
export function resumeText(r: Resume): string {
  const parts: string[] = []
  const { photo: _photo, links, ...personal } = r.personal
  parts.push(...Object.values(personal), ...links.map((l) => `${l.label} ${l.url}`))
  for (const s of visibleSections(r)) {
    parts.push(s.title)
    if (s.type === 'summary') parts.push(s.content)
    if ('items' in s) {
      for (const item of s.items as AnyItem[]) {
        for (const [k, v] of Object.entries(item)) if (k !== 'id' && typeof v === 'string') parts.push(v)
      }
    }
  }
  return parts.join('\n')
}

function commonPrefix(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/** Exact match, simple plural, or shared stem (handles Polish inflection: "javascriptu" ~ "javascript"). */
function tokensMatch(rawA: string, rawB: string): boolean {
  const a = rawA.replace(/-/g, '')
  const b = rawB.replace(/-/g, '')
  if (a === b) return true
  if (a + 's' === b || b + 's' === a || a + 'es' === b || b + 'es' === a) return true
  if (isTechToken(a) || isTechToken(b)) return false
  const min = Math.min(a.length, b.length)
  if (min < 5) return false
  const prefix = commonPrefix(a, b)
  return prefix >= 5 && prefix >= min - 2
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Whole-term search, so "s3" does not match inside "css3". */
const containsTerm = (text: string, term: string) =>
  new RegExp(String.raw`(^|[^\p{L}\p{N}])${escapeRe(term)}($|[^\p{L}\p{N}+#])`, 'u').test(text)

export function matchKeywords(r: Resume, jobAd: string, limit = 20): AtsKeywords {
  const keywords = extractKeywords(jobAd, limit)
  const text = normalizeText(resumeText(r))
  const resumeKeys = [...new Set(tokenize(text).map((t) => t.key))]
  const matched: string[] = []
  const missing: string[] = []
  for (const kw of keywords) {
    const hit = isTechToken(kw.key)
      ? resumeKeys.includes(kw.key) || containsTerm(text, kw.key)
      : resumeKeys.some((k) => tokensMatch(kw.key, k))
    ;(hit ? matched : missing).push(kw.display)
  }
  return { matched, missing }
}

/** Full ATS analysis: weighted checks, a 0–100 score and optional keyword match. */
export function analyzeResume(resume: Resume, jobAd?: string): AtsResult {
  const checks = runChecks(resume)
  const result: AtsResult = { score: scoreChecks(checks), checks }
  if (jobAd && jobAd.trim()) result.keywords = matchKeywords(resume, jobAd)
  return result
}
