import { Fragment, type ReactNode } from 'react'
import { Document, Image, Link, Page, Text, View } from '@react-pdf/renderer'
import type { CvLanguage, DateFormat, PersonalInfo, Resume, Section } from '../types/resume'
import { getCvLabels, sectionTitle, type CvLabels } from '../i18n/cvLabels'
import { formatDate, formatDateRange } from '../lib/dates'
import { parseDescription, type DescriptionBlock } from '../lib/description'
import {
  clean,
  displayUrl,
  documentTitle,
  formatBirthDate,
  fullName,
  hrefFor,
  itemHasContent,
  joinParts,
  pdfLanguageTag,
  profileUrl,
  skillKeywords,
  visibleSections,
} from './format'
import { buildTheme, type Theme } from './theme'

interface Ctx {
  t: Theme
  labels: CvLabels
  lang: CvLanguage
  fmt: DateFormat
}

/** A piece of inline text, optionally clickable. */
interface Part {
  text: string
  href?: string
}

const PHOTO_RE = /^data:image\/(png|jpe?g);base64,/i

/** Renders parts separated by `sep`; empty parts are skipped (no dangling separators). */
function InlineParts({ parts, sep, linkStyle }: { parts: Part[]; sep: string; linkStyle: Theme['s']['link'] }) {
  const items = parts.filter((p) => clean(p.text))
  return (
    <>
      {items.map((p, i) => (
        <Fragment key={i}>
          {i > 0 ? sep : ''}
          {p.href ? (
            <Link src={p.href} style={linkStyle}>
              {clean(p.text)}
            </Link>
          ) : (
            clean(p.text)
          )}
        </Fragment>
      ))}
    </>
  )
}

const urlPart = (url: string, label = ''): Part | null => {
  const u = clean(url)
  if (!u) return null
  const text = displayUrl(u)
  return { text: clean(label) ? `${clean(label)}: ${text}` : text, href: hrefFor(u) }
}

function contactLines(p: PersonalInfo, { labels, lang, fmt }: Ctx): Part[][] {
  const location = joinParts([p.address, joinParts([p.postalCode, p.city], ' '), p.country], ', ')
  const email = clean(p.email)
  const basics: Part[] = [
    email ? { text: email, href: `mailto:${email}` } : null,
    { text: p.phone },
    { text: location },
  ].filter((x): x is Part => !!x && !!clean(x.text))

  const links: Part[] = [
    urlPart(profileUrl(p.linkedin, 'linkedin.com/in')),
    urlPart(profileUrl(p.github, 'github.com')),
    urlPart(p.website),
    ...p.links.map((l) => urlPart(l.url, l.label)),
  ].filter((x): x is Part => !!x)

  const c = labels.contact
  const personal: Part[] = [
    clean(p.dateOfBirth) ? { text: `${c.dateOfBirth}: ${formatBirthDate(p.dateOfBirth, lang, fmt)}` } : null,
    clean(p.nationality) ? { text: `${c.nationality}: ${clean(p.nationality)}` } : null,
    clean(p.drivingLicense) ? { text: `${c.drivingLicense}: ${clean(p.drivingLicense)}` } : null,
  ].filter((x): x is Part => !!x)

  return [basics, links, personal].filter((line) => line.length > 0)
}

function Header({ resume, ctx }: { resume: Resume; ctx: Ctx }) {
  const { t } = ctx
  const p = resume.personal
  const name = fullName(p)
  const jobTitle = clean(p.jobTitle)
  const photo = resume.settings.showPhoto && PHOTO_RE.test(p.photo) ? p.photo : ''
  const lines = contactLines(p, ctx)
  if (!name && !jobTitle && lines.length === 0 && !photo) return null

  const photoBox = t.s.photo as { width: number; marginLeft: number }
  return (
    <View style={t.s.header}>
      {/* Invisible spacer keeps the centered (classic) header visually centered next to a photo. */}
      {photo && t.centered ? <View style={{ width: photoBox.width + photoBox.marginLeft }} /> : null}
      <View style={t.s.headerText}>
        {name ? <Text style={t.s.name}>{name}</Text> : null}
        {jobTitle ? <Text style={t.s.jobTitle}>{jobTitle}</Text> : null}
        {lines.map((line, i) => (
          <Text key={i} style={t.s.contact}>
            <InlineParts parts={line} sep={t.separator} linkStyle={t.s.link} />
          </Text>
        ))}
        {t.template === 'modern' ? <View style={t.s.headerRule} /> : null}
      </View>
      {photo ? <Image src={photo} style={t.s.photo} /> : null}
    </View>
  )
}

/** One renderable unit of a description: a paragraph or a single bullet. */
type DescUnit = { type: 'paragraph'; text: string } | { type: 'bullet'; text: string }

const descUnits = (blocks: DescriptionBlock[]): DescUnit[] =>
  blocks.flatMap((b): DescUnit[] =>
    b.type === 'paragraph' ? [{ type: 'paragraph', text: b.text }] : b.items.map((text) => ({ type: 'bullet' as const, text })),
  )

function DescUnits({ units, ctx }: { units: DescUnit[]; ctx: Ctx }) {
  const { s } = ctx.t
  return (
    <>
      {units.map((u, i) =>
        u.type === 'paragraph' ? (
          <Text key={i} style={s.paragraph}>
            {u.text}
          </Text>
        ) : (
          <View key={i} style={s.bulletRow}>
            <Text style={s.bulletMark}>•</Text>
            <Text style={s.bulletText}>{u.text}</Text>
          </View>
        ),
      )}
    </>
  )
}

function Description({ text, ctx }: { text: string; ctx: Ctx }) {
  return <DescUnits units={descUnits(parseDescription(text ?? ''))} ctx={ctx} />
}

interface EntryData {
  key: string
  title: string
  subtitle?: string
  date?: string
  /** Extra plain/link line below the subtitle (urls, contact details). */
  meta?: Part[]
  description?: string
}

/**
 * NOTE on structure: react-pdf only honours `minPresenceAhead` when the node has
 * previous siblings, so headings, entry headers and description blocks are all
 * emitted as flat children of <Page> (components return fragments).
 */

/**
 * Entry header kept together on one page; the description may flow across pages.
 * `lead` (the section heading) is placed inside the same unbreakable block, so a
 * heading always travels with its first entry header.
 */
function Entry({ ctx, data, first, lead }: { ctx: Ctx; data: EntryData; first: boolean; lead?: ReactNode }) {
  const { s, separator, minPresence } = ctx.t
  const description = data.description ?? ''
  const hasDescription = parseDescription(description).length > 0
  let heading = clean(data.title)
  let sub = clean(data.subtitle)
  if (!heading && sub) [heading, sub] = [sub, '']
  const date = clean(data.date)
  const metaParts = (data.meta ?? []).filter((m) => clean(m.text))
  return (
    <>
      <View
        style={lead ? s.sectionStart : first ? s.itemFirst : s.item}
        wrap={false}
        minPresenceAhead={hasDescription ? minPresence.itemHeader : 0}
      >
        {lead}
        {heading || date ? (
          <View style={s.itemRow}>
            <Text style={s.itemTitle}>{heading}</Text>
            {date ? <Text style={s.itemDate}>{date}</Text> : null}
          </View>
        ) : null}
        {sub ? <Text style={s.itemSubtitle}>{sub}</Text> : null}
        {metaParts.length > 0 ? (
          <Text style={s.itemMeta}>
            <InlineParts parts={metaParts} sep={separator} linkStyle={s.link} />
          </Text>
        ) : null}
      </View>
      {hasDescription ? <Description text={description} ctx={ctx} /> : null}
    </>
  )
}

const range = (ctx: Ctx, i: { startDate: string; endDate: string; current: boolean }) =>
  formatDateRange(i.startDate, i.endDate, i.current, ctx.lang, ctx.fmt)

const single = (ctx: Ctx, date: string) => formatDate(date, ctx.lang, ctx.fmt)

const links = (...parts: (Part | null)[]): Part[] => parts.filter((p): p is Part => !!p)

const withLabel = (label: string, value: string) => (clean(value) ? `${label}: ${clean(value)}` : '')

/** Maps list-section items to entries (null for sections rendered as inline text). */
function entriesFor(section: Section, ctx: Ctx): EntryData[] | null {
  const { labels } = ctx
  switch (section.type) {
    case 'experience':
      return section.items.filter(itemHasContent).map((i) => ({
        key: i.id,
        title: i.jobTitle,
        subtitle: joinParts([i.employer, i.city], ', '),
        date: range(ctx, i),
        description: i.description,
      }))
    case 'education':
      return section.items.filter(itemHasContent).map((i) => ({
        key: i.id,
        title: joinParts([i.degree, i.fieldOfStudy], ', '),
        subtitle: joinParts([i.school, i.city], ', '),
        date: range(ctx, i),
        description: i.description,
      }))
    case 'certifications':
      return section.items.filter(itemHasContent).map((i) => ({
        key: i.id,
        title: i.name,
        subtitle: withLabel(labels.issuedBy, i.issuer),
        date: single(ctx, i.date),
        meta: links(urlPart(i.url)),
      }))
    case 'courses':
      return section.items.filter(itemHasContent).map((i) => ({
        key: i.id,
        title: i.name,
        subtitle: i.institution,
        date: range(ctx, i),
        description: i.description,
      }))
    case 'projects':
      return section.items.filter(itemHasContent).map((i) => ({
        key: i.id,
        title: i.name,
        subtitle: withLabel(labels.role, i.role),
        date: range(ctx, i),
        meta: links(urlPart(i.url)),
        description: i.description,
      }))
    case 'awards':
      return section.items.filter(itemHasContent).map((i) => ({
        key: i.id,
        title: i.name,
        subtitle: i.issuer,
        date: single(ctx, i.date),
        description: i.description,
      }))
    case 'volunteering':
      return section.items.filter(itemHasContent).map((i) => ({
        key: i.id,
        title: i.role,
        subtitle: joinParts([i.organization, i.city], ', '),
        date: range(ctx, i),
        description: i.description,
      }))
    case 'publications':
      return section.items.filter(itemHasContent).map((i) => ({
        key: i.id,
        title: i.title,
        subtitle: i.publisher,
        date: single(ctx, i.date),
        meta: links(urlPart(i.url)),
        description: i.description,
      }))
    case 'references':
      return section.items.filter(itemHasContent).map((i) => {
        const email = clean(i.email)
        return {
          key: i.id,
          title: i.name,
          subtitle: joinParts([i.position, i.company], ', '),
          meta: links(email ? { text: email, href: `mailto:${email}` } : null, { text: i.phone }),
        }
      })
    case 'custom':
      return section.items.filter(itemHasContent).map((i) => ({
        key: i.id,
        title: i.title,
        subtitle: joinParts([i.subtitle, i.city], ', '),
        date: range(ctx, i),
        description: i.description,
      }))
    default:
      return null
  }
}

/** Sections rendered as one line of text (no graphical levels – ATS-safe). */
function inlineText(section: Section, { labels }: Ctx): string {
  const withLevel = (name: string, level: string | undefined) => (level ? `${clean(name)} – ${level}` : clean(name))
  switch (section.type) {
    case 'skills':
      return section.items
        .filter(itemHasContent)
        .map((i) => withLevel(i.name, labels.skillLevels[i.level as 1 | 2 | 3 | 4 | 5]))
        .join(', ')
    case 'languages':
      return section.items
        .filter(itemHasContent)
        .map((i) => withLevel(i.name, i.level ? labels.languageLevels[i.level] : ''))
        .join(', ')
    case 'interests':
      return section.items.map((i) => clean(i.name)).filter(Boolean).join(', ')
    default:
      return ''
  }
}

/** Bodies up to this many characters are grouped with their heading in one unbreakable block. */
const GROUP_MAX_CHARS = 450

/**
 * Page-break strategy: the heading is emitted together with the START of its body
 * in one `wrap={false}` block (inline text, first summary paragraph/bullet, or the
 * first entry header), so it can never be orphaned and only the space that is
 * really needed is reserved. Bodies too long to group fall back to a heading with
 * `minPresenceAhead`. Everything stays a flat child of <Page> (see note above Entry).
 */
function SectionView({ section, ctx }: { section: Section; ctx: Ctx }) {
  const { s, minPresence } = ctx.t
  const heading = (
    <View style={s.headingWrap}>
      <Text style={s.heading}>{sectionTitle(section, ctx.lang)}</Text>
    </View>
  )
  const lone = (
    <View style={s.sectionStart} wrap={false} minPresenceAhead={minPresence.heading}>
      {heading}
    </View>
  )

  if (section.type === 'summary') {
    const units = descUnits(parseDescription(section.content))
    const [head, ...rest] = units
    if (!head || head.text.length > GROUP_MAX_CHARS) {
      return (
        <>
          {lone}
          <DescUnits units={units} ctx={ctx} />
        </>
      )
    }
    return (
      <>
        <View style={s.sectionStart} wrap={false} minPresenceAhead={rest.length ? minPresence.itemHeader : 0}>
          {heading}
          <DescUnits units={[head]} ctx={ctx} />
        </View>
        <DescUnits units={rest} ctx={ctx} />
      </>
    )
  }

  const entries = section.type === 'references' && section.onRequest ? null : entriesFor(section, ctx)
  if (entries && entries.length > 0) {
    return (
      <>
        {entries.map((data, i) => (
          <Entry key={data.key} ctx={ctx} data={data} first={i === 0} lead={i === 0 ? heading : undefined} />
        ))}
      </>
    )
  }

  const text = section.type === 'references' ? ctx.labels.referencesOnRequest : inlineText(section, ctx)
  const body = <Text style={s.inlineList}>{text}</Text>
  if (text.length > GROUP_MAX_CHARS) {
    return (
      <>
        {lone}
        {body}
      </>
    )
  }
  return (
    <View style={s.sectionStart} wrap={false}>
      {heading}
      {body}
    </View>
  )
}

/** The CV as a react-pdf document. Pure: rendering depends only on `resume`. */
export function ResumeDocument({ resume }: { resume: Resume }) {
  const t = buildTheme(resume.settings)
  const labels = getCvLabels(resume.language)
  const ctx: Ctx = { t, labels, lang: resume.language, fmt: resume.settings.dateFormat === 'numeric' ? 'numeric' : 'text' }
  const sections = visibleSections(resume)
  const gdpr = resume.settings.showGdpr ? (resume.settings.gdprText ?? '').trim() || labels.gdprDefault : ''

  return (
    <Document
      title={documentTitle(resume)}
      author={fullName(resume.personal) || undefined}
      subject={clean(resume.personal.jobTitle) || undefined}
      keywords={skillKeywords(resume).join(', ') || undefined}
      creator="CV Kreator"
      producer="CV Kreator"
      language={pdfLanguageTag(resume.language)}
    >
      <Page size="A4" style={t.s.page} wrap>
        <Header resume={resume} ctx={ctx} />
        {sections.map((section) => (
          <SectionView key={section.id} section={section} ctx={ctx} />
        ))}
        {gdpr ? (
          // Pushed to the bottom of the LAST page by an auto top margin. It stays in the
          // normal flow (no fixed/absolute), so it can never overlap content, it is
          // extracted once after all content, and if the last page is full the whole
          // block moves to the bottom of a new page.
          <View style={t.s.gdprBox} wrap={false}>
            <Text style={t.s.gdpr}>{gdpr}</Text>
          </View>
        ) : null}
        <Text
          fixed
          style={t.s.pageNumber}
          render={({ pageNumber, totalPages }) => (totalPages && totalPages > 1 ? `${pageNumber} / ${totalPages}` : '')}
        />
      </Page>
    </Document>
  )
}
