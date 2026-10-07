import type { CSSProperties, MouseEvent } from 'react'
import { ChevronDown, ChevronRight, Copy, Trash2, GripVertical, ChevronUp, ChevronDown as ChevronDownMove } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DocumentModel } from '../../document/types'
import { getPlainText } from '../../document/richtext'
import { cn } from '@/lib/utils'

// Row buttons sit inside the clickable row, so they stop the click from also selecting it.
const withoutRowSelect = (action?: () => void) => (e: MouseEvent) => {
  e.stopPropagation()
  action?.()
}

// Draggable outline row for one line item, with collapse, duplicate, delete and touch move buttons.
export function SortableOutlineItem({
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
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className={cn('group rounded', isSelected && 'bg-primary/10')}>
      <div aria-current={isSelected || undefined} className={cn('flex items-center gap-1 rounded px-1 py-0.5 text-[13px] cursor-pointer select-none', isSelected && 'font-semibold')} onClick={onSelect}>
        <button
          type="button"
          aria-label="Drag to reorder"
          className="hidden shrink-0 rounded p-1 hover:bg-foreground/10 lg:flex lg:size-5 lg:items-center lg:justify-center cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={withoutRowSelect()}
        >
          <GripVertical className="size-3.5 text-muted-foreground" />
        </button>
        <button
          type="button"
          aria-label={isCollapsed ? 'Expand item' : 'Collapse item'}
          className="shrink-0 rounded p-0.5 hover:bg-foreground/10"
          onClick={withoutRowSelect(onToggleCollapse)}
        >
          {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        <span className="flex-1 truncate">{getPlainText(item.title) || 'Untitled'}</span>
        <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <button type="button" aria-label="Duplicate item" className="rounded p-1 hover:bg-foreground/10" onClick={withoutRowSelect(onDuplicate)}>
            <Copy className="size-3" />
          </button>
          <button type="button" aria-label="Delete item" className="rounded p-1 hover:bg-foreground/10 text-destructive" onClick={withoutRowSelect(onDeleteRequest)}>
            <Trash2 className="size-3" />
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 lg:hidden">
          <button type="button" aria-label="Move up" disabled={isFirst} className="flex size-7 items-center justify-center rounded hover:bg-foreground/10 disabled:opacity-30" onClick={withoutRowSelect(onMoveUp)}>
            <ChevronUp className="size-3" />
          </button>
          <button type="button" aria-label="Move down" disabled={isLast} className="flex size-7 items-center justify-center rounded hover:bg-foreground/10 disabled:opacity-30" onClick={withoutRowSelect(onMoveDown)}>
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
