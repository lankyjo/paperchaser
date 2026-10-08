import { useState } from 'react'
import { importProject, replaceWorkspace } from '../../db/backupRepo'
import { parseBundle } from '../../project/backup'

// Restores a backup (or imports a project file) on a fresh install; nothing exists yet, so nothing is backed up first.
export function useWelcomeRestore(onRestored: () => void) {
  const [error, setError] = useState<string | null>(null)

  const restore = async (file: File) => {
    setError(null)
    try {
      const parsed = parseBundle(await file.text())
      if (!parsed.ok) return setError(parsed.reason)
      if (parsed.bundle.format === 'paperchaser-workspace') await replaceWorkspace(parsed.bundle)
      else await importProject(parsed.bundle, 'copy')
      onRestored()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return { restore, error }
}
