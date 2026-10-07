import type { TaxMode } from '../../document/totals'
import { formatMoney } from '../../document/money'
import { DOC_LABELS } from '../../strings/documentLabels'

interface TotalsSectionProps {
  subtotalMinor: number
  taxMinor: number
  grandTotalMinor: number
  taxMode?: TaxMode
  currency: string
  locale?: string
}

const TAX_LABELS: Record<TaxMode, string | null> = { exclusive: DOC_LABELS.tax, inclusive: DOC_LABELS.taxIncluded, none: null }

// Subtotal, tax and grand total, right-aligned under the table; inclusive prices show the tax they contain, untaxed shows none.
export function TotalsSection({ subtotalMinor, taxMinor, grandTotalMinor, taxMode = 'exclusive', currency, locale }: TotalsSectionProps) {
  const taxLabel = TAX_LABELS[taxMode]
  const money = (minor: number) => formatMoney(minor, currency, locale)
  return (
    <section className="doc-totals">
      <div className="doc-totals-row">
        <span>{DOC_LABELS.subtotal}</span>
        <span>{money(subtotalMinor)}</span>
      </div>
      {taxLabel !== null && (
        <div className="doc-totals-row">
          <span>{taxLabel}</span>
          <span>{money(taxMinor)}</span>
        </div>
      )}
      <div className="doc-totals-row doc-totals-grand">
        <span>{DOC_LABELS.grandTotal}</span>
        <span>{money(grandTotalMinor)}</span>
      </div>
    </section>
  )
}
