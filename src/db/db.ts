import Dexie from 'dexie'

import { migrateV2ToV3 } from '../document/migrate'

/**
 * Dexie versioning discipline (PITFALLS.md:78 — never alter a shipped version
 * line): version(1) is the frozen Phase 1 empty stub; version(2) owns the real
 * five-table schema. Do not add tables or indexes beyond the five declared
 * below — future queries already have their indexes (documents status/updatedAt,
 * customers/catalog name).
 */
export const db = new Dexie('paperchaser')

db.version(1).stores({})

// STOR-02: five stores. id-keyed (not ++id) for import/export ID stability.
// Index only where()-queried properties (Dexie rule); status is a string (indexable).
db.version(2).stores({
  company: 'id', // singleton profile
  customers: 'id, name', // name index -> Phase 5 search
  catalog: 'id, name', // product catalog; name index -> Phase 5 search
  documents: 'id, type, status, updatedAt', // Phase 6 dashboard: stats by status, recent by updatedAt
  preferences: 'key', // KV
})

// D-29: version(3) rewrites stored v2 docs with AST-wrapped text fields.
// The stores() schema strings are identical to v2 — the version bump alone
// triggers the upgrade callback (RESEARCH Pitfall 4 verified by persistence spec).
db.version(3)
  .stores({
    company: 'id',
    customers: 'id, name',
    catalog: 'id, name',
    documents: 'id, type, status, updatedAt',
    preferences: 'key',
  })
  .upgrade((trans) => {
    return trans.table('documents').toCollection().modify((doc) => {
      migrateV2ToV3(doc)
    })
  })
