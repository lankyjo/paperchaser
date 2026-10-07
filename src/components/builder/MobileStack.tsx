import type { DocumentModel, PageSize, TemplateId } from '../../document/types'
import { DocumentPage } from '../DocumentPage'
import { OutlinePane, type OutlinePaneProps } from '../OutlinePane'

// Mobile (below 1024px) layout: save error banner, always-visible scaled preview, then the outline.
export function MobileStack({
  model,
  template,
  pageSize,
  saveFailed,
  outlineProps,
}: {
  model: DocumentModel
  template?: TemplateId
  pageSize: PageSize
  saveFailed: boolean
  outlineProps: OutlinePaneProps
}) {
  return (
    <div className="flex flex-1 flex-col lg:hidden">
      {saveFailed && (
        <div className="mx-4 mt-2 rounded bg-destructive px-3 py-2 text-sm text-destructive-foreground">Not saved — retry</div>
      )}
      <div className="sticky top-0 z-10 border-b bg-card p-2">
        <div className="flex justify-center overflow-auto">
          <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
            <DocumentPage
              id="document-root"
              model={model}
              template={template}
              branding={model.branding}
              pageSize={pageSize}
              editable={false}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 pb-20">
        <OutlinePane {...outlineProps} />
      </div>
    </div>
  )
}
