import { TriangleAlert } from 'lucide-react'
import { getPlainText } from '../../document/richtext'
import { overdueTotal, type OverdueInvoice } from '../../document/overdue'

// One red line on top when money is late: how many invoices, who owes the oldest, and the total.
export function LateBanner({ overdue }: { overdue: OverdueInvoice[] }) {
  if (overdue.length === 0) return null
  const oldest = overdue[0]
  const who = getPlainText(oldest.invoice.customer.name) || 'A client'
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-destructive/10 px-4 py-3.5 text-destructive">
      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
      <span>
        <b className="font-semibold">{overdue.length === 1 ? '1 invoice is late.' : `${overdue.length} invoices are late.`}</b> {who} has not paid for {oldest.daysOverdue} days.
      </span>
      <span className="ml-auto font-semibold tabular-nums">{overdueTotal(overdue)} overdue</span>
    </div>
  )
}
