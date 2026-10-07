import { useState } from 'react'
import { exportWorkspace, importProject, replaceWorkspace, type ImportMode } from '../../db/backupRepo'
import { preferencesRepo, projectsRepo } from '../../db/repos'
import { downloadJson } from '../../lib/downloadFile'
import { parseBundle, type Bundle, type ProjectBundle, type WorkspaceBundle } from '../../project/backup'
import { todayIso } from '../../lib/todayIso'

const LAST_BACKUP_KEY = 'lastBackupAt'

type Pending = { kind: 'projectClash'; bundle: ProjectBundle } | { kind: 'workspace'; bundle: WorkspaceBundle } | null

// Workspace backup download and file import, holding the decision the user still has to make.
export function useBackup() {
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)

  const backup = async () => {
    downloadJson(`paperchaser-backup-${todayIso()}.json`, await exportWorkspace())
    await preferencesRepo.put(LAST_BACKUP_KEY, new Date().toISOString())
  }

  const route = async (bundle: Bundle) => {
    if (bundle.format === 'paperchaser-workspace') return setPending({ kind: 'workspace', bundle })
    if (await projectsRepo.get(bundle.project.id)) return setPending({ kind: 'projectClash', bundle })
    await importProject(bundle, 'copy')
    setMessage(`Imported "${bundle.project.title || 'Untitled project'}".`)
  }

  // Imports refuse unsafe files by throwing; the reason is shown instead of failing silently.
  const reportErrors = (action: () => Promise<void>) => action().catch((err: Error) => setMessage(err.message))

  const importFile = (file: File) =>
    reportErrors(async () => {
      const parsed = parseBundle(await file.text())
      if (!parsed.ok) return setMessage(parsed.reason)
      await route(parsed.bundle)
    })

  const resolveProject = (mode: ImportMode) =>
    reportErrors(async () => {
      if (pending?.kind !== 'projectClash') return
      setPending(null)
      await importProject(pending.bundle, mode)
      setMessage(mode === 'skip' ? 'Import skipped.' : 'Project imported.')
    })

  const restoreWorkspace = async () => {
    if (pending?.kind !== 'workspace') return
    await backup()
    await replaceWorkspace(pending.bundle)
    setPending(null)
    setMessage('Workspace restored. Your previous data was downloaded first.')
  }

  return { backup, importFile, pending, resolveProject, restoreWorkspace, cancel: () => setPending(null), message }
}
