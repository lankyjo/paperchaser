// Pure, JSON-serializable document model; no React, DOM or Dexie.

import * as z from 'zod'

import { CURRENCY_DECIMALS } from './money'
import { richTextDocSchema } from './richtext'
import type { RichTextDoc } from './richtext'

// Re-exported for fixtures.ts and other consumers.
export type { RichTextDoc }

// Text fields accept a plain string (legacy) or a rich-text node array.
const textFieldSchema = z.union([z.string(), richTextDocSchema])

// Discount is a percent (minor units of percent, 1900 = 19%) or a flat amount in minor units.
const discountSchema = z.object({
  kind: z.enum(['percent', 'amount']),
  value: z.number().nonnegative(),
})

// Shipping/fee entry; taxRateMinor is required, with 0 meaning untaxed.
const shippingFeeSchema = z.object({
  label: textFieldSchema,
  amountMinor: z.int().nonnegative(),
  taxRateMinor: z.int().nonnegative(),
})

// Line-item image must be a self-contained data: URL so rendering never fetches remote content.
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
  // Unit price in integer minor units (cents), never floats.
  unitPriceMinor: z.int().nonnegative(),
  // Tax rate in integer minor units of percent (e.g. 1900 = 19.00%).
  taxRateMinor: z.int().nonnegative(),
  // Per-line discount; absent means none.
  discount: discountSchema.optional(),
  // Optional self-contained image on the line item.
  image: lineItemImageSchema.optional(),
})

// Logo is a data: URL or null, never an http(s) URL that would fetch remote content (tracking/exfiltration) on render.
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

// Render selectors are optional and resolve at render time, so older stored documents render without migration.
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
  projectId: z.string(),
  // Project-shared fields this document has edited locally, so project changes no longer overwrite them.
  overrides: z.array(z.enum(['customer.name', 'customer.address'])).optional(),
  // z.object() strips unknown keys rather than rejecting them.
  id: z.string(),
  // One model shared across invoice, quote and receipt.
  type: z.enum(['invoice', 'quote', 'receipt']),
  // Adding a currency means adding it to CURRENCY_DECIMALS.
  currency: z.enum(Object.keys(CURRENCY_DECIMALS) as [string, ...string[]]),
  // Enforces YYYY-MM-DD.
  issueDate: z.iso.date(),
  number: textFieldSchema,
  // Explicit status; the watermark derives from it and is never stored.
  status: z.enum(['draft', 'sent', 'paid']),
  company: companySchema,
  customer: customerSchema,
  lineItems: z.array(lineItemSchema),
  // Single document-level discount; absent means none.
  discount: discountSchema.optional(),
  // Any number of shipping/fee entries; absent means none.
  shippingFees: z.array(shippingFeeSchema).optional(),
  // Style-only render selector; absent resolves to 'minimal'.
  template: templateIdSchema.optional(),
  // Paper size; absent resolves to 'a4'.
  pageSize: pageSizeSchema.optional(),
  // Per-document branding overrides; absent uses template defaults.
  branding: brandingSchema.optional(),
  // Per-document block visibility, persisted across reloads.
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

export type DocumentModel = z.infer<typeof documentSchema>

export type LineItem = z.infer<typeof lineItemSchema>
export type Company = z.infer<typeof companySchema>
export type Customer = z.infer<typeof customerSchema>

export type TemplateId = z.infer<typeof templateIdSchema>
export type PageSize = z.infer<typeof pageSizeSchema>
export type Branding = z.infer<typeof brandingSchema>
