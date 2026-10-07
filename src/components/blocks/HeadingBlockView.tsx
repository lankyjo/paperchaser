import type { Block } from '../../document/blocks'
import { PlainTextCell } from '../edit/PlainTextCell'

type HeadingBlock = Extract<Block, { type: 'heading' }>

export function HeadingBlockView({ block, onChange }: { block: HeadingBlock; onChange?: (next: Block) => void }) {
  return (
    <h2 style={{ fontFamily: 'var(--tpl-font-heading)', color: 'var(--tpl-ink)', fontSize: '20px', margin: '0 0 8px' }}>
      <PlainTextCell value={block.text} placeholder="Heading" editable={onChange !== undefined} onCommit={(text) => onChange?.({ ...block, text })} />
    </h2>
  )
}
