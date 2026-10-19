import { describe, expect, it } from 'vitest'
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { FontSize, Resume, Section, TemplateId } from '../types/resume'
import { createEmptyResume, createSection } from '../lib/factory'
import { CV_LABELS } from '../i18n/cvLabels'
import { pdfFileName } from './index'
import { env, extract, fullResume, nodeFs, renderAndExtract, renderResume } from './testing'

const TEMPLATES: TemplateId[] = ['classic', 'modern', 'compact']
const T = 60_000

// 1x1 red PNG
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='

const section = <S extends Section['type']>(r: Resume, type: S) =>
  r.sections.find((s) => s.type === type) as Extract<Section, { type: S }>

const countOf = (haystack: string, needle: string) => haystack.split(needle).length - 1

async function countImages(data: Uint8Array): Promise<number> {
  const task = getDocument({ data: data.slice(), verbosity: 0 })
  const doc = await task.promise
  let n = 0
  for (let p = 1; p <= doc.numPages; p++) {
    const ops = await (await doc.getPage(p)).getOperatorList()
    n += ops.fnArray.filter((f) => f === OPS.paintImageXObject || f === OPS.paintInlineImageXObject).length
  }
  await task.destroy()
  return n
}

describe('Polish text and fonts', () => {
  it('extracts Polish diacritics exactly (no missing glyphs)', async () => {
    const x = await renderAndExtract(fullResume('pl'))
    expect(x.text).toContain('Łukasz Żółkiewski')
    expect(x.text).toContain('Doświadczenie zawodowe')
    expect(x.text).toContain('Zażółć gęślą jaźń.')
    expect(x.text).toContain('ul. Długa 5/12, 31-147 Kraków, Polska')
    expect(x.text).toContain('Wykształcenie')
    // no replacement characters / NULs from missing glyph mappings
    expect(x.text).not.toContain(String.fromCharCode(0xfffd))
    expect(x.text).not.toContain(String.fromCharCode(0))
  }, T)

  it('writes document metadata', async () => {
    const x = await renderAndExtract(fullResume('pl'))
    expect(x.info.Title).toBe('Łukasz Żółkiewski – CV')
    expect(x.info.Author).toBe('Łukasz Żółkiewski')
    expect(x.info.Subject).toBe('Senior Frontend Developer')
    expect(x.info.Keywords).toBe('React, TypeScript, Node.js')
    expect(x.info.Creator).toBe('CV Kreator')
    expect(x.info.Language).toBe('pl-PL')
    const en = await renderAndExtract(fullResume('en'))
    expect(en.info.Language).toBe('en-US')
  }, T)
})

describe('language switching', () => {
  it('renders English labels and dates', async () => {
    const x = await renderAndExtract(fullResume('en'))
    for (const s of ['Work Experience', 'Education', 'Skills', 'Languages', 'Professional Summary', 'References']) {
      expect(x.text).toContain(s)
    }
    expect(x.text).toContain('Oct 2021 – Present')
    expect(x.text).toContain('Mar 2018 – Sep 2021')
    expect(x.text).toContain('React – Expert')
    expect(x.text).toContain('Angielski – Advanced (C1)')
    expect(x.text).toContain('Issued by: Amazon Web Services')
    expect(x.text).toContain('Date of birth: 12 Mar 1990')
    expect(x.text).toContain(CV_LABELS.en.gdprDefault.slice(0, 40))
    expect(x.text).not.toContain('obecnie')
    expect(x.text).not.toContain('Doświadczenie')
  }, T)

  it('renders Polish labels, month names and "obecnie"', async () => {
    const x = await renderAndExtract(fullResume('pl'))
    expect(x.text).toContain('paź 2021 – obecnie')
    expect(x.text).toContain('mar 2018 – wrz 2021')
    expect(x.text).toContain('React – Ekspert, TypeScript – Zaawansowany, Node.js')
    expect(x.text).toContain('Angielski – Zaawansowany (C1), Niemiecki – Podstawowy (A2), Polski – Ojczysty')
    expect(x.text).toContain('Wystawca: Amazon Web Services')
    expect(x.text).toContain('Data urodzenia: 12 mar 1990 | Obywatelstwo: polskie | Prawo jazdy: kat. B')
    expect(x.text).not.toContain('Present')
  }, T)

  it('respects the numeric date format', async () => {
    const r = fullResume('pl')
    r.settings.dateFormat = 'numeric'
    const x = await renderAndExtract(r)
    expect(x.text).toContain('10.2021 – obecnie')
    const en = fullResume('en')
    en.settings.dateFormat = 'numeric'
    expect((await renderAndExtract(en)).text).toContain('10/2021 – Present')
  }, T)
})

describe('ATS safety', () => {
  it('never hyphenates words', async () => {
    const r = fullResume('pl')
    const words = ['Konstantynopolitańczykowianeczka', 'internationalization', 'mikrofrontendowej', 'Współpracowałem']
    section(r, 'summary').content = Array.from({ length: 30 }, (_, i) => words[i % words.length]).join(' ')
    const x = await renderAndExtract(r)
    const summary = x.text.slice(x.text.indexOf('Podsumowanie zawodowe'), x.text.indexOf('Doświadczenie zawodowe'))
    for (const w of words) {
      expect(countOf(summary, w)).toBeGreaterThanOrEqual(7)
    }
    expect(summary).not.toMatch(/\p{L}-\n/u)
    // Every token in the summary is one of the source words.
    const tokens = summary.replace('Podsumowanie zawodowe', '').split(/\s+/).filter(Boolean)
    expect(tokens.every((t) => words.includes(t))).toBe(true)
  }, T)

  it('keeps visual reading order: name, job title, contact, headings, items', async () => {
    const x = await renderAndExtract(fullResume('pl'))
    const order = [
      'Łukasz Żółkiewski',
      'Senior Frontend Developer',
      'lukasz@example.com',
      'Podsumowanie zawodowe',
      'Zażółć gęślą jaźń',
      'Doświadczenie zawodowe',
      'Senior Frontend Developer paź 2021 – obecnie',
      'Allegro, Poznań',
      'Rozwój platformy e-commerce.',
      '• Wdrożenie mikrofrontendów',
      'Frontend Developer mar 2018 – wrz 2021',
      'Wykształcenie',
      'Magister inżynier, Informatyka',
      'Politechnika Krakowska, Kraków',
      'Umiejętności',
      'Języki obce',
      'Certyfikaty',
      'Kursy i szkolenia',
      'Projekty',
      'Nagrody i wyróżnienia',
      'Wolontariat',
      'Publikacje',
      'Zainteresowania',
      'Referencje',
      'Dodatkowe informacje',
      'Wyrażam zgodę',
    ]
    let last = -1
    for (const s of order) {
      const i = x.flat.indexOf(s, last + 1)
      expect(i, `"${s}" should appear after position ${last}`).toBeGreaterThan(last)
      last = i
    }
  }, T)

  it('puts the photo after the header text in reading order and only when enabled', async () => {
    const r = fullResume('pl')
    r.personal.photo = PNG
    r.settings.showPhoto = false
    expect(await countImages(await renderResume(r))).toBe(0)
    r.settings.showPhoto = true
    const data = await renderResume(r)
    expect(await countImages(data)).toBe(1)
    const x = await extract(data)
    expect(x.flat.startsWith('Łukasz Żółkiewski Senior Frontend Developer')).toBe(true)
  }, T)

  it('renders clickable links with readable visible text', async () => {
    const x = await renderAndExtract(fullResume('pl'))
    expect(x.text).toContain(
      'linkedin.com/in/lukasz-zolkiewski | github.com/lzolkiewski | zolkiewski.dev | Portfolio: dribbble.com/lukasz',
    )
    expect(x.text).not.toContain('https://')
    expect(x.links).toEqual(
      expect.arrayContaining([
        'mailto:lukasz@example.com',
        'https://www.linkedin.com/in/lukasz-zolkiewski/',
        'https://github.com/lzolkiewski',
        'https://zolkiewski.dev/',
        'https://dribbble.com/lukasz',
        'https://github.com/lzolkiewski/cv',
      ]),
    )
  }, T)

  it('skips empty fields without dangling separators', async () => {
    const r = createEmptyResume('pl')
    r.personal.firstName = 'Jan'
    r.personal.lastName = 'Kowalski'
    r.personal.email = 'jan@example.com'
    r.personal.city = 'Gdańsk'
    r.personal.github = 'jank'
    const exp = section(r, 'experience')
    exp.items = [
      { id: 'e1', jobTitle: 'Tester', employer: '', city: 'Gdańsk', startDate: '', endDate: '', current: false, description: '' },
      { id: 'e2', jobTitle: '', employer: 'ACME', city: '', startDate: '2020-01', endDate: '', current: false, description: '' },
    ]
    const x = await renderAndExtract(r)
    expect(x.text).toContain('jan@example.com | Gdańsk\n')
    expect(x.text).toContain('github.com/jank')
    expect(x.text).toContain('Tester\nGdańsk')
    expect(x.text).toContain('ACME sty 2020')
    expect(x.text).not.toMatch(/\|\s*\|/)
    expect(x.text).not.toMatch(/(^|\n)\s*[|,–]/)
    expect(x.text).not.toMatch(/[|,–]\s*(\n|$)/)
    expect(x.text).not.toContain('undefined')
  }, T)
})

describe('section visibility', () => {
  it('omits hidden and empty sections', async () => {
    const r = fullResume('pl')
    section(r, 'experience').visible = false
    section(r, 'summary').content = '   \n  '
    const courses = section(r, 'courses')
    courses.items = [{ id: 'c', name: ' ', institution: '', startDate: '2020-01', endDate: '', current: false, description: '' }]
    const emptyCustom = createSection('custom')
    emptyCustom.title = 'Pusta sekcja'
    r.sections.push(emptyCustom)
    const x = await renderAndExtract(r)
    expect(x.text).not.toContain('Doświadczenie zawodowe')
    expect(x.text).not.toContain('Allegro')
    expect(x.text).not.toContain('Podsumowanie zawodowe')
    expect(x.text).not.toContain('Kursy i szkolenia')
    expect(x.text).not.toContain('Pusta sekcja')
    expect(x.text).toContain('Wykształcenie')
  }, T)

  it('uses custom section titles', async () => {
    const r = fullResume('en')
    section(r, 'experience').title = 'Career History'
    const x = await renderAndExtract(r)
    expect(x.text).toContain('Career History')
    expect(x.text).not.toContain('Work Experience')
  }, T)

  it('shows the GDPR clause only when enabled, with custom text support', async () => {
    const r = fullResume('pl')
    r.settings.showGdpr = false
    expect((await renderAndExtract(r)).text).not.toContain('Wyrażam zgodę')
    r.settings.showGdpr = true
    r.settings.gdprText = 'Zgoda na przetwarzanie danych przez firmę Żabka S.A.'
    const x = await renderAndExtract(r)
    expect(x.text).toContain('Zgoda na przetwarzanie danych przez firmę Żabka S.A.')
    expect(x.text).not.toContain('Wyrażam zgodę')
    // GDPR is the last content in the flow.
    expect(x.flat.lastIndexOf('Żabka S.A.')).toBeGreaterThan(x.flat.lastIndexOf('Dodatkowe informacje'))
  }, T)

  it('prints "references on request" instead of reference items', async () => {
    const r = fullResume('pl')
    section(r, 'references').onRequest = true
    const x = await renderAndExtract(r)
    expect(x.text).toContain('Referencje')
    expect(x.text).toContain('Referencje dostępne na życzenie.')
    expect(x.text).not.toContain('Anna Nowak')
    // onRequest renders even without items.
    section(r, 'references').items = []
    expect((await renderAndExtract(r)).text).toContain('Referencje dostępne na życzenie.')
  }, T)
})

/** Text lines of page 1 with their baseline (pt from the page bottom), page numbers excluded. */
async function pageOneLines(data: Uint8Array): Promise<{ numPages: number; lines: { text: string; y: number }[] }> {
  const task = getDocument({ data: data.slice(), verbosity: 0 })
  const doc = await task.promise
  const content = await (await doc.getPage(1)).getTextContent()
  const lines: { text: string; y: number }[] = []
  for (const it of content.items) {
    if (!('str' in it) || !it.str.trim() || /^\d+ \/ \d+$/.test(it.str.trim())) continue
    lines.push({ text: it.str, y: it.transform[5] })
  }
  const numPages = doc.numPages
  await task.destroy()
  return { numPages, lines }
}

describe('page breaks', () => {
  it.each(TEMPLATES)(
    '%s: a one-line section is not pushed to the next page when it fits',
    async (template) => {
      // Fill page 1 with a growing summary so the page boundary sweeps across the
      // following one-line Languages section. Whenever Languages ends up on page 2,
      // page 1 must not have had room for it (gap + heading + one line ≈ 45–50pt).
      // With the old fixed 80pt reservation this failed with 60–90pt left empty.
      let sawFitOnPageOne = false
      let sawPushed = false
      const [from, to] = template === 'compact' ? [50, 66] : [36, 48]
      for (let n = from; n <= to; n++) {
        const r = createEmptyResume('en')
        r.settings.template = template
        r.settings.showGdpr = false
        r.personal.firstName = 'Jan'
        r.personal.lastName = 'Kowalski'
        const summary = section(r, 'summary')
        summary.content = Array.from({ length: n }, (_, i) => `- Achievement number ${i + 1}`).join('\n')
        section(r, 'languages').items = [{ id: 'l', name: 'English', level: 'C1' }]
        // More content follows Languages (as in a real CV), so a fixed presence reservation would bite.
        r.sections = r.sections.filter((s) => s.type === 'summary' || s.type === 'languages')
        const extra = createSection('interests') as Extract<Section, { type: 'interests' }>
        extra.items = Array.from({ length: 40 }, (_, i) => ({ id: `i${i}`, name: `Interest ${i}` }))
        r.sections.push(extra)
        const { numPages, lines } = await pageOneLines(await renderResume(r))
        const onPageOne = lines.some((l) => l.text.includes('English – Advanced (C1)'))
        // Free space between the lowest text baseline and the bottom margin.
        const lowest = Math.min(...lines.map((l) => l.y))
        const bottomMargin = { classic: 50, modern: 46, compact: 30 }[template]
        const free = lowest - bottomMargin
        if (onPageOne) sawFitOnPageOne = true
        else {
          expect(numPages).toBe(2)
          sawPushed = true
          expect(free, `n=${n}: Languages pushed although ${free.toFixed(0)}pt were free`).toBeLessThan(55)
        }
      }
      expect(sawFitOnPageOne).toBe(true)
      expect(sawPushed).toBe(true)
    },
    T,
  )

  it.each(TEMPLATES)('%s: a very long inline list never orphans its heading', async (template) => {
    for (let extra = 0; extra < 6; extra++) {
      const r = fullResume('pl')
      r.settings.template = template
      section(r, 'skills').items = Array.from({ length: 70 }, (_, i) => ({ id: `s${i}`, name: `Umiejętność${i}`, level: 0 }))
      const exp = section(r, 'experience')
      for (let i = 0; i < extra; i++) exp.items.push({ ...exp.items[1], id: `x${i}` })
      const x = await renderAndExtract(r)
      const headings = Object.values(CV_LABELS.pl.sections)
      for (const page of x.pages.slice(0, -1)) {
        const lines = page.split('\n').map((l) => l.trim()).filter((l) => l && !/^\d+ \/ \d+$/.test(l))
        expect(headings).not.toContain(lines[lines.length - 1])
      }
      expect(x.text).toContain('Umiejętność69')
    }
  }, T)
})

describe('templates', () => {
  it.each(TEMPLATES)('%s renders every section type of a fully populated resume', async (template) => {
    const r = fullResume('pl')
    r.settings.template = template
    r.settings.showPhoto = true
    r.personal.photo = PNG
    const x = await renderAndExtract(r)
    const expected = [
      'Podsumowanie zawodowe', 'Doświadczenie zawodowe', 'Wykształcenie', 'Umiejętności', 'Języki obce', 'Certyfikaty',
      'Kursy i szkolenia', 'Projekty', 'Nagrody i wyróżnienia', 'Wolontariat', 'Publikacje', 'Zainteresowania',
      'Referencje', 'Dodatkowe informacje',
      // a field of every item type
      'Allegro, Poznań', 'Politechnika Krakowska, Kraków', 'aws.amazon.com/cert/123', 'Frontend Masters', 'Rola: Autor',
      'github.com/lzolkiewski/cv', 'HackYeah', 'Fundacja Kod, Warszawa', 'Programista Magazyn', 'example.com/art',
      'Wspinaczka, Szachy, Fotografia', 'CTO, Softwarehouse sp. z o.o.', 'anna@example.com | +48 500 000 000',
      'Prelegent – meet.js, Gdańsk', 'Wystąpienie o wydajności.', '• Generator CV przyjazny dla ATS',
    ]
    for (const s of expected) expect(x.text, `${template}: ${s}`).toContain(s)
    // each heading appears exactly once (no duplication across pages)
    expect(countOf(x.text, 'Doświadczenie zawodowe')).toBe(1)
    expect(x.numPages).toBeGreaterThanOrEqual(1)
    if (x.numPages > 1) expect(x.text).toContain(`1 / ${x.numPages}`)
  }, T)

  it.each(TEMPLATES.flatMap((t) => (['small', 'medium', 'large'] as FontSize[]).map((f) => [t, f] as const)))(
    '%s/%s never leaves a section heading orphaned at the bottom of a page',
    async (template, fontSize) => {
      const headings = Object.values(CV_LABELS.pl.sections)
      // Vary the amount of experience so section boundaries land on different spots of the page.
      for (let extra = 0; extra < 4; extra++) {
        const r = fullResume('pl')
        r.settings.template = template
        r.settings.fontSize = fontSize
        const exp = section(r, 'experience')
        for (let i = 0; i < extra; i++) exp.items.push({ ...exp.items[1], id: `x${i}` })
        const x = await renderAndExtract(r)
        for (const page of x.pages.slice(0, -1)) {
          const lines = page.split('\n').map((l) => l.trim()).filter((l) => l && !/^\d+ \/ \d+$/.test(l))
          expect(headings, `${template}/${fontSize}/+${extra}`).not.toContain(lines[lines.length - 1])
        }
      }
    },
    T,
  )

  it('compact fits more on a page than classic', async () => {
    const pagesFor = async (template: TemplateId) => {
      const r = fullResume('pl')
      r.settings.template = template
      return (await renderAndExtract(r)).pages[0].length
    }
    expect(await pagesFor('compact')).toBeGreaterThan(await pagesFor('classic'))
  }, T)

  it('renders every font size and an empty resume', async () => {
    for (const fontSize of ['small', 'medium', 'large'] as FontSize[]) {
      const r = fullResume('en')
      r.settings.fontSize = fontSize
      r.settings.accentColor = 'not-a-color'
      const x = await renderAndExtract(r)
      expect(x.text).toContain('Work Experience')
    }
    const empty = await renderAndExtract(createEmptyResume('pl'))
    expect(empty.numPages).toBe(1)
    expect(empty.text).not.toContain('Doświadczenie')
    expect(empty.text).toContain('Wyrażam zgodę') // PL resumes default to showing GDPR
  }, T)

  it('produces the expected file names for the sample resumes', () => {
    expect(pdfFileName(fullResume('pl'))).toBe('CV_Lukasz_Zolkiewski_PL.pdf')
    expect(pdfFileName(fullResume('en'))).toBe('CV_Lukasz_Zolkiewski_EN.pdf')
  })
})

/** Writes sample PDFs (+ PNG of each page) when PDF_SAMPLE_DIR is set. */
describe.runIf(!!env('PDF_SAMPLE_DIR'))('samples', () => {
  it('writes one sample per template', async () => {
    const dir = env('PDF_SAMPLE_DIR')!.replace(/[\\/]?$/, '/')
    const fs = await nodeFs()
    fs.mkdirSync(dir, { recursive: true })
    for (const template of TEMPLATES) {
      for (const lang of ['pl', 'en'] as const) {
        const r = fullResume(lang)
        r.settings.template = template
        r.settings.showPhoto = template !== 'compact'
        r.personal.photo = PNG
        const data = await renderResume(r)
        fs.writeFileSync(`${dir}sample-${template}-${lang}.pdf`, data)
        const task = getDocument({ data: data.slice(), verbosity: 0 })
        const doc = await task.promise
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n)
          const viewport = page.getViewport({ scale: 1.5 })
          const factory = (doc as unknown as { canvasFactory: { create(w: number, h: number): { canvas: { toBuffer(t: string): Uint8Array } } } }).canvasFactory
          const { canvas } = factory.create(viewport.width, viewport.height)
          await page.render({ canvas: canvas as unknown as HTMLCanvasElement, viewport }).promise
          fs.writeFileSync(`${dir}sample-${template}-${lang}-p${n}.png`, canvas.toBuffer('image/png'))
        }
        await task.destroy()
      }
    }
  }, 120_000)
})
