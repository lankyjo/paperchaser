import { FileText } from 'lucide-react'
import { formatMoney } from '../../document/money'
import { getPlainText } from '../../document/richtext'
import type { DocumentModel } from '../../document/types'
import { useOpenDocument } from '../../hooks/useOpenDocument'
import { HomeRow } from './HomeRow'
import { HomeSection } from './HomeSection'

type PaymentDue = { invoice: DocumentModel; payment: NonNullable<DocumentModel['payments']>[number] }

// Payments that arrived without a receipt yet, in gold; each opens the invoice, where the receipt is made.
export function ReadySection({ receipts }: { receipts: PaymentDue[] }) {
  const openDocument = useOpenDocument()
  if (receipts.length === 0) return null
  return (
    <HomeSection title="Ready to send">
      {receipts.map(({ invoice, payment }) => (
        <HomeRow
          key={payment.id}
          tone="ready"
          icon={<FileText />}
          title={<button type="button" onClick={() => void openDocument(invoice)}>Send {getPlainText(invoice.customer.name) || 'the client'} a receipt</button>}
          sub={`Payment on invoice ${getPlainText(invoice.number)} · received ${payment.date}`}
          trailing={<span className="tabular-nums">{formatMoney(payment.amountMinor, invoice.currency, invoice.locale)}</span>}
        />
      ))}
    </HomeSection>
  )
}
