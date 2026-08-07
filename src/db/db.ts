import Dexie from 'dexie'

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
