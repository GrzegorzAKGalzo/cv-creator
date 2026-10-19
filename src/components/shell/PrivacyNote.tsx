import { LockIcon } from './icons'

/** Always-visible privacy statement at the end of the editor pane. */
export default function PrivacyNote() {
  return (
    <aside
      aria-label="Prywatność danych"
      className="mx-4 mt-2 mb-6 flex gap-3 rounded-xl bg-slate-50 p-4 text-[13px] leading-relaxed text-slate-600 ring-1 ring-slate-200 sm:mx-6"
    >
      <LockIcon size={18} className="mt-0.5 shrink-0 text-emerald-600" />
      <div>
        <p className="font-semibold text-slate-900">Twoje dane zostają na Twoim urządzeniu</p>
        <p className="mt-1">
          Nie przetwarzamy ani nie przechowujemy Twoich danych. CV i plik PDF powstają w całości w Twojej
          przeglądarce, a wpisane informacje są zapisywane wyłącznie lokalnie – w pamięci tej przeglądarki. Nic nie
          jest wysyłane na serwer, nie ma konta ani logowania.
        </p>
        <p className="mt-1">
          Wyczyszczenie danych przeglądarki usuwa też zapisane CV – zrób kopię przez „Więcej → Zapisz kopię (JSON)”.
        </p>
      </div>
    </aside>
  )
}
