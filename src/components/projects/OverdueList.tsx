import { useNavigate } from '@tanstack/react-router'
import { documentsRepo } from '../../db/repos'
import { formatMoney } from '../../document/money'
import { newReminder, type OverdueInvoice } from '../../document/overdue'
import { getPlainText } from '../../document/richtext'
import { Button } from '../ui/button'

// Invoices past due with money still owed, each with a one-click payment reminder.
export function OverdueList({ overdue }: { overdue: OverdueInvoice[] }) {
  const navigate = useNavigate()
  if (overdue.length === 0) return null
  const remind = async ({ invoice, balanceMinor }: OverdueInvoice) => {
    const reminder = newReminder(invoice, balanceMinor, { id: crypto.randomUUID(), today: new Date().toLocaleDateString('en-CA'), newId: () => crypto.randomUUID() })
    await documentsRepo.put(reminder)
    await navigate({ to: '/documents/$documentId', params: { documentId: reminder.id } })
  }
  return (
    <section aria-label="Overdue invoices" className="rounded-lg border border-destructive/40 bg-card p-4">
      <h2 className="mb-2 font-medium">Overdue</h2>
      <ul className="flex flex-col gap-2 text-sm">
        {overdue.map((o) => (
          <li key={o.invoice.id} className="flex flex-wrap items-center gap-2">
            <Button size="xs" variant="link" onClick={() => void navigate({ to: '/documents/$documentId', params: { documentId: o.invoice.id } })}>
              {getPlainText(o.invoice.number)}
            </Button>
            <span>{formatMoney(o.balanceMinor, o.invoice.currency, o.invoice.locale)}</span>
            <span className="text-destructive">{o.daysOverdue} days overdue</span>
            <Button size="xs" variant="outline" onClick={() => void remind(o)}>
              Send reminder
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
