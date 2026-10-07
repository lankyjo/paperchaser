import type { DocumentModel } from './types'

// A blank draft invoice for a project; content is filled in the editor.
export function newInvoice({ id, projectId, today }: { id: string; projectId: string; today: string }): DocumentModel {
  return {
    id,
    projectId,
    type: 'invoice',
    currency: 'EUR',
    issueDate: today,
    number: '',
    status: 'draft',
    company: { name: '', address: [], email: '', logo: null },
    customer: { name: '', address: [] },
    lineItems: [],
  }
}
