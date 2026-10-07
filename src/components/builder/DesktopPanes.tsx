import type { DocumentModel, PageSize, TemplateId } from '../../document/types'
import type { blockActions } from '../blocks/blockActions'
import { ServicePicker } from '../catalog/ServicePicker'
import { isMoneyDocument } from '../../document/documentBlocks'
import { DocumentPage } from '../DocumentPage'
import { OutlinePane, type OutlinePaneProps } from '../OutlinePane'
import { PropertiesPane, type PropertiesPaneProps } from '../PropertiesPane'
import { cn } from '@/lib/utils'
import { SectionsOutline } from './SectionsOutline'

// Desktop (1024px and up) three-pane layout: outline, zoomable canvas, properties.
export function DesktopPanes({
  model,
  template,
  pageSize,
  editable,
  sections,
  zoom,
  outlineProps,
  propertiesProps,
  onCommit,
  onInsertItem,
}: {
  model: DocumentModel
  template?: TemplateId
  pageSize: PageSize
  editable: boolean
  sections: ReturnType<typeof blockActions>
  zoom: number
  outlineProps: OutlinePaneProps
  propertiesProps: PropertiesPaneProps
  onCommit: (next: DocumentModel) => void
  onInsertItem?: (line: DocumentModel['lineItems'][number]) => void
}) {
  return (
    <main className="hidden flex-1 overflow-hidden print:flex print:min-h-0 lg:flex">
      <aside className="w-56 shrink-0 overflow-y-auto border-r border-foreground/10 bg-card p-3 print:hidden">
        {isMoneyDocument(model) && <OutlinePane {...outlineProps} />}
        {editable && onInsertItem && isMoneyDocument(model) && <ServicePicker onInsert={onInsertItem} />}
        {editable && <SectionsOutline sections={sections} />}
      </aside>

      <div className="flex flex-1 justify-center overflow-auto px-2 pb-10 print:pb-0">
        {/* Zoom is a CSS scale; print resets it so the printed page is unscaled. */}
        <div
          className={cn('print:scale-100 print:!transform-none print:ring-0', editable && 'ring-1 ring-primary/15')}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)' }}
        >
          <DocumentPage
            id="document-root"
            model={model}
            template={template}
            branding={model.branding}
            pageSize={pageSize}
            editable={editable}
            onCommit={editable ? onCommit : undefined}
          />
        </div>
      </div>

      <aside className="w-56 shrink-0 overflow-y-auto border-l border-foreground/10 bg-card p-3 print:hidden">
        <PropertiesPane {...propertiesProps} />
      </aside>
    </main>
  )
}
