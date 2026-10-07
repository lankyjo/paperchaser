import { describe, expect, it } from 'vitest'

import { finalizeDocument } from '../../document/finalize'
import { newCreditNote } from '../../document/credits'
import { newInvoice } from '../../document/newInvoice'
import { BACKUP_VERSION, copyProjectBundle, countersAfterImport, parseBundle, type ProjectBundle } from '../backup'
import { createClient } from '../client'
import { createProject } from '../project'

const NOW = '2026-10-07T10:00:00.000Z'
const project = { ...createProject({ id: 'p1', title: 'Acme', now: NOW }), clientId: 'c1' }
const invoice = finalizeDocument(newInvoice({ id: 'i1', projectId: 'p1', today: '2026-10-07' }), 'INV-0042', NOW)
const credit = { ...newCreditNote(invoice, { id: 'cn1', today: '2026-10-08' }) }
const bundle: ProjectBundle = {
  format: 'paperchaser-project',
  version: BACKUP_VERSION,
  project,
  client: createClient({ id: 'c1', name: 'Acme Coffee' }),
  documents: [invoice, credit],
  assets: [],
}

describe('parseBundle', () => {
  it('accepts a project bundle and rejects files from a newer app version', () => {
    expect(parseBundle(JSON.stringify(bundle))).toMatchObject({ ok: true, bundle: { format: 'paperchaser-project' } })
    expect(parseBundle(JSON.stringify({ ...bundle, version: BACKUP_VERSION + 1 }))).toEqual({ ok: false, reason: 'This file was made by a newer version of Paperchaser.' })
    expect(parseBundle('{nope')).toEqual({ ok: false, reason: 'This file is not valid JSON.' })
  })
})

describe('copyProjectBundle', () => {
  it('gives the project and its documents new ids and remaps references between them', () => {
    let n = 0
    const copy = copyProjectBundle(bundle, () => `new-${n++}`)
    expect(copy.project.id).not.toBe('p1')
    expect(copy.documents.every((d) => d.projectId === copy.project.id)).toBe(true)
    const [inv, cn] = copy.documents
    expect(inv.id).not.toBe('i1')
    expect(cn.creditFor).toBe(inv.id)
    expect(inv.number).toBe('INV-0042')
  })
})

describe('countersAfterImport', () => {
  it('moves each counter past the highest imported number so numbers never collide', () => {
    const local = [{ type: 'invoice' as const, prefix: 'INV-', next: 5, yearlyReset: false }]
    expect(countersAfterImport(local, [invoice])).toEqual([{ type: 'invoice', prefix: 'INV-', next: 43, yearlyReset: false }])
    expect(countersAfterImport([{ ...local[0], next: 99 }], [invoice])[0].next).toBe(99)
  })
})
