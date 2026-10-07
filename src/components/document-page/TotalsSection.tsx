import { formatMinor } from './formatMinor'

// Subtotal, tax and grand total, right-aligned under the table.
export function TotalsSection({ subtotalMinor, taxMinor, grandTotalMinor }: { subtotalMinor: number; taxMinor: number; grandTotalMinor: number }) {
  return (
    <section style={{ maxWidth: '90mm', marginLeft: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Subtotal</span>
        <span>{formatMinor(subtotalMinor)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Tax</span>
        <span>{formatMinor(taxMinor)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '4px' }}>
        <span>Grand total</span>
        <span>{formatMinor(grandTotalMinor)}</span>
      </div>
    </section>
  )
}
