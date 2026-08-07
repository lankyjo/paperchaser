// fake-indexeddb/auto MUST be imported before dexie (the documented
// pairing per the fake-indexeddb README) — it installs the in-memory
// IndexedDB globals Dexie captures at module load.
import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import type { DocumentModel } from '../../document/types'
import { db } from '../db'
import { catalogRepo, companyRepo, customersRepo, documentsRepo, preferencesRepo } from '../repos'

/** Fixture-shaped document (synthetic data — RESEARCH Security Domain, never real PII). */
const DOC: DocumentModel = {
  id: 'doc-1',
  type: 'invoice',
  currency: 'EUR',
  issueDate: '2026-08-07',
  number: 'RE-2026-0001',
  status: 'draft',
  company: { name: 'Test GmbH', address: ['Testweg 1'], email: 't@test.test', logo: null },
  customer: { name: 'Test Kundin', address: ['Weg 9'] },
  lineItems: [{ id: 'l1', title: 'Beratung', description: '', quantity: 1, unitPriceMinor: 10000, taxRateMinor: 1900 }],
}

/** Fixture-shaped company profile (synthetic — never real PII). */
const COMPANY = { name: 'Acme GmbH', address: ['Acmeweg 1'], email: 'acme@test.test', logo: null }

/** Fixture-shaped customer records. */
const ALPHA_CUSTOMER = { id: 'cust-1', name: 'Alpha Kundin', address: ['Weg 1'] }
const BETA_CUSTOMER = { id: 'cust-2', name: 'Beta Kundin', address: ['Weg 2'] }

/** Fixture-shaped catalog items. */
const BERATUNG_ITEM = { id: 'prod-1', name: 'Beratung', priceMinor: 10000 }
const DRUCK_ITEM = { id: 'prod-2', name: 'Druck', priceMinor: 120 }

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('documentsRepo', () => {
  it('put then get returns a deep-equal document', async () => {
    await documentsRepo.put(DOC)
    expect(await documentsRepo.get(DOC.id)).toEqual(DOC)
  })

  it('byStatus returns exactly the documents with that status (index-backed where query)', async () => {
    const paid = { ...DOC, id: 'doc-2', status: 'paid' as const }
    await documentsRepo.put(DOC)
    await documentsRepo.put(paid)
    expect(await documentsRepo.byStatus('draft')).toEqual([DOC])
    expect(await documentsRepo.byStatus('paid')).toEqual([paid])
  })

  it('delete removes the document; get returns undefined', async () => {
    await documentsRepo.put(DOC)
    await documentsRepo.delete(DOC.id)
    expect(await documentsRepo.get(DOC.id)).toBeUndefined()
  })
})

describe('db schema (STOR-02 drift guard)', () => {
  it('version(2) declares exactly the five stores with id-keyed primary keys and future-query indexes', async () => {
    // Authoritative schema check: real db.ts via fake-indexeddb (tests/persistence.spec.ts
    // carries the duplicated string with a MUST-match comment).
    const names = db.tables.map((t) => t.name).sort()
    expect(names).toEqual(['catalog', 'company', 'customers', 'documents', 'preferences'])
    const byName = new Map(db.tables.map((t) => [t.name, t.schema]))
    expect(byName.get('documents')?.primKey.src).toBe('id')
    expect(byName.get('documents')?.indexes.map((i) => i.name).sort()).toEqual(['status', 'type', 'updatedAt'])
    expect(byName.get('customers')?.primKey.src).toBe('id')
    expect(byName.get('customers')?.indexes.map((i) => i.name)).toEqual(['name'])
    expect(byName.get('catalog')?.primKey.src).toBe('id')
    expect(byName.get('catalog')?.indexes.map((i) => i.name)).toEqual(['name'])
    expect(byName.get('company')?.primKey.src).toBe('id')
    expect(byName.get('preferences')?.primKey.src).toBe('key')
  })
})

describe('companyRepo (singleton profile)', () => {
  it('put then get returns the company; a second put replaces it (one profile)', async () => {
    await companyRepo.put(COMPANY)
    expect(await companyRepo.get()).toEqual(COMPANY)

    const replacement = { ...COMPANY, name: 'Acme GmbH 2.0' }
    await companyRepo.put(replacement)
    expect(await companyRepo.get()).toEqual(replacement)
    expect(await db.table('company').count()).toBe(1) // singleton: put replaces, never accumulates
  })

  it('get returns undefined before any profile is stored', async () => {
    expect(await companyRepo.get()).toBeUndefined()
  })
})

describe('customersRepo', () => {
  it('put/get/delete round-trip', async () => {
    await customersRepo.put(ALPHA_CUSTOMER)
    expect(await customersRepo.get('cust-1')).toEqual(ALPHA_CUSTOMER)
    await customersRepo.delete('cust-1')
    expect(await customersRepo.get('cust-1')).toBeUndefined()
  })

  it('byName returns only matching customers (name index)', async () => {
    await customersRepo.put(ALPHA_CUSTOMER)
    await customersRepo.put(BETA_CUSTOMER)
    expect(await customersRepo.byName('Alpha Kundin')).toEqual([ALPHA_CUSTOMER])
    expect(await customersRepo.byName('Nobody')).toEqual([])
  })
})

describe('catalogRepo', () => {
  it('put/get/delete round-trip', async () => {
    await catalogRepo.put(BERATUNG_ITEM)
    expect(await catalogRepo.get('prod-1')).toEqual(BERATUNG_ITEM)
    await catalogRepo.delete('prod-1')
    expect(await catalogRepo.get('prod-1')).toBeUndefined()
  })

  it('byName returns only matching catalog items (name index)', async () => {
    await catalogRepo.put(BERATUNG_ITEM)
    await catalogRepo.put(DRUCK_ITEM)
    expect(await catalogRepo.byName('Beratung')).toEqual([BERATUNG_ITEM])
  })
})

describe('preferencesRepo (KV)', () => {
  it('put/get/delete round-trip', async () => {
    await preferencesRepo.put('theme', 'dark')
    expect(await preferencesRepo.get<string>('theme')).toBe('dark')
    await preferencesRepo.delete('theme')
    expect(await preferencesRepo.get<string>('theme')).toBeUndefined()
  })

  it('missing key returns undefined', async () => {
    expect(await preferencesRepo.get<string>('nope')).toBeUndefined()
  })
})
