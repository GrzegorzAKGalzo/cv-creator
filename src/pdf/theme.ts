import type { Styles } from '@react-pdf/renderer'
import type { FontSize, ResumeSettings, Spacing, TemplateId } from '../types/resume'
import { FONT_FAMILY } from './fonts'

/**
 * Template styling. All templates are single-column with linear reading order.
 * Deliberately NO textTransform/letterSpacing on text: uppercase changes the
 * extracted keywords and letter spacing makes some parsers split words.
 */

type Style = Styles[string]

export const TEXT_COLOR = '#1a1a1a'
export const MUTED_COLOR = '#4a4a4a'
export const LIGHT_COLOR = '#6b6b6b'
const DEFAULT_ACCENT = '#1f4e79'

const BODY_SIZE: Record<FontSize, number> = { small: 9, medium: 10, large: 11 }

/**
 * Vertical rhythm multipliers. 'compact' is the original tight rhythm; 'normal'
 * adds air above headings, between the heading rule and the content and between
 * entries; 'relaxed' adds clearly more. Line heights are not affected.
 */
const SPACING: Record<Spacing, { section: number; heading: number; item: number; rule: number }> = {
  compact: { section: 1, heading: 1, item: 1, rule: 1 },
  normal: { section: 1.4, heading: 1.5, item: 1.3, rule: 1.5 },
  relaxed: { section: 1.85, heading: 2, item: 1.7, rule: 2 },
}

export interface Theme {
  template: TemplateId
  accent: string
  bodySize: number
  separator: string
  /** Photo centered layouts reserve symmetric space on the left. */
  centered: boolean
  minPresence: { heading: number; itemHeader: number }
  s: Record<
    | 'page'
    | 'header'
    | 'headerText'
    | 'photo'
    | 'name'
    | 'jobTitle'
    | 'contact'
    | 'link'
    | 'headerRule'
    | 'sectionStart'
    | 'headingWrap'
    | 'heading'
    | 'item'
    | 'itemFirst'
    | 'itemRow'
    | 'itemTitle'
    | 'itemDate'
    | 'itemSubtitle'
    | 'itemMeta'
    | 'paragraph'
    | 'bulletRow'
    | 'bulletMark'
    | 'bulletText'
    | 'inlineList'
    | 'gdprBox'
    | 'gdpr'
    | 'pageNumber',
    Style
  >
}

export function normalizeAccent(color: string): string {
  const c = (color ?? '').trim()
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? c : DEFAULT_ACCENT
}

export function buildTheme(
  settings: Pick<ResumeSettings, 'template' | 'accentColor' | 'fontSize'> & Partial<Pick<ResumeSettings, 'spacing'>>,
): Theme {
  const template: TemplateId = ['classic', 'modern', 'compact'].includes(settings.template) ? settings.template : 'classic'
  const accent = normalizeAccent(settings.accentColor)
  const compact = template === 'compact'
  const b = (BODY_SIZE[settings.fontSize] ?? 10) - (compact ? 0.5 : 0)
  const lh = compact ? 1.25 : 1.35

  const pad = {
    classic: { v: 46, h: 52 },
    modern: { v: 42, h: 46 },
    compact: { v: 26, h: 32 },
  }[template]
  const sp = SPACING[settings.spacing ?? 'normal'] ?? SPACING.normal
  // Gaps scale with the font size so the rhythm stays proportional.
  const k = b / 10
  const sectionGap = { classic: 13, modern: 13, compact: 7 }[template] * sp.section * k
  const headingGap = { classic: 7, modern: 7, compact: 3 }[template] * sp.heading * k
  const itemGap = { classic: 7, modern: 7, compact: 4 }[template] * sp.item * k
  const rulePad = { classic: 2, modern: 0, compact: 1 }[template] * sp.rule

  // lineHeight is set per text style together with an explicit fontSize: react-pdf
  // resolves unitless lineHeight against the node's own fontSize (default 18),
  // and a lineHeight on <Page> makes it drop fixed dynamic text (page numbers).
  const base: Theme['s'] = {
    page: {
      fontFamily: FONT_FAMILY,
      fontSize: b,
      color: TEXT_COLOR,
      paddingTop: pad.v,
      paddingBottom: pad.v + 4,
      paddingHorizontal: pad.h,
    },
    header: { flexDirection: 'row', alignItems: 'flex-start' },
    headerText: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
    photo: { width: b * 6.4, height: b * 8, objectFit: 'cover', marginLeft: 12 },
    name: { fontSize: b * 2.4, fontWeight: 700, lineHeight: 1.15, color: TEXT_COLOR },
    jobTitle: { lineHeight: 1.3, fontSize: b * 1.25, color: MUTED_COLOR, marginTop: 2 },
    contact: { lineHeight: lh, fontSize: b * 0.92, color: MUTED_COLOR, marginTop: 3 },
    link: { color: MUTED_COLOR, textDecoration: 'none' },
    headerRule: {},
    sectionStart: { marginTop: sectionGap },
    headingWrap: { marginBottom: headingGap },
    heading: { fontSize: b * 1.2, fontWeight: 700, color: accent, lineHeight: 1.2 },
    item: { marginTop: itemGap },
    itemFirst: {},
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemTitle: { fontSize: b, lineHeight: lh, fontWeight: 700, flexGrow: 1, flexShrink: 1, flexBasis: 0 },
    itemDate: { fontSize: b, lineHeight: lh, color: MUTED_COLOR, marginLeft: 10, flexShrink: 0, textAlign: 'right' },
    itemSubtitle: { fontSize: b, lineHeight: lh, color: MUTED_COLOR, fontStyle: 'italic' },
    itemMeta: { fontSize: b, lineHeight: lh, color: MUTED_COLOR },
    paragraph: { fontSize: b, lineHeight: lh, marginTop: 2 * sp.item },
    bulletRow: { flexDirection: 'row', marginTop: 1.5 * sp.item },
    bulletMark: { fontSize: b, lineHeight: lh, width: b * 1.1, paddingLeft: b * 0.15 },
    bulletText: { fontSize: b, lineHeight: lh, flexGrow: 1, flexShrink: 1, flexBasis: 0 },
    inlineList: { fontSize: b, lineHeight: lh },
    // marginTop 'auto' pushes the clause to the bottom of whichever page it lands on.
    gdprBox: { marginTop: 'auto', paddingTop: sectionGap },
    gdpr: { fontSize: Math.max(6.5, b * 0.72), color: LIGHT_COLOR, lineHeight: 1.3 },
    pageNumber: {
      position: 'absolute',
      bottom: Math.max(12, pad.v / 2 - 4),
      left: pad.h,
      right: pad.h,
      textAlign: 'right',
      fontSize: Math.max(6.5, b * 0.75),
      color: LIGHT_COLOR,
    },
  }

  if (template === 'classic') {
    Object.assign(base.headerText, { alignItems: 'center', textAlign: 'center' })
    Object.assign(base.name, { textAlign: 'center' })
    Object.assign(base.jobTitle, { textAlign: 'center' })
    Object.assign(base.contact, { textAlign: 'center' })
    Object.assign(base.headingWrap, { borderBottomWidth: 0.75, borderBottomColor: accent, paddingBottom: rulePad })
    Object.assign(base.heading, { fontSize: b * 1.15 })
  }

  if (template === 'modern') {
    Object.assign(base.name, { color: accent, fontSize: b * 2.6 })
    Object.assign(base.headerRule, { borderBottomWidth: 2, borderBottomColor: accent, marginTop: 8 })
    Object.assign(base.headingWrap, { borderLeftWidth: 3, borderLeftColor: accent, paddingLeft: 7 })
    Object.assign(base.heading, { color: TEXT_COLOR, fontSize: b * 1.25 })
    Object.assign(base.photo, { borderRadius: 4 })
  }

  if (compact) {
    Object.assign(base.name, { fontSize: b * 2 })
    Object.assign(base.jobTitle, { fontSize: b * 1.1, marginTop: 1 })
    Object.assign(base.contact, { marginTop: 1.5 })
    Object.assign(base.photo, { width: b * 5.4, height: b * 6.75 })
    Object.assign(base.headingWrap, { borderBottomWidth: 0.5, borderBottomColor: accent, paddingBottom: rulePad })
    Object.assign(base.heading, { fontSize: b * 1.08 })
    Object.assign(base.paragraph, { marginTop: 1 * sp.item })
    Object.assign(base.bulletRow, { marginTop: 0.5 * sp.item })
  }

  return {
    template,
    accent,
    bodySize: b,
    separator: ' | ',
    centered: template === 'classic',
    // A heading is normally grouped with the start of its body (see ResumeDocument);
    // `heading` is only the fallback for bodies too long to group (~2 lines of text).
    minPresence: { heading: b * 3, itemHeader: b * 1.6 },
    s: base,
  }
}
