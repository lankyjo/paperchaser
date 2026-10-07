import { documentFacts } from '../../document/pageLayout'
import type { DocumentModel } from '../../document/types'
import { DOC_LABELS } from '../../strings/documentLabels'

// The "Payment details" label and your payment lines on money documents; nothing when there are none.
export function PaymentDetails({ model, className, labelClassName }: { model: DocumentModel; className?: string; labelClassName?: string }) {
  const lines = documentFacts(model).payment
  if (lines.length === 0) return null
  return (
    <div className={className}>
      <div className={labelClassName}>{DOC_LABELS.paymentDetails}</div>
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  )
}
