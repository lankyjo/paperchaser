import type { DocumentModel } from './types'

// Adds whole days to a YYYY-MM-DD date in UTC, so time zones never shift it.
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// A blank draft invoice for a project; content is filled in the editor.
export function newInvoice({ id, projectId, today }: { id: string; projectId: string; today: string }): DocumentModel {
  return {
    id,
    projectId,
    type: 'invoice',
    currency: 'EUR',
    issueDate: today,
    dueDate: addDays(today, 14),
    number: '',
    status: 'draft',
    company: { name: '', address: [], email: '', logo: null },
    customer: { name: '', address: [] },
    lineItems: [],
    blocks: [
      { id: 'parties', type: 'parties' },
      { id: 'lineItems', type: 'lineItems' },
      { id: 'totals', type: 'totals' },
    ],
  }
}
