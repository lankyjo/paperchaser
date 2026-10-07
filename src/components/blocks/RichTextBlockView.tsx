import type { Block } from '../../document/blocks'
import { AstView } from '../edit/AstView'
import { RichTextCell } from '../edit/RichTextCell'

type RichTextBlock = Extract<Block, { type: 'richText' }>

export function RichTextBlockView({ block, onChange }: { block: RichTextBlock; onChange?: (next: Block) => void }) {
  if (!onChange) return <div><AstView value={block.content} /></div>
  return (
    <RichTextCell
      key={JSON.stringify(block.content)}
      text={block.content}
      placeholder="Write something"
      onCommit={(content) => onChange({ ...block, content })}
    />
  )
}
