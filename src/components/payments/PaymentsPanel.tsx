import { useOpenDocument } from '../../hooks/useOpenDocument'
import { formatMoney } from '../../document/money'
import { invoiceBalance, paymentStatus, type Payment } from '../../document/payments'
import { getPlainText } from '../../document/richtext'
import type { DocumentModel } from '../../document/types'
import { Button } from '../ui/button'
import { AddPaymentForm } from './AddPaymentForm'
import { useInvoiceRelated } from './useInvoiceRelated'

const STATUS_LABELS = { unpaid: 'Unpaid', partial: 'Partly paid', paid: 'Paid', overpaid: 'Overpaid' } as const

// Payments against a sent invoice: balance, recorded payments, receipts per payment; never printed.
export function PaymentsPanel({ invoice, onSave }: { invoice: DocumentModel; onSave: (payments: Payment[]) => void }) {
  const openDocument = useOpenDocument()
  const { receiptFor, createReceipt, isLocked, creditNotes, creditedMinor, createCreditNote } = useInvoiceRelated(invoice)
  const open = (doc: DocumentModel) => void openDocument(doc)
  const payments = invoice.payments ?? []
  const money = (minor: number) => formatMoney(minor, invoice.currency, invoice.locale)
  const balance = invoiceBalance(invoice, creditedMinor)

  return (
    <section aria-label="Payments" className="mx-4 flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm print:hidden">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Payments · {STATUS_LABELS[paymentStatus(invoice, creditedMinor)]}</h2>
        <span>{balance < 0 ? `Overpaid by ${money(-balance)}` : `Balance due ${money(balance)}`}</span>
      </div>
      <ul className="flex flex-col gap-1">
        {payments.map((p) => {
          const receipt = receiptFor(p)
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-2">
              <span>{p.date}</span>
              <span>{money(p.amountMinor)}</span>
              <span className="text-muted-foreground">{p.method}</span>
              {receipt ? (
                <Button size="xs" variant="link" onClick={() => open(receipt)}>
                  Open receipt
                </Button>
              ) : (
                <Button size="xs" variant="outline" onClick={() => void createReceipt(p).then(open)}>
                  Create receipt
                </Button>
              )}
              {!isLocked(p) && (
                <Button size="xs" variant="ghost" onClick={() => onSave(payments.filter((x) => x.id !== p.id))}>
                  Remove
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      <AddPaymentForm currency={invoice.currency} locale={invoice.locale} onAdd={(p) => onSave([...payments, p])} />
      {creditNotes.map((credit) => (
        <Button key={credit.id} size="xs" variant="link" className="self-start" onClick={() => open(credit)}>
          Credit note {getPlainText(credit.number) || '(draft)'}
        </Button>
      ))}
      {payments.length > 0 && (
        <Button size="sm" variant="outline" className="self-start" onClick={() => void createCreditNote().then(open)}>
          Issue credit note
        </Button>
      )}
    </section>
  )
}
