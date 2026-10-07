import { useRef, useState, type KeyboardEvent } from 'react'
import type { DocumentModel } from '../../document/types'
import { documentsRepo } from '../../db/repos'

// Undo/redo history of model snapshots with debounced auto-save.

type SaveState = 'saved' | 'saving' | 'failed'

interface UseHistory {
  model: DocumentModel
  commit: (next: DocumentModel) => void
  undo: () => void
  redo: () => void
  saveState: SaveState
  retrySave: () => void
  canUndo: boolean
  canRedo: boolean
  // Bind to the builder root's onKeyDown for Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl+Y.
  handleKeyDown: (e: KeyboardEvent) => void
}

export function useHistory(initial: DocumentModel): UseHistory {
  const past = useRef<DocumentModel[]>([])
  const future = useRef<DocumentModel[]>([])
  const [model, setModel] = useState<DocumentModel>(initial)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const modelRef = useRef<DocumentModel>(initial)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [stackSizes, setStackSizes] = useState({ past: 0, future: 0 })

  // Keep modelRef in sync so the debounced closure always sees the latest.
  // eslint-disable-next-line react-hooks/refs -- sync ref during render without effect (house rule: no useEffect)
  modelRef.current = model

  const syncStackSizes = () => setStackSizes({ past: past.current.length, future: future.current.length })

  const scheduleSave = (next: DocumentModel) => {
    clearTimeout(timer.current)
    setSaveState('saved') // a new edit clears a previous failure; the model is never discarded
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
    syncStackSizes()
    scheduleSave(next)
  }

  const undo = () => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(modelRef.current)
    setModel(prev)
    syncStackSizes()
    scheduleSave(prev)
  }

  const redo = () => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(modelRef.current)
    setModel(next)
    syncStackSizes()
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

  const canUndo = stackSizes.past > 0
  const canRedo = stackSizes.future > 0

  return { model, commit, undo, redo, saveState, retrySave, canUndo, canRedo, handleKeyDown }
}
