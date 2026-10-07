import type { DocumentModel } from '../document/types'

export type StepType = Exclude<DocumentModel['type'], 'creditNote'>
export type StepStatus = 'notStarted' | 'draft' | 'sent' | 'done'

// The client pipeline in order; multi steps hold several documents (deposit and balance invoices, one report per month).
export const PIPELINE_STEPS: { type: StepType; multi: boolean }[] = [
  { type: 'quote', multi: false },
  { type: 'agreement', multi: false },
  { type: 'welcome', multi: false },
  { type: 'brief', multi: false },
  { type: 'invoice', multi: true },
  { type: 'deliveryGuide', multi: false },
  { type: 'monthlyReport', multi: true },
  { type: 'receipt', multi: true },
  { type: 'thankYou', multi: false },
  { type: 'feedback', multi: false },
]

interface DocStatus {
  type: string
  status: DocumentModel['status']
}

// Single steps follow their document unless marked done; multi steps are draft while any draft remains, done once all are settled.
export function stepStatus(type: StepType, documents: DocStatus[], doneSteps: string[]): StepStatus {
  const docs = documents.filter((d) => d.type === type)
  const multi = PIPELINE_STEPS.find((s) => s.type === type)?.multi ?? false
  if (!multi && doneSteps.includes(type)) return 'done'
  if (docs.length === 0) return 'notStarted'
  if (docs.some((d) => d.status === 'draft')) return 'draft'
  return multi ? 'done' : 'sent'
}

export function projectProgress(documents: DocStatus[], doneSteps: string[]) {
  const done = PIPELINE_STEPS.filter((s) => stepStatus(s.type, documents, doneSteps) === 'done').length
  return { done, total: PIPELINE_STEPS.length }
}
