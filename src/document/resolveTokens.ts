/**
 * Pure resolver (D-14): template + branding overrides → resolved tokens + the
 * --tpl-* CSS custom-property map applied to #print-root (D-13).
 *
 * Nothing in this file may depend on React, the DOM, or Dexie — Node-testable
 * by construction (mirrors the totals.ts module contract).
 */

import { FONT_STACKS, TEMPLATE_REGISTRY, type ResolvedTokens, type TemplateId } from './tokens'
import type { Branding } from './types'

/** D-04 fallback when neither branding nor the template defines an accent. */
const DEFAULT_ACCENT = '#1d4ed8'

/**
 * Resolve a template's token defaults with per-document branding overrides
 * (D-02 partial-merge: only explicitly-present branding keys override; unset
 * fields fall back to the template defaults — D-10 semantics fall out of this,
 * re-resolving after a template switch re-derives unset fields).
 */
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
    // D-04: watermark accent — branding accent wins, else template accent,
    // else template primary, else the calibrated #1d4ed8 fallback.
    accent: branding?.accentColor ?? base.palette.accent ?? base.palette.primary ?? DEFAULT_ACCENT,
  }
}

/**
 * Resolved tokens → the D-13 CSS custom-property map. Spread as inline style on
 * #print-root (cast through `as CSSProperties` in the component — React's
 * CSSProperties lacks the `--*` index signature), so the print projection
 * inherits the same values from the same element.
 */
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
    '--tpl-band-width': resolved.spacing.bandWidth,
    '--tpl-radius': resolved.spacing.radius,
    '--tpl-padding-left': resolved.spacing.pagePaddingLeft ?? resolved.spacing.pagePadding,
    '--tpl-row-rule': resolved.borders.rowRule,
    '--tpl-header-style': resolved.header.style,
    '--tpl-footer-style': resolved.footer.style,
  }
}
