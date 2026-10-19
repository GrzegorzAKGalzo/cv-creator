import { useId } from 'react'
import type { CvLanguage } from '../../types/resume'
import { skillLevelName } from './helpers'
import { cx } from './styles'

const LEVELS = [1, 2, 3, 4, 5] as const

/** Radio group: "no level" + 5 bar segments. Names come from the CV language. */
export default function SkillLevelPicker({
  value,
  onChange,
  language,
  skillName,
}: {
  value: number
  onChange: (level: number) => void
  language: CvLanguage
  skillName: string
}) {
  const name = useId()
  const optionClass = 'relative cursor-pointer rounded-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500'
  return (
    <fieldset className="flex min-w-0 items-center gap-2">
      <legend className="sr-only">Poziom umiejętności{skillName ? `: ${skillName}` : ''}</legend>
      <div className="flex items-center">
        <label className={cx(optionClass, 'mr-1 px-1.5 py-1')} title="Nie pokazuj poziomu">
          <input type="radio" name={name} className="sr-only" checked={value === 0} onChange={() => onChange(0)} />
          <span className="sr-only">Nie pokazuj poziomu</span>
          <span
            aria-hidden="true"
            className={cx(
              'block text-xs leading-none',
              value === 0 ? 'font-semibold text-indigo-700' : 'text-slate-400 hover:text-slate-600',
            )}
          >
            brak
          </span>
        </label>
        {LEVELS.map((level) => (
          <label key={level} className={cx(optionClass, 'px-0.5 py-2')} title={skillLevelName(level, language)}>
            <input type="radio" name={name} className="sr-only" checked={value === level} onChange={() => onChange(level)} />
            <span className="sr-only">{skillLevelName(level, language)}</span>
            <span
              aria-hidden="true"
              className={cx(
                'block h-2 w-5 rounded-full transition-colors',
                level <= value ? 'bg-indigo-500' : 'bg-slate-200 hover:bg-slate-300',
              )}
            />
          </label>
        ))}
      </div>
      <span aria-hidden="true" className="min-w-0 truncate text-xs text-slate-500">
        {value > 0 ? skillLevelName(value, language) : ''}
      </span>
    </fieldset>
  )
}
