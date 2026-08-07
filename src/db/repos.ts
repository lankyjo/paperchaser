/**
 * Repos — the ONLY Dexie touchpoints (Pattern 4, ARCHITECTURE.md). Nothing
 * outside this file reads/writes db tables; Phase 4 (auto-save) and Phase 6
 * (backup/restore, dashboard stats) build on these seams.
 */
import type { Table } from 'dexie'

import type { Company, Customer, DocumentModel } from '../document/types'
import { db as rawDb } from './db'

/** Company profile row in the `company` table — singleton key added by companyRepo. */
export interface CompanyRow extends Company {
  id: string
}

/** Customer row — id-keyed (not ++id) for import/export ID stability. */
export interface CustomerRow extends Customer {
  id: string
}

/** Catalog item — minimal product shape; Phase 5 extends it. */
export interface CatalogItemRow {
  id: string
  name: string
  priceMinor: number
}

/** KV preference row — `key` is the primary key (STOR-02). */
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

// The shipped Dexie typings expose table props only on subclassed instances; a
// plain instance has them at runtime. Cast once here to type the five tables.
const db = rawDb as unknown as Tables

/** Singleton company profile key — one record per workspace (STOR-02). */
const COMPANY_ID = 'company'

export const documentsRepo = {
  put: (doc: DocumentModel) => db.documents.put(doc),
  get: (id: string) => db.documents.get(id),
  delete: (id: string) => db.documents.delete(id),
  /** Index-backed where query — Phase 6 dashboard stats by status. */
  byStatus: (status: DocumentModel['status']) => db.documents.where('status').equals(status).toArray(),
}

export const companyRepo = {
  /** Singleton: put replaces the one profile record. */
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
  /** Name-indexed exact match — Phase 5 customer search seam. */
  byName: (name: string) => db.customers.where('name').equals(name).toArray(),
}

export const catalogRepo = {
  put: (item: CatalogItemRow) => db.catalog.put(item),
  get: (id: string) => db.catalog.get(id),
  delete: (id: string) => db.catalog.delete(id),
  /** Name-indexed exact match — Phase 5 product search seam. */
  byName: (name: string) => db.catalog.where('name').equals(name).toArray(),
}

export const preferencesRepo = {
  /** KV write — Dexie structured-clones any JSON-serializable value. */
  put: (key: string, value: unknown) => db.preferences.put({ key, value }),
  get: async <T>(key: string): Promise<T | undefined> => (await db.preferences.get(key))?.value as T | undefined,
  delete: (key: string) => db.preferences.delete(key),
}
