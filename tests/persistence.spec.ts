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

/** v2-shaped document with plain-string text fields for the upgrade test. */
const V2_DOC = {
  id: 'upgrade-test-1',
  type: 'invoice',
  currency: 'EUR',
  issueDate: '2026-08-07',
  number: 'INV-2026-0999',
  status: 'draft',
  company: { name: 'Old GmbH', address: ['Oldweg 1'], email: 'old@test.test', logo: null },
  customer: { name: 'Old Kundin', address: ['Customerweg 9'] },
  lineItems: [
    { id: 'v2-li-1', title: 'Old title', description: 'Old description', quantity: 1, unitPriceMinor: 10000, taxRateMinor: 1900 },
  ],
  shippingFees: [{ label: 'Old shipping', amountMinor: 500, taxRateMinor: 1900 }],
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

test('version(3) upgrade rewrites stored v2 rows to v3 AST shape (D-29)', async ({ page }) => {
  // Use a dedicated DB name to control versioning precisely.
  const DB_NAME = 'paperchaser-upgrade-test'

  await page.goto('/')
  await page.addScriptTag({ path: 'node_modules/dexie/dist/dexie.js' })

  // Step 1: Create version(2) DB, seed a v2-shaped document (plain strings).
  await page.evaluate(
    async ({ SCHEMA, V2_DOC, DB_NAME }) => {
      const db = new window.Dexie(DB_NAME)
      db.version(1).stores({})
      db.version(2).stores(SCHEMA)
      await db.table('documents').put(V2_DOC)
      db.close()
    },
    { SCHEMA, V2_DOC, DB_NAME },
  )

  // Step 2: Re-open the same DB at version(3) with an upgrade callback
  // that mirrors migrateV2ToV3 (the real migration in src/document/migrate.ts).
  const upgraded = await page.evaluate(
    async ({ SCHEMA, DB_NAME, id }) => {
      const db = new window.Dexie(DB_NAME)
      db.version(1).stores({})
      db.version(2).stores(SCHEMA)
      db.version(3)
        .stores(SCHEMA) // identical schema — version bump triggers upgrade
        .upgrade((trans) => {
          return trans.table('documents').toCollection().modify((doc: Record<string, unknown>) => {
            // Inline migrateV2ToV3 — wrap string fields to single-paragraph ASTs.
            const wrap = (s: string) => [{ type: 'paragraph', content: [{ type: 'text', text: s }] }]
            // Scalar text fields
            const wrapScalar = (obj: Record<string, unknown> | null | undefined, keys: string[]) => {
              if (!obj) return
              for (const k of keys) {
                if (typeof obj[k] === 'string') obj[k] = wrap(obj[k] as string)
              }
            }
            // Array fields (address)
            const wrapArray = (obj: Record<string, unknown> | null | undefined, key: string) => {
              if (!obj) return
              const arr = obj[key]
              if (Array.isArray(arr)) obj[key] = arr.map((e: unknown) => (typeof e === 'string' ? wrap(e) : e))
            }
            wrapScalar(doc.company as Record<string, unknown>, ['name', 'email'])
            wrapScalar(doc.customer as Record<string, unknown>, ['name'])
            wrapArray(doc.company as Record<string, unknown>, 'address')
            wrapArray(doc.customer as Record<string, unknown>, 'address')
            if (typeof doc.number === 'string') doc.number = wrap(doc.number as string)
            const items = doc.lineItems as Array<Record<string, unknown>> | undefined
            if (Array.isArray(items)) {
              for (const item of items) {
                wrapScalar(item, ['title', 'description'])
              }
            }
            const fees = doc.shippingFees as Array<Record<string, unknown>> | undefined
            if (Array.isArray(fees)) {
              for (const fee of fees) {
                wrapScalar(fee, ['label'])
              }
            }
          })
        })
      await db.open()
      return db.table('documents').get(id)
    },
    { SCHEMA, DB_NAME, id: V2_DOC.id },
  )

  // Assertions: every text field is now an AST array, not a plain string.
  expect(upgraded).not.toBeNull()

  // company.name → AST
  expect(typeof upgraded.company.name).not.toBe('string')
  expect(Array.isArray(upgraded.company.name)).toBe(true)
  expect(upgraded.company.name[0].type).toBe('paragraph')
  expect(upgraded.company.name[0].content[0].type).toBe('text')
  expect(upgraded.company.name[0].content[0].text).toBe('Old GmbH')

  // company.email → AST
  expect(typeof upgraded.company.email).not.toBe('string')
  expect(upgraded.company.email[0].content[0].text).toBe('old@test.test')

  // company.address → array of ASTs
  expect(Array.isArray(upgraded.company.address)).toBe(true)
  expect(Array.isArray(upgraded.company.address[0])).toBe(true)

  // customer.name → AST
  expect(Array.isArray(upgraded.customer.name)).toBe(true)

  // customer.address → array of ASTs
  expect(Array.isArray(upgraded.customer.address[0])).toBe(true)

  // document.number → AST
  expect(typeof upgraded.number).not.toBe('string')
  expect(Array.isArray(upgraded.number)).toBe(true)

  // lineItems[0].title → AST
  expect(Array.isArray(upgraded.lineItems[0].title)).toBe(true)
  expect(upgraded.lineItems[0].title[0].content[0].text).toBe('Old title')

  // lineItems[0].description → AST
  expect(Array.isArray(upgraded.lineItems[0].description)).toBe(true)

  // shippingFees[0].label → AST
  expect(Array.isArray(upgraded.shippingFees[0].label)).toBe(true)
  expect(upgraded.shippingFees[0].label[0].content[0].text).toBe('Old shipping')

  // Non-text fields untouched
  expect(upgraded.currency).toBe('EUR')
  expect(upgraded.status).toBe('draft')
  expect(upgraded.lineItems[0].quantity).toBe(1)
  expect(upgraded.lineItems[0].unitPriceMinor).toBe(10000)
  expect(upgraded.shippingFees[0].amountMinor).toBe(500)

  // Clean up: delete the test DB
  await page.evaluate(
    async (name) => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase(name)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    },
    DB_NAME,
  )
})
