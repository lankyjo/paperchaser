import { describe, expect, it } from 'vitest'

import { FIXTURE_MAP } from '../fixtures'
import { MAX_JSON_LENGTH, exportDocument, parseDocument } from '../io'
import type { DocumentModel } from '../types'

describe('envelope export — STOR-03 (D-13)', () => {
  it('wraps the document in the versioned envelope with exactly format/version/document keys', () => {
    const exported = exportDocument(FIXTURE_MAP['invoice-simple'])
    const parsed = JSON.parse(exported) as Record<string, unknown>
    expect(Object.keys(parsed).sort()).toEqual(['document', 'format', 'version'])
    expect(parsed.format).toBe('paperchaser-document')
    expect(parsed.version).toBe(2)
    expect(parsed.document).toEqual(FIXTURE_MAP['invoice-simple'])
  })
})

describe('lossless round-trip — STOR-03 (Pitfall 3)', () => {
  for (const [key, doc] of Object.entries(FIXTURE_MAP)) {
    it(`parseDocument(exportDocument(${key})) deep-equals ${key}`, () => {
      const result = parseDocument(exportDocument(doc))
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.document).toEqual(doc)
    })
  }
})

describe('boundary rejection — STOR-04', () => {
  it('rejects malformed JSON with invalid_json', () => {
    expect(parseDocument('not json{')).toEqual({ ok: false, error: { code: 'invalid_json' } })
  })

  it('rejects a wrong format literal with invalid_envelope', () => {
    const envelope = { format: 'other-format', version: 2, document: FIXTURE_MAP['invoice-simple'] }
    expect(parseDocument(JSON.stringify(envelope))).toEqual({
      ok: false,
      error: { code: 'invalid_envelope', path: ['format'] },
    })
  })

  it('rejects a wrong version literal with invalid_envelope', () => {
    const envelope = { format: 'paperchaser-document', version: 1, document: FIXTURE_MAP['invoice-simple'] }
    expect(parseDocument(JSON.stringify(envelope))).toEqual({
      ok: false,
      error: { code: 'invalid_envelope', path: ['version'] },
    })
  })

  it('rejects a missing required document field with schema_mismatch naming the exact field', () => {
    const doc = FIXTURE_MAP['invoice-simple']
    // JSON.stringify drops the undefined property — the envelope arrives without lineItems.
    const envelope = { format: 'paperchaser-document', version: 2, document: { ...doc, lineItems: undefined } }
    const result = parseDocument(JSON.stringify(envelope))
    if (result.ok) throw new Error('expected a rejection')
    const error = result.error
    if (error.code !== 'schema_mismatch') throw new Error(`expected schema_mismatch, got ${error.code}`)
    expect(error.path).toEqual(['document', 'lineItems'])
    expect(error.expected).toBe('array')
  })

  it('rejects a typo-d field name with schema_mismatch at the required-field path', () => {
    const doc = FIXTURE_MAP['invoice-simple']
    const envelope = {
      format: 'paperchaser-document',
      version: 1,
      document: { ...doc, lineItems: undefined, lineItemz: doc.lineItems },
    }
    const result = parseDocument(JSON.stringify(envelope))
    if (result.ok) throw new Error('expected a rejection')
    const error = result.error
    if (error.code !== 'schema_mismatch') throw new Error(`expected schema_mismatch, got ${error.code}`)
    expect(error.path).toEqual(['document', 'lineItems'])
  })

  it('rejects a wrong value type with schema_mismatch at the field path', () => {
    const envelope = {
      format: 'paperchaser-document',
      version: 1,
      document: { ...FIXTURE_MAP['invoice-simple'], lineItems: 'not-an-array' },
    }
    const result = parseDocument(JSON.stringify(envelope))
    if (result.ok) throw new Error('expected a rejection')
    const error = result.error
    if (error.code !== 'schema_mismatch') throw new Error(`expected schema_mismatch, got ${error.code}`)
    expect(error.path).toEqual(['document', 'lineItems'])
    expect(error.expected).toBe('array')
  })

  it('strips unknown extra fields from the document branch (D-14)', () => {
    const envelope = {
      format: 'paperchaser-document',
      version: 2,
      document: { ...FIXTURE_MAP['invoice-simple'], extraTopField: 'x' },
    }
    const result = parseDocument(JSON.stringify(envelope))
    expect(result.ok).toBe(true)
    if (result.ok) expect('extraTopField' in result.document).toBe(false)
  })
})

describe('boundary hardening — precision, size guard, breadth, nested strip, logo refine', () => {
  it('rejects fractional minor-unit money with schema_mismatch at the money field (no silent coercion)', () => {
    const doc = FIXTURE_MAP['invoice-simple']
    const envelope = {
      format: 'paperchaser-document',
      version: 1,
      document: { ...doc, lineItems: [{ ...doc.lineItems[0], unitPriceMinor: 100.5 }] },
    }
    const result = parseDocument(JSON.stringify(envelope))
    if (result.ok) throw new Error('expected a rejection')
    const error = result.error
    if (error.code !== 'schema_mismatch') throw new Error(`expected schema_mismatch, got ${error.code}`)
    expect(error.path).toEqual(['document', 'lineItems', 0, 'unitPriceMinor'])
  })

  it('rejects oversized JSON input with invalid_json before parsing (DoS guard)', () => {
    const oversized = `{"format":"paperchaser-document","version":1,"document":{"pad":"${'a'.repeat(MAX_JSON_LENGTH + 1)}"}}`
    expect(parseDocument(oversized)).toEqual({ ok: false, error: { code: 'invalid_json' } })
  })

  it('round-trips a JPY receipt with per-line + document discounts and shipping/fees losslessly', () => {
    const doc: DocumentModel = {
      id: 'jpy-receipt',
      projectId: 'project-1',
      type: 'receipt',
      currency: 'JPY',
      issueDate: '2026-08-07',
      number: 'R-2026-0001',
      status: 'paid',
      company: { name: '株式会社テスト', address: ['東京都千代田区 1-2-3'], email: 'info@test.example', logo: null },
      customer: { name: '田中 太郎', address: ['大阪市北区 9-8-7'] },
      lineItems: [
        {
          id: 'jpy-1',
          title: '商品A',
          description: '',
          quantity: 2,
          unitPriceMinor: 1500,
          taxRateMinor: 1000,
          discount: { kind: 'percent', value: 1000 },
        },
        { id: 'jpy-2', title: '商品B', description: '', quantity: 1, unitPriceMinor: 3200, taxRateMinor: 1000 },
      ],
      discount: { kind: 'amount', value: 500 },
      shippingFees: [
        { label: '配送料', amountMinor: 700, taxRateMinor: 1000 },
        { label: '手数料', amountMinor: 300, taxRateMinor: 0 },
      ],
    }
    const result = parseDocument(exportDocument(doc))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.document).toEqual(doc)
  })

  it('strips nested unknown fields from line items and company (D-14 at depth)', () => {
    const doc = FIXTURE_MAP['invoice-simple']
    const envelope = {
      format: 'paperchaser-document',
      version: 2,
      document: {
        ...doc,
        company: { ...doc.company, extraCompanyField: 'x' },
        lineItems: [{ ...doc.lineItems[0], extraLineField: true }],
      },
    }
    const result = parseDocument(JSON.stringify(envelope))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect('extraCompanyField' in result.document.company).toBe(false)
      expect('extraLineField' in result.document.lineItems[0]).toBe(false)
    }
  })

  it('rejects an external http logo URL with schema_mismatch at the logo path (T-02-02-LOGO)', () => {
    const doc = FIXTURE_MAP['invoice-simple']
    const envelope = {
      format: 'paperchaser-document',
      version: 1,
      document: { ...doc, company: { ...doc.company, logo: 'http://evil.example/track.png' } },
    }
    const result = parseDocument(JSON.stringify(envelope))
    if (result.ok) throw new Error('expected a rejection')
    const error = result.error
    if (error.code !== 'schema_mismatch') throw new Error(`expected schema_mismatch, got ${error.code}`)
    expect(error.path).toEqual(['document', 'company', 'logo'])
  })
})
