import type { PageSize } from '../../document/types'
import { Button } from '../ui/button'
import { PageSizeSelect } from './PageSizeSelect'
import { SaveIndicator } from './SaveIndicator'
import { UndoRedoButtons } from './UndoRedoButtons'
import { ZoomControls } from './ZoomControls'

// Builder top bar: brand, editing badge, undo/redo, zoom, save status, page size and preview buttons.
export function BuilderHeader({
  editable,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  saveState,
  onRetrySave,
  pageSize,
  onPageSizeChange,
  onOpenPreview,
}: {
  editable: boolean
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  saveState: 'saved' | 'saving' | 'failed'
  onRetrySave: () => void
  pageSize: PageSize
  onPageSizeChange: (pageSize: PageSize) => void
  onOpenPreview: () => void
}) {
  const undoRedo = { canUndo, canRedo, onUndo, onRedo }
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-4 print:hidden">
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold tracking-tight">Paperchaser</span>
        {editable && <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"><span className="size-2 rounded-full bg-primary-foreground animate-pulse" />Editing • Click any text to edit</span>}
        <UndoRedoButtons className="hidden items-center gap-1 lg:flex" {...undoRedo} />
        <ZoomControls zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
      </div>
      <div className="flex items-center gap-2">
        <UndoRedoButtons className="flex items-center gap-1 lg:hidden" {...undoRedo} />
        <SaveIndicator saveState={saveState} onRetry={onRetrySave} />
        <PageSizeSelect value={pageSize} onChange={onPageSizeChange} />
        <Button onClick={onOpenPreview} className="hidden lg:inline-flex">
          Print preview
        </Button>
        <Button onClick={onOpenPreview} size="sm" className="lg:hidden">
          Preview
        </Button>
      </div>
    </header>
  )
}
