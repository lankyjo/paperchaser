import { describe, expect, it } from 'vitest'

import { catalogItemSchema, lineItemFromService } from '../catalog'

describe('saved services', () => {
  it('round-trip through the schema and become a line item with their price and tax', () => {
    const service = { id: 's1', name: 'Logo design', description: 'Three concepts, two revisions', priceMinor: 120000, taxRateMinor: 1900 }
    expect(catalogItemSchema.parse(service)).toEqual(service)
    expect(lineItemFromService(service, 'l1')).toEqual({
      id: 'l1',
      title: 'Logo design',
      description: 'Three concepts, two revisions',
      quantity: 1,
      unitPriceMinor: 120000,
      taxRateMinor: 1900,
    })
  })
})
