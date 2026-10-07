import { useState, type KeyboardEvent } from 'react'
import { DOC_TYPES } from '../../document/docTypes'
import type { DocumentModel } from '../../document/types'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { Project } from '../../project/project'
import type { SharedData } from '../../project/sharedData'
import { AiPanel } from '../ai/AiPanel'
import { LifecycleBar } from '../lifecycle/LifecycleBar'
import { ScheduleContext } from '../blocks/scheduleContext'
import { useScheduleInvoices } from '../blocks/useScheduleInvoices'
import { ProjectDataContext } from './projectDataContext'
import { MobileFormattingFooter } from '../edit/MobileFormattingFooter'
import { PagedDocument } from '../paged-document/PagedDocument'
import { PrintPreviewDialog } from '../PrintPreviewDialog'
import { BuilderHeader } from './BuilderHeader'
import { cn } from '@/lib/utils'
import { MobileSheets } from '../mobile/MobileSheets'
import { DesktopWorkspace } from '../workspace/DesktopWorkspace'
import { WorkspaceContext } from '../workspace/workspaceContext'
import { MobileItemSheet } from './MobileItemSheet'
import { MobileStack } from './MobileStack'
import { useBuilderDocument } from './useBuilderDocument'
import { useCanvasZoom } from './useCanvasZoom'

// The editor for every document type: header, desktop panes or mobile stack, preview dialog and mobile sheet.
export function BuilderWorkspace({
  model: initialModel,
  editable: editableProp = true,
  shared,
  project,
  showExplainer = false,
}: {
  model: DocumentModel
  editable?: boolean
  showExplainer?: boolean
  shared?: SharedData
  project?: Project
}) {
  const { history, settings, selection, items, sections, outlineProps, sharedPropertiesProps } = useBuilderDocument(initialModel, shared)
  const { model, commit, undo, redo, saveState, retrySave, canUndo, canRedo, handleKeyDown } = history
  // Sent documents are read-only until returned to draft; a tab with stale edits is read-only until reloaded.
  const editable = editableProp && model.status === 'draft' && saveState !== 'stale'
  const { zoom, zoomIn, zoomOut } = useCanvasZoom()
  const [previewOpen, setPreviewOpen] = useState(false)
  const scheduleActions = useScheduleInvoices(model)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const layout = { model, template: settings.template, pageSize: settings.pageSize, outlineProps }

  return (
    <ProjectDataContext.Provider value={shared}>
      <div className={cn('flex flex-col print:min-h-0', isDesktop ? 'h-screen' : 'min-h-screen')} onKeyDown={(e: KeyboardEvent) => handleKeyDown(e)}>
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
        {DOC_TYPES[model.type].legalNotice && (
          <p role="note" className="mx-4 rounded border px-3 py-2 text-xs text-muted-foreground print:hidden">
            These clauses are a plain-language starting point, not legal advice. Review them for your country before sending.
          </p>
        )}
        {editableProp && <LifecycleBar model={model} shared={shared} project={project} history={history} />}
        {editable && <AiPanel model={model} commit={commit} />}
        <PagedDocument model={model} template={settings.template} branding={model.branding} pageSize={settings.pageSize} variant="print" />
        <ScheduleContext.Provider value={scheduleActions}>
          {isDesktop ? (
            <WorkspaceContext.Provider
              value={{
                ...layout,
                editable,
                sections,
                zoom,
                propertiesProps: { ...sharedPropertiesProps, selectedItemId: selection.selectedItemId },
                onCommit: commit,
                onInsertItem: items.insertItem,
                showExplainer,
              }}
            >
              <DesktopWorkspace />
            </WorkspaceContext.Provider>
          ) : (
            <>
              <MobileSheets model={model} propertiesProps={sharedPropertiesProps} showExplainer={showExplainer} />
              <MobileStack {...layout} editable={editable} sections={sections} saveFailed={saveState === 'failed'} onCommit={commit} />
            </>
          )}
        </ScheduleContext.Provider>
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
