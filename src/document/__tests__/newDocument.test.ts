import { describe, expect, it } from 'vitest'

import { PIPELINE_STEPS } from '../../project/pipeline'
import { newDocument } from '../newDocument'
import { documentSchema } from '../types'

const MONEY = new Set(['quote', 'invoice', 'receipt'])

describe('newDocument', () => {
  it('creates a valid draft for every pipeline step: money documents start with parties, line items and totals blocks', () => {
    let n = 0
    for (const { type } of PIPELINE_STEPS) {
      const doc = newDocument({ type, id: `d-${type}`, projectId: 'p1', today: '2026-10-07', newId: () => `b${n++}` })
      expect(documentSchema.parse(doc)).toEqual(doc)
      expect(doc).toMatchObject({ type, projectId: 'p1', status: 'draft' })
      const moneyBlocks = doc.blocks?.filter((b) => ['parties', 'lineItems', 'totals'].includes(b.type)).length
      expect(moneyBlocks).toBe(MONEY.has(type) ? 3 : 0)
    }
  })
})
