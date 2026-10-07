// Repos are the only Dexie touchpoints; nothing outside this file reads or writes db tables.
import type { Table } from 'dexie'

import { referencedAssetIds } from '../document/assets'
import { finalizeDocument, isNumberedType, nextNumber, type Counter } from '../document/finalize'
import { getPlainText } from '../document/richtext'
import type { Company, DocumentModel } from '../document/types'
import type { Client } from '../project/client'
import type { Project } from '../project/project'
import { db as rawDb } from './db'

// Company profile row; companyRepo adds the singleton key.
export interface CompanyRow extends Company {
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

export interface AssetRow {
  id: string
  dataUrl: string
  width: number
  height: number
}

interface Tables {
  company: Table<CompanyRow>
  clients: Table<Client>
  catalog: Table<CatalogItemRow>
  documents: Table<DocumentModel>
  preferences: Table<PreferenceRow>
  projects: Table<Project>
  assets: Table<AssetRow>
  counters: Table<Counter>
}

// Dexie typings expose table props only on subclasses; a plain instance has them at runtime, so cast once.
const db = rawDb as unknown as Tables

// Singleton company profile key: one record per workspace.
const COMPANY_ID = 'company'


export const documentsRepo = {
  put: (doc: DocumentModel) => db.documents.put(doc),
  get: (id: string) => db.documents.get(id),
  delete: (id: string) => db.documents.delete(id),
  // Index-backed query by status.
  byStatus: (status: DocumentModel['status']) => db.documents.where('status').equals(status).toArray(),
  byProject: (projectId: string) => db.documents.where('projectId').equals(projectId).toArray(),
  list: () => db.documents.toArray(),
  finalize: (doc: DocumentModel, now: Date) => finalizeInTransaction(doc, now),
}

const DEFAULT_PREFIXES: Partial<Record<DocumentModel['type'], string>> = {
  quote: 'Q-',
  agreement: 'AGR-',
  invoice: 'INV-',
  creditNote: 'CN-',
  receipt: 'RCT-',
}

const defaultCounter = (type: DocumentModel['type']): Counter => ({ type, prefix: DEFAULT_PREFIXES[type] ?? '', next: 1, yearlyReset: false })

export const countersRepo = {
  get: async (type: DocumentModel['type']): Promise<Counter> => (await db.counters.get(type)) ?? defaultCounter(type),
  put: (counter: Counter) => db.counters.put(counter),
}

// Finalizes in one transaction so the counter and the numbered document can never disagree, even across tabs.
async function finalizeInTransaction(doc: DocumentModel, now: Date): Promise<DocumentModel> {
  return rawDb.transaction('rw', 'counters', 'documents', async () => {
    let number: string | null = null
    if (isNumberedType(doc.type) && getPlainText(doc.number) === '') {
      const counter = await countersRepo.get(doc.type)
      const next = nextNumber(counter, now)
      await db.counters.put(next.counter)
      number = next.number
    }
    const finalized = finalizeDocument(doc, number, now.toISOString())
    await db.documents.put(finalized)
    return finalized
  })
}

export const projectsRepo = {
  put: (project: Project) => db.projects.put(project),
  get: (id: string) => db.projects.get(id),
  list: () => db.projects.orderBy('updatedAt').reverse().toArray(),
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

export const assetsRepo = {
  put: (asset: AssetRow) => db.assets.put(asset),
  get: (id: string) => db.assets.get(id),
  // Deletes images no document references and returns how many were removed.
  pruneUnreferenced: async (): Promise<number> => {
    const used = referencedAssetIds(await db.documents.toArray())
    const orphans = (await db.assets.toCollection().primaryKeys()).filter((id) => !used.has(id))
    await db.assets.bulkDelete(orphans)
    return orphans.length
  },
}

export const clientsRepo = {
  put: (client: Client) => db.clients.put(client),
  get: (id: string) => db.clients.get(id),
  delete: (id: string) => db.clients.delete(id),
  list: () => db.clients.orderBy('name').toArray(),
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
