import { describe, expect, it } from 'vitest'

import { finalizeDocument } from '../finalize'
import { newInvoice } from '../newInvoice'
import { invoiceBalance, newReceiptForPayment, paymentStatus, type Payment } from '../payments'
import { documentSchema, type DocumentModel } from '../types'

const invoice = finalizeDocument(
  { ...newInvoice({ id: 'i1', projectId: 'p1', today: '2026-10-07' }), lineItems: [{ id: 'l', title: 'Design', description: '', quantity: 1, unitPriceMinor: 10000, taxRateMinor: 0 }] },
  'INV-0007',
  '2026-10-07T10:00:00.000Z',
)
const pay = (id: string, amountMinor: number): Payment => ({ id, date: '2026-10-10', amountMinor, method: 'Bank transfer' })
const withPayments = (...payments: Payment[]): DocumentModel => ({ ...invoice, payments })

describe('invoiceBalance and paymentStatus', () => {
  it('derives unpaid, partly paid, paid and overpaid from the recorded payments', () => {
    expect(paymentStatus(withPayments())).toBe('unpaid')
    expect(invoiceBalance(withPayments(pay('a', 4000)))).toBe(6000)
    expect(paymentStatus(withPayments(pay('a', 4000)))).toBe('partial')
    expect(paymentStatus(withPayments(pay('a', 4000), pay('b', 6000)))).toBe('paid')
    expect(paymentStatus(withPayments(pay('a', 12000)))).toBe('overpaid')
  })

  it('treats a refund as a negative payment', () => {
    expect(paymentStatus(withPayments(pay('a', 12000), pay('r', -2000)))).toBe('paid')
  })
})

describe('newReceiptForPayment', () => {
  it('prefills a receipt that names the invoice and the amount received', () => {
    const receipt = newReceiptForPayment(invoice, pay('a', 4000), { id: 'r1', today: '2026-10-10' })
    expect(documentSchema.parse(receipt)).toEqual(receipt)
    expect(receipt).toMatchObject({ type: 'receipt', projectId: 'p1', receiptFor: { invoiceId: 'i1', paymentId: 'a' }, customer: invoice.customer })
    expect(receipt.lineItems).toEqual([expect.objectContaining({ title: 'Payment received for INV-0007', quantity: 1, unitPriceMinor: 4000, taxRateMinor: 0 })])
  })
})
