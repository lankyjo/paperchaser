import { useState } from 'react'
import { documentsRepo } from '../../db/repos'
import { creditedTotal, newCreditNote } from '../../document/credits'
import { newReceiptForPayment, type Payment } from '../../document/payments'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'

// Receipts and credit notes belonging to this invoice, and creating new ones.
export function useInvoiceRelated(invoice: DocumentModel) {
  const [related, setRelated] = useState<DocumentModel[]>([])
  useMountEffect(() => {
    void documentsRepo
      .byProject(invoice.projectId)
      .then((docs) => setRelated(docs.filter((d) => d.receiptFor?.invoiceId === invoice.id || d.creditFor === invoice.id)))
  })
  const receipts = related.filter((d) => d.type === 'receipt')
  const creditNotes = related.filter((d) => d.type === 'creditNote')

  const receiptFor = (payment: Payment) => receipts.find((r) => r.receiptFor?.paymentId === payment.id)
  const createReceipt = async (payment: Payment): Promise<DocumentModel> => {
    const receipt = newReceiptForPayment(invoice, payment, { id: crypto.randomUUID(), today: new Date().toLocaleDateString('en-CA') })
    await documentsRepo.put(receipt)
    setRelated((current) => [...current, receipt])
    return receipt
  }
  const createCreditNote = async (): Promise<DocumentModel> => {
    const credit = newCreditNote(invoice, { id: crypto.randomUUID(), today: new Date().toLocaleDateString('en-CA') })
    await documentsRepo.put(credit)
    return credit
  }
  // A payment confirmed by a sent receipt can no longer change.
  const isLocked = (payment: Payment) => {
    const receipt = receiptFor(payment)
    return receipt !== undefined && receipt.status !== 'draft'
  }
  return { receiptFor, createReceipt, isLocked, creditNotes, creditedMinor: creditedTotal(creditNotes, invoice.id), createCreditNote }
}
