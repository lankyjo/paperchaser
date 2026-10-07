import { isMoneyDocument } from '../document/documentBlocks'
import { isLiveDraft } from '../document/finalize'
import { getPlainText } from '../document/richtext'
import type { TaxMode } from '../document/totals'
import type { Company, DocumentModel } from '../document/types'
import type { Client } from './client'
import type { Project } from './project'

export type SharedField = NonNullable<DocumentModel['overrides']>[number]

export interface SharedData {
  customerName: string
  customerAddress: string[]
  taxMode?: TaxMode
  currency?: string
  locale?: string
  feeMinor?: number
  // Your company profile; absent until first-run setup saved one.
  company?: Company
}

export function sharedFromProject(client: Client | undefined, project?: Pick<Project, 'taxMode' | 'currency' | 'locale' | 'feeMinor'>, company?: Company): SharedData {
  return {
    customerName: client?.name ?? '',
    customerAddress: client?.billingAddress ?? [],
    taxMode: project?.taxMode,
    currency: project?.currency,
    locale: project?.locale,
    feeMinor: project?.feeMinor,
    company,
  }
}

// Tax mode and currency stay editable only while every money document is still a draft.
export function isTaxModeLocked(documents: Pick<DocumentModel, 'type' | 'status'>[]): boolean {
  return documents.some((d) => isMoneyDocument(d) && d.status !== 'draft')
}

const sharedValue: Record<SharedField, (doc: DocumentModel) => string> = {
  'customer.name': (doc) => getPlainText(doc.customer.name),
  'customer.address': (doc) => doc.customer.address.map(getPlainText).join('\n'),
}

const projectValue: Record<SharedField, (shared: SharedData) => string> = {
  'customer.name': (shared) => shared.customerName,
  'customer.address': (shared) => shared.customerAddress.join('\n'),
}

function withProjectValue(doc: DocumentModel, field: SharedField, shared: SharedData): DocumentModel {
  if (field === 'customer.name') return { ...doc, customer: { ...doc.customer, name: shared.customerName } }
  return { ...doc, customer: { ...doc.customer, address: shared.customerAddress } }
}

const FIELDS = Object.keys(sharedValue) as SharedField[]

// The project fee is what every payment schedule splits.
const withScheduleTotal = (blocks: NonNullable<DocumentModel['blocks']>, feeMinor: number) =>
  blocks.map((b) => (b.type === 'paymentSchedule' ? { ...b, totalMinor: feeMinor } : b))

// Drafts show the project's values for every field they haven't overridden; sent or unsent snapshots stay frozen.
export function applySharedData(doc: DocumentModel, shared: SharedData): DocumentModel {
  if (!isLiveDraft(doc)) return doc
  const overrides = doc.overrides ?? []
  const settings = {
    ...doc,
    ...(shared.taxMode !== undefined && { taxMode: shared.taxMode }),
    ...(shared.currency !== undefined && { currency: shared.currency }),
    ...(shared.locale !== undefined && { locale: shared.locale }),
    ...(shared.feeMinor !== undefined && doc.blocks !== undefined && { blocks: withScheduleTotal(doc.blocks, shared.feeMinor) }),
    // The profile logo wins; a logo picked on the document only shows while the profile has none.
    ...(shared.company !== undefined && { company: { ...shared.company, logo: shared.company.logo ?? doc.company.logo } }),
  }
  return FIELDS.filter((f) => !overrides.includes(f)).reduce((next, f) => withProjectValue(next, f, shared), settings)
}

// A shared field counts as overridden exactly when its text differs from the project value.
export function trackOverrides(doc: DocumentModel, shared: SharedData): DocumentModel {
  return { ...doc, overrides: FIELDS.filter((f) => sharedValue[f](doc) !== projectValue[f](shared)) }
}

// Every edit inside a project records which shared fields now differ, then refreshes the rest from the project.
export function commitWithProjectData(next: DocumentModel, shared: SharedData | undefined): DocumentModel {
  return shared ? applySharedData(trackOverrides(next, shared), shared) : next
}

export function resetOverride(doc: DocumentModel, field: SharedField, shared: SharedData): DocumentModel {
  const reset = withProjectValue(doc, field, shared)
  return { ...reset, overrides: (doc.overrides ?? []).filter((f) => f !== field) }
}

const FIELD_LABELS: Record<SharedField, string> = { 'customer.name': 'Client name', 'customer.address': 'Client address' }

// What pulling the latest project data into a frozen document would change, field by field.
export function pullLatestChanges(doc: DocumentModel, shared: SharedData): { field: string; from: string; to: string }[] {
  const overrides = doc.overrides ?? []
  return FIELDS.filter((f) => !overrides.includes(f) && sharedValue[f](doc) !== projectValue[f](shared)).map((f) => ({
    field: FIELD_LABELS[f],
    from: sharedValue[f](doc),
    to: projectValue[f](shared),
  }))
}

// Drops the snapshot of an unsent document and applies the current project data.
export function pullLatest(doc: DocumentModel, shared: SharedData): DocumentModel {
  return applySharedData({ ...doc, frozen: undefined }, shared)
}
