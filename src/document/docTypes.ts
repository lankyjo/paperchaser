import type { DocumentModel } from './types'

type DocType = DocumentModel['type']

interface DocTypeCapabilities {
  title: string
  // Has line items and totals instead of a free block outline.
  money: boolean
  // Takes the next number from its counter when finalized.
  numbered: boolean
  // Included in the accountant CSV export.
  exported: boolean
  // The date the document prints under its header and edits in the properties pane.
  dateField?: 'dueDate' | 'validUntil'
  voidable: boolean
  // Records payments and shows a paid stamp.
  payable: boolean
  // Can start next month's copy for retainer clients.
  recurring: boolean
  // A lead project may send it before a real client is added.
  sendableByLead: boolean
  // The client accepts or declines it, and it can be revised.
  acceptable: boolean
  // Shows the not-legal-advice note while editing.
  legalNotice: boolean
}

const NONE = { money: false, numbered: false, exported: false, voidable: false, payable: false, recurring: false, sendableByLead: false, acceptable: false, legalNotice: false }

// Everything that differs by document type, in one place.
export const DOC_TYPES: Record<DocType, DocTypeCapabilities> = {
  quote: { ...NONE, title: 'Quote', money: true, numbered: true, dateField: 'validUntil', sendableByLead: true, acceptable: true },
  agreement: { ...NONE, title: 'Client Agreement', numbered: true, legalNotice: true },
  welcome: { ...NONE, title: 'Welcome' },
  brief: { ...NONE, title: 'Project Brief' },
  invoice: { ...NONE, title: 'Invoice', money: true, numbered: true, exported: true, dateField: 'dueDate', voidable: true, payable: true, recurring: true },
  deliveryGuide: { ...NONE, title: 'Delivery Guide' },
  monthlyReport: { ...NONE, title: 'Monthly Report', recurring: true },
  receipt: { ...NONE, title: 'Receipt', money: true, numbered: true, exported: true },
  thankYou: { ...NONE, title: 'Thank You' },
  feedback: { ...NONE, title: 'Feedback' },
  creditNote: { ...NONE, title: 'Credit Note', money: true, numbered: true, exported: true },
  reminder: { ...NONE, title: 'Payment Reminder' },
}

export const DOC_TYPE_IDS = Object.keys(DOC_TYPES) as DocType[]
