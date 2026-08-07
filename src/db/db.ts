import Dexie from 'dexie'

/**
 * Intentional empty schema stub (PITFALLS.md:78 — versioning discipline starts
 * with the first schema commit). Phase 2 owns the real tables via version(2);
 * do not add tables/indexes here.
 */
export const db = new Dexie('paperchaser')

db.version(1).stores({})
