import { useEffect, useRef, useState } from 'react'
import type { Resume } from '../../types/resume'
import { generatePdfBlob } from '../../pdf'
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from './pdfjs'

export interface LoadedPdf {
  task: PDFDocumentLoadingTask
  doc: PDFDocumentProxy
  /** Page sizes in PDF points. */
  sizes: { width: number; height: number }[]
}

const DEBOUNCE_MS = 500

let pdfjsPromise: Promise<typeof import('./pdfjs')> | null = null
const loadPdfjs = () => (pdfjsPromise ??= import('./pdfjs'))

export const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : typeof err === 'string' ? err : 'Nieznany błąd'

/**
 * Regenerates the PDF (debounced) whenever the resume changes. Only one
 * generation runs at a time; edits made meanwhile coalesce into a single
 * follow-up run and stale results are discarded, so fast typing never
 * shows an older version after a newer one.
 */
export function usePdfDocument(resume: Resume | undefined) {
  const [loaded, setLoaded] = useState<LoadedPdf | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const latest = useRef(resume)
  const busy = useRef(false)
  const dirty = useRef(false)
  const alive = useRef(true)
  const hasResult = useRef(false)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    latest.current = resume
    if (!resume) return

    const run = async () => {
      if (busy.current) {
        dirty.current = true
        return
      }
      busy.current = true
      setGenerating(true)
      try {
        do {
          dirty.current = false
          const current = latest.current
          if (!current) break
          try {
            const [blob, pdfjs] = await Promise.all([generatePdfBlob(current), loadPdfjs()])
            if (dirty.current || !alive.current) continue
            const data = new Uint8Array(await blob.arrayBuffer())
            const task = pdfjs.getDocument({ data, verbosity: 0 })
            const doc = await task.promise
            if (dirty.current || !alive.current) {
              void task.destroy()
              continue
            }
            const sizes = await Promise.all(
              Array.from({ length: doc.numPages }, async (_, i) => {
                const vp = (await doc.getPage(i + 1)).getViewport({ scale: 1 })
                return { width: vp.width, height: vp.height }
              }),
            )
            if (dirty.current || !alive.current) {
              void task.destroy()
              continue
            }
            hasResult.current = true
            setError(null)
            setLoaded({ task, doc, sizes })
          } catch (err) {
            if (!dirty.current && alive.current) {
              console.error('[preview] PDF generation failed', err)
              setError(errorMessage(err))
            }
          }
        } while (dirty.current && alive.current)
      } finally {
        busy.current = false
        if (alive.current) setGenerating(false)
      }
    }

    // Render immediately the first time, debounce subsequent edits.
    const timer = setTimeout(run, hasResult.current ? DEBOUNCE_MS : 0)
    return () => clearTimeout(timer)
  }, [resume])

  return { loaded, generating, error }
}
