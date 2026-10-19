import { pdf } from '@react-pdf/renderer'
import type { Resume } from '../types/resume'
import { registerFonts } from './fonts'
import { ResumeDocument } from './ResumeDocument'

/** Heavy browser-side renderer; loaded lazily from ./index.ts. */
registerFonts((file) => {
  const base = import.meta.env.BASE_URL || '/'
  const path = `${base.endsWith('/') ? base : `${base}/`}fonts/${file}`
  return typeof window !== 'undefined' ? new URL(path, window.location.href).href : path
})

export function renderPdfBlob(resume: Resume): Promise<Blob> {
  return pdf(<ResumeDocument resume={resume} />).toBlob()
}
