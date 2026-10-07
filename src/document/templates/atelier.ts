import type { TemplateTokens } from '../tokens'

// Atelier: warm paper, serif type, quiet sans labels.
export const atelierTokens: TemplateTokens = {
  palette: {
    ink: '#1b1b1b',
    primary: '#1b1b1b',
    accent: '#8d877e',
    border: '#e3dfd8',
    fill: '#fdfcfa',
    muted: '#6f6a62',
  },
  fonts: {
    headingFontId: 'instrument-serif',
    bodyFontId: 'instrument-serif',
    titleSize: '15px',
    titleWeight: 400,
    bodySize: '13px',
    labelFontId: 'geist',
    labelLetterspacing: '0.16em',
    labelColor: '#a39e95',
  },
  borders: {
    rowRule: '#efece6',
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
    headerText: '#a39e95',
  },
  totals: {
    rule: '#1b1b1b',
  },
}
