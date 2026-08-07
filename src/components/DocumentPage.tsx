import type { CSSProperties } from 'react'

import type { DocumentModel, LineItem } from '../document/types'

/**
 * THE single component rendered on screen AND in print (parity by construction,
 * RESEARCH Pattern 1). The print path applies @media print + @page rules from
 * src/styles/print.css to this exact DOM; there is no second layout engine.
 *
 * All text renders as React text nodes — React escapes by default. The
 * raw-HTML injection attribute is banned project-wide (grep-enforced in CI).
 */

const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

function formatMinor(minor: number): string {
  return EUR.format(minor / 100)
}

interface Totals {
  subtotalMinor: number
  taxMinor: number
  grandTotalMinor: number
}

/** Integer-minor-units math only — never floats (PITFALLS.md:232). */
function computeTotals(lineItems: LineItem[]): Totals {
  let subtotalMinor = 0
  let taxMinor = 0
  for (const item of lineItems) {
    const net = item.quantity * item.unitPriceMinor
    subtotalMinor += net
    // taxRateMinor is percent in minor units (1900 = 19.00%) — scale by 10000.
    taxMinor += Math.round((net * item.taxRateMinor) / 10000)
  }
  return { subtotalMinor, taxMinor, grandTotalMinor: subtotalMinor + taxMinor }
}

const pageStyle: CSSProperties = {
  width: '210mm',
  minHeight: '297mm',
  margin: '0 auto',
  padding: '15mm',
  boxSizing: 'border-box',
  background: '#ffffff',
  color: '#111827',
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  fontSize: '11px',
  lineHeight: 1.5,
  position: 'relative',
}

const row: CSSProperties = { borderBottom: '1px solid #e5e7eb' }

export function DocumentPage({ model }: { model: DocumentModel }) {
  const totals = computeTotals(model.lineItems)

  return (
    <div id="print-root" style={pageStyle}>
      {model.watermark === 'draft' && (
        <div className="watermark" aria-hidden="true">
          DRAFT
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '12mm', marginBottom: '12mm' }}>
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
          <h2 style={{ fontSize: '24px', margin: 0, textTransform: 'uppercase' }}>Rechnung</h2>
          <div>
            {model.number} · {model.issueDate}
          </div>
        </div>
      </header>

      <section style={{ marginBottom: '12mm' }}>
        <h3 style={{ margin: '0 0 4px' }}>Rechnungsempfänger</h3>
        <div>{model.customer.name}</div>
        {model.customer.address.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </section>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12mm' }}>
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
          {model.lineItems.map((item) => {
            const total = item.quantity * item.unitPriceMinor
            return (
              <tr key={item.id} style={row}>
                <td style={{ padding: '6px 0', verticalAlign: 'top' }}>{item.title}</td>
                <td style={{ padding: '6px 0', verticalAlign: 'top' }}>{item.description}</td>
                <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right' }}>
                  {formatMinor(item.unitPriceMinor)}
                </td>
                <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right' }}>{formatMinor(total)}</td>
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

      <footer style={{ marginTop: '12mm', color: '#6b7280' }}>
        <div>Überweisung innerhalb 14 Tage auf das in der Rechnung genannte Konto.</div>
        <div>Vielen Dank für Ihren Auftrag.</div>
      </footer>
    </div>
  )
}
