import { describe, expect, it } from 'vitest'
import { TEMPLATE_REGISTRY, type TemplateId } from '../tokens'
import { contrastRatio } from '../contrast'
import { resolveTokens } from '../resolveTokens'

// WCAG 2.2 AA for normal-size text.
const AA = 4.5

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
  })
})

describe('template text contrast', () => {
  for (const [id, tokens] of Object.entries(TEMPLATE_REGISTRY) as [TemplateId, (typeof TEMPLATE_REGISTRY)[TemplateId]][]) {
    it(`${id}: body, muted and label text meet AA on the page`, () => {
      const fill = tokens.palette.fill
      expect(contrastRatio(tokens.palette.ink, fill), 'ink').toBeGreaterThanOrEqual(AA)
      expect(contrastRatio(tokens.palette.muted, fill), 'muted').toBeGreaterThanOrEqual(AA)
      expect(contrastRatio(tokens.fonts.labelColor ?? tokens.palette.primary ?? tokens.palette.ink, fill), 'labels').toBeGreaterThanOrEqual(AA)
    })

    it.runIf(tokens.light !== undefined)(`${id}: the light print version also meets AA`, () => {
      const light = resolveTokens(id, { lightPrint: true })
      for (const color of [light.palette.ink, light.palette.muted, light.fonts.labelColor ?? light.palette.ink, light.accent]) {
        expect(contrastRatio(color, light.palette.fill), color).toBeGreaterThanOrEqual(AA)
      }
    })
  }
})
