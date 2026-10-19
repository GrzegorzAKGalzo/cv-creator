import type { CvLanguage, LanguageLevel, Section, SectionType } from '../types/resume'

/**
 * Labels used INSIDE the exported CV. Switching resume.language between 'en'
 * and 'pl' switches every one of these at once. The app UI itself is Polish.
 */
export interface CvLabels {
  sections: Record<SectionType, string>
  present: string
  months: string[]
  /** Separator between start and end date. */
  dateRangeSeparator: string
  /** Separator used in numeric dates: "05/2023" (en) vs "05.2023" (pl). */
  numericDateSeparator: string
  contact: {
    email: string
    phone: string
    address: string
    linkedin: string
    website: string
    github: string
    dateOfBirth: string
    nationality: string
    drivingLicense: string
  }
  skillLevels: Record<1 | 2 | 3 | 4 | 5, string>
  languageLevels: Record<Exclude<LanguageLevel, ''>, string>
  referencesOnRequest: string
  /** Default GDPR/RODO clause; `{company}`-free so it fits any application. */
  gdprDefault: string
  /** Prefix for fields like "Issued by". */
  issuedBy: string
  fieldOfStudy: string
  role: string
}

export const CV_LABELS: Record<CvLanguage, CvLabels> = {
  en: {
    sections: {
      summary: 'Professional Summary',
      experience: 'Work Experience',
      education: 'Education',
      skills: 'Skills',
      languages: 'Languages',
      certifications: 'Certifications',
      courses: 'Courses & Training',
      projects: 'Projects',
      awards: 'Awards',
      volunteering: 'Volunteering',
      publications: 'Publications',
      interests: 'Interests',
      references: 'References',
      custom: 'Additional Information',
    },
    present: 'Present',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    dateRangeSeparator: ' – ',
    numericDateSeparator: '/',
    contact: {
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      linkedin: 'LinkedIn',
      website: 'Website',
      github: 'GitHub',
      dateOfBirth: 'Date of birth',
      nationality: 'Nationality',
      drivingLicense: 'Driving licence',
    },
    skillLevels: { 1: 'Novice', 2: 'Beginner', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert' },
    languageLevels: {
      A1: 'Beginner (A1)',
      A2: 'Elementary (A2)',
      B1: 'Intermediate (B1)',
      B2: 'Upper intermediate (B2)',
      C1: 'Advanced (C1)',
      C2: 'Proficient (C2)',
      native: 'Native',
    },
    referencesOnRequest: 'References available upon request.',
    gdprDefault:
      'I hereby consent to the processing of my personal data included in this application for the purposes of the recruitment process, in accordance with Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 (GDPR).',
    issuedBy: 'Issued by',
    fieldOfStudy: 'Field of study',
    role: 'Role',
  },
  pl: {
    sections: {
      summary: 'Podsumowanie zawodowe',
      experience: 'Doświadczenie zawodowe',
      education: 'Wykształcenie',
      skills: 'Umiejętności',
      languages: 'Języki obce',
      certifications: 'Certyfikaty',
      courses: 'Kursy i szkolenia',
      projects: 'Projekty',
      awards: 'Nagrody i wyróżnienia',
      volunteering: 'Wolontariat',
      publications: 'Publikacje',
      interests: 'Zainteresowania',
      references: 'Referencje',
      custom: 'Dodatkowe informacje',
    },
    present: 'obecnie',
    months: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'],
    dateRangeSeparator: ' – ',
    numericDateSeparator: '.',
    contact: {
      email: 'E-mail',
      phone: 'Telefon',
      address: 'Adres',
      linkedin: 'LinkedIn',
      website: 'Strona WWW',
      github: 'GitHub',
      dateOfBirth: 'Data urodzenia',
      nationality: 'Obywatelstwo',
      drivingLicense: 'Prawo jazdy',
    },
    skillLevels: { 1: 'Podstawowy', 2: 'Początkujący', 3: 'Średniozaawansowany', 4: 'Zaawansowany', 5: 'Ekspert' },
    languageLevels: {
      A1: 'Początkujący (A1)',
      A2: 'Podstawowy (A2)',
      B1: 'Średniozaawansowany (B1)',
      B2: 'Wyższy średniozaawansowany (B2)',
      C1: 'Zaawansowany (C1)',
      C2: 'Biegły (C2)',
      native: 'Ojczysty',
    },
    referencesOnRequest: 'Referencje dostępne na życzenie.',
    gdprDefault:
      'Wyrażam zgodę na przetwarzanie moich danych osobowych zawartych w niniejszym dokumencie do realizacji procesu rekrutacji zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO).',
    issuedBy: 'Wystawca',
    fieldOfStudy: 'Kierunek',
    role: 'Rola',
  },
}

export const getCvLabels = (language: CvLanguage): CvLabels => CV_LABELS[language]

/** Heading for a section: custom title if set, else the localized default. */
export const sectionTitle = (section: Pick<Section, 'type' | 'title'>, language: CvLanguage): string =>
  section.title.trim() || CV_LABELS[language].sections[section.type]
