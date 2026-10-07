import { useRef, useState } from 'react'
import { listenForSaves } from '../../db/documentChannel'
import { documentsRepo, StaleWriteError } from '../../db/repos'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'

export type SaveState = 'saved' | 'saving' | 'failed' | 'stale'

// Debounced, revision-checked save: honest status, no lost edits on page hide, live updates from other tabs when idle.
export function useAutoSave(initial: DocumentModel, onExternalUpdate: (doc: DocumentModel) => void) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const pendingSave = useRef<DocumentModel | null>(null)
  const rev = useRef(initial.rev ?? 0)

  const flushSave = async () => {
    const next = pendingSave.current
    if (next === null) return
    clearTimeout(timer.current)
    pendingSave.current = null
    try {
      rev.current = (await documentsRepo.save(next, rev.current)).rev ?? rev.current
      if (pendingSave.current === null) setSaveState('saved')
    } catch (err) {
      setSaveState(err instanceof StaleWriteError ? 'stale' : 'failed')
    }
  }

  // Shows "Saving…" from the edit itself so the indicator never claims an unsaved change is saved.
  const scheduleSave = (next: DocumentModel) => {
    clearTimeout(timer.current)
    pendingSave.current = next
    setSaveState('saving')
    timer.current = setTimeout(() => void flushSave(), 800)
  }

  useMountEffect(() => {
    const onHide = () => void flushSave()
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onHide)
    // Another tab saved this document: follow it when idle, otherwise this tab's edits are stale.
    const stopListening = listenForSaves(({ id, rev: savedRev }) => {
      if (id !== initial.id || savedRev <= rev.current) return
      if (pendingSave.current !== null) return void setSaveState('stale')
      void documentsRepo.get(id).then((doc) => {
        if (doc === undefined) return
        rev.current = doc.rev ?? savedRev
        onExternalUpdate(doc)
      })
    })
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onHide)
      stopListening()
    }
  })

  return { saveState, scheduleSave, getRev: () => rev.current, setRev: (next: number) => (rev.current = next) }
}
