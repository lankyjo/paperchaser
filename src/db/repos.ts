// Repos are the only Dexie touchpoints; nothing outside this file reads or writes db tables.
import type { Table } from 'dexie'

import { FIXTURE_MAP } from '../document/fixtures'
import type { Company, Customer, DocumentModel } from '../document/types'
import { db as rawDb } from './db'

// Company profile row; companyRepo adds the singleton key.
export interface CompanyRow extends Company {
  id: string
}

// Customer row, id-keyed (not ++id) for stable IDs across import/export.
export interface CustomerRow extends Customer {
  id: string
}

// Catalog item: minimal product shape.
export interface CatalogItemRow {
  id: string
  name: string
  priceMinor: number
}

// Key-value preference row; `key` is the primary key.
export interface PreferenceRow {
  key: string
  value: unknown
}

interface Tables {
  company: Table<CompanyRow>
  customers: Table<CustomerRow>
  catalog: Table<CatalogItemRow>
  documents: Table<DocumentModel>
  preferences: Table<PreferenceRow>
}

// Dexie typings expose table props only on subclasses; a plain instance has them at runtime, so cast once.
const db = rawDb as unknown as Tables

// Singleton company profile key: one record per workspace.
const COMPANY_ID = 'company'

// Id of the seeded empty-store demo document.
export const DEMO_DOCUMENT_ID = 'demo-invoice'

export const documentsRepo = {
  put: (doc: DocumentModel) => db.documents.put(doc),
  get: (id: string) => db.documents.get(id),
  delete: (id: string) => db.documents.delete(id),
  // Index-backed query by status.
  byStatus: (status: DocumentModel['status']) => db.documents.where('status').equals(status).toArray(),
  // Seeds the demo document once when the store is empty; idempotent via DEMO_DOCUMENT_ID, so StrictMode double-mounts never duplicate.
  seedDemoIfEmpty: async (): Promise<void> => {
    const existing = await db.documents.get(DEMO_DOCUMENT_ID)
    if (existing === undefined) {
      await db.documents.put(FIXTURE_MAP['invoice-demo'])
    }
  },
}

export const companyRepo = {
  // Singleton: put replaces the one profile record.
  put: async (company: Company) => {
    await db.company.put({ ...company, id: COMPANY_ID })
  },
  get: async (): Promise<Company | undefined> => {
    const row = await db.company.get(COMPANY_ID)
    return row && { name: row.name, address: row.address, email: row.email, logo: row.logo }
  },
}

export const customersRepo = {
  put: (customer: CustomerRow) => db.customers.put(customer),
  get: (id: string) => db.customers.get(id),
  delete: (id: string) => db.customers.delete(id),
  // Name-indexed exact match for customer search.
  byName: (name: string) => db.customers.where('name').equals(name).toArray(),
}

export const catalogRepo = {
  put: (item: CatalogItemRow) => db.catalog.put(item),
  get: (id: string) => db.catalog.get(id),
  delete: (id: string) => db.catalog.delete(id),
  // Name-indexed exact match for product search.
  byName: (name: string) => db.catalog.where('name').equals(name).toArray(),
}

export const preferencesRepo = {
  /** KV write — Dexie structured-clones any JSON-serializable value. */
  put: (key: string, value: unknown) => db.preferences.put({ key, value }),
  get: async <T>(key: string): Promise<T | undefined> => (await db.preferences.get(key))?.value as T | undefined,
  delete: (key: string) => db.preferences.delete(key),
}
