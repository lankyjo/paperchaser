import type { BlockType } from '../document/blocks'

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Heading',
  richText: 'Text',
  keyValue: 'Details list',
  table: 'Table',
  steps: 'Numbered steps',
  metrics: 'Metric tiles',
  chart: 'Chart',
  rating: 'Rating questions',
  checklist: 'Checklist',
  image: 'Image',
}
