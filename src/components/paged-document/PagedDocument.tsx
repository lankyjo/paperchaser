import { createPortal } from 'react-dom'
import { pageSizeFor, resolvePage } from '../../document/pageLayout'
import { toCssVars } from '../../document/resolveTokens'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../../document/types'
import { DocumentItem } from '../document-page/DocumentItem'
import { PageFrame } from '../document-page/PageFrame'
import { DocumentPage } from '../DocumentPage'
import { usePagination } from './usePagination'

interface PagedDocumentProps {
  model: DocumentModel
  template?: TemplateId
  branding?: Partial<Branding>
  pageSize?: PageSize
  // print: hidden on screen and the only thing printed; preview: visible numbered pages.
  variant: 'print' | 'preview'
}

// The document split into real pages by measuring a hidden copy, so preview and print break in the same places.
export function PagedDocument({ model, template, branding, pageSize, variant }: PagedDocumentProps) {
  const size = pageSize ?? pageSizeFor(model)
  const { measureRef, pagination } = usePagination(size)
  const { tokens, totals, watermark, items } = resolvePage(model, template, branding)
  const byId = new Map(items.map((item) => [item.id, item]))
  const pages = (pagination?.pages ?? []).map((page, i) => (
    <PageFrame key={i} pageSize={size} fixedHeight cssVars={toCssVars(tokens)} watermark={watermark === null ? null : { text: watermark, color: tokens.accent }}>
      {page.map((placement) => {
        const item = byId.get(placement.id)
        return item && <DocumentItem key={placement.id} item={item} model={model} tokens={tokens} totals={totals} range={placement.range} editable={false} />
      })}
    </PageFrame>
  ))

  return (
    <>
      {/* Off-screen measuring copy; visibility:hidden keeps layout, display:none would zero every height. */}
      <div aria-hidden="true" className="print:hidden" style={{ position: 'absolute', left: -10000, top: 0, visibility: 'hidden', pointerEvents: 'none' }}>
        <div ref={measureRef}>
          <DocumentPage model={model} template={template} branding={branding} pageSize={size} />
        </div>
      </div>
      {pagination !== null && pagination.oversized.length > 0 && (
        <p role="alert" className="mx-auto mb-2 max-w-xl rounded border border-destructive/40 px-3 py-2 text-xs text-destructive print:hidden">
          A section is taller than one page and will be cut off when printed. Split it into smaller sections.
        </p>
      )}
      {variant === 'print'
        ? createPortal(<div id="print-root" className="hidden print:block">{pages}</div>, document.body)
        : pages.map((page, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="mb-1.5 text-xs text-muted-foreground">
                Page {i + 1} of {pages.length}
              </div>
              <div className="page-block shadow-[0_2px_12px_rgba(0,0,0,0.15)]">{page}</div>
            </div>
          ))}
    </>
  )
}
