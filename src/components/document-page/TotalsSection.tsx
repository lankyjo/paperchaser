import type { TaxMode } from '../../document/totals'
import { formatMoney } from '../../document/money'

interface TotalsSectionProps {
  subtotalMinor: number
  taxMinor: number
  grandTotalMinor: number
  taxMode?: TaxMode
  currency: string
  locale?: string
}

const TAX_LABELS: Record<TaxMode, string | null> = { exclusive: 'Tax', inclusive: 'Includes tax', none: null }

// Subtotal, tax and grand total, right-aligned under the table; inclusive prices show the tax they contain, untaxed shows none.
export function TotalsSection({ subtotalMinor, taxMinor, grandTotalMinor, taxMode = 'exclusive', currency, locale }: TotalsSectionProps) {
  const taxLabel = TAX_LABELS[taxMode]
  const money = (minor: number) => formatMoney(minor, currency, locale)
  return (
    <section style={{ maxWidth: '90mm', marginLeft: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Subtotal</span>
        <span>{money(subtotalMinor)}</span>
      </div>
      {taxLabel !== null && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{taxLabel}</span>
          <span>{money(taxMinor)}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '4px' }}>
        <span>Grand total</span>
        <span>{money(grandTotalMinor)}</span>
      </div>
    </section>
  )
}
