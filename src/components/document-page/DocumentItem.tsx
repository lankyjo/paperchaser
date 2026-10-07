import type { Block } from '../../document/blocks'
import { documentBlocks } from '../../document/documentBlocks'
import { documentFacts, type PageItem } from '../../document/pageLayout'
import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel, TemplateId } from '../../document/types'
import type { printedTotals } from '../../document/finalize'
import { BlockView } from '../blocks/BlockView'
import { TEMPLATE_LAYOUTS } from '../templates/templateLayouts'
import { BillToSection } from './BillToSection'
import { LineItemsTable } from './LineItemsTable'
import { footerPresets, headerPresets } from './pagePresets'
import { TotalsSection } from './TotalsSection'

interface DocumentItemProps {
  item: PageItem
  model: DocumentModel
  templateId: TemplateId
  tokens: ResolvedTokens
  totals: ReturnType<typeof printedTotals>
  range?: [number, number]
  editable: boolean
  onCommit?: (next: DocumentModel) => void
}

// One printed item (header, date line, a block or footer), optionally limited to a range of its units.
export function DocumentItem({ item, model, templateId, tokens, totals, range, editable, onCommit }: DocumentItemProps) {
  const layout = TEMPLATE_LAYOUTS[templateId]
  if (item.id === 'header') {
    const Header = layout?.Header ?? headerPresets[tokens.header.style]
    return <Header tokens={tokens} model={model} totals={totals} />
  }
  if (item.id === 'footer') {
    const Footer = layout?.Footer ?? footerPresets[tokens.footer.style]
    return <Footer tokens={tokens} model={model} totals={totals} />
  }
  if (item.block === undefined) {
    const date = documentFacts(model).date
    return date && !layout?.datesInHeader ? <p className="doc-date">{date.label} {date.value}</p> : null
  }
  const block = item.block
  switch (block.type) {
    case 'parties':
      return <BillToSection model={model} editable={editable} onCommit={onCommit} />
    case 'lineItems':
      return <LineItemsTable model={model} lineNets={totals.lineNets} range={range} onCommit={editable ? onCommit : undefined} />
    case 'totals':
      return <TotalsSection subtotalMinor={totals.subtotalMinor} taxMinor={totals.taxMinor} grandTotalMinor={totals.grandTotalMinor} taxMode={model.taxMode} currency={model.currency} locale={model.locale} />
    default: {
      const changeBlock = editable && onCommit ? (next: Block) => onCommit({ ...model, blocks: documentBlocks(model).map((b) => (b.id === next.id ? next : b)) }) : undefined
      return <BlockView block={block} model={model} onChange={changeBlock} range={range} />
    }
  }
}
