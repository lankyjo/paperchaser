import type { Branding, DocumentModel, PageSize, TemplateId } from '../document/types'
import { PreviewErrorBoundary } from './print-preview/PreviewErrorBoundary'
import { PagedDocument } from './paged-document/PagedDocument'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

// Print preview showing the same pages that print.
export function PrintPreviewDialog({
  open,
  onOpenChange,
  model,
  template,
  branding,
  pageSize,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: DocumentModel
  template?: TemplateId
  branding?: Partial<Branding>
  pageSize: PageSize
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The dialog portals outside .app-shell, so print:hidden keeps its document copies out of print. */}
      <DialogContent className="max-w-[calc(100vw-4rem)] print:hidden">
        <DialogHeader>
          <DialogTitle>Print preview</DialogTitle>
          <DialogDescription>Pagination and styling match the exported PDF.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto rounded-lg bg-muted/50 p-4">
          <PreviewErrorBoundary>
            <div className="relative flex flex-col items-center gap-6">
              <PagedDocument model={model} template={template} branding={branding} pageSize={pageSize} variant="preview" />
            </div>
          </PreviewErrorBoundary>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => window.print()}>Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
