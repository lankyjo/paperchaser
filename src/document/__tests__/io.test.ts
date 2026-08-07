import { describe, expect, it } from 'vitest'

import { FIXTURE_MAP } from '../fixtures'
import { exportDocument, parseDocument } from '../io'

describe('envelope export — STOR-03 (D-13)', () => {
  it('wraps the document in the versioned envelope with exactly format/version/document keys', () => {
    const exported = exportDocument(FIXTURE_MAP['invoice-simple'])
    const parsed = JSON.parse(exported) as Record<string, unknown>
    expect(Object.keys(parsed).sort()).toEqual(['document', 'format', 'version'])
    expect(parsed.format).toBe('paperchaser-document')
    expect(parsed.version).toBe(1)
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
    const envelope = { format: 'other-format', version: 1, document: FIXTURE_MAP['invoice-simple'] }
    expect(parseDocument(JSON.stringify(envelope))).toEqual({
      ok: false,
      error: { code: 'invalid_envelope', path: ['format'] },
    })
  })

  it('rejects a wrong version literal with invalid_envelope', () => {
    const envelope = { format: 'paperchaser-document', version: 2, document: FIXTURE_MAP['invoice-simple'] }
    expect(parseDocument(JSON.stringify(envelope))).toEqual({
      ok: false,
      error: { code: 'invalid_envelope', path: ['version'] },
    })
  })

  it('rejects a missing required document field with schema_mismatch naming the exact field', () => {
    const doc = FIXTURE_MAP['invoice-simple']
    // JSON.stringify drops the undefined property — the envelope arrives without lineItems.
    const envelope = { format: 'paperchaser-document', version: 1, document: { ...doc, lineItems: undefined } }
    const result = parseDocument(JSON.stringify(envelope))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('schema_mismatch')
      expect(result.error.path).toEqual(['document', 'lineItems'])
      expect(result.error.expected).toBe('array')
    }
  })

  it('rejects a typo-d field name with schema_mismatch at the required-field path', () => {
    const doc = FIXTURE_MAP['invoice-simple']
    const envelope = {
      format: 'paperchaser-document',
      version: 1,
      document: { ...doc, lineItems: undefined, lineItemz: doc.lineItems },
    }
    const result = parseDocument(JSON.stringify(envelope))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('schema_mismatch')
      expect(result.error.path).toEqual(['document', 'lineItems'])
    }
  })

  it('rejects a wrong value type with schema_mismatch at the field path', () => {
    const envelope = {
      format: 'paperchaser-document',
      version: 1,
      document: { ...FIXTURE_MAP['invoice-simple'], lineItems: 'not-an-array' },
    }
    const result = parseDocument(JSON.stringify(envelope))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('schema_mismatch')
      expect(result.error.path).toEqual(['document', 'lineItems'])
      expect(result.error.expected).toBe('array')
    }
  })

  it('strips unknown extra fields from the document branch (D-14)', () => {
    const envelope = {
      format: 'paperchaser-document',
      version: 1,
      document: { ...FIXTURE_MAP['invoice-simple'], extraTopField: 'x' },
    }
    const result = parseDocument(JSON.stringify(envelope))
    expect(result.ok).toBe(true)
    if (result.ok) expect('extraTopField' in result.document).toBe(false)
  })
})
