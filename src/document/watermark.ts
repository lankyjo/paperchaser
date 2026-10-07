import { DOC_TYPES } from './docTypes'
import { paymentStatus } from './payments'
import type { Branding, DocumentModel } from './types'

// Branding override first, then DRAFT or VOID, then live PAID or PARTLY PAID stamps on sent payable documents.
export function watermarkFor(doc: DocumentModel, branding: Partial<Branding> | undefined): string | null {
  if (branding?.watermark === 'draft') return 'DRAFT'
  if (branding?.watermark === 'paid') return 'PAID'
  if (doc.status === 'draft') return 'DRAFT'
  if (doc.status === 'void') return 'VOID'
  if (!DOC_TYPES[doc.type].payable || doc.payments === undefined) return null
  const status = paymentStatus(doc)
  return status === 'paid' || status === 'overpaid' ? 'PAID' : status === 'partial' ? 'PARTLY PAID' : null
}
