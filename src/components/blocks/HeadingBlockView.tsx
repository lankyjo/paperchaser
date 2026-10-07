import type { Block } from '../../document/blocks'
import { PlainTextCell } from '../edit/PlainTextCell'

type HeadingBlock = Extract<Block, { type: 'heading' }>

export function HeadingBlockView({ block, onChange }: { block: HeadingBlock; onChange?: (next: Block) => void }) {
  return (
    <h2 className="doc-heading">
      <PlainTextCell value={block.text} placeholder="Heading" editable={onChange !== undefined} onCommit={(text) => onChange?.({ ...block, text })} />
    </h2>
  )
}
