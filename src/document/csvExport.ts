import { printedTotals } from './finalize'
import { currencyDecimals } from './money'
import { invoiceBalance } from './payments'
import { getPlainText } from './richtext'
import { DOC_TITLES } from './tokens'
import type { DocumentModel } from './types'

const EXPORTED = new Set<DocumentModel['type']>(['invoice', 'receipt', 'creditNote'])
const HEADER = ['Number', 'Type', 'Issued', 'Due', 'Client', 'Currency', 'Subtotal', 'Tax', 'Total', 'Paid', 'Balance', 'Status']

// Quotes a CSV field when it contains a comma, quote or line break, doubling inner quotes.
const field = (value: string) => (/[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value)

// Sent invoices, receipts and credit notes issued within the dates, for an accountant; amounts in major units.
export function moneyDocumentsCsv(documents: DocumentModel[], range: { from: string; to: string }): string {
  const rows = documents
    .filter((d) => EXPORTED.has(d.type) && d.status !== 'draft' && d.issueDate >= range.from && d.issueDate <= range.to)
    .sort((a, b) => a.issueDate.localeCompare(b.issueDate))
    .map((d) => {
      const decimals = currencyDecimals(d.currency)
      const major = (minor: number) => (minor / 10 ** decimals).toFixed(decimals)
      const totals = printedTotals(d)
      const paid = (d.payments ?? []).reduce((n, p) => n + p.amountMinor, 0)
      const balance = d.type === 'invoice' ? invoiceBalance(d) : 0
      return [getPlainText(d.number), DOC_TITLES[d.type], d.issueDate, d.dueDate ?? '', getPlainText(d.customer.name), d.currency, major(totals.subtotalMinor), major(totals.taxMinor), major(totals.grandTotalMinor), major(paid), major(balance), d.status]
        .map(field)
        .join(',')
    })
  return [HEADER.join(','), ...rows].join('\n')
}
