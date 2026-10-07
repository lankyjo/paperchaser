import type { TaxMode } from '../../document/totals'
import { formatMinor } from './formatMinor'

interface TotalsSectionProps {
  subtotalMinor: number
  taxMinor: number
  grandTotalMinor: number
  taxMode?: TaxMode
}

const TAX_LABELS: Record<TaxMode, string | null> = { exclusive: 'Tax', inclusive: 'Includes tax', none: null }

// Subtotal, tax and grand total, right-aligned under the table; inclusive prices show the tax they contain, untaxed shows none.
export function TotalsSection({ subtotalMinor, taxMinor, grandTotalMinor, taxMode = 'exclusive' }: TotalsSectionProps) {
  const taxLabel = TAX_LABELS[taxMode]
  return (
    <section style={{ maxWidth: '90mm', marginLeft: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Subtotal</span>
        <span>{formatMinor(subtotalMinor)}</span>
      </div>
      {taxLabel !== null && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{taxLabel}</span>
          <span>{formatMinor(taxMinor)}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '4px' }}>
        <span>Grand total</span>
        <span>{formatMinor(grandTotalMinor)}</span>
      </div>
    </section>
  )
}
