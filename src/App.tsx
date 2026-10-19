import Editor from './components/editor/Editor'
import Preview from './components/preview/Preview'
import TopBar from './components/shell/TopBar'
import MobileTabs from './components/shell/MobileTabs'
import DownloadPdfButton from './components/shell/DownloadPdfButton'
import Drawer from './components/shell/Drawer'
import DesignPanel from './components/shell/DesignPanel'
import AtsPanel from './components/shell/AtsPanel'
import Toaster from './components/shell/Toaster'
import ConfirmDialog from './components/shell/ConfirmDialog'
import ProjectNotice from './components/shell/ProjectNotice'
import CoffeeWidget from './components/shell/CoffeeWidget'
import PrivacyNote from './components/shell/PrivacyNote'
import { LogoMark } from './components/shell/Logo'
import { useUiStore } from './components/shell/uiStore'
import { useBootstrap } from './components/shell/useBootstrap'
import { useModalOpen } from './components/shell/modal'

export default function App() {
  const ready = useBootstrap()
  const tab = useUiStore((s) => s.tab)
  const panel = useUiStore((s) => s.panel)
  const openPanel = useUiStore((s) => s.openPanel)
  const modalOpen = useModalOpen()

  if (!ready) {
    return (
      <div className="grid h-dvh place-items-center bg-white" aria-busy="true">
        <div className="animate-pulse motion-reduce:animate-none">
          <LogoMark size={40} />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Everything except drawers, dialogs and toasts; inert while a modal is open. */}
      <div inert={modalOpen} className="flex h-dvh flex-col overflow-hidden bg-white text-slate-900">
        <TopBar />
        <MobileTabs />

        <main className="flex min-h-0 flex-1">
          <section
            id="pane-editor"
            role="tabpanel"
            aria-label="Edycja CV"
            className={`min-w-0 overflow-y-auto overscroll-contain bg-white pb-36 lg:block lg:w-[48%] lg:max-w-[880px] lg:shrink-0 lg:border-r lg:border-slate-200 lg:pb-0 ${
              tab === 'edit' ? 'block w-full' : 'hidden'
            }`}
          >
            <Editor />
            <PrivacyNote />
          </section>
          <section
            id="pane-preview"
            role="tabpanel"
            aria-label="Podgląd CV"
            className={`desk min-w-0 flex-1 overflow-y-auto overscroll-contain pb-36 lg:block lg:pb-20 ${
              tab === 'preview' ? 'block' : 'hidden'
            }`}
          >
            <Preview />
          </section>
        </main>

        <DownloadPdfButton floating />
        <ProjectNotice />
        <CoffeeWidget />
      </div>

      <Drawer
        open={panel === 'design'}
        onClose={() => openPanel(null)}
        title="Wygląd"
        description="Szablon, kolor i ustawienia eksportu PDF."
      >
        <DesignPanel />
      </Drawer>
      <Drawer
        open={panel === 'ats'}
        onClose={() => openPanel(null)}
        title="Analiza ATS"
        description="Jak Twoje CV odczyta system rekrutacyjny."
      >
        <AtsPanel />
      </Drawer>

      <ConfirmDialog />
      <Toaster />
    </>
  )
}
