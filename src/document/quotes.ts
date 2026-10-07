import { getPlainText } from './richtext'
import type { DocumentModel } from './types'

export type QuoteState = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'superseded'

export function quoteState(quote: DocumentModel, today: string): QuoteState {
  if (quote.status === 'draft') return 'draft'
  if (quote.supersededBy !== undefined) return 'superseded'
  if (quote.outcome !== undefined) return quote.outcome
  return quote.validUntil !== undefined && quote.validUntil < today ? 'expired' : 'sent'
}

// A new draft of the quote; it will be numbered from the original, e.g. Q-0004-R2, without using a new number.
export function reviseQuote(quote: DocumentModel, { id, today }: { id: string; today: string }): DocumentModel {
  const base = quote.revisionBase ?? getPlainText(quote.number)
  return {
    ...quote,
    id,
    status: 'draft',
    number: '',
    issueDate: today,
    frozen: undefined,
    outcome: undefined,
    rev: undefined,
    supersededBy: undefined,
    revisionOf: quote.id,
    revision: (quote.revision ?? 1) + 1,
    revisionBase: base,
  }
}

export function acceptQuote(quote: DocumentModel): DocumentModel {
  if (quote.supersededBy !== undefined) throw new Error('Only the latest revision can be accepted')
  return { ...quote, outcome: 'accepted' }
}

export const declineQuote = (quote: DocumentModel): DocumentModel => ({ ...quote, outcome: 'declined' })

// The number a revision is finalized with; null for documents numbered from their counter.
export const revisionNumber = (doc: DocumentModel) =>
  doc.revisionBase !== undefined && doc.revision !== undefined ? `${doc.revisionBase}-R${doc.revision}` : null
