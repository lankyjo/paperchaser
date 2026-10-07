import { describe, expect, it } from 'vitest'

import { FIXTURE_MAP } from '../fixtures'
import { roundMinor } from '../money'
import { computeTotals, deriveWatermark } from '../totals'
import { documentSchema } from '../types'

describe('roundMinor — half-away-from-zero ties (A1, Pitfall 2)', () => {
  it('rounds a negative .5 tie AWAY from zero — Math.round(-2.5) is -2, roundMinor yields -3', () => {
    expect(roundMinor(-2.5, 0)).toBe(-3)
  })

  it('rounds a positive .5 tie away from zero', () => {
    expect(roundMinor(2.5, 0)).toBe(3)
  })
})

describe('computeTotals — per-line rounding (D-01/D-03, Pitfall 1)', () => {
  it('subtotal is the SUM OF ROUNDED line nets, not the rounded raw sum', () => {
    // Each 0.5 x 211 = 105.5 rounds to 106, so the subtotal is 212, not round(211) = 211.
    const totals = computeTotals({
      lineItems: [
        { quantity: 0.5, unitPriceMinor: 211, taxRateMinor: 1900 },
        { quantity: 0.5, unitPriceMinor: 211, taxRateMinor: 1900 },
      ],
    })
    expect(totals.lineNets).toEqual([106, 106])
    expect(totals.subtotalMinor).toBe(212)
    expect(totals.subtotalMinor).not.toBe(211) // proves rounding happened per line
  })

  it('EUR fractional-quantity case: qty 0.1 × 1000¢ at 19% → subtotal 100, grand total 119', () => {
    const totals = computeTotals({
      lineItems: [{ quantity: 0.1, unitPriceMinor: 1000, taxRateMinor: 1900 }],
    })
    expect(totals.subtotalMinor).toBe(100)
    expect(totals.taxMinor).toBe(19) // 100 × 19% = 19¢
    expect(totals.grandTotalMinor).toBe(119)
  })

  it('EUR amounts are whole cents: qty 0.5 × 211¢ rounds to 106¢, never 105.5¢', () => {
    const totals = computeTotals({
      lineItems: [{ quantity: 0.5, unitPriceMinor: 211, taxRateMinor: 1900 }],
    })
    expect(totals.lineNets).toEqual([106])
    expect(totals.taxMinor).toBe(20) // 106 × 19% = 20.14 → 20¢
    expect(totals.grandTotalMinor).toBe(126)
  })

  it('EUR percent document discount rounds to whole cents', () => {
    const totals = computeTotals({
      lineItems: [{ quantity: 1, unitPriceMinor: 333, taxRateMinor: 0 }],
      discount: { kind: 'percent', value: 1000 },
    })
    expect(totals.discountMinor).toBe(33) // 10% of 333 = 33.3 → 33¢
  })
})

describe('computeTotals — per-currency decimals (D-12)', () => {
  it('JPY (0dp) rounds to whole yen: qty 3 × 12345 at 10% → subtotal 37035', () => {
    const totals = computeTotals({
      lineItems: [{ quantity: 3, unitPriceMinor: 12345, taxRateMinor: 1000 }],
    })
    expect(totals.subtotalMinor).toBe(37035)
    // tax = 37035 × 10% = 3703.5 → half-away-from-zero rounds UP to 3704
    expect(totals.taxMinor).toBe(3704)
    expect(totals.grandTotalMinor).toBe(40739)
  })
})

describe('computeTotals — tax on the ROUNDED net, never the raw float (D-03)', () => {
  it('a fractional net rounds first; tax is computed on the rounded net', () => {
    // Net 105.5 rounds to 106; tax on 106 is 20.5958 -> 21, whereas tax on 105.5 would round to 20.
    const totals = computeTotals({
      lineItems: [{ quantity: 0.5, unitPriceMinor: 211, taxRateMinor: 1943 }],
    })
    expect(totals.lineNets).toEqual([106])
    expect(totals.taxMinor).toBe(21)
    expect(totals.taxByRate).toEqual([{ rateMinor: 1943, taxMinor: 21 }])
    expect(totals.grandTotalMinor).toBe(127)
  })
})

describe('computeTotals — reconciliation invariant Σ lineNets == subtotalMinor (D-01)', () => {
  it('holds on the per-line-rounded JPY document', () => {
    const totals = computeTotals({
      lineItems: [
        { quantity: 0.5, unitPriceMinor: 211, taxRateMinor: 1900 },
        { quantity: 0.5, unitPriceMinor: 211, taxRateMinor: 1900 },
      ],
    })
    const lineNetsSum = totals.lineNets.reduce((a, b) => a + b, 0)
    expect(lineNetsSum).toBe(totals.subtotalMinor)
    expect(totals.grandTotalMinor).toBe(212 + 40) // 212 subtotal + 2 × 20 tax
  })

  it('holds on a multi-line EUR document', () => {
    const totals = computeTotals({
      lineItems: [
        { quantity: 2, unitPriceMinor: 90000, taxRateMinor: 1900 },
        { quantity: 1, unitPriceMinor: 45000, taxRateMinor: 1900 },
        { quantity: 50, unitPriceMinor: 120, taxRateMinor: 1900 },
      ],
    })
    expect(totals.lineNets).toEqual([180000, 45000, 6000])
    const lineNetsSum = totals.lineNets.reduce((a, b) => a + b, 0)
    expect(lineNetsSum).toBe(totals.subtotalMinor)
    expect(totals.subtotalMinor).toBe(231000)
    expect(totals.taxMinor).toBe(43890)
    expect(totals.grandTotalMinor).toBe(274890)
  })
})

describe('documentSchema — restructured model accepts the Phase 1 fixture shape (D-15, D-11)', () => {
  it('parses the invoice-torture fixture (type + status replace watermark)', () => {
    const parsed = documentSchema.safeParse(FIXTURE_MAP['invoice-torture'])
    expect(parsed.success).toBe(true)
  })

  it('parses the invoice-simple fixture', () => {
    const parsed = documentSchema.safeParse(FIXTURE_MAP['invoice-simple'])
    expect(parsed.success).toBe(true)
  })

  it('strips unknown keys, does not reject them (D-14)', () => {
    const withExtra = { ...FIXTURE_MAP['invoice-simple'], extraField: 'should-be-stripped' }
    const parsed = documentSchema.safeParse(withExtra)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect('extraField' in parsed.data).toBe(false)
    }
  })

  it('rejects an external http(s) logo URL (T-02-02-LOGO)', () => {
    const evilLogo = {
      ...FIXTURE_MAP['invoice-simple'],
      company: { ...FIXTURE_MAP['invoice-simple'].company, logo: 'https://evil.example/pixel.png' },
    }
    expect(documentSchema.safeParse(evilLogo).success).toBe(false)
  })
})

describe('computeTotals — per-line discounts (D-05/D-06)', () => {
  it('a per-line percent discount reduces the net BEFORE rounding', () => {
    // 0.5 x 211 = 105.5, minus 25% = 79.125 -> 79; rounding before discounting would give 80.
    const totals = computeTotals({
      lineItems: [{ quantity: 0.5, unitPriceMinor: 211, taxRateMinor: 1900, discount: { kind: 'percent', value: 2500 } }],
    })
    expect(totals.lineNets).toEqual([79])
    expect(totals.subtotalMinor).toBe(79)
  })

  it('a per-line flat-amount discount reduces the net by exact minor units', () => {
    const totals = computeTotals({
      lineItems: [{ quantity: 2, unitPriceMinor: 1000, taxRateMinor: 1900, discount: { kind: 'amount', value: 500 } }],
    })
    expect(totals.lineNets).toEqual([1500]) // 2000 − 500
    expect(totals.subtotalMinor).toBe(1500)
  })
})

describe('computeTotals — document-level discount applied to the discounted subtotal (D-05)', () => {
  it('a percent document discount applies AFTER line discounts and rounds', () => {
    // 2 x 1000 with 10% line discount nets 1800; the 10% document discount applies to that: 180.
    const totals = computeTotals({
      lineItems: [{ quantity: 2, unitPriceMinor: 1000, taxRateMinor: 1900, discount: { kind: 'percent', value: 1000 } }],
      discount: { kind: 'percent', value: 1000 },
    })
    expect(totals.subtotalMinor).toBe(1800)
    expect(totals.discountMinor).toBe(180) // 10% of 1800 — not of the raw 2000
    expect(totals.discountedSubtotalMinor).toBe(1620)
    expect(totals.taxMinor).toBe(342) // 1800 × 19%
    expect(totals.grandTotalMinor).toBe(1962)
  })

  it('a flat document discount subtracts exact minor units from the subtotal', () => {
    const totals = computeTotals({
      lineItems: [
        { quantity: 2, unitPriceMinor: 1000, taxRateMinor: 1900 },
        { quantity: 1, unitPriceMinor: 500, taxRateMinor: 1900 },
      ],
      discount: { kind: 'amount', value: 300 },
    })
    expect(totals.subtotalMinor).toBe(2500)
    expect(totals.discountMinor).toBe(300)
    expect(totals.discountedSubtotalMinor).toBe(2200)
    expect(totals.taxMinor).toBe(475) // 380 + 95
    expect(totals.grandTotalMinor).toBe(2675)
  })
})

describe('computeTotals — shipping/fees are line-like, tax grouped by rate (D-07/D-08/D-04)', () => {
  it('taxed + untaxed entries: amounts sum; taxed tax folds in; untaxed adds no tax', () => {
    const totals = computeTotals({
      lineItems: [{ quantity: 1, unitPriceMinor: 1000, taxRateMinor: 1900 }],
      shippingFees: [
        { label: 'Versand', amountMinor: 400, taxRateMinor: 1900 },
        { label: 'Verpackung', amountMinor: 100, taxRateMinor: 0 },
      ],
    })
    expect(totals.shippingFeesMinor).toBe(500)
    // rate 1900: 190 (line) + 76 (400 × 19%); rate 0 skipped entirely
    expect(totals.taxByRate).toEqual([{ rateMinor: 1900, taxMinor: 266 }])
    expect(totals.taxMinor).toBe(266)
    expect(totals.grandTotalMinor).toBe(1000 + 266 + 500)
  })

  it('multiple entries sharing a rate collapse into ONE taxByRate entry (D-04/D-08)', () => {
    const totals = computeTotals({
      lineItems: [{ quantity: 1, unitPriceMinor: 1000, taxRateMinor: 1900 }],
      shippingFees: [
        { label: 'Versand', amountMinor: 400, taxRateMinor: 1900 },
        { label: 'Express', amountMinor: 200, taxRateMinor: 1900 },
      ],
    })
    expect(totals.shippingFeesMinor).toBe(600)
    expect(totals.taxByRate).toEqual([{ rateMinor: 1900, taxMinor: 304 }]) // 190 + 76 + 38
    expect(totals.taxByRate).toHaveLength(1)
    // full grandTotal reconciliation: discountedSubtotal + tax + shippingFees
    expect(totals.grandTotalMinor).toBe(totals.discountedSubtotalMinor + totals.taxMinor + totals.shippingFeesMinor)
  })
})

describe('deriveWatermark — derives from status, never stored (D-11)', () => {
  it("maps 'draft' to 'draft'", () => {
    expect(deriveWatermark('draft')).toBe('draft')
  })

  it("maps 'sent' to null", () => {
    expect(deriveWatermark('sent')).toBeNull()
  })

  it("maps 'paid' to null", () => {
    expect(deriveWatermark('paid')).toBeNull()
  })
})

describe('computeTotals — tax modes', () => {
  it('inclusive: prices already contain tax, which is extracted rather than added', () => {
    const totals = computeTotals({ taxMode: 'inclusive', lineItems: [{ quantity: 1, unitPriceMinor: 11900, taxRateMinor: 1900 }] })
    expect(totals.subtotalMinor).toBe(11900)
    expect(totals.taxMinor).toBe(1900)
    expect(totals.grandTotalMinor).toBe(11900)
  })

  it('inclusive: tax is extracted per rate group after the document discount, rounding once per group', () => {
    const totals = computeTotals({
      taxMode: 'inclusive',
      lineItems: [
        { quantity: 1, unitPriceMinor: 11900, taxRateMinor: 1900 },
        { quantity: 1, unitPriceMinor: 10700, taxRateMinor: 700 },
      ],
      discount: { kind: 'percent', value: 1000 },
    })
    expect(totals.subtotalMinor).toBe(22600)
    expect(totals.discountMinor).toBe(2260)
    expect(totals.taxByRate).toEqual([
      { rateMinor: 1900, taxMinor: 1710 },
      { rateMinor: 700, taxMinor: 630 },
    ])
    expect(totals.grandTotalMinor).toBe(20340)
  })

  it('none: no tax is charged whatever the line rates say', () => {
    const totals = computeTotals({ taxMode: 'none', lineItems: [{ quantity: 2, unitPriceMinor: 5000, taxRateMinor: 1900 }] })
    expect(totals.taxMinor).toBe(0)
    expect(totals.taxByRate).toEqual([])
    expect(totals.grandTotalMinor).toBe(10000)
  })
})
