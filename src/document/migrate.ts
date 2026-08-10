/**
 * Pure, renderer-agnostic v2→v3 document migration (D-29).
 *
 * Wraps every legacy string text field into a single-paragraph/single-text AST.
 * Mutates in place (Dexie modify contract). Idempotent — already-AST fields
 * pass through unchanged.
 *
 * Nothing in this file may depend on React, the DOM, or Dexie.
 */

import type { RichTextDoc } from './richtext'

/** Wrap a plain string into the single-paragraph AST shape. */
function wrapString(value: string): RichTextDoc {
  return [{ type: 'paragraph', content: [{ type: 'text', text: value }] }]
}

/** The canonical list of text-field paths in the v2 document shape. */
const TEXT_PATHS: Array<Array<string | number>> = [
  ['company', 'name'],
  ['company', 'email'],
  ['customer', 'name'],
]

const TEXT_ARRAY_PATHS: Array<Array<string | number>> = [
  ['company', 'address'],
  ['customer', 'address'],
]

const LINE_ITEM_TEXT_FIELDS = ['title', 'description'] as const

/**
 * Mutate `doc` in place: wrap every string text field into a single-paragraph AST.
 * Already-AST fields (from a partial migration) pass through unchanged.
 */
export function migrateV2ToV3(doc: Record<string, unknown>): void {
  // Scalar text fields: company.name, company.email, customer.name, document.number
  for (const path of TEXT_PATHS) {
    const parent = doc[path[0]] as Record<string, unknown> | undefined
    if (parent) {
      const key = path[1] as string
      if (typeof parent[key] === 'string') {
        parent[key] = wrapString(parent[key] as string)
      }
    }
  }

  // Top-level text field: number
  if (typeof doc.number === 'string') {
    doc.number = wrapString(doc.number as string)
  }

  // Array-of-string text fields: company.address, customer.address
  for (const path of TEXT_ARRAY_PATHS) {
    const parent = doc[path[0]] as Record<string, unknown> | undefined
    if (parent) {
      const key = path[1] as string
      const arr = parent[key]
      if (Array.isArray(arr)) {
        parent[key] = arr.map((entry: unknown) => (typeof entry === 'string' ? wrapString(entry) : entry))
      }
    }
  }

  // lineItems[].title, lineItems[].description
  const lineItems = doc.lineItems as Array<Record<string, unknown>> | undefined
  if (Array.isArray(lineItems)) {
    for (const item of lineItems) {
      for (const field of LINE_ITEM_TEXT_FIELDS) {
        if (typeof item[field] === 'string') {
          item[field] = wrapString(item[field] as string)
        }
      }
    }
  }

  // shippingFees[].label
  const shippingFees = doc.shippingFees as Array<Record<string, unknown>> | undefined
  if (Array.isArray(shippingFees)) {
    for (const fee of shippingFees) {
      if (typeof fee.label === 'string') {
        fee.label = wrapString(fee.label as string)
      }
    }
  }
}
