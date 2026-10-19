import type {
  AnyItem,
  CvLanguage,
  DateFormat,
  ExtraLink,
  FontSize,
  LanguageLevel,
  PersonalInfo,
  Resume,
  ResumeSettings,
  Section,
  SectionType,
  Spacing,
  TemplateId,
} from '../types/resume'
import { createEmptyItem, createSection, defaultSettings, emptyPersonal, SECTION_TYPES, uid } from './factory'

export const APP_ID = 'cv-kreator'
export const FORMAT_VERSION = 1

export interface ResumeEnvelope {
  app: typeof APP_ID
  version: number
  resume: Resume
}

/** Pretty JSON backup wrapped in an app/version envelope. */
export function serializeResume(resume: Resume): string {
  const envelope: ResumeEnvelope = { app: APP_ID, version: FORMAT_VERSION, resume }
  return JSON.stringify(envelope, null, 2)
}

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

const toStr = (v: unknown, fallback = ''): string => {
  if (typeof v === 'string') return v
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  if (typeof v === 'boolean') return String(v)
  return fallback
}

const toBool = (v: unknown, fallback: boolean): boolean => {
  if (typeof v === 'boolean') return v
  if (v === 'true' || v === 1 || v === '1') return true
  if (v === 'false' || v === 0 || v === '0') return false
  return fallback
}

const toNum = (v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) ? n : fallback
}

const toId = (v: unknown): string => {
  const s = toStr(v).trim()
  return s || uid()
}

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback

const LANGUAGES: CvLanguage[] = ['pl', 'en']
const TEMPLATES: TemplateId[] = ['classic', 'modern', 'compact']
const FONT_SIZES: FontSize[] = ['small', 'medium', 'large']
const DATE_FORMATS: DateFormat[] = ['text', 'numeric']
const SPACINGS: Spacing[] = ['compact', 'normal', 'relaxed']
const LANGUAGE_LEVELS: LanguageLevel[] = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

function normalizePersonal(raw: unknown): PersonalInfo {
  const base = emptyPersonal()
  if (!isObj(raw)) return base
  const out = { ...base }
  for (const key of Object.keys(base) as (keyof PersonalInfo)[]) {
    if (key === 'links' || key === 'photo') continue
    out[key] = toStr(raw[key])
  }
  // Only embedded images are allowed as photos (no remote URLs / scripts).
  const photo = toStr(raw.photo)
  out.photo = /^data:image\/(png|jpe?g|webp);base64,/i.test(photo) ? photo : ''
  out.links = Array.isArray(raw.links)
    ? raw.links.filter(isObj).map((l): ExtraLink => ({ id: toId(l.id), label: toStr(l.label), url: toStr(l.url) }))
    : []
  return out
}

function normalizeSettings(raw: unknown, language: CvLanguage): ResumeSettings {
  const base = defaultSettings(language)
  if (!isObj(raw)) return base
  const accent = toStr(raw.accentColor).trim()
  return {
    template: oneOf(raw.template, TEMPLATES, base.template),
    accentColor: HEX.test(accent) ? accent : base.accentColor,
    fontSize: oneOf(raw.fontSize, FONT_SIZES, base.fontSize),
    dateFormat: oneOf(raw.dateFormat, DATE_FORMATS, base.dateFormat),
    spacing: oneOf(raw.spacing, SPACINGS, base.spacing),
    showPhoto: toBool(raw.showPhoto, base.showPhoto),
    showGdpr: toBool(raw.showGdpr, base.showGdpr),
    gdprText: toStr(raw.gdprText),
  }
}

/** Coerces every field of an unknown item to the shape of createEmptyItem(type). */
function normalizeItem(type: Exclude<SectionType, 'summary'>, raw: Obj): AnyItem {
  const template = createEmptyItem(type) as unknown as Obj
  const out: Obj = {}
  for (const [key, def] of Object.entries(template)) {
    const v = raw[key]
    if (key === 'id') out.id = toId(v)
    else if (typeof def === 'number') out[key] = toNum(v, def)
    else if (typeof def === 'boolean') out[key] = toBool(v, def)
    else out[key] = toStr(v, def as string)
  }
  if (type === 'skills') out.level = Math.min(5, Math.max(0, Math.round(out.level as number)))
  if (type === 'languages') out.level = oneOf(out.level, LANGUAGE_LEVELS, '')
  return out as unknown as AnyItem
}

function normalizeSection(raw: unknown): Section | null {
  if (!isObj(raw) || !SECTION_TYPES.includes(raw.type as SectionType)) return null
  const type = raw.type as SectionType
  const section = createSection(type) as Section & Obj
  section.id = toId(raw.id)
  section.title = toStr(raw.title)
  section.visible = toBool(raw.visible, true)
  if (section.type === 'summary') {
    section.content = toStr(raw.content)
    return section
  }
  if (section.type === 'references') section.onRequest = toBool(raw.onRequest, false)
  const items = Array.isArray(raw.items) ? raw.items.filter(isObj) : []
  ;(section as { items: AnyItem[] }).items = items.map((i) => normalizeItem(type as Exclude<SectionType, 'summary'>, i))
  return section
}

/**
 * Parses a JSON backup (envelope or bare resume) and normalizes it defensively.
 * Throws an Error with a Polish, user-facing message on invalid input.
 */
export function parseResumeJson(text: string): Resume {
  let data: unknown
  try {
    data = JSON.parse(text.replace(/^﻿/, ''))
  } catch {
    throw new Error('Plik nie jest poprawnym plikiem JSON.')
  }
  if (!isObj(data)) throw new Error('Plik nie zawiera danych CV.')
  if (typeof data.app === 'string' && data.app !== APP_ID) {
    throw new Error('Ten plik pochodzi z innej aplikacji i nie zawiera CV z CV Kreatora.')
  }
  const raw = isObj(data.resume) ? data.resume : data
  if (!isObj(raw.personal) && !Array.isArray(raw.sections)) {
    throw new Error('Plik nie zawiera danych CV (brak danych osobowych i sekcji).')
  }
  if (raw.sections !== undefined && !Array.isArray(raw.sections)) {
    throw new Error('Nieprawidłowy format pliku: pole „sections” musi być listą.')
  }

  const language = oneOf(raw.language, LANGUAGES, 'pl')
  const now = new Date().toISOString()
  const sections = Array.isArray(raw.sections)
    ? raw.sections.map(normalizeSection).filter((s): s is Section => s !== null)
    : []
  const name = toStr(raw.name).trim()

  return {
    id: toId(raw.id),
    name: name || (language === 'pl' ? 'Zaimportowane CV' : 'Imported CV'),
    language,
    createdAt: toStr(raw.createdAt) || now,
    updatedAt: toStr(raw.updatedAt) || now,
    personal: normalizePersonal(raw.personal),
    sections,
    settings: normalizeSettings(raw.settings, language),
  }
}

/** ASCII-safe file-name fragment: "Łukasz Żurawski" -> "Lukasz_Zurawski". */
export function asciiSlug(text: string): string {
  return text
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/** "CV_Jan_Kowalski.json", falling back to the resume name, then "CV.json". */
export function jsonFileName(resume: Resume): string {
  const person = asciiSlug(`${resume.personal.firstName} ${resume.personal.lastName}`)
  const slug = person || asciiSlug(resume.name)
  return slug ? `CV_${slug}.json` : 'CV.json'
}

/** Browser-only: downloads the resume as a JSON backup file. */
export function downloadResumeJson(resume: Resume): void {
  const blob = new Blob([serializeResume(resume)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = jsonFileName(resume)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
