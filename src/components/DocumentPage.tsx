import { isSplittable, pageSizeFor, resolvePage } from '../document/pageLayout'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../document/types'
import { DocumentItem } from './document-page/DocumentItem'
import { PageFrame } from './document-page/PageFrame'

interface DocumentPageProps {
  id?: string
  model: DocumentModel
  template?: TemplateId
  branding?: Partial<Branding>
  pageSize?: PageSize
  editable?: boolean
  onCommit?: (next: DocumentModel) => void
}

// The whole document as one growing page, used for editing and for measuring page breaks.
export function DocumentPage({ id, model, template, branding, pageSize, editable = false, onCommit }: DocumentPageProps) {
  const { templateId, tokens, totals, items, frame } = resolvePage(model, template, branding)
  return (
    <PageFrame
      id={id}
      templateId={templateId}
      pageSize={pageSize ?? pageSizeFor(model)}
      {...frame}
    >
      {items.map((item) => (
        <div key={item.id} data-page-item={item.id} data-splittable={isSplittable(item) || undefined} data-keep-with-next={item.block?.type === 'heading' || undefined}>
          <DocumentItem item={item} model={model} templateId={templateId} tokens={tokens} totals={totals} editable={editable} onCommit={onCommit} />
        </div>
      ))}
      <div data-page-end />
    </PageFrame>
  )
}
