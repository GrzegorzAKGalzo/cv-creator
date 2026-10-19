import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import { createSampleResume } from '../../data/sample'

const subscribeHydration = (cb: () => void) => useResumeStore.persist.onFinishHydration(cb)
const getHydrated = () => useResumeStore.persist.hasHydrated()

/**
 * Waits for zustand-persist hydration, then guarantees there is an active
 * resume: a Polish sample on the very first run, an empty CV if the user later
 * ends up with none. Reads state inside the effect, so StrictMode's double run
 * cannot create two resumes.
 */
export function useBootstrap(): boolean {
  const hydrated = useSyncExternalStore(subscribeHydration, getHydrated)
  const count = useResumeStore((s) => s.resumes.length)
  const activeValid = useResumeStore((s) => s.resumes.some((r) => r.id === s.activeId))
  const firstRunDone = useRef(false)

  useEffect(() => {
    if (!hydrated) return
    const { resumes, activeId, importResume, createResume, setActive } = useResumeStore.getState()
    if (resumes.length === 0) {
      if (!firstRunDone.current) importResume(createSampleResume('pl'))
      else createResume('pl')
    } else if (!resumes.some((r) => r.id === activeId)) {
      setActive(resumes[0].id)
    }
    firstRunDone.current = true
  }, [hydrated, count, activeValid])

  return hydrated && activeValid
}
