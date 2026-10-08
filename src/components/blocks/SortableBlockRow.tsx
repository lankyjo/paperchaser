import type { CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, GripVertical, Trash2 } from 'lucide-react'
import { blockSummary, type Block } from '../../document/blocks'
import { BLOCK_LABELS } from '../../strings/blockLabels'

interface SortableBlockRowProps {
  block: Block
  canHide: boolean
  canRemove: boolean
  onToggleHidden: () => void
  onRemove: () => void
}

const ICON_BUTTON = 'flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-foreground/10 hover:text-foreground'

// One section in the outline: drag handle, label and summary, show or hide, and remove.
export function SortableBlockRow({ block, canHide, canRemove, onToggleHidden, onRemove }: SortableBlockRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }
  const label = BLOCK_LABELS[block.type]
  return (
    <li ref={setNodeRef} style={style} className="group flex items-center gap-1 rounded-md border bg-background py-1 pr-1 pl-0.5">
      <button type="button" aria-label={`Drag ${label}`} className={`${ICON_BUTTON} cursor-grab touch-none active:cursor-grabbing`} {...attributes} {...listeners}>
        <GripVertical className="size-3.5" />
      </button>
      <span className={`min-w-0 flex-1 truncate ${block.hidden ? 'text-muted-foreground line-through' : ''}`}>
        <span className="font-medium">{label}</span> <span className="text-muted-foreground">{blockSummary(block)}</span>
      </span>
      {canHide && (
        <button type="button" aria-label={`${block.hidden ? 'Show' : 'Hide'} ${label}`} onClick={onToggleHidden} className={ICON_BUTTON}>
          {block.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      )}
      {canRemove && (
        <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className={`${ICON_BUTTON} hover:text-destructive`}>
          <Trash2 className="size-3.5" />
        </button>
      )}
    </li>
  )
}
