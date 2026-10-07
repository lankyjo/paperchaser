import { Link } from '@tanstack/react-router'
import type { KeyboardEvent } from 'react'
import type { DocumentModel } from '../../document/types'
import { SaveIndicator } from '../builder/SaveIndicator'
import { UndoRedoButtons } from '../builder/UndoRedoButtons'
import { Button } from '../ui/button'
import { BlockOutline } from './BlockOutline'
import { BlockPage } from './BlockPage'
import { useBlockDocument } from './useBlockDocument'

// Editor for documents built from blocks: outline on the left, editable page on the right.
export function BlockWorkspace({ model: initial }: { model: DocumentModel }) {
  const { history, blocks, changeBlock, addBlock, moveBlock, toggleHidden } = useBlockDocument(initial)
  const { model, undo, redo, canUndo, canRedo, saveState, retrySave, handleKeyDown } = history

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
      <main className="flex flex-1 flex-col gap-4 px-2 pb-10 lg:flex-row print:p-0">
        <aside className="shrink-0 lg:w-64 print:hidden">
          <BlockOutline blocks={blocks} onMove={moveBlock} onToggleHidden={toggleHidden} onAdd={(type) => addBlock(type, null)} />
        </aside>
        <div className="flex flex-1 justify-center overflow-auto">
          <BlockPage model={model} onBlockChange={changeBlock} />
        </div>
      </main>
    </div>
  )
}
