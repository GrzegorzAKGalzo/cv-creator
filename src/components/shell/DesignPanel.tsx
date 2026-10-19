import type { DateFormat, FontSize, Spacing, TemplateId } from '../../types/resume'
import { useActiveResume, useResumeStore } from '../../store/resumeStore'
import { CV_LABELS } from '../../i18n/cvLabels'
import { formatDate } from '../../lib/dates'
import { FieldGroup, Segmented, Switch } from './controls'
import { CheckIcon } from './icons'

const ACCENT_SWATCHES: { value: string; name: string }[] = [
  { value: '#1f4e79', name: 'Granatowy' },
  { value: '#0f5257', name: 'Morski' },
  { value: '#2f5233', name: 'Butelkowa zieleń' },
  { value: '#7a2e2e', name: 'Bordowy' },
  { value: '#5b2a86', name: 'Śliwkowy' },
  { value: '#8a4b0f', name: 'Miedziany' },
  { value: '#374151', name: 'Grafitowy' },
  { value: '#111111', name: 'Czarny' },
]

const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  { id: 'classic', name: 'Klasyczny', description: 'Jedna kolumna, wyśrodkowany nagłówek' },
  { id: 'modern', name: 'Nowoczesny', description: 'Jedna kolumna, kolorowe imię i akcenty przy nagłówkach' },
  { id: 'compact', name: 'Kompaktowy', description: 'Jedna kolumna, gęsty układ – więcej treści na stronie' },
]

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'Mały' },
  { value: 'medium', label: 'Średni' },
  { value: 'large', label: 'Duży' },
]

const SPACINGS: { value: Spacing; label: string }[] = [
  { value: 'compact', label: 'Ciasne' },
  { value: 'normal', label: 'Normalne' },
  { value: 'relaxed', label: 'Przestronne' },
]

const SAMPLE_DATE = '2024-02'

/** <input type=color> needs #rrggbb. */
const toHex6 = (c: string) => (/^#[0-9a-f]{3}$/i.test(c) ? `#${[...c.slice(1)].map((x) => x + x).join('')}` : c)

function TemplateThumb({ id, accent }: { id: TemplateId; accent: string }) {
  const line = '#cbd5e1'
  const lines = (x: number, y: number, w: number, n: number, gap = 4) =>
    Array.from({ length: n }, (_, i) => (
      <rect key={i} x={x} y={y + i * gap} width={i === n - 1 ? w * 0.7 : w} height="1.6" rx="0.8" fill={line} />
    ))
  return (
    <svg viewBox="0 0 60 78" className="h-auto w-full" aria-hidden="true">
      <rect width="60" height="78" rx="2" fill="#fff" />
      {id === 'classic' && (
        <>
          <rect x="17" y="7" width="26" height="3" rx="1.5" fill="#334155" />
          <rect x="22" y="12.5" width="16" height="1.6" rx="0.8" fill={line} />
          <rect x="7" y="18" width="46" height="0.8" fill={accent} />
          <rect x="7" y="22" width="14" height="2" rx="1" fill={accent} />
          {lines(7, 27, 46, 4)}
          <rect x="7" y="45" width="14" height="2" rx="1" fill={accent} />
          {lines(7, 50, 46, 5)}
        </>
      )}
      {id === 'modern' && (
        <>
          <rect x="7" y="7" width="28" height="3.4" rx="1.7" fill={accent} />
          <rect x="7" y="12.8" width="18" height="1.6" rx="0.8" fill={line} />
          <rect x="7" y="18" width="46" height="0.9" fill={accent} />
          <rect x="7" y="22" width="1.2" height="3" fill={accent} />
          <rect x="10" y="22.5" width="13" height="2" rx="1" fill="#334155" />
          {lines(7, 28, 46, 4)}
          <rect x="7" y="45" width="1.2" height="3" fill={accent} />
          <rect x="10" y="45.5" width="13" height="2" rx="1" fill="#334155" />
          {lines(7, 51, 46, 5)}
        </>
      )}
      {id === 'compact' && (
        <>
          <rect x="6" y="6" width="22" height="2.6" rx="1.3" fill="#334155" />
          <rect x="6" y="10.5" width="34" height="1.4" rx="0.7" fill={line} />
          <rect x="6" y="15" width="48" height="0.7" fill={accent} />
          <rect x="6" y="18.5" width="11" height="1.8" rx="0.9" fill={accent} />
          {lines(6, 22.5, 48, 6, 3)}
          <rect x="6" y="42" width="11" height="1.8" rx="0.9" fill={accent} />
          {lines(6, 46, 48, 6, 3)}
          <rect x="6" y="65" width="11" height="1.8" rx="0.9" fill={accent} />
          {lines(6, 69, 48, 2, 3)}
        </>
      )}
    </svg>
  )
}

export default function DesignPanel() {
  const resume = useActiveResume()
  const updateSettings = useResumeStore((s) => s.updateSettings)
  if (!resume) return null
  const s = resume.settings
  const lang = resume.language
  const isSwatch = ACCENT_SWATCHES.some((c) => c.value.toLowerCase() === s.accentColor.toLowerCase())

  const dateOptions: { value: DateFormat; label: string }[] = [
    { value: 'numeric', label: formatDate(SAMPLE_DATE, lang, 'numeric') },
    { value: 'text', label: formatDate(SAMPLE_DATE, lang, 'text') },
  ]

  return (
    <div className="divide-y divide-slate-100 pb-8">
      <FieldGroup title="Szablon">
        <div role="radiogroup" aria-label="Szablon CV" className="grid grid-cols-3 gap-2.5">
          {TEMPLATES.map((t) => {
            const selected = s.template === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => updateSettings({ template: t.id })}
                title={t.description}
                className="group text-left"
              >
                <span
                  className={`relative block overflow-hidden rounded-lg bg-slate-100 p-2 ring-1 transition-shadow ${
                    selected ? 'ring-2 ring-indigo-600' : 'ring-slate-200 group-hover:ring-slate-400'
                  }`}
                >
                  <span className="block shadow-sm shadow-slate-900/10">
                    <TemplateThumb id={t.id} accent={s.accentColor} />
                  </span>
                  {selected && (
                    <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-indigo-600 text-white">
                      <CheckIcon size={12} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span
                  className={`mt-1.5 block text-[13px] font-medium ${selected ? 'text-indigo-700' : 'text-slate-700'}`}
                >
                  {t.name}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[13px] text-slate-500">
          {TEMPLATES.find((t) => t.id === s.template)?.description}. Każdy szablon jest czytelny dla ATS.
        </p>
      </FieldGroup>

      <FieldGroup title="Kolor akcentu" hint="Ciemne kolory dobrze wyglądają w druku i nie przeszkadzają systemom ATS.">
        <div role="radiogroup" aria-label="Kolor akcentu" className="flex flex-wrap items-center gap-2">
          {ACCENT_SWATCHES.map((c) => {
            const selected = c.value.toLowerCase() === s.accentColor.toLowerCase()
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={c.name}
                title={c.name}
                onClick={() => updateSettings({ accentColor: c.value })}
                className={`grid size-8 place-items-center rounded-full ring-offset-2 transition-shadow ${
                  selected ? 'ring-2 ring-slate-900' : 'hover:ring-2 hover:ring-slate-300'
                }`}
                style={{ backgroundColor: c.value }}
              >
                {selected && <CheckIcon size={14} strokeWidth={3} className="text-white" />}
              </button>
            )
          })}
          <label
            title="Własny kolor"
            className={`relative grid size-8 cursor-pointer place-items-center rounded-full ring-offset-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 ${
              isSwatch ? 'hover:ring-2 hover:ring-slate-300' : 'ring-2 ring-slate-900'
            }`}
            style={{
              background: isSwatch
                ? 'conic-gradient(#b91c1c, #b45309, #15803d, #0e7490, #1d4ed8, #7e22ce, #b91c1c)'
                : s.accentColor,
            }}
          >
            <span className="sr-only">Własny kolor</span>
            {!isSwatch && <CheckIcon size={14} strokeWidth={3} className="text-white" />}
            <input
              type="color"
              value={toHex6(s.accentColor)}
              onChange={(e) => updateSettings({ accentColor: e.target.value })}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </label>
        </div>
      </FieldGroup>

      <FieldGroup title="Rozmiar czcionki">
        <Segmented
          ariaLabel="Rozmiar czcionki"
          value={s.fontSize}
          options={FONT_SIZES}
          onChange={(fontSize) => updateSettings({ fontSize })}
        />
      </FieldGroup>

      <FieldGroup title="Odstępy" hint="Ciasne pomagają zmieścić CV na jednej stronie.">
        <Segmented
          ariaLabel="Odstępy"
          value={s.spacing}
          options={SPACINGS}
          onChange={(spacing) => updateSettings({ spacing })}
        />
      </FieldGroup>

      <FieldGroup title="Format daty" hint="Przykład dla bieżącego języka CV.">
        <Segmented
          ariaLabel="Format daty"
          value={s.dateFormat}
          options={dateOptions}
          onChange={(dateFormat) => updateSettings({ dateFormat })}
        />
      </FieldGroup>

      <div className="px-5 py-5">
        <Switch
          id="setting-photo"
          checked={s.showPhoto}
          onChange={(showPhoto) => updateSettings({ showPhoto })}
          label="Pokaż zdjęcie"
          description={
            <>
              Systemy ATS często pomijają lub źle odczytują zdjęcia, a w USA, Wielkiej Brytanii czy Irlandii CV ze
              zdjęciem bywa odrzucane. W Polsce zdjęcie jest opcjonalne.
              {s.showPhoto && !resume.personal.photo && (
                <span className="mt-1 block font-medium text-amber-700">Dodaj zdjęcie w sekcji danych osobowych.</span>
              )}
            </>
          }
        />
      </div>

      <div className="space-y-3 px-5 py-5">
        <Switch
          id="setting-gdpr"
          checked={s.showGdpr}
          onChange={(showGdpr) => updateSettings({ showGdpr })}
          label="Klauzula RODO"
          description="Zgoda na przetwarzanie danych w stopce CV. Polscy pracodawcy zwykle jej oczekują, za granicą jest zbędna."
        />
        {s.showGdpr && (
          <div>
            <label htmlFor="setting-gdpr-text" className="text-[13px] font-medium text-slate-700">
              Własna treść klauzuli
            </label>
            <textarea
              id="setting-gdpr-text"
              value={s.gdprText}
              onChange={(e) => updateSettings({ gdprText: e.target.value })}
              placeholder={CV_LABELS[lang].gdprDefault}
              rows={5}
              className="mt-1.5 block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Zostaw puste, aby użyć domyślnej klauzuli w języku CV ({lang === 'pl' ? 'polskim' : 'angielskim'}). Własna
              treść nie zmienia się po przełączeniu języka.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
