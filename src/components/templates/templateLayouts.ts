import type { ComponentType } from 'react'
import type { printedTotals } from '../../document/finalize'
import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel, TemplateId } from '../../document/types'
import { atelierLayout } from './atelier/atelierLayout'
import { correspondenceLayout } from './correspondence/correspondenceLayout'
import { noirLedgerLayout } from './noir-ledger/noirLedgerLayout'
import { statementLayout } from './statement/statementLayout'
import { swissLayout } from './swiss/swissLayout'

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

// A template's own page regions. Without a Header it uses the branding presets; with one, it prints the dates itself and only a given Footer.
export interface TemplateLayout {
  Header?: ComponentType<RegionProps>
  Footer?: ComponentType<RegionProps>
  // Shown on every printed page, outside the content flow (page numbers, running titles).
  PageMark?: ComponentType<PageMarkProps>
}

export const TEMPLATE_LAYOUTS: Partial<Record<TemplateId, TemplateLayout>> = {
  noirLedger: noirLedgerLayout,
  atelier: atelierLayout,
  statement: statementLayout,
  swiss: swissLayout,
  correspondence: correspondenceLayout,
}
