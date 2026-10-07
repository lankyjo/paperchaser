import type { Block } from '../../document/blocks'
import { DOC_TYPES } from '../../document/docTypes'
import { documentBlocks } from '../../document/documentBlocks'
import type { PageItem } from '../../document/pageLayout'
import type { ResolvedTokens } from '../../document/tokens'
import type { DocumentModel } from '../../document/types'
import type { printedTotals } from '../../document/finalize'
import { BlockView } from '../blocks/BlockView'
import { BillToSection } from './BillToSection'
import { DateLine } from './DateLine'
import { LineItemsTable } from './LineItemsTable'
import { footerPresets, headerPresets } from './pagePresets'
import { TotalsSection } from './TotalsSection'

interface DocumentItemProps {
  item: PageItem
  model: DocumentModel
  tokens: ResolvedTokens
  totals: ReturnType<typeof printedTotals>
  range?: [number, number]
  editable: boolean
  onCommit?: (next: DocumentModel) => void
}

const DATE_LABELS = { validUntil: 'Valid until', dueDate: 'Due' }

// One printed item (header, date line, a block or footer), optionally limited to a range of its units.
export function DocumentItem({ item, model, tokens, totals, range, editable, onCommit }: DocumentItemProps) {
  if (item.id === 'header') {
    const Header = headerPresets[tokens.header.style]
    return <Header tokens={tokens} model={model} />
  }
  if (item.id === 'footer') {
    const Footer = footerPresets[tokens.footer.style]
    return <Footer tokens={tokens} model={model} />
  }
  const dateField = DOC_TYPES[model.type].dateField
  if (item.block === undefined) return dateField && model[dateField] ? <DateLine label={DATE_LABELS[dateField]} date={model[dateField]} locale={model.locale} /> : null
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
