import * as z from 'zod'

import { richTextDocSchema } from './richtext'

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
])

export type Block = z.infer<typeof blockSchema>
export type BlockType = Block['type']

const emptyBlock: Record<BlockType, (id: string) => Block> = {
  heading: (id) => ({ id, type: 'heading', text: '' }),
  richText: (id) => ({ id, type: 'richText', content: [{ type: 'paragraph', content: [] }] }),
  keyValue: (id) => ({ id, type: 'keyValue', title: '', rows: [{ label: '', value: '' }] }),
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
