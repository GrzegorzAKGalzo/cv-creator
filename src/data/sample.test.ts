import { describe, expect, it } from 'vitest'
import { createSampleResume } from './sample'
import { SECTION_TYPES } from '../lib/factory'
import { parseDescription } from '../lib/description'
import type { AnyItem, ListSection, ReferencesSection, SummarySection } from '../types/resume'

describe('createSampleResume', () => {
  for (const lang of ['pl', 'en'] as const) {
    describe(lang, () => {
      const r = createSampleResume(lang)

      it('has the requested language and no photo', () => {
        expect(r.language).toBe(lang)
        expect(r.personal.photo).toBe('')
        expect(r.settings.showPhoto).toBe(false)
        expect(r.settings.showGdpr).toBe(lang === 'pl')
      })

      it('populates every section type', () => {
        const types = r.sections.map((s) => s.type)
        for (const type of SECTION_TYPES) expect(types).toContain(type)
        for (const s of r.sections) {
          if (s.type === 'summary') expect(s.content.length).toBeGreaterThan(300)
          else if (s.type !== 'references' || !s.onRequest)
            expect((s as { items: AnyItem[] }).items.length).toBeGreaterThan(0)
        }
      })

      it('has 2–3 experiences with bullets containing numbers', () => {
        const exp = r.sections.find((s) => s.type === 'experience') as ListSection<'experience'>
        expect(exp.items.length).toBeGreaterThanOrEqual(2)
        expect(exp.items.length).toBeLessThanOrEqual(3)
        for (const job of exp.items) {
          const blocks = parseDescription(job.description)
          expect(blocks.every((b) => b.type === 'bullets')).toBe(true)
          expect(job.description).toMatch(/\d/)
        }
      })

      it('has 8+ skills with levels, references not on request and a custom section', () => {
        const skills = r.sections.find((s) => s.type === 'skills') as ListSection<'skills'>
        expect(skills.items.length).toBeGreaterThanOrEqual(8)
        expect(skills.items.every((s) => s.level >= 1 && s.level <= 5)).toBe(true)
        const refs = r.sections.find((s) => s.type === 'references') as ReferencesSection
        expect(refs.onRequest).toBe(false)
        const custom = r.sections.find((s) => s.type === 'custom') as ListSection<'custom'>
        expect(custom.title).toBeTruthy()
      })

      it('uses unique ids', () => {
        const ids = [r.id, ...r.sections.flatMap((s) => [s.id, ...('items' in s ? s.items.map((i) => i.id) : [])])]
        expect(new Set(ids).size).toBe(ids.length)
      })
    })
  }

  it('writes the content in the requested language', () => {
    const pl = createSampleResume('pl')
    const en = createSampleResume('en')
    const summary = (r: typeof pl) => (r.sections.find((s) => s.type === 'summary') as SummarySection).content
    expect(summary(pl)).toMatch(/doświadczeniem/)
    expect(summary(en)).toMatch(/experience/)
    expect(JSON.stringify(pl)).toMatch(/[ąęłńóśźż]/)
  })
})
