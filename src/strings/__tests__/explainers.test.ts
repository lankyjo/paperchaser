import { describe, expect, it } from 'vitest'

import { DOC_TITLES } from '../../document/tokens'
import { EXPLAINERS } from '../explainers'

describe('EXPLAINERS', () => {
  it('explains every document type with a one-line summary and a fuller why, what and tip', () => {
    for (const type of Object.keys(DOC_TITLES) as (keyof typeof DOC_TITLES)[]) {
      const e = EXPLAINERS[type]
      expect(e.short.length).toBeGreaterThan(20)
      expect(e.short.length).toBeLessThan(120)
      expect(e.why.length).toBeGreaterThan(40)
      expect(e.what.length).toBeGreaterThan(0)
      expect(e.tip.length).toBeGreaterThan(20)
    }
  })
})
