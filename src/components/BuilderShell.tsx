import { useState, type KeyboardEvent } from 'react'
import { Undo2, Redo2 } from 'lucide-react'

import { DEMO_DOCUMENT_ID, documentsRepo } from '../db/repos'
import { PAGE_SIZES } from '../document/tokens'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../document/types'
import type { RichTextDoc } from '../document/richtext'
import { useMountEffect } from '../lib/useMountEffect'
import { DocumentPage } from './DocumentPage'
import { OutlinePane } from './OutlinePane'
import { PrintPreviewDialog } from './PrintPreviewDialog'
import { PropertiesPane } from './PropertiesPane'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useHistory } from './edit/useHistory'
import { cn } from '@/lib/utils'

/**
 * Three-pane builder shell (BUIL-01) — evolves RenderBench.tsx.
 *
 * Header: brand + undo/redo + save indicator + page-size + Print preview.
 * Left rail: OutlinePane (240-320px).
 * Center canvas: DocumentPage in edit mode, zoom wrapper (pass-through for 04-05).
 * Right rail: PropertiesPane (280-320px).
 *
 * Print-neutrality contract: all chrome carries print:hidden / print:min-h-0
 * Tailwind variants — #print-root subtree is untouched (D-04).
 *
 * D-12/D-15: all model changes route through useHistory.commit() —
 * undo covers template/branding/page-size changes (D-13),
 * auto-save is debounced ~800ms (D-15).
 */

type BlockId = 'header' | 'billTo' | 'items' | 'totals' | 'footer'

export function BuilderShell({
  model: fixtureModel,
  template,
  pageSize,
}: {
  model?: DocumentModel
  template?: TemplateId
  pageSize?: PageSize
}) {
  // Harness path (T-01-01): whitelisted fixture model — render in VIEW mode
  // so existing goldens stay green. Edit mode is tested separately via the
  // edit-mode parity assertion (D-11).
  if (fixtureModel !== undefined) {
    return <BuilderShellInner model={fixtureModel} template={template} pageSize={pageSize} editable={false} />
  }
  // Demo path: mount the async seed/load only when needed.
  return <DemoDocument pageSize={pageSize} />
}

function BuilderShellInner({
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
  const { model, commit, undo, redo, saveState, retrySave, canUndo, canRedo, handleKeyDown } =
    useHistory(initialModel)

  const [currentTemplate, setCurrentTemplate] = useState<TemplateId | undefined>(
    initialTemplate ?? model.template,
  )
  const [currentPageSize, setCurrentPageSize] = useState<PageSize>(
    initialPageSize ?? model.pageSize ?? 'a4',
  )
  const [previewOpen, setPreviewOpen] = useState(false)

  // Outline pane selection state (D-27)
  const [selectedBlockId, setSelectedBlockId] = useState<BlockId | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const pastEmpty = !canUndo
  const futureEmpty = !canRedo

  // Template change routes through commit (D-13: all model changes undoable)
  const handleTemplateChange = (template: TemplateId) => {
    setCurrentTemplate(template)
    commit({ ...model, template })
  }

  const handleBrandingChange = (branding: Partial<Branding> | undefined) => {
    const next = { ...model }
    if (branding === undefined) delete next.branding
    else next.branding = branding
    commit(next)
  }

  const handleLogoChange = (logo: string | null) => {
    commit({ ...model, company: { ...model.company, logo } })
  }

  const handlePageSizeChange = (pageSize: PageSize) => {
    setCurrentPageSize(pageSize)
    commit({ ...model, pageSize })
  }

  // D-30: block visibility toggle routes through commit
  const handleToggleVisibility = (blockId: BlockId, visible: boolean) => {
    const current = model.settings?.blockVisibility ?? {}
    commit({
      ...model,
      settings: {
        ...model.settings,
        blockVisibility: { ...current, [blockId]: visible },
      },
    })
  }

  const handleOutlineSelect = (blockId: BlockId | null, itemId: string | null) => {
    setSelectedBlockId(blockId)
    setSelectedItemId(itemId)
    // ponytail: scrollIntoView deferred to plan 04-04 (cell refs needed)
  }

  const handleCustomerNameCommit = (name: RichTextDoc) => {
    commit({ ...model, customer: { ...model.customer, name } })
  }

  const saveIndicator = () => {
    switch (saveState) {
      case 'saving':
        return <span className="text-[13px] text-muted-foreground">Saving…</span>
      case 'failed':
        return (
          <button
            type="button"
            onClick={retrySave}
            className="rounded bg-destructive px-2 py-0.5 text-[13px] font-medium text-destructive-foreground"
          >
            Not saved — retry
          </button>
        )
      default:
        return <span className="text-[13px] text-muted-foreground">Saved</span>
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col print:min-h-0"
      onKeyDown={(e: KeyboardEvent) => handleKeyDown(e)}
    >
      {/* Header: brand + undo/redo + save indicator + page-size + Print preview */}
      <header className="flex h-12 shrink-0 items-center justify-between px-4 print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold tracking-tight">Paperchaser</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Undo"
              disabled={pastEmpty}
              onClick={undo}
              className={cn('rounded p-1 hover:bg-foreground/10', pastEmpty && 'opacity-30')}
            >
              <Undo2 className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Redo"
              disabled={futureEmpty}
              onClick={redo}
              className={cn('rounded p-1 hover:bg-foreground/10', futureEmpty && 'opacity-30')}
            >
              <Redo2 className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveIndicator()}
          <Select
            value={currentPageSize}
            onValueChange={(next) => {
              if (next !== null && (next === 'a4' || next === 'a5' || next === 'a3')) {
                handlePageSizeChange(next)
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Page size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAGE_SIZES).map(([id, size]) => (
                <SelectItem key={id} value={id}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setPreviewOpen(true)}>Print preview</Button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden print:min-h-0">
        {/* Left rail: OutlinePane — 224px (plan: 240-280px; narrow to fit 794px doc at 1280px) */}
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-foreground/10 bg-card p-3 print:hidden">
          <OutlinePane
            model={model}
            selectedBlockId={selectedBlockId}
            selectedItemId={selectedItemId}
            onSelect={handleOutlineSelect}
            onToggleVisibility={handleToggleVisibility}
            onAddItem={() => {
              // ponytail: add-item deferred to plan 04-04
            }}
          />
        </aside>

        {/* Center canvas: DocumentPage in edit mode. Narrow px for three-pane fit. */}
        <div className="flex flex-1 justify-center overflow-auto px-2 pb-10 print:pb-0">
          {/* Zoom wrapper (pass-through for 04-05) */}
          <div style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)' }}>
            <DocumentPage
              model={model}
              template={currentTemplate}
              branding={model.branding}
              pageSize={currentPageSize}
              editable={editable}
              onCustomerNameCommit={editable ? handleCustomerNameCommit : undefined}
            />
          </div>
        </div>

        {/* Right rail: PropertiesPane — 224px */}
        <aside className="w-56 shrink-0 overflow-y-auto border-l border-foreground/10 bg-card p-3 print:hidden">
          <PropertiesPane
            model={model}
            template={currentTemplate ?? model.template ?? 'minimal'}
            selectedItemId={selectedItemId}
            onTemplateChange={handleTemplateChange}
            onBrandingChange={handleBrandingChange}
            onLogoChange={handleLogoChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </aside>
      </main>

      {/* Print preview dialog */}
      <PrintPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        model={model}
        template={currentTemplate}
        branding={model.branding}
        pageSize={currentPageSize}
      />
    </div>
  )
}

/** Empty-store load: seed the demo once, then render. */
function DemoDocument({ pageSize }: { pageSize?: PageSize }) {
  const [model, setModel] = useState<DocumentModel | null>(null)

  useMountEffect(() => {
    void (async () => {
      await documentsRepo.seedDemoIfEmpty()
      setModel((await documentsRepo.get(DEMO_DOCUMENT_ID)) ?? null)
    })()
  })

  if (model === null) return <div className="flex min-h-screen items-center justify-center" />

  return <BuilderShellInner model={model} pageSize={pageSize} />
}
