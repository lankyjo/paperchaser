import { DOC_TYPE_IDS, DOC_TYPES } from './docTypes'
import { computeTotals } from './totals'
import type { DocumentModel } from './types'

export interface Counter {
  type: DocumentModel['type']
  prefix: string
  next: number
  yearlyReset: boolean
  year?: number
}

export const NUMBERED_TYPES = DOC_TYPE_IDS.filter((t) => DOC_TYPES[t].numbered)

export const isNumberedType = (type: DocumentModel['type']) => DOC_TYPES[type].numbered

// The number for this finalize and the advanced counter; {YYYY} in the prefix becomes the year.
export function nextNumber(counter: Counter, now: Date): { number: string; counter: Counter } {
  const year = now.getFullYear()
  const seq = counter.yearlyReset && counter.year !== undefined && counter.year !== year ? 1 : counter.next
  const number = `${counter.prefix.replaceAll('{YYYY}', String(year))}${String(seq).padStart(4, '0')}`
  return { number, counter: { ...counter, next: seq + 1, ...(counter.yearlyReset && { year }) } }
}

// Marks a document sent with its number and freezes the totals it was sent with.
export function finalizeDocument(doc: DocumentModel, number: string | null, finalizedAt: string): DocumentModel {
  const { lineNets, subtotalMinor, taxMinor, grandTotalMinor } = computeTotals(doc)
  return {
    ...doc,
    status: 'sent',
    ...(number !== null && { number }),
    frozen: { finalizedAt, totals: { lineNets, subtotalMinor, taxMinor, grandTotalMinor } },
  }
}

// A draft that was never sent, or was pulled back to the latest data, so it follows the project and may be edited by AI.
export const isLiveDraft = (doc: Pick<DocumentModel, 'status' | 'frozen'>) => doc.status === 'draft' && doc.frozen === undefined

// Once money is recorded, a decision is made or a revision exists, the document stays sent; corrections go through a credit note.
export const canUnsend = (doc: DocumentModel) =>
  doc.status !== 'void' && (doc.payments ?? []).length === 0 && doc.outcome === undefined && doc.supersededBy === undefined

// Back to draft for corrections; the number stays reserved and the snapshot stays until the user pulls the latest data.
export function unsendDocument(doc: DocumentModel): DocumentModel {
  return { ...doc, status: 'draft' }
}

// The totals a document prints: frozen ones once finalized, freshly computed while a draft.
export function printedTotals(doc: DocumentModel) {
  return doc.frozen?.totals ?? computeTotals(doc)
}
