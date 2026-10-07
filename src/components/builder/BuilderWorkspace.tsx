import { useState, type KeyboardEvent } from 'react'
import type { DocumentModel } from '../../document/types'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { Project } from '../../project/project'
import type { SharedData } from '../../project/sharedData'
import { AiPanel } from '../ai/AiPanel'
import { LifecycleBar } from '../lifecycle/LifecycleBar'
import { ProjectDataContext } from './projectDataContext'
import { MobileFormattingFooter } from '../edit/MobileFormattingFooter'
import { PagedDocument } from '../paged-document/PagedDocument'
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
  editable: editableProp = true,
  shared,
  project,
}: {
  model: DocumentModel
  editable?: boolean
  shared?: SharedData
  project?: Project
}) {
  const { history, settings, selection, items, sections, outlineProps, sharedPropertiesProps } = useBuilderDocument(initialModel, shared)
  const { model, commit, undo, redo, saveState, retrySave, canUndo, canRedo, handleKeyDown } = history
  // Sent documents are read-only until returned to draft; a tab with stale edits is read-only until reloaded.
  const editable = editableProp && model.status === 'draft' && saveState !== 'stale'
  const { zoom, zoomIn, zoomOut } = useCanvasZoom()
  const [previewOpen, setPreviewOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const layout = { model, template: settings.template, pageSize: settings.pageSize, outlineProps }

  return (
    <ProjectDataContext.Provider value={shared}>
      <div className="flex min-h-screen flex-col print:min-h-0" onKeyDown={(e: KeyboardEvent) => handleKeyDown(e)}>
        <BuilderHeader
          projectId={editableProp ? model.projectId : undefined}
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
          pageSize={settings.pageSize}
          onPageSizeChange={settings.changePageSize}
          onOpenPreview={() => setPreviewOpen(true)}
        />
        {editableProp && <LifecycleBar model={model} shared={shared} project={project} history={history} />}
        {editable && <AiPanel model={model} commit={commit} />}
        <PagedDocument model={model} template={settings.template} branding={model.branding} pageSize={settings.pageSize} variant="print" />
        {isDesktop ? (
          <DesktopPanes
            {...layout}
            editable={editable}
            sections={sections}
            zoom={zoom}
            propertiesProps={{ ...sharedPropertiesProps, selectedItemId: selection.selectedItemId }}
            onCommit={commit}
            onInsertItem={items.insertItem}
          />
        ) : (
          <MobileStack {...layout} saveFailed={saveState === 'failed'} />
        )}
        <PrintPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          model={model}
          template={settings.template}
          branding={model.branding}
          pageSize={settings.pageSize}
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
    </ProjectDataContext.Provider>
  )
}
