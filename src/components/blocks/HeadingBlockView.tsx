import type { Block } from '../../document/blocks'
import { getPlainText } from '../../document/richtext'
import { RichTextCell } from '../edit/RichTextCell'

type HeadingBlock = Extract<Block, { type: 'heading' }>

export function HeadingBlockView({ block, onChange }: { block: HeadingBlock; onChange?: (next: Block) => void }) {
  return (
    <h2 style={{ fontFamily: 'var(--tpl-font-heading)', color: 'var(--tpl-ink)', fontSize: '20px', margin: '0 0 8px' }}>
      {onChange ? (
        <RichTextCell key={block.text} text={block.text} placeholder="Heading" onCommit={(next) => onChange({ ...block, text: getPlainText(next) })} />
      ) : (
        block.text
      )}
    </h2>
  )
}
