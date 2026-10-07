import { cn } from '@/lib/utils'
import { DocumentPage } from '../DocumentPage'
import { useWorkspace } from './workspaceContext'

// The editable page at the current zoom.
export function CanvasPanel() {
  const { model, template, pageSize, editable, zoom, onCommit } = useWorkspace()
  return (
    <div className="flex h-full justify-center overflow-auto bg-muted/40 px-2 py-6">
      <div
        className={cn('h-fit', editable && 'ring-1 ring-primary/15')}
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)' }}
      >
        <DocumentPage id="document-root" model={model} template={template} branding={model.branding} pageSize={pageSize} editable={editable} onCommit={editable ? onCommit : undefined} />
      </div>
    </div>
  )
}
