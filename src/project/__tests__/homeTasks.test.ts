import { describe, expect, it } from 'vitest'
import { newInvoice } from '../../document/newInvoice'
import type { DocumentModel } from '../../document/types'
import { nextStep, receiptsToSend } from '../homeTasks'

const doc = (type: DocumentModel['type'], status: DocumentModel['status'], extra: Partial<DocumentModel> = {}): DocumentModel => ({
  ...newInvoice({ id: `${type}-${status}`, projectId: 'p', today: '2026-10-08' }),
  type,
  status,
  ...extra,
})

describe('nextStep', () => {
  it('names the first step that is not finished and counts the finished ones', () => {
    expect(nextStep([], [])).toEqual({ next: 'quote', done: 0, total: 10 })
    expect(nextStep([doc('quote', 'sent')], ['quote', 'agreement'])).toEqual({ next: 'welcome', done: 2, total: 10 })
  })

  it('skips a step whose document is already sent', () => {
    expect(nextStep([doc('quote', 'sent')], []).next).toBe('agreement')
  })

  it('has no next step once every step is done', () => {
    const steps = ['quote', 'agreement', 'welcome', 'brief', 'deliveryGuide', 'thankYou', 'feedback']
    const multi = [doc('invoice', 'paid'), doc('monthlyReport', 'sent'), doc('receipt', 'sent')]
    expect(nextStep(multi, steps)).toEqual({ next: null, done: 10, total: 10 })
  })
})

describe('receiptsToSend', () => {
  it('lists payments on invoices that no receipt confirms yet', () => {
    const invoice = doc('invoice', 'paid', { id: 'inv', payments: [{ id: 'pay1', date: '2026-10-07', amountMinor: 5000, method: 'bank' }, { id: 'pay2', date: '2026-10-08', amountMinor: 2000, method: 'bank' }] })
    const receipt = doc('receipt', 'sent', { id: 'r1', receiptFor: { invoiceId: 'inv', paymentId: 'pay1' } })
    expect(receiptsToSend([invoice, receipt]).map((r) => r.payment.id)).toEqual(['pay2'])
  })

  it('ignores refunds and void invoices', () => {
    const refund = doc('invoice', 'sent', { id: 'a', payments: [{ id: 'x', date: '2026-10-07', amountMinor: -500, method: 'bank' }] })
    const voided = doc('invoice', 'void', { id: 'b', payments: [{ id: 'y', date: '2026-10-07', amountMinor: 500, method: 'bank' }] })
    expect(receiptsToSend([refund, voided])).toEqual([])
  })
})
