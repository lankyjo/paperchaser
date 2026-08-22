import { useRef, useState, type KeyboardEvent } from 'react'
import type { DocumentModel } from '../../document/types'
import { documentsRepo } from '../../db/repos'

/**
 * Model-snapshot history + debounced auto-save (D-12..D-18).
 *
 * Zero useEffect — history is ref-held stacks + ref-held debounce timer;
 * keyboard shortcuts bind to the builder root's onKeyDown (no window listeners).
 *
 * Contract:
 * - past/future: useRef<DocumentModel[]>([]) — bounded 50 (D-14).
 * - saveState: useState<'saved' | 'saving' | 'failed'>('saved').
 * - commit(next): push current model to past, clear future, setModel, scheduleSave.
 * - scheduleSave: clearTimeout + setTimeout(800ms) → documentsRepo.put → setState.
 * - On failure: saveState='failed', model never discarded (D-17).
 * - retrySave: re-runs documentsRepo.put on current model.
 * - Keyboard shortcuts: Ctrl/Cmd+Z → undo; Ctrl/Cmd+Shift+Z / Ctrl+Y → redo.
 */

type SaveState = 'saved' | 'saving' | 'failed'

interface UseHistory {
  model: DocumentModel
  commit: (next: DocumentModel) => void
  undo: () => void
  redo: () => void
  saveState: SaveState
  retrySave: () => void
  /** Call from builder-root onKeyDown for Ctrl+Z / Ctrl+Shift+Z. */
  handleKeyDown: (e: KeyboardEvent) => void
}

export function useHistory(initial: DocumentModel): UseHistory {
  const past = useRef<DocumentModel[]>([])
  const future = useRef<DocumentModel[]>([])
  const [model, setModel] = useState<DocumentModel>(initial)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const modelRef = useRef<DocumentModel>(initial)
  const [saveState, setSaveState] = useState<SaveState>('saved')

  // Keep modelRef in sync so the debounced closure always sees the latest.
  modelRef.current = model

  const scheduleSave = (next: DocumentModel) => {
    clearTimeout(timer.current)
    setSaveState('saved') // reset from failed on new edit (D-17)
    timer.current = setTimeout(async () => {
      setSaveState('saving')
      try {
        await documentsRepo.put(next)
        setSaveState('saved')
      } catch {
        setSaveState('failed')
      }
    }, 800)
  }

  const commit = (next: DocumentModel) => {
    past.current = [...past.current.slice(-49), modelRef.current]
    future.current = []
    setModel(next)
    scheduleSave(next)
  }

  const undo = () => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(modelRef.current)
    setModel(prev)
    scheduleSave(prev)
  }

  const redo = () => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(modelRef.current)
    setModel(next)
    scheduleSave(next)
  }

  const retrySave = () => {
    scheduleSave(modelRef.current)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey
    if (!mod) return
    if (e.key === 'z' && e.shiftKey) {
      e.preventDefault()
      redo()
    } else if (e.key === 'z') {
      e.preventDefault()
      undo()
    } else if (e.key === 'y') {
      e.preventDefault()
      redo()
    }
  }

  return { model, commit, undo, redo, saveState, retrySave, handleKeyDown }
}
