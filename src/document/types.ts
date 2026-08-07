/**
 * Pure, renderer-agnostic document model.
 *
 * JSON-serializable by construction: every value here can round-trip through
 * JSON.stringify/parse untouched. This is the seed of the Phase 2 domain model —
 * nothing in this file may depend on React, the DOM, or Dexie.
 */

export interface LineItem {
  id: string
  title: string
  description: string
  quantity: number
  /** Unit price in integer minor units (cents). Never floats — PITFALLS.md:232. */
  unitPriceMinor: number
  /** Tax rate in integer minor units of percent (e.g. 1900 = 19.00%). */
  taxRateMinor: number
}

export interface Company {
  name: string
  address: string[]
  email: string
  /** Self-contained data-URL image (inline SVG); null = no logo. */
  logo: string | null
}

export interface Customer {
  name: string
  address: string[]
}

export interface DocumentModel {
  id: string
  type: 'invoice'
  currency: 'EUR'
  issueDate: string
  number: string
  company: Company
  customer: Customer
  lineItems: LineItem[]
  watermark: 'draft' | null
}
