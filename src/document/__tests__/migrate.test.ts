import { describe, expect, it } from 'vitest'

import { migrateV2ToV3 } from '../migrate'
import { richTextDocSchema } from '../richtext'

/** Seed a v2-shaped document with plain-string text fields (before migration). */
function v2Doc() {
  return {
    id: 'test-1',
    type: 'invoice',
    currency: 'EUR',
    issueDate: '2026-08-07',
    number: 'INV-2026-0042',
    status: 'draft',
    company: {
      name: 'Test GmbH',
      address: ['Testweg 1', 'Berlin'],
      email: 't@test.test',
      logo: null,
    },
    customer: {
      name: 'Test Kundin',
      address: ['Weg 9'],
    },
    lineItems: [
      {
        id: 'li-1',
        title: 'Consulting',
        description: 'Strategy work',
        quantity: 1,
        unitPriceMinor: 10000,
        taxRateMinor: 1900,
      },
    ],
    shippingFees: [{ label: 'Shipping', amountMinor: 500, taxRateMinor: 1900 }],
  }
}

describe('migrateV2ToV3', () => {
  it('wraps a scalar string field (company.name) into a single-paragraph AST', () => {
    const doc = v2Doc() as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    const name = (doc.company as Record<string, unknown>).name
    expect(typeof name).not.toBe('string')
    expect(name).toEqual([{ type: 'paragraph', content: [{ type: 'text', text: 'Test GmbH' }] }])
  })

  it('wraps company.email into an AST', () => {
    const doc = v2Doc() as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    const email = (doc.company as Record<string, unknown>).email
    expect(typeof email).not.toBe('string')
    expect(Array.isArray(email)).toBe(true)
  })

  it('wraps customer.name into an AST', () => {
    const doc = v2Doc() as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    const name = (doc.customer as Record<string, unknown>).name
    expect(typeof name).not.toBe('string')
    expect(Array.isArray(name)).toBe(true)
  })

  it('wraps array-of-string fields (company.address) into arrays of ASTs', () => {
    const doc = v2Doc() as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    const addr = (doc.company as Record<string, unknown>).address as unknown[]
    expect(Array.isArray(addr)).toBe(true)
    for (const entry of addr) {
      expect(Array.isArray(entry)).toBe(true)
      const ast = entry as Array<{ type: string; content: Array<{ type: string; text: string }> }>
      expect(ast[0].type).toBe('paragraph')
      expect(ast[0].content[0].type).toBe('text')
    }
  })

  it('wraps customer.address into arrays of ASTs', () => {
    const doc = v2Doc() as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    const addr = (doc.customer as Record<string, unknown>).address as unknown[]
    expect(Array.isArray(addr)).toBe(true)
    for (const entry of addr) {
      expect(typeof entry).not.toBe('string')
    }
  })

  it('wraps document.number into an AST', () => {
    const doc = v2Doc() as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    expect(typeof doc.number).not.toBe('string')
  })

  it('wraps lineItems[].title into an AST', () => {
    const doc = v2Doc() as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    const items = doc.lineItems as Array<Record<string, unknown>>
    expect(typeof items[0].title).not.toBe('string')
    expect(items[0].title).toEqual([{ type: 'paragraph', content: [{ type: 'text', text: 'Consulting' }] }])
  })

  it('wraps lineItems[].description into an AST', () => {
    const doc = v2Doc() as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    const items = doc.lineItems as Array<Record<string, unknown>>
    expect(typeof items[0].description).not.toBe('string')
  })

  it('wraps shippingFees[].label into an AST', () => {
    const doc = v2Doc() as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    const fees = doc.shippingFees as Array<Record<string, unknown>>
    expect(typeof fees[0].label).not.toBe('string')
    expect(fees[0].label).toEqual([{ type: 'paragraph', content: [{ type: 'text', text: 'Shipping' }] }])
  })

  it('is idempotent — already-AST fields pass through unchanged', () => {
    const doc = v2Doc() as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    const nameBefore = JSON.stringify((doc.company as Record<string, unknown>).name)
    migrateV2ToV3(doc)
    const nameAfter = JSON.stringify((doc.company as Record<string, unknown>).name)
    expect(nameBefore).toBe(nameAfter)
  })

  it('non-text fields (quantity, unitPriceMinor, currency, status) are untouched', () => {
    const doc = v2Doc() as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    expect(doc.currency).toBe('EUR')
    expect(doc.status).toBe('draft')
    expect(doc.issueDate).toBe('2026-08-07')
    const items = doc.lineItems as Array<Record<string, unknown>>
    expect(items[0].quantity).toBe(1)
    expect(items[0].unitPriceMinor).toBe(10000)
    expect(items[0].taxRateMinor).toBe(1900)
  })

  it('the migrated output validates against richTextDocSchema at each text field', () => {
    const doc = v2Doc() as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    // company.name
    richTextDocSchema.parse((doc.company as Record<string, unknown>).name)
    // customer.name
    richTextDocSchema.parse((doc.customer as Record<string, unknown>).name)
    // lineItems[0].title
    richTextDocSchema.parse(((doc.lineItems as Array<Record<string, unknown>>)[0] as Record<string, unknown>).title)
    // shippingFees[0].label
    richTextDocSchema.parse(
      ((doc.shippingFees as Array<Record<string, unknown>>)[0] as Record<string, unknown>).label,
    )
    // document.number
    richTextDocSchema.parse(doc.number)
  })

  it('a v2 doc with empty string fields wraps correctly', () => {
    const doc = {
      id: 'empty-1',
      type: 'invoice',
      currency: 'EUR',
      issueDate: '2026-08-07',
      number: '',
      status: 'draft',
      company: { name: '', address: [''], email: '', logo: null },
      customer: { name: '', address: [''] },
      lineItems: [{ id: 'x', title: '', description: '', quantity: 1, unitPriceMinor: 0, taxRateMinor: 0 }],
    } as unknown as Record<string, unknown>
    migrateV2ToV3(doc)
    const name = (doc.company as Record<string, unknown>).name as Array<{ content: Array<{ text: string }> }>
    expect(name[0].content[0].text).toBe('')
  })
})
