import type { TemplateTokens } from '../tokens'

// Agency template tokens: bold, mono uppercase labels, banner header, 8px accent top band, tight sections.
export const agencyTokens: TemplateTokens = {
  palette: {
    ink: '#0a0a0a',
    primary: '#2563eb', // default primary
    accent: null, // accent falls back to primary
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
