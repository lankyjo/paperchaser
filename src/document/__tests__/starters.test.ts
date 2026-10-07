import { describe, expect, it } from 'vitest'

import { countPlaceholders } from '../finalizeChecks'
import { newDocument } from '../newDocument'
import { withPlaceholders } from '../starters/compose'
import { documentSchema, type DocumentModel } from '../types'

const make = (type: DocumentModel['type']) => {
  let n = 0
  return newDocument({ type, id: `d-${type}`, projectId: 'p1', today: '2026-10-07', newId: () => `b${n++}` })
}

describe('withPlaceholders', () => {
  it('turns [bracketed] hints into placeholder nodes and keeps the text around them', () => {
    expect(withPlaceholders('Between [Your business] and [Client name].')).toEqual([
      { type: 'text', text: 'Between ' },
      { type: 'placeholder', text: 'Your business' },
      { type: 'text', text: ' and ' },
      { type: 'placeholder', text: 'Client name' },
      { type: 'text', text: '.' },
    ])
  })
})

describe('agreement starter', () => {
  it('has clauses with placeholders, a payment schedule and signatures', () => {
    const doc = make('agreement')
    expect(documentSchema.parse(doc)).toEqual(doc)
    const types = doc.blocks?.map((b) => b.type) ?? []
    expect(types).toEqual(expect.arrayContaining(['heading', 'richText', 'paymentSchedule', 'signature']))
    expect(countPlaceholders(doc)).toBeGreaterThan(3)
  })
})

describe('brief starter', () => {
  it('covers overview, objective, audience and key message', () => {
    const doc = make('brief')
    expect(documentSchema.parse(doc)).toEqual(doc)
    const text = JSON.stringify(doc.blocks)
    for (const section of ['Project overview', 'Objective', 'Target audience', 'Key message']) expect(text).toContain(section)
    expect(countPlaceholders(doc)).toBeGreaterThan(0)
  })
})

describe('welcome, delivery guide and thank-you starters', () => {
  it('welcome has a greeting, project at a glance and numbered next steps', () => {
    const doc = make('welcome')
    expect(documentSchema.parse(doc)).toEqual(doc)
    expect(doc.blocks?.map((b) => b.type)).toEqual(expect.arrayContaining(['heading', 'richText', 'keyValue', 'steps']))
  })

  it('delivery guide lists files in a table and how to access them', () => {
    const doc = make('deliveryGuide')
    expect(documentSchema.parse(doc)).toEqual(doc)
    const text = JSON.stringify(doc.blocks)
    for (const part of ['File name', 'Download link', 'Link expires']) expect(text).toContain(part)
  })

  it('thank-you is a signed letter without a client signature line', () => {
    const doc = make('thankYou')
    expect(documentSchema.parse(doc)).toEqual(doc)
    expect(doc.blocks?.find((b) => b.type === 'signature')).toMatchObject({ clientLine: false })
    expect(countPlaceholders(doc)).toBeGreaterThan(0)
  })
})
