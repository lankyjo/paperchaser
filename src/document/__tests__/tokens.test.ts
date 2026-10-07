import { describe, expect, it } from 'vitest'

import { FIXTURE_MAP } from '../fixtures'
import { documentSchema } from '../types'
import { TEMPLATE_REGISTRY, type TemplateId } from '../tokens'
import { resolveTokens, toCssVars } from '../resolveTokens'

describe('resolveTokens — Minimal defaults + D-04 accent fallback (03-01)', () => {
  it("resolveTokens('minimal', undefined) resolves the watermark accent to '#1d4ed8' (D-04 chain: accent ?? primary ?? fallback)", () => {
    const resolved = resolveTokens('minimal')
    expect(resolved.accent).toBe('#1d4ed8')
    // Minimal identity values
    expect(resolved.palette.ink).toBe('#111827')
    expect(resolved.spacing.sectionGap).toBe('12mm')
  })

  it('branding overrides only explicitly-present keys (D-02 partial merge)', () => {
    const resolved = resolveTokens('minimal', { primaryColor: '#ff0000', accentColor: '#00ff00' })
    expect(resolved.palette.primary).toBe('#ff0000')
    expect(resolved.palette.accent).toBe('#00ff00')
    expect(resolved.accent).toBe('#00ff00') // branding accent wins over the fallback
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

describe('TEMPLATE_REGISTRY', () => {
  it('holds exactly the template ids the document schema accepts', () => {
    const templateEnum = (documentSchema.shape.template as { unwrap(): { options: readonly string[] } }).unwrap()
    expect(Object.keys(TEMPLATE_REGISTRY).sort()).toEqual([...templateEnum.options].sort())
  })

  it('keeps the 15mm page padding in every template', () => {
    for (const id of Object.keys(TEMPLATE_REGISTRY)) {
      expect(TEMPLATE_REGISTRY[id as TemplateId].spacing.pagePadding, id).toBe('15mm')
    }
  })
})

describe('template switching', () => {
  it('re-derives unset fields from the new template and keeps set branding', () => {
    const blank = resolveTokens('blank', { primaryColor: '#ff0000' })
    expect(blank.palette.primary).toBe('#ff0000')
    expect(blank.palette.ink).toBe('#000000')
    expect(blank.fonts.headingFontId).toBe('system')
    expect(blank.spacing.sectionGap).toBe('8mm')
    expect(blank.accent).toBe('#1d4ed8')
  })
})

describe('edge-10 — invalid template value (03-02)', () => {
  it('a stored document with an invalid template fails documentSchema.safeParse (z.enum rejects; never silently defaulted)', () => {
    const doc = { ...FIXTURE_MAP['invoice-simple'], template: 'not-a-template' }
    expect(documentSchema.safeParse(doc).success).toBe(false)
  })
})
