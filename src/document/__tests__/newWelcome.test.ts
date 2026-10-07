import { describe, expect, it } from 'vitest'

import { newWelcome } from '../newWelcome'
import { documentSchema } from '../types'

describe('newWelcome', () => {
  it('creates a valid welcome document built from heading, rich text and key-value blocks', () => {
    const doc = newWelcome({ id: 'w1', projectId: 'p1', today: '2026-10-07', newId: (n) => `b${n}` })
    expect(documentSchema.parse(doc)).toEqual(doc)
    expect(doc.type).toBe('welcome')
    expect(doc.blocks?.map((b) => b.type)).toEqual(['heading', 'richText', 'keyValue'])
    expect(new Set(doc.blocks?.map((b) => b.id)).size).toBe(3)
  })
})
