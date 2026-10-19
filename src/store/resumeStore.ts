import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
  AnyItem,
  CvLanguage,
  PersonalInfo,
  Resume,
  ResumeSettings,
  Section,
  SectionType,
} from '../types/resume'
import { cloneResume, createEmptyItem, createEmptyResume, createSection, REPEATABLE_SECTIONS, uid } from '../lib/factory'

/** Fields of a section (other than items) that may be patched. */
export type SectionPatch = Partial<{
  title: string
  visible: boolean
  content: string
  onRequest: boolean
}>

export interface ResumeState {
  resumes: Resume[]
  activeId: string | null

  // ---- resume management ----
  createResume: (language?: CvLanguage, name?: string) => string
  /** Copies a resume (new ids). Optionally switches the copy's export language. */
  duplicateResume: (id: string, language?: CvLanguage) => string
  deleteResume: (id: string) => void
  setActive: (id: string) => void
  renameResume: (id: string, name: string) => void
  /** Adds an already-validated resume (gets fresh ids) and makes it active. */
  importResume: (resume: Resume) => string
  /** Replaces the active resume's content, keeping its id and name. */
  replaceActiveContent: (resume: Resume) => void

  // ---- active resume editing ----
  setLanguage: (language: CvLanguage) => void
  updatePersonal: (patch: Partial<PersonalInfo>) => void
  addLink: () => string
  updateLink: (linkId: string, patch: Partial<{ label: string; url: string }>) => void
  removeLink: (linkId: string) => void
  updateSettings: (patch: Partial<ResumeSettings>) => void

  /** Adds a section (no-op returning existing id for non-repeatable types already present). */
  addSection: (type: SectionType) => string
  removeSection: (sectionId: string) => void
  /** Reorders sections to match the given id order (ids not listed keep relative order at the end). */
  reorderSections: (orderedIds: string[]) => void
  moveSection: (sectionId: string, direction: -1 | 1) => void
  updateSection: (sectionId: string, patch: SectionPatch) => void

  addItem: (sectionId: string) => string
  updateItem: (sectionId: string, itemId: string, patch: Partial<AnyItem>) => void
  removeItem: (sectionId: string, itemId: string) => void
  reorderItems: (sectionId: string, orderedIds: string[]) => void
  moveItem: (sectionId: string, itemId: string, direction: -1 | 1) => void
}

function reorderByIds<T extends { id: string }>(list: T[], orderedIds: string[]): T[] {
  const byId = new Map(list.map((x) => [x.id, x]))
  const ordered = orderedIds.map((id) => byId.get(id)).filter((x): x is T => !!x)
  const rest = list.filter((x) => !orderedIds.includes(x.id))
  return [...ordered, ...rest]
}

function moveInList<T extends { id: string }>(list: T[], id: string, direction: -1 | 1): void {
  const i = list.findIndex((x) => x.id === id)
  const j = i + direction
  if (i < 0 || j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j], list[i]]
}

export const useResumeStore = create<ResumeState>()(
  persist(
    immer((set, get) => {
      /** Runs a mutation against the active resume and bumps updatedAt. */
      const edit = (fn: (r: Resume) => void) =>
        set((state) => {
          const r = state.resumes.find((x) => x.id === state.activeId)
          if (!r) return
          fn(r)
          r.updatedAt = new Date().toISOString()
        })

      const findSection = (r: Resume, sectionId: string): Section | undefined =>
        r.sections.find((s) => s.id === sectionId)

      return {
        resumes: [],
        activeId: null,

        createResume: (language = 'pl', name) => {
          const r = createEmptyResume(language, name)
          set((state) => {
            state.resumes.push(r)
            state.activeId = r.id
          })
          return r.id
        },

        duplicateResume: (id, language) => {
          const src = get().resumes.find((r) => r.id === id)
          if (!src) return ''
          const lang = language ?? src.language
          const suffix = lang === src.language ? (lang === 'pl' ? ' (kopia)' : ' (copy)') : ` – ${lang.toUpperCase()}`
          const copy = cloneResume(src, { name: src.name + suffix, language: lang })
          if (lang !== src.language) copy.settings.showGdpr = lang === 'pl' ? true : copy.settings.showGdpr
          set((state) => {
            state.resumes.push(copy)
            state.activeId = copy.id
          })
          return copy.id
        },

        deleteResume: (id) =>
          set((state) => {
            state.resumes = state.resumes.filter((r) => r.id !== id)
            if (state.activeId === id) state.activeId = state.resumes[0]?.id ?? null
          }),

        setActive: (id) =>
          set((state) => {
            if (state.resumes.some((r) => r.id === id)) state.activeId = id
          }),

        renameResume: (id, name) =>
          set((state) => {
            const r = state.resumes.find((x) => x.id === id)
            if (r) r.name = name
          }),

        importResume: (resume) => {
          const copy = cloneResume(resume)
          set((state) => {
            state.resumes.push(copy)
            state.activeId = copy.id
          })
          return copy.id
        },

        replaceActiveContent: (resume) =>
          edit((r) => {
            const fresh = cloneResume(resume)
            r.language = fresh.language
            r.personal = fresh.personal
            r.sections = fresh.sections
            r.settings = fresh.settings
          }),

        setLanguage: (language) => edit((r) => void (r.language = language)),

        updatePersonal: (patch) => edit((r) => void Object.assign(r.personal, patch)),

        addLink: () => {
          const id = uid()
          edit((r) => void r.personal.links.push({ id, label: '', url: '' }))
          return id
        },

        updateLink: (linkId, patch) =>
          edit((r) => {
            const l = r.personal.links.find((x) => x.id === linkId)
            if (l) Object.assign(l, patch)
          }),

        removeLink: (linkId) => edit((r) => void (r.personal.links = r.personal.links.filter((l) => l.id !== linkId))),

        updateSettings: (patch) => edit((r) => void Object.assign(r.settings, patch)),

        addSection: (type) => {
          const active = get().resumes.find((r) => r.id === get().activeId)
          if (!active) return ''
          const existing = active.sections.find((s) => s.type === type)
          if (existing && !REPEATABLE_SECTIONS.includes(type)) return existing.id
          const section = createSection(type)
          edit((r) => void r.sections.push(section))
          return section.id
        },

        removeSection: (sectionId) => edit((r) => void (r.sections = r.sections.filter((s) => s.id !== sectionId))),

        reorderSections: (orderedIds) => edit((r) => void (r.sections = reorderByIds(r.sections, orderedIds))),

        moveSection: (sectionId, direction) => edit((r) => moveInList(r.sections, sectionId, direction)),

        updateSection: (sectionId, patch) =>
          edit((r) => {
            const s = findSection(r, sectionId)
            if (!s) return
            if (patch.title !== undefined) s.title = patch.title
            if (patch.visible !== undefined) s.visible = patch.visible
            if (patch.content !== undefined && s.type === 'summary') s.content = patch.content
            if (patch.onRequest !== undefined && s.type === 'references') s.onRequest = patch.onRequest
          }),

        addItem: (sectionId) => {
          const active = get().resumes.find((r) => r.id === get().activeId)
          const s = active && findSection(active, sectionId)
          if (!s || s.type === 'summary') return ''
          const item = createEmptyItem(s.type)
          edit((r) => {
            const sec = findSection(r, sectionId)
            if (sec && 'items' in sec) (sec.items as AnyItem[]).push(item)
          })
          return item.id
        },

        updateItem: (sectionId, itemId, patch) =>
          edit((r) => {
            const s = findSection(r, sectionId)
            if (!s || !('items' in s)) return
            const item = (s.items as AnyItem[]).find((i) => i.id === itemId)
            if (item) Object.assign(item, patch, { id: item.id })
          }),

        removeItem: (sectionId, itemId) =>
          edit((r) => {
            const s = findSection(r, sectionId)
            if (s && 'items' in s) (s as { items: AnyItem[] }).items = (s.items as AnyItem[]).filter((i) => i.id !== itemId)
          }),

        reorderItems: (sectionId, orderedIds) =>
          edit((r) => {
            const s = findSection(r, sectionId)
            if (s && 'items' in s) (s as { items: AnyItem[] }).items = reorderByIds(s.items as AnyItem[], orderedIds)
          }),

        moveItem: (sectionId, itemId, direction) =>
          edit((r) => {
            const s = findSection(r, sectionId)
            if (s && 'items' in s) moveInList(s.items as AnyItem[], itemId, direction)
          }),
      }
    }),
    {
      name: 'cv-kreator',
      version: 2,
      partialize: (state) => ({ resumes: state.resumes, activeId: state.activeId }),
      migrate: (persisted, version) => {
        const state = persisted as Pick<ResumeState, 'resumes' | 'activeId'>
        if (version < 2) {
          // v2: numeric dates ("02/2024") became the default and `spacing` was added.
          for (const r of state.resumes ?? []) {
            r.settings = { ...r.settings, dateFormat: 'numeric', spacing: r.settings.spacing ?? 'normal' }
          }
        }
        return state as ResumeState
      },
    },
  ),
)

/** The currently active resume, or undefined if none exists. */
export const useActiveResume = (): Resume | undefined =>
  useResumeStore((s) => s.resumes.find((r) => r.id === s.activeId))
