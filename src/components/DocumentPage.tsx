import type { ComponentType, CSSProperties } from 'react'

import { computeTotals, deriveWatermark } from '../document/totals'
import type { ResolvedTokens } from '../document/tokens'
import type { FooterStyle, HeaderStyle } from '../document/tokens'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../document/types'
import { resolveTokens, toCssVars } from '../document/resolveTokens'
import { FooterDetailed } from './print/FooterDetailed'
import { FooterMinimal } from './print/FooterMinimal'
import { FooterStandard } from './print/FooterStandard'
import { HeaderBanner } from './print/HeaderBanner'
import { HeaderCompact } from './print/HeaderCompact'
import { HeaderStandard } from './print/HeaderStandard'

/**
 * THE single component rendered on screen AND in print (parity by construction,
 * RESEARCH Pattern 1). The print path applies @media print + @page rules from
 * src/styles/print.css to this exact DOM; there is no second layout engine.
 *
 * All text renders as React text nodes — React escapes by default. The
 * raw-HTML injection attribute is banned project-wide (grep-enforced in CI).
 *
 * D-12/D-13: prop-driven and template-agnostic. Resolved tokens surface as
 * --tpl-* CSS custom properties on #print-root (cast through CSSProperties —
 * React's type lacks the `--*` index signature); the stylesheet reads the
 * variables and the print projection inherits them from the same element.
 * NO branch on the document's template exists anywhere in this component
 * (RESEARCH Anti-Pattern 1): a missing token field is the smell to fix, not
 * an if.
 */

const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

function formatMinor(minor: number): string {
  return EUR.format(minor / 100)
}

// Geometry contract (harness-measured, plan 01-02): 210mm × min-297mm A4 block
// with 15mm padding — content sits exactly 15mm from the page edge in preview,
// print, and PDF. BRND-07: background stays #ffffff in both projections.
const pageStyle: CSSProperties = {
  width: '210mm',
  minHeight: '297mm',
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

const row: CSSProperties = { borderBottom: '1px solid var(--tpl-row-rule)' }

/** Preset props — the resolved token set and the model both presets render. */
interface PresetProps {
  tokens: ResolvedTokens
  model: DocumentModel
}

/**
 * BRND-05: the 3×3 preset matrix, keyed by the RESOLVED STYLE token
 * (resolved.header.style / resolved.footer.style) — never by the document's
 * template id (Anti-Pattern 1: a switch on the template is the smell; a
 * switch on the resolved style is the contract). The 4th HeaderStyle member,
 * 'standard-offset' (Creative's default), is the Standard layout with the
 * token-driven 18mm left offset applied at the page level, so it selects the
 * same component.
 */
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
}: {
  model: DocumentModel
  template?: TemplateId
  branding?: Partial<Branding>
  pageSize?: PageSize
}) {
  // D-08/D-09: a missing template resolves to Minimal here; the resolver and
  // registry stay the single seam for template defaults.
  const resolved = resolveTokens(template ?? 'minimal', branding)
  const vars = toCssVars(resolved)
  const totals = computeTotals(model)

  // BRND-05: preset selection by the resolved style token (never template id).
  const HeaderPreset = headerPresets[resolved.header.style]
  const FooterPreset = footerPresets[resolved.footer.style]

  // BRND-06 (edges 11/12/13): three-way watermark resolve. The branding
  // override wins when set ('draft' → DRAFT, 'paid' → PAID regardless of
  // status); 'auto' or unset derives from status via deriveWatermark — the
  // single Phase-2 engine, never reimplemented. NOTE (documented divergence,
  // UI-SPEC line 205): deriveWatermark is DRAFT-only (totals.ts:90-92 returns
  // null for 'paid'/'sent'), so 'auto' on a paid document renders NO watermark
  // and "PAID" appears only via the explicit override.
  const watermarkText =
    branding?.watermark === 'draft'
      ? 'DRAFT'
      : branding?.watermark === 'paid'
        ? 'PAID'
        : deriveWatermark(model.status) === 'draft'
          ? 'DRAFT'
          : null

  return (
    <div
      id="print-root"
      className={pageSize && pageSize !== 'a4' ? `page-${pageSize}` : undefined}
      style={{ ...pageStyle, ...(vars as CSSProperties) }}
    >
      {watermarkText !== null && (
        // D-04: watermark color follows the resolved brand accent (inline style
        // is the single mechanism; print.css keeps #1d4ed8 as stylesheet fallback).
        <div className="watermark" aria-hidden="true" style={{ color: resolved.accent }}>
          {watermarkText}
        </div>
      )}

      <HeaderPreset tokens={resolved} model={model} />

      <section style={{ marginBottom: 'var(--tpl-section-gap)' }}>
        <h3 style={{ margin: '0 0 4px' }}>Bill to</h3>
        <div>{model.customer.name}</div>
        {model.customer.address.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </section>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--tpl-section-gap)' }}>
        <thead>
          <tr style={row}>
            <th style={{ textAlign: 'left', padding: '6px 0' }}>Item</th>
            <th style={{ textAlign: 'left', padding: '6px 0' }}>Description</th>
            <th style={{ textAlign: 'right', padding: '6px 0' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '6px 0' }}>Unit price</th>
            <th style={{ textAlign: 'right', padding: '6px 0' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {model.lineItems.map((item, index) => {
            return (
              <tr key={item.id} style={row}>
                <td style={{ padding: '6px 0', verticalAlign: 'top' }}>{item.title}</td>
                <td style={{ padding: '6px 0', verticalAlign: 'top' }}>{item.description}</td>
                <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right' }}>
                  {formatMinor(item.unitPriceMinor)}
                </td>
                <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right' }}>
                  {formatMinor(totals.lineNets[index])}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <section style={{ maxWidth: '90mm', marginLeft: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal</span>
          <span>{formatMinor(totals.subtotalMinor)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tax</span>
          <span>{formatMinor(totals.taxMinor)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '4px' }}>
          <span>Grand total</span>
          <span>{formatMinor(totals.grandTotalMinor)}</span>
        </div>
      </section>

      <FooterPreset tokens={resolved} model={model} />
    </div>
  )
}
