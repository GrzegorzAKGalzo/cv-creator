import { useId, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import type { PersonalInfo } from '../../types/resume'
import { useResumeStore } from '../../store/resumeStore'
import { selectActive } from './helpers'
import { ChevronDownIcon } from './icons'
import LinksList from './LinksList'
import PhotoField from './PhotoField'
import { TextField } from './ui'
import { cx, focusRing } from './styles'

type TextKey = Exclude<keyof PersonalInfo, 'links' | 'photo'>

const MORE_KEYS: TextKey[] = ['address', 'postalCode', 'dateOfBirth', 'nationality', 'drivingLicense']

interface PersonalInputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange'> {
  field: TextKey
  label: string
  className?: string
  hint?: string
}

/** One personal-info input; subscribes only to its own field. */
function PersonalInput({ field, ...rest }: PersonalInputProps) {
  const value = useResumeStore((s) => selectActive(s)?.personal[field] ?? '')
  const updatePersonal = useResumeStore((s) => s.updatePersonal)
  return <TextField value={value} onChange={(v) => updatePersonal({ [field]: v })} {...rest} />
}

function MoreDetails() {
  const hasData = useResumeStore((s) => {
    const p = selectActive(s)?.personal
    return !!p && MORE_KEYS.some((k) => p[k].trim() !== '')
  })
  const [open, setOpen] = useState(hasData)
  const panelId = useId()
  return (
    <div className="border-t border-slate-100 pt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          '-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-medium text-slate-700 hover:text-slate-900',
          focusRing,
        )}
      >
        <ChevronDownIcon size={16} className={cx('transition-transform', !open && '-rotate-90')} />
        Więcej danych
        {!open && hasData && <span className="size-1.5 rounded-full bg-indigo-500" aria-label="(uzupełnione)" />}
      </button>
      {open && (
        <div id={panelId} className="mt-3 grid grid-cols-1 gap-3 @md:grid-cols-2">
          <PersonalInput field="address" label="Adres" autoComplete="street-address" className="@md:col-span-2" />
          <PersonalInput field="postalCode" label="Kod pocztowy" autoComplete="postal-code" placeholder="00-000" />
          <PersonalInput field="dateOfBirth" label="Data urodzenia" placeholder="np. 12.03.1995" autoComplete="bday" />
          <PersonalInput field="nationality" label="Obywatelstwo" />
          <PersonalInput field="drivingLicense" label="Prawo jazdy" placeholder="np. kat. B" />
          <p className="text-xs leading-snug text-slate-500 @md:col-span-2">
            Pracodawcy w Polsce nie mogą wymagać daty urodzenia ani adresu zamieszkania — podawaj je tylko wtedy, gdy
            chcesz.
          </p>
        </div>
      )}
    </div>
  )
}

export default function PersonalForm() {
  return (
    <section aria-labelledby="personal-heading" className="rounded-xl border border-slate-200 bg-white p-4 @md:p-5">
      <h2 id="personal-heading" className="mb-4 text-[15px] font-semibold text-slate-900">
        Dane osobowe
      </h2>
      <div className="space-y-4">
        <PhotoField />
        <div className="grid grid-cols-1 gap-3 @md:grid-cols-2">
          <PersonalInput field="firstName" label="Imię" autoComplete="given-name" />
          <PersonalInput field="lastName" label="Nazwisko" autoComplete="family-name" />
          <PersonalInput
            field="jobTitle"
            label="Stanowisko"
            placeholder="np. Frontend Developer"
            autoComplete="organization-title"
            className="@md:col-span-2"
          />
          <PersonalInput field="email" label="E-mail" type="email" autoComplete="email" />
          <PersonalInput field="phone" label="Telefon" type="tel" autoComplete="tel" placeholder="+48 600 000 000" />
          <PersonalInput field="city" label="Miasto" autoComplete="address-level2" />
          <PersonalInput field="country" label="Kraj" autoComplete="country-name" />
        </div>
        <MoreDetails />
        <div className="border-t border-slate-100 pt-3">
          <h3 className="mb-3 text-sm font-medium text-slate-700">Linki</h3>
          <div className="grid grid-cols-1 gap-3 @md:grid-cols-2">
            <PersonalInput field="linkedin" label="LinkedIn" inputMode="url" placeholder="linkedin.com/in/…" className="@md:col-span-2" />
            <PersonalInput field="website" label="Strona WWW" inputMode="url" placeholder="https://" />
            <PersonalInput field="github" label="GitHub" inputMode="url" placeholder="github.com/…" />
          </div>
          <div className="mt-3">
            <LinksList />
          </div>
        </div>
      </div>
    </section>
  )
}
