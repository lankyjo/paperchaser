import type { ComponentType, CSSProperties } from 'react'

import { computeTotals } from '../document/totals'
import { PAGE_SIZES } from '../document/tokens'
import type { ResolvedTokens } from '../document/tokens'
import type { FooterStyle, HeaderStyle } from '../document/tokens'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../document/types'
import type { RichTextDoc } from '../document/richtext'
import { resolveTokens, toCssVars } from '../document/resolveTokens'
import { BillToSection } from './document-page/BillToSection'
import { LineItemsTable } from './document-page/LineItemsTable'
import { resolveWatermarkText } from './document-page/resolveWatermarkText'
import { TotalsSection } from './document-page/TotalsSection'
import { FooterDetailed } from './print/FooterDetailed'
import { FooterMinimal } from './print/FooterMinimal'
import { FooterStandard } from './print/FooterStandard'
import { HeaderBanner } from './print/HeaderBanner'
import { HeaderCompact } from './print/HeaderCompact'
import { HeaderStandard } from './print/HeaderStandard'

// The one document rendered on screen and in print; templates differ only through --tpl-* token variables, never branches.

// Page block at the page size's mm dimensions with a fixed 15mm padding; @page margin stays 0 so the margin is not doubled.
function pageStyleFor(pageSize: PageSize): CSSProperties {
  const g = PAGE_SIZES[pageSize]
  return {
    width: g.width,
    minHeight: g.height,
    margin: '0 auto',
    padding: '15mm',
    boxSizing: 'border-box',
    background: '#ffffff',
    color: 'var(--tpl-ink)',
    fontFamily: 'var(--tpl-font-body)',
    fontSize: '11px',
    lineHeight: 1.5,
    position: 'relative',
  }
}

interface PresetProps {
  tokens: ResolvedTokens
  model: DocumentModel
}

// Presets are chosen by the resolved header/footer style; standard-offset reuses HeaderStandard with a page-level offset.
const headerPresets: Record<HeaderStyle, ComponentType<PresetProps>> = {
  standard: HeaderStandard,
  banner: HeaderBanner,
  compact: HeaderCompact,
  'standard-offset': HeaderStandard,
}

const footerPresets: Record<FooterStyle, ComponentType<PresetProps>> = {
  minimal: FooterMinimal,
  standard: FooterStandard,
  detailed: FooterDetailed,
}

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
  const vars = toCssVars(resolved)
  const totals = computeTotals(model)
  const HeaderPreset = headerPresets[resolved.header.style]
  const FooterPreset = footerPresets[resolved.footer.style]
  // Blocks are visible unless explicitly hidden.
  const bv = model.settings?.blockVisibility ?? {}
  const watermarkText = resolveWatermarkText(branding, model.status)

  return (
    <div
      id="print-root"
      className={pageSize && pageSize !== 'a4' ? `page-${pageSize}` : undefined}
      style={{ ...pageStyleFor(pageSize ?? 'a4'), ...(vars as CSSProperties) }}
    >
      {watermarkText !== null && (
        // Inline accent color; print.css only holds a fallback color.
        <div className="watermark" aria-hidden="true" style={{ color: resolved.accent }}>
          {watermarkText}
        </div>
      )}

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
    </div>
  )
}
