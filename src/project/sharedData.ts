import { getPlainText } from '../document/richtext'
import type { DocumentModel } from '../document/types'
import type { Client } from './client'

export type SharedField = NonNullable<DocumentModel['overrides']>[number]

export interface SharedData {
  customerName: string
  customerAddress: string[]
}

export function sharedFromClient(client: Client | undefined): SharedData {
  return { customerName: client?.name ?? '', customerAddress: client?.billingAddress ?? [] }
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

// Drafts show the project's values for every field they haven't overridden; sent documents stay frozen.
export function applySharedData(doc: DocumentModel, shared: SharedData): DocumentModel {
  if (doc.status !== 'draft') return doc
  const overrides = doc.overrides ?? []
  return FIELDS.filter((f) => !overrides.includes(f)).reduce((next, f) => withProjectValue(next, f, shared), doc)
}

// A shared field counts as overridden exactly when its text differs from the project value.
export function trackOverrides(doc: DocumentModel, shared: SharedData): DocumentModel {
  return { ...doc, overrides: FIELDS.filter((f) => sharedValue[f](doc) !== projectValue[f](shared)) }
}

export function resetOverride(doc: DocumentModel, field: SharedField, shared: SharedData): DocumentModel {
  const reset = withProjectValue(doc, field, shared)
  return { ...reset, overrides: (doc.overrides ?? []).filter((f) => f !== field) }
}
