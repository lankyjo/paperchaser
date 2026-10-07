import type { ComponentType } from 'react'
import type { Block, BlockType } from '../../document/blocks'
import { HeadingBlockView } from './HeadingBlockView'
import { KeyValueBlockView } from './KeyValueBlockView'
import { RichTextBlockView } from './RichTextBlockView'

type BlockViewProps<T extends BlockType> = { block: Extract<Block, { type: T }>; onChange?: (next: Block) => void }

const views: { [T in BlockType]: ComponentType<BlockViewProps<T>> } = {
  heading: HeadingBlockView,
  richText: RichTextBlockView,
  keyValue: KeyValueBlockView,
}

// Renders one block with the view for its type; editable when onChange is given.
export function BlockView({ block, onChange }: { block: Block; onChange?: (next: Block) => void }) {
  const View = views[block.type] as ComponentType<BlockViewProps<BlockType>>
  return (
    <div style={{ marginBottom: 'var(--tpl-section-gap)' }}>
      <View block={block} onChange={onChange} />
    </div>
  )
}
