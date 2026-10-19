import { Font } from '@react-pdf/renderer'

export const FONT_FAMILY = 'Lato'

export const FONT_FILES = {
  regular: 'Lato-Regular.ttf',
  bold: 'Lato-Bold.ttf',
  italic: 'Lato-Italic.ttf',
  boldItalic: 'Lato-BoldItalic.ttf',
} as const

let registered = false

/**
 * Registers Lato (full Polish glyph coverage) and disables hyphenation, which
 * would otherwise split keywords ("Java-Script") and break ATS matching.
 * `resolveSrc` maps a file name to a URL (browser) or absolute path (Node).
 */
export function registerFonts(resolveSrc: (file: string) => string): void {
  if (registered) return
  registered = true
  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: resolveSrc(FONT_FILES.regular), fontWeight: 400, fontStyle: 'normal' },
      { src: resolveSrc(FONT_FILES.bold), fontWeight: 700, fontStyle: 'normal' },
      { src: resolveSrc(FONT_FILES.italic), fontWeight: 400, fontStyle: 'italic' },
      { src: resolveSrc(FONT_FILES.boldItalic), fontWeight: 700, fontStyle: 'italic' },
    ],
  })
  Font.registerHyphenationCallback((word) => [word])
}
