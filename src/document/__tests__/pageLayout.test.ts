import { describe, expect, it } from 'vitest'
import { FIXTURE_MAP } from '../fixtures'
import { documentFacts, pageItemsFor, pageSizeFor, resolvePage } from '../pageLayout'
import { TEMPLATE_VERSIONS } from '../tokens'
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

describe('documentFacts', () => {
  const company = { ...invoice.company, payment: ['Harbor Credit Union', 'IBAN DE89 3704 0044 0532 0130 00'] }

  it('prints your payment details on money documents', () => {
    expect(documentFacts({ ...invoice, company }).payment).toEqual(company.payment)
  })

  it('leaves payment details off documents nobody pays', () => {
    expect(documentFacts({ ...invoice, type: 'welcome', company }).payment).toEqual([])
    expect(documentFacts({ ...invoice, company: { ...invoice.company, payment: undefined } }).payment).toEqual([])
  })
})

describe('resolvePage', () => {
  it('stamps pages with the template version a sent document recorded, else the current one', () => {
    const sent: DocumentModel = { ...invoice, template: 'noirLedger', frozen: { finalizedAt: '2026-10-07T10:00:00.000Z', totals: { lineNets: [], subtotalMinor: 0, taxMinor: 0, grandTotalMinor: 0 }, templateVersion: 1 } }
    expect(resolvePage(sent).frame.version).toBe(1)
    expect(resolvePage({ ...invoice, template: 'noirLedger' }).frame.version).toBe(TEMPLATE_VERSIONS.noirLedger.length)
  })
})
