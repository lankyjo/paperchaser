import { describe, expect, it } from 'vitest'

import { moneyDocumentsCsv } from '../csvExport'
import { finalizeDocument } from '../finalize'
import { newInvoice } from '../newInvoice'
import type { DocumentModel } from '../types'

const invoice = (id: string, issueDate: string, customer: string): DocumentModel => ({
  ...finalizeDocument(
    {
      ...newInvoice({ id, projectId: 'p', today: issueDate }),
      customer: { name: customer, address: [] },
      lineItems: [{ id: 'l', title: 'Work', description: '', quantity: 1, unitPriceMinor: 10000, taxRateMinor: 1900 }],
    },
    `INV-${id}`,
    `${issueDate}T00:00:00.000Z`,
  ),
  payments: [{ id: 'p', date: issueDate, amountMinor: 5000, method: 'Bank' }],
})

describe('moneyDocumentsCsv', () => {
  it('writes one row per sent money document in the date range, with amounts in major units and quoted text', () => {
    const docs = [invoice('1', '2026-09-30', 'Acme, Inc.'), invoice('2', '2026-10-05', 'Say "hi" Ltd'), { ...invoice('3', '2026-10-06', 'Draft Co'), status: 'draft' as const }]
    const csv = moneyDocumentsCsv(docs, { from: '2026-10-01', to: '2026-10-31' })
    expect(csv.split('\n')).toEqual([
      'Number,Type,Issued,Due,Client,Currency,Subtotal,Tax,Total,Paid,Balance,Status',
      'INV-2,Invoice,2026-10-05,2026-10-19,"Say ""hi"" Ltd",EUR,100.00,19.00,119.00,50.00,69.00,sent',
    ])
    expect(moneyDocumentsCsv(docs, { from: '2026-09-01', to: '2026-09-30' })).toContain('"Acme, Inc."')
  })
})
