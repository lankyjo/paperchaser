import { ArrowDown, ArrowUp, Eye, EyeOff } from 'lucide-react'
import type { Block, BlockType } from '../../document/blocks'
import { getPlainText } from '../../document/richtext'
import { Button } from '../ui/button'

const TYPE_LABELS: Record<BlockType, string> = { heading: 'Heading', richText: 'Text', keyValue: 'Details list' }

function summary(block: Block): string {
  if (block.type === 'heading') return block.text
  if (block.type === 'keyValue') return block.title
  return getPlainText(block.content)
}

interface BlockOutlineProps {
  blocks: Block[]
  onMove: (id: string, delta: -1 | 1) => void
  onToggleHidden: (id: string) => void
  onAdd: (type: BlockType) => void
}

// Block list beside the canvas: reorder, show or hide, and add new blocks at the end.
export function BlockOutline({ blocks, onMove, onToggleHidden, onAdd }: BlockOutlineProps) {
  return (
    <nav aria-label="Blocks" className="flex flex-col gap-3 text-sm">
      <ol className="flex flex-col gap-1">
        {blocks.map((block, idx) => (
          <li key={block.id} className="flex items-center gap-1 rounded border bg-background px-2 py-1">
            <span className={`flex-1 truncate ${block.hidden ? 'text-muted-foreground line-through' : ''}`}>
              <span className="text-muted-foreground">{TYPE_LABELS[block.type]}</span> {summary(block)}
            </span>
            <button type="button" aria-label={`Move ${TYPE_LABELS[block.type]} up`} disabled={idx === 0} onClick={() => onMove(block.id, -1)} className="p-0.5 disabled:opacity-30">
              <ArrowUp className="size-3.5" />
            </button>
            <button type="button" aria-label={`Move ${TYPE_LABELS[block.type]} down`} disabled={idx === blocks.length - 1} onClick={() => onMove(block.id, 1)} className="p-0.5 disabled:opacity-30">
              <ArrowDown className="size-3.5" />
            </button>
            <button type="button" aria-label={`${block.hidden ? 'Show' : 'Hide'} ${TYPE_LABELS[block.type]}`} onClick={() => onToggleHidden(block.id)} className="p-0.5">
              {block.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-1">
        {(Object.keys(TYPE_LABELS) as BlockType[]).map((type) => (
          <Button key={type} size="sm" variant="outline" onClick={() => onAdd(type)}>
            Add {TYPE_LABELS[type].toLowerCase()}
          </Button>
        ))}
      </div>
    </nav>
  )
}
