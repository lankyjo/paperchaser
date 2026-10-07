import type { ComponentType } from 'react'
import type { Block, BlockType } from '../../document/blocks'
import { ChartBlockView } from './ChartBlockView'
import { ChecklistBlockView } from './ChecklistBlockView'
import { HeadingBlockView } from './HeadingBlockView'
import { ImageBlockView } from './ImageBlockView'
import { KeyValueBlockView } from './KeyValueBlockView'
import { MetricsBlockView } from './MetricsBlockView'
import { RatingBlockView } from './RatingBlockView'
import { SignatureBlockView } from './SignatureBlockView'
import { RichTextBlockView } from './RichTextBlockView'
import { StepsBlockView } from './StepsBlockView'
import { TableBlockView } from './TableBlockView'

type BlockViewProps<T extends BlockType> = { block: Extract<Block, { type: T }>; onChange?: (next: Block) => void }

const views: { [T in BlockType]: ComponentType<BlockViewProps<T>> } = {
  heading: HeadingBlockView,
  richText: RichTextBlockView,
  keyValue: KeyValueBlockView,
  table: TableBlockView,
  steps: StepsBlockView,
  metrics: MetricsBlockView,
  chart: ChartBlockView,
  rating: RatingBlockView,
  checklist: ChecklistBlockView,
  image: ImageBlockView,
  signature: SignatureBlockView,
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
