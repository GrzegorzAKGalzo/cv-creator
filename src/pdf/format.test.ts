import { describe, expect, it } from 'vitest'
import { createEmptyResume } from '../lib/factory'
import { displayUrl, formatBirthDate, hrefFor, joinParts, pdfFileName, profileUrl, toAscii } from './format'
import { pdfFileName as publicPdfFileName } from './index'

const withName = (firstName: string, lastName: string, language: 'pl' | 'en' = 'pl') => {
  const r = createEmptyResume(language)
  r.personal.firstName = firstName
  r.personal.lastName = lastName
  return r
}

describe('pdfFileName', () => {
  it('builds an ASCII-safe file name with the language suffix', () => {
    expect(pdfFileName(withName('Jan', 'Kowalski'))).toBe('CV_Jan_Kowalski_PL.pdf')
    expect(pdfFileName(withName('Łukasz', 'Żółkiewski'))).toBe('CV_Lukasz_Zolkiewski_PL.pdf')
    expect(pdfFileName(withName('Zażółć', 'Gęślą Jaźń', 'en'))).toBe('CV_Zazolc_Gesla_Jazn_EN.pdf')
    expect(pdfFileName(withName('  Anna  Maria ', 'Nowak-Kowalska'))).toBe('CV_Anna_Maria_Nowak-Kowalska_PL.pdf')
    expect(pdfFileName(withName("O'Brien", 'Ślęzak/Łódź'))).toBe('CV_OBrien_SlezakLodz_PL.pdf')
  })
  it('falls back to CV.pdf without a usable name', () => {
    expect(pdfFileName(withName('', ''))).toBe('CV.pdf')
    expect(pdfFileName(withName('  ', '***'))).toBe('CV.pdf')
  })
  it('is exported from the public API', () => {
    expect(publicPdfFileName(withName('Jan', 'Kowalski', 'en'))).toBe('CV_Jan_Kowalski_EN.pdf')
  })
})

describe('format helpers', () => {
  it('strips diacritics including ł', () => {
    expect(toAscii('Zażółć gęślą jaźń ŁÓDŹ')).toBe('Zazolc gesla jazn LODZ')
  })
  it('joins without dangling separators', () => {
    expect(joinParts(['a', '', '  ', 'b', undefined], ' | ')).toBe('a | b')
    expect(joinParts(['', ''], ', ')).toBe('')
  })
  it('handles urls and profile handles', () => {
    expect(displayUrl('https://www.linkedin.com/in/jan/')).toBe('linkedin.com/in/jan')
    expect(hrefFor('jan.dev')).toBe('https://jan.dev')
    expect(hrefFor('http://jan.dev')).toBe('http://jan.dev')
    expect(profileUrl('jan-kowalski', 'linkedin.com/in')).toBe('linkedin.com/in/jan-kowalski')
    expect(profileUrl('@jank', 'github.com')).toBe('github.com/jank')
    expect(profileUrl('github.com/jank', 'github.com')).toBe('github.com/jank')
  })
  it('formats birth dates', () => {
    expect(formatBirthDate('1990-03-12', 'pl', 'text')).toBe('12 mar 1990')
    expect(formatBirthDate('1990-03-12', 'pl', 'numeric')).toBe('12.03.1990')
    expect(formatBirthDate('1990-03-12', 'en', 'numeric')).toBe('12/03/1990')
    expect(formatBirthDate('12 marca 1990', 'pl', 'text')).toBe('12 marca 1990')
  })
})
