/**
 * Core data model for the CV builder. This file is the shared contract between
 * the editor, the PDF renderer and the app shell. Dates are stored as strings:
 * 'YYYY-MM', 'YYYY' or '' (empty = not set).
 */

export type CvLanguage = 'en' | 'pl'

export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'courses'
  | 'projects'
  | 'awards'
  | 'volunteering'
  | 'publications'
  | 'interests'
  | 'references'
  | 'custom'

export interface ExtraLink {
  id: string
  label: string
  url: string
}

export interface PersonalInfo {
  firstName: string
  lastName: string
  jobTitle: string
  email: string
  phone: string
  city: string
  country: string
  address: string
  postalCode: string
  linkedin: string
  website: string
  github: string
  dateOfBirth: string
  nationality: string
  drivingLicense: string
  /** Data URL (image/jpeg or image/png). Empty string = no photo. */
  photo: string
  links: ExtraLink[]
}

interface Dated {
  startDate: string
  endDate: string
  /** When true, endDate is ignored and "Present"/"obecnie" is rendered. */
  current: boolean
}

/**
 * Free-text descriptions: each non-empty line is rendered separately.
 * Lines starting with "-", "*" or "•" are bullets, others are paragraphs.
 * Use parseDescription() from src/lib/description.ts to interpret.
 */
type Description = { description: string }

export interface ExperienceItem extends Dated, Description {
  id: string
  jobTitle: string
  employer: string
  city: string
}

export interface EducationItem extends Dated, Description {
  id: string
  degree: string
  fieldOfStudy: string
  school: string
  city: string
}

export interface SkillItem {
  id: string
  name: string
  /** 0 = level not shown, 1..5 = novice..expert */
  level: number
}

export type LanguageLevel = '' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'native'

export interface LanguageItem {
  id: string
  name: string
  level: LanguageLevel
}

export interface CertificationItem {
  id: string
  name: string
  issuer: string
  date: string
  url: string
}

export interface CourseItem extends Dated, Description {
  id: string
  name: string
  institution: string
}

export interface ProjectItem extends Dated, Description {
  id: string
  name: string
  role: string
  url: string
}

export interface AwardItem extends Description {
  id: string
  name: string
  issuer: string
  date: string
}

export interface VolunteeringItem extends Dated, Description {
  id: string
  role: string
  organization: string
  city: string
}

export interface PublicationItem extends Description {
  id: string
  title: string
  publisher: string
  date: string
  url: string
}

export interface InterestItem {
  id: string
  name: string
}

export interface ReferenceItem {
  id: string
  name: string
  position: string
  company: string
  email: string
  phone: string
}

export interface CustomItem extends Dated, Description {
  id: string
  title: string
  subtitle: string
  city: string
}

export interface ItemByType {
  summary: never
  experience: ExperienceItem
  education: EducationItem
  skills: SkillItem
  languages: LanguageItem
  certifications: CertificationItem
  courses: CourseItem
  projects: ProjectItem
  awards: AwardItem
  volunteering: VolunteeringItem
  publications: PublicationItem
  interests: InterestItem
  references: ReferenceItem
  custom: CustomItem
}

interface SectionBase<T extends SectionType> {
  id: string
  type: T
  /** Custom heading. Empty string = use localized default from cvLabels. */
  title: string
  visible: boolean
}

export interface SummarySection extends SectionBase<'summary'> {
  content: string
}

export interface ReferencesSection extends SectionBase<'references'> {
  items: ReferenceItem[]
  /** Render "References available upon request" instead of the items. */
  onRequest: boolean
}

type ListSectionType = Exclude<SectionType, 'summary' | 'references'>

export type ListSection<T extends ListSectionType = ListSectionType> = T extends ListSectionType
  ? SectionBase<T> & { items: ItemByType[T][] }
  : never

export type Section = SummarySection | ReferencesSection | ListSection

export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>

export type AnyItem = ItemByType[Exclude<SectionType, 'summary'>]

export type TemplateId = 'classic' | 'modern' | 'compact'

export type FontSize = 'small' | 'medium' | 'large'

/** 'text' => "May 2023" / "maj 2023"; 'numeric' => "05/2023" / "05.2023" */
export type DateFormat = 'text' | 'numeric'

export interface ResumeSettings {
  template: TemplateId
  /** Hex color, e.g. '#1f4e79'. Used sparingly (headings/lines) to stay ATS-safe. */
  accentColor: string
  fontSize: FontSize
  dateFormat: DateFormat
  showPhoto: boolean
  /** Polish CVs usually need a GDPR (RODO) consent clause in the footer. */
  showGdpr: boolean
  /** Custom clause. Empty string = localized default from cvLabels. */
  gdprText: string
}

export interface Resume {
  id: string
  /** Internal name shown in the resume list, e.g. "Frontend – PL". */
  name: string
  /** Language of the exported document (headings, dates, labels). */
  language: CvLanguage
  createdAt: string
  updatedAt: string
  personal: PersonalInfo
  sections: Section[]
  settings: ResumeSettings
}
