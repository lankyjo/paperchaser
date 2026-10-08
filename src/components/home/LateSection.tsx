import { TriangleAlert } from 'lucide-react'
import { formatDocDate } from '../../document/formatDocDate'
import { formatMoney } from '../../document/money'
import type { OverdueInvoice } from '../../document/overdue'
import { getPlainText } from '../../document/richtext'
import { useOpenDocument } from '../../hooks/useOpenDocument'
import { Button } from '../ui/button'
import { HomeRow } from './HomeRow'
import { HomeSection } from './HomeSection'
import { useSendReminder } from './useSendReminder'

// Late invoices, red: who owes, how late, the balance, and a one-click reminder; the name opens the invoice.
export function LateSection({ overdue }: { overdue: OverdueInvoice[] }) {
  const openDocument = useOpenDocument()
  const sendReminder = useSendReminder()
  if (overdue.length === 0) return null
  return (
    <HomeSection title="Late · needs you now" label="Overdue invoices">
      {overdue.map((o) => (
        <HomeRow
          key={o.invoice.id}
          tone="late"
          icon={<TriangleAlert />}
          title={<button type="button" onClick={() => void openDocument(o.invoice)}>{getPlainText(o.invoice.customer.name) || 'A client'}</button>}
          sub={`Invoice ${getPlainText(o.invoice.number)} · due ${o.invoice.dueDate ? formatDocDate(o.invoice.dueDate, o.invoice.locale) : ''} · ${o.daysOverdue} days overdue`}
          trailing={<span className="font-semibold text-destructive tabular-nums">{formatMoney(o.balanceMinor, o.invoice.currency, o.invoice.locale)}</span>}
          action={<Button size="sm" variant="destructive" onClick={() => void sendReminder(o)}>Send reminder</Button>}
        />
      ))}
    </HomeSection>
  )
}
