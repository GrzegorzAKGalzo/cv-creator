import { create } from 'zustand'

export type MobileTab = 'edit' | 'preview'
export type PanelId = 'design' | 'ats' | null

interface UiState {
  /** Active pane below the lg breakpoint. */
  tab: MobileTab
  panel: PanelId
  /** Job ad pasted into the ATS panel (kept for the session only). */
  jobAd: string
  setTab: (tab: MobileTab) => void
  openPanel: (panel: PanelId) => void
  setJobAd: (text: string) => void
}

export const useUiStore = create<UiState>()((set) => ({
  tab: 'edit',
  panel: null,
  jobAd: '',
  setTab: (tab) => set({ tab }),
  openPanel: (panel) => set({ panel }),
  setJobAd: (jobAd) => set({ jobAd }),
}))
