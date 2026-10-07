import { printedTotals } from './finalize'
import { formatDocDate } from './formatDocDate'
import { formatMoney } from './money'
import { getPlainText } from './richtext'
import { DOC_TITLES } from './tokens'
import type { DocumentModel } from './types'

const MONEY_LINES: Partial<Record<DocumentModel['type'], (amount: string, due: string) => string>> = {
  invoice: (amount, due) => ` for ${amount}${due && `, due on ${due}`}`,
  quote: (amount) => ` for ${amount}`,
  receipt: (amount) => ` confirming your payment of ${amount}`,
  creditNote: (amount) => ` crediting ${amount}`,
}

// A ready-to-paste email for sending the printed PDF, using the figures the document was sent with.
export function emailMessage(doc: DocumentModel): { subject: string; body: string } {
  const title = DOC_TITLES[doc.type]
  const number = getPlainText(doc.number)
  const from = getPlainText(doc.company.name)
  const client = getPlainText(doc.customer.name)
  const amount = formatMoney(printedTotals(doc).grandTotalMinor, doc.currency, doc.locale)
  const due = doc.dueDate ? formatDocDate(doc.dueDate, doc.locale) : ''
  const what = number ? `${title.toLowerCase()} ${number}` : `our ${title.toLowerCase()} document`
  const detail = MONEY_LINES[doc.type]?.(amount, due) ?? ''
  return {
    subject: [title, number].filter(Boolean).join(' ') + (from ? ` from ${from}` : ''),
    body: `Hi${client ? ` ${client}` : ''},\n\nPlease find attached ${what}${detail}.\n\nThank you,\n${from}`.trimEnd(),
  }
}
