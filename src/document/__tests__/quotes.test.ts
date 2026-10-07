import { describe, expect, it } from 'vitest'

import { finalizeDocument } from '../finalize'
import { newInvoice } from '../newInvoice'
import { acceptQuote, declineQuote, quoteState, reviseQuote } from '../quotes'
import { documentSchema, type DocumentModel } from '../types'

const quote: DocumentModel = finalizeDocument(
  { ...newInvoice({ id: 'q1', projectId: 'p1', today: '2026-10-01' }), type: 'quote', validUntil: '2026-10-31', lineItems: [{ id: 'l', title: 'Rebrand', description: '', quantity: 1, unitPriceMinor: 250000, taxRateMinor: 0 }] },
  'Q-0004',
  '2026-10-01T00:00:00.000Z',
)

describe('quoteState', () => {
  it('is sent until accepted, declined, superseded or past its valid-until date', () => {
    expect(quoteState(quote, '2026-10-10')).toBe('sent')
    expect(quoteState(quote, '2026-11-01')).toBe('expired')
    expect(quoteState(acceptQuote(quote), '2026-11-01')).toBe('accepted')
    expect(quoteState(declineQuote(quote), '2026-10-10')).toBe('declined')
    expect(quoteState({ ...quote, supersededBy: 'q2' }, '2026-10-10')).toBe('superseded')
  })
})

describe('reviseQuote', () => {
  it('creates a draft revision that reuses the base number with -R2, -R3', () => {
    const r2 = reviseQuote(quote, { id: 'q2', today: '2026-10-05' })
    expect(documentSchema.parse(r2)).toEqual(r2)
    expect(r2).toMatchObject({ status: 'draft', number: '', revisionOf: 'q1', revision: 2, revisionBase: 'Q-0004' })
    const r3 = reviseQuote(finalizeDocument(r2, 'Q-0004-R2', '2026-10-05T00:00:00.000Z'), { id: 'q3', today: '2026-10-06' })
    expect(r3).toMatchObject({ revision: 3, revisionBase: 'Q-0004' })
  })
})

describe('acceptQuote', () => {
  it('refuses a superseded revision', () => {
    expect(() => acceptQuote({ ...quote, supersededBy: 'q2' })).toThrow('Only the latest revision can be accepted')
  })
})
