import { resolveTokens } from '../../document/resolveTokens'
import type { Branding, TemplateId } from '../../document/types'
import { FONT_OPTIONS, FOOTER_OPTIONS, type HEADER_OPTIONS } from './brandingOptions'

// Values the branding controls show: the document's override, else the active template's default.
export function useBrandingDisplay(branding: Partial<Branding>, template: TemplateId) {
  const resolved = resolveTokens(template)

  const swatches = [
    resolved.palette.ink,
    resolved.palette.primary ?? resolved.palette.ink,
    resolved.accent,
    resolved.palette.border,
  ]
  const primaryValue = branding.primaryColor ?? resolved.palette.primary ?? resolved.palette.ink
  const accentValue = branding.accentColor ?? resolved.accent

  // A default that is not a select option (e.g. Blank's 'system' font) shows as unselected.
  const headingFont = FONT_OPTIONS.some((o) => o.value === (branding.headingFont ?? resolved.fonts.headingFontId))
    ? (branding.headingFont ?? resolved.fonts.headingFontId)
    : null
  const bodyFont = FONT_OPTIONS.some((o) => o.value === (branding.bodyFont ?? resolved.fonts.bodyFontId))
    ? (branding.bodyFont ?? resolved.fonts.bodyFontId)
    : null
  const headerStyle: (typeof HEADER_OPTIONS)[number]['value'] = branding.headerStyle ?? resolved.header.style
  const footerStyle = FOOTER_OPTIONS.some((o) => o.value === (branding.footerStyle ?? resolved.footer.style))
    ? (branding.footerStyle ?? resolved.footer.style)
    : null
  const watermark = branding.watermark ?? 'auto'

  return { swatches, primaryValue, accentValue, headingFont, bodyFont, headerStyle, footerStyle, watermark }
}
