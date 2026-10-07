import type { TemplateTokens } from '../tokens'

// Swiss: oversized black type, heavy rules, one red accent.
export const swissTokens: TemplateTokens = {
  palette: {
    ink: '#0d0d0d',
    primary: '#0d0d0d',
    accent: '#e5322d',
    border: '#dedede',
    fill: '#ffffff',
    muted: '#666666',
  },
  fonts: {
    headingFontId: 'geist',
    bodyFontId: 'geist',
    titleSize: '110px',
    titleWeight: 800,
    labelFontId: 'geist',
    labelLetterspacing: '0.04em',
  },
  borders: {
    rowRule: '#dedede',
  },
  spacing: {
    sectionGap: '10mm',
    pagePadding: '15mm',
    radius: '0px',
  },
  header: {
    style: 'standard',
    titleLabel: 'INVOICE',
  },
  footer: {
    style: 'minimal',
  },
  table: {
    headerText: '#0d0d0d',
  },
  totals: {
    rule: '#0d0d0d',
  },
}
