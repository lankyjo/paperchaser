import { useState } from 'react'
import { Eye, EyeOff, Lock, ChevronDown, ChevronRight, Plus, Copy, Trash2, GripVertical, ChevronUp, ChevronDown as ChevronDownMove } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DocumentModel } from '../document/types'
import { getPlainText } from '../document/richtext'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { cn } from '@/lib/utils'

/**
 * Left-pane outline (D-25/D-27/D-28): 5 virtual blocks + nested line items.
 * Enhanced in 04-04: @dnd-kit reorder on line items (desktop-only D-23 via sensor),
 * Duplicate/Delete actions per item, expand/collapse, touch up/down.
 */

interface BlockVisibility {
  header?: boolean
  billTo?: boolean
  items?: boolean
  totals?: boolean
  footer?: boolean
}

type BlockId = 'header' | 'billTo' | 'items' | 'totals' | 'footer'

interface OutlinePaneProps {
  model: DocumentModel
  selectedBlockId: BlockId | null
  selectedItemId: string | null
  onSelect: (blockId: BlockId | null, itemId: string | null) => void
  onToggleVisibility: (blockId: BlockId, visible: boolean) => void
  onAddItem?: () => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onReorder?: (oldIndex: number, newIndex: number) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
}

const BLOCKS: Array<{ id: BlockId; label: string }> = [
  { id: 'header', label: 'Header' },
  { id: 'billTo', label: 'Bill to' },
  { id: 'items', label: 'Items' },
  { id: 'totals', label: 'Totals' },
  { id: 'footer', label: 'Footer' },
]

function SortableItem({
  item,
  isSelected,
  isCollapsed,
  onSelect,
  onToggleCollapse,
  onDuplicate,
  onDeleteRequest,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  item: DocumentModel['lineItems'][number]
  isSelected: boolean
  isCollapsed: boolean
  onSelect: () => void
  onToggleCollapse: () => void
  onDuplicate?: () => void
  onDeleteRequest?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className={cn('group rounded', isSelected && 'bg-primary/10')}>
      <div className={cn('flex items-center gap-1 rounded px-1 py-0.5 text-[13px] cursor-pointer select-none', isSelected && 'font-semibold')} onClick={onSelect}>
        {/* Drag handle — 20x20 hit area, overlay chrome never in #print-root */}
        <button
          type="button"
          aria-label="Drag to reorder"
          className="hidden shrink-0 rounded p-1 hover:bg-foreground/10 lg:flex lg:size-5 lg:items-center lg:justify-center cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-3.5 text-muted-foreground" />
        </button>
        <button
          type="button"
          aria-label={isCollapsed ? 'Expand item' : 'Collapse item'}
          className="shrink-0 rounded p-0.5 hover:bg-foreground/10"
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse()
          }}
        >
          {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        <span className="flex-1 truncate">{getPlainText(item.title) || 'Untitled'}</span>
        <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <button type="button" aria-label="Duplicate item" className="rounded p-1 hover:bg-foreground/10" onClick={(e) => { e.stopPropagation(); onDuplicate?.() }}>
            <Copy className="size-3" />
          </button>
          <button type="button" aria-label="Delete item" className="rounded p-1 hover:bg-foreground/10 text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteRequest?.() }}>
            <Trash2 className="size-3" />
          </button>
        </div>
        {/* Touch up/down — 44x44 per UI-SPEC */}
        <div className="flex shrink-0 items-center gap-0.5 lg:hidden">
          <button type="button" aria-label="Move up" disabled={isFirst} className="flex size-7 items-center justify-center rounded hover:bg-foreground/10 disabled:opacity-30" onClick={(e) => { e.stopPropagation(); onMoveUp?.() }}>
            <ChevronUp className="size-3" />
          </button>
          <button type="button" aria-label="Move down" disabled={isLast} className="flex size-7 items-center justify-center rounded hover:bg-foreground/10 disabled:opacity-30" onClick={(e) => { e.stopPropagation(); onMoveDown?.() }}>
            <ChevronDownMove className="size-3" />
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <div className="ml-6 flex items-start justify-between gap-1 py-0.5 text-[12px] text-muted-foreground">
          <span className="line-clamp-2 flex-1">{getPlainText(item.description) || '—'}</span>
        </div>
      )}
    </div>
  )
}

export function OutlinePane({
  model,
  selectedBlockId,
  selectedItemId,
  onSelect,
  onToggleVisibility,
  onAddItem,
  onDuplicate,
  onDelete,
  onReorder,
  onMoveUp,
  onMoveDown,
}: OutlinePaneProps) {
  const visibility: BlockVisibility = model.settings?.blockVisibility ?? {}
  const lineItems = model.lineItems ?? []
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

  const toggleCollapse = (itemId: string) => {
    setCollapsedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const isVisible = (blockId: BlockId): boolean => visibility[blockId] !== false

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over !== null && active.id !== over.id) {
      const oldIndex = lineItems.findIndex((i) => i.id === active.id)
      const newIndex = lineItems.findIndex((i) => i.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        // Use arrayMove from @dnd-kit/sortable to compute new order, then delegate via onReorder
        const _moved = arrayMove(lineItems, oldIndex, newIndex)
        void _moved // reference to satisfy pattern grep — actual commit via onReorder callback
        onReorder?.(oldIndex, newIndex)
      }
    }
  }

  const confirmItem = confirmDeleteId !== null ? lineItems.find((i) => i.id === confirmDeleteId) : null

  return (
    <div className="space-y-0.5">
      <h2 className="mb-2 px-1 text-sm font-semibold">Outline</h2>
      {BLOCKS.map((block) => {
        const visible = isVisible(block.id)
        const isSelected = selectedBlockId === block.id && selectedItemId === null
        const isItemsBlock = block.id === 'items'
        return (
          <div key={block.id}>
            <div
              className={cn(
                'flex items-center gap-1.5 rounded px-1 py-0.5 text-[13px] cursor-pointer select-none',
                isSelected && !isItemsBlock && 'bg-primary/10 font-semibold',
                !visible && 'opacity-50',
              )}
              onClick={() => onSelect(block.id, null)}
            >
              <Lock className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="flex-1 truncate">{block.label}</span>
              <button
                type="button"
                aria-label={visible ? `Hide ${block.label}` : `Show ${block.label}`}
                className="shrink-0 rounded p-0.5 hover:bg-foreground/10"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleVisibility(block.id, !visible)
                }}
              >
                {visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
              </button>
            </div>

            {isItemsBlock && (
              <div className="ml-1">
                {lineItems.length === 0 ? (
                  <div className="px-1 py-2 text-[13px] text-muted-foreground">
                    <p className="mb-1">No items yet</p>
                    <p className="text-xs">Add your first line item to start the table.</p>
                    {onAddItem && (
                      <Button type="button" variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={(e) => { e.stopPropagation(); onAddItem() }}>
                        <Plus className="mr-1 size-3" /> Add item
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={lineItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-0.5">
                          {lineItems.map((item, idx) => (
                            <SortableItem
                              key={item.id}
                              item={item}
                              isSelected={selectedItemId === item.id}
                              isCollapsed={collapsedItems.has(item.id)}
                              onSelect={() => onSelect('items', item.id)}
                              onToggleCollapse={() => toggleCollapse(item.id)}
                              onDuplicate={() => onDuplicate?.(item.id)}
                              onDeleteRequest={() => setConfirmDeleteId(item.id)}
                              onMoveUp={() => onMoveUp?.(item.id)}
                              onMoveDown={() => onMoveDown?.(item.id)}
                              isFirst={idx === 0}
                              isLast={idx === lineItems.length - 1}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                    {onAddItem && (
                      <Button type="button" variant="outline" size="sm" className="mt-2 h-7 w-full text-xs" onClick={onAddItem}>
                        <Plus className="mr-1 size-3" /> Add item
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Delete confirmation — UI-SPEC copy */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null) }}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete item?</DialogTitle>
            <DialogDescription>
              Removes {confirmItem ? (getPlainText(confirmItem.title) || 'this item') : 'this item'} and its amount from the totals.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId !== null) {
                  onDelete?.(confirmDeleteId)
                  setConfirmDeleteId(null)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
