import { printedTotals } from './finalize'
import { getPlainText } from './richtext'
import type { DocumentModel } from './types'

export type Payment = NonNullable<DocumentModel['payments']>[number]
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overpaid'

// What is still owed: the printed total less payments (refunds count negative) and any credits.
export function invoiceBalance(invoice: DocumentModel, creditedMinor = 0): number {
  const paid = (invoice.payments ?? []).reduce((sum, p) => sum + p.amountMinor, 0)
  return printedTotals(invoice).grandTotalMinor - paid - creditedMinor
}

export function paymentStatus(invoice: DocumentModel, creditedMinor = 0): PaymentStatus {
  const balance = invoiceBalance(invoice, creditedMinor)
  if (balance < 0) return 'overpaid'
  if (balance === 0) return 'paid'
  return (invoice.payments ?? []).some((p) => p.amountMinor !== 0) || creditedMinor > 0 ? 'partial' : 'unpaid'
}

// A draft receipt for one payment, addressed like the invoice it confirms.
export function newReceiptForPayment(invoice: DocumentModel, payment: Payment, { id, today }: { id: string; today: string }): DocumentModel {
  return {
    ...invoice,
    id,
    type: 'receipt',
    number: '',
    status: 'draft',
    issueDate: today,
    frozen: undefined,
    payments: undefined,
    rev: undefined,
    receiptFor: { invoiceId: invoice.id, paymentId: payment.id },
    lineItems: [
      { id: `${id}-line`, title: `Payment received for ${getPlainText(invoice.number)}`, description: `${payment.method}, ${payment.date}`, quantity: 1, unitPriceMinor: payment.amountMinor, taxRateMinor: 0 },
    ],
  }
}
