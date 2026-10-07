// The single totals and watermark engine; components consume it and never reimplement totals math.

import { roundMinor } from './money'

// Percent (minor units of percent, 1900 = 19%) or flat minor units.
export interface Discount {
  kind: 'percent' | 'amount'
  value: number
}

// taxRateMinor 0 means untaxed.
export interface ShippingFee {
  label: string | import('./richtext').RichTextDoc
  amountMinor: number
  taxRateMinor: number
}

export interface Totals {
  lineNets: number[] // per-line rounded nets, so the printed line equals the engine line
  subtotalMinor: number // sum of rounded line nets
  discountMinor: number // document-level discount; line discounts are already inside lineNets
  discountedSubtotalMinor: number
  shippingFeesMinor: number // sum of shipping/fee amounts before tax
  taxByRate: Array<{ rateMinor: number; taxMinor: number }> // grouped by rate
  taxMinor: number
  grandTotalMinor: number
}

export function computeTotals(doc: {
  lineItems: Array<{ quantity: number; unitPriceMinor: number; taxRateMinor: number; discount?: Discount }>
  discount?: Discount
  shippingFees?: ShippingFee[]
}): Totals {
  const lineNets = doc.lineItems.map((item) => {
    const gross = item.quantity * item.unitPriceMinor // only float source, so round per line
    const lineDiscount = item.discount
      ? item.discount.kind === 'percent'
        ? (gross * item.discount.value) / 10000
        : item.discount.value
      : 0
    return roundMinor(gross - lineDiscount, 0) // once per line, never cascades
  })
  const subtotalMinor = lineNets.reduce((a, b) => a + b, 0)
  const discountMinor = doc.discount
    ? doc.discount.kind === 'percent'
      ? roundMinor((subtotalMinor * doc.discount.value) / 10000, 0)
      : doc.discount.value
    : 0
  const discountedSubtotalMinor = subtotalMinor - discountMinor

  const taxByRate = new Map<number, number>() // grouped by rate
  const addTax = (net: number, rateMinor: number) => {
    if (rateMinor === 0) return
    const t = roundMinor((net * rateMinor) / 10000, 0) // tax on the rounded net, never the raw float
    taxByRate.set(rateMinor, (taxByRate.get(rateMinor) ?? 0) + t)
  }
  doc.lineItems.forEach((item, i) => addTax(lineNets[i], item.taxRateMinor))
  // Shipping/fees are summed like lines, with their tax folded into taxByRate.
  const shippingFees = doc.shippingFees ?? []
  const shippingFeesMinor = shippingFees.reduce((a, sf) => a + sf.amountMinor, 0)
  shippingFees.forEach((sf) => addTax(sf.amountMinor, sf.taxRateMinor))

  const taxMinor = [...taxByRate.values()].reduce((a, b) => a + b, 0)
  return {
    lineNets,
    subtotalMinor,
    discountMinor,
    discountedSubtotalMinor,
    shippingFeesMinor,
    taxByRate: [...taxByRate.entries()].map(([rateMinor, taxMinor]) => ({ rateMinor, taxMinor })),
    taxMinor,
    grandTotalMinor: discountedSubtotalMinor + taxMinor + shippingFeesMinor,
  }
}

export function deriveWatermark(status: 'draft' | 'sent' | 'paid'): 'draft' | null {
  return status === 'draft' ? 'draft' : null
}
