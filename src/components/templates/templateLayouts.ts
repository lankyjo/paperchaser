import type { ComponentType } from 'react'
import type { printedTotals } from '../../document/finalize'
import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel, TemplateId } from '../../document/types'
import { atelierLayout } from './atelier/atelierLayout'
import { noirLedgerLayout } from './noir-ledger/noirLedgerLayout'

export interface RegionProps {
  model: DocumentModel
  tokens: ResolvedTokens
  totals: ReturnType<typeof printedTotals>
}

export interface PageMarkProps {
  model: DocumentModel
  page: number
  pages: number
}

// A template's own page regions; anything left out falls back to the branding header and footer presets.
export interface TemplateLayout {
  Header?: ComponentType<RegionProps>
  Footer?: ComponentType<RegionProps>
  // Shown on every printed page, outside the content flow (page numbers, running titles).
  PageMark?: ComponentType<PageMarkProps>
  // The header already shows the due or valid-until date, so the separate date line is skipped.
  datesInHeader?: boolean
}

export const TEMPLATE_LAYOUTS: Partial<Record<TemplateId, TemplateLayout>> = {
  noirLedger: noirLedgerLayout,
  atelier: atelierLayout,
}
