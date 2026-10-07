/// <reference types="node" />
import { describe, expect, it } from 'vitest'

import { finalizeDocument } from '../../document/finalize'
import { newDocument } from '../../document/newDocument'
import { BACKUP_VERSION, parseBundle, type WorkspaceBundle } from '../backup'
import { createProject } from '../project'
import { workspaceJsonSchema } from '../workspaceSchema'

const NOW = '2026-10-07T10:00:00.000Z'
let n = 0
const draft = newDocument({ type: 'brief', id: 'd1', projectId: 'p1', today: '2026-10-07', newId: () => `b${n++}` })
const bundle: WorkspaceBundle = {
  format: 'paperchaser-workspace',
  version: BACKUP_VERSION,
  projects: [createProject({ id: 'p1', title: 'Acme', now: NOW })],
  clients: [],
  documents: [draft, finalizeDocument({ ...draft, id: 'd2', type: 'invoice' }, 'INV-0001', NOW)],
  assets: [],
  counters: [],
}

describe('workspaceJsonSchema', () => {
  it('describes the workspace file so agents can validate their edits', () => {
    const schema = workspaceJsonSchema() as { properties: Record<string, unknown>; required: string[] }
    expect(schema.required).toEqual(expect.arrayContaining(['format', 'projects', 'documents']))
    expect(Object.keys(schema.properties)).toContain('documents')
  })

  it('round-trips an agent-edited draft back through import validation', () => {
    const edited = JSON.parse(JSON.stringify(bundle)) as WorkspaceBundle
    const heading = edited.documents[0].blocks?.[0]
    if (heading?.type === 'heading') heading.text = 'Brief for the Acme rebrand'
    const parsed = parseBundle(JSON.stringify(edited))
    expect(parsed.ok && parsed.bundle.format === 'paperchaser-workspace' && parsed.bundle.documents[0].blocks?.[0]).toMatchObject({ text: 'Brief for the Acme rebrand' })
  })
})

describe('docs/agents/workspace.schema.json', () => {
  it('matches the importer schema (UPDATE_SCHEMA=1 rewrites it)', async () => {
    const { readFileSync, writeFileSync } = await import('node:fs')
    const path = new URL('../../../docs/agents/workspace.schema.json', import.meta.url)
    const current = `${JSON.stringify(workspaceJsonSchema(), null, 2)}\n`
    if (process.env.UPDATE_SCHEMA === '1') writeFileSync(path, current)
    expect(readFileSync(path, 'utf8')).toBe(current)
  })
})
