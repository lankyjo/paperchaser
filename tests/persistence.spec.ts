import { expect, test } from '@playwright/test'

// Schema string MUST match src/db/db.ts version(2) — update both together.
// (The Vitest repo tests in src/db/__tests__/repos.test.ts are the authoritative
// schema check; this duplicated string exists because the zero-UI app bundle
// does not import db.ts, so the spec drives real IndexedDB via injected Dexie.)
const SCHEMA = {
  company: 'id',
  customers: 'id, name',
  catalog: 'id, name',
  documents: 'id, type, status, updatedAt',
  preferences: 'key',
}

/** Document-shaped fixture (synthetic — never real PII) matching documentSchema. */
const DOC = {
  id: 'persist-1',
  type: 'invoice',
  currency: 'EUR',
  issueDate: '2026-08-07',
  number: 'RE-2026-0999',
  status: 'draft',
  company: { name: 'Test GmbH', address: ['Testweg 1'], email: 't@test.test', logo: null },
  customer: { name: 'Test Kundin', address: ['Weg 9'] },
  lineItems: [{ id: 'l1', title: 'Beratung', description: '', quantity: 1, unitPriceMinor: 10000, taxRateMinor: 1900 }],
}

// Single test, single page — NEVER a fresh browser context between write and
// read: a fresh context wipes IndexedDB by design and the test would prove
// nothing (Pitfall 6). Same-context page.reload() retains IndexedDB — the
// browser platform guarantee being tested.
test('document written via Dexie survives a full page reload', async ({ page }) => {
  await page.goto('/')
  await page.addScriptTag({ path: 'node_modules/dexie/dist/dexie.js' }) // UMD build -> window.Dexie
  await page.evaluate(
    async ({ SCHEMA, DOC }) => {
      const db = new window.Dexie('paperchaser')
      db.version(2).stores(SCHEMA)
      await db.documents.put(DOC)
    },
    { SCHEMA, DOC },
  )
  await page.reload() // SAME context — IndexedDB survives the reload

  // reload() dropped the injected script tag — re-inject the UMD build so
  // window.Dexie exists for the read side (same context, same DB instance).
  await page.addScriptTag({ path: 'node_modules/dexie/dist/dexie.js' })
  const stored = await page.evaluate(
    async ({ SCHEMA, id }) => {
      const db = new window.Dexie('paperchaser')
      db.version(2).stores(SCHEMA)
      return db.documents.get(id)
    },
    { SCHEMA, id: DOC.id },
  )
  expect(stored).toEqual(DOC)
})
