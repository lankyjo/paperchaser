import type { Block } from './blocks'
import { printedTotals } from './finalize'
import { newInvoice } from './newInvoice'
import { roundMinor } from './money'
import { getPlainText } from './richtext'
import type { DocumentModel } from './types'

export type ScheduleBlock = Extract<Block, { type: 'paymentSchedule' }>
type LineItem = DocumentModel['lineItems'][number]

const FULL = 10000

// Each row's share of the total; when the rows add up to 100% the last one absorbs the rounding.
export function scheduleAmounts(block: ScheduleBlock): number[] {
  const shares = block.rows.map((row) => roundMinor((block.totalMinor * row.percentMinor) / FULL, 0))
  const sum = block.rows.reduce((n, r) => n + r.percentMinor, 0)
  if (sum !== FULL || shares.length === 0) return shares
  const earlier = shares.slice(0, -1).reduce((n, a) => n + a, 0)
  return [...shares.slice(0, -1), block.totalMinor - earlier]
}

export function scheduleWarning(block: ScheduleBlock): string | null {
  const sum = block.rows.reduce((n, r) => n + r.percentMinor, 0)
  return sum === FULL ? null : `The schedule adds up to ${sum / 100}%, not 100%`
}

const line = (id: string, title: string, amount: number, taxRateMinor: number, deduction = false): LineItem => ({
  id,
  title,
  description: '',
  quantity: 1,
  unitPriceMinor: amount,
  taxRateMinor,
  ...(deduction && { deduction }),
})

// Lines for a row: its share, or for the final row the full scope less every earlier invoice.
function scheduleLines(block: ScheduleBlock, rowId: string, invoiceId: string, priorInvoices: DocumentModel[]): LineItem[] {
  const idx = block.rows.findIndex((r) => r.id === rowId)
  const row = block.rows[idx]
  if (idx < block.rows.length - 1 || priorInvoices.length === 0) {
    return [line(`${invoiceId}-share`, `${row.label} (${row.percentMinor / 100}%)`, scheduleAmounts(block)[idx], block.taxRateMinor)]
  }
  const deductions = priorInvoices.map((prior) => {
    const label = getPlainText(prior.number) || block.rows.find((r) => r.id === prior.scheduleRef?.rowId)?.label || 'earlier invoice'
    return line(`${invoiceId}-less-${prior.id}`, `Less ${label}`, -printedTotals(prior).subtotalMinor, block.taxRateMinor, true)
  })
  return [line(`${invoiceId}-fee`, 'Project fee', block.totalMinor, block.taxRateMinor), ...deductions]
}

interface ScheduleInvoiceArgs {
  id: string
  projectId: string
  agreementId: string
  today: string
  priorInvoices: DocumentModel[]
}

export function invoiceForScheduleRow(block: ScheduleBlock, rowId: string, args: ScheduleInvoiceArgs): DocumentModel {
  return {
    ...newInvoice({ id: args.id, projectId: args.projectId, today: args.today }),
    scheduleRef: { agreementId: args.agreementId, rowId },
    lineItems: scheduleLines(block, rowId, args.id, args.priorInvoices),
  }
}

// Drafts follow schedule edits; a sent invoice is left alone but flagged when it no longer matches its row.
export function syncScheduledInvoice(invoice: DocumentModel, block: ScheduleBlock, priorInvoices: DocumentModel[]) {
  const ref = invoice.scheduleRef
  if (ref === undefined || !block.rows.some((r) => r.id === ref.rowId)) return { invoice, mismatch: false }
  const expected = scheduleLines(block, ref.rowId, invoice.id, priorInvoices)
  if (invoice.status === 'draft' && invoice.frozen === undefined) return { invoice: { ...invoice, lineItems: expected }, mismatch: false }
  const expectedTotal = expected.reduce((n, l) => n + l.unitPriceMinor, 0)
  return { invoice, mismatch: printedTotals(invoice).subtotalMinor !== expectedTotal }
}
