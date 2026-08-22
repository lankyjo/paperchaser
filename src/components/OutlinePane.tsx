import { useState } from 'react'
import { Eye, EyeOff, Lock, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import type { DocumentModel } from '../document/types'
import { getPlainText } from '../document/richtext'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

/**
 * Left-pane outline (D-25/D-27/D-28): 5 virtual blocks (Header, Bill to,
 * Items, Totals, Footer) + nested line items under Items.
 *
 * - Per-block visibility toggle (native checkbox, persisted per-document D-30).
 * - Click-to-select: selects block/item and scrolls canvas into view.
 * - Line item collapse: UI-only useState (D-28 — never in model).
 * - Fixed blocks show lock icon (D-26 — no drag handle).
 * - Empty line items: "No items yet" copy + "Add item" button (UI-SPEC).
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
}

const BLOCKS: Array<{ id: BlockId; label: string }> = [
  { id: 'header', label: 'Header' },
  { id: 'billTo', label: 'Bill to' },
  { id: 'items', label: 'Items' },
  { id: 'totals', label: 'Totals' },
  { id: 'footer', label: 'Footer' },
]

export function OutlinePane({
  model,
  selectedBlockId,
  selectedItemId,
  onSelect,
  onToggleVisibility,
  onAddItem,
}: OutlinePaneProps) {
  const visibility: BlockVisibility = model.settings?.blockVisibility ?? {}
  const lineItems = model.lineItems ?? []

  // D-28: per-item collapse is UI-only transient state
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set())

  const toggleCollapse = (itemId: string) => {
    setCollapsedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const isVisible = (blockId: BlockId): boolean => {
    // Absent settings → show all (default visible)
    const v = visibility[blockId]
    return v !== false
  }

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
              {/* D-26/D-30: visibility toggle per block */}
              <button
                type="button"
                aria-label={visible ? `Hide ${block.label}` : `Show ${block.label}`}
                className="shrink-0 rounded p-0.5 hover:bg-foreground/10"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleVisibility(block.id, !visible)
                }}
              >
                {visible ? (
                  <Eye className="size-3.5" />
                ) : (
                  <EyeOff className="size-3.5 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Nested line items (only under Items block) */}
            {isItemsBlock && (
              <div className="ml-3.5">
                {lineItems.length === 0 ? (
                  <div className="px-1 py-2 text-[13px] text-muted-foreground">
                    <p className="mb-1">No items yet</p>
                    <p className="text-xs">Add your first line item to start the table.</p>
                    {onAddItem && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddItem()
                        }}
                      >
                        <Plus className="mr-1 size-3" />
                        Add item
                      </Button>
                    )}
                  </div>
                ) : (
                  lineItems.map((item) => {
                    const isCollapsed = collapsedItems.has(item.id)
                    const isItemSelected = selectedItemId === item.id

                    return (
                      <div key={item.id}>
                        <div
                          className={cn(
                            'flex items-center gap-1 rounded px-1 py-0.5 text-[13px] cursor-pointer select-none',
                            isItemSelected && 'bg-primary/10 font-semibold',
                          )}
                          onClick={() => onSelect('items', item.id)}
                        >
                          {/* D-28: collapse toggle */}
                          <button
                            type="button"
                            aria-label={isCollapsed ? 'Expand item' : 'Collapse item'}
                            className="shrink-0 rounded p-0.5 hover:bg-foreground/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleCollapse(item.id)
                            }}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="size-3" />
                            ) : (
                              <ChevronDown className="size-3" />
                            )}
                          </button>
                          <span className="flex-1 truncate">
                            {getPlainText(item.title)}
                          </span>
                        </div>
                        {/* Collapsed → hidden; expanded → show description */}
                        {!isCollapsed && (
                          <div className="ml-6 py-0.5 text-[12px] text-muted-foreground line-clamp-2">
                            {getPlainText(item.description)}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
