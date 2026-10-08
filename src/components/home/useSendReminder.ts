import { documentsRepo } from '../../db/repos'
import { newReminder, type OverdueInvoice } from '../../document/overdue'
import { useOpenDocument } from '../../hooks/useOpenDocument'
import { todayIso } from '../../lib/todayIso'

// Creates a payment reminder for a late invoice and opens it.
export function useSendReminder() {
  const openDocument = useOpenDocument()
  return async ({ invoice, balanceMinor }: OverdueInvoice) => {
    const reminder = newReminder(invoice, balanceMinor, { id: crypto.randomUUID(), today: todayIso(), newId: () => crypto.randomUUID() })
    await documentsRepo.put(reminder)
    await openDocument(reminder)
  }
}
