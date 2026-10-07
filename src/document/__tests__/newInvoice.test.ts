import { describe, expect, it } from 'vitest'

import { newInvoice } from '../newInvoice'
import { documentSchema } from '../types'

describe('newInvoice', () => {
  it('creates a valid draft invoice that belongs to its project', () => {
    const invoice = newInvoice({ id: 'd1', projectId: 'p1', today: '2026-10-07' })
    expect(documentSchema.parse(invoice)).toEqual(invoice)
    expect(invoice).toMatchObject({ id: 'd1', projectId: 'p1', type: 'invoice', status: 'draft', issueDate: '2026-10-07' })
    expect(invoice.lineItems).toEqual([])
  })
})
