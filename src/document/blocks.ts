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
])

export type Block = z.infer<typeof blockSchema>
export type BlockType = Block['type']

const emptyBlock: Record<BlockType, (id: string) => Block> = {
  heading: (id) => ({ id, type: 'heading', text: '' }),
  richText: (id) => ({ id, type: 'richText', content: [{ type: 'paragraph', content: [] }] }),
  keyValue: (id) => ({ id, type: 'keyValue', title: '', rows: [{ label: '', value: '' }] }),
  table: (id) => ({ id, type: 'table', columns: ['', ''], rows: [['', '']] }),
  steps: (id) => ({ id, type: 'steps', items: [{ title: '', description: '' }] }),
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
}

// Short text that identifies a block in the outline.
export function blockSummary(block: Block): string {
  return (summaries[block.type] as (b: Block) => string)(block)
}
