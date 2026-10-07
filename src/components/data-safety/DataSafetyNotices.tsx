import { isBackupDue } from '../../lib/dataSafety'
import { useBackup } from '../settings/useBackup'
import { Button } from '../ui/button'
import { useDataSafety } from './useDataSafety'

// Warnings that protect local data: add to Home Screen on Safari, private window, overdue backup.
export function DataSafetyNotices() {
  const { safety, dismissInstall } = useDataSafety()
  const { backup, lastBackupAt } = useBackup()
  if (safety === null || lastBackupAt === undefined) return null
  const backupDue = isBackupDue(lastBackupAt ?? undefined, new Date(), safety.hasData)

  return (
    <div className="flex flex-col gap-3">
      {safety.suggestInstall && (
        <section aria-label="Keep your data" className="rounded-lg border bg-card p-4 text-sm">
          <h2 className="font-medium">Add Paperchaser to your Home Screen</h2>
          <p className="mt-1 text-muted-foreground">
            Safari deletes website data after 7 days without a visit. Installed apps keep it. Tap Share, then Add to Home Screen (on a Mac: File, then Add to Dock).
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={dismissInstall}>
            Got it
          </Button>
        </section>
      )}
      {safety.privateMode && (
        <p role="alert" className="rounded-lg border border-destructive/40 px-4 py-3 text-sm text-destructive">
          This looks like a private window. Everything you create here is deleted when the window closes.
        </p>
      )}
      {backupDue && (
        <section aria-label="Backup reminder" className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm">
          <span>{lastBackupAt === null ? 'You have not downloaded a backup yet.' : `Your last backup is from ${new Date(lastBackupAt).toLocaleDateString()}.`} Your data lives only in this browser.</span>
          <Button size="sm" onClick={() => void backup()}>
            Download backup
          </Button>
        </section>
      )}
    </div>
  )
}
