import { useState, type KeyboardEvent } from 'react'
import type { DocumentModel, PageSize, TemplateId } from '../../document/types'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { MobileFormattingFooter } from '../edit/MobileFormattingFooter'
import { PrintPreviewDialog } from '../PrintPreviewDialog'
import { BuilderHeader } from './BuilderHeader'
import { DesktopPanes } from './DesktopPanes'
import { MobileItemSheet } from './MobileItemSheet'
import { MobileStack } from './MobileStack'
import { useBuilderDocument } from './useBuilderDocument'
import { useCanvasZoom } from './useCanvasZoom'

// The builder around one document: header, desktop panes or mobile stack, preview dialog and mobile sheet.
export function BuilderWorkspace({
  model: initialModel,
  template: initialTemplate,
  pageSize: initialPageSize,
  editable = true,
}: {
  model: DocumentModel
  template?: TemplateId
  pageSize?: PageSize
  editable?: boolean
}) {
  const { history, settings, selection, items, outlineProps, sharedPropertiesProps, commitCustomerName } =
    useBuilderDocument(initialModel, initialTemplate, initialPageSize)
  const { model, commit, undo, redo, saveState, retrySave, canUndo, canRedo, handleKeyDown } = history
  const { zoom, zoomIn, zoomOut } = useCanvasZoom()
  const [previewOpen, setPreviewOpen] = useState(false)
  // Print always uses the desktop canvas so the document renders exactly once.
  const isDesktop = useMediaQuery('(min-width: 1024px), print')
  const layout = { model, template: settings.currentTemplate, pageSize: settings.currentPageSize, outlineProps }

  return (
    <div className="flex min-h-screen flex-col print:min-h-0" onKeyDown={(e: KeyboardEvent) => handleKeyDown(e)}>
      <BuilderHeader
        editable={editable}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        saveState={saveState}
        onRetrySave={retrySave}
        pageSize={settings.currentPageSize}
        onPageSizeChange={settings.changePageSize}
        onOpenPreview={() => setPreviewOpen(true)}
      />
      {isDesktop ? (
        <DesktopPanes
          {...layout}
          editable={editable}
          zoom={zoom}
          propertiesProps={{ ...sharedPropertiesProps, selectedItemId: selection.selectedItemId }}
          onCustomerNameCommit={commitCustomerName}
          onCommit={commit}
        />
      ) : (
        <MobileStack {...layout} saveFailed={saveState === 'failed'} />
      )}
      <PrintPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        model={model}
        template={settings.currentTemplate}
        branding={model.branding}
        pageSize={settings.currentPageSize}
      />
      <MobileFormattingFooter />
      <MobileItemSheet
        model={model}
        sheetItemId={selection.sheetItemId}
        onClose={selection.closeSheet}
        propertiesProps={sharedPropertiesProps}
        onMoveUp={items.moveItemUp}
        onMoveDown={items.moveItemDown}
      />
    </div>
  )
}
