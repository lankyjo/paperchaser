import type { TemplateTokens } from '../tokens'

// Noir Ledger: charcoal page, gold hairlines and small-caps labels.
export const noirLedgerTokens: TemplateTokens = {
  palette: {
    ink: '#e9e6df',
    primary: '#c9a961',
    accent: '#c9a961',
    border: '#2b2b2b',
    fill: '#151515',
    muted: '#8b8676',
  },
  fonts: {
    headingFontId: 'geist',
    bodyFontId: 'geist',
    titleSize: '40px',
    titleWeight: 300,
    labelFontId: 'geist',
    labelLetterspacing: '0.18em',
    labelColor: '#8b8676',
  },
  borders: {
    rowRule: '#242424',
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
    headerText: '#8b8676',
  },
  totals: {
    rule: '#c9a961',
  },
}
