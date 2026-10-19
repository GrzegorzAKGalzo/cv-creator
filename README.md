# CV Kreator

Kreator CV (w stylu Wozber) z eksportem PDF przyjaznym dla systemów ATS i przełączaniem języka eksportu EN/PL.

## Uruchomienie

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testy (Vitest)
npm run build      # build produkcyjny do dist/
```

## Struktura

- `src/types/resume.ts` – model danych CV
- `src/store/resumeStore.ts` – stan (Zustand, zapis w localStorage)
- `src/i18n/cvLabels.ts` – wszystkie etykiety w CV po angielsku i polsku (nagłówki, daty, poziomy, klauzula RODO)
- `src/pdf/` – generowanie PDF (@react-pdf/renderer, czcionka Lato z polskimi znakami, 3 szablony)
- `src/components/editor/` – formularze edycji
- `src/components/preview/` – podgląd na żywo (pdf.js)
- `src/components/shell/` – pasek narzędzi, wygląd, analiza ATS, menu
- `src/lib/ats.ts` – analiza ATS i dopasowanie słów kluczowych z ogłoszenia
- `src/lib/importExport.ts` – kopia zapasowa JSON

## Zastrzeżenia

- To prosty projekt wykonany z pomocą AI. Mogą w nim występować błędy – przed wysłaniem CV sprawdź poprawność danych i wygenerowanego PDF.
- Analiza ATS jest orientacyjna: każdy system rekrutacyjny działa inaczej, a analiza opiera się na uproszczonych regułach. Nie daje 100% pewności ani gwarancji przejścia selekcji.
- Dane CV są przechowywane wyłącznie lokalnie w przeglądarce (localStorage) – rób kopie zapasowe przez „Więcej → Zapisz kopię (JSON)”.
