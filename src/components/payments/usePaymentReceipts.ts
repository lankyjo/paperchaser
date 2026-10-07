import { useState } from 'react'
import { documentsRepo } from '../../db/repos'
import { newReceiptForPayment, type Payment } from '../../document/payments'
import type { DocumentModel } from '../../document/types'
import { useMountEffect } from '../../hooks/useMountEffect'

// Receipts already created for this invoice's payments, and creating a new one.
export function usePaymentReceipts(invoice: DocumentModel) {
  const [receipts, setReceipts] = useState<DocumentModel[]>([])
  useMountEffect(() => {
    void documentsRepo.byProject(invoice.projectId).then((docs) => setReceipts(docs.filter((d) => d.receiptFor?.invoiceId === invoice.id)))
  })

  const receiptFor = (payment: Payment) => receipts.find((r) => r.receiptFor?.paymentId === payment.id)
  const createReceipt = async (payment: Payment): Promise<DocumentModel> => {
    const receipt = newReceiptForPayment(invoice, payment, { id: crypto.randomUUID(), today: new Date().toLocaleDateString('en-CA') })
    await documentsRepo.put(receipt)
    setReceipts((current) => [...current, receipt])
    return receipt
  }
  // A payment confirmed by a sent receipt can no longer change.
  const isLocked = (payment: Payment) => {
    const receipt = receiptFor(payment)
    return receipt !== undefined && receipt.status !== 'draft'
  }
  return { receiptFor, createReceipt, isLocked, hasReceipts: receipts.length > 0 }
}
