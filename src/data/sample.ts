import type { CvLanguage, ItemByType, Resume, Section, SectionType } from '../types/resume'
import { createEmptyItem, createEmptyResume, createSection, uid } from '../lib/factory'

type ItemType = Exclude<SectionType, 'summary'>
type ListType = Exclude<SectionType, 'summary' | 'references'>

const item = <T extends ItemType>(type: T, fields: Partial<Omit<ItemByType[T], 'id'>>): ItemByType[T] => ({
  ...createEmptyItem(type),
  ...fields,
})

const list = <T extends ListType>(type: T, items: ItemByType[T][], title = ''): Section =>
  ({ ...createSection(type), title, items }) as Section

/**
 * A realistic, fully populated sample resume (Senior Frontend Developer).
 * Content is written in the given language; every section type is present.
 */
export function createSampleResume(language: CvLanguage): Resume {
  const t = (pl: string, en: string) => (language === 'pl' ? pl : en)
  const base = createEmptyResume(language, t('Przykładowe CV – Frontend', 'Sample CV – Frontend'))
  const company1 = 'Żółty Żagiel Software S.A.'

  base.personal = {
    ...base.personal,
    firstName: 'Łukasz',
    lastName: 'Żurawski',
    jobTitle: 'Senior Frontend Developer',
    email: 'lukasz.zurawski@example.com',
    phone: '+48 601 234 567',
    city: 'Wrocław',
    country: t('Polska', 'Poland'),
    linkedin: 'https://www.linkedin.com/in/lukasz-zurawski',
    website: 'https://zurawski.dev',
    github: 'https://github.com/lzurawski',
    drivingLicense: t('kat. B', 'Category B'),
    photo: '',
    links: [{ id: uid(), label: 'Blog', url: 'https://blog.zurawski.dev' }],
  }

  const summary: Section = {
    id: uid(),
    type: 'summary',
    title: '',
    visible: true,
    content: t(
      'Senior Frontend Developer z ponad 8-letnim doświadczeniem w tworzeniu skalowalnych aplikacji webowych w React i TypeScript. Specjalizuję się w architekturze frontendu, wydajności i dostępności (WCAG 2.1). Kierowałem zespołem 6 programistów, wdrożyłem design system używany przez 14 produktów i skróciłem czas ładowania kluczowych stron o 45%. Łączę perspektywę techniczną z biznesową – ściśle współpracuję z UX, produktem i backendem. Szukam roli, w której będę rozwijać ambitny produkt i dzielić się wiedzą z zespołem.',
      'Senior Frontend Developer with 8+ years of experience building scalable web applications in React and TypeScript. I specialise in frontend architecture, performance and accessibility (WCAG 2.1). I have led a team of 6 engineers, shipped a design system used by 14 products and cut load times of key pages by 45%. I combine a technical and business perspective, working closely with UX, product and backend teams. Looking for a role where I can grow an ambitious product and share knowledge with the team.',
    ),
  }

  const experience = list('experience', [
    item('experience', {
      jobTitle: 'Senior Frontend Developer / Tech Lead',
      employer: company1,
      city: 'Wrocław',
      startDate: '2021-03',
      current: true,
      description: t(
        '- Kieruję zespołem 6 frontend developerów rozwijającym platformę e-commerce z 2 mln użytkowników miesięcznie.\n- Zaprojektowałem i wdrożyłem design system (React, Storybook) używany w 14 produktach, co skróciło czas dostarczania nowych widoków o 30%.\n- Zoptymalizowałem wydajność: LCP spadło z 4,1 s do 2,2 s, a współczynnik konwersji wzrósł o 12%.\n- Wprowadziłem testy E2E (Playwright) i CI/CD w GitLabie – liczba błędów produkcyjnych zmalała o 40%.',
        '- Lead a team of 6 frontend developers building an e-commerce platform with 2M monthly users.\n- Designed and shipped a design system (React, Storybook) used across 14 products, reducing time-to-deliver for new views by 30%.\n- Optimised performance: LCP dropped from 4.1 s to 2.2 s and the conversion rate grew by 12%.\n- Introduced E2E tests (Playwright) and CI/CD in GitLab, cutting production bugs by 40%.',
      ),
    }),
    item('experience', {
      jobTitle: 'Frontend Developer',
      employer: 'Gęśla Interactive sp. z o.o.',
      city: 'Kraków',
      startDate: '2018-01',
      endDate: '2021-02',
      description: t(
        '- Rozwijałem aplikację SaaS do zarządzania flotą (React, Redux, TypeScript) dla ponad 300 klientów B2B.\n- Zmigrowałem 120 tys. linii kodu z JavaScriptu do TypeScriptu bez przestojów produkcji.\n- Wdrożyłem dostępność zgodną z WCAG 2.1 AA, co otworzyło ofertę na 5 przetargów publicznych.',
        '- Developed a fleet-management SaaS application (React, Redux, TypeScript) for 300+ B2B clients.\n- Migrated 120k lines of code from JavaScript to TypeScript with zero production downtime.\n- Implemented WCAG 2.1 AA accessibility, qualifying the product for 5 public-sector tenders.',
      ),
    }),
    item('experience', {
      jobTitle: 'Junior Web Developer',
      employer: t('Agencja Interaktywna Źródło', 'Źródło Interactive Agency'),
      city: 'Wrocław',
      startDate: '2016-07',
      endDate: '2017-12',
      description: t(
        '- Tworzyłem responsywne strony i sklepy internetowe dla ponad 25 klientów.\n- Zautomatyzowałem proces budowania (webpack), skracając wdrożenie z 2 godzin do 15 minut.',
        '- Built responsive websites and online shops for 25+ clients.\n- Automated the build process (webpack), cutting deployment time from 2 hours to 15 minutes.',
      ),
    }),
  ])

  const education = list('education', [
    item('education', {
      degree: t('Magister inżynier', 'Master of Science in Engineering'),
      fieldOfStudy: t('Informatyka', 'Computer Science'),
      school: t('Politechnika Wrocławska', 'Wrocław University of Science and Technology'),
      city: 'Wrocław',
      startDate: '2014-10',
      endDate: '2016-06',
      description: t(
        'Praca dyplomowa: „Optymalizacja renderowania aplikacji jednostronicowych”.',
        'Thesis: “Rendering optimisation of single-page applications”.',
      ),
    }),
    item('education', {
      degree: t('Inżynier', 'Bachelor of Engineering'),
      fieldOfStudy: t('Informatyka', 'Computer Science'),
      school: t('Politechnika Wrocławska', 'Wrocław University of Science and Technology'),
      city: 'Wrocław',
      startDate: '2010-10',
      endDate: '2014-02',
    }),
  ])

  const skills = list(
    'skills',
    (
      [
        ['TypeScript', 5],
        ['React', 5],
        ['Next.js', 4],
        ['Node.js', 4],
        [t('HTML5 i CSS3', 'HTML5 & CSS3'), 5],
        [t('Testy (Jest, Playwright)', 'Testing (Jest, Playwright)'), 4],
        ['GraphQL', 3],
        ['CI/CD (GitLab, GitHub Actions)', 4],
        [t('Dostępność (WCAG 2.1)', 'Accessibility (WCAG 2.1)'), 4],
        ['Figma', 3],
      ] as const
    ).map(([name, level]) => item('skills', { name, level })),
  )

  const languages = list('languages', [
    item('languages', { name: t('polski', 'Polish'), level: 'native' }),
    item('languages', { name: t('angielski', 'English'), level: 'C1' }),
    item('languages', { name: t('niemiecki', 'German'), level: 'A2' }),
  ])

  const certifications = list('certifications', [
    item('certifications', {
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      date: '2023-04',
      url: 'https://aws.amazon.com/certification/',
    }),
    item('certifications', { name: 'Professional Scrum Master I (PSM I)', issuer: 'Scrum.org', date: '2020-11' }),
  ])

  const courses = list('courses', [
    item('courses', {
      name: t('Zaawansowane wzorce w React', 'Advanced React Patterns'),
      institution: 'Frontend Masters',
      startDate: '2022-02',
      endDate: '2022-03',
      description: t(
        '- 24 godziny zajęć: wzorce kompozycji, wydajność, React Server Components.',
        '- 24 hours of training: composition patterns, performance, React Server Components.',
      ),
    }),
    item('courses', {
      name: t('Przywództwo w zespołach technicznych', 'Leadership in Engineering Teams'),
      institution: t('Akademia Leona Koźmińskiego', 'Kozminski University'),
      startDate: '2021-09',
      endDate: '2021-12',
      description: t(
        '- Program 60 godzin: feedback, delegowanie zadań, rozwiązywanie konfliktów.',
        '- 60-hour programme: feedback, delegation, conflict resolution.',
      ),
    }),
  ])

  const projects = list('projects', [
    item('projects', {
      name: t('Źródełko – biblioteka komponentów open source', 'Źródełko – open-source component library'),
      role: t('Autor i maintainer', 'Author and maintainer'),
      url: 'https://github.com/lzurawski/zrodelko',
      startDate: '2019-05',
      current: true,
      description: t(
        '- Ponad 1 800 gwiazdek na GitHubie i 40 kontrybutorów.\n- Dostępne komponenty (ARIA) z pełnym wsparciem czytników ekranu.',
        '- 1,800+ GitHub stars and 40 contributors.\n- Accessible components (ARIA) with full screen-reader support.',
      ),
    }),
    item('projects', {
      name: t('Kalkulator śladu węglowego', 'Carbon Footprint Calculator'),
      role: t('Frontend developer (pro bono)', 'Frontend developer (pro bono)'),
      url: 'https://example.com/carbon',
      startDate: '2022-06',
      endDate: '2022-10',
      description: t(
        '- Aplikacja PWA, z której w pierwszym miesiącu skorzystało ponad 10 000 osób.',
        '- PWA used by more than 10,000 people in its first month.',
      ),
    }),
  ])

  const awards = list('awards', [
    item('awards', {
      name: t('Nagroda „Innowator Roku”', '“Innovator of the Year” Award'),
      issuer: company1,
      date: '2023-12',
      description: t(
        'Za wdrożenie design systemu, który przyspieszył rozwój 14 produktów.',
        'For delivering a design system that accelerated development of 14 products.',
      ),
    }),
  ])

  const volunteering = list('volunteering', [
    item('volunteering', {
      role: 'Mentor',
      organization: t('Fundacja „Dziewczyny w IT”', '“Girls in IT” Foundation'),
      city: 'Wrocław',
      startDate: '2020-01',
      current: true,
      description: t(
        '- Mentoruję 3–4 osoby rocznie, które zmieniają branżę na IT.\n- Prowadzę warsztaty z HTML, CSS i JavaScriptu dla ponad 50 uczestniczek.',
        '- Mentor 3–4 career changers entering IT every year.\n- Run HTML, CSS and JavaScript workshops for 50+ participants.',
      ),
    }),
  ])

  const publications = list('publications', [
    item('publications', {
      title: t(
        'Jak przyspieszyliśmy sklep o 45% – studium przypadku',
        'How We Made Our Shop 45% Faster – a Case Study',
      ),
      publisher: t('Magazyn „Programista”', '“Programista” Magazine'),
      date: '2023-06',
      url: 'https://example.com/performance-case-study',
      description: t(
        'Artykuł o optymalizacji Core Web Vitals w dużej aplikacji React.',
        'An article on optimising Core Web Vitals in a large React application.',
      ),
    }),
  ])

  const interests = list(
    'interests',
    [
      t('Wspinaczka skałkowa', 'Rock climbing'),
      t('Fotografia krajobrazowa', 'Landscape photography'),
      t('Gry planszowe', 'Board games'),
      t('Żeglarstwo', 'Sailing'),
    ].map((name) => item('interests', { name })),
  )

  const references: Section = {
    id: uid(),
    type: 'references',
    title: '',
    visible: true,
    onRequest: false,
    items: [
      item('references', {
        name: 'Małgorzata Wójcik',
        position: t('Dyrektor ds. technologii (CTO)', 'Chief Technology Officer (CTO)'),
        company: company1,
        email: 'malgorzata.wojcik@example.com',
        phone: '+48 602 345 678',
      }),
    ],
  }

  const custom = list(
    'custom',
    [
      item('custom', {
        title: t('Prelegent – „Design system bez bólu”', 'Speaker – “Painless Design Systems”'),
        subtitle: t('Konferencja frontend.wrocław', 'frontend.wrocław conference'),
        city: 'Wrocław',
        startDate: '2023-09',
        description: t('- Prelekcja dla ponad 400 uczestników.', '- Talk delivered to 400+ attendees.'),
      }),
      item('custom', {
        title: t('Prelegent – „TypeScript w dużej skali”', 'Speaker – “TypeScript at Scale”'),
        subtitle: 'Kraków JS Meetup',
        city: 'Kraków',
        startDate: '2021-05',
      }),
    ],
    t('Wystąpienia i konferencje', 'Talks & Conferences'),
  )

  base.sections = [
    summary,
    experience,
    education,
    skills,
    languages,
    certifications,
    courses,
    projects,
    awards,
    volunteering,
    publications,
    interests,
    references,
    custom,
  ]
  return base
}
