import { describe, expect, it } from 'vitest'

import { finalizeDocument } from '../finalize'
import { newInvoice } from '../newInvoice'
import { newReminder, overdueInvoices } from '../overdue'
import { documentSchema, type DocumentModel } from '../types'

const sent = (id: string, dueDate: string, paidMinor = 0): DocumentModel => ({
  ...finalizeDocument(
    { ...newInvoice({ id, projectId: 'p1', today: '2026-09-01' }), dueDate, lineItems: [{ id: 'l', title: 'Work', description: '', quantity: 1, unitPriceMinor: 10000, taxRateMinor: 0 }] },
    `INV-${id}`,
    '2026-09-01T00:00:00.000Z',
  ),
  payments: paidMinor ? [{ id: 'p', date: '2026-09-05', amountMinor: paidMinor, method: 'Bank' }] : undefined,
})

describe('newInvoice due date', () => {
  it('defaults to 14 days after the issue date', () => {
    expect(newInvoice({ id: 'x', projectId: 'p', today: '2026-10-25' }).dueDate).toBe('2026-11-08')
  })
})

describe('overdueInvoices', () => {
  it('lists sent invoices past due with a balance, oldest first, with days overdue', () => {
    const docs = [sent('2', '2026-10-01', 4000), sent('1', '2026-09-15'), sent('3', '2026-10-20'), sent('4', '2026-09-20', 10000), { ...sent('5', '2026-09-01'), status: 'void' as const }]
    expect(overdueInvoices(docs, '2026-10-07').map((o) => [o.invoice.id, o.balanceMinor, o.daysOverdue])).toEqual([
      ['1', 10000, 22],
      ['2', 6000, 6],
    ])
  })
})

describe('newReminder', () => {
  it('writes an unnumbered reminder letter quoting the invoice, due date and balance', () => {
    const invoice = sent('1', '2026-09-15', 4000)
    let n = 1
    const reminder = newReminder(invoice, 6000, { id: 'r', today: '2026-10-07', newId: () => `b${n++}` })
    expect(documentSchema.parse(reminder)).toEqual(reminder)
    expect(reminder).toMatchObject({ type: 'reminder', number: '', reminderFor: '1', status: 'draft' })
    expect(JSON.stringify(reminder.blocks)).toContain('INV-1')
  })
})
