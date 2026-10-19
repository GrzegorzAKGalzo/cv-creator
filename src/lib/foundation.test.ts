import { describe, expect, it } from 'vitest'
import { formatDate, formatDateRange } from './dates'
import { parseDescription } from './description'
import { cloneResume, createEmptyResume } from './factory'
import { sectionTitle } from '../i18n/cvLabels'

describe('dates', () => {
  it('formats text and numeric dates per language', () => {
    expect(formatDate('2023-05', 'en')).toBe('May 2023')
    expect(formatDate('2023-10', 'pl')).toBe('paź 2023')
    expect(formatDate('2023-05', 'pl', 'numeric')).toBe('05.2023')
    expect(formatDate('2023-05', 'en', 'numeric')).toBe('05/2023')
    expect(formatDate('2023', 'en')).toBe('2023')
    expect(formatDate('', 'en')).toBe('')
    expect(formatDate('2023-13', 'en')).toBe('')
  })
  it('formats ranges', () => {
    expect(formatDateRange('2020-01', '', true, 'pl')).toBe('sty 2020 – obecnie')
    expect(formatDateRange('2020-01', '2021-02', false, 'en')).toBe('Jan 2020 – Feb 2021')
    expect(formatDateRange('', '2021', false, 'en')).toBe('2021')
    expect(formatDateRange('', '', false, 'en')).toBe('')
  })
})

describe('parseDescription', () => {
  it('groups bullets and keeps paragraphs', () => {
    expect(parseDescription('Intro\n- a\n• b\n\nOutro')).toEqual([
      { type: 'paragraph', text: 'Intro' },
      { type: 'bullets', items: ['a', 'b'] },
      { type: 'paragraph', text: 'Outro' },
    ])
  })
})

describe('factory', () => {
  it('clones with fresh ids', () => {
    const r = createEmptyResume('pl')
    const c = cloneResume(r, { language: 'en' })
    expect(c.id).not.toBe(r.id)
    expect(c.sections[0].id).not.toBe(r.sections[0].id)
    expect(c.language).toBe('en')
  })
  it('localizes section titles unless overridden', () => {
    expect(sectionTitle({ type: 'experience', title: '' }, 'pl')).toBe('Doświadczenie zawodowe')
    expect(sectionTitle({ type: 'experience', title: 'Kariera' }, 'en')).toBe('Kariera')
  })
})
