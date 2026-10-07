import { getPlainText } from '../../document/richtext'
import { Button } from '../ui/button'
import { useScheduleActions } from './scheduleContext'

// Create or open the invoice that bills one schedule row; never printed.
export function ScheduleRowActions({ rowId }: { rowId: string }) {
  const actions = useScheduleActions()
  if (!actions) return null
  const invoice = actions.invoiceForRow(rowId)
  return (
    <span className="print:hidden">
      {invoice ? (
        <Button size="xs" variant="link" onClick={() => actions.openInvoice(invoice)}>
          Open {getPlainText(invoice.number) || 'draft invoice'}
        </Button>
      ) : (
        <Button size="xs" variant="outline" onClick={() => actions.createInvoice(rowId)}>
          Create invoice
        </Button>
      )}
    </span>
  )
}
