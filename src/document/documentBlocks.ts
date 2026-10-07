import type { Block, BlockType } from './blocks'
import type { DocumentModel } from './types'

export const MONEY_BLOCKS: BlockType[] = ['parties', 'lineItems', 'totals']
const MONEY_TYPES = new Set<DocumentModel['type']>(['quote', 'invoice', 'receipt', 'creditNote'])
const REQUIRED_ON_MONEY = new Set<BlockType>(['lineItems', 'totals'])

export const isMoneyDocument = (doc: Pick<DocumentModel, 'type'>) => MONEY_TYPES.has(doc.type)

// The blocks a document renders; money documents saved before blocks existed get the fixed sections in order.
export function documentBlocks(doc: Pick<DocumentModel, 'type' | 'blocks' | 'settings'>): Block[] {
  if (doc.blocks !== undefined) return doc.blocks
  if (!isMoneyDocument(doc)) return []
  const visible = doc.settings?.blockVisibility ?? {}
  return [
    { id: 'parties', type: 'parties', hidden: visible.billTo === false },
    { id: 'lineItems', type: 'lineItems', hidden: visible.items === false },
    { id: 'totals', type: 'totals', hidden: visible.totals === false },
  ]
}

export const canHideBlock = (doc: Pick<DocumentModel, 'type'>, type: BlockType) => !(isMoneyDocument(doc) && REQUIRED_ON_MONEY.has(type))

// Blocks a user may add to any document; money blocks exist once and are never added.
export const ADDABLE_BLOCK_TYPES: BlockType[] = ['heading', 'richText', 'keyValue', 'table', 'steps', 'metrics', 'chart', 'rating', 'checklist', 'image', 'signature']
