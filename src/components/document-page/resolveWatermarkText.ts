import { paymentStatus } from '../../document/payments'
import { deriveWatermark } from '../../document/totals'
import type { Branding, DocumentModel } from '../../document/types'

// Branding override first, then DRAFT or VOID, then live PAID or PARTLY PAID stamps on sent invoices.
export function resolveWatermarkText(branding: Partial<Branding> | undefined, doc: DocumentModel): string | null {
  if (branding?.watermark === 'draft') return 'DRAFT'
  if (branding?.watermark === 'paid') return 'PAID'
  if (deriveWatermark(doc.status) === 'draft') return 'DRAFT'
  if (doc.status === 'void') return 'VOID'
  if (doc.type !== 'invoice' || doc.payments === undefined) return null
  const status = paymentStatus(doc)
  return status === 'paid' || status === 'overpaid' ? 'PAID' : status === 'partial' ? 'PARTLY PAID' : null
}
