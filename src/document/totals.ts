// The single totals engine; components consume it and never reimplement totals math.

import { roundMinor } from './money'

// Percent (minor units of percent, 1900 = 19%) or flat minor units.
export interface Discount {
  kind: 'percent' | 'amount'
  value: number
}

// taxRateMinor 0 means untaxed.
interface ShippingFee {
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

export type TaxMode = 'exclusive' | 'inclusive' | 'none'

interface TotalsInput {
  taxMode?: TaxMode
  lineItems: Array<{ quantity: number; unitPriceMinor: number; taxRateMinor: number; discount?: Discount }>
  discount?: Discount
  shippingFees?: ShippingFee[]
}

type Amount = { amountMinor: number; rateMinor: number }

function roundedLineNets(lineItems: TotalsInput['lineItems']): number[] {
  return lineItems.map((item) => {
    const gross = item.quantity * item.unitPriceMinor // only float source, so round per line
    const lineDiscount = item.discount ? (item.discount.kind === 'percent' ? (gross * item.discount.value) / 10000 : item.discount.value) : 0
    return roundMinor(gross - lineDiscount, 0) // once per line, never cascades
  })
}

// Exclusive prices: tax is added on each rounded line net and each shipping/fee entry, grouped by rate.
function addedTax(amounts: Amount[]): Map<number, number> {
  const byRate = new Map<number, number>()
  for (const { amountMinor, rateMinor } of amounts) {
    if (rateMinor === 0) continue
    byRate.set(rateMinor, (byRate.get(rateMinor) ?? 0) + roundMinor((amountMinor * rateMinor) / 10000, 0))
  }
  return byRate
}

// Inclusive prices: each rate group's gross is scaled by the document discount, then its tax is extracted once.
function extractedTax(amounts: Amount[], discountFactor: number): Map<number, number> {
  const grossByRate = new Map<number, number>()
  for (const { amountMinor, rateMinor } of amounts) grossByRate.set(rateMinor, (grossByRate.get(rateMinor) ?? 0) + amountMinor)
  const byRate = new Map<number, number>()
  for (const [rateMinor, gross] of grossByRate) {
    if (rateMinor === 0) continue
    const discounted = roundMinor(gross * discountFactor, 0)
    byRate.set(rateMinor, roundMinor((discounted * rateMinor) / (10000 + rateMinor), 0))
  }
  return byRate
}

export function computeTotals(doc: TotalsInput): Totals {
  const taxMode = doc.taxMode ?? 'exclusive'
  const lineNets = roundedLineNets(doc.lineItems)
  const subtotalMinor = lineNets.reduce((a, b) => a + b, 0)
  const discountMinor = doc.discount
    ? doc.discount.kind === 'percent'
      ? roundMinor((subtotalMinor * doc.discount.value) / 10000, 0)
      : doc.discount.value
    : 0
  const discountedSubtotalMinor = subtotalMinor - discountMinor
  const shippingFees = doc.shippingFees ?? []
  const shippingFeesMinor = shippingFees.reduce((a, sf) => a + sf.amountMinor, 0)

  const lines: Amount[] = doc.lineItems.map((item, i) => ({ amountMinor: lineNets[i], rateMinor: item.taxRateMinor }))
  const fees: Amount[] = shippingFees.map((sf) => ({ amountMinor: sf.amountMinor, rateMinor: sf.taxRateMinor }))
  const discountFactor = subtotalMinor === 0 ? 1 : discountedSubtotalMinor / subtotalMinor
  const taxByRate =
    taxMode === 'none'
      ? new Map<number, number>()
      : taxMode === 'inclusive'
        ? mergeRates(extractedTax(lines, discountFactor), extractedTax(fees, 1))
        : addedTax([...lines, ...fees])

  const taxMinor = [...taxByRate.values()].reduce((a, b) => a + b, 0)
  return {
    lineNets,
    subtotalMinor,
    discountMinor,
    discountedSubtotalMinor,
    shippingFeesMinor,
    taxByRate: [...taxByRate.entries()].map(([rateMinor, taxMinor]) => ({ rateMinor, taxMinor })),
    taxMinor,
    grandTotalMinor: discountedSubtotalMinor + shippingFeesMinor + (taxMode === 'exclusive' ? taxMinor : 0),
  }
}

function mergeRates(a: Map<number, number>, b: Map<number, number>): Map<number, number> {
  const merged = new Map(a)
  for (const [rate, tax] of b) merged.set(rate, (merged.get(rate) ?? 0) + tax)
  return merged
}
