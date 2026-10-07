import { computeTotals } from '../document/totals'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../document/types'
import type { RichTextDoc } from '../document/richtext'
import { resolveTokens, toCssVars } from '../document/resolveTokens'
import { BillToSection } from './document-page/BillToSection'
import { LineItemsTable } from './document-page/LineItemsTable'
import { PageFrame } from './document-page/PageFrame'
import { footerPresets, headerPresets } from './document-page/pagePresets'
import { resolveWatermarkText } from './document-page/resolveWatermarkText'
import { TotalsSection } from './document-page/TotalsSection'

// The money document rendered on screen and in print; templates differ only through --tpl-* token variables, never branches.
export function DocumentPage({
  model,
  template,
  branding,
  pageSize,
  editable = false,
  onCustomerNameCommit,
  onCommit,
}: {
  model: DocumentModel
  template?: TemplateId
  branding?: Partial<Branding>
  pageSize?: PageSize
  editable?: boolean
  onCustomerNameCommit?: (name: RichTextDoc) => void
  onCommit?: (next: DocumentModel) => void
}) {
  const resolved = resolveTokens(template ?? 'minimal', branding)
  const totals = computeTotals(model)
  const HeaderPreset = headerPresets[resolved.header.style]
  const FooterPreset = footerPresets[resolved.footer.style]
  // Blocks are visible unless explicitly hidden.
  const bv = model.settings?.blockVisibility ?? {}
  const watermarkText = resolveWatermarkText(branding, model.status)

  return (
    <PageFrame
      pageSize={pageSize}
      cssVars={toCssVars(resolved)}
      watermark={watermarkText === null ? null : { text: watermarkText, color: resolved.accent }}
    >
      {bv.header !== false && <HeaderPreset tokens={resolved} model={model} />}

      {bv.billTo !== false && (
        <BillToSection model={model} editable={editable} onCustomerNameCommit={onCustomerNameCommit} onCommit={onCommit} />
      )}

      {bv.items !== false && (
        <LineItemsTable model={model} lineNets={totals.lineNets} onCommit={editable ? onCommit : undefined} />
      )}

      {bv.totals !== false && (
        <TotalsSection subtotalMinor={totals.subtotalMinor} taxMinor={totals.taxMinor} grandTotalMinor={totals.grandTotalMinor} />
      )}

      {bv.footer !== false && <FooterPreset tokens={resolved} model={model} />}
    </PageFrame>
  )
}
