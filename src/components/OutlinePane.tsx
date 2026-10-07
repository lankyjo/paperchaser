import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import type { DocumentModel } from '../document/types'
import { getPlainText } from '../document/richtext'
import { DeleteItemDialog } from './outline/DeleteItemDialog'
import { OutlineLineItems } from './outline/OutlineLineItems'
import { cn } from '@/lib/utils'

export type BlockId = 'header' | 'items' | 'footer'

export interface OutlinePaneProps {
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

// Header and footer frame every page; bill to, items and totals are ordered in the sections list.
const BLOCKS: Array<{ id: BlockId; label: string }> = [
  { id: 'header', label: 'Header' },
  { id: 'items', label: 'Items' },
  { id: 'footer', label: 'Footer' },
]

// Left-pane outline: header and footer visibility, and the line items under Items.
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
  const visibility = model.settings?.blockVisibility ?? {}
  const lineItems = model.lineItems ?? []
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const isVisible = (blockId: BlockId): boolean => visibility[blockId] !== false

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
              {!isItemsBlock && <button
                type="button"
                aria-label={visible ? `Hide ${block.label}` : `Show ${block.label}`}
                className="shrink-0 rounded p-0.5 hover:bg-foreground/10"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleVisibility(block.id, !visible)
                }}
              >
                {visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
              </button>}
            </div>

            {isItemsBlock && (
              <OutlineLineItems
                lineItems={lineItems}
                selectedItemId={selectedItemId}
                onSelectItem={(itemId) => onSelect('items', itemId)}
                onDeleteRequest={setConfirmDeleteId}
                onAddItem={onAddItem}
                onDuplicate={onDuplicate}
                onReorder={onReorder}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
              />
            )}
          </div>
        )
      })}

      <DeleteItemDialog
        open={confirmDeleteId !== null}
        itemTitle={confirmItem ? (getPlainText(confirmItem.title) || 'this item') : 'this item'}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId !== null) {
            onDelete?.(confirmDeleteId)
            setConfirmDeleteId(null)
          }
        }}
      />
    </div>
  )
}
