// Resolves template + branding overrides into tokens and the --tpl-* CSS variable map; no React, DOM or Dexie.

import { FONT_STACKS, TEMPLATE_REGISTRY, type ResolvedTokens, type TemplateId } from './tokens'
import type { Branding } from './types'

// Accent fallback when neither branding nor the template defines one.
const DEFAULT_ACCENT = '#1d4ed8'

// Merges only explicitly set branding keys over template defaults, so switching template re-derives unset fields.
export function resolveTokens(template: TemplateId, branding?: Partial<Branding>): ResolvedTokens {
  const base = TEMPLATE_REGISTRY[template]
  return {
    ...base,
    palette: {
      ...base.palette,
      primary: branding?.primaryColor ?? base.palette.primary,
      accent: branding?.accentColor ?? base.palette.accent,
    },
    fonts: {
      ...base.fonts,
      headingFontId: branding?.headingFont ?? base.fonts.headingFontId,
      bodyFontId: branding?.bodyFont ?? base.fonts.bodyFontId,
    },
    header: {
      ...base.header,
      style: branding?.headerStyle ?? base.header.style,
    },
    footer: {
      ...base.footer,
      style: branding?.footerStyle ?? base.footer.style,
    },
    // Watermark accent: branding accent, else template accent, else template primary, else the default.
    accent: branding?.accentColor ?? base.palette.accent ?? base.palette.primary ?? DEFAULT_ACCENT,
  }
}

// CSS custom-property map spread on #print-root so preview and print projection inherit the same values.
export function toCssVars(resolved: ResolvedTokens): Record<string, string> {
  return {
    '--tpl-ink': resolved.palette.ink,
    '--tpl-primary': resolved.palette.primary ?? resolved.palette.ink,
    '--tpl-accent': resolved.accent,
    '--tpl-border': resolved.palette.border,
    '--tpl-fill': resolved.palette.fill,
    '--tpl-font-heading': FONT_STACKS[resolved.fonts.headingFontId],
    '--tpl-font-body': FONT_STACKS[resolved.fonts.bodyFontId],
    '--tpl-font-label': FONT_STACKS[resolved.fonts.labelFontId],
    '--tpl-label-letterspacing': resolved.fonts.labelLetterspacing,
    '--tpl-title-size': resolved.fonts.titleSize,
    '--tpl-title-weight': String(resolved.fonts.titleWeight),
    '--tpl-section-gap': resolved.spacing.sectionGap,
    '--tpl-radius': resolved.spacing.radius,
    '--tpl-row-rule': resolved.borders.rowRule,
    '--tpl-header-style': resolved.header.style,
    '--tpl-footer-style': resolved.footer.style,
  }
}
