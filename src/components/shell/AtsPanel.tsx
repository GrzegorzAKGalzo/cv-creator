import { useDeferredValue, useMemo } from 'react'
import { useActiveResume } from '../../store/resumeStore'
import { analyzeResume, type AtsCheck, type AtsStatus } from '../../lib/ats'
import { useUiStore } from './uiStore'
import { atsVerdict, type AtsVerdict } from './atsTone'
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, ChevronDownIcon, InfoIcon } from './icons'

function ScoreRing({ score, tone }: { score: number; tone: AtsVerdict }) {
  const r = 42
  const c = 2 * Math.PI * r
  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={tone.ring}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className="transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center leading-none">
          <span className="text-[34px] font-semibold tracking-tight text-slate-900 tabular-nums">{score}</span>
          <span className="mt-1 block text-[11px] text-slate-500">na 100</span>
        </div>
      </div>
    </div>
  )
}

const STATUS_META: Record<AtsStatus, { title: string; icon: typeof CheckCircleIcon; color: string }> = {
  error: { title: 'Do poprawy', icon: AlertCircleIcon, color: 'text-rose-600' },
  warn: { title: 'Warto poprawić', icon: AlertTriangleIcon, color: 'text-amber-600' },
  ok: { title: 'W porządku', icon: CheckCircleIcon, color: 'text-emerald-600' },
}

function CheckList({ checks }: { checks: AtsCheck[] }) {
  return (
    <ul className="space-y-1">
      {checks.map((c) => {
        const meta = STATUS_META[c.status]
        const Icon = meta.icon
        return (
          <li key={c.id} className="flex gap-3 rounded-lg px-2 py-2">
            <Icon size={18} className={`mt-px shrink-0 ${meta.color}`} />
            <div className="min-w-0 text-sm">
              <p className="leading-snug text-slate-900">{c.message}</p>
              {c.tip && <p className="mt-1 leading-relaxed text-slate-500">{c.tip}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function Chips({ words, matched }: { words: string[]; matched: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {words.map((w) => (
        <li
          key={w}
          className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[13px] ${
            matched
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 ring-inset'
              : 'border border-dashed border-slate-400 bg-white text-slate-700'
          }`}
        >
          {matched && <CheckCircleIcon size={13} className="text-emerald-600" />}
          {w}
        </li>
      ))}
    </ul>
  )
}

export default function AtsPanel() {
  const resume = useActiveResume()
  const jobAd = useUiStore((s) => s.jobAd)
  const setJobAd = useUiStore((s) => s.setJobAd)
  const deferredAd = useDeferredValue(jobAd)
  const result = useMemo(() => (resume ? analyzeResume(resume, deferredAd) : null), [resume, deferredAd])
  if (!resume || !result) return null

  const by = (status: AtsStatus) => result.checks.filter((c) => c.status === status)
  const errors = by('error')
  const warns = by('warn')
  const oks = by('ok')
  const tone = atsVerdict(result)
  const kw = result.keywords
  const kwTotal = kw ? kw.matched.length + kw.missing.length : 0

  return (
    <div className="pb-10">
      <div className="flex items-center gap-5 px-5 py-5">
        <ScoreRing score={result.score} tone={tone} />
        <div className="min-w-0">
          <p className={`text-base font-semibold ${tone.text}`}>{tone.label}</p>
          <p className="mt-1 text-sm text-slate-600">
            {errors.length === 0 && warns.length === 0
              ? 'Wszystkie testy zaliczone.'
              : [errors.length && `${errors.length} do poprawy`, warns.length && `${warns.length} do rozważenia`]
                  .filter(Boolean)
                  .join(', ') + '.'}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Ocena sprawdza kompletność i czytelność CV dla systemów rekrutacyjnych (ATS).
          </p>
        </div>
      </div>

      <div role="note" className="mx-5 mb-4 flex gap-2.5 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
        <InfoIcon className="mt-px shrink-0 text-amber-600" />
        <p>
          <strong className="font-semibold">Wynik jest orientacyjny.</strong> Każdy system ATS działa inaczej, a ta analiza
          opiera się na uproszczonych regułach – nie daje 100% pewności ani gwarancji przejścia selekcji. Traktuj ją jako
          listę podpowiedzi i zawsze sprawdź gotowy plik PDF.
        </p>
      </div>

      <div className="space-y-5 border-t border-slate-100 px-3 pt-4">
        {(
          [
            ['error', errors],
            ['warn', warns],
          ] as const
        ).map(
          ([status, list]) =>
            list.length > 0 && (
              <section key={status}>
                <h3 className="px-2 pb-1 text-[13px] font-semibold text-slate-900">
                  {STATUS_META[status].title} <span className="font-normal text-slate-400">{list.length}</span>
                </h3>
                <CheckList checks={list} />
              </section>
            ),
        )}
        {oks.length > 0 && (
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-semibold text-slate-900 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              {STATUS_META.ok.title} <span className="font-normal text-slate-400">{oks.length}</span>
              <ChevronDownIcon className="ml-auto text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-1">
              <CheckList checks={oks} />
            </div>
          </details>
        )}
      </div>

      <section className="mx-5 mt-6 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <label htmlFor="ats-job-ad" className="block text-sm font-semibold text-slate-900">
          Wklej ogłoszenie o pracę
        </label>
        <p className="mt-0.5 text-[13px] text-slate-500">
          Sprawdzimy, które słowa kluczowe z ogłoszenia występują w Twoim CV.
        </p>
        <textarea
          id="ats-job-ad"
          value={jobAd}
          onChange={(e) => setJobAd(e.target.value)}
          rows={6}
          placeholder="np. Szukamy osoby ze znajomością Excela, SAP i obsługi klienta…"
          className="mt-3 block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        {kw && kwTotal > 0 && (
          <div className="mt-4 space-y-4" aria-live="polite">
            <div>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="font-semibold text-slate-900">Dopasowanie słów kluczowych</span>
                <span className="text-slate-600 tabular-nums">
                  {kw.matched.length} z {kwTotal}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-[width] duration-300"
                  style={{ width: `${(kw.matched.length / kwTotal) * 100}%` }}
                />
              </div>
            </div>
            {kw.missing.length > 0 && (
              <div>
                <h4 className="mb-2 text-[13px] font-medium text-slate-700">
                  Brakuje w CV – dodaj, jeśli to prawda o Tobie
                </h4>
                <Chips words={kw.missing} matched={false} />
              </div>
            )}
            {kw.matched.length > 0 && (
              <div>
                <h4 className="mb-2 text-[13px] font-medium text-slate-700">Znalezione w CV</h4>
                <Chips words={kw.matched} matched />
              </div>
            )}
          </div>
        )}
        {kw && kwTotal === 0 && (
          <p className="mt-3 text-[13px] text-slate-500">
            Nie znaleźliśmy w tekście słów kluczowych. Wklej pełną treść ogłoszenia.
          </p>
        )}
      </section>
    </div>
  )
}
