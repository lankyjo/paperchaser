import * as z from 'zod'

import { getPlainText, richTextDocSchema } from './richtext'

const base = { id: z.string(), hidden: z.boolean().optional() }

export const blockSchema = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('heading'), text: z.string() }),
  z.object({ ...base, type: z.literal('richText'), content: richTextDocSchema }),
  z.object({
    ...base,
    type: z.literal('keyValue'),
    title: z.string(),
    rows: z.array(z.object({ label: z.string(), value: z.string() })),
  }),
  z.object({ ...base, type: z.literal('table'), columns: z.array(z.string()), rows: z.array(z.array(z.string())) }),
  z.object({ ...base, type: z.literal('steps'), items: z.array(z.object({ title: z.string(), description: z.string() })) }),
  z.object({
    ...base,
    type: z.literal('metrics'),
    items: z.array(z.object({ label: z.string(), value: z.string(), note: z.string() })),
  }),
  z.object({
    ...base,
    type: z.literal('chart'),
    title: z.string(),
    series: z.array(z.object({ label: z.string(), value: z.number().finite() })),
  }),
  z.object({
    ...base,
    type: z.literal('rating'),
    title: z.string(),
    questions: z.array(z.object({ text: z.string(), answer: z.int().min(1).max(5).optional() })),
  }),
  z.object({
    ...base,
    type: z.literal('checklist'),
    title: z.string(),
    items: z.array(z.object({ text: z.string(), checked: z.boolean().optional() })),
  }),
  z.object({ ...base, type: z.literal('image'), assetId: z.string(), alt: z.string() }),
  z.object({
    ...base,
    type: z.literal('signature'),
    assetId: z.string(),
    name: z.string(),
    role: z.string(),
    clientLine: z.boolean(),
  }),
  z.object({
    ...base,
    type: z.literal('paymentSchedule'),
    totalMinor: z.int().nonnegative(),
    taxRateMinor: z.int().nonnegative(),
    rows: z.array(z.object({ id: z.string(), label: z.string(), percentMinor: z.int().nonnegative(), due: z.string() })),
  }),
  z.object({ ...base, type: z.literal('parties') }),
  z.object({ ...base, type: z.literal('lineItems') }),
  z.object({ ...base, type: z.literal('totals') }),
])

export type Block = z.infer<typeof blockSchema>
export type BlockType = Block['type']
export type ContentBlock = Exclude<Block, { type: 'parties' | 'lineItems' | 'totals' }>
export type ContentBlockType = ContentBlock['type']

const emptyBlock: Record<BlockType, (id: string) => Block> = {
  heading: (id) => ({ id, type: 'heading', text: '' }),
  richText: (id) => ({ id, type: 'richText', content: [{ type: 'paragraph', content: [] }] }),
  keyValue: (id) => ({ id, type: 'keyValue', title: '', rows: [{ label: '', value: '' }] }),
  table: (id) => ({ id, type: 'table', columns: ['', ''], rows: [['', '']] }),
  steps: (id) => ({ id, type: 'steps', items: [{ title: '', description: '' }] }),
  metrics: (id) => ({ id, type: 'metrics', items: [0, 1, 2].map(() => ({ label: '', value: '', note: '' })) }),
  chart: (id) => ({ id, type: 'chart', title: '', series: [{ label: '', value: 0 }, { label: '', value: 0 }] }),
  rating: (id) => ({ id, type: 'rating', title: '', questions: [{ text: '' }] }),
  checklist: (id) => ({ id, type: 'checklist', title: '', items: [{ text: '' }] }),
  image: (id) => ({ id, type: 'image', assetId: '', alt: '' }),
  signature: (id) => ({ id, type: 'signature', assetId: '', name: '', role: '', clientLine: true }),
  paymentSchedule: (id) => ({
    id,
    type: 'paymentSchedule',
    totalMinor: 0,
    taxRateMinor: 0,
    rows: [
      { id: `${id}-1`, label: 'Deposit', percentMinor: 5000, due: 'On signing' },
      { id: `${id}-2`, label: 'Balance', percentMinor: 5000, due: 'On delivery' },
    ],
  }),
  parties: (id) => ({ id, type: 'parties' }),
  lineItems: (id) => ({ id, type: 'lineItems' }),
  totals: (id) => ({ id, type: 'totals' }),
}

export function addBlock(blocks: Block[], type: BlockType, afterId: string | null, id: string): Block[] {
  const at = afterId === null ? blocks.length : blocks.findIndex((b) => b.id === afterId) + 1
  return [...blocks.slice(0, at), emptyBlock[type](id), ...blocks.slice(at)]
}

export function moveBlock(blocks: Block[], id: string, delta: -1 | 1): Block[] {
  const from = blocks.findIndex((b) => b.id === id)
  const to = from + delta
  if (from < 0 || to < 0 || to >= blocks.length) return blocks
  const next = [...blocks]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

export function toggleBlockHidden(blocks: Block[], id: string): Block[] {
  return blocks.map((b) => (b.id === id ? { ...b, hidden: !b.hidden } : b))
}

export function updateBlock(blocks: Block[], block: Block): Block[] {
  return blocks.map((b) => (b.id === block.id ? block : b))
}

const summaries: { [T in BlockType]: (block: Extract<Block, { type: T }>) => string } = {
  heading: (b) => b.text,
  richText: (b) => getPlainText(b.content),
  keyValue: (b) => b.title,
  table: (b) => b.columns.filter(Boolean).join(', '),
  steps: (b) => b.items[0]?.title ?? '',
  metrics: (b) => b.items.map((i) => i.label).filter(Boolean).join(', '),
  chart: (b) => b.title,
  rating: (b) => b.title,
  checklist: (b) => b.title,
  image: (b) => b.alt,
  signature: (b) => b.name,
  paymentSchedule: (b) => b.rows.map((r) => r.label).join(', '),
  parties: () => '',
  lineItems: () => '',
  totals: () => '',
}

// Short text that identifies a block in the outline.
export function blockSummary(block: Block): string {
  return (summaries[block.type] as (b: Block) => string)(block)
}
