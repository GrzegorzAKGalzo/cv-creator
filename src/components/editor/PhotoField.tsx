import { useId, useRef, useState } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import { selectActive } from './helpers'
import { CameraIcon } from './icons'
import { PHOTO_ACCEPT, processPhoto } from './photo'
import { cx, focusRing } from './styles'

const buttonClass = cx(
  'cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50',
  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500',
)

export default function PhotoField() {
  const photo = useResumeStore((s) => selectActive(s)?.personal.photo ?? '')
  const updatePersonal = useResumeStore((s) => s.updatePersonal)
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      updatePersonal({ photo: await processPhoto(file) })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się wczytać zdjęcia.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
        {photo ? (
          <img src={photo} alt="Zdjęcie w CV" className="size-full object-cover" />
        ) : (
          <CameraIcon size={24} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={inputId} className={buttonClass} aria-busy={busy}>
            {busy ? 'Wczytywanie…' : photo ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={PHOTO_ACCEPT}
              className="sr-only"
              disabled={busy}
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </label>
          {photo && (
            <button
              type="button"
              onClick={() => updatePersonal({ photo: '' })}
              className={cx('rounded-lg px-2.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50', focusRing)}
            >
              Usuń
            </button>
          )}
        </div>
        <p className="mt-2 text-xs leading-snug text-slate-500">
          JPG lub PNG. Zdjęcie bywa źle odczytywane przez systemy ATS, a w aplikacjach za granicę (np. UK, USA) zwykle
          się go nie dodaje.
        </p>
        {error && (
          <p role="alert" className="mt-1 text-xs text-rose-600">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
