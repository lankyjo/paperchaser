import { describe, expect, it } from 'vitest'

import { newInvoice } from '../newInvoice'
import { watermarkFor } from '../watermark'

const invoice = { ...newInvoice({ id: 'd1', projectId: 'p1', today: '2026-10-07' }), lineItems: [{ id: 'l1', title: 'Design', description: '', quantity: 1, unitPriceMinor: 10000, taxRateMinor: 0 }] }
const sent = { ...invoice, status: 'sent' as const }
const pay = (amountMinor: number) => [{ id: 'p', date: '2026-10-08', amountMinor, method: 'bank' }]

describe('watermarkFor', () => {
  it('stamps drafts and void documents, never a plain sent one', () => {
    expect(watermarkFor(invoice, undefined)).toBe('DRAFT')
    expect(watermarkFor({ ...sent, status: 'void' }, undefined)).toBe('VOID')
    expect(watermarkFor(sent, undefined)).toBeNull()
  })

  it('shows payment progress on sent invoices', () => {
    expect(watermarkFor({ ...sent, payments: pay(4000) }, undefined)).toBe('PARTLY PAID')
    expect(watermarkFor({ ...sent, payments: pay(10000) }, undefined)).toBe('PAID')
    expect(watermarkFor({ ...sent, type: 'receipt', payments: pay(10000) }, undefined)).toBeNull()
  })

  it('lets branding force a stamp', () => {
    expect(watermarkFor(sent, { watermark: 'draft' })).toBe('DRAFT')
    expect(watermarkFor(invoice, { watermark: 'paid' })).toBe('PAID')
  })
})
