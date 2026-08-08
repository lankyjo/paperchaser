import type { CSSProperties } from 'react'

import { computeTotals, deriveWatermark } from '../document/totals'
import type { Branding, DocumentModel, PageSize, TemplateId } from '../document/types'
import { resolveTokens, toCssVars } from '../document/resolveTokens'

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
 * NO branch on templateId exists anywhere in this component (RESEARCH
 * Anti-Pattern 1): a missing token field is the smell to fix, not an if.
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

  return (
    <div
      id="print-root"
      className={pageSize && pageSize !== 'a4' ? `page-${pageSize}` : undefined}
      style={{ ...pageStyle, ...(vars as CSSProperties) }}
    >
      {deriveWatermark(model.status) === 'draft' && (
        // D-04: watermark color follows the resolved brand accent (inline style
        // is the single mechanism; print.css keeps #1d4ed8 as stylesheet fallback).
        <div className="watermark" aria-hidden="true" style={{ color: resolved.accent }}>
          DRAFT
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '12mm', marginBottom: 'var(--tpl-section-gap)' }}>
        <div>
          {model.company.logo !== null && (
            <img src={model.company.logo} alt="" className="document-logo" style={{ width: 48, height: 48 }} />
          )}
          <h1 style={{ fontSize: '20px', margin: '4px 0' }}>{model.company.name}</h1>
          {model.company.address.map((line) => (
            <div key={line}>{line}</div>
          ))}
          <div>{model.company.email}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2
            style={{
              fontSize: 'var(--tpl-title-size)',
              fontWeight: 'var(--tpl-title-weight)',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            Rechnung
          </h2>
          <div>
            {model.number} · {model.issueDate}
          </div>
        </div>
      </header>

      <section style={{ marginBottom: 'var(--tpl-section-gap)' }}>
        <h3 style={{ margin: '0 0 4px' }}>Rechnungsempfänger</h3>
        <div>{model.customer.name}</div>
        {model.customer.address.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </section>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--tpl-section-gap)' }}>
        <thead>
          <tr style={row}>
            <th style={{ textAlign: 'left', padding: '6px 0' }}>Position</th>
            <th style={{ textAlign: 'left', padding: '6px 0' }}>Beschreibung</th>
            <th style={{ textAlign: 'right', padding: '6px 0' }}>Menge</th>
            <th style={{ textAlign: 'right', padding: '6px 0' }}>Einzelpreis</th>
            <th style={{ textAlign: 'right', padding: '6px 0' }}>Gesamt</th>
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
          <span>Zwischensumme</span>
          <span>{formatMinor(totals.subtotalMinor)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Steuern</span>
          <span>{formatMinor(totals.taxMinor)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '4px' }}>
          <span>Gesamtsumme</span>
          <span>{formatMinor(totals.grandTotalMinor)}</span>
        </div>
      </section>

      <footer style={{ marginTop: 'var(--tpl-section-gap)', color: '#6b7280' }}>
        <div>Überweisung innerhalb 14 Tage auf das in der Rechnung genannte Konto.</div>
        <div>Vielen Dank für Ihren Auftrag.</div>
      </footer>
    </div>
  )
}
