import { useRef, useState, type KeyboardEvent } from 'react'
import type { DocumentModel } from '../../document/types'
import { useAutoSave } from './useAutoSave'

// Undo/redo history of model snapshots with debounced auto-save.

interface UseHistory {
  model: DocumentModel
  commit: (next: DocumentModel) => void
  undo: () => void
  redo: () => void
  saveState: ReturnType<typeof useAutoSave>['saveState']
  retrySave: () => void
  replace: (next: DocumentModel) => void
  getRev: () => number
  canUndo: boolean
  canRedo: boolean
  // Bind to the builder root's onKeyDown for Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl+Y.
  handleKeyDown: (e: KeyboardEvent) => void
}

export function useHistory(initial: DocumentModel): UseHistory {
  const past = useRef<DocumentModel[]>([])
  const future = useRef<DocumentModel[]>([])
  const [model, setModel] = useState<DocumentModel>(initial)
  const modelRef = useRef<DocumentModel>(initial)
  const [stackSizes, setStackSizes] = useState({ past: 0, future: 0 })
  const syncStackSizes = () => setStackSizes({ past: past.current.length, future: future.current.length })
  const replaceState = (next: DocumentModel) => {
    past.current = []
    future.current = []
    setModel(next)
    syncStackSizes()
  }
  const { saveState, scheduleSave, getRev, setRev } = useAutoSave(initial, replaceState)

  // Keep modelRef in sync so the debounced closure always sees the latest.
  // eslint-disable-next-line react-hooks/refs -- sync ref during render without effect (house rule: no useEffect)
  modelRef.current = model

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

  // Swaps in a document changed outside editing (finalize, unsend); clears undo so lifecycle steps can't be undone.
  const replace = (next: DocumentModel) => {
    if (next.rev !== undefined) setRev(next.rev)
    replaceState(next)
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

  return { model, commit, undo, redo, saveState, retrySave, replace, getRev, canUndo, canRedo, handleKeyDown }
}
