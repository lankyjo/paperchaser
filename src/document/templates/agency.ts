import type { TemplateTokens } from '../tokens'

/**
 * Agency template tokens — values VERBATIM from the 03-UI-SPEC identity table
 * (the single source of truth). Data only, no logic.
 *
 * Bold, mono labels, color-block header: Geist Mono 500 uppercase 9px labels
 * letterspacing 0.12em, 8px accent top band, tight sections
 * (UI-SPEC §Template Identity 6).
 */
export const agencyTokens: TemplateTokens = {
  palette: {
    ink: '#0a0a0a',
    primary: '#2563eb', // default primary
    accent: null, // D-04 chain resolves to primary
    border: '#f3f4f6',
    fill: '#ffffff',
    muted: '#6b7280', // mono small print gray
  },
  fonts: {
    headingFontId: 'geist',
    bodyFontId: 'geist',
    titleSize: '28px',
    titleWeight: 700,
    labelFontId: 'geist-mono', // mono uppercase labels
    labelLetterspacing: '0.12em',
  },
  borders: {
    rowRule: '#f3f4f6', // row hairlines, no grid
  },
  spacing: {
    sectionGap: '8mm', // tight sections
    pagePadding: '15mm', // harness geometry contract (all templates)
    bandWidth: '8px', // accent top band
    radius: '0px',
  },
  header: {
    style: 'banner', // full-width primary band, white text
    titleLabel: 'INVOICE',
  },
  footer: {
    style: 'detailed', // mono small print, accent left rule
  },
  table: {
    headerText: '#6b7280', // mono uppercase 10px gray, no borders
  },
  totals: {
    rule: '#2563eb', // grand total 4px accent top rule
  },
}
