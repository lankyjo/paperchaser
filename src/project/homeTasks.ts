import type { DocumentModel } from '../document/types'
import { PIPELINE_STEPS, projectProgress, stepStatus, type StepType } from './pipeline'

// The first pipeline step still to start or finish drafting (null when none) and how many steps are done.
export function nextStep(documents: DocumentModel[], doneSteps: string[]): { next: StepType | null; done: number; total: number } {
  const next = PIPELINE_STEPS.find((s) => ['notStarted', 'draft'].includes(stepStatus(s.type, documents, doneSteps)))?.type ?? null
  return { next, ...projectProgress(documents, doneSteps) }
}

// Payments received on live invoices that no receipt confirms yet, oldest first.
export function receiptsToSend(documents: DocumentModel[]) {
  const confirmed = new Set(documents.flatMap((d) => (d.type === 'receipt' && d.receiptFor ? [d.receiptFor.paymentId] : [])))
  return documents
    .filter((d) => d.type === 'invoice' && d.status !== 'void')
    .flatMap((invoice) => (invoice.payments ?? []).filter((p) => p.amountMinor > 0 && !confirmed.has(p.id)).map((payment) => ({ invoice, payment })))
    .sort((a, b) => a.payment.date.localeCompare(b.payment.date))
}
