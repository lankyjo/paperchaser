import { describe, expect, it } from 'vitest'

import { createProject } from '../project'
import { filterProjects } from '../searchProjects'

const NOW = '2026-10-07T10:00:00.000Z'
const acme = { ...createProject({ id: 'a', title: 'Rebrand', now: NOW }), clientId: 'c1' }
const old = { ...createProject({ id: 'b', title: 'Old site', now: NOW }), archived: true }
const clients = new Map([['c1', 'Acme Coffee']])

describe('filterProjects', () => {
  it('hides archived projects unless asked, and matches title or client name case-insensitively', () => {
    expect(filterProjects([acme, old], clients, '', false).map((p) => p.id)).toEqual(['a'])
    expect(filterProjects([acme, old], clients, '', true).map((p) => p.id)).toEqual(['a', 'b'])
    expect(filterProjects([acme, old], clients, 'acme', true).map((p) => p.id)).toEqual(['a'])
    expect(filterProjects([acme, old], clients, 'SITE', true).map((p) => p.id)).toEqual(['b'])
  })
})
