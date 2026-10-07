import { describe, expect, it } from 'vitest'

import { pullLatestChanges } from '../../project/sharedData'
import { finalizeDocument, isNumberedType, nextNumber, printedTotals, unsendDocument, type Counter } from '../finalize'
import { newInvoice } from '../newInvoice'
import type { DocumentModel } from '../types'

const counter: Counter = { type: 'invoice', prefix: 'INV-', next: 7, yearlyReset: false }
const draft: DocumentModel = {
  ...newInvoice({ id: 'd1', projectId: 'p1', today: '2026-10-07' }),
  customer: { name: 'Acme', address: ['300 Main St'] },
  lineItems: [{ id: 'l1', title: 'Design', description: '', quantity: 1, unitPriceMinor: 10000, taxRateMinor: 1900 }],
}

describe('nextNumber', () => {
  it('formats the next number with its prefix and advances the counter', () => {
    expect(nextNumber(counter, new Date('2026-10-07'))).toEqual({ number: 'INV-0007', counter: { ...counter, next: 8 } })
  })

  it('fills {YYYY} and restarts at 1 in a new year when yearly reset is on', () => {
    const yearly: Counter = { type: 'invoice', prefix: 'INV-{YYYY}-', next: 42, yearlyReset: true, year: 2025 }
    expect(nextNumber(yearly, new Date('2026-01-02')).number).toBe('INV-2026-0001')
    expect(nextNumber({ ...yearly, year: 2026 }, new Date('2026-05-02')).number).toBe('INV-2026-0042')
  })
})

describe('finalizeDocument', () => {
  it('numbers, marks sent and freezes the computed totals', () => {
    const sent = finalizeDocument(draft, 'INV-0007', '2026-10-07T10:00:00.000Z')
    expect(sent).toMatchObject({ status: 'sent', number: 'INV-0007' })
    expect(sent.frozen).toEqual({ finalizedAt: '2026-10-07T10:00:00.000Z', totals: { lineNets: [10000], subtotalMinor: 10000, taxMinor: 1900, grandTotalMinor: 11900 } })
  })

  it('prints the frozen totals even if the line items change afterwards', () => {
    const sent = finalizeDocument(draft, 'INV-0007', '2026-10-07T10:00:00.000Z')
    const tampered = { ...sent, lineItems: [{ ...sent.lineItems[0], unitPriceMinor: 1 }] }
    expect(printedTotals(tampered).grandTotalMinor).toBe(11900)
    expect(printedTotals(draft).grandTotalMinor).toBe(11900)
  })

  it('numbers only quotes, agreements, invoices, credit notes and receipts', () => {
    expect(isNumberedType('invoice')).toBe(true)
    expect(isNumberedType('welcome')).toBe(false)
  })
})

describe('unsend and pull latest', () => {
  it('returns a sent document to draft but keeps its number and snapshot', () => {
    const back = unsendDocument(finalizeDocument(draft, 'INV-0007', '2026-10-07T10:00:00.000Z'))
    expect(back).toMatchObject({ status: 'draft', number: 'INV-0007' })
    expect(back.frozen).toBeDefined()
  })

  it('lists what pulling the latest project data would change', () => {
    const shared = { customerName: 'Acme Coffee', customerAddress: ['300 Main St'] }
    expect(pullLatestChanges(draft, shared)).toEqual([{ field: 'Client name', from: 'Acme', to: 'Acme Coffee' }])
  })
})
