import { creditedTotal } from './credits'
import { DOC_TYPES } from './docTypes'
import { printedTotals } from './finalize'
import { getPlainText } from './richtext'
import type { DocumentModel } from './types'

export type Payment = NonNullable<DocumentModel['payments']>[number]
type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overpaid'

// Sum of recorded payments; refunds count negative.
export const paidTotal = (doc: DocumentModel) => (doc.payments ?? []).reduce((sum, p) => sum + p.amountMinor, 0)

// What is still owed: the printed total less payments and any credits.
export function invoiceBalance(invoice: DocumentModel, creditedMinor = 0): number {
  return printedTotals(invoice).grandTotalMinor - paidTotal(invoice) - creditedMinor
}

// Sent invoices that still have a balance once payments and sent credit notes are taken off.
export function openInvoices(documents: DocumentModel[]): { invoice: DocumentModel; balanceMinor: number }[] {
  return documents
    .filter((d) => DOC_TYPES[d.type].payable && d.status === 'sent')
    .map((invoice) => ({ invoice, balanceMinor: invoiceBalance(invoice, creditedTotal(documents, invoice.id)) }))
    .filter((o) => o.balanceMinor > 0)
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
