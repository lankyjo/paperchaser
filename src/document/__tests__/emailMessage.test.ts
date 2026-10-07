import { describe, expect, it } from 'vitest'

import { emailMessage } from '../emailMessage'
import { finalizeDocument } from '../finalize'
import { newInvoice } from '../newInvoice'
import type { DocumentModel } from '../types'

const base: DocumentModel = {
  ...newInvoice({ id: 'i', projectId: 'p', today: '2026-10-07' }),
  locale: 'en-US',
  company: { name: 'Northwind Studio', address: [], email: '', logo: null },
  customer: { name: 'Acme Coffee', address: [] },
  lineItems: [{ id: 'l', title: 'Work', description: '', quantity: 1, unitPriceMinor: 10000, taxRateMinor: 0 }],
}

describe('emailMessage', () => {
  it('writes an invoice email with number, amount and due date from the sent figures', () => {
    const sent = finalizeDocument(base, 'INV-0007', '2026-10-07T00:00:00.000Z')
    expect(emailMessage(sent)).toEqual({
      subject: 'Invoice INV-0007 from Northwind Studio',
      body: 'Hi Acme Coffee,\n\nPlease find attached invoice INV-0007 for €100.00, due on 10/21/2026.\n\nThank you,\nNorthwind Studio',
    })
  })

  it('adapts the wording to other document types', () => {
    const welcome = finalizeDocument({ ...base, type: 'welcome', blocks: [] }, null, '2026-10-07T00:00:00.000Z')
    expect(emailMessage(welcome).body).toContain('Please find attached our welcome document')
  })
})
