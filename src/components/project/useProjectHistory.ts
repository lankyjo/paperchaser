import { useRef, useState } from 'react'
import type { Project } from '../../project/project'

// Undo and redo for project data, separate from any document's own history.
export function useProjectHistory(write: (project: Project) => Promise<void>) {
  const past = useRef<Project[]>([])
  const future = useRef<Project[]>([])
  const [sizes, setSizes] = useState({ past: 0, future: 0 })
  // Counts undo and redo steps so forms holding typed values can remount with the restored project.
  const [steps, setSteps] = useState(0)
  const sync = () => setSizes({ past: past.current.length, future: future.current.length })

  const save = async (previous: Project, next: Project) => {
    past.current = [...past.current.slice(-49), previous]
    future.current = []
    sync()
    await write(next)
  }
  const step = async (current: Project, from: { current: Project[] }, to: { current: Project[] }) => {
    const target = from.current.pop()
    if (!target) return
    to.current.push(current)
    sync()
    await write(target)
    setSteps((n) => n + 1)
  }
  return {
    save,
    undo: (current: Project) => step(current, past, future),
    redo: (current: Project) => step(current, future, past),
    canUndo: sizes.past > 0,
    canRedo: sizes.future > 0,
    steps,
  }
}
