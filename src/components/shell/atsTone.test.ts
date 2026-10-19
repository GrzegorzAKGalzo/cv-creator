import { describe, expect, it } from 'vitest'
import { atsVerdict } from './atsTone'
import { analyzeResume } from '../../lib/ats'
import { createSampleResume } from '../../data/sample'
import type { AtsStatus } from '../../lib/ats'
import type { ListSection } from '../../types/resume'

const checks = (...statuses: AtsStatus[]) => statuses.map((status) => ({ status }))

describe('atsVerdict', () => {
  it('is "ready" only when every check passes', () => {
    expect(atsVerdict({ score: 100, checks: checks('ok', 'ok') })).toMatchObject({
      level: 'ok',
      label: 'Gotowe do wysyłki',
    })
  })

  it('never says "ready" when there is an error, even with a high score', () => {
    const v = atsVerdict({ score: 86, checks: checks('ok', 'error', 'ok') })
    expect(v.level).toBe('error')
    expect(v.label).toBe('Do poprawy przed wysłaniem')
    expect(v.badge).toContain('rose')
  })

  it('uses a stronger message for errors with a low score', () => {
    expect(atsVerdict({ score: 40, checks: checks('error', 'warn') }).label).toBe('CV wymaga uzupełnienia')
  })

  it('says "almost ready" when there are only warnings', () => {
    const v = atsVerdict({ score: 97, checks: checks('ok', 'warn') })
    expect(v).toMatchObject({ level: 'warn', label: 'Prawie gotowe' })
    expect(v.badge).toContain('amber')
  })

  it('is not "ready" below the score threshold even without warnings', () => {
    expect(atsVerdict({ score: 70, checks: checks('ok') }).level).toBe('warn')
  })

  it('reflects a real resume missing its skills (score stays high, verdict is an error)', () => {
    const r = createSampleResume('pl')
    const skills = r.sections.find((s) => s.type === 'skills') as ListSection<'skills'>
    skills.items = []
    const result = analyzeResume(r)
    expect(result.score).toBeGreaterThanOrEqual(85)
    expect(atsVerdict(result).level).toBe('error')
  })
})
