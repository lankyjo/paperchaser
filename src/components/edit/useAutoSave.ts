import { useRef, useState } from 'react'
import { documentsRepo } from '../../db/repos'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'

export type SaveState = 'saved' | 'saving' | 'failed'

// Debounced document save that reports honest status and never drops a pending edit when the page goes away.
export function useAutoSave() {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const pendingSave = useRef<DocumentModel | null>(null)

  const flushSave = async () => {
    const next = pendingSave.current
    if (next === null) return
    clearTimeout(timer.current)
    pendingSave.current = null
    try {
      await documentsRepo.put(next)
      if (pendingSave.current === null) setSaveState('saved')
    } catch {
      setSaveState('failed')
    }
  }

  // Shows "Saving…" from the edit itself so the indicator never claims an unsaved change is saved.
  const scheduleSave = (next: DocumentModel) => {
    clearTimeout(timer.current)
    pendingSave.current = next
    setSaveState('saving')
    timer.current = setTimeout(() => void flushSave(), 800)
  }

  // Writes a pending edit immediately when the tab is hidden or closed instead of losing it.
  useMountEffect(() => {
    const onHide = () => void flushSave()
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onHide)
    }
  })

  return { saveState, scheduleSave }
}
