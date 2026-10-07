import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'

interface FinalizeDialogProps {
  open: boolean
  warnings: string[]
  numbered: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

// Confirms finalizing: lists anything still missing, but lets the user go ahead.
export function FinalizeDialog({ open, warnings, numbered, onOpenChange, onConfirm }: FinalizeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalize and print</DialogTitle>
          <DialogDescription>
            {numbered ? 'This assigns the next number, ' : 'This '}marks the document as sent and locks it. You can return it to draft later if nothing has been paid.
          </DialogDescription>
        </DialogHeader>
        {warnings.length > 0 ? (
          <ul aria-label="Before you send" className="ml-5 list-disc text-sm text-destructive">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Everything looks complete.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep editing
          </Button>
          <Button onClick={onConfirm}>{warnings.length > 0 ? 'Finalize anyway' : 'Finalize and print'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
