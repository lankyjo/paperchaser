// fake-indexeddb/auto MUST be imported before dexie (the documented
// pairing per the fake-indexeddb README) — it installs the in-memory
// IndexedDB globals Dexie captures at module load.
import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import type { DocumentModel } from '../../document/types'
import { db } from '../db'
import { documentsRepo } from '../repos'

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
