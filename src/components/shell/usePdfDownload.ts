import { useCallback, useState } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import { downloadPdf } from '../../pdf'
import { toast } from './toast'

/** Downloads the active resume as PDF, with busy state and toasts. */
export function usePdfDownload() {
  const [busy, setBusy] = useState(false)

  const download = useCallback(async () => {
    const { resumes, activeId } = useResumeStore.getState()
    const resume = resumes.find((r) => r.id === activeId)
    if (!resume || busy) return
    setBusy(true)
    try {
      await downloadPdf(resume)
      toast.success('Pobrano PDF.')
    } catch (err) {
      console.error(err)
      const detail = err instanceof Error && err.message ? ` (${err.message})` : ''
      toast.error(`Nie udało się wygenerować PDF${detail}. Spróbuj ponownie za chwilę.`)
    } finally {
      setBusy(false)
    }
  }, [busy])

  return { download, busy }
}
