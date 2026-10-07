import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { useBackup } from './useBackup'

// Download a full backup, or import a project file or backup, deciding clashes explicitly.
export function BackupSection() {
  const { backup, importFile, pending, resolveProject, restoreWorkspace, cancel, message } = useBackup()
  return (
    <section aria-label="Backup and import" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <h2 className="font-medium">Backup and import</h2>
      <p className="text-sm text-muted-foreground">Your data lives only in this browser. Download a backup regularly and keep it somewhere safe.</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void backup()}>Download backup</Button>
        <label className="text-sm">
          <span className="mr-2">Import a project or backup file</span>
          <input type="file" accept="application/json,.json" aria-label="Import file" onChange={(e) => e.target.files?.[0] && void importFile(e.target.files[0])} />
        </label>
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}
      <Dialog open={pending !== null} onOpenChange={(open) => !open && cancel()}>
        <DialogContent>
          {pending?.kind === 'projectClash' && (
            <>
              <DialogHeader>
                <DialogTitle>This project is already here</DialogTitle>
                <DialogDescription>Replace your copy with the file, skip the import, or import it as a separate copy.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => void resolveProject('skip')}>Skip</Button>
                <Button variant="outline" onClick={() => void resolveProject('copy')}>Import as copy</Button>
                <Button variant="destructive" onClick={() => void resolveProject('replace')}>Replace</Button>
              </DialogFooter>
            </>
          )}
          {pending?.kind === 'workspace' && (
            <>
              <DialogHeader>
                <DialogTitle>Restore this backup?</DialogTitle>
                <DialogDescription>Everything stored here is replaced by the backup. A backup of your current data is downloaded first.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={cancel}>Cancel</Button>
                <Button variant="destructive" onClick={() => void restoreWorkspace()}>Restore backup</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
