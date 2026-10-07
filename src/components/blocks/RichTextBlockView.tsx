import type { Block } from '../../document/blocks'
import { AstView } from '../edit/AstView'
import { RichTextCell } from '../edit/RichTextCell'

type RichTextBlock = Extract<Block, { type: 'richText' }>

// Read-only text renders one unit per top-level paragraph or list so pagination can break between them.
export function RichTextBlockView({ block, onChange, range }: { block: RichTextBlock; onChange?: (next: Block) => void; range?: [number, number] }) {
  if (!onChange) {
    return (
      <div>
        {block.content.slice(...(range ?? [])).map((node, i) => (
          <div key={i} data-unit>
            <AstView value={[node]} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <RichTextCell
      key={JSON.stringify(block.content)}
      text={block.content}
      placeholder="Write something"
      onCommit={(content) => onChange({ ...block, content })}
    />
  )
}
