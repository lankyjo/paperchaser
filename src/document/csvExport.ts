import { printedTotals } from './finalize'
import { currencyDecimals } from './money'
import { invoiceBalance, paidTotal } from './payments'
import { getPlainText } from './richtext'
import { DOC_TYPES } from './docTypes'
import type { DocumentModel } from './types'

const HEADER = ['Number', 'Type', 'Issued', 'Due', 'Client', 'Currency', 'Subtotal', 'Tax', 'Total', 'Paid', 'Balance', 'Status']

// Quotes a CSV field when it contains a comma, quote or line break, doubling inner quotes.
const field = (value: string) => (/[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value)

// Sent invoices, receipts and credit notes issued within the dates, for an accountant; amounts in major units.
export function moneyDocumentsCsv(documents: DocumentModel[], range: { from: string; to: string }): string {
  const rows = documents
    .filter((d) => DOC_TYPES[d.type].exported && d.status !== 'draft' && d.issueDate >= range.from && d.issueDate <= range.to)
    .sort((a, b) => a.issueDate.localeCompare(b.issueDate))
    .map((d) => {
      const decimals = currencyDecimals(d.currency)
      const major = (minor: number) => (minor / 10 ** decimals).toFixed(decimals)
      const totals = printedTotals(d)
      const balance = DOC_TYPES[d.type].payable ? invoiceBalance(d) : 0
      return [getPlainText(d.number), DOC_TYPES[d.type].title, d.issueDate, d.dueDate ?? '', getPlainText(d.customer.name), d.currency, major(totals.subtotalMinor), major(totals.taxMinor), major(totals.grandTotalMinor), major(paidTotal(d)), major(balance), d.status]
        .map(field)
        .join(',')
    })
  return [HEADER.join(','), ...rows].join('\n')
}
