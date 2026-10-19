import type { Resume } from '../types/resume'
import { pdfFileName } from './format'

/**
 * Public PDF API. Other modules import ONLY from here. The react-pdf renderer
 * is loaded on demand via dynamic import() so it is code-split from the main bundle.
 */
export { pdfFileName }

let rendererPromise: Promise<typeof import('./render')> | null = null

const loadRenderer = () => {
  rendererPromise ??= import('./render').catch((err: unknown) => {
    rendererPromise = null
    throw err
  })
  return rendererPromise
}

export async function generatePdfBlob(resume: Resume): Promise<Blob> {
  const { renderPdfBlob } = await loadRenderer()
  return renderPdfBlob(resume)
}

/** Generates the PDF and triggers a browser download, e.g. "CV_Jan_Kowalski_PL.pdf". */
export async function downloadPdf(resume: Resume): Promise<void> {
  const blob = await generatePdfBlob(resume)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = pdfFileName(resume)
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoking synchronously can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
