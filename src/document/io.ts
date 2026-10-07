// JSON import/export boundary; parseDocument is the untrusted-input surface and never throws or coerces.

import * as z from 'zod'

import { documentSchema } from './types'
import type { DocumentModel } from './types'

// Versioned on-disk envelope; unknown keys are stripped and unknown formats/versions are rejected.
export const envelopeSchema = z.object({
  format: z.literal('paperchaser-document'),
  version: z.literal(2),
  document: documentSchema,
})

// Structured rejection reasons, discriminated on `code`, so the UI can render copy without re-deriving it.
export type ImportError =
  | { code: 'invalid_json' }
  | { code: 'invalid_envelope'; path?: (string | number)[]; expected?: string; received?: string; keys?: string[] }
  | { code: 'schema_mismatch'; path: (string | number)[]; expected?: string; received?: string; keys?: string[] }

export type ParseResult = { ok: true; document: DocumentModel } | { ok: false; error: ImportError }

// ponytail: naive length cap rejects oversized payloads before JSON.parse; switch to streaming parsing if multi-megabyte imports matter.
export const MAX_JSON_LENGTH = 5_000_000

// Validates then wraps in the envelope; parse() throws so an invalid document is never exported.
export function exportDocument(doc: DocumentModel): string {
  documentSchema.parse(doc)
  return JSON.stringify({ format: 'paperchaser-document', version: 2, document: doc })
}

// Validates JSON syntax, then envelope, then document schema, mapping each failure to an ImportError code.
export function parseDocument(json: string): ParseResult {
  if (json.length > MAX_JSON_LENGTH) {
    return { ok: false, error: { code: 'invalid_json' } }
  }
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return { ok: false, error: { code: 'invalid_json' } }
  }
  const parsed = envelopeSchema.safeParse(raw)
  if (!parsed.success) {
    // Zod's public issue type hides expected/received/keys, so read the raw issue shape.
    const issues = parsed.error.issues as unknown as Array<{
      code: string
      path: (string | number)[]
      expected?: string
      received?: string
      keys?: string[]
    }>

    // Prefer the first document-level issue; fall back to the envelope-level one.
    const docIssue = issues.find((i) => i.path[0] === 'document')
    const first = docIssue ?? issues[0]

    const { path } = first
    if (first.code === 'unrecognized_keys') {
      // Unrecognized keys inside the document are a schema mismatch; only envelope-level extras are invalid_envelope.
      if (path[0] === 'document') {
        return { ok: false, error: { code: 'schema_mismatch', path, keys: first.keys } }
      }
      return { ok: false, error: { code: 'invalid_envelope', path, keys: first.keys } }
    }
    if (path[0] !== 'document') {
      return { ok: false, error: { code: 'invalid_envelope', path, expected: first.expected, received: first.received } }
    }
    return { ok: false, error: { code: 'schema_mismatch', path, expected: first.expected, received: first.received } }
  }
  return { ok: true, document: parsed.data.document }
}
