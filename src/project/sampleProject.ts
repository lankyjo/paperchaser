import { DOC_TYPE_IDS, DOC_TYPES } from '../document/docTypes'
import { newCreditNote } from '../document/credits'
import { newDocument } from '../document/newDocument'
import { newReminder } from '../document/overdue'
import { computeTotals } from '../document/totals'
import type { Company, DocumentModel } from '../document/types'
import { SAMPLE_NUMBERS, SAMPLE_PROJECT } from '../strings/sampleProject'
import type { Client } from './client'
import { createProject, type Project } from './project'

interface SampleArgs {
  now: string
  today: string
  locale: string
  company: Company
  newId: () => string
}

const text = (s: string) => [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: s }] }]

// A deletable example project with one draft of every document type, so a new user sees the whole pipeline.
export function createSampleProject({ now, today, locale, company, newId }: SampleArgs): { project: Project; client: Client; documents: DocumentModel[] } {
  const client: Client = { id: newId(), ...SAMPLE_PROJECT.client, taxId: '', archived: false }
  const lineItems = SAMPLE_PROJECT.lineItems.map((li) => ({ ...li, id: newId(), title: text(li.title), description: text(li.description), taxRateMinor: 1900 }))
  const project: Project = {
    ...createProject({ id: newId(), title: SAMPLE_PROJECT.title, now }),
    sample: true,
    clientId: client.id,
    currency: 'EUR',
    locale,
    feeMinor: computeTotals({ lineItems }).subtotalMinor,
  }
  const fill = (doc: DocumentModel): DocumentModel => ({
    ...doc,
    locale,
    company,
    customer: { name: client.name, address: client.billingAddress },
    number: SAMPLE_NUMBERS[doc.type] ?? '',
    lineItems: DOC_TYPES[doc.type].money ? lineItems : [],
  })
  const create = (type: DocumentModel['type']) => fill(newDocument({ type, id: newId(), projectId: project.id, today, newId }))
  const invoice = create('invoice')
  const linked: Partial<Record<DocumentModel['type'], DocumentModel>> = {
    invoice,
    creditNote: { ...newCreditNote(invoice, { id: newId(), today }), number: SAMPLE_NUMBERS.creditNote },
    reminder: newReminder(invoice, computeTotals(invoice).grandTotalMinor, { id: newId(), today, newId }),
  }
  return { project, client, documents: DOC_TYPE_IDS.map((type) => linked[type] ?? create(type)) }
}
