/**
 * Pure, renderer-agnostic document model.
 *
 * JSON-serializable by construction: every value here can round-trip through
 * JSON.stringify/parse untouched. This is the seed of the Phase 2 domain model —
 * nothing in this file may depend on React, the DOM, or Dexie.
 */

import * as z from 'zod'

import { CURRENCY_DECIMALS } from './money'
import { richTextDocSchema } from './richtext'
import type { RichTextDoc } from './richtext'

// Re-export for fixtures.ts and other consumers
export type { RichTextDoc }

/** D-06/D-07: text fields accept plain string (legacy) or rich-text AST node array. */
const textFieldSchema = z.union([z.string(), richTextDocSchema])

/**
 * D-06: discount instances are percent (value in minor units of percent,
 * 1900 = 19%) or flat amount (value in minor units).
 */
const discountSchema = z.object({
  kind: z.enum(['percent', 'amount']),
  value: z.number().nonnegative(),
})

/**
 * D-07/D-08: line-like shipping/fee entries. taxRateMinor is REQUIRED with
 * 0 = untaxed (Pitfall 3 — keeps JSON round-trip structural, not value-luck).
 */
const shippingFeeSchema = z.object({
  label: textFieldSchema,
  amountMinor: z.int().nonnegative(),
  taxRateMinor: z.int().nonnegative(),
})

/**
 * T-04-04-LINE-IMAGE: line-item image is self-contained (data: URL) only —
 * reuses the logoSchema pattern. External http(s) URLs are rejected.
 */
const lineItemImageSchema = z
  .string()
  .refine((value) => value.startsWith('data:'), {
    message: 'line item image must be a self-contained data: URL',
  })

const lineItemSchema = z.object({
  id: z.string(),
  title: textFieldSchema,
  description: textFieldSchema,
  quantity: z.number().nonnegative(),
  /** Unit price in integer minor units (cents). Never floats — PITFALLS.md:232. */
  unitPriceMinor: z.int().nonnegative(),
  /** Tax rate in integer minor units of percent (e.g. 1900 = 19.00%). */
  taxRateMinor: z.int().nonnegative(),
  /** D-06: per-line discount; absent = no discount. */
  discount: discountSchema.optional(),
  /** LINE-01: optional self-contained image on the line item. */
  image: lineItemImageSchema.optional(),
})

/**
 * T-02-02-LOGO: logo is self-contained (data: URL) or null — never an external
 * http(s) URL, which would fetch remote content on render (tracking/exfiltration).
 */
const logoSchema = z
  .string()
  .nullable()
  .refine((value) => value === null || value.startsWith('data:'), {
    message: 'logo must be a self-contained data: URL or null',
  })

const companySchema = z.object({
  name: textFieldSchema,
  address: z.array(textFieldSchema),
  email: textFieldSchema,
  logo: logoSchema,
})

const customerSchema = z.object({
  name: textFieldSchema,
  address: z.array(textFieldSchema),
})

/**
 * D-09: render SELECTORS, all OPTIONAL — a missing field resolves at render time
 * (template → 'minimal', pageSize → 'a4', branding → template defaults), so
 * Phase-2-era stored documents render immediately with no Dexie migration.
 */
const templateIdSchema = z.enum(['blank', 'minimal', 'modern', 'corporate', 'freelancer', 'agency', 'creative'])
const pageSizeSchema = z.enum(['a4', 'a5', 'a3'])
const brandingSchema = z
  .object({
    primaryColor: z.string(),
    accentColor: z.string(),
    headingFont: z.enum(['geist', 'geist-mono', 'source-serif-4']),
    bodyFont: z.enum(['geist', 'geist-mono', 'source-serif-4']),
    headerStyle: z.enum(['standard', 'banner', 'compact']),
    footerStyle: z.enum(['minimal', 'standard', 'detailed']),
    watermark: z.enum(['auto', 'draft', 'paid']),
  })
  .partial()

export const documentSchema = z.object({
  // z.object() default STRIPS unknown keys = D-14 (strict-object reject is NOT used)
  id: z.string(),
  /** D-09: one model, one engine — shared across invoice/quote/receipt. */
  type: z.enum(['invoice', 'quote', 'receipt']),
  /** D-12: EUR/JPY today; adding a currency is a registry + schema change. */
  currency: z.enum(Object.keys(CURRENCY_DECIMALS) as [string, ...string[]]),
  /** Zod 4 top-level format — enforces YYYY-MM-DD. */
  issueDate: z.iso.date(),
  number: textFieldSchema,
  /** D-11: explicit status; watermark derives from it, never stored. */
  status: z.enum(['draft', 'sent', 'paid']),
  company: companySchema,
  customer: customerSchema,
  lineItems: z.array(lineItemSchema),
  /** D-05: single document-level discount instance (A6); absent = none. */
  discount: discountSchema.optional(),
  /** D-08: multiple shipping/fee entries allowed; absent = none. */
  shippingFees: z.array(shippingFeeSchema).optional(),
  /** D-09: style-only render selector; absent → 'minimal' at resolve time. */
  template: templateIdSchema.optional(),
  /** D-09: paper size selector; absent → 'a4' (PDF-01). */
  pageSize: pageSizeSchema.optional(),
  /** D-09: per-document branding overrides; absent → template defaults (D-02). */
  branding: brandingSchema.optional(),
  /** D-30: block visibility settings per-document — persisted across reloads. */
  settings: z
    .object({
      blockVisibility: z
        .object({
          header: z.boolean(),
          billTo: z.boolean(),
          items: z.boolean(),
          totals: z.boolean(),
          footer: z.boolean(),
        })
        .partial()
        .optional(),
    })
    .optional(),
})

/** Keeps the Phase 1 exported name (D-15 re-export pattern — fixtures.ts and DocumentPage.tsx import it). */
export type DocumentModel = z.infer<typeof documentSchema>

// Re-export the nested shapes so fixtures.ts imports keep compiling:
export type LineItem = z.infer<typeof lineItemSchema>
export type Company = z.infer<typeof companySchema>
export type Customer = z.infer<typeof customerSchema>

// D-09: render-selector types (consumed by tokens.ts, resolveTokens.ts, DocumentPage).
export type TemplateId = z.infer<typeof templateIdSchema>
export type PageSize = z.infer<typeof pageSizeSchema>
export type Branding = z.infer<typeof brandingSchema>
