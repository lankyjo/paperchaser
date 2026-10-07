import { describe, expect, it } from 'vitest'

import { finalizeDocument } from '../../document/finalize'
import { newDocument } from '../../document/newDocument'
import { newInvoice } from '../../document/newInvoice'
import type { DocumentModel } from '../../document/types'
import { applyAiOperations, changedSections, restoreImages, stripImages } from '../aiPatch'

let n = 0
const welcome = newDocument({ type: 'welcome', id: 'w', projectId: 'p', today: '2026-10-07', newId: () => `b${n++}` })

describe('stripImages and restoreImages', () => {
  it('swaps image data for short tokens before sending and puts it back afterwards', () => {
    const doc: DocumentModel = { ...newInvoice({ id: 'i', projectId: 'p', today: '2026-10-07' }), company: { name: '', address: [], email: '', logo: 'data:image/png;base64,AAAA' } }
    const { doc: stripped, images } = stripImages(doc)
    expect(JSON.stringify(stripped)).not.toContain('base64')
    expect(restoreImages(stripped, images)).toEqual(doc)
  })
})

describe('applyAiOperations', () => {
  it('applies valid replacements and returns a schema-valid document', () => {
    const result = applyAiOperations(welcome, [{ op: 'replace', path: '/blocks/0/text', valueJson: '"Welcome aboard"' }])
    expect(result.ok && result.doc.blocks?.[0]).toMatchObject({ text: 'Welcome aboard' })
  })

  it('refuses protected fields, invalid results and sent documents', () => {
    expect(applyAiOperations(welcome, [{ op: 'replace', path: '/number', valueJson: '"INV-9"' }])).toEqual({ ok: false, reason: 'The suggestion tried to change number, which AI may not edit.' })
    expect(applyAiOperations(welcome, [{ op: 'replace', path: '/blocks/0/text', valueJson: '42' }]).ok).toBe(false)
    const sent = finalizeDocument(welcome, null, '2026-10-07T00:00:00.000Z')
    expect(applyAiOperations(sent, [{ op: 'replace', path: '/blocks/0/text', valueJson: '"x"' }])).toEqual({ ok: false, reason: 'Sent documents cannot be changed by AI.' })
  })

  it('restores image tokens the model copied back into a value', () => {
    const doc: DocumentModel = { ...welcome, company: { name: '', address: [], email: '', logo: 'data:image/png;base64,AAAA' } }
    const result = applyAiOperations(doc, [{ op: 'replace', path: '/company', valueJson: '{"name":"Northwind","address":[],"email":"","logo":"[image:0]"}' }])
    expect(result.ok && result.doc.company).toEqual({ name: 'Northwind', address: [], email: '', logo: 'data:image/png;base64,AAAA' })
  })

  it('adds and removes array items', () => {
    const added = applyAiOperations(welcome, [{ op: 'add', path: '/blocks/-', valueJson: '{"id":"new","type":"heading","text":"Next"}' }])
    expect(added.ok && added.doc.blocks?.at(-1)).toMatchObject({ id: 'new' })
    const removed = applyAiOperations(welcome, [{ op: 'remove', path: '/blocks/0' }])
    expect(removed.ok && removed.doc.blocks?.length).toBe((welcome.blocks?.length ?? 0) - 1)
  })
})

describe('changedSections', () => {
  it('names what a suggestion changes so the user can review it', () => {
    const result = applyAiOperations(welcome, [{ op: 'replace', path: '/blocks/0/text', valueJson: '"Welcome aboard"' }])
    expect(result.ok && changedSections(welcome, result.doc)).toEqual(['Heading: Welcome aboard'])
  })
})
