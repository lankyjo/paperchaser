import { describe, expect, it } from 'vitest'

import { clientSchema, clientUsage, createClient } from '../client'
import { createProject } from '../project'

const NOW = '2026-10-07T10:00:00.000Z'

describe('createClient', () => {
  it('creates an active client that round-trips through the schema', () => {
    const client = createClient({ id: 'c1', name: ' Acme Coffee ' })
    expect(client).toEqual({ id: 'c1', name: 'Acme Coffee', contactPerson: '', email: '', billingAddress: [], taxId: '', archived: false })
    expect(clientSchema.parse(JSON.parse(JSON.stringify(client)))).toEqual(client)
  })
})

describe('clientUsage', () => {
  it('counts the projects using a client and their draft documents', () => {
    const a = { ...createProject({ id: 'p1', title: 'A', now: NOW }), clientId: 'c1' }
    const b = { ...createProject({ id: 'p2', title: 'B', now: NOW }), clientId: 'c1' }
    const other = { ...createProject({ id: 'p3', title: 'C', now: NOW }), clientId: 'c2' }
    const documents = [
      { projectId: 'p1', status: 'draft' as const },
      { projectId: 'p1', status: 'sent' as const },
      { projectId: 'p2', status: 'draft' as const },
      { projectId: 'p3', status: 'draft' as const },
    ]
    expect(clientUsage('c1', [a, b, other], documents)).toEqual({ projects: 2, drafts: 2, inUse: true })
    expect(clientUsage('c9', [a, b, other], documents)).toEqual({ projects: 0, drafts: 0, inUse: false })
  })
})
