import { formatMoney } from './money'
import { openInvoices } from './payments'
import { getPlainText } from './richtext'
import type { DocumentModel } from './types'

const DAY_MS = 86_400_000
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS)

export interface OverdueInvoice {
  invoice: DocumentModel
  balanceMinor: number
  daysOverdue: number
}

// Sent invoices past their due date that still have a balance, oldest first, whatever their project's state.
export function overdueInvoices(documents: DocumentModel[], today: string): OverdueInvoice[] {
  return openInvoices(documents)
    .filter(({ invoice }) => invoice.dueDate !== undefined && invoice.dueDate < today)
    .map((o) => ({ ...o, daysOverdue: daysBetween(o.invoice.dueDate!, today) }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
}

// An unnumbered letter chasing one invoice; it never looks like a second invoice.
export function newReminder(invoice: DocumentModel, balanceMinor: number, { id, today, newId }: { id: string; today: string; newId: () => string }): DocumentModel {
  const number = getPlainText(invoice.number)
  const balance = formatMoney(balanceMinor, invoice.currency, invoice.locale)
  const due = invoice.dueDate ?? invoice.issueDate
  return {
    ...invoice,
    id,
    type: 'reminder',
    number: '',
    status: 'draft',
    issueDate: today,
    reminderFor: invoice.id,
    frozen: undefined,
    payments: undefined,
    rev: undefined,
    blocks: [
      { id: newId(), type: 'heading', text: 'Payment reminder' },
      {
        id: newId(),
        type: 'richText',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: `Our records show that invoice ${number}, due on ${due}, still has ${balance} outstanding. If you have already paid, please ignore this reminder. Otherwise we would be grateful for payment at your earliest convenience.` }] }],
      },
      {
        id: newId(),
        type: 'keyValue',
        title: 'Invoice details',
        rows: [
          { label: 'Invoice', value: number },
          { label: 'Issued', value: invoice.issueDate },
          { label: 'Due', value: due },
          { label: 'Balance due', value: balance },
        ],
      },
    ],
  }
}
