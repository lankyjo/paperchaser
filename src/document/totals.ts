/**
 * Pure derived-state engine for the document model: totals and watermark.
 *
 * Nothing in this file may depend on React, the DOM, or Dexie — Node-testable
 * by construction (02-RESEARCH.md Architecture Responsibility Map).
 *
 * This is the SINGLE totals engine (LINE-03). Components consume it, they
 * never reimplement totals math (ARCHITECTURE.md Anti-Pattern 1; the inline
 * copy at DocumentPage.tsx:27 was deleted in plan 02-02).
 */

import { roundMinor } from './money'

// D-06: percent (in % minor units, 1900 = 19%) or flat minor units
export interface Discount {
  kind: 'percent' | 'amount'
  value: number
}

// D-07/D-08; taxRateMinor 0 = untaxed
export interface ShippingFee {
  label: string | import('./richtext').RichTextDoc
  amountMinor: number
  taxRateMinor: number
}

export interface Totals {
  lineNets: number[] // per-line rounded nets (reconciliation: printed line == engine line)
  subtotalMinor: number // D-01: Σ rounded line nets
  discountMinor: number // document-level discount (D-05); line discounts are inside lineNets
  discountedSubtotalMinor: number
  shippingFeesMinor: number // Σ shipping/fee amounts (before tax) — uniform treatment (D-07);
  // per-entry labels live in the model for the Phase 3 renderer to split
  taxByRate: Array<{ rateMinor: number; taxMinor: number }> // D-04: grouped by rate
  taxMinor: number
  grandTotalMinor: number
}

export function computeTotals(doc: {
  lineItems: Array<{ quantity: number; unitPriceMinor: number; taxRateMinor: number; discount?: Discount }>
  discount?: Discount
  shippingFees?: ShippingFee[]
}): Totals {
  const lineNets = doc.lineItems.map((item) => {
    const gross = item.quantity * item.unitPriceMinor // only float source — round per line (D-01)
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

  const taxByRate = new Map<number, number>() // D-04: grouped by rate
  const addTax = (net: number, rateMinor: number) => {
    if (rateMinor === 0) return
    const t = roundMinor((net * rateMinor) / 10000, 0) // tax on the rounded net, never the raw float
    taxByRate.set(rateMinor, (taxByRate.get(rateMinor) ?? 0) + t)
  }
  doc.lineItems.forEach((item, i) => addTax(lineNets[i], item.taxRateMinor))
  // D-07: shipping/fees are line-like entries — the engine sums them uniformly
  // (amount + optional tax folded into taxByRate). Per-entry labels stay in the
  // model; splitting "Shipping" vs "Fees" display rows is a Phase 3 render concern.
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
  return status === 'draft' ? 'draft' : null // D-11: watermark derives from status
}
