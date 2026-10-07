import { PAGE_SIZE_PX } from '../document/tokens'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../document/types'
import { DocumentPage } from './DocumentPage'
import { PreviewErrorBoundary } from './print-preview/PreviewErrorBoundary'
import { PreviewPageStack } from './print-preview/PreviewPageStack'
import { useMeasuredHeight } from './print-preview/useMeasuredHeight'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

// Print preview that measures the document once and shows it sliced into page-sized windows.
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
  const pageW = PAGE_SIZE_PX[pageSize].width
  const pageH = PAGE_SIZE_PX[pageSize].height

  const { measuredH, measureKey, measureRef } = useMeasuredHeight(model, pageSize, template)

  // A short document still shows one page.
  const totalH = measuredH > 0 ? measuredH : pageH
  const sliceCount = Math.max(1, Math.ceil(totalH / pageH))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The dialog portals outside .app-shell, so print:hidden keeps its document copies out of print. */}
      <DialogContent className="max-w-[calc(100vw-4rem)] print:hidden">
        {/* Off-screen measure copy; visibility:hidden keeps offsetHeight, display:none would zero it. */}        <div
          aria-hidden="true"
          style={{ position: 'absolute', left: -9999, top: 0, width: pageW, visibility: 'hidden', pointerEvents: 'none' }}
        >
          <div key={measureKey} ref={measureRef}>
            <DocumentPage model={model} template={template} branding={branding} pageSize={pageSize} />
          </div>
        </div>

        <DialogHeader>
          <DialogTitle>Print preview</DialogTitle>
          <DialogDescription>Pagination and styling match the exported PDF.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto rounded-lg bg-muted/50 p-4">
          <PreviewErrorBoundary>
            {measuredH === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">Preparing preview…</div>
            ) : (
              <PreviewPageStack
                sliceCount={sliceCount}
                pageW={pageW}
                pageH={pageH}
                model={model}
                template={template}
                branding={branding}
                pageSize={pageSize}
              />
            )}
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
