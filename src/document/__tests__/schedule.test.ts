import { describe, expect, it } from 'vitest'

import { computeTotals } from '../totals'
import { finalizeDocument } from '../finalize'
import { findSchedule, invoiceForScheduleRow, priorScheduleInvoices, scheduleAmounts, scheduleWarning, syncScheduledInvoice, type ScheduleBlock } from '../schedule'
import { documentSchema } from '../types'

const schedule: ScheduleBlock = {
  id: 's',
  type: 'paymentSchedule',
  totalMinor: 100001,
  taxRateMinor: 0,
  rows: [
    { id: 'r1', label: 'Deposit', percentMinor: 3000, due: 'On signing' },
    { id: 'r2', label: 'Milestone', percentMinor: 4000, due: 'Mid-project' },
    { id: 'r3', label: 'Balance', percentMinor: 3000, due: 'On delivery' },
  ],
}
const make = (rowId: string, prior = [] as ReturnType<typeof invoiceForScheduleRow>[]) =>
  invoiceForScheduleRow(schedule, rowId, { id: `inv-${rowId}`, projectId: 'p1', agreementId: 'a1', today: '2026-10-07', priorInvoices: prior })

describe('scheduleAmounts', () => {
  it('splits the total by percent and lets the last row absorb rounding', () => {
    expect(scheduleAmounts(schedule)).toEqual([30000, 40000, 30001])
  })

  it('warns when the percentages do not add up to 100%', () => {
    expect(scheduleWarning(schedule)).toBeNull()
    expect(scheduleWarning({ ...schedule, rows: schedule.rows.slice(0, 2) })).toBe('The schedule adds up to 70%, not 100%')
  })
})

describe('invoiceForScheduleRow', () => {
  it('invoices an early row for its share and links back to the agreement row', () => {
    const deposit = make('r1')
    expect(documentSchema.parse(deposit)).toEqual(deposit)
    expect(deposit.scheduleRef).toEqual({ agreementId: 'a1', rowId: 'r1' })
    expect(computeTotals(deposit).grandTotalMinor).toBe(30000)
  })

  it('invoices the final row as the full scope less each earlier invoice', () => {
    const deposit = finalizeDocument(make('r1'), 'INV-0003', '2026-10-07T00:00:00.000Z')
    const milestone = make('r2')
    const balance = make('r3', [deposit, milestone])
    expect(balance.lineItems.map((l) => [l.title, l.unitPriceMinor])).toEqual([
      ['Project fee', 100001],
      ['Less INV-0003', -30000],
      ['Less Milestone', -40000],
    ])
    expect(computeTotals(balance).grandTotalMinor).toBe(30001)
  })
})

describe('syncScheduledInvoice', () => {
  it('updates a draft to a changed schedule and flags a sent invoice that no longer matches', () => {
    const changed = { ...schedule, rows: [{ ...schedule.rows[0], percentMinor: 5000 }, ...schedule.rows.slice(1)] }
    const draft = make('r1')
    expect(computeTotals(syncScheduledInvoice(draft, changed, []).invoice).grandTotalMinor).toBe(50001)
    const sent = finalizeDocument(draft, 'INV-0001', '2026-10-07T00:00:00.000Z')
    const result = syncScheduledInvoice(sent, changed, [])
    expect(result.invoice).toBe(sent)
    expect(result.mismatch).toBe(true)
  })
})

describe('priorScheduleInvoices', () => {
  it('returns the live invoices of earlier rows of this agreement, in row order', () => {
    const deposit = make('r1')
    const milestone = make('r2')
    const voided = { ...make('r2'), id: 'void', status: 'void' as const }
    const other = { ...make('r1'), id: 'other', scheduleRef: { agreementId: 'a2', rowId: 'r1' } }
    expect(priorScheduleInvoices(schedule, 'r3', [milestone, voided, other, deposit], 'a1')).toEqual([deposit, milestone])
    expect(priorScheduleInvoices(schedule, 'r1', [deposit], 'a1')).toEqual([])
  })

  it('finds the schedule block of an agreement', () => {
    expect(findSchedule({ blocks: [schedule] })).toBe(schedule)
    expect(findSchedule({ blocks: undefined })).toBeUndefined()
  })
})
