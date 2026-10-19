import { describe, expect, it } from 'vitest'
import type { AtsCheck } from './ats'
import {
  analyzeResume,
  extractKeywords,
  isValidEmail,
  isValidUrl,
  matchKeywords,
  normalizeText,
  scoreChecks,
  tokenize,
} from './ats'
import { createEmptyResume } from './factory'
import { createSampleResume } from '../data/sample'
import type { ListSection, Resume, SectionType, SummarySection } from '../types/resume'

const find = (checks: AtsCheck[], id: string) => checks.find((c) => c.id === id)

type ListType = Exclude<SectionType, 'summary' | 'references'>
const section = <T extends ListType>(r: Resume, type: T) => r.sections.find((s) => s.type === type) as ListSection<T>
const summaryOf = (r: Resume) => r.sections.find((s) => s.type === 'summary') as SummarySection

describe('validators', () => {
  it('validates e-mails', () => {
    expect(isValidEmail('jan.kowalski@gmail.com')).toBe(true)
    expect(isValidEmail(' a@b.pl ')).toBe(true)
    expect(isValidEmail('jan.kowalski@gmail')).toBe(false)
    expect(isValidEmail('jan kowalski@gmail.com')).toBe(false)
    expect(isValidEmail('@gmail.com')).toBe(false)
  })

  it('validates URLs with or without protocol', () => {
    expect(isValidUrl('https://www.linkedin.com/in/jan')).toBe(true)
    expect(isValidUrl('linkedin.com/in/jan')).toBe(true)
    expect(isValidUrl('http://example.pl')).toBe(true)
    expect(isValidUrl('not a url')).toBe(false)
    expect(isValidUrl('localhost')).toBe(false)
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
    expect(isValidUrl('ftp://example.com')).toBe(false)
    expect(isValidUrl('')).toBe(false)
  })
})

describe('analyzeResume – checks', () => {
  it('gives the full sample resume a top score with no errors or warnings', () => {
    for (const lang of ['pl', 'en'] as const) {
      const res = analyzeResume(createSampleResume(lang))
      expect(res.checks.filter((c) => c.status !== 'ok')).toEqual([])
      expect(res.score).toBe(100)
    }
  })

  it('scores an empty resume low and reports the key errors', () => {
    const res = analyzeResume(createEmptyResume('pl'))
    expect(res.score).toBeLessThan(40)
    expect(find(res.checks, 'name')?.status).toBe('error')
    expect(find(res.checks, 'email')?.status).toBe('error')
    expect(find(res.checks, 'phone')?.status).toBe('error')
    expect(find(res.checks, 'experience')?.status).toBe('error')
    expect(find(res.checks, 'skills')?.status).toBe('error')
    expect(find(res.checks, 'summary')?.status).toBe('warn')
    expect(find(res.checks, 'education')?.status).toBe('warn')
    expect(find(res.checks, 'languages')?.status).toBe('warn')
    expect(find(res.checks, 'bullets')).toBeUndefined()
  })

  it('every check has a Polish message, and non-ok ones have a tip', () => {
    const res = analyzeResume(createEmptyResume('pl'))
    for (const c of res.checks) {
      expect(c.message.length).toBeGreaterThan(5)
      if (c.status !== 'ok') expect(c.tip).toBeTruthy()
    }
  })

  it('score stays within 0–100', () => {
    expect(scoreChecks([])).toBe(0)
    expect(scoreChecks([{ id: 'name', status: 'ok', message: '' }])).toBe(100)
    expect(scoreChecks([{ id: 'name', status: 'warn', message: '' }])).toBe(50)
    expect(scoreChecks([{ id: 'name', status: 'error', message: '' }])).toBe(0)
  })

  it('detects a missing last name and an invalid e-mail', () => {
    const r = createSampleResume('pl')
    r.personal.lastName = ''
    r.personal.email = 'lukasz@wp'
    const res = analyzeResume(r)
    expect(find(res.checks, 'name')).toMatchObject({ status: 'error', message: 'Brak nazwiska.' })
    expect(find(res.checks, 'email')?.status).toBe('error')
    expect(res.score).toBeLessThan(100)
  })

  it('warns about missing location and job title', () => {
    const r = createSampleResume('pl')
    r.personal.city = ''
    r.personal.country = ''
    r.personal.jobTitle = ''
    const res = analyzeResume(r)
    expect(find(res.checks, 'location')?.status).toBe('warn')
    expect(find(res.checks, 'jobTitle')?.status).toBe('warn')
  })

  it('checks summary length bounds', () => {
    const r = createSampleResume('pl')
    summaryOf(r).content = 'Krótko.'
    expect(find(analyzeResume(r).checks, 'summary')?.message).toMatch(/krótkie/)
    summaryOf(r).content = 'x'.repeat(1200)
    expect(find(analyzeResume(r).checks, 'summary')?.message).toMatch(/długie/)
    summaryOf(r).content = 'x'.repeat(500)
    expect(find(analyzeResume(r).checks, 'summary')?.status).toBe('ok')
  })

  it('ignores hidden sections', () => {
    const r = createSampleResume('pl')
    section(r, 'skills').visible = false
    expect(find(analyzeResume(r).checks, 'skills')?.status).toBe('error')
  })

  it('warns about incomplete experience entries', () => {
    const r = createSampleResume('pl')
    section(r, 'experience').items[0].employer = ''
    expect(find(analyzeResume(r).checks, 'experience')).toMatchObject({ status: 'warn' })
  })

  it('warns when descriptions are missing or not bulleted', () => {
    const r = createSampleResume('pl')
    const items = section(r, 'experience').items
    items[0].description = 'Odpowiadałem za rozwój aplikacji.'
    expect(find(analyzeResume(r).checks, 'bullets')?.message).toMatch(/^1 z 3/)
    for (const i of items) i.description = ''
    expect(find(analyzeResume(r).checks, 'bullets')?.message).toMatch(/nie mają opisów/)
  })

  it('requires quantified achievements', () => {
    const r = createSampleResume('pl')
    for (const s of r.sections) {
      if (s.type === 'experience' || s.type === 'projects')
        for (const i of s.items) i.description = '- Tworzyłem aplikacje'
    }
    expect(find(analyzeResume(r).checks, 'quantified')?.status).toBe('warn')
  })

  it('warns when there are fewer than 5 skills', () => {
    const r = createSampleResume('pl')
    section(r, 'skills').items.splice(3)
    expect(find(analyzeResume(r).checks, 'skills')).toMatchObject({
      status: 'warn',
      message: expect.stringMatching(/Tylko 3/),
    })
  })

  it('warns about a visible photo only when enabled and present', () => {
    const r = createSampleResume('pl')
    r.personal.photo = 'data:image/png;base64,AAAA'
    expect(find(analyzeResume(r).checks, 'photo')?.status).toBe('ok')
    r.settings.showPhoto = true
    expect(find(analyzeResume(r).checks, 'photo')?.status).toBe('warn')
  })

  it('flags end dates before start dates, but not current positions', () => {
    const r = createSampleResume('pl')
    const job = section(r, 'experience').items[1]
    job.startDate = '2021-05'
    job.endDate = '2020-01'
    expect(find(analyzeResume(r).checks, 'dates')).toMatchObject({ status: 'error' })
    job.current = true
    expect(find(analyzeResume(r).checks, 'dates')?.status).toBe('ok')
  })

  it('treats year-only dates inclusively', () => {
    const r = createSampleResume('pl')
    const edu = section(r, 'education').items[0]
    edu.startDate = '2016-09'
    edu.endDate = '2016'
    expect(find(analyzeResume(r).checks, 'dates')?.status).toBe('ok')
    edu.endDate = '2015'
    expect(find(analyzeResume(r).checks, 'dates')?.status).toBe('error')
  })

  it('warns about very long description lines', () => {
    const r = createSampleResume('pl')
    section(r, 'experience').items[0].description = `- ${'a'.repeat(301)}`
    expect(find(analyzeResume(r).checks, 'longLines')?.status).toBe('warn')
  })

  it('warns about renamed standard sections but accepts default titles in either language', () => {
    const r = createSampleResume('pl')
    section(r, 'experience').title = 'Work Experience'
    expect(find(analyzeResume(r).checks, 'sectionTitles')?.status).toBe('ok')
    section(r, 'experience').title = 'Moja przygoda'
    expect(find(analyzeResume(r).checks, 'sectionTitles')).toMatchObject({
      status: 'warn',
      message: expect.stringContaining('Moja przygoda'),
    })
  })

  it('checks the GDPR clause only for Polish CVs', () => {
    const pl = createSampleResume('pl')
    pl.settings.showGdpr = false
    expect(find(analyzeResume(pl).checks, 'gdpr')?.status).toBe('warn')
    const en = createSampleResume('en')
    en.settings.showGdpr = false
    expect(find(analyzeResume(en).checks, 'gdpr')).toBeUndefined()
  })

  it('reports invalid URLs by label', () => {
    const r = createSampleResume('pl')
    r.personal.linkedin = 'linkedin com/jan'
    section(r, 'projects').items[0].url = 'http://bad url'
    const check = find(analyzeResume(r).checks, 'urls')
    expect(check?.status).toBe('error')
    expect(check?.message).toContain('LinkedIn')
    expect(check?.message).toContain('Źródełko')
  })

  it('omits keywords when no job ad is given', () => {
    const r = createSampleResume('pl')
    expect(analyzeResume(r).keywords).toBeUndefined()
    expect(analyzeResume(r, '   ').keywords).toBeUndefined()
  })
})

describe('keywords', () => {
  it('normalizes Polish diacritics', () => {
    expect(normalizeText('Zażółć GĘŚLĄ jaźń, Łódź')).toBe('zazolc gesla jazn, lodz')
  })

  it('keeps tech tokens intact', () => {
    const keys = tokenize('Znajomość C++, C#, Node.js, CI/CD, .NET oraz React/Redux.').map((t) => t.key)
    expect(keys).toEqual(expect.arrayContaining(['c++', 'c#', 'node.js', 'ci/cd', '.net', 'react', 'redux']))
    expect(keys).not.toContain('node.js,')
    expect(keys).not.toContain('react/redux')
  })

  it('extracts frequent terms and drops stopwords in both languages', () => {
    const ad =
      'Szukamy osoby z doświadczeniem w React. Wymagania: React, TypeScript, testy jednostkowe. ' +
      'We are looking for a developer with strong React and TypeScript skills and experience with Docker.'
    const kws = extractKeywords(ad).map((k) => k.key)
    expect(kws[0]).toBe('react')
    expect(kws[1]).toBe('typescript')
    expect(kws).toContain('docker')
    for (const stop of ['szukamy', 'osoby', 'wymagania', 'the', 'with', 'and', 'looking', 'experience', 'skills']) {
      expect(kws).not.toContain(stop)
    }
  })

  it('keeps the original Polish spelling for display', () => {
    const kws = extractKeywords('Zarządzanie zespołem i księgowość')
    expect(kws.map((k) => k.display)).toEqual(['zarządzanie', 'zespołem', 'księgowość'])
    expect(kws[0].key).toBe('zarzadzanie')
  })

  it('limits the number of keywords', () => {
    const ad = Array.from({ length: 40 }, (_, i) => `technologia${i}x`).join(' ')
    expect(extractKeywords(ad, 20)).toHaveLength(20)
  })

  it('matches keywords against the whole resume, tolerant to inflection and diacritics', () => {
    const r = createSampleResume('pl')
    const ad =
      'Poszukujemy Senior Frontend Developera. Wymagamy znajomości TypeScriptu, Reacta, Next.js, CI/CD oraz Kubernetes. ' +
      'Mile widziane: GraphQL, Playwright, zarzadzanie zespolem, Angular.'
    const { matched, missing } = matchKeywords(r, ad)
    expect(matched).toEqual(
      expect.arrayContaining(['typescriptu', 'reacta', 'next.js', 'ci/cd', 'graphql', 'playwright']),
    )
    expect(missing).toEqual(expect.arrayContaining(['kubernetes', 'angular']))
    expect(matched).not.toContain('kubernetes')
  })

  it('does not match tech tokens inside other words', () => {
    const r = createEmptyResume('en')
    r.personal.jobTitle = 'CSS3 specialist'
    expect(matchKeywords(r, 'AWS S3').missing).toContain('s3')
  })

  it('analyzeResume returns matched and missing keyword lists', () => {
    const res = analyzeResume(createSampleResume('en'), 'React developer with Vue and Docker')
    expect(res.keywords?.matched).toContain('react')
    expect(res.keywords?.missing).toEqual(expect.arrayContaining(['vue', 'docker']))
  })
})
