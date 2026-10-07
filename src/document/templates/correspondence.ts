import type { TemplateTokens } from '../tokens'

// Correspondence: a business letter on cream paper with a dotted-leader ledger.
export const correspondenceTokens: TemplateTokens = {
  palette: {
    ink: '#26231f',
    primary: '#26231f',
    accent: '#9a6b3c',
    border: '#d6cfc3',
    fill: '#f7f4ee',
    muted: '#6d665c',
  },
  fonts: {
    headingFontId: 'instrument-serif',
    bodyFontId: 'instrument-serif',
    titleSize: '30px',
    titleWeight: 400,
    bodySize: '14px',
    labelFontId: 'geist-mono',
    labelLetterspacing: '0.02em',
    labelColor: '#6d665c',
  },
  borders: {
    rowRule: 'transparent',
  },
  spacing: {
    sectionGap: '9mm',
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
    headerText: '#6d665c',
  },
  totals: {
    rule: '#26231f',
  },
}
