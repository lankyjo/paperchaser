import { printedTotals } from './finalize'
import type { DocumentModel } from './types'

// Only a sent invoice nobody has paid can be voided; anything with money recorded needs a credit note.
export const canVoid = (doc: DocumentModel) => doc.status === 'sent' && (doc.payments ?? []).length === 0

// Voided documents keep their number so the sequence never has unexplained gaps.
export const voidDocument = (doc: DocumentModel): DocumentModel => ({ ...doc, status: 'void' })

// A draft credit note mirroring the invoice; the user trims the lines down to what is being credited.
export function newCreditNote(invoice: DocumentModel, { id, today }: { id: string; today: string }): DocumentModel {
  return {
    ...invoice,
    id,
    type: 'creditNote',
    number: '',
    status: 'draft',
    issueDate: today,
    creditFor: invoice.id,
    frozen: undefined,
    payments: undefined,
    rev: undefined,
    lineItems: invoice.lineItems.map((line) => ({ ...line, id: `${id}-${line.id}` })),
  }
}

// Total of sent credit notes against an invoice; drafts and voided ones do not count.
export function creditedTotal(documents: DocumentModel[], invoiceId: string): number {
  return documents
    .filter((d) => d.type === 'creditNote' && d.creditFor === invoiceId && d.status !== 'draft' && d.status !== 'void')
    .reduce((sum, d) => sum + printedTotals(d).grandTotalMinor, 0)
}
