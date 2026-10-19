import type { ReactNode } from 'react'
import type {
  AnyItem,
  AwardItem,
  CertificationItem,
  CourseItem,
  CustomItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  PublicationItem,
  ReferenceItem,
  VolunteeringItem,
} from '../../types/resume'
import { DateRangeFields, DescriptionField, MonthField } from './fields'
import type { ItemSectionType } from './helpers'
import { TextField } from './ui'

interface FormProps<T> {
  item: T
  update: (patch: Partial<T>) => void
}

function Grid({ children }: { children: ReactNode }) {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-2">{children}</div>
    </div>
  )
}

const wide = '@md:col-span-2'

function Stack({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>
}

function ExperienceForm({ item, update }: FormProps<ExperienceItem>) {
  return (
    <Stack>
      <Grid>
        <TextField label="Stanowisko" placeholder="np. Frontend Developer" value={item.jobTitle} onChange={(jobTitle) => update({ jobTitle })} />
        <TextField label="Pracodawca" placeholder="np. Acme sp. z o.o." value={item.employer} onChange={(employer) => update({ employer })} />
        <TextField label="Miasto" value={item.city} onChange={(city) => update({ city })} className={wide} />
      </Grid>
      <DateRangeFields startDate={item.startDate} endDate={item.endDate} current={item.current} onChange={update} />
      <DescriptionField
        label="Obowiązki i osiągnięcia"
        placeholder={'- Wdrożyłem…\n- Zwiększyłem…'}
        value={item.description}
        onChange={(description) => update({ description })}
      />
    </Stack>
  )
}

function EducationForm({ item, update }: FormProps<EducationItem>) {
  return (
    <Stack>
      <Grid>
        <TextField label="Szkoła / uczelnia" value={item.school} onChange={(school) => update({ school })} className={wide} />
        <TextField label="Stopień / tytuł" placeholder="np. magister" value={item.degree} onChange={(degree) => update({ degree })} />
        <TextField label="Kierunek" placeholder="np. Informatyka" value={item.fieldOfStudy} onChange={(fieldOfStudy) => update({ fieldOfStudy })} />
        <TextField label="Miasto" value={item.city} onChange={(city) => update({ city })} className={wide} />
      </Grid>
      <DateRangeFields startDate={item.startDate} endDate={item.endDate} current={item.current} onChange={update} />
      <DescriptionField value={item.description} onChange={(description) => update({ description })} />
    </Stack>
  )
}

function CertificationForm({ item, update }: FormProps<CertificationItem>) {
  return (
    <Grid>
      <TextField label="Nazwa certyfikatu" value={item.name} onChange={(name) => update({ name })} className={wide} />
      <TextField label="Wystawca" placeholder="np. Microsoft" value={item.issuer} onChange={(issuer) => update({ issuer })} />
      <MonthField label="Data uzyskania" value={item.date} onChange={(date) => update({ date })} />
      <TextField label="Link" inputMode="url" placeholder="https://" value={item.url} onChange={(url) => update({ url })} className={wide} />
    </Grid>
  )
}

function CourseForm({ item, update }: FormProps<CourseItem>) {
  return (
    <Stack>
      <Grid>
        <TextField label="Nazwa kursu" value={item.name} onChange={(name) => update({ name })} />
        <TextField label="Organizator" value={item.institution} onChange={(institution) => update({ institution })} />
      </Grid>
      <DateRangeFields startDate={item.startDate} endDate={item.endDate} current={item.current} onChange={update} />
      <DescriptionField value={item.description} onChange={(description) => update({ description })} />
    </Stack>
  )
}

function ProjectForm({ item, update }: FormProps<ProjectItem>) {
  return (
    <Stack>
      <Grid>
        <TextField label="Nazwa projektu" value={item.name} onChange={(name) => update({ name })} />
        <TextField label="Twoja rola" placeholder="np. Lider zespołu" value={item.role} onChange={(role) => update({ role })} />
        <TextField label="Link" inputMode="url" placeholder="https://" value={item.url} onChange={(url) => update({ url })} className={wide} />
      </Grid>
      <DateRangeFields startDate={item.startDate} endDate={item.endDate} current={item.current} onChange={update} />
      <DescriptionField value={item.description} onChange={(description) => update({ description })} />
    </Stack>
  )
}

function AwardForm({ item, update }: FormProps<AwardItem>) {
  return (
    <Stack>
      <Grid>
        <TextField label="Nazwa nagrody" value={item.name} onChange={(name) => update({ name })} className={wide} />
        <TextField label="Przyznający" value={item.issuer} onChange={(issuer) => update({ issuer })} />
        <MonthField label="Data" value={item.date} onChange={(date) => update({ date })} />
      </Grid>
      <DescriptionField value={item.description} onChange={(description) => update({ description })} />
    </Stack>
  )
}

function VolunteeringForm({ item, update }: FormProps<VolunteeringItem>) {
  return (
    <Stack>
      <Grid>
        <TextField label="Funkcja" placeholder="np. Koordynator" value={item.role} onChange={(role) => update({ role })} />
        <TextField label="Organizacja" value={item.organization} onChange={(organization) => update({ organization })} />
        <TextField label="Miasto" value={item.city} onChange={(city) => update({ city })} className={wide} />
      </Grid>
      <DateRangeFields startDate={item.startDate} endDate={item.endDate} current={item.current} onChange={update} />
      <DescriptionField value={item.description} onChange={(description) => update({ description })} />
    </Stack>
  )
}

function PublicationForm({ item, update }: FormProps<PublicationItem>) {
  return (
    <Stack>
      <Grid>
        <TextField label="Tytuł" value={item.title} onChange={(title) => update({ title })} className={wide} />
        <TextField label="Wydawca / czasopismo" value={item.publisher} onChange={(publisher) => update({ publisher })} />
        <MonthField label="Data publikacji" value={item.date} onChange={(date) => update({ date })} />
        <TextField label="Link" inputMode="url" placeholder="https://" value={item.url} onChange={(url) => update({ url })} className={wide} />
      </Grid>
      <DescriptionField value={item.description} onChange={(description) => update({ description })} />
    </Stack>
  )
}

function ReferenceForm({ item, update }: FormProps<ReferenceItem>) {
  return (
    <Grid>
      <TextField label="Imię i nazwisko" value={item.name} onChange={(name) => update({ name })} className={wide} />
      <TextField label="Stanowisko" value={item.position} onChange={(position) => update({ position })} />
      <TextField label="Firma" value={item.company} onChange={(company) => update({ company })} />
      <TextField label="E-mail" type="email" value={item.email} onChange={(email) => update({ email })} />
      <TextField label="Telefon" type="tel" value={item.phone} onChange={(phone) => update({ phone })} />
    </Grid>
  )
}

function CustomForm({ item, update }: FormProps<CustomItem>) {
  return (
    <Stack>
      <Grid>
        <TextField label="Tytuł" value={item.title} onChange={(title) => update({ title })} />
        <TextField label="Podtytuł" value={item.subtitle} onChange={(subtitle) => update({ subtitle })} />
        <TextField label="Miasto" value={item.city} onChange={(city) => update({ city })} className={wide} />
      </Grid>
      <DateRangeFields startDate={item.startDate} endDate={item.endDate} current={item.current} onChange={update} />
      <DescriptionField value={item.description} onChange={(description) => update({ description })} />
    </Stack>
  )
}

/** Full form for one item of a card-style section. */
export function ItemForm({
  type,
  item,
  update,
}: {
  type: ItemSectionType
  item: AnyItem
  update: (patch: Partial<AnyItem>) => void
}) {
  switch (type) {
    case 'experience':
      return <ExperienceForm item={item as ExperienceItem} update={update} />
    case 'education':
      return <EducationForm item={item as EducationItem} update={update} />
    case 'certifications':
      return <CertificationForm item={item as CertificationItem} update={update} />
    case 'courses':
      return <CourseForm item={item as CourseItem} update={update} />
    case 'projects':
      return <ProjectForm item={item as ProjectItem} update={update} />
    case 'awards':
      return <AwardForm item={item as AwardItem} update={update} />
    case 'volunteering':
      return <VolunteeringForm item={item as VolunteeringItem} update={update} />
    case 'publications':
      return <PublicationForm item={item as PublicationItem} update={update} />
    case 'references':
      return <ReferenceForm item={item as ReferenceItem} update={update} />
    case 'custom':
      return <CustomForm item={item as CustomItem} update={update} />
    default:
      // skills, languages and interests are edited as compact rows (CompactRow.tsx)
      return null
  }
}
