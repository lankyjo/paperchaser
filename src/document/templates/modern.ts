import type { TemplateTokens } from '../tokens'

// Modern template tokens: clean sans, 4mm primary top band, flat table with primary-colored header.
export const modernTokens: TemplateTokens = {
  palette: {
    ink: '#111827',
    primary: '#1d4ed8', // default primary
    accent: null, // accent falls back to primary
    border: '#e2e8f0',
    fill: '#f8fafc',
    muted: '#6b7280', // gray blurb
  },
  fonts: {
    headingFontId: 'geist',
    bodyFontId: 'geist',
    titleSize: '24px',
    titleWeight: 600,
    labelFontId: 'geist',
    labelLetterspacing: '0em',
  },
  borders: {
    rowRule: '#e2e8f0', // 1px table borders
  },
  spacing: {
    sectionGap: '10mm',
    pagePadding: '15mm', // harness geometry contract (all templates)
    bandWidth: '4mm', // primary top band
    radius: '4px', // totals panel rounded 4px
  },
  header: {
    style: 'banner', // full-width primary band
    titleLabel: 'INVOICE',
  },
  footer: {
    style: 'standard', // thin rule, gray blurb
  },
  table: {
    headerText: '#1d4ed8', // primary 600 text on #f8fafc fill
  },
  totals: {
    rule: '#1d4ed8', // grand total bold with primary top border
  },
}
