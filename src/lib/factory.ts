import type {
  AnyItem,
  CvLanguage,
  ItemByType,
  PersonalInfo,
  Resume,
  ResumeSettings,
  Section,
  SectionType,
} from '../types/resume'

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

/** Every section type in its default display order. */
export const SECTION_TYPES: SectionType[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'languages',
  'certifications',
  'courses',
  'projects',
  'awards',
  'volunteering',
  'publications',
  'interests',
  'references',
  'custom',
]

/** Sections that may appear more than once in a single resume. */
export const REPEATABLE_SECTIONS: SectionType[] = ['custom']

/** Sections created for a brand-new resume. */
export const DEFAULT_SECTIONS: SectionType[] = ['summary', 'experience', 'education', 'skills', 'languages']

const dated = { startDate: '', endDate: '', current: false }

export function createEmptyItem<T extends Exclude<SectionType, 'summary'>>(type: T): ItemByType[T] {
  const id = uid()
  const items: { [K in Exclude<SectionType, 'summary'>]: ItemByType[K] } = {
    experience: { id, jobTitle: '', employer: '', city: '', ...dated, description: '' },
    education: { id, degree: '', fieldOfStudy: '', school: '', city: '', ...dated, description: '' },
    skills: { id, name: '', level: 0 },
    languages: { id, name: '', level: '' },
    certifications: { id, name: '', issuer: '', date: '', url: '' },
    courses: { id, name: '', institution: '', ...dated, description: '' },
    projects: { id, name: '', role: '', url: '', ...dated, description: '' },
    awards: { id, name: '', issuer: '', date: '', description: '' },
    volunteering: { id, role: '', organization: '', city: '', ...dated, description: '' },
    publications: { id, title: '', publisher: '', date: '', url: '', description: '' },
    interests: { id, name: '' },
    references: { id, name: '', position: '', company: '', email: '', phone: '' },
    custom: { id, title: '', subtitle: '', city: '', ...dated, description: '' },
  }
  return items[type] as ItemByType[T]
}

export function createSection(type: SectionType): Section {
  const base = { id: uid(), title: '', visible: true }
  if (type === 'summary') return { ...base, type, content: '' }
  if (type === 'references') return { ...base, type, items: [], onRequest: false }
  return { ...base, type, items: [] as AnyItem[] } as Section
}

export const emptyPersonal = (): PersonalInfo => ({
  firstName: '',
  lastName: '',
  jobTitle: '',
  email: '',
  phone: '',
  city: '',
  country: '',
  address: '',
  postalCode: '',
  linkedin: '',
  website: '',
  github: '',
  dateOfBirth: '',
  nationality: '',
  drivingLicense: '',
  photo: '',
  links: [],
})

export const defaultSettings = (language: CvLanguage): ResumeSettings => ({
  template: 'classic',
  accentColor: '#1f4e79',
  fontSize: 'medium',
  dateFormat: 'numeric',
  spacing: 'normal',
  showPhoto: false,
  showGdpr: language === 'pl',
  gdprText: '',
})

export function createEmptyResume(language: CvLanguage = 'pl', name?: string): Resume {
  const now = new Date().toISOString()
  return {
    id: uid(),
    name: name ?? (language === 'pl' ? 'Moje CV' : 'My CV'),
    language,
    createdAt: now,
    updatedAt: now,
    personal: emptyPersonal(),
    sections: DEFAULT_SECTIONS.map(createSection),
    settings: defaultSettings(language),
  }
}

/** Deep copy with fresh ids for the resume, sections and items. */
export function cloneResume(resume: Resume, overrides: Partial<Resume> = {}): Resume {
  const copy: Resume = structuredClone(resume)
  const now = new Date().toISOString()
  copy.id = uid()
  copy.createdAt = now
  copy.updatedAt = now
  copy.personal.links = copy.personal.links.map((l) => ({ ...l, id: uid() }))
  copy.sections = copy.sections.map((s) => {
    const section = { ...s, id: uid() }
    if ('items' in section) {
      ;(section as { items: AnyItem[] }).items = section.items.map((i) => ({ ...i, id: uid() }))
    }
    return section as Section
  })
  return { ...copy, ...overrides }
}
