import Dexie from 'dexie'

import { migrateV2ToV3 } from '../document/migrate'

// Never alter a shipped version line: version(1) is a frozen empty stub, version(2) owns the five-table schema.
export const db = new Dexie('paperchaser')

db.version(1).stores({})

// Five id-keyed stores (not ++id) for stable IDs across import/export; index only where()-queried properties.
db.version(2).stores({
  company: 'id', // singleton profile
  customers: 'id, name', // name index for customer search
  catalog: 'id, name', // product catalog; name index for product search
  documents: 'id, type, status, updatedAt', // dashboard stats by status, recent by updatedAt
  preferences: 'key', // key-value
})

// version(3) rewrites stored v2 documents with AST-wrapped text fields; the version bump alone triggers the upgrade.
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

// Projects group documents; the redesign starts from an empty workspace, so old documents are wiped.
db.version(4)
  .stores({
    company: 'id',
    customers: 'id, name',
    catalog: 'id, name',
    documents: 'id, projectId, type, status, updatedAt',
    preferences: 'key',
    projects: 'id, updatedAt',
  })
  .upgrade((trans) => trans.table('documents').clear())
