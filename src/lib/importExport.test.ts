import { describe, expect, it } from 'vitest'
import { asciiSlug, jsonFileName, parseResumeJson, serializeResume } from './importExport'
import { createEmptyResume, defaultSettings, emptyPersonal } from './factory'
import { createSampleResume } from '../data/sample'
import type { ListSection, ReferencesSection } from '../types/resume'

describe('serializeResume / parseResumeJson', () => {
  it('wraps the resume in an envelope', () => {
    const r = createSampleResume('pl')
    const data = JSON.parse(serializeResume(r))
    expect(data.app).toBe('cv-kreator')
    expect(data.version).toBe(1)
    expect(data.resume.id).toBe(r.id)
    expect(serializeResume(r)).toContain('\n  ')
  })

  it('round-trips a full resume without loss', () => {
    for (const lang of ['pl', 'en'] as const) {
      const r = createSampleResume(lang)
      expect(parseResumeJson(serializeResume(r))).toEqual(r)
    }
  })

  it('accepts a bare resume (no envelope) and a UTF-8 BOM', () => {
    const r = createEmptyResume('en')
    expect(parseResumeJson('﻿' + JSON.stringify(r))).toEqual(r)
  })

  it('throws readable Polish errors', () => {
    expect(() => parseResumeJson('{nope')).toThrow('Plik nie jest poprawnym plikiem JSON.')
    expect(() => parseResumeJson('[1,2]')).toThrow(/nie zawiera danych CV/)
    expect(() => parseResumeJson('"tekst"')).toThrow(/nie zawiera danych CV/)
    expect(() => parseResumeJson('null')).toThrow(/nie zawiera danych CV/)
    expect(() => parseResumeJson('{"foo": 1}')).toThrow(/nie zawiera danych CV/)
    expect(() => parseResumeJson('{"app":"other","resume":{"personal":{}}}')).toThrow(/innej aplikacji/)
    expect(() => parseResumeJson('{"personal":{},"sections":{}}')).toThrow(/musi być listą/)
  })

  it('fills missing data with defaults', () => {
    const r = parseResumeJson('{"personal": {"firstName": "Anna"}}')
    expect(r.personal).toEqual({ ...emptyPersonal(), firstName: 'Anna' })
    expect(r.language).toBe('pl')
    expect(r.settings).toEqual(defaultSettings('pl'))
    expect(r.sections).toEqual([])
    expect(r.id).toBeTruthy()
    expect(r.name).toBe('Zaimportowane CV')
    expect(Date.parse(r.createdAt)).not.toBeNaN()
  })

  it('normalizes settings defensively', () => {
    const r = parseResumeJson(
      JSON.stringify({
        language: 'en',
        sections: [],
        settings: {
          template: 'fancy',
          accentColor: 'red; background:url(x)',
          fontSize: 'large',
          dateFormat: 'text',
          spacing: 'compact',
          showPhoto: 'true',
          showGdpr: 0,
          gdprText: 42,
        },
      }),
    )
    expect(r.language).toBe('en')
    expect(r.settings).toEqual({
      template: 'classic',
      accentColor: defaultSettings('en').accentColor,
      fontSize: 'large',
      dateFormat: 'text',
      spacing: 'compact',
      showPhoto: true,
      showGdpr: false,
      gdprText: '42',
    })
  })

  it('imports a v1 backup made before spacing existed', () => {
    const r = createSampleResume('pl')
    const { spacing: _spacing, ...oldSettings } = r.settings
    const backup = JSON.stringify({
      app: 'cv-kreator',
      version: 1,
      resume: { ...r, settings: { ...oldSettings, dateFormat: 'text' } },
    })
    const parsed = parseResumeJson(backup)
    expect(parsed.settings.spacing).toBe('normal')
    // An explicit choice from the backup is kept.
    expect(parsed.settings.dateFormat).toBe('text')
    expect(parsed.sections).toEqual(r.sections)
  })

  it('accepts valid spacing values and rejects unknown ones', () => {
    const withSpacing = (spacing: unknown) =>
      parseResumeJson(JSON.stringify({ sections: [], settings: { spacing } })).settings.spacing
    expect(withSpacing('compact')).toBe('compact')
    expect(withSpacing('relaxed')).toBe('relaxed')
    expect(withSpacing('huge')).toBe('normal')
    expect(withSpacing(3)).toBe('normal')
  })

  it('falls back to "pl" for an unknown language', () => {
    expect(parseResumeJson('{"language":"de","sections":[]}').language).toBe('pl')
  })

  it('drops unknown sections and coerces items to the expected shape', () => {
    const r = parseResumeJson(
      JSON.stringify({
        personal: { firstName: 7, lastName: null, links: [{ url: 'https://a.pl' }, 'junk'] },
        sections: [
          { type: 'hobbies', items: [] },
          'junk',
          { type: 'summary', content: 123 },
          {
            type: 'experience',
            visible: 'false',
            items: [{ jobTitle: 'Dev', startDate: 2020, current: 'true', extra: 'drop me' }, null, 5],
          },
          {
            type: 'skills',
            items: [
              { name: 'TS', level: '9' },
              { name: 'JS', level: -3 },
              { name: 'CSS', level: 'abc' },
            ],
          },
          {
            type: 'languages',
            items: [
              { name: 'angielski', level: 'C3' },
              { name: 'polski', level: 'native' },
            ],
          },
          { type: 'references', onRequest: 1 },
        ],
      }),
    )
    expect(r.personal.firstName).toBe('7')
    expect(r.personal.lastName).toBe('')
    expect(r.personal.links).toHaveLength(1)
    expect(r.personal.links[0]).toMatchObject({ label: '', url: 'https://a.pl' })
    expect(r.personal.links[0].id).toBeTruthy()

    expect(r.sections.map((s) => s.type)).toEqual(['summary', 'experience', 'skills', 'languages', 'references'])
    expect(r.sections[0]).toMatchObject({ type: 'summary', content: '123', title: '', visible: true })

    const exp = r.sections[1] as ListSection<'experience'>
    expect(exp.visible).toBe(false)
    expect(exp.items).toHaveLength(1)
    expect(exp.items[0]).toEqual({
      id: expect.any(String),
      jobTitle: 'Dev',
      employer: '',
      city: '',
      startDate: '2020',
      endDate: '',
      current: true,
      description: '',
    })

    const skills = r.sections[2] as ListSection<'skills'>
    expect(skills.items.map((s) => s.level)).toEqual([5, 0, 0])

    const langs = r.sections[3] as ListSection<'languages'>
    expect(langs.items.map((l) => l.level)).toEqual(['', 'native'])

    const refs = r.sections[4] as ReferencesSection
    expect(refs.onRequest).toBe(true)
    expect(refs.items).toEqual([])
  })

  it('generates ids where missing', () => {
    const r = parseResumeJson('{"sections":[{"type":"interests","items":[{"name":"a"},{"name":"b","id":""}]}]}')
    const s = r.sections[0] as ListSection<'interests'>
    expect(s.id).toBeTruthy()
    expect(s.items[0].id).toBeTruthy()
    expect(s.items[1].id).toBeTruthy()
    expect(s.items[0].id).not.toBe(s.items[1].id)
  })

  it('only accepts embedded image data URLs as photos', () => {
    const ok = parseResumeJson('{"personal":{"photo":"data:image/jpeg;base64,AAAA"}}')
    expect(ok.personal.photo).toBe('data:image/jpeg;base64,AAAA')
    const bad = parseResumeJson('{"personal":{"photo":"https://evil.example/x.png"}}')
    expect(bad.personal.photo).toBe('')
  })
})

describe('file names', () => {
  it('builds an ASCII-safe file name from the person name', () => {
    const r = createSampleResume('pl')
    expect(jsonFileName(r)).toBe('CV_Lukasz_Zurawski.json')
  })

  it('falls back to the resume name, then to CV.json', () => {
    const r = createEmptyResume('pl', 'Księgowa – Gdańsk')
    expect(jsonFileName(r)).toBe('CV_Ksiegowa_Gdansk.json')
    r.name = '  '
    expect(jsonFileName(r)).toBe('CV.json')
  })

  it('slugifies Polish characters', () => {
    expect(asciiSlug('Zażółć gęślą jaźń')).toBe('Zazolc_gesla_jazn')
  })
})
