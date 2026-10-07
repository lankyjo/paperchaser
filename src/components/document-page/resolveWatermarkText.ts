import { deriveWatermark } from '../../document/totals'
import type { Branding, DocumentModel } from '../../document/types'

// The branding override wins; 'auto' or unset derives from status, which only ever yields DRAFT.
export function resolveWatermarkText(branding: Partial<Branding> | undefined, status: DocumentModel['status']): string | null {
  if (branding?.watermark === 'draft') return 'DRAFT'
  if (branding?.watermark === 'paid') return 'PAID'
  return deriveWatermark(status) === 'draft' ? 'DRAFT' : null
}
