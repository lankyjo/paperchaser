import { describe, expect, it } from 'vitest'

import { canVoid, creditedTotal, newCreditNote, voidDocument } from '../credits'
import { finalizeDocument } from '../finalize'
import { newInvoice } from '../newInvoice'
import { invoiceBalance, paymentStatus } from '../payments'
import { documentSchema, type DocumentModel } from '../types'

const invoice = finalizeDocument(
  { ...newInvoice({ id: 'i1', projectId: 'p1', today: '2026-10-07' }), taxMode: 'inclusive', lineItems: [{ id: 'l', title: 'Design', description: '', quantity: 1, unitPriceMinor: 10000, taxRateMinor: 1900 }] },
  'INV-0007',
  '2026-10-07T10:00:00.000Z',
)
const paid: DocumentModel = { ...invoice, payments: [{ id: 'p', date: '2026-10-08', amountMinor: 4000, method: 'Bank' }] }

describe('void', () => {
  it('voids only sent invoices without payments, keeping the number', () => {
    expect(canVoid(invoice)).toBe(true)
    expect(canVoid(paid)).toBe(false)
    expect(voidDocument(invoice)).toMatchObject({ status: 'void', number: 'INV-0007' })
  })
})

describe('credit notes', () => {
  it('copies the invoice lines, currency and tax mode, and points back to the invoice', () => {
    const credit = newCreditNote(paid, { id: 'c1', today: '2026-10-09' })
    expect(documentSchema.parse(credit)).toEqual(credit)
    expect(credit).toMatchObject({ type: 'creditNote', status: 'draft', number: '', creditFor: 'i1', taxMode: 'inclusive', currency: paid.currency })
    expect(credit.lineItems.map((l) => l.unitPriceMinor)).toEqual([10000])
    expect(credit.payments).toBeUndefined()
  })

  it('reduces the invoice balance once the credit note is sent, but not while it is a draft or void', () => {
    const credit = { ...newCreditNote(paid, { id: 'c1', today: '2026-10-09' }), lineItems: [{ id: 'x', title: 'Refund', description: '', quantity: 1, unitPriceMinor: 6000, taxRateMinor: 1900 }] }
    const sentCredit = finalizeDocument(credit, 'CN-0001', '2026-10-09T10:00:00.000Z')
    expect(creditedTotal([credit], 'i1')).toBe(0)
    expect(creditedTotal([sentCredit, { ...sentCredit, id: 'c2', status: 'void' }], 'i1')).toBe(6000)
    expect(invoiceBalance(paid, creditedTotal([sentCredit], 'i1'))).toBe(0)
    expect(paymentStatus(paid, creditedTotal([sentCredit], 'i1'))).toBe('paid')
  })
})
