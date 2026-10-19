/** Test-only helpers: fixtures + Node rendering/extraction. Not imported by app code. */
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { AnyItem, CvLanguage, Resume, Section, SectionType } from '../types/resume'
import { createEmptyItem, createEmptyResume, createSection, SECTION_TYPES } from '../lib/factory'
import { registerFonts } from './fonts'
import { ResumeDocument } from './ResumeDocument'

/** Absolute file-system path of public/fonts (works without Node typings). */
function fontsDir(): string {
  const url = new URL('../../public/fonts/', import.meta.url)
  const p = decodeURIComponent(url.pathname)
  return /^\/[A-Za-z]:\//.test(p) ? p.slice(1) : p
}

export function registerTestFonts(): void {
  const dir = fontsDir()
  registerFonts((file) => dir + file)
}

/** Minimal Node access without pulling @types/node into the app tsconfig. */
interface NodeFs {
  mkdirSync(p: string, o: { recursive: boolean }): void
  writeFileSync(p: string, data: Uint8Array): void
}
export async function nodeFs(): Promise<NodeFs> {
  const id = 'node:fs'
  return (await import(/* @vite-ignore */ id)) as NodeFs
}
export const env = (name: string): string | undefined =>
  (globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env[name]

export async function renderResume(resume: Resume): Promise<Uint8Array> {
  registerTestFonts()
  const buf = await renderToBuffer(createElement(ResumeDocument, { resume }) as Parameters<typeof renderToBuffer>[0])
  return new Uint8Array(buf)
}

export interface Extracted {
  pages: string[]
  /** All pages joined with newlines; lines reconstructed from pdf.js EOL markers. */
  text: string
  /** Same as text but whitespace-collapsed to a single line – handy for order checks. */
  flat: string
  info: Record<string, unknown>
  links: string[]
  numPages: number
}

export async function extract(data: Uint8Array): Promise<Extracted> {
  const task = getDocument({ data: data.slice(), disableFontFace: true, useSystemFonts: false, verbosity: 0 })
  const doc = await task.promise
  const pages: string[] = []
  const links: string[] = []
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n)
    const content = await page.getTextContent()
    let out = ''
    for (const item of content.items) {
      if (!('str' in item)) continue
      out += item.str
      if (item.hasEOL) out += '\n'
    }
    pages.push(out)
    for (const a of await page.getAnnotations()) {
      if (a.url) links.push(a.url as string)
    }
  }
  const meta = await doc.getMetadata()
  const text = pages.join('\n')
  await task.destroy()
  return {
    pages,
    text,
    flat: text.replace(/\s+/g, ' ').trim(),
    info: meta.info as Record<string, unknown>,
    links,
    numPages: pages.length,
  }
}

export const renderAndExtract = async (resume: Resume) => extract(await renderResume(resume))

function item<T extends Exclude<SectionType, 'summary'>>(type: T, patch: Partial<AnyItem>): AnyItem {
  return { ...createEmptyItem(type), ...patch } as AnyItem
}

function withItems(type: Exclude<SectionType, 'summary'>, items: Partial<AnyItem>[]): Section {
  const s = createSection(type) as Section & { items: AnyItem[] }
  s.items = items.map((p) => item(type, p))
  return s
}

/** A resume with every field of every section type filled in. */
export function fullResume(language: CvLanguage = 'pl'): Resume {
  const r = createEmptyResume(language, 'Test')
  r.personal = {
    ...r.personal,
    firstName: 'Łukasz',
    lastName: 'Żółkiewski',
    jobTitle: 'Senior Frontend Developer',
    email: 'lukasz@example.com',
    phone: '+48 600 100 200',
    city: 'Kraków',
    country: 'Polska',
    address: 'ul. Długa 5/12',
    postalCode: '31-147',
    linkedin: 'https://www.linkedin.com/in/lukasz-zolkiewski/',
    website: 'zolkiewski.dev',
    github: 'lzolkiewski',
    dateOfBirth: '1990-03-12',
    nationality: 'polskie',
    drivingLicense: 'kat. B',
    photo: '',
    links: [{ id: 'l1', label: 'Portfolio', url: 'https://dribbble.com/lukasz' }],
  }
  const summary = createSection('summary') as Section & { content: string }
  summary.content = 'Zażółć gęślą jaźń. Programista z 8-letnim doświadczeniem w budowie aplikacji webowych.\n- React, TypeScript\n- Dostępność (WCAG)'
  const refs = withItems('references', [
    { name: 'Anna Nowak', position: 'CTO', company: 'Softwarehouse sp. z o.o.', email: 'anna@example.com', phone: '+48 500 000 000' },
  ])
  r.sections = [
    summary,
    withItems('experience', [
      {
        jobTitle: 'Senior Frontend Developer',
        employer: 'Allegro',
        city: 'Poznań',
        startDate: '2021-10',
        endDate: '',
        current: true,
        description:
          'Rozwój platformy e-commerce.\n- Wdrożenie mikrofrontendów (Module Federation)\n- Konstantynopolitańczykowianeczka optymalizacja Core Web Vitals o 35%',
      },
      {
        jobTitle: 'Frontend Developer',
        employer: 'Software House',
        city: 'Kraków',
        startDate: '2018-03',
        endDate: '2021-09',
        current: false,
        description: '- Aplikacje SPA w React i Redux\n- Testy jednostkowe (Jest)',
      },
    ]),
    withItems('education', [
      {
        degree: 'Magister inżynier',
        fieldOfStudy: 'Informatyka',
        school: 'Politechnika Krakowska',
        city: 'Kraków',
        startDate: '2013-10',
        endDate: '2018-06',
        description: 'Praca dyplomowa: systemy rozproszone.',
      },
    ]),
    withItems('skills', [
      { name: 'React', level: 5 },
      { name: 'TypeScript', level: 4 },
      { name: 'Node.js', level: 0 },
    ]),
    withItems('languages', [
      { name: 'Angielski', level: 'C1' },
      { name: 'Niemiecki', level: 'A2' },
      { name: 'Polski', level: 'native' },
    ]),
    withItems('certifications', [
      { name: 'AWS Certified Developer', issuer: 'Amazon Web Services', date: '2022-05', url: 'https://aws.amazon.com/cert/123' },
    ]),
    withItems('courses', [
      { name: 'Advanced React Patterns', institution: 'Frontend Masters', startDate: '2020-01', endDate: '2020-02', description: 'Wzorce kompozycji.' },
    ]),
    withItems('projects', [
      {
        name: 'CV Kreator',
        role: 'Autor',
        url: 'https://github.com/lzolkiewski/cv',
        startDate: '2024-01',
        endDate: '',
        current: true,
        description: '- Generator CV przyjazny dla ATS',
      },
    ]),
    withItems('awards', [{ name: 'Hackathon – 1. miejsce', issuer: 'HackYeah', date: '2019-10', description: 'Aplikacja dla seniorów.' }]),
    withItems('volunteering', [
      { role: 'Mentor', organization: 'Fundacja Kod', city: 'Warszawa', startDate: '2019-01', endDate: '2020-12', description: 'Warsztaty z programowania.' },
    ]),
    withItems('publications', [
      { title: 'Dostępne formularze w praktyce', publisher: 'Programista Magazyn', date: '2021-04', url: 'https://example.com/art', description: 'Artykuł o ARIA.' },
    ]),
    withItems('interests', [{ name: 'Wspinaczka' }, { name: 'Szachy' }, { name: 'Fotografia' }]),
    refs,
    withItems('custom', [
      { title: 'Konferencje', subtitle: 'Prelegent – meet.js', city: 'Gdańsk', startDate: '2023', endDate: '', description: 'Wystąpienie o wydajności.' },
    ]),
  ]
  r.settings.showGdpr = true
  return r
}

export { SECTION_TYPES }
