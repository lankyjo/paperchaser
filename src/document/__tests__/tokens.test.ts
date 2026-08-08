import { describe, expect, it } from 'vitest'

import { FIXTURE_MAP } from '../fixtures'
import { deriveWatermark } from '../totals'
import { documentSchema } from '../types'
import { TEMPLATE_REGISTRY, type TemplateId } from '../tokens'
import { resolveTokens, toCssVars } from '../resolveTokens'

describe('resolveTokens — Minimal defaults + D-04 accent fallback (03-01)', () => {
  it("resolveTokens('minimal', undefined) resolves the watermark accent to '#1d4ed8' (D-04 chain: accent ?? primary ?? fallback)", () => {
    const resolved = resolveTokens('minimal')
    expect(resolved.accent).toBe('#1d4ed8')
    // Minimal identity values (UI-SPEC single source of truth)
    expect(resolved.palette.ink).toBe('#111827')
    expect(resolved.spacing.sectionGap).toBe('12mm')
  })

  it('branding overrides only explicitly-present keys (D-02 partial merge)', () => {
    const resolved = resolveTokens('minimal', { primaryColor: '#ff0000', accentColor: '#00ff00' })
    expect(resolved.palette.primary).toBe('#ff0000')
    expect(resolved.palette.accent).toBe('#00ff00')
    expect(resolved.accent).toBe('#00ff00') // D-04: branding accent wins over the fallback
    expect(resolved.palette.ink).toBe('#111827') // untouched
    expect(resolved.palette.border).toBe('#e5e7eb') // untouched
    expect(resolved.fonts.bodyFontId).toBe('geist') // untouched
  })
})

describe('toCssVars — D-13 --tpl-* custom property emission (03-01)', () => {
  it('emits the canonical --tpl-* keys with resolved values', () => {
    const vars = toCssVars(resolveTokens('minimal'))
    expect(vars['--tpl-ink']).toBe('#111827')
    expect(vars['--tpl-primary']).toBe('#111827') // minimal has no primary → ink fallback
    expect(vars['--tpl-accent']).toBe('#1d4ed8')
    expect(vars['--tpl-border']).toBe('#e5e7eb')
    expect(vars['--tpl-font-body']).toBe("'Geist Variable', sans-serif")
    expect(vars['--tpl-title-size']).toBe('18px')
    expect(vars['--tpl-section-gap']).toBe('12mm')
  })
})

describe('documentSchema — D-09 back-compat for optional template/branding/pageSize (03-01)', () => {
  it('a Phase-2-era document without the new fields parses (no Dexie migration)', () => {
    const legacy = { ...FIXTURE_MAP['invoice-torture'] }
    expect('template' in legacy).toBe(false)
    expect(documentSchema.safeParse(legacy).success).toBe(true)
  })

  it('a document with template/branding/pageSize fields parses', () => {
    const withSelectors = {
      ...FIXTURE_MAP['invoice-simple'],
      template: 'minimal',
      pageSize: 'a4',
      branding: {
        primaryColor: '#ff0000',
        accentColor: '#00ff00',
        headingFont: 'geist',
        bodyFont: 'geist',
        headerStyle: 'standard',
        footerStyle: 'minimal',
        watermark: 'auto',
      },
    }
    expect(documentSchema.safeParse(withSelectors).success).toBe(true)
  })
})

describe('TEMPLATE_REGISTRY — TEMP-01 completeness (03-02: 7 templates)', () => {
  it('contains exactly the 7 template ids, matching the z.enum union in types.ts (edge-24, TEMP-01)', () => {
    // The registry keys and the schema union are ONE id list consumed in three
    // places (registry, zod enum, route whitelist) — a mismatch silently drops
    // a template from the whitelist, so set equality is pinned here.
    const templateEnum = (documentSchema.shape.template as { unwrap(): { options: readonly string[] } }).unwrap()
    expect(Object.keys(TEMPLATE_REGISTRY).sort()).toEqual([...templateEnum.options].sort())
  })

  it('every registry key is backed by a file token object honoring the harness geometry contract', () => {
    for (const id of Object.keys(TEMPLATE_REGISTRY)) {
      const tokens = TEMPLATE_REGISTRY[id as TemplateId]
      expect(tokens.palette.ink, `${id} ink`).toMatch(/^#/)
      expect(tokens.spacing.pagePadding, `${id} pagePadding`).toBe('15mm') // 15mm padding, ALL templates
    }
  })
})

describe('TEMPLATE_REGISTRY — TEMP-02 pairwise distinctness (03-02, edge-24)', () => {
  it('every unordered pair of templates differs in at least one field', () => {
    const ids = Object.keys(TEMPLATE_REGISTRY) as TemplateId[]
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = JSON.stringify(TEMPLATE_REGISTRY[ids[i]])
        const b = JSON.stringify(TEMPLATE_REGISTRY[ids[j]])
        expect(a, `${ids[i]} vs ${ids[j]} must differ in at least one field`).not.toBe(b)
      }
    }
  })
})

describe('D-10 — template-switch re-resolution semantics (03-02, edges 08/09)', () => {
  it('edge-08: switch with unset branding yields the NEW template defaults', () => {
    const corporate = resolveTokens('corporate')
    expect(corporate.palette.ink).toBe('#1f2937')
    expect(corporate.fonts.headingFontId).toBe('source-serif-4')
    expect(corporate.spacing.sectionGap).toBe('10mm')
    expect(corporate.accent).toBe('#1e3a5f') // D-04 chain: corporate primary navy
  })

  it('edge-09: switch with set branding keeps the set overrides; unset fields re-derive from the new template', () => {
    const branding = { primaryColor: '#ff0000' }
    const modern = resolveTokens('modern', branding)
    const corporate = resolveTokens('corporate', branding)
    expect(modern.palette.primary).toBe('#ff0000')
    expect(corporate.palette.primary).toBe('#ff0000') // set override survives the switch
    expect(corporate.palette.ink).toBe('#1f2937') // unset → corporate default
    expect(corporate.fonts.headingFontId).toBe('source-serif-4')
    expect(corporate.palette.border).toBe('#d1d5db')
  })
})

describe('D-02 — partial branding merge on a second template (03-02, edge-07)', () => {
  it('freelancer with only accentColor set — exactly that one field differs from the base', () => {
    const resolved = resolveTokens('freelancer', { accentColor: '#00ff00' })
    expect(resolved.palette.accent).toBe('#00ff00')
    expect(resolved.accent).toBe('#00ff00')
    expect(resolved.palette.primary).toBe('#ea580c') // untouched template default
    expect(resolved.palette.ink).toBe('#292524') // untouched
    expect(resolved.fonts.bodyFontId).toBe('geist') // untouched
  })
})

describe('edge-10 — invalid template value (03-02)', () => {
  it('a stored document with an invalid template fails documentSchema.safeParse (z.enum rejects; never silently defaulted)', () => {
    const doc = { ...FIXTURE_MAP['invoice-simple'], template: 'not-a-template' }
    expect(documentSchema.safeParse(doc).success).toBe(false)
  })
})

describe('deriveWatermark — edge-13 (03-01)', () => {
  it("status 'sent' renders no watermark", () => {
    expect(deriveWatermark('sent')).toBeNull()
  })
})
