import * as z from 'zod'

import type { DocumentModel } from '../document/types'

// A reusable service with its usual price, for quick insert into quotes and invoices.
export const catalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  priceMinor: z.int().nonnegative(),
  taxRateMinor: z.int().nonnegative(),
})

export type CatalogItem = z.infer<typeof catalogItemSchema>

export function lineItemFromService(service: CatalogItem, id: string): DocumentModel['lineItems'][number] {
  return { id, title: service.name, description: service.description, quantity: 1, unitPriceMinor: service.priceMinor, taxRateMinor: service.taxRateMinor }
}
