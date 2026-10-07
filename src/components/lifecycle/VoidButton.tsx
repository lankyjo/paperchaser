import { useState } from 'react'
import { Button } from '../ui/button'
import { ConfirmDialog } from '../ui/confirm-dialog'

// Voids an unpaid sent invoice after a confirmation; the number stays used and the page is stamped VOID.
export function VoidButton({ onVoid }: { onVoid: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Void
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Void this invoice?"
        description="It stays in your records stamped VOID and its number is never reused. This cannot be undone."
        confirmLabel="Void invoice"
        onConfirm={onVoid}
      />
    </>
  )
}
