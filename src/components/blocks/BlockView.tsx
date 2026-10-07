import type { ComponentType } from 'react'
import type { Block, ContentBlock, ContentBlockType } from '../../document/blocks'
import type { DocumentModel } from '../../document/types'
import { ChartBlockView } from './ChartBlockView'
import { ChecklistBlockView } from './ChecklistBlockView'
import { HeadingBlockView } from './HeadingBlockView'
import { ImageBlockView } from './ImageBlockView'
import { KeyValueBlockView } from './KeyValueBlockView'
import { MetricsBlockView } from './MetricsBlockView'
import { PaymentScheduleBlockView } from './PaymentScheduleBlockView'
import { RatingBlockView } from './RatingBlockView'
import { SignatureBlockView } from './SignatureBlockView'
import { RichTextBlockView } from './RichTextBlockView'
import { StepsBlockView } from './StepsBlockView'
import { TableBlockView } from './TableBlockView'

// range limits a splittable block to a [from, to) slice of its rows, paragraphs or steps when split across pages.
type BlockViewProps<T extends ContentBlockType> = { block: Extract<Block, { type: T }>; model: DocumentModel; onChange?: (next: Block) => void; range?: [number, number] }

const views: { [T in ContentBlockType]: ComponentType<BlockViewProps<T>> } = {
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
  paymentSchedule: PaymentScheduleBlockView,
}

// Renders one block with the view for its type; editable when onChange is given.
export function BlockView({ block, model, onChange, range }: { block: ContentBlock; model: DocumentModel; onChange?: (next: Block) => void; range?: [number, number] }) {
  const View = views[block.type] as ComponentType<BlockViewProps<ContentBlockType>>
  return (
    <div style={{ marginBottom: 'var(--tpl-section-gap)' }}>
      <View block={block} model={model} onChange={onChange} range={range} />
    </div>
  )
}
