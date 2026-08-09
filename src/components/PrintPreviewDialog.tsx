import { Component, useMemo, useState, type CSSProperties, type ReactNode } from 'react'

import { PAGE_SIZE_PX } from '../document/tokens'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../document/types'
import { DocumentPage } from './DocumentPage'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

/**
 * Print preview (BUIL-10, D-15) — measure-and-slice pagination.
 *
 * Renders the document ONCE into a hidden-but-rendered measure container
 * (off-screen — NEVER display:none, because offsetHeight is 0 under
 * display:none; RESEARCH Pattern 3), reads its total continuous height, and
 * derives sliceCount = max(1, ceil(totalH / pageH)). Each page block is a
 * window of the SAME DocumentPage shifted by translateY(-i·pageH) — one DOM,
 * one truth. The slice geometry is byte-identical to the harness's existing
 * cropY(printShot, i·A4_HEIGHT_PX, A4_HEIGHT_PX) inputs (parity.spec.ts), so
 * dialog page i ≈ PDF page i within the calibrated 0.05/0.06 fractions
 * (RESEARCH A1) — proven by the Task-3 dialog parity test.
 *
 * House rule (AGENTS.md: no effect hooks in components): post-render
 * measurement happens in a REF CALLBACK (fires after the DOM commit), with an
 * idempotent guarded write (h !== measuredH) so it cannot loop, and a KEYED
 * remeasure — the measure container's key changes with pageSize/template/model
 * content, remounting it and re-firing the callback against the new geometry.
 * No effect hook anywhere (grep-enforced in the acceptance criteria).
 *
 * Print flow: the dialog portals to document.body (shadcn dialog), so its
 * duplicate #print-root copies live OUTSIDE .app-shell — print:hidden
 * (display:none in print) on DialogContent keeps them out of the printed
 * output; window.print() prints the real canvas document via print.css.
 */

/** Error boundary: render failure → UI-SPEC error copy + re-render button. */
class PreviewErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Preview failed to render. Try switching template or page size.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => this.setState({ failed: false })}>
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

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

  /** Continuous content height, read post-commit by the measure ref callback. */
  const [measuredH, setMeasuredH] = useState(0)

  // Keyed remeasure (house rule): a stable content fingerprint remounts the
  // measure container whenever pageSize/template/model content changes, so the
  // ref callback re-measures against the new geometry — no effect hook.
  const modelRevision = useMemo(() => JSON.stringify(model), [model])
  const measureKey = `${pageSize}-${template ?? 'minimal'}-${modelRevision}`

  // Post-render measurement (house rule): the ref callback runs AFTER the DOM
  // commit; the guarded write (h !== measuredH) is idempotent, so the new
  // callback identity per render cannot cause a state loop.
  const measureRef = (el: HTMLDivElement | null) => {
    const h = el?.offsetHeight ?? 0
    if (h !== measuredH) setMeasuredH(h)
  }

  // Derived at render time, never setState-d during render (edge-19: floor of
  // 1 — a short document shows exactly one page block).
  const totalH = measuredH > 0 ? measuredH : pageH
  const sliceCount = Math.max(1, Math.ceil(totalH / pageH))

  const blockStyle: CSSProperties = {
    width: pageW,
    height: pageH,
    overflow: 'hidden',
    background: '#ffffff',
    border: '1px solid var(--border)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* print:hidden — the dialog portals to body, outside .app-shell; its
          duplicate #print-root copies must never reach the print projection. */}
      <DialogContent className="max-w-[calc(100vw-4rem)] print:hidden">
        {/* Measure container (D-15): hidden-but-rendered (visibility, NOT
            display:none — offsets are 0 under display:none), off-screen,
            aria-hidden, one DocumentPage at the current page width. */}        <div
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
              <div className="flex flex-col items-center gap-6">
                {Array.from({ length: sliceCount }, (_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="mb-1.5 text-xs text-muted-foreground">
                      Page {i + 1} of {sliceCount}
                    </div>
                    {/* The slice window: the same document shifted by i·pageH,
                        clipped by the page block (one DOM, one truth). */}
                    <div className="page-block" style={blockStyle}>
                      <div style={{ width: pageW, transform: `translateY(${-i * pageH}px)` }}>
                        <DocumentPage model={model} template={template} branding={branding} pageSize={pageSize} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
