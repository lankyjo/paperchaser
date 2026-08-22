import { useState, type KeyboardEvent } from 'react'
import { Undo2, Redo2, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react'

import { DEMO_DOCUMENT_ID, documentsRepo } from '../db/repos'
import { PAGE_SIZES } from '../document/tokens'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../document/types'
import type { RichTextDoc } from '../document/richtext'
import { getPlainText } from '../document/richtext'
import { useMountEffect } from '../lib/useMountEffect'
import { DocumentPage } from './DocumentPage'
import { OutlinePane } from './OutlinePane'
import { PrintPreviewDialog } from './PrintPreviewDialog'
import { PropertiesPane } from './PropertiesPane'
import { BottomSheet } from './BottomSheet'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useHistory } from './edit/useHistory'
import { cn } from '@/lib/utils'

/**
 * Three-pane builder shell (BUIL-01) — evolves RenderBench.tsx.
 * 04-04: adds line-item CRUD + dnd reorder + numeric cells (via DocumentPage) + image.
 * 04-05: adds canvas zoom (desktop-only D-24) + mobile layout (single <1024px break D-22)
 *        with sticky preview + bottom sheet (D-20) + touch up/down reorder.
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
  if (fixtureModel !== undefined) {
    return <BuilderShellInner model={fixtureModel} template={template} pageSize={pageSize} editable={false} />
  }
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
  const [selectedBlockId, setSelectedBlockId] = useState<BlockId | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // 04-05: zoom (desktop-only D-24), mobile preview toggle, bottom sheet
  const [zoom, setZoom] = useState(1)
  const [mobilePreviewVisible, setMobilePreviewVisible] = useState(true)
  const [sheetItemId, setSheetItemId] = useState<string | null>(null)

  const pastEmpty = !canUndo
  const futureEmpty = !canRedo

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
    // On mobile, tapping a line item opens its properties in the bottom sheet (D-20)
    if (itemId !== null) setSheetItemId(itemId)
    // Scroll canvas into view when selecting a block/item (desktop)
    if (blockId !== null || itemId !== null) {
      const target = itemId !== null ? document.querySelector(`[data-item-id="${itemId}"]`) : document.querySelector(`[data-block-id="${blockId}"]`)
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleCustomerNameCommit = (name: RichTextDoc) => {
    commit({ ...model, customer: { ...model.customer, name } })
  }

  const handleCommit = (next: DocumentModel) => commit(next)

  // 04-04: line-item CRUD (LINE-02) — all via commit so undo covers them (D-13)
  const handleAddItem = () => {
    const newItem = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      quantity: 1,
      unitPriceMinor: 0,
      taxRateMinor: 0,
    }
    commit({ ...model, lineItems: [...model.lineItems, newItem] })
  }

  const handleDuplicate = (id: string) => {
    const idx = model.lineItems.findIndex((li) => li.id === id)
    if (idx === -1) return
    const original = model.lineItems[idx]
    // Deep clone via JSON to handle RichTextDoc node arrays (plain JSON)
    const cloned = JSON.parse(JSON.stringify(original)) as typeof original
    cloned.id = crypto.randomUUID()
    const next = [...model.lineItems]
    next.splice(idx + 1, 0, cloned)
    commit({ ...model, lineItems: next })
  }

  const handleDelete = (id: string) => {
    const next = model.lineItems.filter((li) => li.id !== id)
    commit({ ...model, lineItems: next })
    if (selectedItemId === id) setSelectedItemId(null)
    if (sheetItemId === id) setSheetItemId(null)
  }

  const handleReorder = (oldIndex: number, newIndex: number) => {
    const next = [...model.lineItems]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    commit({ ...model, lineItems: next })
  }

  const handleMoveUp = (id: string) => {
    const idx = model.lineItems.findIndex((li) => li.id === id)
    if (idx > 0) handleReorder(idx, idx - 1)
  }
  const handleMoveDown = (id: string) => {
    const idx = model.lineItems.findIndex((li) => li.id === id)
    if (idx !== -1 && idx < model.lineItems.length - 1) handleReorder(idx, idx + 1)
  }

  const handleLineItemChange = (id: string, patch: Partial<DocumentModel['lineItems'][number]>) => {
    commit({ ...model, lineItems: model.lineItems.map((li) => (li.id === id ? { ...li, ...patch } as typeof li : li)) })
  }

  const clampZoom = (v: number) => Math.min(2, Math.max(0.5, Math.round(v * 10) / 10))
  const zoomIn = () => setZoom((z) => clampZoom(z + 0.1))
  const zoomOut = () => setZoom((z) => clampZoom(z - 0.1))

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

  const sheetItem = sheetItemId !== null ? model.lineItems.find((li) => li.id === sheetItemId) : null

  return (
    <div className="flex min-h-screen flex-col print:min-h-0" onKeyDown={(e: KeyboardEvent) => handleKeyDown(e)}>
      {/* Header: brand + undo/redo + zoom + save + page-size + Print preview (desktop) */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-4 print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold tracking-tight">Paperchaser</span>
          <div className="hidden items-center gap-1 lg:flex">
            <button type="button" aria-label="Undo" disabled={pastEmpty} onClick={undo} className={cn('rounded p-1 hover:bg-foreground/10', pastEmpty && 'opacity-30')}>
              <Undo2 className="size-4" />
            </button>
            <button type="button" aria-label="Redo" disabled={futureEmpty} onClick={redo} className={cn('rounded p-1 hover:bg-foreground/10', futureEmpty && 'opacity-30')}>
              <Redo2 className="size-4" />
            </button>
          </div>
          {/* 04-05: zoom controls — desktop only (D-24), hidden on <1024px */}
          <div className="hidden items-center gap-1 lg:flex">
            <button type="button" aria-label="Zoom out" disabled={zoom <= 0.5} onClick={zoomOut} className={cn('rounded p-1 hover:bg-foreground/10', zoom <= 0.5 && 'opacity-30')}>
              <ZoomOut className="size-4" />
            </button>
            <span className="min-w-[3ch] text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Zoom in" disabled={zoom >= 2} onClick={zoomIn} className={cn('rounded p-1 hover:bg-foreground/10', zoom >= 2 && 'opacity-30')}>
              <ZoomIn className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile: undo/redo icon buttons + preview toggle, save indicator */}
          <div className="flex items-center gap-1 lg:hidden">
            <button type="button" aria-label="Undo" disabled={pastEmpty} onClick={undo} className={cn('rounded p-1 hover:bg-foreground/10', pastEmpty && 'opacity-30')}>
              <Undo2 className="size-4" />
            </button>
            <button type="button" aria-label="Redo" disabled={futureEmpty} onClick={redo} className={cn('rounded p-1 hover:bg-foreground/10', futureEmpty && 'opacity-30')}>
              <Redo2 className="size-4" />
            </button>
            <button
              type="button"
              aria-label={mobilePreviewVisible ? 'Hide preview' : 'Show preview'}
              onClick={() => setMobilePreviewVisible((v) => !v)}
              className="rounded p-1 hover:bg-foreground/10"
            >
              {mobilePreviewVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {saveIndicator()}
          <Select
            value={currentPageSize}
            onValueChange={(next) => {
              if (next !== null && (next === 'a4' || next === 'a5' || next === 'a3')) handlePageSizeChange(next)
            }}
          >
            <SelectTrigger size="sm" aria-label="Page size" className="hidden lg:flex">
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
          <Button onClick={() => setPreviewOpen(true)} className="hidden lg:inline-flex">
            Print preview
          </Button>
          <Button onClick={() => setPreviewOpen(true)} size="sm" className="lg:hidden">
            Preview
          </Button>
        </div>
      </header>

      {/* Desktop: three-pane (≥1024px) — BUIL-01 */}
      <main className="hidden flex-1 overflow-hidden print:min-h-0 lg:flex">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-foreground/10 bg-card p-3 print:hidden">
          <OutlinePane
            model={model}
            selectedBlockId={selectedBlockId}
            selectedItemId={selectedItemId}
            onSelect={handleOutlineSelect}
            onToggleVisibility={handleToggleVisibility}
            onAddItem={handleAddItem}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onReorder={handleReorder}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        </aside>

        <div className="flex flex-1 justify-center overflow-auto px-2 pb-10 print:pb-0">
          {/* Zoom wrapper — CSS transform scale, print:scale-100 resets for parity */}
          <div
            className="print:scale-100 print:!transform-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)' }}
          >
            <DocumentPage
              model={model}
              template={currentTemplate}
              branding={model.branding}
              pageSize={currentPageSize}
              editable={editable}
              onCustomerNameCommit={editable ? handleCustomerNameCommit : undefined}
              onCommit={editable ? handleCommit : undefined}
            />
          </div>
        </div>

        <aside className="w-56 shrink-0 overflow-y-auto border-l border-foreground/10 bg-card p-3 print:hidden">
          <PropertiesPane
            model={model}
            template={currentTemplate ?? model.template ?? 'minimal'}
            selectedItemId={selectedItemId}
            onTemplateChange={handleTemplateChange}
            onBrandingChange={handleBrandingChange}
            onLogoChange={handleLogoChange}
            onPageSizeChange={handlePageSizeChange}
            onLineItemChange={handleLineItemChange}
          />
        </aside>
      </main>

      {/* Mobile: stacked (<1024px) — header + sticky preview + editor surface (D-20, D-22) */}
      <div className="flex flex-1 flex-col lg:hidden">
        {saveState === 'failed' && (
          <div className="mx-4 mt-2 rounded bg-destructive px-3 py-2 text-sm text-destructive-foreground">Not saved — retry</div>
        )}
        {mobilePreviewVisible && (
          <div className="sticky top-0 z-10 border-b bg-card p-2">
            <div className="flex justify-center overflow-auto">
              <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
                <DocumentPage
                  model={model}
                  template={currentTemplate}
                  branding={model.branding}
                  pageSize={currentPageSize}
                  editable={false}
                />
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          <h2 className="text-sm font-semibold">Outline</h2>
          <OutlinePane
            model={model}
            selectedBlockId={selectedBlockId}
            selectedItemId={selectedItemId}
            onSelect={handleOutlineSelect}
            onToggleVisibility={handleToggleVisibility}
            onAddItem={handleAddItem}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onReorder={handleReorder}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
          <div className="pt-2">
            <h3 className="mb-1 text-xs font-semibold text-muted-foreground">Document</h3>
            <div className="space-y-2">
              {model.lineItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSheetItemId(item.id)}
                  className="flex w-full items-center justify-between rounded border p-2 text-left text-sm hover:bg-accent"
                >
                  <span className="truncate">{getPlainText(item.title) || `Item ${idx + 1}`}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">{getPlainText(item.description).slice(0, 30)}</span>
                </button>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleAddItem}>
                Add item
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PrintPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        model={model}
        template={currentTemplate}
        branding={model.branding}
        pageSize={currentPageSize}
      />

      {/* Mobile bottom sheet for selected line item (D-20) */}
      <BottomSheet open={sheetItemId !== null} onOpenChange={(open) => { if (!open) setSheetItemId(null) }} title={sheetItem ? (getPlainText(sheetItem.title) || 'Item') : 'Item'}>
        {sheetItem != null && (
          <div className="space-y-4">
            <PropertiesPane
              model={model}
              template={currentTemplate ?? model.template ?? 'minimal'}
              selectedItemId={sheetItem.id}
              onTemplateChange={handleTemplateChange}
              onBrandingChange={handleBrandingChange}
              onLogoChange={handleLogoChange}
              onPageSizeChange={handlePageSizeChange}
              onLineItemChange={handleLineItemChange}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => handleMoveUp(sheetItem.id)} disabled={model.lineItems.findIndex((li) => li.id === sheetItem.id) === 0}>
                Move up
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleMoveDown(sheetItem.id)}
                disabled={model.lineItems.findIndex((li) => li.id === sheetItem.id) === model.lineItems.length - 1}
              >
                Move down
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

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
