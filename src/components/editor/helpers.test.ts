import { describe, expect, it } from 'vitest'
import { createEmptyItem } from '../../lib/factory'
import {
  appendBullet,
  isEndBeforeStart,
  itemDates,
  itemHeadline,
  skillLevelName,
  summaryLengthStatus,
  toYearMonth,
  toYearOnly,
} from './helpers'
import { fitWithin } from './photo'

describe('itemHeadline', () => {
  it('joins the main fields per type', () => {
    const exp = { ...createEmptyItem('experience'), jobTitle: 'Frontend Developer', employer: 'Acme' }
    expect(itemHeadline('experience', exp)).toBe('Frontend Developer · Acme')
    const edu = { ...createEmptyItem('education'), degree: 'mgr', fieldOfStudy: 'Informatyka', school: 'UW' }
    expect(itemHeadline('education', edu)).toBe('mgr, Informatyka · UW')
    const pub = { ...createEmptyItem('publications'), title: 'Artykuł' }
    expect(itemHeadline('publications', pub)).toBe('Artykuł')
    const skill = { ...createEmptyItem('skills'), name: '  React ' }
    expect(itemHeadline('skills', skill)).toBe('React')
  })
  it('returns empty string for empty items', () => {
    expect(itemHeadline('experience', createEmptyItem('experience'))).toBe('')
    expect(itemHeadline('references', { ...createEmptyItem('references'), company: '  ' })).toBe('')
  })
})

describe('itemDates', () => {
  it('formats ranges and single dates numerically in Polish', () => {
    expect(itemDates({ ...createEmptyItem('experience'), startDate: '2020-01', current: true })).toBe('01.2020 – obecnie')
    expect(itemDates({ ...createEmptyItem('certifications'), date: '2022' })).toBe('2022')
    expect(itemDates(createEmptyItem('skills'))).toBe('')
  })
})

describe('isEndBeforeStart', () => {
  it('compares months and years', () => {
    expect(isEndBeforeStart('2021-05', '2021-04')).toBe(true)
    expect(isEndBeforeStart('2021-05', '2021-05')).toBe(false)
    expect(isEndBeforeStart('2021', '2020-12')).toBe(true)
    expect(isEndBeforeStart('2021-05', '2021')).toBe(false)
    expect(isEndBeforeStart('', '2020')).toBe(false)
    expect(isEndBeforeStart('2020-03', '')).toBe(false)
  })
})

describe('appendBullet', () => {
  it('adds a bullet line', () => {
    expect(appendBullet('')).toBe('- ')
    expect(appendBullet('Intro')).toBe('Intro\n- ')
    expect(appendBullet('Intro\n')).toBe('Intro\n- ')
  })
})

describe('date mode conversion', () => {
  it('converts between month and year-only', () => {
    expect(toYearOnly('2023-05')).toBe('2023')
    expect(toYearOnly('')).toBe('')
    expect(toYearMonth('2023')).toBe('2023-01')
    expect(toYearMonth('2023-11')).toBe('2023-11')
  })
})

describe('summaryLengthStatus', () => {
  it('classifies length', () => {
    expect(summaryLengthStatus(0)).toBe('empty')
    expect(summaryLengthStatus(120)).toBe('short')
    expect(summaryLengthStatus(500)).toBe('good')
    expect(summaryLengthStatus(900)).toBe('long')
  })
})

describe('fitWithin', () => {
  it('downscales the long side to 400 and never upscales', () => {
    expect(fitWithin(1200, 1600)).toEqual({ width: 300, height: 400 })
    expect(fitWithin(800, 400)).toEqual({ width: 400, height: 200 })
    expect(fitWithin(200, 300)).toEqual({ width: 200, height: 300 })
  })
})

describe('skillLevelName', () => {
  it('uses CV language labels', () => {
    expect(skillLevelName(5, 'pl')).toBe('Ekspert')
    expect(skillLevelName(3, 'en')).toBe('Intermediate')
    expect(skillLevelName(0, 'pl')).toBe('Nie pokazuj poziomu')
  })
})
