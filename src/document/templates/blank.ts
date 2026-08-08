import type { TemplateTokens } from '../tokens'

/**
 * Blank template tokens — values VERBATIM from the 03-UI-SPEC identity table
 * (the single source of truth). Data only, no logic.
 *
 * Zero decoration, the raw baseline: system sans, table grid only, no
 * header/footer rules. Header defaults to Compact, footer to Minimal
 * (UI-SPEC §Template Identity 1).
 */
export const blankTokens: TemplateTokens = {
  palette: {
    ink: '#000000',
    primary: null, // zero decoration — no brand color
    accent: null, // "no accent" (UI-SPEC)
    border: '#d1d5db',
    fill: '#ffffff',
  },
  fonts: {
    headingFontId: 'system', // "Helvetica Neue", Arial
    bodyFontId: 'system',
    titleSize: '24px', // document base; Blank has no size override
    titleWeight: 700, // title 700 per identity
    labelFontId: 'system',
    labelLetterspacing: '0em', // no label styling
  },
  borders: {
    rowRule: '#d1d5db', // 1px table grid only
  },
  spacing: {
    sectionGap: '8mm', // compact sections
    pagePadding: '15mm', // harness geometry contract (all templates)
    bandWidth: '0px', // no band
    radius: '0px', // no rounded panels
  },
  header: {
    style: 'compact', // Blank defaults Compact header
    titleLabel: 'INVOICE',
  },
  footer: {
    style: 'minimal', // none — blank space
  },
  table: {
    headerText: '#000000', // plain ink, no styling
  },
  totals: {
    rule: 'transparent', // plain rows, no grand-total rule
  },
}
