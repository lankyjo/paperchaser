import { describe, expect, it } from 'vitest'

import { ADDABLE_BLOCK_TYPES, canHideBlock, canRemoveBlock, documentBlocks, isMoneyDocument, MONEY_BLOCKS } from '../documentBlocks'
import { newInvoice } from '../newInvoice'

const invoice = newInvoice({ id: 'd1', projectId: 'p1', today: '2026-10-07' })

describe('documentBlocks', () => {
  it('gives a new invoice parties, line items and totals in order', () => {
    expect(documentBlocks(invoice).map((b) => b.type)).toEqual(['parties', 'lineItems', 'totals'])
  })

  it('derives the same blocks for older invoices without blocks, keeping their hidden sections hidden', () => {
    const legacy = { ...invoice, blocks: undefined, settings: { blockVisibility: { billTo: false } } }
    expect(documentBlocks(legacy).map((b) => [b.type, b.hidden === true])).toEqual([
      ['parties', true],
      ['lineItems', false],
      ['totals', false],
    ])
  })
})

describe('money document rules', () => {
  it('never lets line items or totals be hidden on a money document', () => {
    expect(canHideBlock(invoice, 'lineItems')).toBe(false)
    expect(canHideBlock(invoice, 'totals')).toBe(false)
    expect(canHideBlock(invoice, 'parties')).toBe(true)
  })

  it('lets documents add content blocks but never a second set of money blocks', () => {
    for (const t of MONEY_BLOCKS) expect(ADDABLE_BLOCK_TYPES).not.toContain(t)
    expect(ADDABLE_BLOCK_TYPES).toContain('richText')
    expect(isMoneyDocument({ type: 'welcome' })).toBe(false)
  })
})

describe('canRemoveBlock', () => {
  it('keeps the money sections of money documents and lets every added section go', () => {
    expect(canRemoveBlock({ type: 'invoice' }, 'lineItems')).toBe(false)
    expect(canRemoveBlock({ type: 'invoice' }, 'parties')).toBe(false)
    expect(canRemoveBlock({ type: 'invoice' }, 'heading')).toBe(true)
    expect(canRemoveBlock({ type: 'welcome' }, 'richText')).toBe(true)
  })
})
