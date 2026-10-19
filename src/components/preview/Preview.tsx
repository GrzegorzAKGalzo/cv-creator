import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useActiveResume } from '../../store/resumeStore'
import type { PDFDocumentLoadingTask, RenderTask } from './pdfjs'
import { errorMessage, usePdfDocument, type LoadedPdf } from './usePdfDocument'

/** CSS pixels per PDF point at 100% zoom. */
const PT_TO_PX = 96 / 72
const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2]
const A4_WIDTH_PT = 595.28
const SIDE_PADDING = 24
/** Hard cap on the canvas backing-store width (memory). */
const MAX_CANVAS_PX = 4096

type Zoom = 'fit' | number

interface RenderedPage {
  canvas: HTMLCanvasElement
  /** Page size in PDF points. */
  width: number
  height: number
}

/** Mounts an already-rendered (offscreen) canvas – lets us swap pages without flicker. */
function PageCanvas({ page, scale, index }: { page: RenderedPage; scale: number; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (el) el.replaceChildren(page.canvas)
  }, [page])
  return (
    <div
      ref={ref}
      data-page={index + 1}
      className="mx-auto overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.10)] ring-1 ring-black/5"
      style={{ width: Math.round(page.width * scale), height: Math.round(page.height * scale) }}
    />
  )
}

function Spinner() {
  return <span className="inline-block size-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" aria-hidden />
}

function ToolbarButton(props: { onClick: () => void; disabled?: boolean; title: string; active?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title}
      aria-label={props.title}
      aria-pressed={props.active}
      className={`flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        props.active ? 'bg-gray-800 text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {props.children}
    </button>
  )
}

/** Right panel: live preview of the exported PDF, rendered with pdf.js. */
export default function Preview() {
  const resume = useActiveResume()
  const { loaded, generating, error } = usePdfDocument(resume)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [dpr, setDpr] = useState(() => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1))
  const [zoom, setZoom] = useState<Zoom>('fit')
  const [pages, setPages] = useState<RenderedPage[]>([])
  const [rendering, setRendering] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Track available width and device pixel ratio (browser zoom / moving between screens).
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      setContainerWidth(el.clientWidth)
      setDpr(window.devicePixelRatio || 1)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pageWidthPt = loaded?.sizes[0]?.width ?? pages[0]?.width ?? A4_WIDTH_PT
  const fitScale = Math.max(0.2, (containerWidth - SIDE_PADDING * 2) / pageWidthPt)
  const scale = zoom === 'fit' ? fitScale : zoom * PT_TO_PX
  const zoomPercent = Math.round((scale / PT_TO_PX) * 100)

  // Debounce the backing-store resolution so zooming/resizing stays smooth:
  // CSS scales the existing bitmap immediately, crisp pixels follow shortly.
  const [renderScale, setRenderScale] = useState(scale)
  useEffect(() => {
    const t = setTimeout(() => setRenderScale(scale), 150)
    return () => clearTimeout(t)
  }, [scale])

  // Render all pages of the current document into offscreen canvases, then swap them in at once.
  const displayedTask = useRef<PDFDocumentLoadingTask | null>(null)
  const renderedFor = useRef<{ loaded: LoadedPdf; scale: number; dpr: number } | null>(null)
  useEffect(() => {
    // A new document renders at the live scale right away; zoom changes wait for the debounce.
    const isNewDoc = renderedFor.current?.loaded !== loaded
    const cssScale = isNewDoc ? scale : renderScale
    const prev = renderedFor.current
    const upToDate = !isNewDoc && !!prev && Math.abs(prev.scale - cssScale) < 1e-3 && prev.dpr === dpr
    if (!loaded || containerWidth === 0 || upToDate) {
      setRendering(false)
      return
    }

    let cancelled = false
    const tasks: RenderTask[] = []
    setRendering(true)
    ;(async () => {
      try {
        const out: RenderedPage[] = []
        for (let i = 0; i < loaded.doc.numPages; i++) {
          const page = await loaded.doc.getPage(i + 1)
          if (cancelled) return
          const base = page.getViewport({ scale: 1 })
          const pixelScale = Math.min(cssScale * dpr, MAX_CANVAS_PX / base.width)
          const viewport = page.getViewport({ scale: pixelScale })
          const canvas = document.createElement('canvas')
          canvas.className = 'block h-full w-full'
          canvas.setAttribute('role', 'img')
          canvas.setAttribute('aria-label', `Strona ${i + 1}`)
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          const task = page.render({ canvas, viewport })
          tasks.push(task)
          await task.promise
          if (cancelled) return
          out.push({ canvas, width: base.width, height: base.height })
        }
        renderedFor.current = { loaded, scale: cssScale, dpr }
        setPages(out)
        setRenderError(null)
        // The previous document is no longer on screen – free its worker resources.
        if (displayedTask.current && displayedTask.current !== loaded.task) void displayedTask.current.destroy()
        displayedTask.current = loaded.task
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === 'RenderingCancelledException')) return
        console.error('[preview] page rendering failed', err)
        setRenderError(errorMessage(err))
      } finally {
        if (!cancelled) setRendering(false)
      }
    })()

    return () => {
      cancelled = true
      tasks.forEach((t) => t.cancel())
    }
    // `scale` is intentionally omitted: zoom changes go through the debounced renderScale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, renderScale, dpr, containerWidth === 0])

  // A superseded document that never made it to the screen must be freed too.
  const lastLoaded = useRef<LoadedPdf | null>(null)
  useEffect(() => {
    const prev = lastLoaded.current
    if (prev && prev !== loaded && prev.task !== displayedTask.current) void prev.task.destroy()
    lastLoaded.current = loaded
  }, [loaded])
  useEffect(
    () => () => {
      void displayedTask.current?.destroy()
      void lastLoaded.current?.task.destroy()
    },
    [],
  )

  // Current page indicator.
  const updateCurrentPage = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const probe = el.scrollTop + el.clientHeight * 0.35
    let current = 1
    el.querySelectorAll<HTMLElement>('[data-page]').forEach((node) => {
      if (node.offsetTop <= probe) current = Number(node.dataset.page)
    })
    setCurrentPage(current)
  }, [])
  useEffect(updateCurrentPage, [pages, scale, updateCurrentPage])

  const stepZoom = (direction: 1 | -1) => {
    const now = scale / PT_TO_PX
    const next =
      direction > 0 ? ZOOM_STEPS.find((z) => z > now + 0.005) : [...ZOOM_STEPS].reverse().find((z) => z < now - 0.005)
    if (next) setZoom(next)
  }

  const busy = generating || rendering
  const shownError = error ?? renderError
  const totalPages = pages.length

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white/90 px-3 py-1.5 text-sm backdrop-blur">
        <div className="flex items-center gap-0.5">
          <ToolbarButton onClick={() => stepZoom(-1)} disabled={scale / PT_TO_PX <= ZOOM_STEPS[0] + 0.005} title="Pomniejsz">
            −
          </ToolbarButton>
          <span className="w-12 text-center tabular-nums text-gray-600" aria-live="polite">
            {zoomPercent}%
          </span>
          <ToolbarButton
            onClick={() => stepZoom(1)}
            disabled={scale / PT_TO_PX >= ZOOM_STEPS[ZOOM_STEPS.length - 1] - 0.005}
            title="Powiększ"
          >
            +
          </ToolbarButton>
          <ToolbarButton onClick={() => setZoom('fit')} active={zoom === 'fit'} title="Dopasuj do szerokości">
            <span className="px-1 text-xs">Dopasuj</span>
          </ToolbarButton>
        </div>
        <div className="ml-auto flex items-center gap-3 text-gray-500">
          {busy ? (
            <span className="flex items-center gap-1.5 text-xs" role="status">
              <Spinner />
              Generowanie…
            </span>
          ) : null}
          {totalPages > 0 ? (
            <span className="tabular-nums text-xs">
              Strona {Math.min(currentPage, totalPages)} z {totalPages}
            </span>
          ) : null}
        </div>
      </div>

      {shownError ? (
        <div role="alert" className="mx-3 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <strong className="font-semibold">Nie udało się wygenerować podglądu.</strong>{' '}
          {pages.length > 0 ? 'Widoczna jest ostatnia poprawna wersja. ' : ''}
          <span className="text-red-700/80">Szczegóły: {shownError}</span>
        </div>
      ) : null}

      <div ref={scrollRef} onScroll={updateCurrentPage} className="relative min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
        {!resume ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-gray-500">
            Brak aktywnego CV – utwórz lub wybierz CV, aby zobaczyć podgląd.
          </div>
        ) : pages.length > 0 ? (
          <div className="flex w-max min-w-full flex-col gap-6 py-6" style={{ paddingInline: SIDE_PADDING }}>
            {pages.map((page, i) => (
              <PageCanvas key={i} page={page} scale={scale} index={i} />
            ))}
          </div>
        ) : !shownError ? (
          <div className="py-6" style={{ paddingInline: SIDE_PADDING }}>
            <div
              className="mx-auto flex items-center justify-center bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.10)]"
              style={{ width: A4_WIDTH_PT * scale, height: 841.89 * scale }}
            >
              <span className="flex animate-pulse items-center gap-2 text-sm text-gray-400">
                <Spinner />
                Generowanie podglądu…
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
