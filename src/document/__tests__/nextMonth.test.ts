import { describe, expect, it } from 'vitest'

import { finalizeDocument } from '../finalize'
import { newInvoice } from '../newInvoice'
import { addMonths, forNextMonth } from '../nextMonth'
import type { DocumentModel } from '../types'

describe('addMonths', () => {
  it('moves to the same day next month, clamping to the month end', () => {
    expect(addMonths('2026-10-07', 1)).toBe('2026-11-07')
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
  })
})

describe('forNextMonth', () => {
  it('copies a sent invoice as a fresh draft a month later, without number, payments or snapshot', () => {
    const sent: DocumentModel = {
      ...finalizeDocument({ ...newInvoice({ id: 'i', projectId: 'p', today: '2026-10-01' }), dueDate: '2026-10-15' }, 'INV-0009', '2026-10-01T00:00:00.000Z'),
      payments: [{ id: 'x', date: '2026-10-02', amountMinor: 1, method: 'Bank' }],
    }
    const next = forNextMonth(sent, 'n')
    expect(next).toMatchObject({ id: 'n', status: 'draft', number: '', issueDate: '2026-11-01', dueDate: '2026-11-15' })
    expect(next.frozen).toBeUndefined()
    expect(next.payments).toBeUndefined()
  })

  it('advances month-and-year period labels in report headings', () => {
    const report: DocumentModel = {
      ...newInvoice({ id: 'r', projectId: 'p', today: '2026-12-01' }),
      type: 'monthlyReport',
      blocks: [{ id: 'h', type: 'heading', text: 'Monthly Report — December 2026' }],
    }
    expect(forNextMonth(report, 'n').blocks?.[0]).toMatchObject({ text: 'Monthly Report — January 2027' })
  })
})
