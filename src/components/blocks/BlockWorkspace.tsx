import { Link } from '@tanstack/react-router'
import type { KeyboardEvent } from 'react'
import { DOC_TYPES } from '../../document/docTypes'
import type { DocumentModel } from '../../document/types'
import { SaveIndicator } from '../builder/SaveIndicator'
import { UndoRedoButtons } from '../builder/UndoRedoButtons'
import { Button } from '../ui/button'
import { BlockOutline } from './BlockOutline'
import { DocumentPage } from '../DocumentPage'
import type { Project } from '../../project/project'
import { commitWithProjectData, type SharedData } from '../../project/sharedData'
import { AiPanel } from '../ai/AiPanel'
import { useHistory } from '../edit/useHistory'
import { LifecycleBar } from '../lifecycle/LifecycleBar'
import { PagedDocument } from '../paged-document/PagedDocument'
import { blockActions } from './blockActions'
import { ScheduleContext } from './scheduleContext'
import { useScheduleInvoices } from './useScheduleInvoices'

// Editor for documents built from blocks: outline on the left, editable page on the right.
export function BlockWorkspace({ model: initial, shared, project }: { model: DocumentModel; shared?: SharedData; project?: Project }) {
  const history = useHistory(initial)
  const { model, undo, redo, canUndo, canRedo, saveState, retrySave, handleKeyDown } = history
  const commit = (next: DocumentModel) => history.commit(commitWithProjectData(next, shared))
  const editable = model.status === 'draft' && saveState !== 'stale' && !project?.archived
  const actions = blockActions(model, commit)
  const scheduleActions = useScheduleInvoices(model)

  return (
    <div className="flex min-h-screen flex-col print:min-h-0" onKeyDown={(e: KeyboardEvent) => handleKeyDown(e)}>
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/projects/$projectId" params={{ projectId: model.projectId }} className="text-sm underline">
            Project
          </Link>
          <UndoRedoButtons className="flex items-center gap-1" canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
        </div>
        <div className="flex items-center gap-2">
          <SaveIndicator saveState={saveState} onRetry={retrySave} />
          <Button size="sm" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </header>
      {DOC_TYPES[model.type].legalNotice && (
        <p role="note" className="mx-4 rounded border px-3 py-2 text-xs text-muted-foreground print:hidden">
          These clauses are a plain-language starting point, not legal advice. Review them for your country before sending.
        </p>
      )}
      {!project?.archived && <LifecycleBar model={model} shared={shared} project={project} history={history} />}
      {editable && <AiPanel model={model} commit={commit} />}
      <PagedDocument model={model} variant="print" />
      <main className="flex flex-1 flex-col gap-4 px-2 pb-10 lg:flex-row print:p-0">
        {editable && <aside className="shrink-0 lg:w-64 print:hidden">
          <BlockOutline blocks={actions.blocks} canHide={actions.canHide} onMove={actions.moveBlock} onToggleHidden={actions.toggleHidden} onAdd={actions.addBlock} />
        </aside>}
        <div className="flex flex-1 justify-center overflow-auto">
          <ScheduleContext.Provider value={scheduleActions}>
            <DocumentPage id="document-root" model={model} editable={editable} onCommit={editable ? commit : undefined} />
          </ScheduleContext.Provider>
        </div>
      </main>
    </div>
  )
}
