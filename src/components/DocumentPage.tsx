import type { Block } from '../document/blocks'
import { documentBlocks } from '../document/documentBlocks'
import { printedTotals } from '../document/finalize'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../document/types'
import type { RichTextDoc } from '../document/richtext'
import { resolveTokens, toCssVars } from '../document/resolveTokens'
import { BlockView } from './blocks/BlockView'
import { BillToSection } from './document-page/BillToSection'
import { LineItemsTable } from './document-page/LineItemsTable'
import { PageFrame } from './document-page/PageFrame'
import { footerPresets, headerPresets } from './document-page/pagePresets'
import { resolveWatermarkText } from './document-page/resolveWatermarkText'
import { TotalsSection } from './document-page/TotalsSection'

interface DocumentPageProps {
  model: DocumentModel
  template?: TemplateId
  branding?: Partial<Branding>
  pageSize?: PageSize
  editable?: boolean
  onCustomerNameCommit?: (name: RichTextDoc) => void
  onCommit?: (next: DocumentModel) => void
}

// Every document rendered on screen and in print: frame, header, its blocks in order, footer. Templates only change tokens.
export function DocumentPage({ model, template, branding, pageSize, editable = false, onCustomerNameCommit, onCommit }: DocumentPageProps) {
  const resolved = resolveTokens(template ?? model.template ?? 'minimal', branding ?? model.branding)
  const totals = printedTotals(model)
  const HeaderPreset = headerPresets[resolved.header.style]
  const FooterPreset = footerPresets[resolved.footer.style]
  const visibility = model.settings?.blockVisibility ?? {}
  const watermarkText = resolveWatermarkText(branding ?? model.branding, model.status)
  const changeBlock =
    editable && onCommit ? (block: Block) => onCommit({ ...model, blocks: documentBlocks(model).map((b) => (b.id === block.id ? block : b)) }) : undefined

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'parties':
        return <BillToSection key={block.id} model={model} editable={editable} onCustomerNameCommit={onCustomerNameCommit} onCommit={onCommit} />
      case 'lineItems':
        return <LineItemsTable key={block.id} model={model} lineNets={totals.lineNets} onCommit={editable ? onCommit : undefined} />
      case 'totals':
        return <TotalsSection key={block.id} subtotalMinor={totals.subtotalMinor} taxMinor={totals.taxMinor} grandTotalMinor={totals.grandTotalMinor} taxMode={model.taxMode} currency={model.currency} locale={model.locale} />
      default:
        return <BlockView key={block.id} block={block} onChange={changeBlock} />
    }
  }

  return (
    <PageFrame
      pageSize={pageSize ?? model.pageSize}
      cssVars={toCssVars(resolved)}
      watermark={watermarkText === null ? null : { text: watermarkText, color: resolved.accent }}
    >
      {visibility.header !== false && <HeaderPreset tokens={resolved} model={model} />}
      {documentBlocks(model).filter((b) => !b.hidden).map(renderBlock)}
      {visibility.footer !== false && <FooterPreset tokens={resolved} model={model} />}
    </PageFrame>
  )
}
