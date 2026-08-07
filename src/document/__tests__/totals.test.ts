import { describe, expect, it } from 'vitest'

import { FIXTURE_MAP } from '../fixtures'
import { CURRENCY_DECIMALS, roundMinor } from '../money'
import { computeTotals } from '../totals'
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
    // Each line: qty 0.5 × 211¢ = 105.5¢ gross → rounds to 106¢ per line (JPY 0dp).
    // Sum of rounded nets: 212. Rounded raw sum: round(105.5 + 105.5) = 211.
    // Per-line rounding wins (D-01) — the .5-boundary companion case.
    const totals = computeTotals({
      currency: 'JPY',
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
      currency: 'EUR',
      lineItems: [{ quantity: 0.1, unitPriceMinor: 1000, taxRateMinor: 1900 }],
    })
    expect(totals.subtotalMinor).toBe(100)
    expect(totals.taxMinor).toBe(19) // 100 × 19% = 19¢
    expect(totals.grandTotalMinor).toBe(119)
  })
})

describe('computeTotals — per-currency decimals (D-12)', () => {
  it('registers EUR 2dp and JPY 0dp', () => {
    expect(CURRENCY_DECIMALS).toEqual({ EUR: 2, JPY: 0 })
  })

  it('JPY (0dp) rounds to whole yen: qty 3 × 12345 at 10% → subtotal 37035', () => {
    const totals = computeTotals({
      currency: 'JPY',
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
    // Net: qty 0.5 × 211¢ = 105.5¢ → rounds to 106¢ (JPY 0dp).
    // Tax on the rounded net: 106 × 1943/10000 = 20.5958 → 21.
    // Tax on the raw float net: 105.5 × 1943/10000 = 20.49865 → 20.
    // Pinning D-03: the engine uses the rounded net, so tax = 21.
    const totals = computeTotals({
      currency: 'JPY',
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
      currency: 'JPY',
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
      currency: 'EUR',
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
