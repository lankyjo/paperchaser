// Must be imported before dexie: it installs the in-memory IndexedDB globals Dexie captures at load.
import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import type { DocumentModel } from '../../document/types'
import { db } from '../db'
import { createProject } from '../../project/project'
import { createClient } from '../../project/client'
import { assetsRepo, catalogRepo, clientsRepo, companyRepo, documentsRepo, preferencesRepo, projectsRepo } from '../repos'

// Fixture-shaped synthetic document, never real PII.
const DOC: DocumentModel = {
  id: 'doc-1',
  projectId: 'project-1',
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

  it('byProject returns only the documents of that project', async () => {
    await documentsRepo.put(DOC)
    await documentsRepo.put({ ...DOC, id: 'doc-2', projectId: 'project-2' })
    expect((await documentsRepo.byProject('project-1')).map((d) => d.id)).toEqual(['doc-1'])
  })
})

describe('projectsRepo', () => {
  it('lists projects newest first and round-trips them', async () => {
    const older = createProject({ id: 'p1', title: 'Older', now: '2026-10-01T00:00:00.000Z' })
    const newer = createProject({ id: 'p2', title: 'Newer', now: '2026-10-05T00:00:00.000Z' })
    await projectsRepo.put(older)
    await projectsRepo.put(newer)
    expect(await projectsRepo.get('p1')).toEqual(older)
    expect((await projectsRepo.list()).map((p) => p.id)).toEqual(['p2', 'p1'])
  })
})

describe('db schema drift guard', () => {
  it('declares the stores with id-keyed primary keys and the indexes queries rely on', async () => {
    const names = db.tables.map((t) => t.name).sort()
    expect(names).toEqual(['assets', 'catalog', 'clients', 'company', 'documents', 'preferences', 'projects'])
    const byName = new Map(db.tables.map((t) => [t.name, t.schema]))
    expect(byName.get('documents')?.primKey.src).toBe('id')
    expect(byName.get('documents')?.indexes.map((i) => i.name).sort()).toEqual(['projectId', 'status', 'type', 'updatedAt'])
    expect(byName.get('projects')?.indexes.map((i) => i.name)).toEqual(['updatedAt'])
    expect(byName.get('clients')?.indexes.map((i) => i.name)).toEqual(['name'])
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

describe('assetsRepo', () => {
  const asset = (id: string) => ({ id, dataUrl: `data:image/webp;base64,${id}`, width: 10, height: 10 })

  it('stores an image once per content id', async () => {
    await assetsRepo.put(asset('a1'))
    await assetsRepo.put(asset('a1'))
    expect(await db.table('assets').count()).toBe(1)
    expect(await assetsRepo.get('a1')).toEqual(asset('a1'))
  })

  it('prunes assets no document references', async () => {
    await assetsRepo.put(asset('used'))
    await assetsRepo.put(asset('orphan'))
    await documentsRepo.put({ ...DOC, blocks: [{ id: 'b', type: 'image', assetId: 'used', alt: '' }] })
    expect(await assetsRepo.pruneUnreferenced()).toBe(1)
    expect(await assetsRepo.get('orphan')).toBeUndefined()
    expect(await assetsRepo.get('used')).toBeDefined()
  })
})

describe('clientsRepo', () => {
  it('round-trips clients and lists them by name', async () => {
    const beta = createClient({ id: 'c2', name: 'Beta Studio' })
    const alpha = createClient({ id: 'c1', name: 'Alpha Coffee' })
    await clientsRepo.put(beta)
    await clientsRepo.put(alpha)
    expect(await clientsRepo.get('c1')).toEqual(alpha)
    expect((await clientsRepo.list()).map((c) => c.id)).toEqual(['c1', 'c2'])
    await clientsRepo.delete('c1')
    expect(await clientsRepo.get('c1')).toBeUndefined()
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
