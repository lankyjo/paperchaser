import { describe, expect, it } from 'vitest'

import { countPlaceholders, preFinalizeWarnings } from '../finalizeChecks'
import { newInvoice } from '../newInvoice'
import type { DocumentModel } from '../types'

const ph = (text: string) => ({ type: 'placeholder' as const, text })
const para = (...content: object[]) => [{ type: 'paragraph' as const, content }]

const ready: DocumentModel = {
  ...newInvoice({ id: 'd1', projectId: 'p1', today: '2026-10-07' }),
  company: { name: 'Northwind', address: ['12 Harbor Lane'], email: 'a@b.test', logo: null, taxId: 'US-123' },
  customer: { name: 'Acme', address: ['300 Main St'] },
  lineItems: [{ id: 'l1', title: 'Design', description: '', quantity: 1, unitPriceMinor: 10000, taxRateMinor: 1900 }],
}

describe('countPlaceholders', () => {
  it('counts placeholder nodes in every text field and block, but not typed brackets', () => {
    const doc: DocumentModel = {
      ...ready,
      customer: { name: para(ph('Client name')) as DocumentModel['customer']['name'], address: [] },
      lineItems: [{ ...ready.lineItems[0], description: '[not a placeholder]' }],
      blocks: [...(ready.blocks ?? []), { id: 'b', type: 'richText', content: para({ type: 'text', text: 'Hi ' }, ph('Date'), ph('Venue')) as never }],
    }
    expect(countPlaceholders(doc)).toBe(3)
  })
})

describe('preFinalizeWarnings', () => {
  it('has nothing to say about a complete document', () => {
    expect(preFinalizeWarnings(ready)).toEqual([])
  })

  it('lists placeholders, a missing client address and a missing tax ID when tax is charged', () => {
    const doc: DocumentModel = {
      ...ready,
      company: { ...ready.company, taxId: '' },
      customer: { name: para(ph('Client name')) as DocumentModel['customer']['name'], address: [] },
    }
    expect(preFinalizeWarnings(doc)).toEqual([
      '1 placeholder still needs filling in',
      'The client address is missing',
      'Tax is charged but your tax ID is missing',
    ])
  })
})
