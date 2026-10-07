import { describe, expect, it } from 'vitest'

import { newInvoice } from '../../document/newInvoice'
import { buildAiPrompt, replySchema } from '../aiPrompt'

describe('buildAiPrompt', () => {
  it('sends the document without image data, plus the instruction', () => {
    const doc = { ...newInvoice({ id: 'i', projectId: 'p', today: '2026-10-07' }), company: { name: '', address: [], email: '', logo: 'data:image/png;base64,AAAA' } }
    const { system, user, images } = buildAiPrompt(doc, 'Add a polite payment note')
    expect(system).toContain('JSON')
    expect(user).toContain('Add a polite payment note')
    expect(user).not.toContain('base64')
    expect(images).toEqual(['data:image/png;base64,AAAA'])
  })
})

describe('replySchema', () => {
  it('accepts the operations shape and rejects unknown operations', () => {
    const ok = { summary: 'Renamed heading', operations: [{ op: 'replace', path: '/blocks/0/text', valueJson: '"Hi"' }] }
    expect(replySchema.parse(ok)).toEqual(ok)
    expect(replySchema.safeParse({ summary: '', operations: [{ op: 'move', path: '/x', valueJson: '' }] }).success).toBe(false)
  })
})
