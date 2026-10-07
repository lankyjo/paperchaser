import { isMoneyDocument } from '../../document/documentBlocks'
import type { DocumentModel, PageSize, TemplateId } from '../../document/types'
import type { blockActions } from '../blocks/blockActions'
import { DocumentPage } from '../DocumentPage'
import { OutlinePane, type OutlinePaneProps } from '../OutlinePane'
import { SectionsOutline } from './SectionsOutline'

// Mobile (below 1024px) layout: save error banner, always-visible scaled preview, then the outline.
export function MobileStack({
  model,
  template,
  pageSize,
  saveFailed,
  editable,
  sections,
  outlineProps,
  onCommit,
}: {
  model: DocumentModel
  template?: TemplateId
  pageSize: PageSize
  saveFailed: boolean
  editable: boolean
  sections: ReturnType<typeof blockActions>
  outlineProps: OutlinePaneProps
  onCommit: (next: DocumentModel) => void
}) {
  // Money documents are edited through the outline and item sheets; block documents directly on the page.
  const editOnPage = editable && !isMoneyDocument(model)
  return (
    <div className="flex flex-1 flex-col lg:hidden">
      {saveFailed && (
        <div className="mx-4 mt-2 rounded bg-destructive px-3 py-2 text-sm text-destructive-foreground">Not saved — retry</div>
      )}
      <div className="sticky top-0 z-10 border-b bg-card p-2">
        {/* Focusable so keyboard users can scroll the preview. */}
        <div tabIndex={0} role="region" aria-label="Document preview" className="flex justify-center overflow-auto">
          <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
            <DocumentPage
              id="document-root"
              model={model}
              template={template}
              branding={model.branding}
              pageSize={pageSize}
              editable={editOnPage}
              onCommit={editOnPage ? onCommit : undefined}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 pb-20">
        {isMoneyDocument(model) && <OutlinePane {...outlineProps} />}
        {editable && <SectionsOutline sections={sections} />}
      </div>
    </div>
  )
}
