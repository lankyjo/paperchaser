/**
 * Pure, renderer-agnostic JSON import/export boundary (STOR-03/04, D-13/D-14).
 *
 * The versioned envelope is the on-disk contract: `{ format: 'paperchaser-document', version: 1, document }`.
 * parseDocument is the phase's ONLY untrusted-input surface — it never throws, never coerces,
 * and returns a structured rejection reason `{ code, path, expected, received }` so future UI
 * renders copy without re-deriving it (UI-SPEC E1).
 */

import * as z from 'zod'

import { documentSchema } from './types'
import type { DocumentModel } from './types'

/**
 * D-13: the versioned envelope — the migration seam for future schema evolution.
 * z.object() default-strips unknown envelope keys (D-14 applies at both levels);
 * unknown formats/versions are rejected as invalid_envelope.
 */
export const envelopeSchema = z.object({
  format: z.literal('paperchaser-document'),
  version: z.literal(2),
  document: documentSchema,
})

/** STOR-04: structured rejection reasons (UI-SPEC E1). Discriminated union on `code`. */
export type ImportError =
  | { code: 'invalid_json' }
  | { code: 'invalid_envelope'; path?: (string | number)[]; expected?: string; received?: string; keys?: string[] }
  | { code: 'schema_mismatch'; path: (string | number)[]; expected?: string; received?: string; keys?: string[] }

export type ParseResult = { ok: true; document: DocumentModel } | { ok: false; error: ImportError }

/** T-02-04-DOS: reject oversized payloads before JSON.parse — a cheap, bounded length check. */
export const MAX_JSON_LENGTH = 5_000_000
// ponytail: naive raw-string length cap. Switch to streaming/incremental JSON parsing
// only if multi-megabyte imports ever become a real throughput concern.

/**
 * STOR-03: validate then wrap in the versioned envelope. The pre-serialize parse is the
 * ONE allowed parse — it fails loudly in dev and never silently exports an invalid doc.
 * The import path uses safeParse only.
 */
export function exportDocument(doc: DocumentModel): string {
  documentSchema.parse(doc)
  return JSON.stringify({ format: 'paperchaser-document', version: 2, document: doc })
}

/**
 * STOR-04: three-stage validation — JSON syntax → envelope literals → document schema.
 * Each rejection class maps to a distinct ImportError code. Never throws; never partially returns.
 */
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
  const parsed = envelopeSchema.safeParse(raw) // z.safeParse at the boundary — never parse-throw
  if (!parsed.success) {
    // Zod 4 issue shape: { code, path, message, expected?, received?, keys? }. The public
    // $ZodIssue union does not expose expected/received/keys statically (RESEARCH skeleton's
    // direct access does not typecheck against zod 4.4.3), so read the raw issue shape.
    const issues = parsed.error.issues as unknown as Array<{
      code: string
      path: (string | number)[]
      expected?: string
      received?: string
      keys?: string[]
    }>

    // Zod 4 may report multiple issues — prefer the first document-level
    // issue for schema_mismatch; fall back to envelope-level otherwise.
    const docIssue = issues.find((i) => i.path[0] === 'document')
    const first = docIssue ?? issues[0]

    const { path } = first
    if (first.code === 'unrecognized_keys') {
      // Unrecognized keys at the document level are a schema_mismatch,
      // not an envelope-level reject. Only envelope-level extras are invalid_envelope.
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
