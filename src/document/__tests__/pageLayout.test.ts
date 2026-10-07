import { describe, expect, it } from 'vitest'
import { FIXTURE_MAP } from '../fixtures'
import { pageItemsFor, pageSizeFor } from '../pageLayout'
import type { DocumentModel } from '../types'

const invoice = FIXTURE_MAP['invoice-torture']

describe('pageSizeFor', () => {
  it('uses the stored page size first', () => {
    expect(pageSizeFor({ pageSize: 'a5', locale: 'en-US' })).toBe('a5')
  })

  it('defaults to US Letter in Letter countries and A4 elsewhere', () => {
    expect(pageSizeFor({ locale: 'en-US' })).toBe('letter')
    expect(pageSizeFor({ locale: 'es-MX' })).toBe('letter')
    expect(pageSizeFor({ locale: 'de-DE' })).toBe('a4')
    expect(pageSizeFor({ locale: undefined })).toBe('a4')
  })
})

describe('pageItemsFor', () => {
  it('lists header, visible blocks and footer in print order', () => {
    const doc: DocumentModel = {
      ...invoice,
      dueDate: '2026-11-01',
      blocks: [
        { id: 'h', type: 'heading', text: 'Scope' },
        { id: 'gone', type: 'heading', text: 'Hidden', hidden: true },
        { id: 'lineItems', type: 'lineItems' },
      ],
    }
    expect(pageItemsFor(doc).map((i) => i.id)).toEqual(['header', 'date', 'h', 'lineItems', 'footer'])
  })

  it('drops header and footer when hidden in settings', () => {
    const doc: DocumentModel = { ...invoice, dueDate: undefined, blocks: [], settings: { blockVisibility: { header: false, footer: false } } }
    expect(pageItemsFor(doc)).toEqual([])
  })
})
